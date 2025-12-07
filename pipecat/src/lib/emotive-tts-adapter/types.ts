/**
 * Emotive TTS Adapter - Unified Types
 *
 * Provides a provider-agnostic interface for emotional speech synthesis,
 * mapping Damasio/Ekman emotional states to TTS provider-specific controls.
 */

// ============================================================================
// Core Emotion Types (based on Ekman's basic emotions + Damasio's model)
// ============================================================================

/**
 * Primary emotions based on Ekman's universal emotions
 * These map to the emotional states tracked by sable-mcp
 */
export type PrimaryEmotion =
  | 'joy'
  | 'sadness'
  | 'anger'
  | 'fear'
  | 'disgust'
  | 'surprise'
  | 'neutral';

/**
 * Nuanced emotions for finer-grained control
 * These are secondary emotions that can be derived from primary + context
 */
export type NuancedEmotion =
  // Joy variants
  | 'happy' | 'excited' | 'content' | 'enthusiastic' | 'elated' | 'euphoric'
  | 'triumphant' | 'grateful' | 'affectionate' | 'peaceful' | 'serene' | 'calm'
  // Sadness variants
  | 'melancholic' | 'dejected' | 'disappointed' | 'hurt' | 'nostalgic' | 'wistful'
  | 'guilty' | 'rejected' | 'resigned' | 'tired' | 'bored'
  // Anger variants
  | 'mad' | 'outraged' | 'frustrated' | 'agitated' | 'contempt' | 'envious'
  | 'sarcastic' | 'ironic' | 'disgusted' | 'threatened'
  // Fear variants
  | 'anxious' | 'scared' | 'panicked' | 'alarmed' | 'insecure' | 'hesitant'
  // Surprise variants
  | 'amazed' | 'curious' | 'confused' | 'mysterious' | 'anticipation'
  // Positive social
  | 'proud' | 'confident' | 'trust' | 'sympathetic' | 'apologetic'
  | 'flirtatious' | 'joking/comedic'
  // Neutral variants
  | 'distant' | 'skeptical' | 'contemplative' | 'determined';

/**
 * Intensity level for emotions (0.0 to 1.0)
 */
export type EmotionIntensity = number;

/**
 * Body state from Damasio's somatic marker hypothesis
 * These physiological states influence voice characteristics
 */
export interface BodyState {
  /** Heart rate simulation (60-180 bpm) - affects urgency/arousal */
  heartRate: number;
  /** Temperature (-1 to 1) - affects warmth in voice */
  temperature: number;
  /** Tension (0 to 1) - affects pitch variance and strain */
  tension: number;
  /** Energy (0 to 1) - affects speaking speed and volume */
  energy: number;
  /** Breathing (0 to 1, slow to rapid) - affects pacing */
  breathing: number;
}

/**
 * Background feelings derived from body state
 * These provide additional context for voice modulation
 */
export type BackgroundFeeling =
  | 'energized' | 'fatigued'
  | 'tense' | 'relaxed'
  | 'warm' | 'cold'
  | 'aroused' | 'calm'
  | 'breathless' | 'steady'
  | 'neutral';

// ============================================================================
// Unified Emotive Voice State
// ============================================================================

/**
 * Complete emotional state for voice synthesis
 * This is the unified interface that all adapters consume
 */
export interface EmotiveVoiceState {
  /** Primary emotion category */
  primaryEmotion: PrimaryEmotion;

  /** Intensity of the primary emotion (0.0-1.0) */
  intensity: EmotionIntensity;

  /** Optional nuanced emotion for providers that support fine-grained control */
  nuancedEmotion?: NuancedEmotion;

  /** Body state for deriving voice modifiers */
  bodyState?: BodyState;

  /** Background feelings for additional context */
  backgroundFeelings?: BackgroundFeeling[];

  /** Timestamp of when this state was captured */
  timestamp?: string;
}

// ============================================================================
// Provider Configuration Types
// ============================================================================

/**
 * Voice modifier parameters derived from emotional state
 */
