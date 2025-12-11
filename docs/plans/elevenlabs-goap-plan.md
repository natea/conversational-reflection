# ElevenLabs Integration GOAP Plan

**Goal:** Replace Deepgram (STT) and Cartesia (TTS) with ElevenLabs while maintaining all emotive features, Pipecat orchestration, and Daily.co WebRTC transport.

**Planning Algorithm:** Goal-Oriented Action Planning (GOAP) with A* pathfinding
**Current State:** Deepgram STT + Cartesia TTS + Emotive processor active
**Goal State:** ElevenLabs STT + ElevenLabs TTS + Emotive processor active (with ElevenLabs emotion mapping)

---

## State Space Analysis

### Current State
```python
{
  "stt_provider": "deepgram",
  "tts_provider": "cartesia",
  "emotive_processor_exists": True,
  "emotive_processor_supports_elevenlabs": False,
  "pipecat_elevenlabs_available": False,
  "env_vars_configured": False,
  "dependencies_installed": False,
  "backend_updated": False,
  "adapter_updated": False,
  "tests_passing": False,
  "interruption_working": False
}
```

### Goal State
```python
{
  "stt_provider": "elevenlabs",
  "tts_provider": "elevenlabs",
  "emotive_processor_exists": True,
  "emotive_processor_supports_elevenlabs": True,
  "pipecat_elevenlabs_available": True,
  "env_vars_configured": True,
  "dependencies_installed": True,
  "backend_updated": True,
  "adapter_updated": True,
  "tests_passing": True,
  "interruption_working": True
}
```

---

## GOAP Action Library

### Action 1: Research ElevenLabs Pipecat Integration
**Type:** LLM + Code (Hybrid)
**Cost:** 1 (Low - information gathering)
**Tool Group:** [WebFetch, Read, Grep]
**Execution:** LLM-based with code validation

**Preconditions:**
- `docs_accessible`: True
- `internet_available`: True

**Effects:**
- `elevenlabs_patterns_understood`: True
- `api_requirements_known`: True
- `emotion_capabilities_documented`: True

**Implementation:**
```python
async def research_integration():
    # Already completed - see reference links
    # - https://github.com/pipecat-ai/pipecat/blob/main/examples/foundational/07d-interruptible-elevenlabs-http.py
    # - https://docs.pipecat.ai/server/services/stt/elevenlabs

    key_findings = {
        "imports": [
            "pipecat.services.elevenlabs.stt.ElevenLabsSTTService",
            "pipecat.services.elevenlabs.tts.ElevenLabsHttpTTSService"
        ],
        "requirements": [
            "aiohttp.ClientSession for HTTP transport",
            "ELEVENLABS_API_KEY environment variable",
            "voice_id parameter for TTS"
        ],
        "emotion_support": {
            "method": "voice_settings",
            "parameters": ["stability", "similarity_boost", "style", "use_speaker_boost"],
            "no_ssml": True,  # Different from Cartesia
            "model_affects_expressiveness": True
        },
        "interruption": {
            "vad": "SileroVADAnalyzer",
            "turn_analyzer": "SmartTurnAnalyzerV3",
            "stop_secs": 0.2
        }
    }
    return key_findings
```

**Validation:**
- [ ] ElevenLabs services documented
- [ ] Emotion parameter mapping understood
- [ ] HTTP transport pattern identified
- [ ] Interruption handling confirmed

**Rollback:** N/A (read-only)

---

### Action 2: Update Dependencies
**Type:** Code (Deterministic)
**Cost:** 2 (Medium - requires validation)
**Tool Group:** [Edit, Bash]
**Execution:** Code-based with testing

**Preconditions:**
- `elevenlabs_patterns_understood`: True
- `pyproject.toml_exists`: True

**Effects:**
- `dependencies_installed`: True
- `pipecat_elevenlabs_available`: True

**Implementation:**
```python
async def update_dependencies():
    # Update backend/pyproject.toml
    # Change: pipecat-ai[webrtc,daily,silero,deepgram,openai,cartesia,local-smart-turn-v3,runner,mcp]
    # To:     pipecat-ai[webrtc,daily,silero,elevenlabs,openai,local-smart-turn-v3,runner,mcp]

    # Remove: deepgram, cartesia
    # Add: elevenlabs

    # Run: uv sync
    # Verify imports work
```

**Files Modified:**
- `/Users/nateaune/Documents/code/conversational-reflection/backend/pyproject.toml`

**Validation:**
- [ ] `pipecat.services.elevenlabs.stt` imports successfully
- [ ] `pipecat.services.elevenlabs.tts` imports successfully
- [ ] No import errors in tests
- [ ] `uv sync` completes without errors

**Rollback:**
```bash
git checkout backend/pyproject.toml
uv sync
```

---

### Action 3: Configure Environment Variables
**Type:** Code (Deterministic)
**Cost:** 1 (Low - simple file edit)
**Tool Group:** [Edit]
**Execution:** Code-based

