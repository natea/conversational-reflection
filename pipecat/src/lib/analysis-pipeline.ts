/**
 * Analysis Pipeline - Core analysis for conversational reflection
 *
 * Connects iMessage reading, emotional analysis, and reflection generation
 * into a cohesive pipeline for processing conversations.
 */

import {
  EmotionAnalysisResult,
  MayaTagPlacement,
  mapEmotionsToMayaTags,
  injectEmotionTags,
  getDominantEmotion,
  calculateOverallIntensity,
  isEmotionallySignificant,
  getEmotionValence,
  summarizeEmotions,
  analyzeTextEmotion
} from './emotion-mapper.js'
import { getVoiceProfileManager, ContactVoiceProfile } from './voice-profiles.js'
import type { EmotionType } from './sable-client.js'
import type { VoiceDescription } from './maya-client.js'

// Core interfaces

export interface Message {
  id: string
  text: string
  sender: string
  timestamp: Date
  is_from_me: boolean
}

export interface EmotionalEvent {
  message: Message
  emotions: EmotionAnalysisResult[]
  mayaTags: MayaTagPlacement[]
  dominantEmotion: EmotionAnalysisResult | null
  isSignificant: boolean
  valence: 'positive' | 'negative' | 'neutral'
}

export interface EmotionalPattern {
  type: 'escalation' | 'de-escalation' | 'recurring-theme' | 'shift' | 'mirror'
  description: string
  confidence: number
  relatedMessages: string[] // Message IDs
}

export interface AnalysisResult {
  emotionalEvents: EmotionalEvent[]
  dominantEmotions: Map<string, EmotionAnalysisResult>
  patterns: EmotionalPattern[]
  suggestedReflections: string[]
  summary: string
  metadata: {
    totalMessages: number
    participantCount: number
    timeSpan: {
      start: Date
      end: Date
    }
    averageEmotionalIntensity: number
  }
}

export interface VoiceOutputRequest {
  text: string
  taggedText: string
  voiceDescription: VoiceDescription | string
  emotions: EmotionAnalysisResult[]
  contactId: string
  contactName?: string
}

// Configuration

export interface AnalysisConfig {
  emotionalThreshold?: number
  significanceThreshold?: number
  patternMinOccurrences?: number
  reflectionCount?: number
}

const DEFAULT_CONFIG: Required<AnalysisConfig> = {
  emotionalThreshold: 0.5,
  significanceThreshold: 0.4,
  patternMinOccurrences: 2,
  reflectionCount: 5
}

/**
 * Analyze a conversation for emotional content and patterns
 *
 * @param messages - Array of messages to analyze
 * @param config - Optional analysis configuration
 * @returns Complete analysis result with events, patterns, and reflections
 *
 * @example
 * ```typescript
 * const messages = await readMessages('contact_id');
 * const analysis = await analyzeConversation(messages);
 * console.log(analysis.summary);
 * console.log(analysis.suggestedReflections);
 * ```
 */
export async function analyzeConversation(
  messages: Message[],
  config: AnalysisConfig = {}
): Promise<AnalysisResult> {
  const cfg = { ...DEFAULT_CONFIG, ...config }

  if (messages.length === 0) {
    return createEmptyAnalysis()
  }

  // 1. Analyze each message for emotional content
  const emotionalEvents = analyzeMessages(messages, cfg.significanceThreshold)

  // 2. Extract dominant emotions per sender
  const dominantEmotions = extractDominantEmotions(emotionalEvents)

  // 3. Identify emotional patterns
  const patterns = identifyEmotionalPatterns(emotionalEvents, cfg.patternMinOccurrences)

  // 4. Generate reflection prompts
  const suggestedReflections = generateReflectionPrompts(
    emotionalEvents,
    patterns,
    dominantEmotions,
    cfg.reflectionCount
  )

  // 5. Create conversation summary
  const summary = summarizeConversation(messages, emotionalEvents)

  // 6. Calculate metadata
  const metadata = calculateMetadata(messages, emotionalEvents)

  return {
    emotionalEvents,
    dominantEmotions,
    patterns,
    suggestedReflections,
    summary,
    metadata
  }
}

/**
 * Analyze individual messages for emotional content
 */
function analyzeMessages(
  messages: Message[],
  significanceThreshold: number
): EmotionalEvent[] {
  return messages
    .map(message => analyzeMessage(message))
    .filter(event => event.isSignificant || event.dominantEmotion !== null)
}

/**
 * Analyze a single message
 */
