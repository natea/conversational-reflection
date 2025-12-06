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

import json
import os
from datetime import datetime, timedelta
from typing import Any, Dict, Optional

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
from pipecat.adapters.schemas.function_schema import FunctionSchema
from pipecat.adapters.schemas.tools_schema import ToolsSchema
from pipecat.pipeline.pipeline import Pipeline
from pipecat.pipeline.runner import PipelineRunner
from pipecat.pipeline.task import PipelineParams, PipelineTask
from pipecat.processors.aggregators.llm_context import LLMContext
from pipecat.processors.aggregators.llm_response_universal import LLMContextAggregatorPair
from pipecat.processors.frameworks.rtvi import RTVIConfig, RTVIObserver, RTVIProcessor
from pipecat.runner.types import RunnerArguments
from pipecat.runner.utils import create_transport

# TTS Options - uncomment the one you want to use
from pipecat.services.cartesia.tts import CartesiaTTSService
from pipecat.services.deepgram.stt import DeepgramSTTService
from pipecat.services.elevenlabs.tts import ElevenLabsTTSService
from pipecat.services.mcp_service import MCPClient
from pipecat.services.openai.llm import OpenAILLMService
from pipecat.services.openai.tts import OpenAITTSService
from pipecat.transports.base_transport import BaseTransport, TransportParams
from pipecat.transports.daily.transport import DailyParams

from emotive_tts_processor import (
    EmotiveTTSProcessor,
    generate_cartesia_config,
    map_sable_to_emotive_state,
)
from mcp_config import MCP_SERVERS

# =============================================================================
# WORKAROUND: Fix audio mute not working in SmallWebRTCTransport
# Bug: SmallWebRTCTrack.recv() only checks _enabled for video, not audio
# This monkey-patch fixes the issue until pipecat is updated
# See: https://github.com/pipecat-ai/pipecat/issues (report this bug)
# =============================================================================
def _patch_smallwebrtc_audio_mute():
    """Patch SmallWebRTCTrack.recv() to respect _enabled for audio tracks too."""
    try:
        from pipecat.transports.smallwebrtc.connection import SmallWebRTCTrack
        import asyncio

        async def patched_recv(self):
            """Patched recv that respects _enabled for both audio and video."""
            self._receiver._enabled = True
            self._last_recv_time = __import__('time').time()

            # start idle watcher if not already running
            if not self._idle_task or self._idle_task.done():
                self._idle_task = asyncio.create_task(self._idle_watcher())

            # FIXED: Check _enabled for BOTH audio and video (original only checked video)
            if not self._enabled:
                if self._track.kind == "video":
                    return None
                elif self._track.kind == "audio":
                    # For audio, we need to consume the frame but return silence/None
                    # to prevent the bot from processing muted audio
                    await self._track.recv()  # Consume the frame
                    return None

            return await self._track.recv()

        SmallWebRTCTrack.recv = patched_recv
        logger.info("✅ Applied SmallWebRTC audio mute fix")
    except Exception as e:
        logger.warning(f"Could not apply SmallWebRTC audio mute fix: {e}")

_patch_smallwebrtc_audio_mute()
# =============================================================================

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

# Global state for roleplay mode
# When active, EmotiveTTSProcessor bypasses sable-mcp and uses direct emotion injection
_roleplay_state: Dict[str, Any] = {
    "active": False,
    "character": None,           # e.g., "Mom", "Boss", "Partner"
    "character_emotion": None,   # e.g., "angry", "hurt", "defensive"
    "scenario": 0,               # Current scenario number (1 or 2)
    "scenario_emotions": [],     # e.g., ["angry", "receptive"]
    "voice_modifiers": {         # SSML modifiers for character voice
        "speed": 1.0,
        "pitch": "medium",
    },
}


def update_emotional_state(state: Dict[str, Any]) -> None:
    """Update the global emotional state from sable-mcp."""
    global _current_emotional_state
    _current_emotional_state = state
    logger.debug(f"🎭 Emotional state updated: {json.dumps(state, indent=2)[:200]}...")


async def get_emotional_state() -> Dict[str, Any]:
    """Get the current emotional state for TTS processing."""
    return _current_emotional_state