**Preconditions:**
- `dependencies_installed`: True
- `elevenlabs_account_created`: True (manual prerequisite)

**Effects:**
- `env_vars_configured`: True
- `api_credentials_available`: True

**Implementation:**
```bash
# Add to backend/.env
ELEVENLABS_API_KEY=your_api_key_here
ELEVENLABS_VOICE_ID=your_voice_id_here  # For emotive voice

# Optional: Keep old keys for rollback testing
# DEEPGRAM_API_KEY=...
# CARTESIA_API_KEY=...
# CARTESIA_VOICE_ID=...
```

**Files Modified:**
- `/Users/nateaune/Documents/code/conversational-reflection/backend/.env` (not committed)
- Documentation update for `.env.example`

**Validation:**
- [ ] `os.getenv("ELEVENLABS_API_KEY")` returns valid key
- [ ] `os.getenv("ELEVENLABS_VOICE_ID")` returns valid voice ID
- [ ] Keys tested with ElevenLabs API

**Rollback:**
- Remove ElevenLabs keys, re-enable Deepgram/Cartesia

---

### Action 4: Update Backend Bot Implementation
**Type:** Hybrid (LLM + Code)
**Cost:** 4 (High - critical path changes)
**Tool Group:** [Read, Edit, Grep]
**Execution:** Mixed (LLM plans, code validates)

**Preconditions:**
- `dependencies_installed`: True
- `env_vars_configured`: True
- `elevenlabs_patterns_understood`: True

**Effects:**
- `backend_updated`: True
- `stt_provider`: "elevenlabs"
- `tts_provider`: "elevenlabs"
- `http_transport_configured`: True

**Implementation:**

**File:** `/Users/nateaune/Documents/code/conversational-reflection/backend/bot.py`

**Changes Required:**

1. **Update Imports (Lines 66-73)**
```python
# REMOVE:
# from pipecat.services.deepgram.stt import DeepgramSTTService
# from pipecat.services.cartesia.tts import CartesiaTTSService

# ADD:
from pipecat.services.elevenlabs.stt import ElevenLabsSTTService
from pipecat.services.elevenlabs.tts import ElevenLabsHttpTTSService
import aiohttp  # Required for HTTP transport
```

2. **Update run_bot() function - STT initialization (Lines 545-548)**
```python
# REMOVE:
# stt = DeepgramSTTService(api_key=os.getenv("DEEPGRAM_API_KEY"))

# ADD:
# Create aiohttp session for ElevenLabs HTTP transport
session = aiohttp.ClientSession()

stt = ElevenLabsSTTService(
    api_key=os.getenv("ELEVENLABS_API_KEY"),
    session=session
)
```

3. **Update TTS initialization (Lines 550-568)**
```python
# REMOVE:
# emotive_voice_id = os.getenv("CARTESIA_VOICE_ID", "6ccbfb76-1fc6-48f7-b71d-91ac6298247b")
# from pipecat.services.cartesia.tts import GenerationConfig
# tts = CartesiaTTSService(
#     api_key=os.getenv("CARTESIA_API_KEY"),
#     voice_id=emotive_voice_id,
#     model="sonic-3",
#     params=CartesiaTTSService.InputParams(
#         generation_config=GenerationConfig(emotion="neutral")
#     ),
# )

# ADD:
emotive_voice_id = os.getenv(
    "ELEVENLABS_VOICE_ID",
    "21m00Tcm4TlvDq8ikWAM"  # Default: Rachel (expressive female voice)
)

tts = ElevenLabsHttpTTSService(
    api_key=os.getenv("ELEVENLABS_API_KEY"),
    voice_id=emotive_voice_id,
    session=session,
    # Default voice settings (will be overridden by emotive processor)
    stability=0.5,
    similarity_boost=0.75,
    style=0.0,
    use_speaker_boost=False,
)
logger.info(f"🎤 ElevenLabs TTS initialized with voice: {emotive_voice_id[:8]}...")
```

4. **Update TTS emotion callback (Lines 572-586)**
```python
# REMOVE Cartesia-specific GenerationConfig callback
# async def update_tts_emotion(config: dict):
#     emotion = config.get("emotion", "neutral")
#     speed = config.get("speed")
#     volume = config.get("volume")
#     new_config = GenerationConfig(emotion=emotion, speed=speed, volume=volume)
#     tts._settings["generation_config"] = new_config

# ADD ElevenLabs-specific voice_settings callback
async def update_tts_emotion(config: dict):
    """Update TTS voice_settings with new emotion parameters."""
    # ElevenLabs uses voice_settings dict instead of GenerationConfig
    voice_settings = config.get("voice_settings", {})

    # Update the TTS service's voice settings
    if voice_settings:
        tts._stability = voice_settings.get("stability", 0.5)
        tts._similarity_boost = voice_settings.get("similarity_boost", 0.75)
        tts._style = voice_settings.get("style", 0.0)
        tts._use_speaker_boost = voice_settings.get("use_speaker_boost", False)

        logger.debug(
            f"🎭 Updated TTS voice_settings: "
            f"stability={tts._stability}, style={tts._style}"
        )
```

