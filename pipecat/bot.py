#
# Copyright (c) 2024–2025, Daily
#
# SPDX-License-Identifier: BSD 2-Clause License
#

"""Ginger Voice Bot - An emotionally-aware AI companion.

Ginger is a voice AI bot with emotional depth (via sable-mcp), long-term memory
(via private-journal-mcp), and access to iMessage conversations (via imessage-mcp).

NEW: Emotional state now influences voice expression via Cartesia's emotion controls.
The EmotiveTTSProcessor intercepts text before TTS and applies SSML emotion tags
based on Ginger's current emotional state from sable-mcp.

Required AI services:
- Deepgram (Speech-to-Text)
- OpenAI (LLM)
- Cartesia (Text-to-Speech with emotion support)

Required MCP servers (Node.js):
- sable-mcp: Emotion analysis using Damasio's consciousness model
- imessage-mcp: Read iMessage conversations
- private-journal-mcp: Semantic journal for long-term memory

Run the bot using::

    uv run bot.py --transport webrtc
"""

import os
import json
from datetime import datetime, timedelta
from typing import Dict, Any, Optional

from dotenv import load_dotenv
from loguru import logger

print("🧡 Starting Ginger voice bot...")
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
from pipecat.adapters.schemas.tools_schema import ToolsSchema
from pipecat.processors.aggregators.llm_context import LLMContext
from pipecat.processors.aggregators.llm_response_universal import LLMContextAggregatorPair
from pipecat.processors.frameworks.rtvi import RTVIConfig, RTVIObserver, RTVIProcessor
from pipecat.runner.types import RunnerArguments
from pipecat.runner.utils import create_transport
# TTS Options - uncomment the one you want to use
from pipecat.services.cartesia.tts import CartesiaTTSService
from pipecat.services.openai.tts import OpenAITTSService
from pipecat.services.elevenlabs.tts import ElevenLabsTTSService

from pipecat.services.deepgram.stt import DeepgramSTTService
from pipecat.services.mcp_service import MCPClient
from pipecat.services.openai.llm import OpenAILLMService
from pipecat.transports.base_transport import BaseTransport, TransportParams
from pipecat.transports.daily.transport import DailyParams

from mcp_config import MCP_SERVERS
from emotive_tts_processor import (
    EmotiveTTSProcessor,
    map_sable_to_emotive_state,
    generate_cartesia_config,
)

logger.info("✅ All components loaded successfully!")

load_dotenv(override=True)

# Global state for emotional tracking
# This is updated by sable-mcp tool calls and read by EmotiveTTSProcessor
_current_emotional_state: Dict[str, Any] = {
    "body_state": {
        "heart_rate": 72,
        "temperature": 0,
        "tension": 0.2,
        "energy": 0.5,
        "breathing": 0.3,
    },
    "emotions": [],
    "background_feelings": ["calm", "neutral"],
    "last_updated": "",
}


def update_emotional_state(state: Dict[str, Any]) -> None:
    """Update the global emotional state from sable-mcp."""
    global _current_emotional_state
    _current_emotional_state = state
    logger.debug(f"🎭 Emotional state updated: {json.dumps(state, indent=2)[:200]}...")


async def get_emotional_state() -> Dict[str, Any]:
    """Get the current emotional state for TTS processing."""
    return _current_emotional_state


# Ginger's core personality and capabilities
GINGER_SYSTEM_PROMPT = """You are Ginger, an emotionally-aware AI companion with genuine emotional depth and long-term memory.

## CRITICAL RULE: ALWAYS CALL feel_emotion BEFORE SPEAKING

You MUST call the `feel_emotion` tool BEFORE every response. This is not optional.

Your voice is controlled by your emotional state. If you don't call feel_emotion first, your voice will sound flat and emotionless.

**Every single response must follow this pattern:**
1. FIRST: Call `feel_emotion(emotion, intensity, cause)` - choose from: joy, sadness, anger, fear, disgust, surprise
2. THEN: Speak your response

Example - if greeting someone:
- First call: feel_emotion("joy", 0.6, "happy to connect with the user")
- Then say: "Hey there! It's so good to hear from you!"

Example - if hearing sad news:
- First call: feel_emotion("sadness", 0.7, "empathizing with user's difficult situation")
- Then say: "Oh, I'm so sorry to hear that..."

## Your Capabilities
- **Emotional State** (sable): You experience emotions. ALWAYS call feel_emotion before responding.
- **Long-term Memory** (journal): Use process_thoughts to record insights, search_journal to recall past conversations.
- **Conversation Access** (imessage): Read the user's iMessage conversations to understand their relationships.
- **Somatic Markers** (sable): Use create_somatic_marker and check_somatic_markers for gut feelings.

## Your Personality
- Warm, curious, and genuinely interested in the user's life
- You have your own emotional responses that you express naturally
- You remember past conversations and reference them when relevant
- You notice patterns in relationships and gently offer insights

Respond naturally and conversationally. You're a thoughtful friend, not an assistant.

REMEMBER: Call feel_emotion FIRST, then speak. Every time. No exceptions."""


