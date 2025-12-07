/**
 * Conversation Analyzer - Advanced analysis of iMessage conversations
 *
 * Processes message threads to extract insights about conversation patterns,
 * emotional dynamics, relationship health, and communication styles.
 */

import type { Message } from './imessage-client.js'
import type { EmotionAnalysisResult } from './emotion-mapper.js'
import { getEmotionValence } from './emotion-mapper.js'

/**
 * Contextual information about a conversation
 */
export interface ConversationContext {
  /** List of participants in the conversation */
  participants: string[]
  /** Time range of the conversation */
  timespan: { start: Date; end: Date }
  /** Total number of messages */
  messageCount: number
  /** Average time between messages in milliseconds */
  averageResponseTime: number
  /** Overall emotional trend across the conversation */
  emotionalTrend: 'escalating' | 'de-escalating' | 'stable' | 'volatile'
}

/**
 * Emotional event tied to specific messages
 */
export interface EmotionalEvent {
  /** Message ID this emotion is associated with */
  messageId: number
  /** Detected emotions with intensities */
  emotions: EmotionAnalysisResult[]
  /** Timestamp of the emotional event */
  timestamp: Date
}

/**
 * Insights extracted from conversation analysis
 */
export interface ConversationInsight {
  /** Type of insight */
  type: 'pattern' | 'concern' | 'positive' | 'neutral'
  /** Human-readable description */
  description: string
  /** Confidence level (0-1) */
  confidence: number
  /** IDs of messages related to this insight */
  relatedMessages: number[]
}

/**
 * Analysis of relationship dynamics between participants
 */
export interface RelationshipDynamics {
  /** Balance of conversation participation (0-1, where 0.5 is perfectly balanced) */
  reciprocity: number
  /** How aligned emotions are between participants (0-1) */
  emotionalAlignment: number
  /** Overall communication style */
  communicationStyle: 'supportive' | 'conflictual' | 'neutral' | 'mixed'
  /** Recommended approach for future interactions */
  suggestedApproach: string
}

/**
 * Analyze conversation context from messages
 *
 * @param messages - Array of messages to analyze
 * @returns Contextual information about the conversation
 */
export function analyzeContext(messages: Message[]): ConversationContext {
  if (messages.length === 0) {
    throw new Error('Cannot analyze empty conversation')
  }

  // Sort messages by timestamp
  const sorted = [...messages].sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime())

  // Extract participants
  const participantSet = new Set<string>()
  sorted.forEach(msg => {
    participantSet.add(msg.sender)
  })
  const participants = Array.from(participantSet)

  // Calculate timespan
  const timespan = {
    start: sorted[0].timestamp,
    end: sorted[sorted.length - 1].timestamp
  }

  // Calculate average response time
  const responseTimes: number[] = []
  for (let i = 1; i < sorted.length; i++) {
    const timeDiff = sorted[i].timestamp.getTime() - sorted[i - 1].timestamp.getTime()
    // Only count reasonable response times (< 24 hours)
    if (timeDiff < 24 * 60 * 60 * 1000) {
      responseTimes.push(timeDiff)
    }
  }

  const averageResponseTime = responseTimes.length > 0
    ? responseTimes.reduce((sum, time) => sum + time, 0) / responseTimes.length
    : 0

  // Determine emotional trend (requires emotion data, default to stable)
  const emotionalTrend = 'stable'

  return {
    participants,
    timespan,
    messageCount: messages.length,
    averageResponseTime,
    emotionalTrend
  }
}

/**
 * Determine emotional trend from emotion events
 *
 * @param emotions - Array of emotional events with timestamps
 * @returns Trend classification
 */
