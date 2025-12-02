/**
 * Sable MCP to Emotive Voice State Mapper
 *
 * Converts emotional state from sable-mcp into the unified EmotiveVoiceState
 * format that can be consumed by any TTS emotion adapter.
 */

import type {
  EmotiveVoiceState,
  PrimaryEmotion,
  NuancedEmotion,
  BodyState,
  BackgroundFeeling,
  SableEmotionalState,
  SableEmotionResult,
} from './types.js';

/**
 * Map sable emotion type to primary emotion
 */
function mapSableEmotionType(sableType: string): PrimaryEmotion {
  const typeMap: Record<string, PrimaryEmotion> = {
    joy: 'joy',
    sadness: 'sadness',
    anger: 'anger',
    fear: 'fear',
    disgust: 'disgust',
    surprise: 'surprise',
  };

  return typeMap[sableType] || 'neutral';
}

/**
 * Map sable body state to unified body state
 */
function mapBodyState(sableBodyState: SableEmotionalState['body_state']): BodyState {
  return {
    heartRate: sableBodyState.heart_rate,
    temperature: sableBodyState.temperature,
    tension: sableBodyState.tension,
    energy: sableBodyState.energy,
    breathing: sableBodyState.breathing,
  };
}

/**
 * Map sable background feelings to unified format
 */
function mapBackgroundFeelings(feelings: string[]): BackgroundFeeling[] {
  const validFeelings: BackgroundFeeling[] = [
    'energized', 'fatigued', 'tense', 'relaxed', 'warm', 'cold',
    'aroused', 'calm', 'breathless', 'steady', 'neutral',
  ];

  return feelings.filter((f): f is BackgroundFeeling =>
    validFeelings.includes(f as BackgroundFeeling)
  );
}

/**
 * Infer nuanced emotion from primary emotion, intensity, and body state
 */
function inferNuancedEmotion(
  primary: PrimaryEmotion,
  intensity: number,
  bodyState?: BodyState,
  backgroundFeelings?: BackgroundFeeling[]
): NuancedEmotion | undefined {
  // Joy nuances
  if (primary === 'joy') {
    if (intensity > 0.8) return 'euphoric';
    if (intensity > 0.6) return 'excited';
    if (bodyState?.energy && bodyState.energy < 0.4) return 'content';
    if (backgroundFeelings?.includes('calm')) return 'peaceful';
    if (intensity > 0.4) return 'happy';
    return 'content';
  }

  // Sadness nuances
  if (primary === 'sadness') {
    if (intensity > 0.8) return 'dejected';
    if (bodyState?.energy && bodyState.energy < 0.3) return 'tired';
    if (backgroundFeelings?.includes('calm')) return 'melancholic';
    if (intensity > 0.5) return 'disappointed';
    return 'wistful';
  }

  // Anger nuances
  if (primary === 'anger') {
    if (intensity > 0.8) return 'outraged';
    if (intensity > 0.6) return 'mad';
    if (bodyState?.tension && bodyState.tension > 0.7) return 'agitated';
    return 'frustrated';
  }

  // Fear nuances
  if (primary === 'fear') {
    if (intensity > 0.8) return 'panicked';
    if (intensity > 0.6) return 'alarmed';
    if (bodyState?.tension && bodyState.tension < 0.4) return 'hesitant';
    return 'anxious';
  }

  // Surprise nuances
  if (primary === 'surprise') {
    if (intensity > 0.7) return 'amazed';
    if (bodyState?.energy && bodyState.energy > 0.6) return 'curious';
    return 'surprised';
  }

  // Disgust nuances
  if (primary === 'disgust') {
    if (intensity > 0.7) return 'contempt';
    return 'disgusted';
  }

  // Neutral nuances
  if (primary === 'neutral') {
    if (bodyState?.energy && bodyState.energy > 0.6) return 'contemplative';
    if (backgroundFeelings?.includes('calm')) return 'calm';
    return undefined;
  }

  return undefined;
}

/**
 * Convert sable-mcp emotional state to EmotiveVoiceState
 */
