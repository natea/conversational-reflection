"""
Voice Synthesis Module

Connects to Maya TTS server for voice generation with dynamic voice profiles.
Supports speak_as_contact and speak_as_coach functionality.
"""

import json
import os
from dataclasses import dataclass, field
from enum import Enum
from pathlib import Path
from typing import Any, Optional

import httpx
from loguru import logger


class VoiceGender(Enum):
    MALE = "male"
    FEMALE = "female"
    NEUTRAL = "neutral"


class VoicePace(Enum):
    SLOW = "slow"
    CONVERSATIONAL = "conversational"
    FAST = "fast"


class VoiceTimbre(Enum):
    WARM = "warm"
    CLEAR = "clear"
    GRAVELLY = "gravelly"
    SOFT = "soft"
    AUTHORITATIVE = "authoritative"


@dataclass
class VoiceDescription:
    """Description of a voice for Maya TTS."""
    gender: VoiceGender = VoiceGender.NEUTRAL
    age_range: str = "30-40"
    pace: VoicePace = VoicePace.CONVERSATIONAL
    timbre: VoiceTimbre = VoiceTimbre.CLEAR
    tone: str = "calm and measured"
    accent: Optional[str] = None
    
    def to_description_string(self) -> str:
        """Convert to natural language description for Maya TTS."""
        parts = [
            f"{self.gender.value.capitalize()} voice",
            f"in their {self.age_range}s" if self.age_range else "",
            f"with a {self.timbre.value} timbre",
            f"speaking at a {self.pace.value} pace",
            f"in a {self.tone} tone"
        ]
        if self.accent:
            parts.append(f"with a {self.accent} accent")
        return ", ".join(filter(None, parts))


@dataclass
class ContactVoiceProfile:
    """Voice profile for a contact."""
    contact_name: str
    voice_description: VoiceDescription
    typical_emotions: list[str] = field(default_factory=list)
    speaking_style: str = "direct"
    relationship_type: str = "family"
    
    def to_description_string(self) -> str:
        """Get full description string including style."""
        base = self.voice_description.to_description_string()
        if self.speaking_style:
            base += f", speaking in a {self.speaking_style} manner"
        return base


@dataclass
class AudioResult:
    """Result from voice synthesis."""
    audio_path: str
    audio_base64: str
    duration_seconds: float


# Default coach voice (calm, supportive)
DEFAULT_COACH_VOICE = VoiceDescription(
    gender=VoiceGender.NEUTRAL,
    age_range="35-45",
    pace=VoicePace.CONVERSATIONAL,
    timbre=VoiceTimbre.WARM,
    tone="calm, supportive, and encouraging"
)


# Voice profile storage (in production, use proper storage)
voice_profiles: dict[str, ContactVoiceProfile] = {}

# Default profiles for common relationships
DEFAULT_PROFILES = {
    "difficult_mother": ContactVoiceProfile(
        contact_name="Mom",
        voice_description=VoiceDescription(
            gender=VoiceGender.FEMALE,
            age_range="55-65",
            pace=VoicePace.CONVERSATIONAL,
            timbre=VoiceTimbre.CLEAR,
            tone="guilt-inducing and emotionally charged"
        ),
        typical_emotions=["frustrated", "hurt", "disappointed", "accusatory"],
        speaking_style="passive-aggressive with sighs",
        relationship_type="family"
    ),
    "difficult_father": ContactVoiceProfile(
        contact_name="Dad",
        voice_description=VoiceDescription(
            gender=VoiceGender.MALE,
            age_range="55-65",
            pace=VoicePace.SLOW,
            timbre=VoiceTimbre.AUTHORITATIVE,
            tone="dismissive and controlling"
        ),
        typical_emotions=["stern", "disappointed", "dismissive"],
        speaking_style="direct and commanding",
        relationship_type="family"
    ),
    "anxious_partner": ContactVoiceProfile(
        contact_name="Partner",
        voice_description=VoiceDescription(
            gender=VoiceGender.NEUTRAL,
            age_range="30-40",
            pace=VoicePace.FAST,
            timbre=VoiceTimbre.SOFT,
            tone="worried and needing reassurance"
        ),
        typical_emotions=["anxious", "worried", "insecure"],
        speaking_style="rapid with interruptions",
        relationship_type="romantic"
    ),
    "demanding_boss": ContactVoiceProfile(
        contact_name="Boss",
        voice_description=VoiceDescription(
            gender=VoiceGender.NEUTRAL,
            age_range="45-55",
            pace=VoicePace.FAST,
            timbre=VoiceTimbre.AUTHORITATIVE,
            tone="impatient and demanding"
        ),
        typical_emotions=["frustrated", "impatient", "critical"],
        speaking_style="clipped and business-like",
        relationship_type="professional"
    )
}