export function determineEmotionalTrend(
  emotions: EmotionalEvent[]
): 'escalating' | 'de-escalating' | 'stable' | 'volatile' {
  if (emotions.length < 3) {
    return 'stable'
  }

  // Sort by timestamp
  const sorted = [...emotions].sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime())

  // Calculate average intensity for each third of the conversation
  const thirdSize = Math.floor(sorted.length / 3)
  const firstThird = sorted.slice(0, thirdSize)
  const lastThird = sorted.slice(-thirdSize)

  const avgIntensity = (events: EmotionalEvent[]) => {
    const allEmotions = events.flatMap(e => e.emotions)
    if (allEmotions.length === 0) return 0
    return allEmotions.reduce((sum, e) => sum + e.intensity, 0) / allEmotions.length
  }

  const firstAvg = avgIntensity(firstThird)
  const lastAvg = avgIntensity(lastThird)

  // Calculate variance to detect volatility
  const allIntensities = sorted.flatMap(e => e.emotions.map(em => em.intensity))
  const mean = allIntensities.reduce((sum, i) => sum + i, 0) / allIntensities.length
  const variance = allIntensities.reduce((sum, i) => sum + Math.pow(i - mean, 2), 0) / allIntensities.length
  const stdDev = Math.sqrt(variance)

  // High variance indicates volatility
  if (stdDev > 0.25) {
    return 'volatile'
  }

  // Check trend
  const diff = lastAvg - firstAvg
  if (diff > 0.15) {
    return 'escalating'
  } else if (diff < -0.15) {
    return 'de-escalating'
  } else {
    return 'stable'
  }
}

/**
 * Extract insights from messages and emotional analysis
 *
 * @param messages - Array of messages
 * @param emotions - Array of emotional events
 * @returns Array of insights discovered
 */
export function extractInsights(
  messages: Message[],
  emotions: EmotionalEvent[]
): ConversationInsight[] {
  const insights: ConversationInsight[] = []

  // Create emotion lookup map
  const emotionMap = new Map<number, EmotionalEvent>()
  emotions.forEach(e => emotionMap.set(e.messageId, e))

  // 1. Check for repeated emotional patterns
  const emotionSequence = emotions.map(e => {
    const dominant = e.emotions.reduce((max, curr) =>
      curr.intensity > max.intensity ? curr : max
    )
    return dominant.type
  })

  // Look for repeated patterns (3+ consecutive similar emotions)
  let consecutiveCount = 1
  let lastEmotion = emotionSequence[0]

  for (let i = 1; i < emotionSequence.length; i++) {
    if (emotionSequence[i] === lastEmotion) {
      consecutiveCount++
      if (consecutiveCount >= 3) {
        const relatedMsgs = emotions
          .slice(i - consecutiveCount + 1, i + 1)
          .map(e => e.messageId)

        insights.push({
          type: 'pattern',
          description: `Sustained pattern of ${lastEmotion} detected across multiple messages`,
          confidence: Math.min(0.6 + (consecutiveCount - 3) * 0.1, 0.95),
          relatedMessages: relatedMsgs
        })
        break
      }
    } else {
      consecutiveCount = 1
      lastEmotion = emotionSequence[i]
    }
  }

  // 2. Flag high-intensity negative emotions
  const negativeEmotions = emotions.filter(e =>
    e.emotions.some(em => {
      const valence = getEmotionValence(em.type)
      return valence === 'negative' && em.intensity > 0.7
    })
  )

  if (negativeEmotions.length > 0) {
    insights.push({
      type: 'concern',
      description: `High-intensity negative emotions detected in ${negativeEmotions.length} message(s)`,
      confidence: 0.85,
      relatedMessages: negativeEmotions.map(e => e.messageId)
    })
  }

  // 3. Identify escalation patterns
  const escalationPoints = findEscalationPoints(emotions)
  if (escalationPoints.length > 0) {
    insights.push({
      type: 'concern',
      description: 'Emotional escalation detected - intensity increasing over time',
      confidence: 0.8,
      relatedMessages: escalationPoints
    })
  }

  // 4. Find positive moments
  const positiveEmotions = emotions.filter(e =>
    e.emotions.some(em => {
      const valence = getEmotionValence(em.type)
      return valence === 'positive' && em.intensity > 0.6
    })
  )

  if (positiveEmotions.length >= 3) {
    insights.push({
      type: 'positive',
      description: `${positiveEmotions.length} moments of positive emotional connection`,
      confidence: 0.75,
      relatedMessages: positiveEmotions.map(e => e.messageId)
    })
  }

  // 5. Check for emotional misalignment (requires multiple participants)
  const context = analyzeContext(messages)
  if (context.participants.length > 1) {
    const misalignment = detectEmotionalMisalignment(messages, emotions)
    if (misalignment.length > 0) {
      insights.push({
        type: 'concern',
        description: 'Emotional misalignment detected between participants',
        confidence: 0.7,
        relatedMessages: misalignment
      })
    }
  }

  // 6. Note neutral/stable conversations
  if (insights.length === 0 && emotions.length > 0) {
    insights.push({
      type: 'neutral',
      description: 'Conversation maintains stable, neutral emotional tone',
      confidence: 0.6,
      relatedMessages: []
    })
  }

  return insights
}