5. **Update emotive processor initialization (Lines 732-745)**
```python
# Update log message to reflect ElevenLabs
emotive_processor = EmotiveTTSProcessor(
    get_emotional_state=get_emotional_state,
    get_roleplay_state=get_roleplay_state,
    use_ssml=False,  # CRITICAL: ElevenLabs doesn't support SSML emotion tags
    update_tts_config=update_tts_emotion,
    log_emotions=True,
)
logger.info("🎭 EmotiveTTSProcessor initialized for ElevenLabs (voice_settings control)")
logger.info("🎭 Roleplay mode available - will use direct emotion injection for low latency")
```

6. **Add session cleanup (add to bot() or run_bot())**
```python
# Add cleanup handler
async def cleanup():
    await session.close()

# Ensure cleanup on exit
try:
    await run_bot(transport, runner_args)
finally:
    await cleanup()
```

**Validation:**
- [ ] Bot starts without import errors
- [ ] STT service initializes successfully
- [ ] TTS service initializes successfully
- [ ] aiohttp session created and managed
- [ ] Voice output works (basic test)
- [ ] No Cartesia/Deepgram references remain

**Rollback:**
```bash
git checkout backend/bot.py
# Re-enable Deepgram/Cartesia environment variables
```

---

### Action 5: Update Emotive TTS Processor
**Type:** Hybrid (LLM + Code)
**Cost:** 5 (High - complex emotion mapping logic)
**Tool Group:** [Read, Edit]
**Execution:** Mixed

**Preconditions:**
- `backend_updated`: True
- `elevenlabs_emotion_mapping_known`: True

**Effects:**
- `emotive_processor_supports_elevenlabs`: True
- `adapter_updated`: True
- `emotion_mapping_complete`: True

**Implementation:**

**File:** `/Users/nateaune/Documents/code/conversational-reflection/backend/emotive_tts_processor.py`

**Changes Required:**

1. **Update `generate_cartesia_config()` to support ElevenLabs (Lines 264-278)**
```python
def generate_elevenlabs_config(state: EmotiveVoiceState) -> Dict[str, Any]:
    """Generate ElevenLabs voice_settings from emotional state.

    ElevenLabs uses voice_settings dict instead of SSML or emotion strings.
    Maps emotional state to stability, similarity_boost, style parameters.
    """
    # Use existing emotion selection logic
    from emotive_tts_processor import CARTESIA_EMOTION_MAP, PrimaryEmotion

    # Determine intensity-based preset
    if state.intensity < 0.35:
        intensity_level = "low"
    elif state.intensity < 0.7:
        intensity_level = "medium"
    else:
        intensity_level = "high"

    # Map primary emotion to ElevenLabs voice settings
    # Based on the elevenlabs.ts adapter patterns
    emotion_presets = {
        PrimaryEmotion.JOY: {
            "low": {"stability": 0.5, "similarity_boost": 0.75, "style": 0.3, "use_speaker_boost": False},
            "medium": {"stability": 0.3, "similarity_boost": 0.75, "style": 0.6, "use_speaker_boost": True},
            "high": {"stability": 0.2, "similarity_boost": 0.7, "style": 0.8, "use_speaker_boost": True},
        },
        PrimaryEmotion.SADNESS: {
            "low": {"stability": 0.6, "similarity_boost": 0.8, "style": 0.2, "use_speaker_boost": False},
            "medium": {"stability": 0.7, "similarity_boost": 0.8, "style": 0.3, "use_speaker_boost": False},
            "high": {"stability": 0.8, "similarity_boost": 0.85, "style": 0.4, "use_speaker_boost": False},
        },
        PrimaryEmotion.ANGER: {
            "low": {"stability": 0.4, "similarity_boost": 0.75, "style": 0.5, "use_speaker_boost": True},
            "medium": {"stability": 0.2, "similarity_boost": 0.7, "style": 0.8, "use_speaker_boost": True},
            "high": {"stability": 0.1, "similarity_boost": 0.65, "style": 0.9, "use_speaker_boost": True},
        },
        PrimaryEmotion.FEAR: {
            "low": {"stability": 0.5, "similarity_boost": 0.75, "style": 0.4, "use_speaker_boost": False},
            "medium": {"stability": 0.4, "similarity_boost": 0.75, "style": 0.5, "use_speaker_boost": True},
            "high": {"stability": 0.3, "similarity_boost": 0.7, "style": 0.6, "use_speaker_boost": True},
        },
        PrimaryEmotion.DISGUST: {
            "low": {"stability": 0.6, "similarity_boost": 0.8, "style": 0.3, "use_speaker_boost": False},
            "medium": {"stability": 0.5, "similarity_boost": 0.8, "style": 0.4, "use_speaker_boost": False},
            "high": {"stability": 0.4, "similarity_boost": 0.75, "style": 0.5, "use_speaker_boost": False},
        },
        PrimaryEmotion.SURPRISE: {
            "low": {"stability": 0.4, "similarity_boost": 0.75, "style": 0.5, "use_speaker_boost": True},
            "medium": {"stability": 0.3, "similarity_boost": 0.7, "style": 0.7, "use_speaker_boost": True},
            "high": {"stability": 0.2, "similarity_boost": 0.65, "style": 0.8, "use_speaker_boost": True},
        },
        PrimaryEmotion.NEUTRAL: {
            "low": {"stability": 0.5, "similarity_boost": 0.75, "style": 0.0, "use_speaker_boost": False},
            "medium": {"stability": 0.5, "similarity_boost": 0.75, "style": 0.0, "use_speaker_boost": False},
            "high": {"stability": 0.5, "similarity_boost": 0.75, "style": 0.0, "use_speaker_boost": False},
        },
    }

    # Get preset for this emotion and intensity
    preset = emotion_presets.get(
        state.primary_emotion,
        emotion_presets[PrimaryEmotion.NEUTRAL]
    )[intensity_level]

    # Apply body state modifiers (energy affects style)
    if state.body_state:
        # High energy increases style exaggeration
        if state.body_state.energy > 0.7:
            preset["style"] = min(1.0, preset["style"] * 1.2)
        # Low energy decreases style
        elif state.body_state.energy < 0.3:
            preset["style"] = preset["style"] * 0.7

    return {"voice_settings": preset}
```