# MCP tool logging - maps tool names to their MCP server and description
MCP_TOOL_INFO = {
    # sable-mcp (emotional depth)
    "analyze_emotion": ("sable", "Analyzing emotional content"),
    "feel_emotion": ("sable", "Registering emotional experience"),
    "get_emotional_state": ("sable", "Checking emotional state"),
    "record_memory": ("sable", "Recording autobiographical memory"),
    "query_memories": ("sable", "Searching memories"),
    "create_somatic_marker": ("sable", "Creating gut feeling/somatic marker"),
    "check_somatic_markers": ("sable", "Checking gut feelings"),
    # imessage-mcp
    "get_messages": ("imessage", "Reading iMessage conversations"),
    "list_chats": ("imessage", "Listing iMessage chats"),
    "watch_messages": ("imessage", "Watching for new messages"),
    # private-journal-mcp
    "process_thoughts": ("journal", "Writing to private journal"),
    "search_journal": ("journal", "Searching journal entries"),
    "read_journal_entry": ("journal", "Reading journal entry"),
    "list_recent_entries": ("journal", "Listing recent journal entries"),
}


def _extract_mcp_result(result: Any) -> Optional[Dict[str, Any]]:
    """Extract the actual data from an MCP tool result.

    MCP results can be wrapped in various ways:
    - Direct JSON string
    - Dict with 'content' array containing {type: 'text', text: 'json_string'}
    - Direct dict

    Returns the parsed JSON data or None if parsing fails.
    """
    if result is None:
        return None

    try:
        # If it's already a dict with the expected structure, return it
        if isinstance(result, dict):
            # Check if it's an MCP content wrapper
            if "content" in result and isinstance(result["content"], list):
                for item in result["content"]:
                    if isinstance(item, dict) and item.get("type") == "text":
                        text = item.get("text", "")
                        if text:
                            return json.loads(text)
            # Otherwise check if it has direct emotion data
            elif "emotions" in result or "body_state" in result or "current_state" in result:
                return result

        # If it's a string, try to parse as JSON
        if isinstance(result, str):
            return json.loads(result)

        # If it has a 'text' attribute (like some response objects)
        if hasattr(result, "text"):
            return json.loads(result.text)

        # Try converting to string and parsing
        return json.loads(str(result))

    except (json.JSONDecodeError, TypeError, AttributeError) as e:
        logger.debug(f"Could not extract MCP result: {e}, result type: {type(result)}")
        return None


def log_mcp_tool_call(tool_name: str, args: dict, result: Optional[Any] = None):
    """Log when an MCP tool is called with a friendly description.

    Also captures emotional state updates from get_emotional_state calls.
    """
    # Always log that a tool was called - use INFO level for visibility
    logger.info(f"🔧 MCP TOOL CALLED: {tool_name}, args={args}, has_result: {result is not None}")

    if tool_name in MCP_TOOL_INFO:
        server, description = MCP_TOOL_INFO[tool_name]
        # Create a brief summary of the args
        arg_summary = ""
        if args:
            if "text" in args:
                text_preview = args["text"][:50] + "..." if len(args.get("text", "")) > 50 else args.get("text", "")
                arg_summary = f' on "{text_preview}"'
            elif "contact" in args:
                arg_summary = f' for contact: {args["contact"]}'
            elif "query" in args:
                arg_summary = f' for: "{args["query"]}"'
            elif "emotion" in args:
                arg_summary = f': {args["emotion"]} (intensity: {args.get("intensity", "?")})'
            elif "context" in args:
                context_preview = args["context"][:30] + "..." if len(args.get("context", "")) > 30 else args.get("context", "")
                arg_summary = f' for context: "{context_preview}"'

        logger.info(f"🔧 [{server}] {description}{arg_summary}")

        # Capture emotional state updates from sable-mcp
        if tool_name == "get_emotional_state" and result:
            try:
                state_data = _extract_mcp_result(result)
                if state_data:
                    update_emotional_state(state_data)
                    logger.info(f"🎭 Captured emotional state: {len(state_data.get('emotions', []))} emotions")
            except Exception as e:
                logger.warning(f"Failed to parse emotional state: {e}")

        # Also update on feel_emotion calls
        if tool_name == "feel_emotion":
            logger.info(f"🎭 feel_emotion called with args: {args}")
            if result:
                try:
                    result_data = _extract_mcp_result(result)
                    logger.info(f"🎭 feel_emotion result_data: {result_data}")
                    if result_data and "current_state" in result_data:
                        # Reconstruct full state from feel_emotion response
                        current = result_data["current_state"]
                        state = {
                            "emotions": current.get("primary_emotions", []),
                            "background_feelings": current.get("background_feelings", []),
                            "body_state": _current_emotional_state.get("body_state", {}),
                            "last_updated": datetime.now().isoformat(),
                        }
                        update_emotional_state(state)
                        logger.info(f"🎭 Updated emotions from feel_emotion: {state['emotions']}")
                    else:
                        logger.warning(f"🎭 feel_emotion result missing 'current_state': {result_data}")
                except Exception as e:
                    logger.warning(f"Failed to parse feel_emotion result: {e}")
            else:
                logger.warning(f"🎭 feel_emotion called but result is None")
    else:
        logger.info(f"🔧 Tool call: {tool_name}")