/**
 * Find points where emotions are escalating
 */
function findEscalationPoints(emotions: EmotionalEvent[]): number[] {
  const sorted = [...emotions].sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime())
  const escalationPoints: number[] = []

  for (let i = 2; i < sorted.length; i++) {
    const window = sorted.slice(i - 2, i + 1)
    const intensities = window.map(e =>
      Math.max(...e.emotions.map(em => em.intensity))
    )

    // Check if intensity is increasing
    if (intensities[0] < intensities[1] && intensities[1] < intensities[2]) {
      const increase = intensities[2] - intensities[0]
      if (increase > 0.2) {
        escalationPoints.push(window[2].messageId)
      }
    }
  }

  return escalationPoints
}

/**
 * Detect emotional misalignment between participants
 */
function detectEmotionalMisalignment(
  messages: Message[],
  emotions: EmotionalEvent[]
): number[] {
  const misalignedMessages: number[] = []
  const emotionMap = new Map<number, EmotionalEvent>()
  emotions.forEach(e => emotionMap.set(e.messageId, e))

  // Look for consecutive messages with opposite emotional valences
  for (let i = 1; i < messages.length; i++) {
    const prevMsg = messages[i - 1]
    const currMsg = messages[i]

    // Only check if different senders
    if (prevMsg.sender === currMsg.sender) continue

    const prevEmotion = emotionMap.get(prevMsg.id)
    const currEmotion = emotionMap.get(currMsg.id)

    if (prevEmotion && currEmotion) {
      const prevValence = getEmotionValence(
        prevEmotion.emotions[0]?.type || 'joy'
      )
      const currValence = getEmotionValence(
        currEmotion.emotions[0]?.type || 'joy'
      )

      // Opposite valences indicate misalignment
      if (
        (prevValence === 'positive' && currValence === 'negative') ||
        (prevValence === 'negative' && currValence === 'positive')
      ) {
        misalignedMessages.push(currMsg.id)
      }
    }
  }

  return misalignedMessages
}

/**
 * Analyze relationship dynamics between participants
 *
 * @param messages - Array of messages
 * @param emotions - Array of emotional events
 * @returns Relationship dynamics analysis
 */
export function analyzeRelationshipDynamics(
  messages: Message[],
  emotions: EmotionalEvent[]
): RelationshipDynamics {
  // Calculate reciprocity (message balance)
  const messageCounts = new Map<string, number>()
  messages.forEach(msg => {
    messageCounts.set(msg.sender, (messageCounts.get(msg.sender) || 0) + 1)
  })

  const counts = Array.from(messageCounts.values())
  const total = counts.reduce((sum, c) => sum + c, 0)
  const maxCount = Math.max(...counts)
  const minCount = Math.min(...counts)

  // Reciprocity: 1.0 = perfect balance, 0.0 = completely one-sided
  const reciprocity = total > 0 ? 1 - (maxCount - minCount) / total : 0.5

  // Calculate emotional alignment
  const emotionMap = new Map<number, EmotionalEvent>()
  emotions.forEach(e => emotionMap.set(e.messageId, e))

  let alignmentCount = 0
  let comparisonCount = 0

  for (let i = 1; i < messages.length; i++) {
    const prevMsg = messages[i - 1]
    const currMsg = messages[i]

    if (prevMsg.sender === currMsg.sender) continue

    const prevEmotion = emotionMap.get(prevMsg.id)
    const currEmotion = emotionMap.get(currMsg.id)

    if (prevEmotion && currEmotion) {
      const prevValence = getEmotionValence(prevEmotion.emotions[0]?.type || 'joy')
      const currValence = getEmotionValence(currEmotion.emotions[0]?.type || 'joy')

      comparisonCount++
      if (prevValence === currValence) {
        alignmentCount++
      }
    }
  }

  const emotionalAlignment = comparisonCount > 0
    ? alignmentCount / comparisonCount
    : 0.5

  // Determine communication style
  let communicationStyle: 'supportive' | 'conflictual' | 'neutral' | 'mixed'

  const negativeCount = emotions.filter(e =>
    e.emotions.some(em => getEmotionValence(em.type) === 'negative' && em.intensity > 0.6)
  ).length

  const positiveCount = emotions.filter(e =>
    e.emotions.some(em => getEmotionValence(em.type) === 'positive' && em.intensity > 0.6)
  ).length

  if (negativeCount > positiveCount * 1.5) {
    communicationStyle = 'conflictual'
  } else if (positiveCount > negativeCount * 1.5) {
    communicationStyle = 'supportive'
  } else if (Math.abs(positiveCount - negativeCount) <= 2 && positiveCount + negativeCount > 5) {
    communicationStyle = 'mixed'
  } else {
    communicationStyle = 'neutral'
  }

  // Generate suggested approach
  const suggestedApproach = generateSuggestedApproach(
    reciprocity,
    emotionalAlignment,
    communicationStyle
  )

  return {
    reciprocity,
    emotionalAlignment,
    communicationStyle,
    suggestedApproach
  }
}

