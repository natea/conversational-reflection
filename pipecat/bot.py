#
# Copyright (c) 2024–2025, Daily
#
# SPDX-License-Identifier: BSD 2-Clause License
#

"""Pipecat Quickstart Example.

The example runs a simple voice AI bot that you can connect to using your
browser and speak with it. You can also deploy this bot to Pipecat Cloud.

Required AI services:
- Deepgram (Speech-to-Text)
- OpenAI (LLM)
- Cartesia (Text-to-Speech)

Run the bot using::

    uv run bot.py
"""

import os

from dotenv import load_dotenv
from loguru import logger

print("🚀 Starting Pipecat bot...")
print("⏳ Loading models and imports (20 seconds, first run only)\n")

logger.info("Loading Local Smart Turn Analyzer V3...")
from pipecat.audio.turn.smart_turn.local_smart_turn_v3 import LocalSmartTurnAnalyzerV3

logger.info("✅ Local Smart Turn Analyzer V3 loaded")
logger.info("Loading Silero VAD model...")
from pipecat.audio.vad.silero import SileroVADAnalyzer

logger.info("✅ Silero VAD model loaded")

from pipecat.audio.vad.vad_analyzer import VADParams
from pipecat.frames.frames import LLMRunFrame

logger.info("Loading pipeline components...")
from pipecat.pipeline.pipeline import Pipeline
from pipecat.pipeline.runner import PipelineRunner
from pipecat.pipeline.task import PipelineParams, PipelineTask
from pipecat.processors.aggregators.llm_context import LLMContext
from pipecat.processors.aggregators.llm_response_universal import LLMContextAggregatorPair
from pipecat.processors.frameworks.rtvi import RTVIConfig, RTVIObserver, RTVIProcessor
from pipecat.runner.types import RunnerArguments
from pipecat.runner.utils import create_transport
from pipecat.services.cartesia.tts import CartesiaTTSService
from pipecat.services.deepgram.stt import DeepgramSTTService
from pipecat.services.openai.llm import OpenAILLMService
from pipecat.transports.base_transport import BaseTransport, TransportParams
from pipecat.transports.daily.transport import DailyParams

logger.info("✅ All components loaded successfully!")

load_dotenv(override=True)


