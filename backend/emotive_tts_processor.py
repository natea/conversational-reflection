"""
Emotive TTS Processor for Pipecat

A pipeline processor that intercepts text before TTS generation and applies
emotional parameters based on the current emotional state from sable-mcp.

This processor:
1. Queries sable-mcp for current emotional state
2. Maps emotions to Cartesia-specific parameters
3. Injects SSML tags into text for emotional expression
4. Updates TTS service configuration with emotion settings
"""

from dataclasses import dataclass
from enum import Enum
from typing import Optional, Dict, Any, Callable, Awaitable

from loguru import logger

from pipecat.frames.frames import (
    Frame,
    TextFrame,
    LLMFullResponseStartFrame,
    LLMFullResponseEndFrame,
    TTSTextFrame,
    TTSStartedFrame,
    TTSStoppedFrame,
)
from pipecat.processors.frame_processor import FrameDirection, FrameProcessor


class PrimaryEmotion(str, Enum):
    """Primary emotions based on Ekman's universal emotions"""
    JOY = "joy"
    SADNESS = "sadness"
    ANGER = "anger"
    FEAR = "fear"
    DISGUST = "disgust"
    SURPRISE = "surprise"
    NEUTRAL = "neutral"


@dataclass
class BodyState:
    """Body state from Damasio's somatic marker hypothesis"""
    heart_rate: float = 72.0
    temperature: float = 0.0
    tension: float = 0.2
    energy: float = 0.5
    breathing: float = 0.3


@dataclass
class EmotiveVoiceState:
    """Complete emotional state for voice synthesis"""
    primary_emotion: PrimaryEmotion
    intensity: float  # 0.0 - 1.0
    nuanced_emotion: Optional[str] = None
    body_state: Optional[BodyState] = None


# Cartesia emotion mapping based on primary emotion and intensity
# Valid Cartesia emotions: happy, excited, enthusiastic, angry, mad, outraged, frustrated,
# sad, dejected, melancholic, disappointed, hurt, anxious, panicked, scared, content, calm,
# curious, surprised, amazed, neutral, contempt, skeptical, confused, resigned, etc.
CARTESIA_EMOTION_MAP = {
    PrimaryEmotion.JOY: {
        "low": "content",
        "medium": "happy",
        "high": "excited",
    },
    PrimaryEmotion.SADNESS: {
        "low": "disappointed",
        "medium": "sad",
        "high": "melancholic",
    },
    PrimaryEmotion.ANGER: {
        "low": "frustrated",
        "medium": "angry",
        "high": "outraged",
    },
    PrimaryEmotion.FEAR: {
        "low": "anxious",
        "medium": "anxious",
        "high": "panicked",
    },
    PrimaryEmotion.DISGUST: {
        "low": "skeptical",
        "medium": "contempt",
        "high": "contempt",
    },
    PrimaryEmotion.SURPRISE: {
        "low": "curious",
        "medium": "surprised",
        "high": "amazed",
    },
    PrimaryEmotion.NEUTRAL: {
        "low": "calm",
        "medium": "neutral",
        "high": "calm",
    },
}


def map_sable_to_emotive_state(sable_state: Dict[str, Any]) -> EmotiveVoiceState:
    """Convert sable-mcp emotional state to EmotiveVoiceState"""
    # Extract primary emotion (highest intensity)
    emotions = sable_state.get("emotions", [])
    if emotions:
        # Sort by intensity and take highest
        sorted_emotions = sorted(emotions, key=lambda e: e.get("intensity", 0), reverse=True)
        primary = sorted_emotions[0]
        emotion_type = primary.get("type", "neutral")
        intensity = primary.get("intensity", 0)
    else:
        emotion_type = "neutral"
        intensity = 0

    # Map emotion type to enum
    try:
        primary_emotion = PrimaryEmotion(emotion_type)
    except ValueError:
        primary_emotion = PrimaryEmotion.NEUTRAL

    # Extract body state
    body_state_data = sable_state.get("body_state", {})
    body_state = BodyState(
        heart_rate=body_state_data.get("heart_rate", 72),
        temperature=body_state_data.get("temperature", 0),
        tension=body_state_data.get("tension", 0.2),
        energy=body_state_data.get("energy", 0.5),
        breathing=body_state_data.get("breathing", 0.3),
    )

    # Infer nuanced emotion
    nuanced_emotion = infer_nuanced_emotion(primary_emotion, intensity, body_state)

    return EmotiveVoiceState(
        primary_emotion=primary_emotion,
        intensity=intensity,
        nuanced_emotion=nuanced_emotion,
        body_state=body_state,
    )