/**
 * Generate suggested approach based on dynamics
 */
function generateSuggestedApproach(
  reciprocity: number,
  alignment: number,
  style: 'supportive' | 'conflictual' | 'neutral' | 'mixed'
): string {
  const suggestions: string[] = []

  // Reciprocity-based suggestions
  if (reciprocity < 0.3) {
    suggestions.push('Consider balancing conversation participation')
  } else if (reciprocity > 0.8) {
    suggestions.push('Conversation shows healthy mutual engagement')
  }

  // Alignment-based suggestions
  if (alignment < 0.3) {
    suggestions.push('Work on emotional understanding and validation')
  } else if (alignment > 0.7) {
    suggestions.push('Strong emotional connection evident')
  }

  // Style-based suggestions
  switch (style) {
    case 'conflictual':
      suggestions.push('De-escalation and active listening recommended')
      break
    case 'supportive':
      suggestions.push('Continue nurturing positive communication patterns')
      break
    case 'mixed':
      suggestions.push('Address mixed signals to improve clarity')
      break
    case 'neutral':
      suggestions.push('Maintain balanced, respectful communication')
      break
  }

  return suggestions.join('. ') + '.'
}

/**
 * Generate human-readable summary of conversation analysis
 *
 * @param context - Conversation context
 * @param insights - Extracted insights
 * @returns Formatted summary string
 */
export function generateSummary(
  context: ConversationContext,
  insights: ConversationInsight[]
): string {
  const lines: string[] = []

  // Header
  lines.push('=== Conversation Analysis Summary ===\n')

  // Context information
  lines.push(`Participants: ${context.participants.join(', ')}`)
  lines.push(`Messages: ${context.messageCount}`)
  lines.push(`Timespan: ${context.timespan.start.toLocaleDateString()} - ${context.timespan.end.toLocaleDateString()}`)

  // Average response time
  if (context.averageResponseTime > 0) {
    const minutes = Math.floor(context.averageResponseTime / 60000)
    const hours = Math.floor(minutes / 60)
    if (hours > 0) {
      lines.push(`Average response time: ${hours}h ${minutes % 60}m`)
    } else {
      lines.push(`Average response time: ${minutes}m`)
    }
  }

  lines.push(`Emotional trend: ${context.emotionalTrend}`)
  lines.push('')

  // Insights
  if (insights.length > 0) {
    lines.push('Key Insights:')

    // Group by type
    const byType = {
      concern: insights.filter(i => i.type === 'concern'),
      positive: insights.filter(i => i.type === 'positive'),
      pattern: insights.filter(i => i.type === 'pattern'),
      neutral: insights.filter(i => i.type === 'neutral')
    }

    // Concerns first
    byType.concern.forEach(insight => {
      lines.push(`  ⚠️  ${insight.description} (${(insight.confidence * 100).toFixed(0)}% confidence)`)
    })

    // Positive findings
    byType.positive.forEach(insight => {
      lines.push(`  ✓  ${insight.description} (${(insight.confidence * 100).toFixed(0)}% confidence)`)
    })

    // Patterns
    byType.pattern.forEach(insight => {
      lines.push(`  📊 ${insight.description} (${(insight.confidence * 100).toFixed(0)}% confidence)`)
    })

    // Neutral
    byType.neutral.forEach(insight => {
      lines.push(`  •  ${insight.description}`)
    })
  } else {
    lines.push('No significant insights detected.')
  }

  return lines.join('\n')
}
