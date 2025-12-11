/**
 * Reflection Orchestrator - Main coordinator for reflection sessions
 *
 * This is the central orchestrator that coordinates a complete reflection session,
 * tying together conversation analysis, emotion detection, voice synthesis,
 * and journaling.
 */

import { randomUUID } from 'crypto'
import type { Message } from './imessage-client.js'
import type { EmotionType } from './sable-client.js'
import type { MayaEmotionTag, VoiceDescription } from './maya-client.js'
import { getVoiceProfileManager, type ContactVoiceProfile } from './voice-profiles.js'
import {
  mapEmotionsToMayaTags,
  injectEmotionTags,
  analyzeTextEmotion,
  getDominantEmotion,
  suggestVoiceTone,
  type EmotionAnalysisResult,
  type MayaTagPlacement
} from './emotion-mapper.js'
import { getSableClient } from './sable-client.js'
import { getMayaClient } from './maya-client.js'

/**
 * Analysis result structure
 * TODO: Import from analysis-pipeline.ts when implemented
 */
export interface AnalysisResult {
  emotionalProfile: {
    dominantEmotion: EmotionType
    emotionalRange: EmotionType[]
    intensityPattern: 'stable' | 'volatile' | 'escalating' | 'declining'
    averageIntensity: number
  }
  conversationMetrics: {
    messageCount: number
    averageLength: number
    responseTime: number
    turnsPerSide: { me: number; them: number }
  }
  topicFlow: Array<{
    topic: string
    messageIndices: number[]
    sentiment: 'positive' | 'neutral' | 'negative'
  }>
  keyMoments: Array<{
    messageIndex: number
    type: 'emotional_peak' | 'topic_shift' | 'conflict' | 'resolution' | 'intimacy'
    description: string
    emotionalSignificance: number
  }>
}

/**
 * Conversation context structure
 * TODO: Import from conversation-analyzer.ts when implemented
 */
export interface ConversationContext {
  relationshipType: 'friend' | 'family' | 'romantic' | 'colleague' | 'acquaintance' | 'unknown'
  intimacyLevel: number // 0-1
  communicationPattern: 'balanced' | 'one-sided' | 'reactive' | 'proactive'
  emotionalTone: 'positive' | 'negative' | 'neutral' | 'mixed'
  recentHistory: string[]
}

/**
 * Conversation insights structure
 * TODO: Import from conversation-analyzer.ts when implemented
 */
export interface ConversationInsight {
  category: 'emotional' | 'behavioral' | 'relational' | 'linguistic'
  insight: string
  evidence: string[]
  confidence: number // 0-1
  actionable: boolean
}

/**
 * Relationship dynamics structure
 * TODO: Import from conversation-analyzer.ts when implemented
 */
export interface RelationshipDynamics {
  powerBalance: 'balanced' | 'dominant' | 'submissive'
  conflictResolutionStyle: 'collaborative' | 'avoidant' | 'assertive' | 'passive'
  expressiveness: { me: number; them: number } // 0-1
  supportiveness: { me: number; them: number } // 0-1
  vulnerabilityLevel: number // 0-1
  trustIndicators: string[]
  concernFlags: string[]
}

/**
 * Voice output for synthesis
 */
export interface VoiceOutput {
  type: 'contact' | 'reflection'
  text: string
  voiceDescription: string
  emotionTags: MayaEmotionTag[]
  audioPath?: string
  metadata?: {
    messageIndex?: number
    emotionType?: EmotionType
    intensity?: number
  }
}

/**
 * Journal entry for private reflection
 */
export interface JournalEntry {
  feelings: string
  user_context: string
  technical_insights: string
  world_knowledge?: string
}

/**
 * Complete reflection session
 */
export interface ReflectionSession {
  id: string
  contactId: string
  contactName?: string
  startedAt: Date
  completedAt?: Date
  messages: Message[]
  analysis: AnalysisResult
  context: ConversationContext
  insights: ConversationInsight[]
  dynamics: RelationshipDynamics
  voiceOutputs: VoiceOutput[]
  journalEntry: JournalEntry
}

