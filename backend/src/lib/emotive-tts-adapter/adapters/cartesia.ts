/**
 * Cartesia TTS Emotion Adapter
 *
 * Maps unified emotion states to Cartesia Sonic-3 API parameters and SSML tags.
 * Supports 60+ emotions with intensity modulation via speed/volume controls.
 *
 * @see https://docs.cartesia.ai/build-with-cartesia/sonic-3/volume-speed-emotion
 * @see https://docs.cartesia.ai/build-with-cartesia/sonic-3/ssml-tags
 */

import type {
  TTSEmotionAdapter,
  EmotiveVoiceState,
  ProviderEmotionParams,
  PrimaryEmotion,
  NuancedEmotion,
  SSMLTag,
  VoiceModifiers,
} from '../types.js';

/**
 * Complete list of Cartesia Sonic-3 supported emotions
 */
export const CARTESIA_EMOTIONS = [
  // Primary (best results)
  'neutral', 'angry', 'excited', 'content', 'sad', 'scared',
  // Joy spectrum
  'happy', 'enthusiastic', 'elated', 'euphoric', 'triumphant',
  'grateful', 'affectionate', 'peaceful', 'serene', 'calm',
  // Surprise/curiosity spectrum
  'amazed', 'surprised', 'curious', 'anticipation', 'mysterious',
  // Social/playful
  'flirtatious', 'joking/comedic', 'trust', 'sympathetic', 'proud', 'confident',
  // Anger spectrum
  'mad', 'outraged', 'frustrated', 'agitated', 'threatened',
  'disgusted', 'contempt', 'envious', 'sarcastic', 'ironic',
  // Sadness spectrum
  'dejected', 'melancholic', 'disappointed', 'hurt', 'guilty',
  'bored', 'tired', 'rejected', 'nostalgic', 'wistful',
  // Fear/anxiety spectrum
  'anxious', 'panicked', 'alarmed', 'hesitant', 'insecure', 'confused',
  // Neutral variants
  'apologetic', 'resigned', 'distant', 'skeptical', 'contemplative', 'determined',
] as const;

export type CartesiaEmotion = typeof CARTESIA_EMOTIONS[number];

/**
 * Voices optimized for emotional expression in Cartesia
 */
export const CARTESIA_EMOTIVE_VOICES = [
  'Leo', 'Jace', 'Kyle', 'Gavin',  // Male voices
  'Maya', 'Tessa', 'Dana', 'Marian',  // Female voices
];

/**
 * Mapping from primary emotions to Cartesia emotions at different intensities
 */
const PRIMARY_EMOTION_MAP: Record<PrimaryEmotion, {
  low: CartesiaEmotion;
  medium: CartesiaEmotion;
  high: CartesiaEmotion;
}> = {
  joy: {
    low: 'content',
    medium: 'happy',
    high: 'excited',
  },
  sadness: {
    low: 'tired',
    medium: 'sad',
    high: 'melancholic',
  },
  anger: {
    low: 'frustrated',
    medium: 'angry',
    high: 'outraged',
  },
  fear: {
    low: 'hesitant',
    medium: 'anxious',
    high: 'panicked',
  },
  disgust: {
    low: 'skeptical',
    medium: 'disgusted',
    high: 'contempt',
  },
  surprise: {
    low: 'curious',
    medium: 'surprised',
    high: 'amazed',
  },
  neutral: {
    low: 'calm',
    medium: 'neutral',
    high: 'contemplative',
  },
};

/**
 * Map nuanced emotions directly to Cartesia emotions
 */