export function sableToEmotiveState(sableState: SableEmotionalState): EmotiveVoiceState {
  // Get primary emotion (highest intensity from emotions array)
  let primaryEmotion: PrimaryEmotion = 'neutral';
  let intensity = 0;

  if (sableState.emotions.length > 0) {
    // Sort by intensity and take the highest
    const sorted = [...sableState.emotions].sort((a, b) => b.intensity - a.intensity);
    const primary = sorted[0];
    primaryEmotion = mapSableEmotionType(primary.type);
    intensity = primary.intensity;
  }

  // Map body state
  const bodyState = mapBodyState(sableState.body_state);

  // Map background feelings
  const backgroundFeelings = mapBackgroundFeelings(sableState.background_feelings);

  // Infer nuanced emotion
  const nuancedEmotion = inferNuancedEmotion(
    primaryEmotion,
    intensity,
    bodyState,
    backgroundFeelings
  );

  return {
    primaryEmotion,
    intensity,
    nuancedEmotion,
    bodyState,
    backgroundFeelings,
    timestamp: sableState.last_updated,
  };
}

/**
 * Convert a single sable emotion result to EmotiveVoiceState
 * Useful when you only have analyze_emotion output
 */
export function sableEmotionToEmotiveState(
  emotion: SableEmotionResult,
  bodyState?: SableEmotionalState['body_state']
): EmotiveVoiceState {
  const primaryEmotion = mapSableEmotionType(emotion.type);
  const mappedBodyState = bodyState ? mapBodyState(bodyState) : undefined;

  const nuancedEmotion = inferNuancedEmotion(
    primaryEmotion,
    emotion.intensity,
    mappedBodyState
  );

  return {
    primaryEmotion,
    intensity: emotion.intensity,
    nuancedEmotion,
    bodyState: mappedBodyState,
    timestamp: new Date().toISOString(),
  };
}

/**
 * Create a neutral EmotiveVoiceState
 */
export function createNeutralState(): EmotiveVoiceState {
  return {
    primaryEmotion: 'neutral',
    intensity: 0,
    bodyState: {
      heartRate: 72,
      temperature: 0,
      tension: 0.2,
      energy: 0.5,
      breathing: 0.3,
    },
    backgroundFeelings: ['calm', 'neutral'],
    timestamp: new Date().toISOString(),
  };
}

/**
 * Blend two emotional states (e.g., for transitions)
 */
export function blendEmotionalStates(
  current: EmotiveVoiceState,
  target: EmotiveVoiceState,
  blendFactor: number // 0 = all current, 1 = all target
): EmotiveVoiceState {
  const clampedFactor = Math.max(0, Math.min(1, blendFactor));

  // Use target's primary emotion if blend factor > 0.5
  const primaryEmotion = clampedFactor > 0.5
    ? target.primaryEmotion
    : current.primaryEmotion;

  // Interpolate intensity
  const intensity =
    current.intensity * (1 - clampedFactor) +
    target.intensity * clampedFactor;

  // Blend body states if both exist
  let bodyState: BodyState | undefined;
  if (current.bodyState && target.bodyState) {
    bodyState = {
      heartRate:
        current.bodyState.heartRate * (1 - clampedFactor) +
        target.bodyState.heartRate * clampedFactor,
      temperature:
        current.bodyState.temperature * (1 - clampedFactor) +
        target.bodyState.temperature * clampedFactor,
      tension:
        current.bodyState.tension * (1 - clampedFactor) +
        target.bodyState.tension * clampedFactor,
      energy:
        current.bodyState.energy * (1 - clampedFactor) +
        target.bodyState.energy * clampedFactor,
      breathing:
        current.bodyState.breathing * (1 - clampedFactor) +
        target.bodyState.breathing * clampedFactor,
    };
  } else {
    bodyState = target.bodyState || current.bodyState;
  }

  // Use target's nuanced emotion if blend > 0.5
  const nuancedEmotion = clampedFactor > 0.5
    ? target.nuancedEmotion
    : current.nuancedEmotion;

  return {
    primaryEmotion,
    intensity,
    nuancedEmotion,
    bodyState,
    backgroundFeelings: target.backgroundFeelings || current.backgroundFeelings,
    timestamp: new Date().toISOString(),
  };
}