2. **Update EmotiveTTSProcessor to handle both SSML and voice_settings (Lines 495-573)**
```python
async def process_frame(self, frame: Frame, direction: FrameDirection) -> None:
    """Process frames and apply emotional state to TTS generation"""
    await super().process_frame(frame, direction)

    if direction == FrameDirection.DOWNSTREAM:
        if isinstance(frame, LLMFullResponseStartFrame):
            self._in_llm_response = True
            self._emotion_applied_for_utterance = False
            logger.debug("🎭 LLM response started - will apply emotion to first text frame")

        elif isinstance(frame, LLMFullResponseEndFrame):
            self._in_llm_response = False
            self._emotion_applied_for_utterance = False
            logger.debug("🎭 LLM response ended")

        elif isinstance(frame, (TextFrame, TTSTextFrame)):
            if not self._emotion_applied_for_utterance:
                state = await self._get_current_state()

                # Determine TTS provider type
                # For ElevenLabs: use_ssml should be False, rely on voice_settings
                # For Cartesia: use_ssml can be True

                if self._use_ssml:
                    # SSML mode (Cartesia, Maya)
                    original_text = frame.text if hasattr(frame, 'text') else str(frame)
                    ssml_prefix = generate_ssml_prefix(state, self._use_ssml)

                    if ssml_prefix:
                        modified_text = f"{ssml_prefix} {original_text}"
                        if isinstance(frame, TTSTextFrame):
                            frame = TTSTextFrame(text=modified_text)
                        else:
                            frame = TextFrame(text=modified_text)
                        logger.info(f"🎭 Applied SSML tags: {ssml_prefix}")
                else:
                    # Voice settings mode (ElevenLabs)
                    # Text passes through unchanged
                    # Emotion applied via update_tts_config callback
                    logger.debug("🎭 ElevenLabs mode - text unchanged, emotion via voice_settings")

                # Update TTS config if callback provided
                if self._update_tts_config:
                    # Generate config - will produce either Cartesia or ElevenLabs format
                    # based on the state and provider
                    config = generate_elevenlabs_config(state)  # Use new function
                    try:
                        await self._update_tts_config(config)
                        logger.info(f"🎭 Updated TTS config: {config}")
                    except Exception as e:
                        logger.warning(f"Failed to update TTS config: {e}")

                self._emotion_applied_for_utterance = True

                # Log emotion changes
                current_emotion = state.primary_emotion.value
                if self._log_emotions and current_emotion != self._last_emotion:
                    logger.info(
                        f"🎭 Emotion: {current_emotion} "
                        f"(intensity: {state.intensity:.0%})"
                    )
                    self._last_emotion = current_emotion

    await self.push_frame(frame, direction)
```

3. **Add helper function to detect provider (optional optimization)**
```python
def detect_tts_provider() -> str:
    """Detect which TTS provider is being used based on environment."""
    if os.getenv("ELEVENLABS_API_KEY"):
        return "elevenlabs"
    elif os.getenv("CARTESIA_API_KEY"):
        return "cartesia"
    else:
        return "unknown"
```

**Files Modified:**
- `/Users/nateaune/Documents/code/conversational-reflection/backend/emotive_tts_processor.py`

**Validation:**
- [ ] `generate_elevenlabs_config()` produces correct voice_settings
- [ ] Emotion intensity maps correctly (low/medium/high)
- [ ] Body state modifiers apply correctly
- [ ] Process frame doesn't inject SSML for ElevenLabs
- [ ] Config callback receives proper format
- [ ] All emotion types supported (joy, sadness, anger, fear, disgust, surprise, neutral)