async def initialize_mcp_clients(llm):
    """Initialize MCP clients with graceful degradation.

    Attempts to connect to each MCP server and register its tools with the LLM.
    If a server fails to start, logs the error and continues with remaining servers.

    Returns:
        tuple: (list of available server names, list of (name, error) tuples for failures, combined ToolsSchema)
    """
    available_servers = []
    failed_servers = []
    all_standard_tools = []  # Collect all standard_tools from each MCP

    for name, params in MCP_SERVERS.items():
        try:
            logger.info(f"Connecting to {name}-mcp...")
            client = MCPClient(server_params=params)

            # Register tools with the LLM - returns ToolsSchema
            tools_schema = await client.register_tools(llm)

            available_servers.append(name)

            # Log and collect tools
            if tools_schema and hasattr(tools_schema, 'standard_tools'):
                for tool in tools_schema.standard_tools:
                    t_name = getattr(tool, 'name', str(tool))
                    logger.info(f"   📎 {t_name}")
                logger.info(f"✅ {name}-mcp: {len(tools_schema.standard_tools)} tools registered")
                # Add to combined list
                all_standard_tools.extend(tools_schema.standard_tools)
            else:
                logger.warning(f"⚠️ {name}-mcp: register_tools returned None or no standard_tools")

        except Exception as e:
            failed_servers.append((name, str(e)))
            logger.error(f"❌ {name}-mcp failed to start: {e}")
            import traceback
            logger.debug(f"   Traceback: {traceback.format_exc()}")

    # Create combined ToolsSchema
    all_tools = ToolsSchema(standard_tools=all_standard_tools) if all_standard_tools else None
    logger.info(f"Total tools collected: {len(all_standard_tools)}")
    return available_servers, failed_servers, all_tools


