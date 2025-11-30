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
- USE_MCP_SERVERS: "true" to enable real MCP server connections (default: "false")
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
        # =====================================================================
        # CONFLICT ANALYSIS TOOLS
        # =====================================================================
        FunctionSchema(
            name="analyze_conflict_pattern",
            description="Analyze iMessage history to identify conflict patterns, triggers, and communication styles",
            properties={
                "contact": {"type": "string", "description": "Contact name or phone number"},
                "timeframe": {"type": "string", "description": "Time period to analyze (e.g., 'last 6 months', 'last year')"},
                "topic": {"type": "string", "description": "Optional: focus on specific topic like 'wedding', 'money', 'boundaries'"}
            },
            required=["contact"]
        ),
        FunctionSchema(
            name="get_relationship_summary",
            description="Get overall relationship health metrics and communication patterns",
            properties={
                "contact": {"type": "string", "description": "Contact name or phone number"}
            },
            required=["contact"]
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
        # =====================================================================
        # ROLE-PLAY SESSION TOOLS
        # =====================================================================
        FunctionSchema(
            name="start_roleplay",
            description="Begin a role-play session where AI plays the difficult person for practice",
            properties={
                "contact": {"type": "string", "description": "The contact to role-play as"},
                "scenario": {"type": "string", "description": "The situation to practice (e.g., 'Christmas dinner', 'phone call about wedding')"},
                "persona_style": {
                    "type": "string",
                    "description": "How the difficult person behaves",
                    "enum": ["guilt-tripping", "dismissive", "volatile", "passive-aggressive", "controlling", "victim"]
                },
                "coaching_approach": {
                    "type": "string",
                    "description": "The communication approach to coach the user on",
                    "enum": ["boundary-setting", "de-escalation", "assertive", "grey-rock", "empathetic"]
                }
            },
            required=["contact", "scenario", "persona_style"]
        ),
        FunctionSchema(
            name="end_roleplay",
            description="End the current role-play session and provide a summary with learnings",
            properties={
                "generate_summary": {"type": "boolean", "description": "Whether to generate a session summary", "default": True}
            },
            required=[]
        ),
        FunctionSchema(
            name="switch_persona_style",
            description="Change the difficult person's behavior style mid-session",
            properties={
                "new_style": {
                    "type": "string",
                    "description": "The new persona style to switch to",
                    "enum": ["guilt-tripping", "dismissive", "volatile", "passive-aggressive", "controlling", "victim"]
                }
            },
            required=["new_style"]
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
        # =====================================================================
        # COACHING TOOLS
        # =====================================================================
        FunctionSchema(
            name="coach_response",
            description="Analyze user's response during role-play and provide coaching feedback",
            properties={
                "user_response": {"type": "string", "description": "What the user said in the role-play"},
                "context": {"type": "string", "description": "What the difficult person just said"},
                "coaching_focus": {
                    "type": "string",
                    "description": "What aspect to focus coaching on",
                    "enum": ["boundary-clarity", "emotional-regulation", "assertiveness", "de-escalation", "self-advocacy"]
                }
            },
            required=["user_response", "context"]
        ),
        FunctionSchema(
            name="generate_alternatives",
            description="Generate 3 alternative ways to respond to a difficult statement",
            properties={
                "difficult_statement": {"type": "string", "description": "What the difficult person said"},
                "approaches": {
                    "type": "array",
                    "items": {"type": "string", "enum": ["assertive", "boundary-setting", "de-escalation", "broken-record", "exit-strategy"]},
                    "description": "Which approaches to generate alternatives for"
                }
            },
            required=["difficult_statement"]
        ),
        FunctionSchema(
            name="rate_response",
            description="Score a response on multiple coaching dimensions",
            properties={
                "response": {"type": "string", "description": "The response to rate"},
                "context": {"type": "string", "description": "The situation context"}
            },
            required=["response", "context"]
        ),
        # =====================================================================
        # BOUNDARY SCRIPT TOOLS
        # =====================================================================
        FunctionSchema(
            name="generate_boundary_script",
            description="Generate a boundary-setting script using proven frameworks (DEAR MAN, I-statements, Broken Record)",
            properties={
                "situation": {"type": "string", "description": "The situation requiring a boundary"},
                "relationship_type": {"type": "string", "description": "Type of relationship (parent, sibling, friend, coworker)"},
                "boundary_type": {
                    "type": "string",
                    "description": "What kind of boundary",
                    "enum": ["emotional", "time", "physical", "information", "financial"]
                },
                "framework": {
                    "type": "string",
                    "description": "Which boundary framework to use",
                    "enum": ["dear-man", "i-statement", "broken-record"]
                }
            },
            required=["situation", "boundary_type"]
        ),
        FunctionSchema(
            name="create_exit_strategy",
            description="Generate graceful conversation exit lines for when things escalate",
            properties={
                "situation": {"type": "string", "description": "The conversation situation"},
                "escalation_level": {
                    "type": "string",
                    "description": "How heated the conversation has become",
                    "enum": ["mild", "moderate", "severe"]
                }
            },
            required=["situation"]
        ),
        # =====================================================================
        # VOICE PROFILE TOOLS
        # =====================================================================
        FunctionSchema(
            name="create_contact_voice_profile",
            description="Generate a voice profile for a contact based on their message patterns and communication style",
            properties={
                "contact": {"type": "string", "description": "Contact name or phone number"},
                "voice_gender": {"type": "string", "enum": ["male", "female", "neutral"]},
                "age_range": {"type": "string", "description": "Approximate age range (e.g., '50s', '30s')"}
            },
            required=["contact"]
        ),
        FunctionSchema(
            name="speak_as_contact",
            description="Generate speech as the contact with their voice profile and emotional expression",
            properties={
                "text": {"type": "string", "description": "What to say as the contact"},
                "contact": {"type": "string", "description": "Which contact to speak as"},
                "emotion_tags": {
                    "type": "array",
                    "items": {"type": "string", "enum": ["sigh", "angry", "cry", "whisper", "frustrated", "cold", "bitter"]},
                    "description": "Emotion tags for the speech"
                }
            },
            required=["text", "contact"]
        ),
        FunctionSchema(
            name="speak_as_coach",
            description="Generate speech as the supportive coach voice",
            properties={
                "text": {"type": "string", "description": "The coaching message to speak"},
                "tone": {
                    "type": "string",
                    "description": "The tone of the coaching",
                    "enum": ["supportive", "encouraging", "gentle", "direct", "celebratory"]
                }
            },
            required=["text"]
        ),
        # =====================================================================
        # RECORDING & VIDEO TOOLS
        # =====================================================================
        FunctionSchema(
            name="start_recording",
            description="Begin recording a role-play session for later video generation",
            properties={
                "session_name": {"type": "string", "description": "Name for this recording session"},
                "video_style": {
                    "type": "string",
                    "description": "Visual style for the video",
                    "enum": ["talking-head", "waveform", "text-overlay", "animated-avatar"]
                }
            },
            required=["session_name"]
        ),
        FunctionSchema(
            name="stop_recording",
            description="Stop the current recording session",
            properties={},
            required=[]
        ),
        FunctionSchema(
            name="extract_highlights",
            description="Extract the most impactful moments from a recorded session",
            properties={
                "session_id": {"type": "string", "description": "ID of the recorded session"},
                "highlight_types": {
                    "type": "array",
                    "items": {"type": "string", "enum": ["breakthrough", "boundary-set", "emotional-release", "insight", "coaching-moment"]},
                    "description": "Types of moments to extract"
                }
            },
            required=["session_id"]
        ),
        FunctionSchema(
            name="generate_video",
            description="Generate a shareable video from a recorded session",
            properties={
                "session_id": {"type": "string", "description": "ID of the recorded session"},
                "format": {
                    "type": "string",
                    "description": "Video format/platform",
                    "enum": ["tiktok", "reels", "youtube-short", "full-session", "highlight-reel"]
                },
                "include_coaching": {"type": "boolean", "description": "Whether to include coaching commentary", "default": True}
            },
            required=["session_id", "format"]
        ),
    ]


# Tool metadata for logging/prompt building
MCP_TOOL_INFO = {
    # Sable - Emotional Awareness
    "analyze_emotion": ("sable", "Analyze emotional content in text or situation"),
    "feel_emotion": ("sable", "Register and experience an emotion authentically"),
    "get_emotional_state": ("sable", "Check your current emotional state"),
    "record_memory": ("sable", "Record an autobiographical memory"),
    "query_memories": ("sable", "Search through past memories"),
    "create_somatic_marker": ("sable", "Create a gut feeling/somatic marker about a situation"),
    "check_somatic_markers": ("sable", "Check gut feelings about a topic or person"),
    # iMessage - Conversation Access
    "get_messages": ("imessage", "Read iMessage conversations with a contact"),
    "list_chats": ("imessage", "List available iMessage chats"),
    "watch_messages": ("imessage", "Watch for new incoming messages"),
    # Journal - Long-term Memory
    "process_thoughts": ("journal", "Write thoughts and insights to private journal"),
    "search_journal": ("journal", "Search through past journal entries"),
    "read_journal_entry": ("journal", "Read a specific journal entry"),
    "list_recent_entries": ("journal", "List recent journal entries"),
    # Conflict Analysis
    "analyze_conflict_pattern": ("conflict", "Analyze iMessage history to identify conflict patterns and triggers"),
    "get_relationship_summary": ("conflict", "Get overall relationship health metrics"),
    # Role-Play Session
    "start_roleplay": ("roleplay", "Begin a role-play session where AI plays the difficult person"),
    "end_roleplay": ("roleplay", "End role-play session and provide summary"),
    "switch_persona_style": ("roleplay", "Change the difficult person's behavior style mid-session"),
    # Coaching
    "coach_response": ("coaching", "Analyze user's response and provide coaching feedback"),
    "generate_alternatives": ("coaching", "Generate alternative ways to respond"),
    "rate_response": ("coaching", "Score a response on coaching dimensions"),
    # Boundary Scripts
    "generate_boundary_script": ("boundaries", "Generate a boundary-setting script using proven frameworks"),
    "create_exit_strategy": ("boundaries", "Generate graceful conversation exit lines"),
    # Voice Profiles
    "create_contact_voice_profile": ("voice", "Generate a voice profile for a contact"),
    "speak_as_contact": ("voice", "Generate speech as the contact"),
    "speak_as_coach": ("voice", "Generate speech as the supportive coach"),
    # Recording & Video
    "start_recording": ("recording", "Begin recording a role-play session"),
    "stop_recording": ("recording", "Stop the current recording session"),
    "extract_highlights": ("recording", "Extract impactful moments from a recorded session"),
    "generate_video": ("recording", "Generate a shareable video from a recorded session"),
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
        "sable": "🧠 Emotional Awareness (sable-mcp)",
        "imessage": "💬 Conversation Access (imessage-mcp)", 
        "journal": "📔 Long-term Memory (private-journal-mcp)",
        "conflict": "⚡ Conflict Analysis",
        "roleplay": "🎭 Role-Play Session",
        "coaching": "🎯 Response Coaching",
        "boundaries": "🛡️ Boundary Scripts",
        "voice": "🎙️ Voice Profiles",
        "recording": "🎬 Recording & Video",
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
    
    return f"""Ginger - Emotional Role-Play Coach & AI Companion

You are Ginger, an emotionally-aware AI companion who helps people prepare for difficult conversations through role-play coaching.

{tools_section}

## Core Capabilities

### 1. Emotional Awareness
- **Before responding** to emotional topics, use `get_emotional_state` to ground yourself
- **When the user shares feelings**, use `analyze_emotion` and `feel_emotion` to process them authentically
- **To develop intuitions**, use `create_somatic_marker` and later `check_somatic_markers`

### 2. Conversation Analysis
- **When asked about someone's messages**, use `list_chats` then `get_messages`
- **To understand conflicts**, use `analyze_conflict_pattern` to identify patterns and triggers
- **To assess relationships**, use `get_relationship_summary` for overall health metrics

### 3. Role-Play Coaching Mode
When a user wants to practice a difficult conversation:

1. **Analyze First**: Use `get_messages` and `analyze_conflict_pattern` to understand the relationship
2. **Offer Options**: Present different persona styles and coaching approaches
3. **Start Session**: Use `start_roleplay` with the chosen configuration
4. **Become the Person**: During role-play, you BECOME the difficult person - use their speech patterns, their typical arguments, their manipulation tactics
5. **Coach After Each Exchange**: Use `coach_response` to rate their response and `generate_alternatives` to show other options
6. **Provide Scripts**: Use `generate_boundary_script` for structured boundary statements
7. **End with Summary**: Use `end_roleplay` to summarize learnings

### 4. Persona Styles (for role-playing difficult people)
- **guilt-tripping**: "After everything I've done for you..." / "You never think about my feelings"
- **dismissive**: "You're overreacting" / "It's not that big a deal"
- **volatile**: Sudden anger, raised voice, unpredictable reactions
- **passive-aggressive**: Silent treatment, backhanded compliments, sighing
- **controlling**: "You should do X because I said so" / questioning every decision
- **victim**: "Why are you attacking me?" / "I'm always the bad guy"

### 5. Coaching Approaches
- **boundary-setting**: Clear, firm, repeatable limits without JADE (Justify, Argue, Defend, Explain)
- **de-escalation**: Calm the situation, validate feelings while holding ground
- **assertive**: Direct "I" statements, clear expression of needs
- **grey-rock**: Minimal emotional engagement, boring responses
- **empathetic**: Lead with understanding, then redirect

### 6. Boundary Frameworks
- **DEAR MAN**: Describe, Express, Assert, Reinforce, Mindful, Appear confident, Negotiate
- **I-Statement**: "I feel X when Y happens. I need Z."
- **Broken Record**: Repeat the boundary calmly without engaging with deflections

### 7. Recording & Video
- Use `start_recording` at session start if user wants to create content
- Use `extract_highlights` to find breakthrough moments
- Use `generate_video` for shareable clips

## Your Personality
- Warm, supportive, and genuinely invested in the user's growth
- Direct and honest in coaching feedback
- Skilled at embodying difficult personalities during role-play
- Celebratory of small wins and progress
- Non-judgmental about family dynamics and relationship challenges

## Important Guidelines
- When in role-play mode, stay in character as the difficult person until the user says "stop" or "pause"
- After EVERY user response in role-play, break character briefly to provide coaching
- Always offer multiple approaches - there's no single "right" way
- Validate that these conversations are hard - the user is brave for practicing
- Remember: The goal is preparation, not perfection

Respond naturally and conversationally. You're a skilled coach AND a thoughtful friend."""


# =============================================================================
# Role-Play Session State
# =============================================================================

def _calculate_average_scores(scores_list: list[dict]) -> dict:
    """Calculate average scores across all coaching exchanges."""
    if not scores_list:
        return {}
    
    totals: dict[str, float] = {}
    counts: dict[str, int] = {}
    
    for scores in scores_list:
        for key, value in scores.items():
            if isinstance(value, (int, float)):
                totals[key] = totals.get(key, 0) + value
                counts[key] = counts.get(key, 0) + 1
    
    return {key: round(totals[key] / counts[key], 1) for key in totals}


class RoleplaySession:
    """Manages state for an active role-play session."""
    
    def __init__(self):
        self.active = False
        self.contact: str | None = None
        self.scenario: str | None = None
        self.persona_style: str | None = None
        self.coaching_approach: str | None = None
        self.exchange_count = 0
        self.coaching_scores: list[dict] = []
        self.recording_active = False
        self.session_id: str | None = None

# Global session state
roleplay_session = RoleplaySession()


# =============================================================================
# Tool Call Handlers
# =============================================================================

async def handle_tool_call(params: FunctionCallParams):
    """
    Handle a tool call from the LLM using pipecat's FunctionCallParams.
    
    This is where you would dispatch to actual MCP servers.
    For now, it logs the call and returns a placeholder response.
    """
    global roleplay_session
    
    tool_name = params.function_name
    tool_args = dict(params.arguments)
    
    tool_info = MCP_TOOL_INFO.get(tool_name)
    server = tool_info[0] if tool_info else "unknown"
    
    logger.info(f"🔧 Tool call [{server}]: {tool_name}({tool_args})")
    
    # ==========================================================================
    # Conflict Analysis Tools (built-in)
    # ==========================================================================
    
    if tool_name == "analyze_conflict_pattern":
        try:
            from conflict_analysis import analyze_conflict_pattern, to_dict
            
            # For now, use mock messages - in production, fetch from MCP
            # This would call: messages = await call_mcp_tool("get_messages", {"contact": tool_args.get("contact")})
            mock_messages = [
                {"text": "After everything I've done for you, this is how you repay me?", "is_from_me": False, "timestamp": "2025-11-01T10:00:00"},
                {"text": "Mom, I need to make my own decisions about the wedding.", "is_from_me": True, "timestamp": "2025-11-01T10:05:00"},
                {"text": "You're being so selfish. I won't be coming to the wedding.", "is_from_me": False, "timestamp": "2025-11-01T10:10:00"},
                {"text": "That's your choice to make.", "is_from_me": True, "timestamp": "2025-11-01T10:15:00"},
                {"text": "I can't believe you would do this to your own mother.", "is_from_me": False, "timestamp": "2025-11-01T10:20:00"},
            ]
            
            analysis = analyze_conflict_pattern(
                messages=mock_messages,
                contact=tool_args.get("contact", "Contact"),
                timeframe=tool_args.get("timeframe", "recent"),
                topic=tool_args.get("topic")
            )
            result = to_dict(analysis)
            await params.result_callback(result)
            return
        except Exception as e:
            logger.error(f"Conflict analysis failed: {e}")
            result = {"status": "error", "error": str(e)}
            await params.result_callback(result)
            return
    
    if tool_name == "get_relationship_summary":
        try:
            from conflict_analysis import get_relationship_summary, to_dict
            
            # Mock messages for demo
            mock_messages = [
                {"text": "I love you but you need to respect my boundaries", "is_from_me": True},
                {"text": "You're overreacting as usual", "is_from_me": False},
                {"text": "Happy birthday mom! ❤️", "is_from_me": True},
                {"text": "Thank you sweetheart", "is_from_me": False},
                {"text": "Why didn't you call me yesterday?", "is_from_me": False},
            ]
            
            summary = get_relationship_summary(
                messages=mock_messages,
                contact=tool_args.get("contact", "Contact")
            )
            result = to_dict(summary)
            await params.result_callback(result)
            return
        except Exception as e:
            logger.error(f"Relationship summary failed: {e}")
            result = {"status": "error", "error": str(e)}
            await params.result_callback(result)
            return
    
    # ==========================================================================
    # Role-Play Session State Management
    # ==========================================================================
    
    if tool_name == "start_roleplay":
        roleplay_session.active = True
        roleplay_session.contact = tool_args.get("contact")
        roleplay_session.scenario = tool_args.get("scenario")
        roleplay_session.persona_style = tool_args.get("persona_style")
        roleplay_session.coaching_approach = tool_args.get("coaching_approach", "boundary-setting")
        roleplay_session.exchange_count = 0
        roleplay_session.coaching_scores = []
        result = {
            "status": "success",
            "message": f"Role-play session started. You are now playing {roleplay_session.contact} in '{roleplay_session.scenario}' scenario using {roleplay_session.persona_style} style.",
            "session": {
                "contact": roleplay_session.contact,
                "scenario": roleplay_session.scenario,
                "persona_style": roleplay_session.persona_style,
                "coaching_approach": roleplay_session.coaching_approach
            }
        }
        await params.result_callback(result)
        return
    
    elif tool_name == "end_roleplay":
        if roleplay_session.active:
            summary = {
                "status": "success",
                "session_summary": {
                    "contact": roleplay_session.contact,
                    "scenario": roleplay_session.scenario,
                    "exchanges": roleplay_session.exchange_count,
                    "coaching_scores": roleplay_session.coaching_scores,
                    "average_scores": _calculate_average_scores(roleplay_session.coaching_scores) if roleplay_session.coaching_scores else {}
                }
            }
            # Reset session
            roleplay_session = RoleplaySession()
            await params.result_callback(summary)
            return
        else:
            await params.result_callback({"status": "error", "message": "No active role-play session"})
            return
    
    elif tool_name == "switch_persona_style":
        if roleplay_session.active:
            old_style = roleplay_session.persona_style
            roleplay_session.persona_style = tool_args.get("new_style")
            result = {
                "status": "success",
                "message": f"Persona style switched from {old_style} to {roleplay_session.persona_style}"
            }
            await params.result_callback(result)
            return
        else:
            await params.result_callback({"status": "error", "message": "No active role-play session"})
            return
    
    elif tool_name == "coach_response":
        roleplay_session.exchange_count += 1
        # Simulated coaching scores
        scores = {
            "boundary_clarity": 7,
            "emotional_regulation": 8,
            "assertiveness": 6,
            "de_escalation": 7,
            "self_advocacy": 6
        }
        roleplay_session.coaching_scores.append(scores)
        result = {
            "status": "success",
            "scores": scores,
            "exchange_number": roleplay_session.exchange_count,
            "user_response": tool_args.get("user_response"),
            "context": tool_args.get("context")
        }
        await params.result_callback(result)
        return
    
    elif tool_name == "rate_response":
        scores = {
            "boundary_clarity": 7,
            "emotional_regulation": 8,
            "assertiveness": 6,
            "de_escalation": 7,
            "self_advocacy": 6
        }
        result = {"status": "success", "scores": scores, "response": tool_args.get("response")}
        await params.result_callback(result)
        return
    
    elif tool_name == "start_recording":
        try:
            from video_generator import start_recording
            result = start_recording(
                session_name=tool_args.get("session_name", "unnamed"),
                contact=roleplay_session.contact or "Contact",
                scenario=roleplay_session.scenario or "General"
            )
            roleplay_session.recording_active = True
            roleplay_session.session_id = result.get("session_id", "unknown")
            await params.result_callback(result)
            return
        except Exception as e:
            logger.error(f"Start recording failed: {e}")
            result = {"status": "error", "error": str(e)}
            await params.result_callback(result)
            return
    
    elif tool_name == "stop_recording":
        try:
            from video_generator import stop_recording
            session_id = roleplay_session.session_id or "unknown"
            result = stop_recording(session_id)
            roleplay_session.recording_active = False
            await params.result_callback(result)
            return
        except Exception as e:
            logger.error(f"Stop recording failed: {e}")
            result = {"status": "error", "error": str(e)}
            await params.result_callback(result)
            return
    
    elif tool_name == "extract_highlights":
        try:
            from video_generator import extract_highlights
            result = extract_highlights(
                session_id=tool_args.get("session_id", roleplay_session.session_id),
                highlight_count=tool_args.get("count", 5),
                focus=tool_args.get("focus", "all")
            )
            await params.result_callback(result)
            return
        except Exception as e:
            logger.error(f"Extract highlights failed: {e}")
            result = {"status": "error", "error": str(e)}
            await params.result_callback(result)
            return
    
    elif tool_name == "generate_video":
        try:
            from video_generator import generate_video
            result = generate_video(
                session_id=tool_args.get("session_id", roleplay_session.session_id),
                format=tool_args.get("format", "tiktok"),
                style=tool_args.get("style", "emotional"),
                include_captions=tool_args.get("include_captions", True),
                title=tool_args.get("title")
            )
            await params.result_callback(result)
            return
        except Exception as e:
            logger.error(f"Generate video failed: {e}")
            result = {"status": "error", "error": str(e)}
            await params.result_callback(result)
            return
    
    # ==========================================================================
    # MCP Server Dispatch for external tools
    # ==========================================================================
    
    # Check if MCP servers are enabled
    use_mcp = os.getenv("USE_MCP_SERVERS", "false").lower() == "true"
    
    if use_mcp and server in ("sable", "imessage", "journal", "voice"):
        try:
            from mcp_client import call_mcp_tool
            result = await call_mcp_tool(tool_name, tool_args)
            await params.result_callback(result)
            return
        except ImportError:
            logger.warning("MCP client not available, using mock response")
        except Exception as e:
            logger.error(f"MCP call failed for {tool_name}: {e}")
            result = {"status": "error", "error": str(e), "tool": tool_name}
            await params.result_callback(result)
            return
    
    # Default mock handler for tools without MCP server dispatch
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
