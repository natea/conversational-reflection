import type { Lens, Mode } from '@/types'

// Lens Constants
export const LENSES: Lens[] = [
  {
    id: 'damasio',
    name: 'Damasio',
    fullName: 'Consciousness & Somatic Markers',
    description: 'Proto-self (body), core consciousness (emotion), extended consciousness (memory)',
    color: 'damasio-lens'
  },
  {
    id: 'cbt',
    name: 'CBT',
    fullName: 'Cognitive Behavioral Therapy',
    description: 'Thoughts → Feelings → Behaviors cycle; cognitive distortions',
    color: 'cbt-lens'
  },
  {
    id: 'act',
    name: 'ACT',
    fullName: 'Acceptance & Commitment',
    description: 'Psychological flexibility; acceptance, defusion, values, committed action',
    color: 'act-lens'
  },
  {
    id: 'ifs',
    name: 'IFS',
    fullName: 'Internal Family Systems',
    description: 'Parts work: managers, firefighters, exiles; accessing Self',
    color: 'ifs-lens'
  },
  {
    id: 'stoic',
    name: 'Stoic',
    fullName: 'Stoic Philosophy',
    description: 'Dichotomy of control; virtue focus; equanimity',
    color: 'stoic-lens'
  }
]

// Mode Constants
export const MODES: Mode[] = [
  {
    id: 'reflect',
    name: 'Reflect',
    subtitle: 'Deep analysis',
    description: 'Analyze selected sources through active lens(es), surfacing patterns and emotional dynamics.',
    icon: 'brain'
  },
  {
    id: 'roleplay',
    name: 'Roleplay',
    subtitle: 'Practice chats',
    description: 'Practice difficult conversations with Ginger embodying a conversation partner.',
    icon: 'message-square'
  },
  {
    id: 'patterns',
    name: 'Patterns',
    subtitle: 'Identify themes',
    description: 'Cross-source analysis to identify recurring themes, triggers, and behavioral patterns.',
    icon: 'git-branch'
  },
  {
    id: 'somatic',
    name: 'Somatic',
    subtitle: 'Body check-in',
    description: 'Guided body-awareness session based on Damasio\'s proto-self concept.',
    icon: 'activity'
  }
]