def infer_nuanced_emotion(
    primary: PrimaryEmotion,
    intensity: float,
    body_state: Optional[BodyState]
) -> Optional[str]:
    """Infer nuanced emotion from primary emotion and context.

    Returns valid Cartesia emotion strings only.
    """
    if primary == PrimaryEmotion.JOY:
        if intensity > 0.8:
            return "enthusiastic"  # euphoric -> enthusiastic
        if intensity > 0.6:
            return "excited"
        if body_state and body_state.energy < 0.4:
            return "content"
        return "happy" if intensity > 0.4 else "content"

    if primary == PrimaryEmotion.SADNESS:
        if intensity > 0.8:
            return "dejected"
        if body_state and body_state.energy < 0.3:
            return "disappointed"  # tired -> disappointed
        return "melancholic" if intensity > 0.5 else "nostalgic"  # wistful -> nostalgic

    if primary == PrimaryEmotion.ANGER:
        if intensity > 0.8:
            return "outraged"
        if intensity > 0.6:
            return "mad"
        return "frustrated"

    if primary == PrimaryEmotion.FEAR:
        if intensity > 0.8:
            return "panicked"
        if intensity > 0.6:
            return "alarmed"
        return "anxious"

    if primary == PrimaryEmotion.SURPRISE:
        if intensity > 0.7:
            return "amazed"
        return "curious"

    return None


def select_cartesia_emotion(state: EmotiveVoiceState) -> str:
    """Select appropriate Cartesia emotion based on state"""
    # If nuanced emotion is directly supported by Cartesia, use it
    if state.nuanced_emotion:
        return state.nuanced_emotion

    # Map primary emotion with intensity
    mapping = CARTESIA_EMOTION_MAP.get(state.primary_emotion, CARTESIA_EMOTION_MAP[PrimaryEmotion.NEUTRAL])

    if state.intensity < 0.35:
        return mapping["low"]
    elif state.intensity < 0.7:
        return mapping["medium"]
    else:
        return mapping["high"]


def calculate_speed_modifier(state: EmotiveVoiceState) -> float:
    """Calculate speed modifier based on body state"""
    if not state.body_state:
        return 1.0

    energy = state.body_state.energy

    # Map energy to speed (0.6 - 1.5 range for Cartesia)
    if energy < 0.3:
        return 0.8 + (energy / 0.3) * 0.15  # 0.8 - 0.95
    elif energy > 0.7:
        return 1.05 + ((energy - 0.7) / 0.3) * 0.25  # 1.05 - 1.3
    else:
        return 0.95 + ((energy - 0.3) / 0.4) * 0.1  # 0.95 - 1.05


def calculate_volume_modifier(state: EmotiveVoiceState) -> float:
    """Calculate volume modifier based on state"""
    volume = 1.0

    if state.body_state and state.body_state.tension > 0.6:
        volume = 1.0 + (state.body_state.tension - 0.6) * 0.5

    if state.intensity > 0.7:
        volume *= 1 + (state.intensity - 0.7) * 0.3

    # Clamp to Cartesia limits
    return max(0.5, min(2.0, volume))


def generate_ssml_prefix(state: EmotiveVoiceState, use_ssml: bool = True) -> str:
    """Generate SSML tags to prepend to text"""
    if not use_ssml:
        return ""

    tags = []

    # Emotion tag
    emotion = select_cartesia_emotion(state)
    tags.append(f'<emotion value="{emotion}" />')

    # Speed tag (only if different from default)
    speed = calculate_speed_modifier(state)
    if abs(speed - 1.0) > 0.05:
        tags.append(f'<speed ratio="{speed:.2f}" />')

    # Volume tag (only if different from default)
    volume = calculate_volume_modifier(state)
    if abs(volume - 1.0) > 0.05:
        tags.append(f'<volume ratio="{volume:.2f}" />')

    return " ".join(tags)