function analyzeMessage(message: Message): EmotionalEvent {
  // Perform emotion analysis on the message text
  const emotions = analyzeTextEmotion(message.text)

  // Map emotions to Maya tags
  const mayaTags = mapEmotionsToMayaTags(emotions)

  // Get dominant emotion
  const dominantEmotion = getDominantEmotion(emotions)

  // Check if emotionally significant
  const isSignificant = isEmotionallySignificant(emotions)

  // Determine valence
  const valence = dominantEmotion
    ? getEmotionValence(dominantEmotion.type)
    : 'neutral'

  return {
    message,
    emotions,
    mayaTags,
    dominantEmotion,
    isSignificant,
    valence
  }
}

/**
 * Extract dominant emotions per sender
 */
function extractDominantEmotions(
  events: EmotionalEvent[]
): Map<string, EmotionAnalysisResult> {
  const senderEmotions = new Map<string, EmotionAnalysisResult[]>()

  // Group emotions by sender
  for (const event of events) {
    const sender = event.message.sender
    if (!senderEmotions.has(sender)) {
      senderEmotions.set(sender, [])
    }
    senderEmotions.get(sender)!.push(...event.emotions)
  }

  // Find dominant emotion for each sender
  const dominantMap = new Map<string, EmotionAnalysisResult>()
  for (const [sender, emotions] of senderEmotions) {
    const dominant = getDominantEmotion(emotions)
    if (dominant) {
      dominantMap.set(sender, dominant)
    }
  }

  return dominantMap
}

/**
 * Identify emotional patterns across the conversation
 *
 * @param events - Emotional events to analyze
 * @param minOccurrences - Minimum occurrences for a pattern to be significant
 * @returns Array of identified patterns
 */
export function identifyEmotionalPatterns(
  events: EmotionalEvent[],
  minOccurrences = 2
): EmotionalPattern[] {
  const patterns: EmotionalPattern[] = []

  if (events.length < 2) return patterns

  // 1. Detect escalation (increasing intensity)
  const escalation = detectEscalation(events)
  if (escalation) patterns.push(escalation)

  // 2. Detect de-escalation (decreasing intensity)
  const deEscalation = detectDeEscalation(events)
  if (deEscalation) patterns.push(deEscalation)

  // 3. Detect recurring emotional themes
  const recurringThemes = detectRecurringThemes(events, minOccurrences)
  patterns.push(...recurringThemes)

  // 4. Detect emotional shifts
  const shifts = detectEmotionalShifts(events)
  patterns.push(...shifts)

  // 5. Detect emotional mirroring between participants
  const mirroring = detectEmotionalMirroring(events)
  if (mirroring) patterns.push(mirroring)

  return patterns
}

/**
 * Detect escalating emotional intensity
 */
function detectEscalation(events: EmotionalEvent[]): EmotionalPattern | null {
  if (events.length < 3) return null

  const intensities = events.map(e => calculateOverallIntensity(e.emotions))
  let increasingCount = 0

  for (let i = 1; i < intensities.length; i++) {
    if (intensities[i] > intensities[i - 1]) {
      increasingCount++
    }
  }

  const ratio = increasingCount / (intensities.length - 1)
  if (ratio >= 0.6) {
    return {
      type: 'escalation',
      description: 'Emotional intensity is escalating throughout the conversation',
      confidence: ratio,
      relatedMessages: events.slice(-3).map(e => e.message.id)
    }
  }

  return null
}

/**
 * Detect de-escalating emotional intensity
 */
function detectDeEscalation(events: EmotionalEvent[]): EmotionalPattern | null {
  if (events.length < 3) return null

  const intensities = events.map(e => calculateOverallIntensity(e.emotions))
  let decreasingCount = 0

  for (let i = 1; i < intensities.length; i++) {
    if (intensities[i] < intensities[i - 1]) {
      decreasingCount++
    }
  }

  const ratio = decreasingCount / (intensities.length - 1)
  if (ratio >= 0.6) {
    return {
      type: 'de-escalation',
      description: 'Emotional intensity is calming down over the conversation',
      confidence: ratio,
      relatedMessages: events.slice(-3).map(e => e.message.id)
    }
  }

  return null
}

/**
 * Detect recurring emotional themes
 */
function detectRecurringThemes(
  events: EmotionalEvent[],
  minOccurrences: number
): EmotionalPattern[] {
  const emotionCounts = new Map<EmotionType, number>()
  const emotionMessages = new Map<EmotionType, string[]>()

  // Count emotion occurrences
  for (const event of events) {
    if (event.dominantEmotion) {
      const type = event.dominantEmotion.type
      emotionCounts.set(type, (emotionCounts.get(type) || 0) + 1)

      if (!emotionMessages.has(type)) {
        emotionMessages.set(type, [])
      }
      emotionMessages.get(type)!.push(event.message.id)
    }
  }

  // Find recurring themes
  const patterns: EmotionalPattern[] = []
  for (const [emotion, count] of emotionCounts) {
    if (count >= minOccurrences) {
      const confidence = Math.min(count / events.length, 1.0)
      patterns.push({
        type: 'recurring-theme',
        description: `${emotion} is a recurring theme (${count} occurrences)`,
        confidence,
        relatedMessages: emotionMessages.get(emotion)!
      })
    }
  }

  return patterns
}