/**
 * Create a new reflection session from messages
 */
export async function createReflectionSession(
  contactId: string,
  messages: Message[]
): Promise<ReflectionSession> {
  const sessionId = randomUUID()
  const startedAt = new Date()

  // Initialize managers
  const voiceManager = getVoiceProfileManager()
  const sableClient = getSableClient()
  const mayaClient = getMayaClient()

  // Get or infer contact profile
  let contactProfile = voiceManager.getContactProfile(contactId)
  if (!contactProfile) {
    // Infer profile from messages
    const emotions = await analyzeMessagesForEmotions(messages)
    const contactName = extractContactName(messages)
    contactProfile = voiceManager.inferProfileFromMessages(
      contactId,
      contactName,
      emotions.map(e => e.type)
    )
  }

  // Run full analysis pipeline
  const analysis = await analyzeConversation(messages)
  const context = await analyzeContext(messages, contactProfile)
  const insights = await extractInsights(messages, analysis, context)
  const dynamics = await analyzeRelationshipDynamics(messages, analysis)

  // Prepare voice outputs
  const voiceOutputs = prepareVoiceOutputs({
    id: sessionId,
    contactId,
    contactName: contactProfile.name,
    startedAt,
    messages,
    analysis,
    context,
    insights,
    dynamics,
    voiceOutputs: [],
    journalEntry: { feelings: '', user_context: '', technical_insights: '' }
  })

  // Generate journal entry
  const journalEntry = generateJournalEntry({
    id: sessionId,
    contactId,
    contactName: contactProfile.name,
    startedAt,
    messages,
    analysis,
    context,
    insights,
    dynamics,
    voiceOutputs,
    journalEntry: { feelings: '', user_context: '', technical_insights: '' }
  })

  return {
    id: sessionId,
    contactId,
    contactName: contactProfile.name,
    startedAt,
    completedAt: new Date(),
    messages,
    analysis,
    context,
    insights,
    dynamics,
    voiceOutputs,
    journalEntry
  }
}

/**
 * Prepare voice outputs for key emotional moments
 */
export function prepareVoiceOutputs(session: ReflectionSession): VoiceOutput[] {
  const outputs: VoiceOutput[] = []
  const voiceManager = getVoiceProfileManager()
  const contactProfile = voiceManager.getContactProfile(session.contactId)

  // Select emotionally significant messages (top 3-5)
  const keyMoments = session.analysis.keyMoments
    .filter(m => m.emotionalSignificance >= 0.7)
    .sort((a, b) => b.emotionalSignificance - a.emotionalSignificance)
    .slice(0, 5)

  for (const moment of keyMoments) {
    const message = session.messages[moment.messageIndex]
    if (!message) continue

    // Analyze emotion in this message
    const emotions = analyzeTextEmotion(message.text)
    const tags = mapEmotionsToMayaTags(emotions)

    // Build voice output for contact's message
    if (!message.isFromMe && contactProfile) {
      const voiceDesc = voiceManager.buildContactVoiceString(session.contactId) || 'neutral voice'
      const emotionTags = tags.map(t => t.tag)

      outputs.push({
        type: 'contact',
        text: message.text,
        voiceDescription: voiceDesc,
        emotionTags,
        metadata: {
          messageIndex: moment.messageIndex,
          emotionType: getDominantEmotion(emotions)?.type,
          intensity: getDominantEmotion(emotions)?.intensity
        }
      })
    }
  }

  // Add AI reflection voice
  const reflectionText = generateReflectionNarration(session)
  const aiProfile = voiceManager.getAIProfile()
  const tone = determineReflectionTone(session.analysis)

  outputs.push({
    type: 'reflection',
    text: reflectionText,
    voiceDescription: voiceManager.buildAIVoiceString(tone),
    emotionTags: [] // AI voice doesn't use emotion tags
  })

  return outputs
}

/**
 * Generate journal entry from session analysis
 */
