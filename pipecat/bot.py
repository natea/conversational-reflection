#
# Copyright (c) 2024–2025, Daily
#
# SPDX-License-Identifier: BSD 2-Clause License
#

"""Pipecat Voice Bot with MCP Tool Support.

An emotionally-aware AI companion that supports multiple LLM providers
(OpenAI, Anthropic) with unified tool calling capabilities.

Required AI services:
- Deepgram (Speech-to-Text)
- OpenAI or Anthropic (LLM)
- Cartesia (Text-to-Speech)

Run the bot using::

    uv run bot.py

Environment variables:
- LLM_PROVIDER: "openai" (default) or "anthropic"
- OPENAI_API_KEY: Required if using OpenAI
- ANTHROPIC_API_KEY: Required if using Anthropic
"""

import os
from enum import Enum
from typing import Any, List, cast

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

from pipecat.adapters.schemas.function_schema import FunctionSchema
from pipecat.adapters.schemas.tools_schema import ToolsSchema
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
from pipecat.services.llm_service import FunctionCallParams
from pipecat.services.openai.llm import OpenAILLMService
from pipecat.transports.base_transport import BaseTransport, TransportParams
from pipecat.transports.daily.transport import DailyParams

logger.info("✅ All components loaded successfully!")

load_dotenv(override=True)


# =============================================================================
# Tool Definitions using Pipecat's FunctionSchema
# =============================================================================

def create_mcp_tool_schemas() -> list[FunctionSchema]:
    """Create FunctionSchema definitions for all MCP tools."""
    return [
        # sable-mcp (emotional depth)
        FunctionSchema(
            name="analyze_emotion",
            description="Analyze emotional content in text or situation",
            properties={
                "text": {"type": "string", "description": "The text or situation to analyze"}
            },
            required=["text"]
        ),
        FunctionSchema(
            name="feel_emotion",
            description="Register and experience an emotion authentically",
            properties={
                "emotion": {"type": "string", "description": "The emotion to feel"},
                "intensity": {"type": "number", "description": "Intensity from 0-1"}
            },
            required=["emotion"]
        ),
        FunctionSchema(
            name="get_emotional_state",
            description="Check your current emotional state",
            properties={},
            required=[]
        ),
        FunctionSchema(
            name="record_memory",
            description="Record an autobiographical memory",
            properties={
                "content": {"type": "string", "description": "The memory content to record"},
                "emotional_valence": {"type": "number", "description": "Emotional valence -1 to 1"}
            },
            required=["content"]
        ),
        FunctionSchema(
            name="query_memories",
            description="Search through past memories",
            properties={
                "query": {"type": "string", "description": "Search query for memories"}
            },
            required=["query"]
        ),
        FunctionSchema(
            name="create_somatic_marker",
            description="Create a gut feeling/somatic marker about a situation",
            properties={
                "situation": {"type": "string", "description": "The situation to mark"},
                "feeling": {"type": "string", "description": "The gut feeling about it"}
            },
            required=["situation", "feeling"]
        ),
        FunctionSchema(
            name="check_somatic_markers",
            description="Check gut feelings about a topic or person",
            properties={
                "topic": {"type": "string", "description": "Topic to check feelings about"}
            },
            required=["topic"]
        ),
        # imessage-mcp
        FunctionSchema(
            name="get_messages",
            description="Read iMessage conversations with a contact",
            properties={
                "contact": {"type": "string", "description": "Contact name or phone number"},
                "limit": {"type": "integer", "description": "Max messages to retrieve"}
            },
            required=["contact"]
        ),
        FunctionSchema(
            name="list_chats",
            description="List available iMessage chats",
            properties={},
            required=[]
        ),
        FunctionSchema(
            name="watch_messages",
            description="Watch for new incoming messages",
            properties={},
            required=[]
        ),
        # private-journal-mcp
        FunctionSchema(
            name="process_thoughts",
            description="Write thoughts and insights to private journal",
            properties={
                "content": {"type": "string", "description": "The thoughts to journal"}
            },
            required=["content"]
        ),
        FunctionSchema(
            name="search_journal",
            description="Search through past journal entries",
            properties={
                "query": {"type": "string", "description": "Search query"}
            },
            required=["query"]
        ),
        FunctionSchema(
            name="read_journal_entry",
            description="Read a specific journal entry",
            properties={
                "entry_id": {"type": "string", "description": "ID of the entry to read"}
            },
            required=["entry_id"]
        ),
        FunctionSchema(
            name="list_recent_entries",
            description="List recent journal entries",
            properties={
                "limit": {"type": "integer", "description": "Max entries to list"}
            },
            required=[]
        ),
    ]


# Tool metadata for logging/prompt building
MCP_TOOL_INFO = {
    "analyze_emotion": ("sable", "Analyze emotional content in text or situation"),
    "feel_emotion": ("sable", "Register and experience an emotion authentically"),
    "get_emotional_state": ("sable", "Check your current emotional state"),
    "record_memory": ("sable", "Record an autobiographical memory"),
    "query_memories": ("sable", "Search through past memories"),
    "create_somatic_marker": ("sable", "Create a gut feeling/somatic marker about a situation"),
    "check_somatic_markers": ("sable", "Check gut feelings about a topic or person"),
    "get_messages": ("imessage", "Read iMessage conversations with a contact"),
    "list_chats": ("imessage", "List available iMessage chats"),
    "watch_messages": ("imessage", "Watch for new incoming messages"),
    "process_thoughts": ("journal", "Write thoughts and insights to private journal"),
    "search_journal": ("journal", "Search through past journal entries"),
    "read_journal_entry": ("journal", "Read a specific journal entry"),
    "list_recent_entries": ("journal", "List recent journal entries"),
}