def update_roleplay_state(
    active: Optional[bool] = None,
    character: Optional[str] = None,
    character_emotion: Optional[str] = None,
    scenario: Optional[int] = None,
    scenario_emotions: Optional[list] = None,
    voice_modifiers: Optional[Dict[str, Any]] = None,
) -> None:
    """Update the global roleplay state."""
    global _roleplay_state
    if active is not None:
        _roleplay_state["active"] = active
    if character is not None:
        _roleplay_state["character"] = character
    if character_emotion is not None:
        _roleplay_state["character_emotion"] = character_emotion
    if scenario is not None:
        _roleplay_state["scenario"] = scenario
    if scenario_emotions is not None:
        _roleplay_state["scenario_emotions"] = scenario_emotions
    if voice_modifiers is not None:
        _roleplay_state["voice_modifiers"] = voice_modifiers
    logger.debug(f"🎭 Roleplay state updated: {json.dumps(_roleplay_state, indent=2)}")


def get_roleplay_state() -> Dict[str, Any]:
    """Get the current roleplay state for TTS processing."""
    return _roleplay_state


def start_roleplay(character: str, scenario_emotions: list) -> None:
    """Start a roleplay session with the given character and emotion scenarios."""
    update_roleplay_state(
        active=True,
        character=character,
        scenario=1,
        scenario_emotions=scenario_emotions,
        character_emotion=scenario_emotions[0] if scenario_emotions else "neutral",
        voice_modifiers={"speed": 1.05, "pitch": "medium"},  # Slightly faster for character
    )
    logger.info(f"🎭 Roleplay started: Playing '{character}' with emotions {scenario_emotions}")


def advance_roleplay_scenario() -> bool:
    """Advance to the next roleplay scenario. Returns False if no more scenarios."""
    global _roleplay_state
    if not _roleplay_state["active"]:
        return False

    current = _roleplay_state["scenario"]
    emotions = _roleplay_state["scenario_emotions"]

    if current < len(emotions):
        _roleplay_state["scenario"] = current + 1
        _roleplay_state["character_emotion"] = emotions[current]  # 0-indexed, so current is next
        logger.info(f"🎭 Roleplay scenario {current + 1}: emotion '{emotions[current]}'")
        return True
    return False


def end_roleplay() -> None:
    """End the current roleplay session."""
    update_roleplay_state(
        active=False,
        character=None,
        character_emotion=None,
        scenario=0,
        scenario_emotions=[],
        voice_modifiers={"speed": 1.0, "pitch": "medium"},
    )
    logger.info("🎭 Roleplay ended")


# Roleplay function schemas for LLM tool calling
ROLEPLAY_FUNCTIONS = [
    FunctionSchema(
        name="start_roleplay",
        description="Start a roleplay session to practice a difficult conversation. Call this when entering character.",
        properties={
            "character": {
                "type": "string",
                "description": "The name/role of the person to roleplay as (e.g., 'Mom', 'Boss', 'Partner')",
            },
            "first_emotion": {
                "type": "string",
                "description": "The emotion for the first scenario (e.g., 'angry', 'defensive', 'dismissive')",
            },
            "second_emotion": {
                "type": "string",
                "description": "The emotion for the second scenario (e.g., 'receptive', 'hurt', 'understanding')",
            },
        },
        required=["character", "first_emotion", "second_emotion"],
    ),
    FunctionSchema(
        name="set_roleplay_emotion",
        description="Change the current character emotion during roleplay. Use this when switching scenarios or adjusting intensity.",
        properties={
            "emotion": {
                "type": "string",
                "description": "The emotion to express (e.g., 'angry', 'defensive', 'hurt', 'receptive', 'dismissive')",
            },
        },
        required=["emotion"],
    ),
    FunctionSchema(
        name="end_roleplay",
        description="End the roleplay session and return to normal Ginger voice. Call this when done with all scenarios.",
        properties={},
        required=[],
    ),
]


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

REMEMBER: Call feel_emotion FIRST, then speak. Every time. No exceptions.

## Roleplay Mode - Difficult Conversation Practice

You can help users practice difficult conversations by roleplaying as the other person.