export function generateJournalEntry(session: ReflectionSession): JournalEntry {
  const { analysis, context, insights, dynamics } = session

  // Feelings section - emotional response to the conversation
  const feelings = generateFeelingsSection(analysis, insights)

  // User context section - relationship patterns and observations
  const user_context = generateUserContextSection(context, dynamics, session.contactName)

  // Technical insights section - analytical findings
  const technical_insights = generateTechnicalInsightsSection(analysis, insights)

  // Optional world knowledge section
  const world_knowledge = generateWorldKnowledgeSection(insights)

  return {
    feelings,
    user_context,
    technical_insights,
    world_knowledge: world_knowledge || undefined
  }
}

/**
 * Get human-readable session summary
 */
export function getSessionSummary(session: ReflectionSession): string {
  const { analysis, context, insights, dynamics } = session
  const contactName = session.contactName || 'Unknown'

  const summary: string[] = []

  summary.push(`# Reflection Session: ${contactName}`)
  summary.push(`Session ID: ${session.id}`)
  summary.push(`Date: ${session.startedAt.toLocaleString()}`)
  summary.push(`Messages analyzed: ${session.messages.length}`)
  summary.push('')

  // Emotional overview
  summary.push('## Emotional Profile')
  summary.push(`Dominant emotion: ${analysis.emotionalProfile.dominantEmotion}`)
  summary.push(`Intensity pattern: ${analysis.emotionalProfile.intensityPattern}`)
  summary.push(`Average intensity: ${(analysis.emotionalProfile.averageIntensity * 100).toFixed(0)}%`)
  summary.push('')

  // Relationship context
  summary.push('## Relationship Context')
  summary.push(`Type: ${context.relationshipType}`)
  summary.push(`Intimacy level: ${(context.intimacyLevel * 100).toFixed(0)}%`)
  summary.push(`Communication pattern: ${context.communicationPattern}`)
  summary.push('')

  // Key insights
  summary.push('## Key Insights')
  const topInsights = insights
    .filter(i => i.confidence >= 0.7)
    .slice(0, 5)

  for (const insight of topInsights) {
    summary.push(`- [${insight.category}] ${insight.insight}`)
  }
  summary.push('')

  // Dynamics
  summary.push('## Relationship Dynamics')
  summary.push(`Power balance: ${dynamics.powerBalance}`)
  summary.push(`Conflict resolution: ${dynamics.conflictResolutionStyle}`)
  summary.push(`Vulnerability level: ${(dynamics.vulnerabilityLevel * 100).toFixed(0)}%`)

  if (dynamics.concernFlags.length > 0) {
    summary.push('')
    summary.push('### Concern Flags:')
    for (const flag of dynamics.concernFlags) {
      summary.push(`- ${flag}`)
    }
  }

  return summary.join('\n')
}

/**
 * Export session data for storage/review
 */
export function exportSession(session: ReflectionSession): object {
  return {
    id: session.id,
    contactId: session.contactId,
    contactName: session.contactName,
    startedAt: session.startedAt.toISOString(),
    completedAt: session.completedAt?.toISOString(),
    messageCount: session.messages.length,
    analysis: session.analysis,
    context: session.context,
    insights: session.insights,
    dynamics: session.dynamics,
    journalEntry: session.journalEntry,
    voiceOutputCount: session.voiceOutputs.length
  }
}

/**
 * Synthesize voice outputs to audio files
 */
export async function synthesizeVoiceOutputs(session: ReflectionSession): Promise<void> {
  const mayaClient = getMayaClient()

  for (const output of session.voiceOutputs) {
    try {
      // Map emotion tags to Maya format
      const emotionTags = output.emotionTags.map(tag => ({
        tag,
        position: 'start' as const
      }))

      // Generate audio
      const audioPath = await mayaClient.speak({
        text: output.text,
        voiceDescription: output.voiceDescription,
        emotionTags
      })

      output.audioPath = audioPath
    } catch (error) {
      console.error(`Failed to synthesize voice output: ${error}`)
      // Continue with other outputs
    }
  }
}