const NUANCED_EMOTION_MAP: Partial<Record<NuancedEmotion, CartesiaEmotion>> = {
  // Direct mappings (nuanced emotion = Cartesia emotion name)
  happy: 'happy',
  excited: 'excited',
  content: 'content',
  enthusiastic: 'enthusiastic',
  elated: 'elated',
  euphoric: 'euphoric',
  triumphant: 'triumphant',
  grateful: 'grateful',
  affectionate: 'affectionate',
  peaceful: 'peaceful',
  serene: 'serene',
  calm: 'calm',
  melancholic: 'melancholic',
  dejected: 'dejected',
  disappointed: 'disappointed',
  hurt: 'hurt',
  nostalgic: 'nostalgic',
  wistful: 'wistful',
  guilty: 'guilty',
  rejected: 'rejected',
  resigned: 'resigned',
  tired: 'tired',
  bored: 'bored',
  mad: 'mad',
  outraged: 'outraged',
  frustrated: 'frustrated',
  agitated: 'agitated',
  contempt: 'contempt',
  envious: 'envious',
  sarcastic: 'sarcastic',
  ironic: 'ironic',
  disgusted: 'disgusted',
  threatened: 'threatened',
  anxious: 'anxious',
  scared: 'scared',
  panicked: 'panicked',
  alarmed: 'alarmed',
  insecure: 'insecure',
  hesitant: 'hesitant',
  amazed: 'amazed',
  curious: 'curious',
  confused: 'confused',
  mysterious: 'mysterious',
  anticipation: 'anticipation',
  proud: 'proud',
  confident: 'confident',
  trust: 'trust',
  sympathetic: 'sympathetic',
  apologetic: 'apologetic',
  flirtatious: 'flirtatious',
  'joking/comedic': 'joking/comedic',
  distant: 'distant',
  skeptical: 'skeptical',
  contemplative: 'contemplative',
  determined: 'determined',
};

/**
 * Calculate voice modifiers based on body state
 */
function calculateModifiers(state: EmotiveVoiceState): VoiceModifiers {
  const modifiers: VoiceModifiers = {};

  if (state.bodyState) {
    // Map energy to speed (0.6 - 1.5 range for Cartesia)
    const energy = state.bodyState.energy;
    if (energy < 0.3) {
      modifiers.speed = 0.8 + (energy / 0.3) * 0.15; // 0.8 - 0.95
    } else if (energy > 0.7) {
      modifiers.speed = 1.05 + ((energy - 0.7) / 0.3) * 0.25; // 1.05 - 1.3
    } else {
      modifiers.speed = 0.95 + ((energy - 0.3) / 0.4) * 0.1; // 0.95 - 1.05
    }

    // Map tension to slight volume increase (0.5 - 2.0 range)
    const tension = state.bodyState.tension;
    if (tension > 0.6) {
      modifiers.volume = 1.0 + (tension - 0.6) * 0.5; // 1.0 - 1.2
    }
  }

  // Intensity can also affect volume slightly
  if (state.intensity > 0.7) {
    modifiers.volume = (modifiers.volume || 1.0) * (1 + (state.intensity - 0.7) * 0.3);
  }

  // Clamp values to Cartesia limits
  if (modifiers.speed !== undefined) {
    modifiers.speed = Math.max(0.6, Math.min(1.5, modifiers.speed));
  }
  if (modifiers.volume !== undefined) {
    modifiers.volume = Math.max(0.5, Math.min(2.0, modifiers.volume));
  }

  return modifiers;
}

/**
 * Select appropriate Cartesia emotion based on state
 */
function selectEmotion(state: EmotiveVoiceState): CartesiaEmotion {
  // If nuanced emotion is provided and maps directly, use it
  if (state.nuancedEmotion && NUANCED_EMOTION_MAP[state.nuancedEmotion]) {
    return NUANCED_EMOTION_MAP[state.nuancedEmotion]!;
  }

  // Otherwise, map primary emotion with intensity
  const mapping = PRIMARY_EMOTION_MAP[state.primaryEmotion];
  if (!mapping) {
    return 'neutral';
  }

  // Select based on intensity thresholds
  if (state.intensity < 0.35) {
    return mapping.low;
  } else if (state.intensity < 0.7) {
    return mapping.medium;
  } else {
    return mapping.high;
  }
}

