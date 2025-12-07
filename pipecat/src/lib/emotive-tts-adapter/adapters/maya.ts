/**
 * Maya1 TTS Emotion Adapter
 *
 * Maps unified emotion states to Maya1 TTS emotion tags.
 * Maya1 uses inline emotion tags like <laugh>, <sigh>, <cry> etc.
 *
 * Note: Maya1 model is not yet publicly released. This adapter is based on
 * the expected API from maya-tts-mcp implementation.
 */

import type {
  TTSEmotionAdapter,
  EmotiveVoiceState,
  ProviderEmotionParams,
  PrimaryEmotion,
  SSMLTag,
  VoiceModifiers,
} from '../types.js';

/**
 * Maya1 supported emotion tags
 * These are inserted inline in the text
 */
export const MAYA_EMOTION_TAGS = [
  'laugh',   // Joy, amusement
  'giggle',  // Light joy, playful
  'sigh',    // Disappointment, tiredness, relief
  'gasp',    // Surprise, shock, fear
  'cry',     // Sadness, grief
  'whisper', // Secretive, intimate
  'angry',   // Anger, frustration
] as const;

export type MayaEmotionTag = typeof MAYA_EMOTION_TAGS[number];

/**
 * Tones supported by Maya1 for reflection speech
 */
export const MAYA_TONES = ['neutral', 'gentle', 'concerned', 'warm'] as const;
export type MayaTone = typeof MAYA_TONES[number];

/**
 * Voice descriptions for different tones
 */
const TONE_VOICE_DESCRIPTIONS: Record<MayaTone, string> = {
  neutral: 'Female voice in her 40s, neutral American accent, calm and professional timbre',
  gentle: 'Female voice in her 40s, soft American accent, gentle and soothing timbre',
  concerned: 'Female voice in her 40s, warm American accent, concerned but supportive timbre',
  warm: 'Female voice in her 40s, warm American accent, friendly and compassionate timbre',
};

/**
 * Mapping from primary emotions to Maya emotion tags
 */
const PRIMARY_TO_MAYA_TAGS: Record<PrimaryEmotion, {
  tags: MayaEmotionTag[];
  tone: MayaTone;
}> = {
  joy: {
    tags: ['laugh', 'giggle'],
    tone: 'warm',
  },
  sadness: {
    tags: ['sigh', 'cry'],
    tone: 'gentle',
  },
  anger: {
    tags: ['angry'],
    tone: 'concerned',
  },
  fear: {
    tags: ['gasp', 'whisper'],
    tone: 'concerned',
  },
  disgust: {
    tags: ['sigh'],
    tone: 'neutral',
  },
  surprise: {
    tags: ['gasp'],
    tone: 'neutral',
  },
  neutral: {
    tags: [],
    tone: 'neutral',
  },
};

/**
 * Select appropriate Maya tags based on emotion state
 */
function selectMayaTags(state: EmotiveVoiceState): MayaEmotionTag[] {
  const mapping = PRIMARY_TO_MAYA_TAGS[state.primaryEmotion];

  if (!mapping || mapping.tags.length === 0) {
    return [];
  }

  // Only include tags if intensity is high enough
  if (state.intensity < 0.4) {
    return [];
  }

  // For high intensity joy, prefer laugh; for lower, prefer giggle
  if (state.primaryEmotion === 'joy') {
    return state.intensity > 0.7 ? ['laugh'] : ['giggle'];
  }

  // For sadness, cry only at very high intensity
  if (state.primaryEmotion === 'sadness') {
    return state.intensity > 0.8 ? ['cry'] : ['sigh'];
  }

  // Return primary tag for the emotion
  return [mapping.tags[0]];
}

/**
 * Select tone based on emotional state
 */
function selectTone(state: EmotiveVoiceState): MayaTone {
  const mapping = PRIMARY_TO_MAYA_TAGS[state.primaryEmotion];

  if (!mapping) {
    return 'neutral';
  }

  // Override with body state if available
  if (state.bodyState) {
    // Warm temperature = warm tone
    if (state.bodyState.temperature > 0.3) {
      return 'warm';
    }
    // High tension = concerned tone
    if (state.bodyState.tension > 0.6) {
      return 'concerned';
    }
    // Low energy = gentle tone
    if (state.bodyState.energy < 0.3) {
      return 'gentle';
    }
  }

  return mapping.tone;
}

/**
 * Generate voice description based on state
 */
function generateVoiceDescription(state: EmotiveVoiceState): string {
  const tone = selectTone(state);
  return TONE_VOICE_DESCRIPTIONS[tone];
}

/**
 * Create SSML-like tag for Maya
 */
function createMayaTag(tag: MayaEmotionTag, position = 0): SSMLTag {
  return {
    type: 'emotion',
    value: tag,
    position,
  };
}

/**
 * Convert Maya tag to inline format
 */
function mayaTagToString(tag: SSMLTag): string {
  // Maya uses <tag> format, not XML-style attributes
  return `<${tag.value}>`;
}

/**
 * Maya1 TTS Emotion Adapter
 */
export class MayaEmotionAdapter implements TTSEmotionAdapter {
  readonly name = 'maya';
  readonly supportedEmotions = MAYA_EMOTION_TAGS as unknown as string[];
  readonly supportsSSML = true;

  /**
   * Map unified emotion state to Maya-specific parameters
   */
  mapEmotion(state: EmotiveVoiceState): ProviderEmotionParams {
    const tags = selectMayaTags(state);
    const tone = selectTone(state);
    const voiceDescription = generateVoiceDescription(state);

    const ssmlTags: SSMLTag[] = tags.map((tag) => createMayaTag(tag));

    return {
      provider: 'maya',
      emotion: tags[0] || undefined,
      emotions: tags,
      ssmlTags,
      raw: {
        voice_description: voiceDescription,
        emotion_tags: tags,
        tone,
      },
    };
  }

  /**
   * Apply emotional state to text
   * Maya tags are typically inserted at punctuation or emotional moments
   */
  applyToText(text: string, state: EmotiveVoiceState): string {
    const params = this.mapEmotion(state);

    if (!params.emotions || params.emotions.length === 0) {
      return text;
    }

    // For Maya, we insert emotion tags at the start of the text
    // Future: could analyze text for better placement
    const tagPrefix = params.ssmlTags?.map(mayaTagToString).join(' ') || '';

    if (tagPrefix) {
      return `${tagPrefix} ${text}`;
    }

    return text;
  }

  /**
   * Generate Maya-specific config for API calls
   */
  generateConfig(state: EmotiveVoiceState): Record<string, unknown> {
    const tags = selectMayaTags(state);
    const tone = selectTone(state);
    const voiceDescription = generateVoiceDescription(state);

    return {
      voice_description: voiceDescription,
      emotion_tags: tags,
      tone,
    };
  }
}

/**
 * Export singleton instance
 */
export const mayaAdapter = new MayaEmotionAdapter();