// ============================================================================
// Helper Functions (Placeholders for future implementation)
// ============================================================================

/**
 * Analyze conversation messages
 * TODO: Implement in analysis-pipeline.ts
 */
async function analyzeConversation(messages: Message[]): Promise<AnalysisResult> {
  // Placeholder implementation
  const emotions = await analyzeMessagesForEmotions(messages)
  const dominantEmotion = getDominantEmotion(emotions)

  return {
    emotionalProfile: {
      dominantEmotion: dominantEmotion?.type || 'joy',
      emotionalRange: [...new Set(emotions.map(e => e.type))],
      intensityPattern: 'stable',
      averageIntensity: emotions.reduce((sum, e) => sum + e.intensity, 0) / emotions.length || 0.5
    },
    conversationMetrics: {
      messageCount: messages.length,
      averageLength: messages.reduce((sum, m) => sum + m.text.length, 0) / messages.length,
      responseTime: 0,
      turnsPerSide: {
        me: messages.filter(m => m.isFromMe).length,
        them: messages.filter(m => !m.isFromMe).length
      }
    },
    topicFlow: [],
    keyMoments: messages
      .map((msg, index) => {
        const msgEmotions = analyzeTextEmotion(msg.text)
        const intensity = getDominantEmotion(msgEmotions)?.intensity || 0

        return {
          messageIndex: index,
          type: 'emotional_peak' as const,
          description: `Emotional moment: ${msg.text.substring(0, 50)}...`,
          emotionalSignificance: intensity
        }
      })
      .filter(m => m.emotionalSignificance >= 0.5)
  }
}

/**
 * Analyze conversation context
 * TODO: Implement in conversation-analyzer.ts
 */
async function analyzeContext(
  messages: Message[],
  contactProfile: ContactVoiceProfile | null
): Promise<ConversationContext> {
  return {
    relationshipType: (contactProfile?.relationshipType === 'other' ? 'unknown' : contactProfile?.relationshipType) || 'unknown',
    intimacyLevel: 0.5,
    communicationPattern: 'balanced',
    emotionalTone: 'neutral',
    recentHistory: []
  }
}

/**
 * Extract insights from conversation
 * TODO: Implement in conversation-analyzer.ts
 */
async function extractInsights(
  messages: Message[],
  analysis: AnalysisResult,
  context: ConversationContext
): Promise<ConversationInsight[]> {
  const insights: ConversationInsight[] = []

  // Example insight
  if (analysis.emotionalProfile.intensityPattern === 'escalating') {
    insights.push({
      category: 'emotional',
      insight: 'Emotional intensity is increasing throughout the conversation',
      evidence: ['Multiple high-intensity moments detected', 'Progressive escalation pattern'],
      confidence: 0.8,
      actionable: true
    })
  }

  return insights
}

/**
 * Analyze relationship dynamics
 * TODO: Implement in conversation-analyzer.ts
 */
async function analyzeRelationshipDynamics(
  messages: Message[],
  analysis: AnalysisResult
): Promise<RelationshipDynamics> {
  return {
    powerBalance: 'balanced',
    conflictResolutionStyle: 'collaborative',
    expressiveness: { me: 0.5, them: 0.5 },
    supportiveness: { me: 0.5, them: 0.5 },
    vulnerabilityLevel: 0.5,
    trustIndicators: [],
    concernFlags: []
  }
}

/**
 * Analyze emotions across all messages
 */
async function analyzeMessagesForEmotions(messages: Message[]): Promise<EmotionAnalysisResult[]> {
  const allEmotions: EmotionAnalysisResult[] = []

  for (const message of messages) {
    const emotions = analyzeTextEmotion(message.text)
    allEmotions.push(...emotions)
  }

  return allEmotions
}

/**
 * Extract contact name from messages
 */
function extractContactName(messages: Message[]): string | undefined {
  const firstOtherMessage = messages.find(m => !m.isFromMe)
  return firstOtherMessage?.sender
}