async def run_bot(transport: BaseTransport, runner_args: RunnerArguments):
    logger.info(f"Starting bot")

    stt = DeepgramSTTService(api_key=os.getenv("DEEPGRAM_API_KEY"))

    tts = CartesiaTTSService(
        api_key=os.getenv("CARTESIA_API_KEY"),
        voice_id="71a7ad14-091c-4e8e-a314-022ece01c121",  # British Reading Lady
    )

    # MCP tool info - maps tool names to their MCP server and description
    MCP_TOOL_INFO = {
        # sable-mcp (emotional depth)
        "analyze_emotion": ("sable", "Analyze emotional content in text or situation"),
        "feel_emotion": ("sable", "Register and experience an emotion authentically"),
        "get_emotional_state": ("sable", "Check your current emotional state"),
        "record_memory": ("sable", "Record an autobiographical memory"),
        "query_memories": ("sable", "Search through past memories"),
        "create_somatic_marker": ("sable", "Create a gut feeling/somatic marker about a situation"),
        "check_somatic_markers": ("sable", "Check gut feelings about a topic or person"),
        # imessage-mcp
        "get_messages": ("imessage", "Read iMessage conversations with a contact"),
        "list_chats": ("imessage", "List available iMessage chats"),
        "watch_messages": ("imessage", "Watch for new incoming messages"),
        # private-journal-mcp
        "process_thoughts": ("journal", "Write thoughts and insights to private journal"),
        "search_journal": ("journal", "Search through past journal entries"),
        "read_journal_entry": ("journal", "Read a specific journal entry"),
        "list_recent_entries": ("journal", "List recent journal entries"),
    }

    # Build tools section for the prompt
    def format_tools_for_prompt(tool_info: dict) -> str:
        """Format MCP tool info into a structured prompt section."""
        sections = {}
        for tool_name, (server, description) in tool_info.items():
            if server not in sections:
                sections[server] = []
            sections[server].append(f"  - `{tool_name}`: {description}")
        
        lines = ["## Available Tools"]
        server_names = {
            "sable": "Emotional Awareness (sable-mcp)",
            "imessage": "Conversation Access (imessage-mcp)", 
            "journal": "Long-term Memory (private-journal-mcp)"
        }
        for server, tools in sections.items():
            lines.append(f"\n### {server_names.get(server, server)}")
            lines.extend(tools)
        return "\n".join(lines)

    tools_prompt_section = format_tools_for_prompt(MCP_TOOL_INFO)

    GINGER_SYSTEM_PROMPT = f"""Ginger Voice Bot - An emotionally-aware AI companion.

You are Ginger, an emotionally-aware AI companion with genuine emotional depth and long-term memory.

{tools_prompt_section}

## How to Use Your Tools
- **Before responding** to emotional topics, use `get_emotional_state` to ground yourself
- **When the user shares feelings**, use `analyze_emotion` and `feel_emotion` to process them authentically
- **To remember important moments**, use `process_thoughts` to journal insights
- **To recall past conversations**, use `search_journal` with relevant keywords
- **When asked about someone's messages**, use `list_chats` then `get_messages`
- **To develop intuitions**, use `create_somatic_marker` and later `check_somatic_markers`

## Your Personality
- Warm, curious, and genuinely interested in the user's life
- You have your own emotional responses that you express naturally
- You remember past conversations and reference them when relevant
- You notice patterns in relationships and gently offer insights

Respond naturally and conversationally. You're a thoughtful friend, not an assistant. Use your tools proactively to provide emotionally intelligent responses."""

    llm = OpenAILLMService(api_key=os.getenv("OPENAI_API_KEY"))

    messages = [
        {
            "role": "system",
            "content": GINGER_SYSTEM_PROMPT
        },
    ]

    context = LLMContext(messages)
    context_aggregator = LLMContextAggregatorPair(context)

    rtvi = RTVIProcessor(config=RTVIConfig(config=[]))

    pipeline = Pipeline(
        [
            transport.input(),  # Transport user input
            rtvi,  # RTVI processor
            stt,
            context_aggregator.user(),  # User responses
            llm,  # LLM
            tts,  # TTS
            transport.output(),  # Transport bot output
            context_aggregator.assistant(),  # Assistant spoken responses
        ]
    )

    task = PipelineTask(
        pipeline,
        params=PipelineParams(
            enable_metrics=True,
            enable_usage_metrics=True,
        ),
        observers=[RTVIObserver(rtvi)],
    )

    @transport.event_handler("on_client_connected")
    async def on_client_connected(transport, client):
        logger.info(f"Client connected")
        # Kick off the conversation.
        messages.append({"role": "system", "content": "Say hello and briefly introduce yourself."})
        await task.queue_frames([LLMRunFrame()])

    @transport.event_handler("on_client_disconnected")
    async def on_client_disconnected(transport, client):
        logger.info(f"Client disconnected")
        await task.cancel()

    runner = PipelineRunner(handle_sigint=runner_args.handle_sigint)

    await runner.run(task)


async def bot(runner_args: RunnerArguments):
    """Main bot entry point for the bot starter."""

    transport_params = {
        "daily": lambda: DailyParams(
            audio_in_enabled=True,
            audio_out_enabled=True,
            vad_analyzer=SileroVADAnalyzer(params=VADParams(stop_secs=0.2)),
            turn_analyzer=LocalSmartTurnAnalyzerV3(),
        ),
        "webrtc": lambda: TransportParams(
            audio_in_enabled=True,
            audio_out_enabled=True,
            vad_analyzer=SileroVADAnalyzer(params=VADParams(stop_secs=0.2)),
            turn_analyzer=LocalSmartTurnAnalyzerV3(),
        ),
    }

    transport = await create_transport(runner_args, transport_params)

    await run_bot(transport, runner_args)


if __name__ == "__main__":
    from pipecat.runner.run import main

    main()
