/**
 * Emotive TTS Configuration Schema and Defaults
 *
 * Provides configuration options for the emotive TTS adapter system.
 * Can be loaded from environment variables, config files, or set programmatically.
 */

import type { EmotionMappingConfig, PrimaryEmotion } from './types.js';

/**
 * Environment variable configuration
 */
export interface EmotiveTTSEnvConfig {
  /** TTS provider to use */
  EMOTIVE_TTS_PROVIDER?: 'cartesia' | 'maya' | 'elevenlabs' | 'openai';
  /** Whether to use SSML tags */
  EMOTIVE_TTS_USE_SSML?: string;
  /** Intensity scaling curve */
  EMOTIVE_TTS_INTENSITY_CURVE?: 'linear' | 'logarithmic' | 'exponential';
  /** Default emotion when none detected */
  EMOTIVE_TTS_DEFAULT_EMOTION?: PrimaryEmotion;
  /** Speed when energy is low */
  EMOTIVE_TTS_SPEED_LOW?: string;
  /** Speed when energy is medium */
  EMOTIVE_TTS_SPEED_MEDIUM?: string;
  /** Speed when energy is high */
  EMOTIVE_TTS_SPEED_HIGH?: string;
}

/**
 * Parse boolean from environment variable
 */
function parseBool(value: string | undefined, defaultValue: boolean): boolean {
  if (value === undefined) return defaultValue;
  return value.toLowerCase() === 'true' || value === '1';
}

/**
 * Parse float from environment variable
 */
function parseFloat(value: string | undefined, defaultValue: number): number {
  if (value === undefined) return defaultValue;
  const parsed = Number.parseFloat(value);
  return Number.isNaN(parsed) ? defaultValue : parsed;
}

/**
 * Load configuration from environment variables
 */
export function loadConfigFromEnv(env: EmotiveTTSEnvConfig = {}): Partial<EmotionMappingConfig> {
  const config: Partial<EmotionMappingConfig> = {};

  if (env.EMOTIVE_TTS_PROVIDER) {
    config.provider = env.EMOTIVE_TTS_PROVIDER;
  }

  if (env.EMOTIVE_TTS_USE_SSML !== undefined) {
    config.useSSML = parseBool(env.EMOTIVE_TTS_USE_SSML, true);
  }

  if (env.EMOTIVE_TTS_INTENSITY_CURVE) {
    config.intensityCurve = env.EMOTIVE_TTS_INTENSITY_CURVE;
  }

  if (env.EMOTIVE_TTS_DEFAULT_EMOTION) {
    config.defaultEmotion = env.EMOTIVE_TTS_DEFAULT_EMOTION;
  }

  if (env.EMOTIVE_TTS_SPEED_LOW || env.EMOTIVE_TTS_SPEED_MEDIUM || env.EMOTIVE_TTS_SPEED_HIGH) {
    config.energyToSpeed = {
      low: parseFloat(env.EMOTIVE_TTS_SPEED_LOW, 0.85),
      medium: parseFloat(env.EMOTIVE_TTS_SPEED_MEDIUM, 1.0),
      high: parseFloat(env.EMOTIVE_TTS_SPEED_HIGH, 1.2),
    };
  }

  return config;
}

/**
 * Cartesia-specific recommended configuration
 */
export const CARTESIA_RECOMMENDED_CONFIG: Partial<EmotionMappingConfig> = {
  provider: 'cartesia',
  useSSML: true,
  intensityCurve: 'linear',
  energyToSpeed: {
    low: 0.8,
    medium: 1.0,
    high: 1.25,
  },
};

/**
 * Recommended emotive voice IDs for Cartesia
 * These voices are optimized for emotional expression
 */