/**
 * Generate SSML emotion tag
 */
function createEmotionTag(emotion: CartesiaEmotion, position = 0): SSMLTag {
  return {
    type: 'emotion',
    value: emotion,
    position,
  };
}

/**
 * Generate SSML speed tag
 */
function createSpeedTag(speed: number, position = 0): SSMLTag {
  return {
    type: 'speed',
    value: Math.round(speed * 100) / 100, // Round to 2 decimals
    position,
  };
}

/**
 * Generate SSML volume tag
 */
function createVolumeTag(volume: number, position = 0): SSMLTag {
  return {
    type: 'volume',
    value: Math.round(volume * 100) / 100,
    position,
  };
}

/**
 * Convert SSML tag to Cartesia SSML string
 */
function ssmlTagToString(tag: SSMLTag): string {
  switch (tag.type) {
    case 'emotion':
      return `<emotion value="${tag.value}" />`;
    case 'speed':
      return `<speed ratio="${tag.value}" />`;
    case 'volume':
      return `<volume ratio="${tag.value}" />`;
    case 'break':
      return `<break time="${tag.value}" />`;
    case 'spell':
      return `<spell>${tag.value}</spell>`;
    default:
      return '';
  }
}

/**
 * Cartesia TTS Emotion Adapter
 */
export class CartesiaEmotionAdapter implements TTSEmotionAdapter {
  readonly name = 'cartesia';
  readonly supportedEmotions = CARTESIA_EMOTIONS as unknown as string[];
  readonly supportsSSML = true;
  readonly emotiveVoices = CARTESIA_EMOTIVE_VOICES;

  /**
   * Map unified emotion state to Cartesia-specific parameters
   */
  mapEmotion(state: EmotiveVoiceState): ProviderEmotionParams {
    const emotion = selectEmotion(state);
    const modifiers = calculateModifiers(state);
    const ssmlTags: SSMLTag[] = [];

    // Add emotion tag at the start
    ssmlTags.push(createEmotionTag(emotion));

    // Add speed tag if different from default
    if (modifiers.speed && Math.abs(modifiers.speed - 1.0) > 0.05) {
      ssmlTags.push(createSpeedTag(modifiers.speed));
    }

    // Add volume tag if different from default
    if (modifiers.volume && Math.abs(modifiers.volume - 1.0) > 0.05) {
      ssmlTags.push(createVolumeTag(modifiers.volume));
    }

    return {
      provider: 'cartesia',
      emotion,
      modifiers,
      ssmlTags,
      raw: {
        generation_config: {
          emotion,
          speed: modifiers.speed,
          volume: modifiers.volume,
        },
      },
    };
  }

  /**
   * Apply emotional state to text by prepending SSML tags
   */
  applyToText(text: string, state: EmotiveVoiceState): string {
    const params = this.mapEmotion(state);

    if (!params.ssmlTags || params.ssmlTags.length === 0) {
      return text;
    }

    // Sort tags by position and build prefix
    const sortedTags = [...params.ssmlTags].sort(
      (a, b) => (a.position || 0) - (b.position || 0)
    );

    // For now, prepend all tags at the start
    // Future: support inline emotion shifts
    const tagPrefix = sortedTags.map(ssmlTagToString).join(' ');

    return `${tagPrefix} ${text}`;
  }

  /**
   * Generate Cartesia-specific config for API calls
   */
  generateConfig(state: EmotiveVoiceState): Record<string, unknown> {
    const emotion = selectEmotion(state);
    const modifiers = calculateModifiers(state);

    return {
      generation_config: {
        emotion,
        ...(modifiers.speed && { speed: modifiers.speed }),
        ...(modifiers.volume && { volume: modifiers.volume }),
      },
    };
  }
}

/**
 * Export singleton instance
 */
export const cartesiaAdapter = new CartesiaEmotionAdapter();