export interface VoiceModifiers {
  /** Speed multiplier (typically 0.5-2.0) */
  speed?: number;
  /** Volume multiplier (typically 0.5-2.0) */
  volume?: number;
  /** Pitch adjustment (provider-specific) */
  pitch?: number;
}

/**
 * SSML tag for inline emotion/control changes
 */
export interface SSMLTag {
  type: 'emotion' | 'speed' | 'volume' | 'break' | 'spell';
  value: string | number;
  /** Position in text where tag should be inserted (0 = start) */
  position?: number;
}

/**
 * Provider-specific emotion parameters
 * Each adapter transforms EmotiveVoiceState into this format
 */
export interface ProviderEmotionParams {
  /** Provider name for debugging */
  provider: string;
  /** Emotion string/identifier for the provider */
  emotion?: string;
  /** List of emotions (for providers supporting multiple) */
  emotions?: string[];
  /** Voice modifiers to apply */
  modifiers?: VoiceModifiers;
  /** SSML tags to inject into text */
  ssmlTags?: SSMLTag[];
  /** Raw provider-specific config (escape hatch) */
  raw?: Record<string, unknown>;
}

// ============================================================================
// Adapter Interface
// ============================================================================

/**
 * TTS Emotion Adapter Interface
 * Implement this for each TTS provider to translate unified emotions
 */
export interface TTSEmotionAdapter {
  /** Provider identifier */
  readonly name: string;

  /** List of emotions this provider supports */
  readonly supportedEmotions: string[];

  /** Whether this provider supports SSML tags */
  readonly supportsSSML: boolean;

  /** Voices recommended for emotional expression */
  readonly emotiveVoices?: string[];

  /**
   * Map unified emotion state to provider-specific parameters
   */
  mapEmotion(state: EmotiveVoiceState): ProviderEmotionParams;

  /**
   * Apply emotional state to text, potentially injecting SSML tags
   */
  applyToText(text: string, state: EmotiveVoiceState): string;

  /**
   * Generate provider-specific config for API calls
   */
  generateConfig(state: EmotiveVoiceState): Record<string, unknown>;
}

// ============================================================================
// Sable MCP Integration Types
// ============================================================================

/**
 * Emotion result from sable-mcp's analyze_emotion
 */
export interface SableEmotionResult {
  type: PrimaryEmotion;
  intensity: number;
}

/**
 * Full emotional state from sable-mcp's get_emotional_state
 */
export interface SableEmotionalState {
  body_state: {
    heart_rate: number;
    temperature: number;
    tension: number;
    energy: number;
    breathing: number;
  };
  emotions: SableEmotionResult[];
  background_feelings: string[];
  last_updated: string;
}

// ============================================================================
// Configuration Types
// ============================================================================

/**
 * Emotion mapping configuration
 */
export interface EmotionMappingConfig {
  /** Provider to use */
  provider: 'cartesia' | 'maya' | 'elevenlabs' | 'openai';

  /** Source of emotional state */
  emotionSource: 'sable-mcp' | 'manual' | 'llm-inferred';

  /** How to scale intensity to provider values */
  intensityCurve: 'linear' | 'logarithmic' | 'exponential';

  /** Default emotion when none detected */
  defaultEmotion: PrimaryEmotion;

  /** Whether to use SSML tags for inline control */
  useSSML: boolean;

  /** Custom emotion mappings (overrides defaults) */
  customMappings?: Partial<Record<PrimaryEmotion, Record<string, string>>>;

  /** Energy-to-speed mapping */
  energyToSpeed?: {
    low: number;   // speed when energy < 0.3
    medium: number; // speed when energy 0.3-0.7
    high: number;  // speed when energy > 0.7
  };
}

/**
 * Default configuration
 */
export const DEFAULT_CONFIG: EmotionMappingConfig = {
  provider: 'cartesia',
  emotionSource: 'sable-mcp',
  intensityCurve: 'linear',
  defaultEmotion: 'neutral',
  useSSML: true,
  energyToSpeed: {
    low: 0.85,
    medium: 1.0,
    high: 1.2,
  },
};