**Rollback:**
```bash
git checkout backend/emotive_tts_processor.py
```

---

### Action 6: Update Frontend TTS Adapter (Optional)
**Type:** Code (Deterministic)
**Cost:** 2 (Medium - TypeScript updates)
**Tool Group:** [Read, Edit]
**Execution:** Code-based

**Preconditions:**
- `adapter_updated`: True (backend)
- `frontend_uses_adapter`: True

**Effects:**
- `frontend_adapter_updated`: True
- `type_safety_maintained`: True

**Implementation:**

**File:** `/Users/nateaune/Documents/code/conversational-reflection/src/lib/emotive-tts-adapter/adapters/elevenlabs.ts`

**Analysis:** The ElevenLabs adapter stub is already implemented and looks correct. No changes needed unless:
1. You want to add additional emotion presets
2. You want to tune the voice settings based on testing

**Validation:**
- [ ] TypeScript compiles without errors
- [ ] Adapter exports correctly
- [ ] Voice settings match backend Python implementation

**Rollback:** N/A (already correct)

---

### Action 7: Test Basic Voice Pipeline
**Type:** Hybrid (LLM + Manual)
**Cost:** 3 (Medium - requires testing)
**Tool Group:** [Bash, Manual testing]
**Execution:** Mixed

**Preconditions:**
- `backend_updated`: True
- `env_vars_configured`: True
- `dependencies_installed`: True

**Effects:**
- `basic_voice_working`: True
- `stt_functional`: True
- `tts_functional`: True

**Implementation:**
```bash
# Start the bot
cd /Users/nateaune/Documents/code/conversational-reflection/backend
uv run bot.py --transport webrtc

# Test checklist:
# 1. Bot starts without errors
# 2. WebRTC connection established
# 3. Speech recognition working (ElevenLabs STT)
# 4. Voice synthesis working (ElevenLabs TTS)
# 5. Basic conversation functional
```

**Validation:**
- [ ] No import errors on startup
- [ ] STT service initializes: `✅ ElevenLabs STT initialized`
- [ ] TTS service initializes: `✅ ElevenLabs TTS initialized with voice: [id]`
- [ ] User speech transcribed correctly
- [ ] Bot voice output clear and audible
- [ ] No WebRTC connection errors

**Rollback:**
- Stop bot
- Revert to Deepgram/Cartesia configuration
- Restart

---

### Action 8: Test Emotive Voice Expression
**Type:** Hybrid (LLM + Manual)
**Cost:** 4 (High - complex validation)
**Tool Group:** [Bash, Manual testing]
**Execution:** Mixed

**Preconditions:**
- `basic_voice_working`: True
- `emotive_processor_supports_elevenlabs`: True
- `sable_mcp_active`: True

**Effects:**
- `emotion_expression_working`: True
- `voice_settings_applied`: True
- `emotive_features_verified`: True

**Implementation:**
```bash
# Test emotion expression scenarios
# 1. Trigger joy emotion
#    - Say something positive
#    - Expect: Lower stability, higher style in logs
#    - Listen: Voice should sound more expressive/excited

# 2. Trigger sadness emotion
#    - Say something sad
#    - Expect: Higher stability, lower style in logs
#    - Listen: Voice should sound more subdued

# 3. Trigger anger emotion
#    - Say something frustrating
#    - Expect: Very low stability, high style
#    - Listen: Voice should sound more intense

# Monitor logs for:
# 🎭 Updated TTS voice_settings: stability=X, style=Y
# 🎭 Emotion: [emotion] (intensity: X%)
```

**Validation:**
- [ ] Emotions detected by sable-mcp
- [ ] `feel_emotion` calls update state
- [ ] EmotiveTTSProcessor applies voice_settings
- [ ] TTS service receives updated settings
- [ ] Voice output reflects emotional state (audible difference)
- [ ] Intensity levels map correctly (low/medium/high)
- [ ] Body state affects voice settings (energy → style)

**Test Cases:**
| Emotion | Intensity | Expected stability | Expected style | Audible difference? |
|---------|-----------|-------------------|----------------|---------------------|
| Joy | 0.8 | 0.2 | 0.8 | High expressiveness |
| Sadness | 0.7 | 0.7 | 0.3 | Subdued, calm |
| Anger | 0.9 | 0.1 | 0.9 | Intense, forceful |
| Neutral | 0.0 | 0.5 | 0.0 | Baseline voice |

**Rollback:**
- Log issues for debugging
- May need to tune emotion presets

---

### Action 9: Test Interruption Handling
**Type:** Manual Testing
**Cost:** 3 (Medium - requires validation)
**Tool Group:** [Manual testing]
**Execution:** Manual

**Preconditions:**
- `basic_voice_working`: True
- `vad_configured`: True
- `turn_analyzer_configured`: True

**Effects:**
- `interruption_working`: True
- `turn_taking_smooth`: True

