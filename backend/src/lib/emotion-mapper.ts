/**
 * Emotion Mapper - Maps Sable emotions to Maya1 voice tags
 *
 * Converts emotional analysis from Sable's Damasio model into
 * appropriate Maya1 emotion tags for expressive voice synthesis.
 */

import type { EmotionType } from './sable-client.js'
import type { MayaEmotionTag } from './maya-client.js'

export interface EmotionAnalysisResult {
  type: EmotionType
  intensity: number
}

export interface MayaTagPlacement {
  tag: MayaEmotionTag
  position: 'start' | 'end' | 'inline'
}

export interface EmotionMappingConfig {
  intensityThresholds?: {
    low: number
    medium: number
    high: number
  }
}

const DEFAULT_THRESHOLDS = {
  low: 0.3,
  medium: 0.5,
  high: 0.7
}

/**
 * Map Sable emotions to Maya1 tags based on intensity
 */
export function mapEmotionsToMayaTags(
  emotions: EmotionAnalysisResult[],
  config: EmotionMappingConfig = {}
): MayaTagPlacement[] {
  const thresholds = config.intensityThresholds || DEFAULT_THRESHOLDS
  const tags: MayaTagPlacement[] = []

  for (const emotion of emotions) {
    const mappedTags = mapSingleEmotion(emotion, thresholds)
    tags.push(...mappedTags)
  }

  // Deduplicate and prioritize tags
  return deduplicateTags(tags)
}

/**
 * Map a single emotion to Maya tags
 */
function mapSingleEmotion(
  emotion: EmotionAnalysisResult,
  thresholds: { low: number; medium: number; high: number }
): MayaTagPlacement[] {
  const { type, intensity } = emotion
  const tags: MayaTagPlacement[] = []

  switch (type) {
    case 'anger':
      if (intensity >= thresholds.high) {
        tags.push({ tag: 'angry', position: 'start' })
      } else if (intensity >= thresholds.medium) {
        tags.push({ tag: 'sigh', position: 'start' })
      } else if (intensity >= thresholds.low) {
        tags.push({ tag: 'groan', position: 'inline' })
      }
      break

    case 'sadness':
      if (intensity >= thresholds.high) {
        tags.push({ tag: 'cry', position: 'end' })
      } else if (intensity >= thresholds.medium) {
        tags.push({ tag: 'sigh', position: 'end' })
      } else if (intensity >= thresholds.low) {
        tags.push({ tag: 'sniff', position: 'inline' })
      }
      break

    case 'joy':
      if (intensity >= thresholds.high) {
        tags.push({ tag: 'laugh', position: 'end' })
      } else if (intensity >= thresholds.medium) {
        tags.push({ tag: 'giggle', position: 'end' })
      } else if (intensity >= thresholds.low) {
        tags.push({ tag: 'chuckle', position: 'inline' })
      }
      break

    case 'fear':
      if (intensity >= thresholds.medium) {
        tags.push({ tag: 'gasp', position: 'start' })
      }
      if (intensity >= thresholds.high) {
        tags.push({ tag: 'whisper', position: 'start' })
      }
      break

    case 'surprise':
      tags.push({ tag: 'gasp', position: 'start' })
      break

    case 'disgust':
      if (intensity >= thresholds.medium) {
        tags.push({ tag: 'groan', position: 'inline' })
      }
      break
  }

  return tags
}

/**
 * Remove duplicate tags, keeping the first occurrence
 */
function deduplicateTags(tags: MayaTagPlacement[]): MayaTagPlacement[] {
  const seen = new Set<string>()
  return tags.filter(t => {
    const key = `${t.tag}-${t.position}`
    if (seen.has(key)) return false
    seen.add(key)
    return true
  })
}

/**
 * Get the dominant emotion from an array of emotions
 */
export function getDominantEmotion(emotions: EmotionAnalysisResult[]): EmotionAnalysisResult | null {
  if (emotions.length === 0) return null
  return emotions.reduce((max, e) => e.intensity > max.intensity ? e : max)
}

/**
 * Calculate overall emotional intensity
 */
export function calculateOverallIntensity(emotions: EmotionAnalysisResult[]): number {
  if (emotions.length === 0) return 0
  const sum = emotions.reduce((acc, e) => acc + e.intensity, 0)
  return sum / emotions.length
}

/**
 * Determine if emotional content is significant enough to warrant voice expression
 */
export function isEmotionallySignificant(
  emotions: EmotionAnalysisResult[],
  threshold = 0.4
): boolean {
  return emotions.some(e => e.intensity >= threshold)
}