/**
 * Generate reflection narration
 */
function generateReflectionNarration(session: ReflectionSession): string {
  const { analysis, insights } = session
  const parts: string[] = []

  parts.push(
    `Reflecting on your conversation with ${session.contactName || 'this contact'}. `
  )

  parts.push(
    `The overall emotional tone was ${analysis.emotionalProfile.dominantEmotion}, ` +
    `with an intensity pattern that was ${analysis.emotionalProfile.intensityPattern}. `
  )

  const topInsight = insights.find(i => i.confidence >= 0.7)
  if (topInsight) {
    parts.push(`A key observation: ${topInsight.insight}. `)
  }

  parts.push('Take a moment to consider how this conversation made you feel.')

  return parts.join('')
}

/**
 * Determine appropriate tone for reflection
 */
function determineReflectionTone(analysis: AnalysisResult): string {
  const { dominantEmotion, intensityPattern } = analysis.emotionalProfile

  if (dominantEmotion === 'anger' || dominantEmotion === 'sadness') {
    return 'gentle and concerned'
  }

  if (dominantEmotion === 'joy') {
    return 'warm and encouraging'
  }

  if (intensityPattern === 'volatile') {
    return 'calm and steady'
  }

  return 'neutral and thoughtful'
}

/**
 * Generate feelings section for journal
 */
function generateFeelingsSection(
  analysis: AnalysisResult,
  insights: ConversationInsight[]
): string {
  const parts: string[] = []

  parts.push(
    `This conversation evoked ${analysis.emotionalProfile.dominantEmotion} as the primary emotion. `
  )

  const emotionalInsights = insights.filter(i => i.category === 'emotional')
  if (emotionalInsights.length > 0) {
    parts.push(`Emotionally, ${emotionalInsights[0].insight.toLowerCase()}. `)
  }

  parts.push(
    `The intensity was ${analysis.emotionalProfile.intensityPattern}, ` +
    `which ${analysis.emotionalProfile.intensityPattern === 'stable' ? 'suggests a balanced exchange' : 'indicates emotional variation'}. `
  )

  return parts.join('')
}

/**
 * Generate user context section for journal
 */
function generateUserContextSection(
  context: ConversationContext,
  dynamics: RelationshipDynamics,
  contactName?: string
): string {
  const parts: string[] = []

  parts.push(
    `My relationship with ${contactName || 'this person'} appears to be ${context.relationshipType}. `
  )

  parts.push(
    `The communication pattern is ${context.communicationPattern}, ` +
    `with a power dynamic that seems ${dynamics.powerBalance}. `
  )

  if (dynamics.vulnerabilityLevel >= 0.7) {
    parts.push('This conversation involved a high level of vulnerability and openness. ')
  }

  if (dynamics.concernFlags.length > 0) {
    parts.push(`Some areas of concern: ${dynamics.concernFlags.join(', ')}. `)
  }

  return parts.join('')
}

/**
 * Generate technical insights section for journal
 */
function generateTechnicalInsightsSection(
  analysis: AnalysisResult,
  insights: ConversationInsight[]
): string {
  const parts: string[] = []

  parts.push(
    `Analyzed ${analysis.conversationMetrics.messageCount} messages. `
  )

  parts.push(
    `The conversation involved ${analysis.topicFlow.length} distinct topics. `
  )

  const behavioralInsights = insights.filter(i => i.category === 'behavioral')
  if (behavioralInsights.length > 0) {
    parts.push(`Behavioral pattern: ${behavioralInsights[0].insight}. `)
  }

  return parts.join('')
}

/**
 * Generate world knowledge section for journal
 */
function generateWorldKnowledgeSection(insights: ConversationInsight[]): string | null {
  const worldInsights = insights.filter(
    i => i.category === 'relational' || i.category === 'linguistic'
  )

  if (worldInsights.length === 0) return null

  return worldInsights.map(i => i.insight).join(' ')
}