**Implementation:**
```bash
# Test interruption scenarios:
# 1. Start bot speaking (long response)
# 2. Interrupt mid-sentence
# 3. Verify:
#    - Bot stops speaking immediately
#    - User speech recognized
#    - Bot responds to new input
#    - No audio artifacts

# Monitor for:
# - VAD triggers: "User started speaking"
# - Turn analyzer: "Turn detected"
# - Pipeline cancellation: "TTSStopped"
```

**Validation:**
- [ ] VAD detects user speech during bot output
- [ ] Turn analyzer triggers interruption
- [ ] TTS stops cleanly (no audio glitches)
- [ ] STT captures interrupting speech
- [ ] Bot responds to new context
- [ ] No latency spikes (< 200ms response)

**Rollback:**
- Tune VAD parameters if needed
- Adjust `stop_secs` timing

---

### Action 10: Test Roleplay Mode
**Type:** Manual Testing
**Cost:** 3 (Medium - feature validation)
**Tool Group:** [Manual testing]
**Execution:** Manual

**Preconditions:**
- `emotion_expression_working`: True
- `roleplay_functions_registered`: True

**Effects:**
- `roleplay_mode_working`: True
- `character_voice_distinct`: True
- `scenario_switching_working`: True

**Implementation:**
```bash
# Test roleplay workflow:
# 1. Say: "Can you roleplay as my mom so I can practice a conversation?"
# 2. Verify:
#    - LLM calls start_roleplay("Mom", "angry", "receptive")
#    - Voice changes noticeably (character voice)
#    - Emotion reflects scenario (angry → receptive)

# 3. Progress through scenarios
# 4. Verify:
#    - set_roleplay_emotion() changes voice
#    - Coach voice (neutral) sounds like normal Ginger
#    - end_roleplay() returns to normal voice

# Monitor logs:
# 🎭 start_roleplay called: {...}
# 🎭 set_roleplay_emotion called: {...}
# 🎭 Roleplay [Mom]: emotion=angry
```

**Validation:**
- [ ] `start_roleplay` function calls work
- [ ] Character voice distinguishable from Ginger
- [ ] Emotion changes affect voice (angry vs receptive)
- [ ] Neutral emotion (debrief) sounds like normal Ginger
- [ ] `end_roleplay` restores normal voice
- [ ] Multiple scenarios work in sequence

**Rollback:**
- Roleplay functions are isolated
- Disable if issues found

---

### Action 11: Performance & Latency Testing
**Type:** Code + Manual
**Cost:** 2 (Medium - measurement)
**Tool Group:** [Bash, logging]
**Execution:** Hybrid

**Preconditions:**
- `basic_voice_working`: True
- `interruption_working`: True

**Effects:**
- `latency_acceptable`: True
- `performance_benchmarked`: True

**Implementation:**
```python
# Add timing instrumentation to bot.py
import time

# Measure STT latency
stt_start = time.time()
# ... STT processing ...
stt_latency = time.time() - stt_start
logger.info(f"⏱️ STT latency: {stt_latency*1000:.1f}ms")

# Measure TTS latency
tts_start = time.time()
# ... TTS processing ...
tts_latency = time.time() - tts_start
logger.info(f"⏱️ TTS latency: {tts_latency*1000:.1f}ms")

# Measure emotion processing
emotion_start = time.time()
# ... emotion state fetch ...
emotion_latency = time.time() - emotion_start
logger.info(f"⏱️ Emotion processing: {emotion_latency*1000:.1f}ms")
```

**Validation:**
- [ ] STT latency < 500ms
- [ ] TTS latency < 1000ms
- [ ] Emotion processing < 100ms
- [ ] Total response time < 2000ms
- [ ] No degradation vs Deepgram/Cartesia

**Acceptable Thresholds:**
| Metric | Target | Warning | Critical |
|--------|--------|---------|----------|
| STT | < 300ms | < 500ms | > 1000ms |
| TTS | < 800ms | < 1200ms | > 2000ms |
| Emotion | < 50ms | < 100ms | > 200ms |
| Total | < 1500ms | < 2500ms | > 3000ms |

**Rollback:**
- If latency unacceptable, investigate:
  - HTTP vs WebSocket (ElevenLabs uses HTTP)
  - Model selection (turbo vs multilingual)
  - Network conditions

---

### Action 12: Documentation & Cleanup
**Type:** LLM + Code
**Cost:** 2 (Medium - comprehensive updates)
**Tool Group:** [Write, Edit]
**Execution:** Hybrid

**Preconditions:**
- `tests_passing`: True
- `all_features_verified`: True

**Effects:**
- `documentation_complete`: True
- `deprecated_code_removed`: True

**Implementation:**

**Files to Update:**

1. **backend/bot.py docstring**
```python
"""Ginger Voice Bot - An emotionally-aware AI companion.

...

Required AI services:
- ElevenLabs (Speech-to-Text via Scribe v1)
- OpenAI (LLM)
- ElevenLabs (Text-to-Speech with emotion via voice_settings)

Changed from:
- Deepgram (STT) → ElevenLabs (STT)
- Cartesia (TTS) → ElevenLabs (TTS)
...
"""
```