/**
 * Detect significant emotional shifts
 */
function detectEmotionalShifts(events: EmotionalEvent[]): EmotionalPattern[] {
  const patterns: EmotionalPattern[] = []

  for (let i = 1; i < events.length; i++) {
    const prev = events[i - 1]
    const curr = events[i]

    if (!prev.dominantEmotion || !curr.dominantEmotion) continue

    const prevValence = getEmotionValence(prev.dominantEmotion.type)
    const currValence = getEmotionValence(curr.dominantEmotion.type)

    // Detect valence shift
    if (prevValence !== currValence && prevValence !== 'neutral' && currValence !== 'neutral') {
      const shift = prevValence === 'positive' ? 'negative' : 'positive'
      patterns.push({
        type: 'shift',
        description: `Emotional shift from ${prevValence} to ${currValence} (${prev.dominantEmotion.type} → ${curr.dominantEmotion.type})`,
        confidence: Math.min(prev.dominantEmotion.intensity, curr.dominantEmotion.intensity),
        relatedMessages: [prev.message.id, curr.message.id]
      })
    }
  }

  return patterns
}

/**
 * Detect emotional mirroring between participants
 */
function detectEmotionalMirroring(events: EmotionalEvent[]): EmotionalPattern | null {
  const senderEmotions = new Map<string, EmotionType[]>()

  // Group emotions by sender
  for (const event of events) {
    if (!event.dominantEmotion) continue

    const sender = event.message.sender
    if (!senderEmotions.has(sender)) {
      senderEmotions.set(sender, [])
    }
    senderEmotions.get(sender)!.push(event.dominantEmotion.type)
  }

  // Need at least 2 participants
  if (senderEmotions.size < 2) return null

  // Check for overlapping emotions
  const emotionSets = Array.from(senderEmotions.values()).map(emotions => new Set(emotions))
  const commonEmotions = emotionSets.reduce((acc, set) => {
    return new Set([...acc].filter(x => set.has(x)))
  })

  if (commonEmotions.size >= 2) {
    const allEmotions = new Set<EmotionType>()
    for (const emotions of senderEmotions.values()) {
      emotions.forEach(e => allEmotions.add(e))
    }

    const mirrorRatio = commonEmotions.size / allEmotions.size

    return {
      type: 'mirror',
      description: `Participants are mirroring emotions (${Array.from(commonEmotions).join(', ')})`,
      confidence: mirrorRatio,
      relatedMessages: events.map(e => e.message.id)
    }
  }

  return null
}

/**
 * Generate reflection prompts based on analysis
 *
 * @param events - Emotional events
 * @param patterns - Identified patterns
 * @param dominantEmotions - Dominant emotions per sender
 * @param count - Number of prompts to generate
 * @returns Array of reflection prompts
 */
export function generateReflectionPrompts(
  events: EmotionalEvent[],
  patterns: EmotionalPattern[],
  dominantEmotions: Map<string, EmotionAnalysisResult>,
  count = 5
): string[] {
  const prompts: string[] = []

  // 1. Prompts based on dominant emotions
  for (const [sender, emotion] of dominantEmotions) {
    const senderLabel = sender === 'me' ? 'you' : sender
    prompts.push(
      `What triggered the ${emotion.type} you noticed from ${senderLabel}?`
    )
  }

  // 2. Prompts based on patterns
  for (const pattern of patterns) {
    switch (pattern.type) {
      case 'escalation':
        prompts.push('What might have contributed to the emotional escalation?')
        prompts.push('How could this escalation have been prevented or de-escalated?')
        break
      case 'de-escalation':
        prompts.push('What helped calm the emotional intensity?')
        break
      case 'recurring-theme':
        prompts.push(`The theme of ${pattern.description.split(' ')[0]} keeps appearing. What does this reveal about the relationship?`)
        break
      case 'shift':
        prompts.push('What caused the sudden shift in emotional tone?')
        break
      case 'mirror':
        prompts.push('How did emotional mirroring affect the conversation dynamic?')
        break
    }
  }

  // 3. General reflection prompts
  prompts.push('What unspoken needs or desires were present in this conversation?')
  prompts.push('How did you feel during this exchange, and why?')
  prompts.push('What would you do differently in a similar situation?')
  prompts.push('What did this conversation reveal about your relationship?')

  // Return requested number of prompts (deduplicated)
  return [...new Set(prompts)].slice(0, count)
}

/**
 * Create a text summary of the conversation
 *
 * @param messages - Original messages
 * @param events - Emotional events
 * @returns Human-readable summary
 */