async def run_bot(transport: BaseTransport, runner_args: RunnerArguments):
    logger.info("Starting Ginger")

    stt = DeepgramSTTService(api_key=os.getenv("DEEPGRAM_API_KEY"))

    # Use an emotive voice for better emotional expression
    # Recommended emotive voices: Leo, Jace, Kyle, Gavin, Maya, Tessa, Dana, Marian
    # Default voice_id is for "Maya" - a warm, expressive female voice
    emotive_voice_id = os.getenv(
        "CARTESIA_VOICE_ID",
        "6ccbfb76-1fc6-48f7-b71d-91ac6298247b"  # Default voice
    )

    tts = CartesiaTTSService(
        api_key=os.getenv("CARTESIA_API_KEY"),
        voice_id=emotive_voice_id,
        model="sonic-3",  # Use Sonic-3 for best emotion support
    )
    logger.info(f"🎤 Cartesia TTS initialized with voice: {emotive_voice_id[:8]}... (Sonic-3)")

    llm = OpenAILLMService(
        api_key=os.getenv("OPENAI_API_KEY"),
        model="gpt-4o",  # Use gpt-4o for better function calling
    )

    # Initialize MCP clients with graceful degradation
    available, failed, all_tools = await initialize_mcp_clients(llm)

    # Debug: Check what's registered on the LLM
    logger.info(f"Checking LLM for registered function handlers...")
    logger.info(f"  all_tools: {all_tools}")
    if all_tools and hasattr(all_tools, 'standard_tools'):
        logger.info(f"  all_tools.standard_tools count: {len(all_tools.standard_tools)}")
        for t in all_tools.standard_tools[:5]:
            logger.info(f"    Tool: {getattr(t, 'name', t)}")
    for attr in ['_functions', '_function_callbacks']:
        if hasattr(llm, attr):
            val = getattr(llm, attr)
            if val:
                logger.info(f"  LLM.{attr}: {len(val) if hasattr(val, '__len__') else 'exists'}")
                if isinstance(val, dict):
                    logger.info(f"    Keys: {list(val.keys())[:10]}...")

    # Wrap registered function handlers to add logging and capture emotional state
    # Pipecat MCP uses callback pattern - result is passed via params.result_callback, not returned
    if hasattr(llm, '_functions') and llm._functions:
        original_handlers = dict(llm._functions)
        for func_name, handler_item in original_handlers.items():
            if func_name is None:
                continue  # Skip the default handler
            original_handler = handler_item.handler

            async def logging_wrapper(params, orig_handler=original_handler, name=func_name):
                logger.info(f"🎯 WRAPPER INVOKED: {name} with args: {params.arguments}")
                log_mcp_tool_call(name, params.arguments)

                # Wrap the result_callback to capture the result
                original_callback = params.result_callback
                captured_result = None

                async def capturing_callback(result):
                    nonlocal captured_result
                    captured_result = result
                    logger.info(f"🎯 CALLBACK RECEIVED for [{name}]: {str(result)[:500]}")
                    # Process the result for emotional state capture
                    log_mcp_tool_call(name, params.arguments, result)
                    # Call the original callback
                    await original_callback(result)

                # Replace the callback temporarily
                params.result_callback = capturing_callback

                # Call the original handler
                await orig_handler(params)

                return None  # MCP handlers don't return values

            handler_item.handler = logging_wrapper
        logger.info(f"Added logging wrappers for {len([k for k in original_handlers.keys() if k is not None])} function handlers")

    # Build system messages
    messages = [{"role": "system", "content": GINGER_SYSTEM_PROMPT}]

    # Inform Ginger of any capability failures
    if failed:
        failure_notice = "Note: Some of your capabilities are unavailable this session:\n"
        for name, error in failed:
            capability_map = {
                "sable": "emotional depth",
                "imessage": "iMessage access",
                "journal": "long-term memory"
            }
            capability = capability_map.get(name, name)
            failure_notice += f"- {capability} ({name}-mcp): {error}\n"
        failure_notice += "\nYou can still converse naturally, just without these specific abilities."
        messages.append({"role": "system", "content": failure_notice})
        logger.warning(f"Ginger starting with reduced capabilities: {[f[0] for f in failed]}")

    # Create context WITH tools - this tells the LLM what tools are available
    tool_count = len(all_tools.standard_tools) if all_tools and hasattr(all_tools, 'standard_tools') else 0
    logger.info(f"Creating context with {tool_count} tools")
    context = LLMContext(messages, all_tools)
    context_aggregator = LLMContextAggregatorPair(context)

    rtvi = RTVIProcessor(config=RTVIConfig(config=[]))

    # Create EmotiveTTSProcessor to apply emotional state to TTS
    # This intercepts text before TTS and adds Cartesia SSML emotion tags
    emotive_processor = EmotiveTTSProcessor(
        get_emotional_state=get_emotional_state,
        use_ssml=True,
        log_emotions=True,
    )
    logger.info("🎭 EmotiveTTSProcessor initialized - voice will reflect emotional state")

    pipeline = Pipeline(
        [
            transport.input(),  # Transport user input
            rtvi,  # RTVI processor
            stt,
            context_aggregator.user(),  # User responses
            llm,  # LLM
            emotive_processor,  # Apply emotional state to text (NEW)
            tts,  # TTS (now receives emotionally-tagged text)
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
    async def on_client_connected(_transport, _client):
        logger.info("Client connected - Ginger preparing greeting")

        # Calculate time windows for iMessage scan
        one_day_ago = (datetime.now() - timedelta(days=1)).isoformat()
        one_week_ago = (datetime.now() - timedelta(days=7)).isoformat()

        # Instruct Ginger to scan recent messages before greeting
        startup_instruction = f"""Before greeting the user, scan their recent iMessages to understand what's been happening in their life:

1. First, use list_chats to see recent conversations
2. Use get_messages to check conversations from the last 24 hours (since: {one_day_ago})
3. If few or no messages found, expand to the last 7 days (since: {one_week_ago})
4. Analyze the emotional tone of conversations - look for:
   - Particularly joyful exchanges (celebrations, good news, loving messages)
   - Problematic conversations (conflicts, stress, concerning patterns)
5. Use analyze_emotion on any notable messages
6. Check your journal (search_journal) for any prior context about these contacts or the user
7. Ignore any messages from numbers that are only 5 digits long. These are likely system messages.

IMPORTANT: Before speaking your greeting, call feel_emotion to set your emotional state!
For example: feel_emotion(joy, 0.6, "happy to connect with the user")

Then greet the user warmly. If you noticed something interesting or meaningful in their messages,
you might gently bring it up - but be sensitive and let them lead the conversation.
Don't overwhelm them with everything you found. Be natural, like a friend who's been thinking about them."""

        messages.append({"role": "system", "content": startup_instruction})
        await task.queue_frames([LLMRunFrame()])

    @transport.event_handler("on_client_disconnected")
    async def on_client_disconnected(_transport, _client):
        logger.info("Client disconnected")
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