2. **README.md or setup docs**
```markdown
## Environment Variables

Required:
- `ELEVENLABS_API_KEY` - ElevenLabs API key (get from https://elevenlabs.io)
- `ELEVENLABS_VOICE_ID` - Voice ID for TTS (default: Rachel - 21m00Tcm4TlvDq8ikWAM)
- `OPENAI_API_KEY` - OpenAI API key

Optional:
- Voice selection guide: https://elevenlabs.io/voice-library
- Emotive voices recommended: Bella, Rachel, Josh, Freya
```

3. **backend/emotive_tts_processor.py docstring**
```python
"""
Emotive TTS Processor for Pipecat

...

Supports multiple TTS providers:
- Cartesia: Uses SSML emotion tags
- ElevenLabs: Uses voice_settings (stability, similarity_boost, style)
- Maya: Uses SSML emotion tags
"""
```

4. **Remove deprecated code**
```bash
# Search for Deepgram/Cartesia references
grep -r "Deepgram\|Cartesia" backend/ --include="*.py"

# Remove or comment out unused imports
# Remove old generation_config code
# Clean up old emotion mapping logic
```

**Validation:**
- [ ] All docstrings updated
- [ ] README.md reflects new setup
- [ ] Environment variable docs complete
- [ ] No stale Deepgram/Cartesia references
- [ ] Migration guide added (optional)

**Rollback:** N/A (documentation only)

---

## Optimal Execution Plan (A* Path)

### Path Cost Analysis
```
Total actions: 12
Total cost: 34 points
Critical path: Actions 2 → 3 → 4 → 5 → 7 → 8
```

### Execution Sequence

**Phase 1: Research & Setup (Cost: 4)**
1. Action 1: Research ElevenLabs integration ✓ (Already complete)
2. Action 2: Update dependencies (Cost: 2)
3. Action 3: Configure environment variables (Cost: 1)

**Phase 2: Core Implementation (Cost: 11)**
4. Action 4: Update backend bot implementation (Cost: 4)
5. Action 5: Update emotive TTS processor (Cost: 5)
6. Action 6: Update frontend adapter (Cost: 2) [OPTIONAL - can skip]

**Phase 3: Validation (Cost: 13)**
7. Action 7: Test basic voice pipeline (Cost: 3)
8. Action 8: Test emotive voice expression (Cost: 4)
9. Action 9: Test interruption handling (Cost: 3)
10. Action 10: Test roleplay mode (Cost: 3)

**Phase 4: Optimization & Finalization (Cost: 4)**
11. Action 11: Performance & latency testing (Cost: 2)
12. Action 12: Documentation & cleanup (Cost: 2)

### Parallel Execution Opportunities

**Can Run in Parallel:**
- Actions 2 + 3 (dependencies + env vars)
- Actions 8 + 9 + 10 (all testing actions after basic pipeline works)
- Actions 11 + 12 (performance testing + docs)

**Must Run Sequentially:**
- 1 → 2 (research before dependencies)
- 2,3 → 4 (setup before implementation)
- 4 → 5 (backend before emotive processor)
- 5 → 7 (implementation before testing)
- 7 → 8,9,10 (basic test before advanced features)

### Replanning Triggers

**Monitor for these conditions that require replanning:**

1. **Action 4 fails** (backend update)
   - **Symptom:** Import errors, service initialization failures
   - **Replan:** Check dependency installation, verify API keys
   - **Alternative path:** Use hybrid approach (ElevenLabs TTS only, keep Deepgram STT)

2. **Action 8 fails** (emotive expression)
   - **Symptom:** No audible emotion differences, voice_settings not applied
   - **Replan:** Tune emotion presets, verify callback chain
   - **Alternative path:** Use simpler emotion mapping (binary: expressive vs neutral)

3. **Action 9 fails** (interruption)
   - **Symptom:** Interruptions don't work, audio glitches
   - **Replan:** Adjust VAD parameters, verify HTTP transport compatibility
   - **Alternative path:** Accept higher latency, tune stop_secs timing

4. **Action 11 fails** (performance)
   - **Symptom:** Latency > 3000ms, unacceptable user experience
   - **Replan:** Profile bottlenecks, optimize HTTP transport
   - **Alternative path:** Consider ElevenLabs WebSocket API (different implementation)

### Success Criteria

**Deployment Ready When:**
- ✅ All 12 actions completed successfully
- ✅ Voice quality meets or exceeds Cartesia baseline
- ✅ Latency within acceptable thresholds
- ✅ Emotive expression clearly audible
- ✅ Interruption handling smooth
- ✅ Roleplay mode functional
- ✅ No regressions in existing features
- ✅ Documentation complete

### Rollback Strategy