export function summarizeConversation(
  messages: Message[],
  events?: EmotionalEvent[]
): string {
  if (messages.length === 0) {
    return 'No messages to summarize.'
  }

  const participants = new Set(messages.map(m => m.sender))
  const timeSpan = {
    start: messages[0].timestamp,
    end: messages[messages.length - 1].timestamp
  }

  const duration = timeSpan.end.getTime() - timeSpan.start.getTime()
  const durationMinutes = Math.round(duration / 1000 / 60)

  let summary = `Conversation between ${participants.size} participant(s) `
  summary += `over ${durationMinutes} minute(s) with ${messages.length} message(s).\n\n`

  if (events && events.length > 0) {
    const emotionSummaries = events
      .filter(e => e.dominantEmotion)
      .map(e => summarizeEmotions(e.emotions))
      .slice(0, 3)

    if (emotionSummaries.length > 0) {
      summary += `Key emotional moments:\n`
      emotionSummaries.forEach((emoSum, i) => {
        summary += `  ${i + 1}. ${emoSum}\n`
      })
    }
  }

  return summary.trim()
}

/**
 * Calculate metadata about the conversation
 */
function calculateMetadata(
  messages: Message[],
  events: EmotionalEvent[]
): AnalysisResult['metadata'] {
  const participants = new Set(messages.map(m => m.sender))
  const timeSpan = {
    start: messages[0].timestamp,
    end: messages[messages.length - 1].timestamp
  }

  const allEmotions = events.flatMap(e => e.emotions)
  const averageEmotionalIntensity = allEmotions.length > 0
    ? calculateOverallIntensity(allEmotions)
    : 0

  return {
    totalMessages: messages.length,
    participantCount: participants.size,
    timeSpan,
    averageEmotionalIntensity
  }
}

/**
 * Prepare text with emotion tags for voice output
 *
 * @param event - Emotional event to prepare
 * @param contactId - Contact identifier
 * @returns Voice output request ready for TTS
 *
 * @example
 * ```typescript
 * const event = emotionalEvents[0];
 * const voiceRequest = prepareVoiceOutput(event, 'contact_123');
 * // Use with Maya TTS client
 * ```
 */
export function prepareVoiceOutput(
  event: EmotionalEvent,
  contactId: string
): VoiceOutputRequest {
  const profileManager = getVoiceProfileManager()

  // Get or create voice profile
  let profile = profileManager.getContactProfile(contactId)
  if (!profile) {
    // Infer profile from this event
    const observedEmotions = event.emotions.map(e => e.type)
    profile = profileManager.inferProfileFromMessages(
      contactId,
      event.message.sender,
      observedEmotions
    )
  }

  // Inject emotion tags into text
  const taggedText = injectEmotionTags(event.message.text, event.mayaTags)

  // Build voice description string
  const voiceDescription = profileManager.buildContactVoiceString(contactId) || 'neutral voice'

  return {
    text: event.message.text,
    taggedText,
    voiceDescription,
    emotions: event.emotions,
    contactId,
    contactName: profile.name
  }
}

/**
 * Create an empty analysis result
 */
function createEmptyAnalysis(): AnalysisResult {
  return {
    emotionalEvents: [],
    dominantEmotions: new Map(),
    patterns: [],
    suggestedReflections: [],
    summary: 'No messages to analyze.',
    metadata: {
      totalMessages: 0,
      participantCount: 0,
      timeSpan: {
        start: new Date(),
        end: new Date()
      },
      averageEmotionalIntensity: 0
    }
  }
}

/**
 * Batch analyze multiple conversations
 *
 * @param conversationGroups - Array of message arrays (one per conversation)
 * @param config - Optional analysis configuration
 * @returns Array of analysis results
 */
export async function batchAnalyzeConversations(
  conversationGroups: Message[][],
  config?: AnalysisConfig
): Promise<AnalysisResult[]> {
  return Promise.all(
    conversationGroups.map(messages => analyzeConversation(messages, config))
  )
}

/**
 * Export analysis result as JSON
 */
export function exportAnalysis(result: AnalysisResult): string {
  return JSON.stringify(result, (key, value) => {
    // Convert Map to object for JSON serialization
    if (value instanceof Map) {
      return Object.fromEntries(value)
    }
    return value
  }, 2)
}

/**
 * Get emotional timeline from events
 */
export function getEmotionalTimeline(events: EmotionalEvent[]): Array<{
  timestamp: Date
  emotion: EmotionType
  intensity: number
  sender: string
}> {
  return events
    .filter(e => e.dominantEmotion)
    .map(e => ({
      timestamp: e.message.timestamp,
      emotion: e.dominantEmotion!.type,
      intensity: e.dominantEmotion!.intensity,
      sender: e.message.sender
    }))
    .sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime())
}