# =============================================================================
# LLM Provider Abstraction
# =============================================================================

class LLMProvider(Enum):
    OPENAI = "openai"
    ANTHROPIC = "anthropic"


def get_llm_provider() -> LLMProvider:
    """Get the configured LLM provider from environment."""
    provider = os.getenv("LLM_PROVIDER", "openai").lower()
    if provider == "anthropic":
        return LLMProvider.ANTHROPIC
    return LLMProvider.OPENAI


def format_tools_for_prompt(tool_info: dict[str, tuple[str, str]]) -> str:
    """Format MCP tool info into a structured prompt section."""
    sections: dict[str, list[str]] = {}
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
    for server, tool_lines in sections.items():
        lines.append(f"\n### {server_names.get(server, server)}")
        lines.extend(tool_lines)
    return "\n".join(lines)


def create_llm_service(provider: LLMProvider):
    """Create the appropriate LLM service based on provider.
    
    Note: Both OpenAI and Anthropic require API keys for API access.
    Claude Pro/Max subscriptions are for claude.ai web interface only,
    not for the Anthropic API.
    """
    if provider == LLMProvider.OPENAI:
        api_key = os.getenv("OPENAI_API_KEY")
        if not api_key:
            raise ValueError("OPENAI_API_KEY environment variable is required")
        return OpenAILLMService(
            api_key=api_key,
            model=os.getenv("OPENAI_MODEL", "gpt-4o"),
        )
    elif provider == LLMProvider.ANTHROPIC:
        # Import Anthropic service only when needed
        try:
            from pipecat.services.anthropic.llm import AnthropicLLMService
        except ImportError:
            logger.error("Anthropic support requires: pip install pipecat-ai[anthropic]")
            raise
        
        api_key = os.getenv("ANTHROPIC_API_KEY")
        if not api_key:
            raise ValueError(
                "ANTHROPIC_API_KEY environment variable is required. "
                "Get your API key from https://console.anthropic.com/. "
                "Note: Claude Pro/Max subscriptions are for claude.ai only, "
                "not for API access."
            )
        return AnthropicLLMService(
            api_key=api_key,
            model=os.getenv("ANTHROPIC_MODEL", "claude-sonnet-4-20250514"),
        )
    else:
        raise ValueError(f"Unsupported LLM provider: {provider}")


# =============================================================================
# System Prompt
# =============================================================================

def build_system_prompt(tool_info: dict[str, tuple[str, str]]) -> str:
    """Build the system prompt with tool information."""
    tools_section = format_tools_for_prompt(tool_info)
    
    return f"""Ginger Voice Bot - An emotionally-aware AI companion.

You are Ginger, an emotionally-aware AI companion with genuine emotional depth and long-term memory.

{tools_section}

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


# =============================================================================
# Tool Call Handlers
# =============================================================================

async def handle_tool_call(params: FunctionCallParams):
    """
    Handle a tool call from the LLM using pipecat's FunctionCallParams.
    
    This is where you would dispatch to actual MCP servers.
    For now, it logs the call and returns a placeholder response.
    """
    tool_name = params.function_name
    tool_args = dict(params.arguments)
    
    tool_info = MCP_TOOL_INFO.get(tool_name)
    server = tool_info[0] if tool_info else "unknown"
    
    logger.info(f"🔧 Tool call [{server}]: {tool_name}({tool_args})")
    
    # TODO: Dispatch to actual MCP server
    # For now, return a placeholder that indicates the tool was called
    result = {"status": "success", "tool": tool_name, "args": tool_args}
    await params.result_callback(result)


# =============================================================================
# Bot Runner
# =============================================================================

async def run_bot(transport: BaseTransport, runner_args: RunnerArguments):
    """Run the voice bot with configured LLM provider and tools."""
    
    # Determine LLM provider
    provider = get_llm_provider()
    logger.info(f"Using LLM provider: {provider.value}")

    # Initialize services
    stt = DeepgramSTTService(api_key=os.getenv("DEEPGRAM_API_KEY", ""))

    tts = CartesiaTTSService(
        api_key=os.getenv("CARTESIA_API_KEY", ""),
        voice_id="71a7ad14-091c-4e8e-a314-022ece01c121",  # British Reading Lady
    )

    # Create LLM service
    llm = create_llm_service(provider)
    
    # Create tool schemas using pipecat's FunctionSchema
    tool_schemas = create_mcp_tool_schemas()
    
    # Register function handlers for each tool
    logger.info(f"Registering {len(tool_schemas)} tools with {provider.value}")
    for schema in tool_schemas:
        llm.register_function(schema.name, handle_tool_call)

    # Create ToolsSchema for the context
    tools = ToolsSchema(standard_tools=cast(List, tool_schemas))

    # Build system prompt with tool info
    system_prompt = build_system_prompt(MCP_TOOL_INFO)

    messages: List[dict] = [
        {
            "role": "system",
            "content": system_prompt
        },
    ]

    # Create context with tools
    context = LLMContext(cast(List, messages), tools)
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