/**
 * Get emotion valence (positive/negative)
 */
export function getEmotionValence(type: EmotionType): 'positive' | 'negative' | 'neutral' {
  switch (type) {
    case 'joy':
      return 'positive'
    case 'anger':
    case 'sadness':
    case 'fear':
    case 'disgust':
      return 'negative'
    case 'surprise':
      return 'neutral'
  }
}

/**
 * Suggest voice tone based on emotions
 */
export function suggestVoiceTone(emotions: EmotionAnalysisResult[]): string {
  const dominant = getDominantEmotion(emotions)
  if (!dominant) return 'neutral'

  const { type, intensity } = dominant

  switch (type) {
    case 'joy':
      return intensity > 0.7 ? 'excited and warm' : 'warm and friendly'
    case 'sadness':
      return intensity > 0.7 ? 'somber and heavy' : 'soft and melancholic'
    case 'anger':
      return intensity > 0.7 ? 'intense and sharp' : 'firm and frustrated'
    case 'fear':
      return intensity > 0.7 ? 'trembling and urgent' : 'nervous and cautious'
    case 'surprise':
      return 'animated and expressive'
    case 'disgust':
      return 'dismissive and cold'
    default:
      return 'neutral'
  }
}

/**
 * Create emotion summary for logging/debugging
 */
export function summarizeEmotions(emotions: EmotionAnalysisResult[]): string {
  if (emotions.length === 0) return 'No emotions detected'

  const sorted = [...emotions].sort((a, b) => b.intensity - a.intensity)
  const descriptions = sorted.map(e =>
    `${e.type} (${(e.intensity * 100).toFixed(0)}%)`
  )

  return descriptions.join(', ')
}

/**
 * Inject Maya emotion tags into text at appropriate positions
 *
 * @param text - The text to add emotion tags to
 * @param tags - Array of emotion tags with position information
 * @returns Text with emotion tags inserted
 *
 * @example
 * ```typescript
 * const text = "I can't believe this happened!";
 * const tags = [{ tag: 'gasp', position: 'start' }];
 * const result = injectEmotionTags(text, tags);
 * // Returns: "<gasp> I can't believe this happened!"
 * ```
 */
export function injectEmotionTags(text: string, tags: MayaTagPlacement[]): string {
  if (!tags.length) return text

  let result = text.trim()

  // Group tags by position
  const startTags = tags.filter(t => t.position === 'start')
  const endTags = tags.filter(t => t.position === 'end')
  const inlineTags = tags.filter(t => t.position === 'inline')

  // Add start tags
  if (startTags.length > 0) {
    const tagString = startTags.map(t => `<${t.tag}>`).join(' ')
    result = `${tagString} ${result}`
  }

  // Add inline tags (before last punctuation if exists, otherwise middle)
  if (inlineTags.length > 0) {
    const tagString = inlineTags.map(t => `<${t.tag}>`).join(' ')
    // Try to insert before final punctuation
    const punctuationMatch = result.match(/^(.*?)([.!?,;])(\s*)$/);
    if (punctuationMatch) {
      result = `${punctuationMatch[1]} ${tagString}${punctuationMatch[2]}${punctuationMatch[3]}`
    } else {
      // No final punctuation, add at end
      result = `${result} ${tagString}`
    }
  }

  // Add end tags
  if (endTags.length > 0) {
    const tagString = endTags.map(t => `<${t.tag}>`).join(' ')
    result = `${result} ${tagString}`
  }

  return result.trim()
}

/**
 * Simple keyword-based emotion analysis fallback
 * Used when Sable API is unavailable or for quick analysis
 *
 * @param text - Text to analyze for emotional content
 * @returns Array of detected emotions with estimated intensity
 *
 * @example
 * ```typescript
 * const emotions = analyzeTextEmotion("I'm so happy and excited!");
 * // Returns: [{ type: 'joy', intensity: 0.75 }]
 * ```
 */
