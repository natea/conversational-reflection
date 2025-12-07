/**
 * Emotive TTS Adapter
 *
 * A provider-agnostic library for emotional speech synthesis.
 * Maps Damasio/Ekman emotional states from sable-mcp to TTS provider-specific
 * controls for Cartesia, Maya, ElevenLabs, and more.
 *
 * @example
 * ```typescript
 * import { EmotiveTTSOrchestrator } from './emotive-tts-adapter';
 *
 * const orchestrator = new EmotiveTTSOrchestrator({ provider: 'cartesia' });
 *
 * // From sable-mcp emotional state
 * const sableState = await sableMcp.getEmotionalState();
 * const emotiveText = orchestrator.applyEmotionToText("Hello!", sableState);
 * const config = orchestrator.getProviderConfig(sableState);
 * ```
 */

// Types
export type {
  PrimaryEmotion,
  NuancedEmotion,
  EmotionIntensity,
  BodyState,
  BackgroundFeeling,
  EmotiveVoiceState,
  VoiceModifiers,
  SSMLTag,
  ProviderEmotionParams,
  TTSEmotionAdapter,
  SableEmotionResult,
  SableEmotionalState,
  EmotionMappingConfig,
} from './types.js';

export { DEFAULT_CONFIG } from './types.js';

// Adapters
export {
  CartesiaEmotionAdapter,
  cartesiaAdapter,
  CARTESIA_EMOTIONS,
  CARTESIA_EMOTIVE_VOICES,
  MayaEmotionAdapter,
  mayaAdapter,
  MAYA_EMOTION_TAGS,
  MAYA_TONES,
  ElevenLabsEmotionAdapter,
  elevenLabsAdapter,
} from './adapters/index.js';

// Sable mapper
export {
  sableToEmotiveState,
  sableEmotionToEmotiveState,
  createNeutralState,
  blendEmotionalStates,
} from './sable-mapper.js';

// Configuration
export {
  loadConfigFromEnv,
  validateConfig,
  CARTESIA_RECOMMENDED_CONFIG,
  CARTESIA_EMOTIVE_VOICE_IDS,
  SAMPLE_CONFIG_YAML,
  SAMPLE_ENV_CONFIG,
} from './config.js';

// Orchestrator
import type {
  TTSEmotionAdapter,
  EmotiveVoiceState,
  ProviderEmotionParams,
  EmotionMappingConfig,
  SableEmotionalState,
} from './types.js';
import { DEFAULT_CONFIG } from './types.js';
import { cartesiaAdapter } from './adapters/cartesia.js';
import { mayaAdapter } from './adapters/maya.js';
import { elevenLabsAdapter } from './adapters/elevenlabs.js';
import { sableToEmotiveState, createNeutralState } from './sable-mapper.js';

/**
 * Get adapter instance by provider name
 */
function getAdapter(provider: EmotionMappingConfig['provider']): TTSEmotionAdapter {
  switch (provider) {
    case 'cartesia':
      return cartesiaAdapter;
    case 'maya':
      return mayaAdapter;
    case 'elevenlabs':
      return elevenLabsAdapter;
    case 'openai':
      // OpenAI TTS doesn't support emotions, return a passthrough
      return {
        name: 'openai',
        supportedEmotions: [],
        supportsSSML: false,
        mapEmotion: () => ({ provider: 'openai' }),
        applyToText: (text) => text,
        generateConfig: () => ({}),
      };
    default:
      throw new Error(`Unknown TTS provider: ${provider}`);
  }
}

/**
 * Emotive TTS Orchestrator
 *
 * High-level interface for applying emotional state to TTS generation.
 * Handles provider selection, emotion mapping, and text transformation.
 */
export class EmotiveTTSOrchestrator {
  private config: EmotionMappingConfig;
  private adapter: TTSEmotionAdapter;
  private currentState: EmotiveVoiceState;

  constructor(config: Partial<EmotionMappingConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
    this.adapter = getAdapter(this.config.provider);
    this.currentState = createNeutralState();
  }

  /**
   * Get the current TTS adapter
   */
  getAdapter(): TTSEmotionAdapter {
    return this.adapter;
  }

  /**
   * Get the current emotional state
   */
  getCurrentState(): EmotiveVoiceState {
    return this.currentState;
  }

  /**
   * Update emotional state from sable-mcp
   */
  updateFromSable(sableState: SableEmotionalState): EmotiveVoiceState {
    this.currentState = sableToEmotiveState(sableState);
    return this.currentState;
  }

  /**
   * Set emotional state directly
   */
  setState(state: EmotiveVoiceState): void {
    this.currentState = state;
  }

  /**
   * Reset to neutral state
   */
  reset(): void {
    this.currentState = createNeutralState();
  }

  /**
   * Map current state to provider parameters
   */
  mapEmotion(state?: EmotiveVoiceState): ProviderEmotionParams {
    return this.adapter.mapEmotion(state || this.currentState);
  }

  /**
   * Apply emotional markup to text
   */
  applyToText(text: string, state?: EmotiveVoiceState): string {
    if (!this.config.useSSML || !this.adapter.supportsSSML) {
      return text;
    }
    return this.adapter.applyToText(text, state || this.currentState);
  }

  /**
   * Generate provider-specific config for API calls
   */
  getProviderConfig(state?: EmotiveVoiceState): Record<string, unknown> {
    return this.adapter.generateConfig(state || this.currentState);
  }

  /**
   * Get full parameters including text transformation and config
   */
  prepare(
    text: string,
    state?: EmotiveVoiceState
  ): {
    text: string;
    config: Record<string, unknown>;
    params: ProviderEmotionParams;
  } {
    const emotiveState = state || this.currentState;
    return {
      text: this.applyToText(text, emotiveState),
      config: this.getProviderConfig(emotiveState),
      params: this.mapEmotion(emotiveState),
    };
  }

  /**
   * Switch to a different provider
   */
  setProvider(provider: EmotionMappingConfig['provider']): void {
    this.config.provider = provider;
    this.adapter = getAdapter(provider);
  }

  /**
   * Check if current provider supports emotions
   */
  supportsEmotions(): boolean {
    return this.adapter.supportedEmotions.length > 0;
  }

  /**
   * Check if current provider supports SSML
   */
  supportsSSML(): boolean {
    return this.adapter.supportsSSML;
  }

  /**
   * Get list of supported emotions for current provider
   */
  getSupportedEmotions(): string[] {
    return this.adapter.supportedEmotions;
  }

  /**
   * Get recommended voices for emotional expression
   */
  getEmotiveVoices(): string[] | undefined {
    return this.adapter.emotiveVoices;
  }
}

/**
 * Create a pre-configured orchestrator for common use cases
 */
export function createOrchestrator(
  provider: EmotionMappingConfig['provider'] = 'cartesia',
  options: Partial<EmotionMappingConfig> = {}
): EmotiveTTSOrchestrator {
  return new EmotiveTTSOrchestrator({
    provider,
    ...options,
  });
}
