'use client'

import { create } from 'zustand'
import type { Source, LensType, Message, ModeType, Artifact, VoiceState } from '@/types'
import { sampleSources, sampleMessages, sampleArtifacts } from '@/lib/mockData'
import { LENSES } from '@/constants'

// AI Response templates based on lens type
const AI_RESPONSES: Record<LensType, string[]> = {
  damasio: [
    "I notice you mentioned feeling {emotion}. Through the Damasio lens, let's explore what **somatic markers** might be at play here. Where do you feel this sensation in your body?",
    "Your *proto-self* is registering something important. That {emotion} you're describing often manifests as physical sensations. Can you describe where you feel it most strongly?",
    "What you're experiencing sounds like a **core consciousness** response. These embodied feelings are your brain's way of creating meaning from your relationships. Let's sit with this sensation.",
    "Through the lens of somatic markers, your body is telling a story. The {emotion} you feel is your extended consciousness connecting past experiences to this present moment.",
    "Notice how your body responds when you think about this. Damasio teaches us that emotions aren't just mental—they're deeply physical. What does your body want to tell you?"
  ],
  cbt: [
    "Let's examine the **thought-feeling-behavior** cycle here. When you had the thought about {topic}, what feeling arose, and how did you respond?",
    "I'm noticing what might be a **cognitive distortion** at play. The thought '{topic}' could be an example of catastrophizing. What evidence supports or contradicts this thought?",
    "Through the CBT lens, let's challenge this automatic thought. What would you tell a friend who was thinking the same thing?",
    "This sounds like a **mind-reading** pattern—assuming you know what others think. What are the facts vs. interpretations here?",
    "Let's do a **thought record** together. What was the situation, automatic thought, emotion, and evidence for/against this belief?"
  ],
  act: [
    "Through the ACT framework, let's practice **defusion**. Instead of 'I am {emotion}', try noticing 'I'm having the thought that I feel {emotion}.' How does that shift things?",
    "What **values** are being touched here? ACT invites us to see difficult emotions as signposts pointing toward what matters most to us.",
    "Let's create some **psychological flexibility** here. Can you hold this difficult feeling while also taking a step toward what you value?",
    "This is an invitation for **acceptance**—not approval, but willingness to experience this feeling without fighting it. What opens up when you stop struggling?",
    "Through the lens of **committed action**, what small step could you take right now that aligns with your values, even while feeling this way?"
  ],
  ifs: [
    "It sounds like a **part** of you is feeling {emotion}. In IFS, we get curious about our parts. Can you sense how old this part might be?",
    "This might be a **protector part** trying to keep you safe. What is it protecting you from? What does it fear would happen if it relaxed?",
    "Let's approach this part with **Self energy**—curiosity, compassion, and calm. How does this part respond when you ask what it needs?",
    "I'm curious about the **exile** this protector might be guarding. Sometimes our strongest reactions are protecting our most vulnerable parts.",
    "From a place of **Self-leadership**, what would you like to say to this part? It's been working hard for a long time."
  ],
  stoic: [
    "The Stoics would ask: is this within your **sphere of control**? If not, can you find peace in accepting what you cannot change?",
    "Through the Stoic lens, this situation invites you to practice **equanimity**. What virtue can you cultivate in this moment?",
    "Remember Marcus Aurelius: 'You have power over your mind, not outside events.' What response would align with your highest self?",
    "This is an opportunity for **premeditatio malorum**—considering the worst case helps us prepare mentally. What would you do if your fear came true?",
    "The Stoics teach us that obstacles are opportunities. How might this challenge be **the way** rather than blocking the way?"
  ]
}