export function analyzeTextEmotion(text: string): EmotionAnalysisResult[] {
  const lowerText = text.toLowerCase()
  const emotions: EmotionAnalysisResult[] = []

  // Emotion keyword patterns with base intensity
  const patterns: Array<{
    type: EmotionType
    keywords: string[]
    baseIntensity: number
  }> = [
    {
      type: 'joy',
      keywords: [
        'happy', 'joy', 'joyful', 'excited', 'great', 'wonderful', 'amazing',
        'love', 'fantastic', 'excellent', 'delighted', 'thrilled', 'glad',
        '😊', '😄', '😃', '🎉', '❤️', '💖'
      ],
      baseIntensity: 0.6
    },
    {
      type: 'sadness',
      keywords: [
        'sad', 'unhappy', 'depressed', 'down', 'miserable', 'crying', 'tears',
        'heartbroken', 'disappointed', 'sorry', 'regret', 'grief', 'mourning',
        '😢', '😭', '😔', '💔'
      ],
      baseIntensity: 0.6
    },
    {
      type: 'anger',
      keywords: [
        'angry', 'mad', 'furious', 'irritated', 'annoyed', 'rage', 'hate',
        'frustrated', 'outraged', 'infuriated', 'livid', 'upset',
        '😠', '😡', '🤬'
      ],
      baseIntensity: 0.7
    },
    {
      type: 'fear',
      keywords: [
        'afraid', 'scared', 'terrified', 'frightened', 'worried', 'anxious',
        'panic', 'nervous', 'dread', 'alarmed', 'horrified', 'concerned',
        '😨', '😰', '😱'
      ],
      baseIntensity: 0.65
    },
    {
      type: 'surprise',
      keywords: [
        'wow', 'shocked', 'surprised', 'unexpected', 'incredible', 'unbelievable',
        'astonishing', 'startled', 'amazed', 'stunned',
        '😮', '😲', '🤯'
      ],
      baseIntensity: 0.6
    },
    {
      type: 'disgust',
      keywords: [
        'disgusting', 'gross', 'awful', 'terrible', 'horrible', 'yuck',
        'nasty', 'revolting', 'repulsive', 'vile',
        '🤢', '🤮', '😖'
      ],
      baseIntensity: 0.6
    }
  ]

  // Intensity modifiers
  const exclamationCount = (text.match(/!/g) || []).length
  const questionCount = (text.match(/\?/g) || []).length
  const capsRatio = (text.match(/[A-Z]/g) || []).length / Math.max(text.length, 1)

  // Calculate intensity boost from text features
  const punctuationBoost = Math.min(exclamationCount * 0.1 + questionCount * 0.05, 0.3)
  const capsBoost = Math.min(capsRatio * 0.2, 0.2)

  // Analyze each emotion type
  for (const pattern of patterns) {
    const matchedKeywords = pattern.keywords.filter(keyword =>
      lowerText.includes(keyword)
    )

    if (matchedKeywords.length > 0) {
      // Calculate intensity
      let intensity = pattern.baseIntensity

      // More keyword matches = higher intensity
      intensity += Math.min((matchedKeywords.length - 1) * 0.1, 0.2)

      // Apply contextual boosts
      intensity += punctuationBoost
      intensity += capsBoost

      // Cap at 1.0
      intensity = Math.min(intensity, 1.0)

      emotions.push({
        type: pattern.type,
        intensity
      })
    }
  }

  // If no emotions detected, return low neutral/joy
  if (emotions.length === 0) {
    emotions.push({
      type: 'joy',
      intensity: 0.2
    })
  }

  // Sort by intensity (highest first)
  return emotions.sort((a, b) => b.intensity - a.intensity)
}

/**
 * Complete emotion processing pipeline: analyze text and inject Maya tags
 *
 * @param text - Original text to process
 * @param emotions - Optional pre-analyzed emotions (uses analyzeTextEmotion if not provided)
 * @param config - Optional emotion mapping configuration
 * @returns Text with emotion tags injected
 *
 * @example
 * ```typescript
 * const result = processEmotions("I'm so excited about this!");
 * // Returns: "<laugh> I'm so excited about this!"
 * ```
 */
export function processEmotions(
  text: string,
  emotions?: EmotionAnalysisResult[],
  config?: EmotionMappingConfig
): string {
  // Use provided emotions or analyze text
  const emotionData = emotions || analyzeTextEmotion(text)

  // Map emotions to Maya tags
  const tags = mapEmotionsToMayaTags(emotionData, config)

  // Inject tags into text
  return injectEmotionTags(text, tags)
}

/**
 * Strip all Maya emotion tags from text
 *
 * @param text - Text containing Maya emotion tags
 * @returns Clean text without emotion tags
 *
 * @example
 * ```typescript
 * const clean = stripEmotionTags("<laugh> This is funny! <giggle>");
 * // Returns: "This is funny!"
 * ```
 */
export function stripEmotionTags(text: string): string {
  // Remove all <tag> patterns
  return text
    .replace(/<[^>]+>/g, '')
    .replace(/\s+/g, ' ')
    .trim()
}
