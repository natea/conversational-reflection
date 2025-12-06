'use client'

import { create } from 'zustand'
import type { BodyState, EmotionEvent, SomaticMarker, Memory } from '@/types'

interface ConsciousnessState {
  // Proto-self: Body state
  currentBodyState: BodyState
  bodyStateHistory: BodyState[]
  
  // Core consciousness: Emotions
  emotionEvents: EmotionEvent[]
  activeEmotions: EmotionEvent[]
  
  // Extended consciousness: Memories and markers
  memories: Memory[]
  somaticMarkers: SomaticMarker[]
  
  // Actions
  updateBodyState: (state: Partial<Omit<BodyState, 'timestamp'>>) => void
  addEmotionEvent: (emotion: Omit<EmotionEvent, 'id' | 'timestamp' | 'currentIntensity' | 'decayedAt'>) => void
  decayEmotions: () => void
  addMemory: (memory: Omit<Memory, 'id' | 'timestamp'>) => void
  updateMemory: (id: string, updates: Partial<Memory>) => void
  addSomaticMarker: (marker: Omit<SomaticMarker, 'id' | 'createdAt' | 'updatedAt'>) => void
  reinforceSomaticMarker: (id: string) => void
  getEmotionsByContact: (contactId: string) => EmotionEvent[]
  getMemoriesByContact: (contactId: string) => Memory[]
  getRelevantSomaticMarkers: (context: string) => SomaticMarker[]
}

const defaultBodyState: BodyState = {
  timestamp: new Date(),
  energy: 0.7,
  stress: 0.3,
  arousal: 0.5,
  valence: 0.0,
  temperature: 0.5,
  tension: 0.3,
  fatigue: 0.3,
  pain: 0.0,
  homeostaticPressure: 0.0
}

// Mock data for development
const mockEmotions: EmotionEvent[] = [
  {
    id: 'emotion_1',
    timestamp: new Date(Date.now() - 3600000),
    emotionType: 'sadness',
    intensity: 0.6,
    initialIntensity: 0.6,
    currentIntensity: 0.4,
    cause: 'Analyzing Sarah\'s frustration in yesterday\'s conversation',
    relatedContactId: '+1234567890',
    backgroundEmotion: 'tension'
  }
]

const mockMemories: Memory[] = [
  {
    id: 'memory_1',
    timestamp: new Date(Date.now() - 86400000 * 2),
    description: 'Third instance of Sarah expressing frustration about not being heard. Pattern suggests deeper communication issue.',
    salience: 0.8,
    relatedContactId: '+1234567890',
    narrativeRole: 'pattern',
    identityImpact: 'Recognizing a recurring dynamic in close relationships'
  }
]

const mockMarkers: SomaticMarker[] = [
  {
    id: 'marker_1',
    createdAt: new Date(Date.now() - 86400000 * 7),
    updatedAt: new Date(),
    triggerPattern: 'arguments about listening',
    responseTendency: 'anticipate escalation, chest tightness',
    valence: -0.6,
    strength: 0.7,
    formedFromEvents: [
      { eventType: 'emotion', eventId: 'emotion_1', contribution: 0.4 }
    ],
    reinforcementCount: 3,
    lastActivated: new Date()
  }
]

export const useConsciousnessStore = create<ConsciousnessState>((set, get) => ({
  currentBodyState: defaultBodyState,
  bodyStateHistory: [defaultBodyState],
  emotionEvents: mockEmotions,
  activeEmotions: mockEmotions.filter(e => e.currentIntensity > 0.1),
  memories: mockMemories,
  somaticMarkers: mockMarkers,
  
  updateBodyState: (stateUpdate) => set((state) => {
    const newState: BodyState = {
      ...state.currentBodyState,
      ...stateUpdate,
      timestamp: new Date()
    }
    return {
      currentBodyState: newState,
      bodyStateHistory: [...state.bodyStateHistory, newState].slice(-100) // Keep last 100
    }
  }),
  
  addEmotionEvent: (emotion) => set((state) => {
    const newEmotion: EmotionEvent = {
      ...emotion,
      id: `emotion_${Date.now()}`,
      timestamp: new Date(),
      currentIntensity: emotion.initialIntensity,
      decayedAt: undefined
    }
    return {
      emotionEvents: [...state.emotionEvents, newEmotion],
      activeEmotions: [...state.activeEmotions, newEmotion]
    }
  }),
  
  decayEmotions: () => set((state) => {
    const now = Date.now()
    const decayedEmotions = state.emotionEvents.map(emotion => {
      const ageInHours = (now - emotion.timestamp.getTime()) / (1000 * 60 * 60)
      const decayRate = 0.1 // 10% per hour
      const currentIntensity = Math.max(0, emotion.initialIntensity * Math.exp(-decayRate * ageInHours))
      
      return {
        ...emotion,
        currentIntensity,
        decayedAt: currentIntensity < 0.01 ? new Date() : emotion.decayedAt
      }
    })
    
    return {
      emotionEvents: decayedEmotions,
      activeEmotions: decayedEmotions.filter(e => e.currentIntensity > 0.1)
    }
  }),
  
  addMemory: (memory) => set((state) => ({
    memories: [
      {
        ...memory,
        id: `memory_${Date.now()}`,
        timestamp: new Date()
      },
      ...state.memories
    ]
  })),
  
  updateMemory: (id, updates) => set((state) => ({
    memories: state.memories.map(m => 
      m.id === id ? { ...m, ...updates } : m
    )
  })),
  
  addSomaticMarker: (marker) => set((state) => ({
    somaticMarkers: [
      ...state.somaticMarkers,
      {
        ...marker,
        id: `marker_${Date.now()}`,
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ]
  })),
  
  reinforceSomaticMarker: (id) => set((state) => ({
    somaticMarkers: state.somaticMarkers.map(m =>
      m.id === id
        ? {
            ...m,
            reinforcementCount: m.reinforcementCount + 1,
            strength: Math.min(1, m.strength + 0.1),
            updatedAt: new Date(),
            lastActivated: new Date()
          }
        : m
    )
  })),
  
  getEmotionsByContact: (contactId) => {
    return get().emotionEvents.filter(e => e.relatedContactId === contactId)
  },
  
  getMemoriesByContact: (contactId) => {
    return get().memories.filter(m => m.relatedContactId === contactId)
  },
  
  getRelevantSomaticMarkers: (context) => {
    const lowerContext = context.toLowerCase()
    return get().somaticMarkers.filter(m =>
      m.triggerPattern.toLowerCase().includes(lowerContext) ||
      m.responseTendency.toLowerCase().includes(lowerContext)
    ).sort((a, b) => b.strength - a.strength)
  }
}))