// Extract emotions and topics from user messages
const extractContext = (content: string): { emotion: string; topic: string } => {
  const emotionWords = ['angry', 'sad', 'anxious', 'frustrated', 'hurt', 'scared', 'overwhelmed', 'confused', 'happy', 'excited', 'nervous', 'tense', 'tight', 'stressed']
  const foundEmotion = emotionWords.find(e => content.toLowerCase().includes(e)) || 'uncomfortable'

  // Extract a relevant topic/phrase from the message
  const sentences = content.split(/[.!?]/).filter(s => s.trim().length > 10)
  const topic = sentences[0]?.trim() || content.slice(0, 50)

  return { emotion: foundEmotion, topic }
}

// Generate an AI response based on active lens and user message
const generateAIResponse = (userMessage: string, activeLenses: LensType[]): { content: string; lens: LensType } => {
  const lens = activeLenses[0] || 'damasio'
  const responses = AI_RESPONSES[lens]
  const randomResponse = responses[Math.floor(Math.random() * responses.length)]

  const { emotion, topic } = extractContext(userMessage)
  const content = randomResponse
    .replace('{emotion}', emotion)
    .replace('{topic}', topic)

  return { content, lens }
}

interface GingerState {
  // Sources
  sources: Source[]
  selectedSourceIds: string[]
  sourcesExpanded: boolean

  // Lenses
  activeLenses: LensType[]

  // Messages
  messages: Message[]

  // Modes
  activeMode: ModeType
  modesOpen: boolean

  // Artifacts
  artifacts: Artifact[]

  // Voice
  voiceState: VoiceState

  // Onboarding
  onboardingOpen: boolean
  hasCompletedOnboarding: boolean

  // Lens selector modal
  lensModalOpen: boolean

  // Mode modals
  reflectModalOpen: boolean
  roleplayModalOpen: boolean
  patternModalOpen: boolean
  somaticModalOpen: boolean

  // Artifacts modal
  artifactsModalOpen: boolean
  selectedArtifactId: string | null

  // Add Source modal
  addSourceModalOpen: boolean

  // Dark Mode
  isDarkMode: boolean
  toggleDarkMode: () => void

  // Actions
  toggleSource: (id: string) => void
  setSourcesExpanded: (expanded: boolean) => void
  toggleLens: (lens: LensType) => void
  setActiveLenses: (lenses: LensType[]) => void
  addMessage: (message: Omit<Message, 'id' | 'timestamp'>) => void
  addMessageWithResponse: (message: Omit<Message, 'id' | 'timestamp'>) => void
  setActiveMode: (mode: ModeType) => void
  setModesOpen: (open: boolean) => void
  setVoiceState: (state: VoiceState) => void
  setOnboardingOpen: (open: boolean) => void
  setHasCompletedOnboarding: (completed: boolean) => void
  setLensModalOpen: (open: boolean) => void
  setReflectModalOpen: (open: boolean) => void
  setRoleplayModalOpen: (open: boolean) => void
  setPatternModalOpen: (open: boolean) => void
  setSomaticModalOpen: (open: boolean) => void
  setArtifactsModalOpen: (open: boolean) => void
  setSelectedArtifactId: (id: string | null) => void
  setAddSourceModalOpen: (open: boolean) => void
  saveInsight: (messageId: string) => void
  addArtifact: (artifact: Omit<Artifact, 'id'>) => void
  deleteArtifact: (id: string) => void
  addSource: (source: Omit<Source, 'id' | 'lastUpdated'>) => void
}