def generate_cartesia_config(state: EmotiveVoiceState) -> Dict[str, Any]:
    """Generate Cartesia generation_config from emotional state"""
    emotion = select_cartesia_emotion(state)
    speed = calculate_speed_modifier(state)
    volume = calculate_volume_modifier(state)

    config = {"emotion": emotion}

    if abs(speed - 1.0) > 0.05:
        config["speed"] = round(speed, 2)

    if abs(volume - 1.0) > 0.05:
        config["volume"] = round(volume, 2)

    return config


# Map roleplay emotions to valid Cartesia emotions
# Cartesia Sonic supports simple emotion strings like: angry, sad, excited, content, scared, neutral
# See full list: happy, excited, enthusiastic, angry, mad, outraged, frustrated, sad, dejected,
# melancholic, disappointed, hurt, anxious, panicked, scared, content, calm, etc.
ROLEPLAY_EMOTION_MAP = {
    # Angry/hostile emotions
    "angry": "angry",
    "defensive": "frustrated",
    "hostile": "outraged",
    "frustrated": "frustrated",
    "annoyed": "agitated",
    "mad": "mad",
    "outraged": "outraged",

    # Sad/hurt emotions
    "sad": "sad",
    "hurt": "hurt",
    "disappointed": "disappointed",
    "melancholic": "melancholic",
    "worried": "anxious",
    "concerned": "anxious",

    # Positive/receptive emotions
    "receptive": "content",
    "understanding": "sympathetic",
    "warm": "affectionate",
    "happy": "happy",
    "excited": "excited",
    "content": "content",
    "open": "content",

    # Curious/questioning emotions
    "curious": "curious",
    "skeptical": "skeptical",
    "questioning": "curious",
    "confused": "confused",

    # Surprised emotions
    "surprised": "surprised",
    "shocked": "amazed",
    "amazed": "amazed",

    # Dismissive/cold
    "dismissive": "contempt",
    "cold": "distant",
    "distant": "distant",

    # Neutral - no emotion tag
    "neutral": None,
}


def map_roleplay_emotion(emotion: str) -> Optional[str]:
    """Map a roleplay emotion to a valid Cartesia emotion tag.

    Args:
        emotion: The roleplay emotion (e.g., "angry", "worried", "receptive")

    Returns:
        Cartesia emotion string (e.g., "anger:high") or None for neutral
    """
    emotion_lower = emotion.lower().strip()
    return ROLEPLAY_EMOTION_MAP.get(emotion_lower, None)


def generate_roleplay_ssml(
    emotion: str,
    speed: float = 1.0,
    volume: float = 1.0,
) -> str:
    """Generate SSML tags for roleplay mode (direct injection, no sable-mcp).

    This bypasses the emotional state lookup for lower latency during roleplay.

    Args:
        emotion: Roleplay emotion string (e.g., "angry", "worried", "defensive")
        speed: Speech speed modifier (0.5-2.0)
        volume: Volume modifier (0.5-2.0)

    Returns:
        SSML tag string to prepend to text
    """
    tags = []

    # Map roleplay emotion to valid Cartesia emotion
    cartesia_emotion = map_roleplay_emotion(emotion)
    if cartesia_emotion:
        tags.append(f'<emotion value="{cartesia_emotion}" />')

    # Speed tag (for character voice differentiation)
    if abs(speed - 1.0) > 0.05:
        tags.append(f'<speed ratio="{speed:.2f}" />')

    # Volume tag
    if abs(volume - 1.0) > 0.05:
        tags.append(f'<volume ratio="{volume:.2f}" />')

    return " ".join(tags)


