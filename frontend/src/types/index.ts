// Source Types (Legacy - will be migrated to Contact)
export type SourcePlatform = 'whatsapp' | 'email' | 'journal' | 'imessage' | 'file' | 'link' | 'paste'

export interface Source {
  id: string
  name: string
  platform: SourcePlatform
  previewText: string
  messageCount?: number
  entryCount?: number
  isSyncing?: boolean
  lastUpdated: Date
}

// Contact Types (PRD-aligned)
export type RelationshipType = 'friend' | 'family' | 'colleague' | 'romantic' | 'other'

export interface VoiceProfile {
  description: string           // Maya1 natural language prompt
  gender?: string
  ageRange?: string
  accent?: string
  typicalEmotions: string[]
  speakingStyle?: string
}

export interface Contact {
  id: string                    // Phone/email from iMessage
  name: string
  voiceProfile: VoiceProfile
  relationshipType: RelationshipType
  relationshipNotes?: string
  firstInteraction: Date
  lastInteraction: Date
  totalMessages: number
  typicalValence: number        // -1 to 1 (average emotional valence)
  typicalIntensity: number      // 0 to 1 (average emotional intensity)
}

// Damasio Consciousness Model Types
export interface BodyState {
  timestamp: Date
  energy: number                // 0-1
  stress: number                // 0-1
  arousal: number               // 0-1
  valence: number               // -1 to 1
  temperature: number           // 0-1 (metaphorical)
  tension: number               // 0-1
  fatigue: number               // 0-1
  pain: number                  // 0-1
  homeostaticPressure: number   // 0-1
}

export type EmotionType = 'fear' | 'anger' | 'joy' | 'sadness' | 'disgust' | 'surprise'
export type BackgroundEmotionType = 'malaise' | 'contentment' | 'tension'

export interface EmotionEvent {
  id: string
  timestamp: Date
  emotionType: EmotionType
  intensity: number             // 0-1
  cause: string
  relatedContactId?: string
  relatedMessageId?: string
  backgroundEmotion?: BackgroundEmotionType
  initialIntensity: number      // For decay calculation
  currentIntensity: number      // After time-based decay
  decayedAt?: Date
}

export interface SomaticMarker {
  id: string
  createdAt: Date
  updatedAt: Date
  triggerPattern: string
  responseTendency: string
  valence: number               // -1 to 1
  strength: number              // 0-1
  formedFromEvents: Array<{
    eventType: string
    eventId: string
    contribution: number
  }>
  reinforcementCount: number
  lastActivated?: Date
}

export type NarrativeRole = 'turning_point' | 'pattern' | 'milestone' | 'observation'

export interface Memory {
  id: string
  timestamp: Date
  description: string
  salience: number              // 0-1 (emotional significance)
  relatedContactId?: string
  relatedEmotionIds?: string[]
  relatedMessageIds?: string[]
  narrativeRole?: NarrativeRole
  identityImpact?: string
}

// Lens Types
export type LensType = 'damasio' | 'cbt' | 'act' | 'ifs' | 'stoic'

export interface Lens {
  id: LensType
  name: string
  fullName: string
  description: string
  color: string
}

// Message Types
export type MessageRole = 'user' | 'assistant' | 'contact'

export interface Message {
  id: string
  role: MessageRole
  content: string
  timestamp: Date
  lens?: LensType
  isVoiceTranscript?: boolean
  highlightedTerms?: string[]
  contactId?: string            // For contact messages
}

export interface AnalyzedMessage extends Message {
  analyzedEmotions: Array<{
    type: EmotionType
    intensity: number
    cause: string
  }>
  dominantEmotion?: EmotionType
  emotionIntensity?: number
  mayaTags?: string[]           // Emotion tags for voice synthesis
}

// Journal Entry Types
export type JournalEntryType = 'reflection' | 'insight' | 'pattern'

export interface JournalEntry {
  id: string
  timestamp: Date
  content: string               // Markdown content
  entryType: JournalEntryType
  mood?: string
  relatedContactIds?: string[]
  relatedMessageIds?: string[]
  relatedEmotionIds?: string[]
  keyThemes?: string[]
}

// Mode Types
export type ModeType = 'reflect' | 'roleplay' | 'patterns' | 'somatic'

export interface Mode {
  id: ModeType
  name: string
  subtitle: string
  description: string
  icon: string
}

// Artifact Types
export type ArtifactType = 'reflection' | 'pattern' | 'voice-note' | 'insight' | 'export'

export interface Artifact {
  id: string
  type: ArtifactType
  title: string
  description: string
  date: Date
}

// Voice Input States
export type VoiceState = 'idle' | 'listening' | 'processing' | 'text'

// Voice Playback Types
export type VoicePlaybackState = 'idle' | 'loading' | 'playing' | 'paused'

export interface VoiceQueueItem {
  id: string
  text: string
  voiceProfile: VoiceProfile
  speakerName: string
  messageId?: string
  mayaTags?: string[]
}

export interface AudioPlayerState {
  currentItem: VoiceQueueItem | null
  queue: VoiceQueueItem[]
  playbackState: VoicePlaybackState
  progress: number              // 0-1
  speed: number                 // 0.5 - 2.0
}

// Panel States
export interface PanelState {
  sourcesExpanded: boolean
  modesOpen: boolean
}

// Search Types
export type SearchContentType = 'message' | 'memory' | 'journal' | 'emotion'

export interface SearchResult {
  sourceType: SearchContentType
  sourceId: string
  distance: number              // Semantic distance
  preview: string
  timestamp: Date
  relatedContactId?: string
}

export interface SearchFilters {
  contentTypes: SearchContentType[]
  contactIds?: string[]
  dateFrom?: Date
  dateTo?: Date
  minRelevance?: number
}

// Roleplay Types
export type CoachingLevel = 'off' | 'subtle' | 'active'
export type PartnerEmotionalState = 'opening' | 'escalation' | 'deescalation' | 'challenging' | 'receptive'

export interface RoleplayMessage {
  id: string
  role: 'user' | 'partner'
  content: string
  timestamp: Date
  emotionalTone?: string
  techniquesUsed?: string[]
}

export interface RoleplayGoal {
  id: string
  description: string
  completed: boolean
}

export interface RoleplaySession {
  id: string
  partnerId: string
  partnerName: string
  skillId: string
  skillName: string
  scenario: string
  goals: RoleplayGoal[]
  coachingLevel: CoachingLevel
  messages: RoleplayMessage[]
  startedAt: Date
  endedAt?: Date
  duration?: number // in seconds
  insights?: RoleplayInsights
  partnerEmotionalState: PartnerEmotionalState
  techniquesAttempted: string[]
  activeLens?: LensType
}

export interface RoleplayInsights {
  techniquesUsed: string[]
  emotionalJourney: Array<{
    timestamp: Date
    emotion: string
    intensity: number
  }>
  highlights: string[]
  growthAreas: string[]
  overallScore?: number
  keyMoments: Array<{
    timestamp: Date
    description: string
    type: 'breakthrough' | 'challenge' | 'technique'
  }>
}

export interface CoachingHint {
  id: string
  content: string
  type: 'technique' | 'warning' | 'encouragement'
  dismissed: boolean
}

// Pipecat Types
export * from './pipecat'