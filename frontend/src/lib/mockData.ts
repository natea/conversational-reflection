import type { Source, Message, Artifact } from '@/types'

// Use fixed dates to avoid hydration mismatches between server and client
const FIXED_NOW = new Date('2024-01-15T10:30:00Z')
const FIVE_MINS_AGO = new Date('2024-01-15T10:25:00Z')
const TWO_MINS_AGO = new Date('2024-01-15T10:28:00Z')
const TWO_DAYS_AGO = new Date('2024-01-13T10:30:00Z')
const FOUR_DAYS_AGO = new Date('2024-01-11T10:30:00Z')

// Sample Sources for Demo
export const sampleSources: Source[] = [
  {
    id: '1',
    name: 'Sarah',
    platform: 'whatsapp',
    previewText: 'Recent: "I feel like you never listen..."',
    messageCount: 847,
    lastUpdated: FIXED_NOW
  },
  {
    id: '2',
    name: 'Work',
    platform: 'email',
    previewText: 'Re: Project timeline and Q4 review',
    isSyncing: true,
    lastUpdated: FIXED_NOW
  },
  {
    id: '3',
    name: 'Journal',
    platform: 'journal',
    previewText: 'Entry: Feeling overwhelmed by changes',
    entryCount: 12,
    lastUpdated: FIXED_NOW
  },
  {
    id: '4',
    name: 'Mom',
    platform: 'imessage',
    previewText: 'Recent: "Call me when you get a chance"',
    messageCount: 234,
    lastUpdated: FIXED_NOW
  }
]

// Sample Messages for Demo
export const sampleMessages: Message[] = [
  {
    id: '1',
    role: 'assistant',
    content: 'Hello. I\'m Ginger. I see you\'ve connected your WhatsApp conversation with Sarah and your recent journal entries.\n\nThrough the Damasio lens, we can look at how your "somatic markers"—those gut feelings and body states—might be influencing your perception of these interactions. How are you feeling in your body right now when you think about that last message from her?',
    timestamp: FIVE_MINS_AGO,
    lens: 'damasio',
    highlightedTerms: ['somatic markers', 'Damasio lens']
  },
  {
    id: '2',
    role: 'user',
    content: '"I just feel really tight in my chest when I read her message about me not listening. It feels like I\'m being attacked."',
    timestamp: TWO_MINS_AGO,
    isVoiceTranscript: true
  },
  {
    id: '3',
    role: 'assistant',
    content: 'That tightness in your chest is a classic **somatic marker**. Your *protoself* is registering a threat to your social homeostasis.\n\nWhen Sarah\'s accusation triggers a defensive state. Let\'s sit with that sensation. Does it remind you of a younger version of yourself feeling unheard?',
    timestamp: FIXED_NOW,
    lens: 'damasio',
    highlightedTerms: ['somatic marker', 'protoself']
  }
]

// Sample Artifacts for Demo
export const sampleArtifacts: Artifact[] = [
  {
    id: '1',
    type: 'reflection',
    title: 'The "Listening" Trigger',
    description: 'Analysis of defensive somatic response when feeling unheard.',
    date: TWO_DAYS_AGO
  },
  {
    id: '2',
    type: 'pattern',
    title: 'Evening Anxiety Loop',
    description: 'Recurring pattern of anxious thoughts before bed.',
    date: FOUR_DAYS_AGO
  }
]