class EmotiveTTSProcessor(FrameProcessor):
    """
    Pipecat processor that applies emotional state to TTS generation.

    This processor intercepts text frames before they reach the TTS service
    and applies emotional SSML tags based on the current emotional state.

    Supports two modes:
    1. Normal mode: Queries sable-mcp for emotional state
    2. Roleplay mode: Uses direct emotion injection for low latency

    Usage:
        processor = EmotiveTTSProcessor(
            get_emotional_state=get_sable_state,
            get_roleplay_state=get_roleplay_state,
            use_ssml=True
        )

        pipeline = Pipeline([
            ...,
            context_aggregator.user(),
            llm,
            processor,  # Insert before TTS
            tts,
            ...
        ])
    """

    def __init__(
        self,
        *,
        get_emotional_state: Optional[Callable[[], Awaitable[Dict[str, Any]]]] = None,
        get_roleplay_state: Optional[Callable[[], Dict[str, Any]]] = None,
        use_ssml: bool = True,
        update_tts_config: Optional[Callable[[Dict[str, Any]], Awaitable[None]]] = None,
        log_emotions: bool = True,
        **kwargs
    ):
        """
        Initialize the EmotiveTTSProcessor.

        Args:
            get_emotional_state: Async function that returns sable-mcp emotional state
            get_roleplay_state: Sync function that returns roleplay state (for bypass mode)
            use_ssml: Whether to inject SSML tags into text
            update_tts_config: Optional callback to update TTS service config
            log_emotions: Whether to log emotion changes
        """
        super().__init__(**kwargs)
        self._get_emotional_state = get_emotional_state
        self._get_roleplay_state = get_roleplay_state
        self._use_ssml = use_ssml
        self._update_tts_config = update_tts_config
        self._log_emotions = log_emotions
        self._current_state: Optional[EmotiveVoiceState] = None
        self._last_emotion: Optional[str] = None
        # Track whether we've applied emotion tags for the current utterance
        self._emotion_applied_for_utterance = False
        self._in_llm_response = False

    async def _get_current_state(self) -> EmotiveVoiceState:
        """Get current emotional state from sable-mcp"""
        if self._get_emotional_state:
            try:
                sable_state = await self._get_emotional_state()
                logger.debug(f"🎭 Raw sable state: emotions={sable_state.get('emotions', [])}")
                self._current_state = map_sable_to_emotive_state(sable_state)
            except Exception as e:
                logger.warning(f"Failed to get emotional state: {e}")
                # Fall back to neutral
                self._current_state = EmotiveVoiceState(
                    primary_emotion=PrimaryEmotion.NEUTRAL,
                    intensity=0,
                )
        else:
            # No state provider, use neutral
            self._current_state = EmotiveVoiceState(
                primary_emotion=PrimaryEmotion.NEUTRAL,
                intensity=0,
            )

        return self._current_state

    def _is_roleplay_active(self) -> bool:
        """Check if roleplay mode is active AND we're in character (not neutral/debrief)."""
        if self._get_roleplay_state:
            roleplay_state = self._get_roleplay_state()
            # Roleplay is only "active" for voice purposes when:
            # 1. The session is active
            # 2. The emotion is NOT neutral (neutral = debrief/coach voice)
            is_active = roleplay_state.get("active", False)
            emotion = roleplay_state.get("character_emotion", "neutral")
            # When emotion is neutral, fall back to normal Ginger voice
            return is_active and emotion != "neutral"
        return False

    def _get_roleplay_ssml(self) -> Optional[str]:
        """Get SSML tags for roleplay mode (bypasses sable-mcp for low latency)."""
        if not self._get_roleplay_state:
            return None

        roleplay_state = self._get_roleplay_state()
        if not roleplay_state.get("active"):
            return None

        emotion = roleplay_state.get("character_emotion", "neutral")
        voice_mods = roleplay_state.get("voice_modifiers", {})
        speed = voice_mods.get("speed", 1.0)

        # Increase volume slightly for character differentiation
        volume = 1.05 if roleplay_state.get("character") else 1.0

        return generate_roleplay_ssml(emotion, speed, volume)

    async def process_frame(self, frame: Frame, direction: FrameDirection) -> None:
        """Process frames and apply emotional state to TTS text"""
        await super().process_frame(frame, direction)

        # Only process downstream frames (to TTS)
        if direction == FrameDirection.DOWNSTREAM:
            # Track LLM response boundaries to know when a new utterance starts
            if isinstance(frame, LLMFullResponseStartFrame):
                self._in_llm_response = True
                self._emotion_applied_for_utterance = False
                logger.debug("🎭 LLM response started - will apply emotion to first text frame")

            elif isinstance(frame, LLMFullResponseEndFrame):
                self._in_llm_response = False
                self._emotion_applied_for_utterance = False
                logger.debug("🎭 LLM response ended")

            elif isinstance(frame, (TextFrame, TTSTextFrame)):
                # Check if we're in roleplay mode (bypass sable-mcp for low latency)
                if self._is_roleplay_active():
                    # ROLEPLAY MODE: Direct SSML injection, no sable-mcp round-trip
                    if self._use_ssml and not self._emotion_applied_for_utterance:
                        original_text = frame.text if hasattr(frame, 'text') else str(frame)
                        ssml_prefix = self._get_roleplay_ssml()

                        if ssml_prefix:
                            modified_text = f"{ssml_prefix} {original_text}"

                            if isinstance(frame, TTSTextFrame):
                                frame = TTSTextFrame(text=modified_text)
                            else:
                                frame = TextFrame(text=modified_text)

                            roleplay_state = self._get_roleplay_state()
                            character = roleplay_state.get("character", "character")
                            emotion = roleplay_state.get("character_emotion", "neutral")
                            logger.info(f"🎭 Roleplay [{character}]: {ssml_prefix} (emotion: {emotion})")
                            self._emotion_applied_for_utterance = True
                else:
                    # NORMAL MODE: Use sable-mcp emotional state
                    # Only fetch state and apply tags ONCE per utterance
                    if self._use_ssml and not self._emotion_applied_for_utterance:
                        state = await self._get_current_state()

                        # Log emotion changes
                        current_emotion = select_cartesia_emotion(state)
                        if self._log_emotions and current_emotion != self._last_emotion:
                            logger.info(
                                f"🎭 Emotion: {current_emotion} "
                                f"(primary: {state.primary_emotion.value}, "
                                f"intensity: {state.intensity:.0%})"
                            )
                            self._last_emotion = current_emotion

                        original_text = frame.text if hasattr(frame, 'text') else str(frame)
                        ssml_prefix = generate_ssml_prefix(state, self._use_ssml)

                        if ssml_prefix:
                            modified_text = f"{ssml_prefix} {original_text}"

                            # Create new frame with modified text
                            if isinstance(frame, TTSTextFrame):
                                frame = TTSTextFrame(text=modified_text)
                            else:
                                frame = TextFrame(text=modified_text)

                            logger.info(f"🎭 Applied emotion tags: {ssml_prefix}")

                        self._emotion_applied_for_utterance = True

                        # Update TTS config if callback provided
                        if self._update_tts_config:
                            config = generate_cartesia_config(state)
                            try:
                                await self._update_tts_config(config)
                            except Exception as e:
                                logger.warning(f"Failed to update TTS config: {e}")

        await self.push_frame(frame, direction)

    def set_emotional_state(self, state: EmotiveVoiceState) -> None:
        """Manually set the emotional state"""
        self._current_state = state

    def get_current_emotion(self) -> Optional[str]:
        """Get the current Cartesia emotion string"""
        if self._current_state:
            return select_cartesia_emotion(self._current_state)
        return None


def create_sable_state_fetcher(llm_service) -> Callable[[], Awaitable[Dict[str, Any]]]:
    """
    Create a function that fetches emotional state from sable-mcp via LLM tool.

    This is a helper for when sable-mcp is registered as an LLM tool.
    You'll need to adapt this based on how your MCP tools are exposed.

    Args:
        llm_service: The LLM service with registered MCP tools

    Returns:
        Async function that returns the sable emotional state
    """
    async def get_state() -> Dict[str, Any]:
        # This would need to be implemented based on your MCP setup
        # For now, return a default state
        return {
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

    return get_state