class VoiceSynthesizer:
    """Client for Maya TTS voice synthesis."""
    
    def __init__(self, base_url: Optional[str] = None):
        self.base_url = base_url or os.getenv("MAYA_TTS_URL", "http://127.0.0.1:8765")
        self.timeout = 30.0
        self._client: Optional[httpx.AsyncClient] = None
    
    async def _get_client(self) -> httpx.AsyncClient:
        """Get or create HTTP client."""
        if self._client is None:
            self._client = httpx.AsyncClient(timeout=self.timeout)
        return self._client
    
    async def close(self):
        """Close the HTTP client."""
        if self._client:
            await self._client.aclose()
            self._client = None
    
    async def health_check(self) -> dict[str, Any]:
        """Check if Maya TTS server is healthy."""
        try:
            client = await self._get_client()
            response = await client.get(f"{self.base_url}/health")
            response.raise_for_status()
            return response.json()
        except Exception as e:
            logger.error(f"Maya TTS health check failed: {e}")
            return {"status": "unhealthy", "error": str(e)}
    
    async def speak_as_contact(
        self,
        text: str,
        contact_name: str,
        emotion: Optional[str] = None,
        persona_style: Optional[str] = None
    ) -> dict[str, Any]:
        """Generate speech as a contact.
        
        Args:
            text: What to say
            contact_name: Name of the contact
            emotion: Current emotion (optional)
            persona_style: Persona style like "guilt-tripping", "dismissive" (optional)
            
        Returns:
            Audio result with path and base64 data
        """
        # Get voice profile
        profile = voice_profiles.get(contact_name.lower())
        
        if not profile:
            # Try to match by persona style
            if persona_style:
                style_map = {
                    "guilt-tripping": "difficult_mother",
                    "dismissive": "difficult_father",
                    "controlling": "demanding_boss",
                    "volatile": "anxious_partner",
                    "passive-aggressive": "difficult_mother"
                }
                default_key = style_map.get(persona_style.lower())
                if default_key and default_key in DEFAULT_PROFILES:
                    profile = DEFAULT_PROFILES[default_key]
                    profile.contact_name = contact_name
        
        if not profile:
            # Create default profile
            profile = ContactVoiceProfile(
                contact_name=contact_name,
                voice_description=VoiceDescription(
                    gender=VoiceGender.NEUTRAL,
                    age_range="40-50",
                    pace=VoicePace.CONVERSATIONAL,
                    timbre=VoiceTimbre.CLEAR,
                    tone="neutral"
                )
            )
        
        # Build voice description
        voice_desc = profile.to_description_string()
        
        # Add current emotion
        emotion_tags = []
        if emotion:
            emotion_tags.append(emotion)
        if profile.typical_emotions:
            emotion_tags.extend(profile.typical_emotions[:2])  # Add up to 2 typical emotions
        
        # Try to call Maya TTS server
        try:
            client = await self._get_client()
            response = await client.post(
                f"{self.base_url}/speak_as_contact",
                json={
                    "text": text,
                    "voice_description": voice_desc,
                    "emotion_tags": list(set(emotion_tags))  # Dedupe
                }
            )
            response.raise_for_status()
            return {
                "status": "success",
                **response.json()
            }
        except httpx.ConnectError:
            logger.warning("Maya TTS server not available, returning placeholder")
            return _placeholder_audio_result(text, contact_name, "contact")
        except Exception as e:
            logger.error(f"speak_as_contact failed: {e}")
            return {"status": "error", "error": str(e)}
    
    async def speak_as_coach(
        self,
        text: str,
        tone: str = "supportive",
        emotion: Optional[str] = None
    ) -> dict[str, Any]:
        """Generate speech as the coach.
        
        Args:
            text: What to say
            tone: Tone of voice (supportive, gentle, firm, encouraging)
            emotion: Current emotion (optional)
            
        Returns:
            Audio result with path and base64 data
        """
        # Build coach voice description
        voice_desc = DEFAULT_COACH_VOICE.to_description_string()
        
        # Adjust tone
        tone_mapping = {
            "supportive": "warm and encouraging",
            "gentle": "soft and understanding",
            "firm": "clear and direct but kind",
            "encouraging": "upbeat and motivating",
            "reflective": "thoughtful and contemplative"
        }
        adjusted_tone = tone_mapping.get(tone.lower(), tone)
        voice_desc = voice_desc.replace(DEFAULT_COACH_VOICE.tone, adjusted_tone)
        
        try:
            client = await self._get_client()
            response = await client.post(
                f"{self.base_url}/speak_reflection",
                json={
                    "text": text,
                    "voice_description": voice_desc,
                    "tone": tone
                }
            )
            response.raise_for_status()
            return {
                "status": "success",
                **response.json()
            }
        except httpx.ConnectError:
            logger.warning("Maya TTS server not available, returning placeholder")
            return _placeholder_audio_result(text, "Coach", "coach")
        except Exception as e:
            logger.error(f"speak_as_coach failed: {e}")
            return {"status": "error", "error": str(e)}
    
    async def preview_voice(
        self,
        voice_description: str,
        sample_text: str = "Hello, this is how I sound."
    ) -> dict[str, Any]:
        """Preview a voice with sample text.
        
        Args:
            voice_description: Natural language voice description
            sample_text: Text to speak
            
        Returns:
            Audio result
        """
        try:
            client = await self._get_client()
            response = await client.post(
                f"{self.base_url}/preview_voice",
                json={
                    "voice_description": voice_description,
                    "sample_text": sample_text
                }
            )
            response.raise_for_status()
            return {
                "status": "success",
                **response.json()
            }
        except httpx.ConnectError:
            logger.warning("Maya TTS server not available, returning placeholder")
            return _placeholder_audio_result(sample_text, "Preview", "preview")
        except Exception as e:
            logger.error(f"preview_voice failed: {e}")
            return {"status": "error", "error": str(e)}


