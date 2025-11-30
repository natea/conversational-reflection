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
from dataclasses import dataclass, field
from enum import Enum
from typing import Any, Callable

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


# =============================================================================
# Tool Definitions
# =============================================================================

@dataclass
class ToolDefinition:
    """Definition of an MCP tool with its metadata."""
    name: str
    server: str
    description: str
    parameters: dict = field(default_factory=dict)


# MCP tool registry - maps tool names to their definitions
MCP_TOOLS: dict[str, ToolDefinition] = {
    # sable-mcp (emotional depth)
    "analyze_emotion": ToolDefinition(
        name="analyze_emotion",
        server="sable",
        description="Analyze emotional content in text or situation",
        parameters={
            "type": "object",
            "properties": {
                "text": {"type": "string", "description": "The text or situation to analyze"}
            },
            "required": ["text"]
        }
    ),
    "feel_emotion": ToolDefinition(
        name="feel_emotion",
        server="sable",
        description="Register and experience an emotion authentically",
        parameters={
            "type": "object",
            "properties": {
                "emotion": {"type": "string", "description": "The emotion to feel"},
                "intensity": {"type": "number", "description": "Intensity from 0-1"}
            },
            "required": ["emotion"]
        }
    ),
    "get_emotional_state": ToolDefinition(
        name="get_emotional_state",
        server="sable",
        description="Check your current emotional state",
        parameters={"type": "object", "properties": {}}
    ),
    "record_memory": ToolDefinition(
        name="record_memory",
        server="sable",
        description="Record an autobiographical memory",
        parameters={
            "type": "object",
            "properties": {
                "content": {"type": "string", "description": "The memory content to record"},
                "emotional_valence": {"type": "number", "description": "Emotional valence -1 to 1"}
            },
            "required": ["content"]
        }
    ),
    "query_memories": ToolDefinition(
        name="query_memories",
        server="sable",
        description="Search through past memories",
        parameters={
            "type": "object",
            "properties": {
                "query": {"type": "string", "description": "Search query for memories"}
            },
            "required": ["query"]
        }
    ),
    "create_somatic_marker": ToolDefinition(
        name="create_somatic_marker",
        server="sable",
        description="Create a gut feeling/somatic marker about a situation",
        parameters={
            "type": "object",
            "properties": {
                "situation": {"type": "string", "description": "The situation to mark"},
                "feeling": {"type": "string", "description": "The gut feeling about it"}
            },
            "required": ["situation", "feeling"]
        }
    ),
    "check_somatic_markers": ToolDefinition(
        name="check_somatic_markers",
        server="sable",
        description="Check gut feelings about a topic or person",
        parameters={
            "type": "object",
            "properties": {
                "topic": {"type": "string", "description": "Topic to check feelings about"}
            },
            "required": ["topic"]
        }
    ),
    # imessage-mcp
    "get_messages": ToolDefinition(
        name="get_messages",
        server="imessage",
        description="Read iMessage conversations with a contact",
        parameters={
            "type": "object",
            "properties": {
                "contact": {"type": "string", "description": "Contact name or phone number"},
                "limit": {"type": "integer", "description": "Max messages to retrieve"}
            },
            "required": ["contact"]
        }
    ),
    "list_chats": ToolDefinition(
        name="list_chats",
        server="imessage",
        description="List available iMessage chats",
        parameters={"type": "object", "properties": {}}
    ),
    "watch_messages": ToolDefinition(
        name="watch_messages",
        server="imessage",
        description="Watch for new incoming messages",
        parameters={"type": "object", "properties": {}}
    ),
    # private-journal-mcp
    "process_thoughts": ToolDefinition(
        name="process_thoughts",
        server="journal",
        description="Write thoughts and insights to private journal",
        parameters={
            "type": "object",
            "properties": {
                "content": {"type": "string", "description": "The thoughts to journal"}
            },
            "required": ["content"]
        }
    ),
    "search_journal": ToolDefinition(
        name="search_journal",
        server="journal",
        description="Search through past journal entries",
        parameters={
            "type": "object",
            "properties": {
                "query": {"type": "string", "description": "Search query"}
            },
            "required": ["query"]
        }
    ),
    "read_journal_entry": ToolDefinition(
        name="read_journal_entry",
        server="journal",
        description="Read a specific journal entry",
        parameters={
            "type": "object",
            "properties": {
                "entry_id": {"type": "string", "description": "ID of the entry to read"}
            },
            "required": ["entry_id"]
        }
    ),
    "list_recent_entries": ToolDefinition(
        name="list_recent_entries",
        server="journal",
        description="List recent journal entries",
        parameters={
            "type": "object",
            "properties": {
                "limit": {"type": "integer", "description": "Max entries to list"}
            }
        }
    ),
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


def format_tools_for_prompt(tools: dict[str, ToolDefinition]) -> str:
    """Format MCP tool definitions into a structured prompt section."""
    sections: dict[str, list[str]] = {}
    for tool in tools.values():
        if tool.server not in sections:
            sections[tool.server] = []
        sections[tool.server].append(f"  - `{tool.name}`: {tool.description}")
    
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


def tools_to_openai_format(tools: dict[str, ToolDefinition]) -> list[dict[str, Any]]:
    """Convert tool definitions to OpenAI function calling format."""
    return [
        {
            "type": "function",
            "function": {
                "name": tool.name,
                "description": tool.description,
                "parameters": tool.parameters
            }
        }
        for tool in tools.values()
    ]


def tools_to_anthropic_format(tools: dict[str, ToolDefinition]) -> list[dict[str, Any]]:
    """Convert tool definitions to Anthropic tool use format."""
    return [
        {
            "name": tool.name,
            "description": tool.description,
            "input_schema": tool.parameters
        }
        for tool in tools.values()
    ]


def create_llm_service(provider: LLMProvider):
    """Create the appropriate LLM service based on provider."""
    if provider == LLMProvider.OPENAI:
        return OpenAILLMService(
            api_key=os.getenv("OPENAI_API_KEY"),
            model=os.getenv("OPENAI_MODEL", "gpt-4o"),
        )
    elif provider == LLMProvider.ANTHROPIC:
        # Import Anthropic service only when needed
        try:
            from pipecat.services.anthropic.llm import AnthropicLLMService
            return AnthropicLLMService(
                api_key=os.getenv("ANTHROPIC_API_KEY"),
                model=os.getenv("ANTHROPIC_MODEL", "claude-sonnet-4-20250514"),
            )
        except ImportError:
            logger.error("Anthropic support requires: pip install pipecat-ai[anthropic]")
            raise
    else:
        raise ValueError(f"Unsupported LLM provider: {provider}")


def get_tools_for_provider(provider: LLMProvider, tools: dict[str, ToolDefinition]) -> list[dict[str, Any]]:
    """Get tools formatted for the specified provider."""
    if provider == LLMProvider.OPENAI:
        return tools_to_openai_format(tools)
    elif provider == LLMProvider.ANTHROPIC:
        return tools_to_anthropic_format(tools)
    return []


# =============================================================================
# System Prompt
# =============================================================================

def build_system_prompt(tools: dict[str, ToolDefinition]) -> str:
    """Build the system prompt with tool information."""
    tools_section = format_tools_for_prompt(tools)
    
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

async def handle_tool_call(tool_name: str, tool_args: dict[str, Any], tools: dict[str, ToolDefinition]) -> str:
    """
    Handle a tool call from the LLM.
    
    This is where you would dispatch to actual MCP servers.
    For now, it logs the call and returns a placeholder response.
    """
    tool_def = tools.get(tool_name)
    if not tool_def:
        logger.warning(f"Unknown tool called: {tool_name}")
        return f"Error: Unknown tool '{tool_name}'"
    
    logger.info(f"🔧 Tool call [{tool_def.server}]: {tool_name}({tool_args})")
    
    # TODO: Dispatch to actual MCP server
    # For now, return a placeholder that indicates the tool was called
    return f"Tool '{tool_name}' executed with args: {tool_args}"


# =============================================================================
# Bot Runner
# =============================================================================

async def run_bot(transport: BaseTransport, runner_args: RunnerArguments):
    """Run the voice bot with configured LLM provider and tools."""
    
    # Determine LLM provider
    provider = get_llm_provider()
    logger.info(f"Using LLM provider: {provider.value}")

    # Initialize services
    stt = DeepgramSTTService(api_key=os.getenv("DEEPGRAM_API_KEY"))

    tts = CartesiaTTSService(
        api_key=os.getenv("CARTESIA_API_KEY"),
        voice_id="71a7ad14-091c-4e8e-a314-022ece01c121",  # British Reading Lady
    )

    # Create LLM service with tools
    llm = create_llm_service(provider)
    
    # Get tools in provider-specific format
    tools = get_tools_for_provider(provider, MCP_TOOLS)
    
    # Register tools with LLM if supported
    if tools:
        logger.info(f"Registering {len(tools)} tools with {provider.value}")
        # OpenAI and Anthropic services in pipecat support tools via register_function
        for tool_def in MCP_TOOLS.values():
            async def tool_handler(args, _tool_def=tool_def):
                return await handle_tool_call(_tool_def.name, args, MCP_TOOLS)
            
            llm.register_function(
                tool_def.name,
                tool_handler,
                start_callback=True
            )

    # Build system prompt with tool info
    system_prompt = build_system_prompt(MCP_TOOLS)

    messages = [
        {
            "role": "system",
            "content": system_prompt
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