export const useGingerStore = create<GingerState>((set, get) => ({
  // Initial state
  sources: sampleSources,
  selectedSourceIds: ['1', '3'], // Sarah and Journal selected by default
  sourcesExpanded: true,

  activeLenses: ['damasio'],

  messages: sampleMessages,

  activeMode: 'reflect',
  modesOpen: true,

  artifacts: sampleArtifacts,

  voiceState: 'idle',

  onboardingOpen: true, // Show onboarding on first visit
  hasCompletedOnboarding: false,

  lensModalOpen: false,

  reflectModalOpen: false,
  roleplayModalOpen: false,
  patternModalOpen: false,
  somaticModalOpen: false,

  artifactsModalOpen: false,
  selectedArtifactId: null,
  addSourceModalOpen: false,

  isDarkMode: false,
  toggleDarkMode: () => set((state) => ({ isDarkMode: !state.isDarkMode })),

  // Actions
  toggleSource: (id) => set((state) => ({
    selectedSourceIds: state.selectedSourceIds.includes(id)
      ? state.selectedSourceIds.filter((sid) => sid !== id)
      : [...state.selectedSourceIds, id]
  })),

  setSourcesExpanded: (expanded) => set({ sourcesExpanded: expanded }),

  toggleLens: (lens) => set((state) => ({
    activeLenses: state.activeLenses.includes(lens)
      ? state.activeLenses.filter((l) => l !== lens)
      : [...state.activeLenses, lens]
  })),

  setActiveLenses: (lenses) => set({ activeLenses: lenses }),

  addMessage: (message) => set((state) => ({
    messages: [...state.messages, {
      ...message,
      id: String(Date.now()),
      timestamp: new Date()
    }]
  })),

  // Add user message and generate AI response
  addMessageWithResponse: (message) => {
    const state = get()

    // Add user message
    const userMessage = {
      ...message,
      id: String(Date.now()),
      timestamp: new Date()
    }

    set((state) => ({
      messages: [...state.messages, userMessage],
      voiceState: 'processing'
    }))

    // Simulate AI thinking time, then add response
    setTimeout(() => {
      const { content, lens } = generateAIResponse(message.content, state.activeLenses)
      const lensInfo = LENSES.find(l => l.id === lens)

      const aiMessage: Message = {
        id: String(Date.now() + 1),
        role: 'assistant',
        content,
        timestamp: new Date(),
        lens,
        highlightedTerms: lensInfo ? [lensInfo.name, lensInfo.fullName] : []
      }

      set((state) => ({
        messages: [...state.messages, aiMessage],
        voiceState: 'idle'
      }))
    }, 1500)
  },

  setActiveMode: (mode) => set({ activeMode: mode }),

  setModesOpen: (open) => set({ modesOpen: open }),

  setVoiceState: (state) => set({ voiceState: state }),

  setOnboardingOpen: (open) => set({ onboardingOpen: open }),

  setHasCompletedOnboarding: (completed) => set({
    hasCompletedOnboarding: completed,
    onboardingOpen: !completed
  }),

  setLensModalOpen: (open) => set({ lensModalOpen: open }),

  setReflectModalOpen: (open) => set({ reflectModalOpen: open }),

  setRoleplayModalOpen: (open) => set({ roleplayModalOpen: open }),

  setPatternModalOpen: (open) => set({ patternModalOpen: open }),

  setSomaticModalOpen: (open) => set({ somaticModalOpen: open }),

  setArtifactsModalOpen: (open) => set({ artifactsModalOpen: open }),
  
  setSelectedArtifactId: (id) => set({ selectedArtifactId: id }),

  setAddSourceModalOpen: (open) => set({ addSourceModalOpen: open }),

  addArtifact: (artifact) => set((state) => ({
    artifacts: [{
      ...artifact,
      id: String(Date.now())
    }, ...state.artifacts]
  })),

  deleteArtifact: (id) => set((state) => ({
    artifacts: state.artifacts.filter((a) => a.id !== id)
  })),

  addSource: (source) => set((state) => ({
    sources: [{
      ...source,
      id: String(Date.now()),
      lastUpdated: new Date()
    }, ...state.sources]
  })),

  saveInsight: (messageId) => {
    const message = get().messages.find((m) => m.id === messageId)
    if (!message) return

    const newArtifact: Artifact = {
      id: String(Date.now()),
      type: 'insight',
      title: 'Saved Insight',
      description: message.content.slice(0, 100) + '...',
      date: new Date()
    }

    set((state) => ({
      artifacts: [newArtifact, ...state.artifacts]
    }))
  }
}))
