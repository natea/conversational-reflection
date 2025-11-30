/**
 * ElevenLabs TTS Emotion Adapter (Stub)
 *
 * Maps unified emotion states to ElevenLabs TTS parameters.
 * ElevenLabs supports emotional expression through:
 * - Voice settings (stability, similarity_boost, style, use_speaker_boost)
 * - Model selection (eleven_turbo_v2_5, eleven_multilingual_v2)
 *
 * Note: ElevenLabs emotion support is more limited compared to Cartesia.
 * Emotional expression is primarily achieved through voice selection and
 * prompt engineering rather than explicit emotion parameters.
 *
 * @see https://elevenlabs.io/docs/speech-synthesis/voice-settings
 */

import type {
  TTSEmotionAdapter,
  EmotiveVoiceState,
  ProviderEmotionParams,
  PrimaryEmotion,
  VoiceModifiers,
} from '../types.js';

/**
 * ElevenLabs voice settings for different emotional states
 */
interface ElevenLabsVoiceSettings {
  stability: number;        // 0-1, lower = more expressive
  similarity_boost: number; // 0-1, higher = more consistent
  style: number;           // 0-1, style exaggeration
  use_speaker_boost: boolean;
}

/**
 * Emotional presets for ElevenLabs
 * These adjust voice settings to achieve emotional expression
 */
const EMOTION_PRESETS: Record<PrimaryEmotion, ElevenLabsVoiceSettings> = {
  joy: {
    stability: 0.3,        // Less stable = more expressive
    similarity_boost: 0.75,
    style: 0.6,           // Higher style for enthusiasm
    use_speaker_boost: true,
  },
  sadness: {
    stability: 0.7,        // More stable = more subdued
    similarity_boost: 0.8,
    style: 0.3,
    use_speaker_boost: false,
  },
  anger: {
    stability: 0.2,        // Very expressive
    similarity_boost: 0.7,
    style: 0.8,           // High style for intensity
    use_speaker_boost: true,
  },
  fear: {
    stability: 0.4,
    similarity_boost: 0.75,
    style: 0.5,
    use_speaker_boost: true,
  },
  disgust: {
    stability: 0.5,
    similarity_boost: 0.8,
    style: 0.4,
    use_speaker_boost: false,
  },
  surprise: {
    stability: 0.3,
    similarity_boost: 0.7,
    style: 0.7,
    use_speaker_boost: true,
  },
  neutral: {
    stability: 0.5,
    similarity_boost: 0.75,
    style: 0.0,
    use_speaker_boost: false,
  },
};

/**
 * Interpolate voice settings based on intensity
 */
function interpolateSettings(
  emotion: PrimaryEmotion,
  intensity: number
): ElevenLabsVoiceSettings {
  const emotionPreset = EMOTION_PRESETS[emotion];
  const neutralPreset = EMOTION_PRESETS.neutral;

  // Interpolate between neutral and emotional preset based on intensity
  return {
    stability:
      neutralPreset.stability + (emotionPreset.stability - neutralPreset.stability) * intensity,
    similarity_boost:
      neutralPreset.similarity_boost +
      (emotionPreset.similarity_boost - neutralPreset.similarity_boost) * intensity,
    style:
      neutralPreset.style + (emotionPreset.style - neutralPreset.style) * intensity,
    use_speaker_boost: intensity > 0.5 ? emotionPreset.use_speaker_boost : false,
  };
}

/**
 * ElevenLabs TTS Emotion Adapter
 */
export class ElevenLabsEmotionAdapter implements TTSEmotionAdapter {
  readonly name = 'elevenlabs';
  readonly supportedEmotions = Object.keys(EMOTION_PRESETS);
  readonly supportsSSML = false; // ElevenLabs uses different approach

  /**
   * Map unified emotion state to ElevenLabs-specific parameters
   */
  mapEmotion(state: EmotiveVoiceState): ProviderEmotionParams {
    const settings = interpolateSettings(state.primaryEmotion, state.intensity);

    const modifiers: VoiceModifiers = {};

    // Map body state to speed if available
    if (state.bodyState) {
      // ElevenLabs doesn't have direct speed control in same way,
      // but we can suggest it for potential future use
      if (state.bodyState.energy < 0.3) {
        modifiers.speed = 0.9;
      } else if (state.bodyState.energy > 0.7) {
        modifiers.speed = 1.1;
      }
    }

    return {
      provider: 'elevenlabs',
      emotion: state.primaryEmotion,
      modifiers,
      raw: {
        voice_settings: settings,
      },
    };
  }

  /**
   * Apply emotional state to text
   * ElevenLabs doesn't support SSML emotion tags,
   * so we return text unchanged
   */
  applyToText(text: string, _state: EmotiveVoiceState): string {
    // ElevenLabs emotion is controlled via API parameters, not text markup
    return text;
  }

  /**
   * Generate ElevenLabs-specific config for API calls
   */
  generateConfig(state: EmotiveVoiceState): Record<string, unknown> {
    const settings = interpolateSettings(state.primaryEmotion, state.intensity);

    return {
      voice_settings: settings,
      // Note: ElevenLabs also supports model_id selection which affects expressiveness
      // eleven_multilingual_v2 tends to be more expressive
      // eleven_turbo_v2_5 is faster but less expressive
    };
  }
}

/**
 * Export singleton instance
 */
export const elevenLabsAdapter = new ElevenLabsEmotionAdapter();