def _placeholder_audio_result(text: str, speaker: str, voice_type: str) -> dict[str, Any]:
    """Return a placeholder result when Maya TTS is not available."""
    # Estimate duration (roughly 150 words per minute)
    word_count = len(text.split())
    duration = max(1.0, word_count / 2.5)  # ~150 wpm
    
    return {
        "status": "placeholder",
        "message": "Maya TTS server not available. Audio generation simulated.",
        "speaker": speaker,
        "voice_type": voice_type,
        "text": text,
        "duration_seconds": duration,
        "audio_path": None,
        "audio_base64": None
    }


def get_voice_profile(contact_name: str) -> Optional[ContactVoiceProfile]:
    """Get voice profile for a contact.
    
    Args:
        contact_name: Name of the contact
        
    Returns:
        Voice profile if found
    """
    return voice_profiles.get(contact_name.lower())


def set_voice_profile(
    contact_name: str,
    gender: str = "neutral",
    age_range: str = "40-50",
    timbre: str = "clear",
    pace: str = "conversational",
    tone: str = "neutral",
    accent: Optional[str] = None,
    typical_emotions: Optional[list[str]] = None,
    speaking_style: str = "direct",
    relationship_type: str = "family"
) -> dict[str, Any]:
    """Set voice profile for a contact.
    
    Args:
        contact_name: Name of the contact
        gender: male, female, or neutral
        age_range: Age range like "30-40"
        timbre: Voice quality (warm, clear, gravelly, soft, authoritative)
        pace: Speaking pace (slow, conversational, fast)
        tone: Emotional tone description
        accent: Optional accent
        typical_emotions: List of typical emotions
        speaking_style: How they speak
        relationship_type: family, friend, romantic, professional
        
    Returns:
        Created profile info
    """
    try:
        voice_gender = VoiceGender(gender.lower())
    except ValueError:
        voice_gender = VoiceGender.NEUTRAL
    
    try:
        voice_pace = VoicePace(pace.lower())
    except ValueError:
        voice_pace = VoicePace.CONVERSATIONAL
    
    try:
        voice_timbre = VoiceTimbre(timbre.lower())
    except ValueError:
        voice_timbre = VoiceTimbre.CLEAR
    
    profile = ContactVoiceProfile(
        contact_name=contact_name,
        voice_description=VoiceDescription(
            gender=voice_gender,
            age_range=age_range,
            pace=voice_pace,
            timbre=voice_timbre,
            tone=tone,
            accent=accent
        ),
        typical_emotions=typical_emotions or [],
        speaking_style=speaking_style,
        relationship_type=relationship_type
    )
    
    voice_profiles[contact_name.lower()] = profile
    
    return {
        "status": "success",
        "contact": contact_name,
        "voice_description": profile.to_description_string(),
        "typical_emotions": profile.typical_emotions,
        "speaking_style": profile.speaking_style
    }