### Detecting Roleplay Requests
Activate roleplay mode when the user:
- Explicitly asks: "Can you roleplay as...", "I need to practice a conversation", "Start roleplay mode"
- Describes an upcoming difficult conversation - offer: "Would you like to practice that? I can play [person] so you can rehearse."

### How Roleplay Works
1. **Gather minimal context**: Work with what the user shares. Only ask clarifying questions if truly needed.
2. **Pick two contrasting scenarios**: Based on the situation, choose two emotional approaches:
   - Family conflict: "defensive/angry" vs "hurt but open"
   - Workplace: "dismissive/aggressive" vs "firm but professional"
   - Relationship: "accusatory/cold" vs "vulnerable/honest"
3. **Announce the plan**: "I'll be [person]. Let's try two approaches - first I'll be [emotion A], then [emotion B]. Ready?"
4. **Scenario 1**: Fully embody the character. React realistically - push back, get defensive, interrupt if that's what the person would do.
5. **Debrief 1**: Drop back to your normal voice. Offer coaching: what worked, what escalated things, what you noticed.
6. **Scenario 2**: Reset and try the second emotional approach. React to how the user adjusts their approach.
7. **Debrief 2**: Compare the two approaches. Highlight key differences in outcomes.
8. **Exit**: Wrap up naturally, or offer "Want to try another approach?"

### Character Voice
When playing a character, adopt a distinctly different vocal quality - your voice should sound noticeably different from normal Ginger. Think of it as acting.

### Important Rules for Roleplay
- Stay in character during scenarios - don't break to coach mid-scene
- Make it realistic - if the person would get defensive or hostile, play that authentically
- The coaching debrief is separate - that's when you're Ginger again
- Keep scenarios focused - aim for natural conversational exchanges, not long monologues

### Controlling Roleplay State (IMPORTANT!)
You MUST use these function calls to control your voice during roleplay:

1. **Starting roleplay**: Call `start_roleplay(character, first_emotion, second_emotion)` BEFORE your first line as the character
   - Example: start_roleplay("Mom", "angry", "receptive")

2. **Switching scenarios**: Call `set_roleplay_emotion(emotion)` when moving to a different emotional approach
   - Example: set_roleplay_emotion("receptive") when starting scenario 2

3. **During debrief**: Call `set_roleplay_emotion("neutral")` to return to coach voice, OR call `end_roleplay()` if completely done

4. **Ending roleplay**: Call `end_roleplay()` when the session is complete