**Immediate Rollback (< 5 min):**
```bash
# Restore previous working state
cd /Users/nateaune/Documents/code/conversational-reflection/backend
git checkout backend/bot.py backend/emotive_tts_processor.py backend/pyproject.toml
uv sync

# Re-enable Deepgram/Cartesia in .env
# Comment out ELEVENLABS_* variables
# Uncomment DEEPGRAM_* and CARTESIA_* variables

# Restart bot
uv run bot.py --transport webrtc
```

**Partial Rollback (ElevenLabs TTS only):**
```python
# Keep ElevenLabs for TTS (better quality)
# Revert to Deepgram for STT (proven stable)
stt = DeepgramSTTService(api_key=os.getenv("DEEPGRAM_API_KEY"))
tts = ElevenLabsHttpTTSService(...)  # Keep ElevenLabs
```

**Full Migration Checkpoint:**
Before starting Action 4, create a checkpoint:
```bash
git add -A
git commit -m "checkpoint: before elevenlabs migration"
git tag elevenlabs-migration-checkpoint
```

---

## Implementation Recommendations

### Execution Strategy
1. **Use Claude Code Task tool for parallel execution:**
   - Spawn 3 agents in single message:
     - Agent 1: Actions 2+3 (dependencies + env)
     - Agent 2: Action 4 (backend update)
     - Agent 3: Action 5 (emotive processor)

2. **Batch all file operations:**
   - Read all files first (bot.py, emotive_tts_processor.py, pyproject.toml)
   - Apply all edits in parallel
   - Single validation pass

3. **Testing workflow:**
   - Action 7 (basic test) → checkpoint
   - Actions 8+9+10 (feature tests) in parallel
   - Action 11 (performance) → final validation

### Risk Mitigation

**High Risk Areas:**
1. **HTTP Transport compatibility** (Action 4)
   - ElevenLabs uses HTTP, not WebSocket
   - May affect latency vs Deepgram
   - Mitigation: Test early, profile thoroughly

2. **Emotion mapping fidelity** (Action 5)
   - ElevenLabs voice_settings vs Cartesia SSML
   - Different expressiveness models
   - Mitigation: A/B testing, user feedback

3. **Interruption handling** (Action 9)
   - HTTP may have different cancel semantics
   - Mitigation: Verify with SmartTurnAnalyzerV3

**Medium Risk Areas:**
- API key configuration (manual step)
- Voice ID selection (subjective quality)
- Performance variance (network dependent)

### Testing Checklist

**Automated Tests:**
- [ ] Import tests pass
- [ ] Service initialization tests pass
- [ ] Emotion mapping unit tests pass
- [ ] Config generation tests pass

**Manual Tests:**
- [ ] Basic conversation works
- [ ] Emotion expression audible
- [ ] Interruption smooth
- [ ] Roleplay mode functional
- [ ] Latency acceptable
- [ ] No regressions

**User Acceptance:**
- [ ] Voice quality acceptable
- [ ] Emotional expression natural
- [ ] Response time reasonable
- [ ] Overall experience improved or equivalent

---

## Cost-Benefit Analysis

### Costs
- **Development time:** ~4-6 hours (with GOAP planning)
- **Testing time:** ~2-3 hours
- **API costs:** ElevenLabs pricing vs Deepgram + Cartesia
- **Risk:** Potential regression if poorly executed

### Benefits
- **Single vendor:** Simplified billing and management
- **Potential quality improvement:** ElevenLabs known for quality
- **Unified emotion model:** Single provider for consistency
- **Learning:** Better understanding of TTS emotion systems

### ROI Analysis
- **Break-even:** If voice quality improvement > setup time
- **Long-term:** Reduced vendor management overhead
- **Strategic:** Flexibility to switch providers easily (proven adapter pattern)

---

## Next Steps

1. **Begin with Phase 1** (Research & Setup)
2. **Create checkpoint before Phase 2**
3. **Execute Phase 2 with careful validation**
4. **Comprehensive testing in Phase 3**
5. **Performance tuning in Phase 4**
6. **Deploy when all success criteria met**

**Estimated Total Time:** 6-9 hours (including testing and refinement)

**Recommended Schedule:**
- Day 1 (2-3 hours): Phases 1-2 (setup + implementation)
- Day 2 (2-3 hours): Phase 3 (testing)
- Day 3 (1-2 hours): Phase 4 (optimization + docs)

---

## GOAP Metadata

**Planning Algorithm:** A* with Manhattan distance heuristic
**State Space Size:** ~512 possible states (2^9 binary state variables)
**Search Depth:** 12 actions (optimal path)
**Branching Factor:** ~2-3 actions per state
**Heuristic Function:** `h(state) = count(unmet_goal_conditions)`
**Actual Cost:** 34 points (sum of action costs)
**Estimated Benefit:** High (improved architecture, proven patterns)

**OODA Loop Integration:**
- **Observe:** Monitor logs, voice output, latency metrics
- **Orient:** Compare against success criteria and thresholds
- **Decide:** Trigger replanning if conditions met
- **Act:** Execute next action or rollback plan

---

**Generated by:** GOAP Specialist AI
**Date:** 2025-12-11
**Version:** 1.0
**Status:** Ready for execution