export const CARTESIA_EMOTIVE_VOICE_IDS: Record<string, string> = {
  // Female voices
  maya: 'a0e99841-438c-4a64-b679-ae501e7d6091',
  tessa: '2ee87190-8f84-4925-97da-e52547f9462c',
  dana: 'b7d50908-b17c-442d-ad8d-810c63997ed9',
  marian: 'c45bc5ec-dc68-4feb-8829-6e6b2748095d',
  // Male voices
  leo: '39ec52e8-5c10-4075-9f01-7b14b5c04b22',
  jace: 'cc7dba3d-b6e1-4d9b-8813-1d2b0da0c3a9',
  kyle: 'c6431e82-97c3-4dd8-8d0c-3db20c328f43',
  gavin: 'bf991597-6c13-47e4-8411-91ec2de5c466',
};

/**
 * Validate configuration
 */
export function validateConfig(config: Partial<EmotionMappingConfig>): string[] {
  const errors: string[] = [];

  if (config.provider && !['cartesia', 'maya', 'elevenlabs', 'openai'].includes(config.provider)) {
    errors.push(`Invalid provider: ${config.provider}`);
  }

  if (config.intensityCurve && !['linear', 'logarithmic', 'exponential'].includes(config.intensityCurve)) {
    errors.push(`Invalid intensity curve: ${config.intensityCurve}`);
  }

  if (config.energyToSpeed) {
    const { low, medium, high } = config.energyToSpeed;
    if (low !== undefined && (low < 0.5 || low > 2.0)) {
      errors.push(`energyToSpeed.low must be between 0.5 and 2.0, got ${low}`);
    }
    if (medium !== undefined && (medium < 0.5 || medium > 2.0)) {
      errors.push(`energyToSpeed.medium must be between 0.5 and 2.0, got ${medium}`);
    }
    if (high !== undefined && (high < 0.5 || high > 2.0)) {
      errors.push(`energyToSpeed.high must be between 0.5 and 2.0, got ${high}`);
    }
  }

  return errors;
}

/**
 * Sample configuration file content (YAML format)
 */
export const SAMPLE_CONFIG_YAML = `
# Emotive TTS Configuration
# See: https://docs.cartesia.ai/build-with-cartesia/sonic-3/volume-speed-emotion

emotive_tts:
  # TTS provider: cartesia, maya, elevenlabs, openai
  provider: cartesia

  # Source of emotional state
  emotion_source: sable-mcp

  # Whether to use SSML tags for inline emotion control
  use_ssml: true

  # How to scale emotion intensity (linear, logarithmic, exponential)
  intensity_curve: linear

  # Default emotion when none detected
  default_emotion: neutral

  # Map body state energy to speaking speed
  energy_to_speed:
    low: 0.85    # Speed when energy < 0.3
    medium: 1.0  # Speed when energy 0.3-0.7
    high: 1.2    # Speed when energy > 0.7

  # Custom emotion mappings (optional)
  # Overrides default mapping from primary emotions
  custom_mappings:
    joy:
      low: content
      medium: happy
      high: excited
    sadness:
      low: tired
      medium: sad
      high: melancholic
    anger:
      low: frustrated
      medium: angry
      high: outraged
`;

/**
 * Sample .env configuration
 */
export const SAMPLE_ENV_CONFIG = `
# Emotive TTS Configuration

# TTS provider (cartesia, maya, elevenlabs, openai)
EMOTIVE_TTS_PROVIDER=cartesia

# Use SSML tags for emotion control
EMOTIVE_TTS_USE_SSML=true

# Intensity scaling curve
EMOTIVE_TTS_INTENSITY_CURVE=linear

# Default emotion
EMOTIVE_TTS_DEFAULT_EMOTION=neutral

# Energy to speed mapping
EMOTIVE_TTS_SPEED_LOW=0.85
EMOTIVE_TTS_SPEED_MEDIUM=1.0
EMOTIVE_TTS_SPEED_HIGH=1.2

# Cartesia voice ID (recommended emotive voices)
# See CARTESIA_EMOTIVE_VOICE_IDS for options
CARTESIA_VOICE_ID=a0e99841-438c-4a64-b679-ae501e7d6091
`;