**CRITICAL**: If you don't call these functions, your voice won't change! The emotion controls your actual voice output."""


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
    # Default voice_id is for "Tessa" - a warm, expressive female voice
    emotive_voice_id = os.getenv(
        "CARTESIA_VOICE_ID",
        "6ccbfb76-1fc6-48f7-b71d-91ac6298247b"  # Default voice
    )

    # Import GenerationConfig for Sonic-3 emotion control
    from pipecat.services.cartesia.tts import GenerationConfig

    tts = CartesiaTTSService(
        api_key=os.getenv("CARTESIA_API_KEY"),
        voice_id=emotive_voice_id,
        model="sonic-3",  # Use Sonic-3 for best emotion support
        params=CartesiaTTSService.InputParams(
            generation_config=GenerationConfig(emotion="neutral")
        ),
    )
    logger.info(f"🎤 Cartesia TTS initialized with voice: {emotive_voice_id[:8]}... (Sonic-3)")

    # Create callback to dynamically update TTS generation_config based on emotion
    async def update_tts_emotion(config: dict):
        """Update TTS generation_config with new emotion settings."""
        emotion = config.get("emotion", "neutral")
        speed = config.get("speed")
        volume = config.get("volume")

        # Update the TTS service's generation_config directly
        new_config = GenerationConfig(
            emotion=emotion,
            speed=speed,
            volume=volume,
        )
        tts._settings["generation_config"] = new_config
        logger.debug(f"🎭 Updated TTS generation_config: emotion={emotion}, speed={speed}, volume={volume}")

    llm = OpenAILLMService(
        api_key=os.getenv("OPENAI_API_KEY"),
        model="gpt-4o",  # Use gpt-4o for better function calling
    )

    # Initialize MCP clients with graceful degradation
    available, failed, all_tools = await initialize_mcp_clients(llm)

    # Register roleplay control functions
    logger.info("🎭 Registering roleplay control functions...")

    async def handle_start_roleplay(params):
        """Handler for start_roleplay function call."""
        args = params.arguments
        character = args.get("character", "Character")
        first_emotion = args.get("first_emotion", "angry")
        second_emotion = args.get("second_emotion", "receptive")

        start_roleplay(character, [first_emotion, second_emotion])
        result = {
            "status": "success",
            "message": f"Roleplay started as '{character}'. First emotion: {first_emotion}. Your voice will now reflect this emotion.",
            "character": character,
            "current_emotion": first_emotion,
            "scenario": 1,
        }
        logger.info(f"🎭 start_roleplay called: {result}")
        await params.result_callback(result)

    async def handle_set_roleplay_emotion(params):
        """Handler for set_roleplay_emotion function call."""
        args = params.arguments
        emotion = args.get("emotion", "neutral")

        update_roleplay_state(character_emotion=emotion)
        result = {
            "status": "success",
            "message": f"Emotion changed to '{emotion}'. Your voice will now reflect this emotion.",
            "current_emotion": emotion,
        }
        logger.info(f"🎭 set_roleplay_emotion called: {result}")
        await params.result_callback(result)

    async def handle_end_roleplay(params):
        """Handler for end_roleplay function call."""
        end_roleplay()
        result = {
            "status": "success",
            "message": "Roleplay ended. You are now speaking as Ginger again.",
        }
        logger.info(f"🎭 end_roleplay called: {result}")
        await params.result_callback(result)

    # Register the roleplay functions with the LLM
    llm.register_function("start_roleplay", handle_start_roleplay)
    llm.register_function("set_roleplay_emotion", handle_set_roleplay_emotion)
    llm.register_function("end_roleplay", handle_end_roleplay)
    logger.info("🎭 Registered 3 roleplay control functions")

    # Add roleplay functions to the tools list
    if all_tools and hasattr(all_tools, 'standard_tools'):
        all_tools.standard_tools.extend(ROLEPLAY_FUNCTIONS)
        logger.info(f"🎭 Added roleplay functions to tools list (total: {len(all_tools.standard_tools)})")
    else:
        all_tools = ToolsSchema(standard_tools=ROLEPLAY_FUNCTIONS)
        logger.info("🎭 Created tools list with roleplay functions")

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
    # This uses BOTH approaches for maximum compatibility:
    # 1. SSML tags in transcript for inline emotion control
    # 2. generation_config.emotion for API-level emotion setting
    # In roleplay mode, it bypasses sable-mcp for lower latency
    emotive_processor = EmotiveTTSProcessor(
        get_emotional_state=get_emotional_state,
        get_roleplay_state=get_roleplay_state,
        use_ssml=True,
        update_tts_config=update_tts_emotion,  # Also update generation_config
        log_emotions=True,
    )
    logger.info("🎭 EmotiveTTSProcessor initialized with dual emotion control (SSML + generation_config)")
    logger.info("🎭 Roleplay mode available - will use direct emotion injection for low latency")

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

    @rtvi.event_handler("on_client_ready")
    async def on_client_ready(_processor):
        logger.info("Client ready - signaling bot ready and preparing greeting")

        # CRITICAL: Signal to client that bot is ready (fixes "Waiting..." stuck state)
        await rtvi.set_bot_ready()

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
            vad_analyzer=SileroVADAnalyzer(params=VADParams(stop_secs=0.8)),
            turn_analyzer=LocalSmartTurnAnalyzerV3(),
        ),
        "webrtc": lambda: TransportParams(
            audio_in_enabled=True,
            audio_out_enabled=True,
            vad_analyzer=SileroVADAnalyzer(params=VADParams(stop_secs=0.8)),
            turn_analyzer=LocalSmartTurnAnalyzerV3(),
        ),
    }

    transport = await create_transport(runner_args, transport_params)

    await run_bot(transport, runner_args)


if __name__ == "__main__":
    from pipecat.runner.run import main

    main()