def infer_voice_profile(
    contact_name: str,
    messages: list[dict],
    relationship_hint: Optional[str] = None
) -> dict[str, Any]:
    """Infer a voice profile from message history.
    
    Analyzes messages to determine likely voice characteristics.
    
    Args:
        contact_name: Name of the contact
        messages: List of messages with text and is_from_me fields
        relationship_hint: Optional hint about relationship type
        
    Returns:
        Inferred profile info
    """
    from conflict_analysis import ConflictAnalyzer, PersonaStyle
    
    # Analyze messages
    analyzer = ConflictAnalyzer()
    their_messages = [m["text"] for m in messages if not m.get("is_from_me", False)]
    
    # Detect communication style
    style_scores = {style: 0 for style in PersonaStyle}
    
    for text in their_messages:
        detected = analyzer._detect_communication_style(text)
        for style, confidence in detected.items():
            style_scores[style] = max(style_scores.get(style, 0), confidence)
    
    # Get dominant style
    dominant_style = max(style_scores.items(), key=lambda x: x[1])
    
    # Map style to voice characteristics
    style_voice_map = {
        PersonaStyle.GUILT_TRIPPING: {
            "tone": "guilt-inducing and emotionally charged",
            "timbre": "soft",
            "typical_emotions": ["hurt", "disappointed", "accusatory"]
        },
        PersonaStyle.DISMISSIVE: {
            "tone": "dismissive and aloof",
            "timbre": "authoritative",
            "typical_emotions": ["annoyed", "disinterested", "superior"]
        },
        PersonaStyle.VOLATILE: {
            "tone": "unpredictable and intense",
            "timbre": "clear",
            "typical_emotions": ["angry", "hurt", "explosive"]
        },
        PersonaStyle.PASSIVE_AGGRESSIVE: {
            "tone": "subtly hostile with fake pleasantness",
            "timbre": "clear",
            "typical_emotions": ["resentful", "sarcastic", "bitter"]
        },
        PersonaStyle.CONTROLLING: {
            "tone": "demanding and commanding",
            "timbre": "authoritative",
            "typical_emotions": ["impatient", "frustrated", "stern"]
        },
        PersonaStyle.VICTIM: {
            "tone": "helpless and wounded",
            "timbre": "soft",
            "typical_emotions": ["hurt", "sad", "overwhelmed"]
        }
    }
    
    voice_traits = style_voice_map.get(dominant_style[0], {
        "tone": "neutral",
        "timbre": "clear",
        "typical_emotions": []
    })
    
    # Create and store profile
    result = set_voice_profile(
        contact_name=contact_name,
        gender="neutral",  # Could be inferred from name/messages
        age_range="40-60",  # Default for parent figure
        timbre=voice_traits.get("timbre", "clear"),
        pace="conversational",
        tone=voice_traits.get("tone", "neutral"),
        typical_emotions=voice_traits.get("typical_emotions", []),
        speaking_style=dominant_style[0].value.replace("-", " "),
        relationship_type=relationship_hint or "family"
    )
    
    result["inferred_from"] = {
        "message_count": len(their_messages),
        "dominant_style": dominant_style[0].value,
        "style_confidence": dominant_style[1]
    }
    
    return result


def list_default_profiles() -> list[dict[str, Any]]:
    """List available default voice profiles.
    
    Returns:
        List of default profile summaries
    """
    return [
        {
            "key": key,
            "name": profile.contact_name,
            "description": profile.to_description_string(),
            "relationship": profile.relationship_type,
            "typical_emotions": profile.typical_emotions
        }
        for key, profile in DEFAULT_PROFILES.items()
    ]


# Global synthesizer instance
_synthesizer: Optional[VoiceSynthesizer] = None


def get_synthesizer() -> VoiceSynthesizer:
    """Get or create the global voice synthesizer."""
    global _synthesizer
    if _synthesizer is None:
        _synthesizer = VoiceSynthesizer()
    return _synthesizer


async def speak_as_contact(
    text: str,
    contact_name: str,
    emotion: Optional[str] = None,
    persona_style: Optional[str] = None
) -> dict[str, Any]:
    """Generate speech as a contact (convenience function).
    
    Args:
        text: What to say
        contact_name: Name of the contact
        emotion: Current emotion
        persona_style: Persona style
        
    Returns:
        Audio result
    """
    synth = get_synthesizer()
    return await synth.speak_as_contact(text, contact_name, emotion, persona_style)


async def speak_as_coach(
    text: str,
    tone: str = "supportive",
    emotion: Optional[str] = None
) -> dict[str, Any]:
    """Generate speech as the coach (convenience function).
    
    Args:
        text: What to say
        tone: Tone of voice
        emotion: Current emotion
        
    Returns:
        Audio result
    """
    synth = get_synthesizer()
    return await synth.speak_as_coach(text, tone, emotion)
