'use client'

import { create } from 'zustand'
import type { ConnectionStatus } from '@/providers/PipecatProvider'

interface TranscriptMessage {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: Date
  final: boolean
}

interface PipecatState {
  // Connection state
  connectionStatus: ConnectionStatus
  isReady: boolean
  error: string | null

  // Audio state
  isMicEnabled: boolean
  isSpeakerEnabled: boolean
  isUserSpeaking: boolean
  isBotSpeaking: boolean

  // Transcript state
  transcript: TranscriptMessage[]
  currentUserUtterance: string
  currentBotUtterance: string

  // Actions
  setConnectionStatus: (status: ConnectionStatus) => void
  setIsReady: (ready: boolean) => void
  setError: (error: string | null) => void
  setMicEnabled: (enabled: boolean) => void
  setSpeakerEnabled: (enabled: boolean) => void
  setUserSpeaking: (speaking: boolean) => void
  setBotSpeaking: (speaking: boolean) => void
  addTranscriptMessage: (message: Omit<TranscriptMessage, 'id' | 'timestamp'>) => void
  updateCurrentUserUtterance: (text: string) => void
  updateCurrentBotUtterance: (text: string) => void
  resetCurrentBotUtterance: () => void
  finalizeUserUtterance: () => void
  finalizeBotUtterance: () => void
  clearTranscript: () => void
}

export const usePipecatStore = create<PipecatState>((set, get) => ({
  // Initial state
  connectionStatus: 'disconnected',
  isReady: false,
  error: null,
  isMicEnabled: true,
  isSpeakerEnabled: true,
  isUserSpeaking: false,
  isBotSpeaking: false,
  transcript: [],
  currentUserUtterance: '',
  currentBotUtterance: '',

  // Actions
  setConnectionStatus: (status) => set({ connectionStatus: status }),
  setIsReady: (ready) => set({ isReady: ready }),
  setError: (error) => set({ error }),
  setMicEnabled: (enabled) => set({ isMicEnabled: enabled }),
  setSpeakerEnabled: (enabled) => set({ isSpeakerEnabled: enabled }),
  setUserSpeaking: (speaking) => set({ isUserSpeaking: speaking }),
  setBotSpeaking: (speaking) => set({ isBotSpeaking: speaking }),

  addTranscriptMessage: (message) => set((state) => ({
    transcript: [
      ...state.transcript,
      {
        ...message,
        id: `msg-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
        timestamp: new Date(),
      },
    ],
  })),

  updateCurrentUserUtterance: (text) => set({ currentUserUtterance: text }),
  // Append bot utterance text (Pipecat sends incremental chunks)
  updateCurrentBotUtterance: (text) => set((state) => ({
    currentBotUtterance: state.currentBotUtterance + text
  })),
  // Reset bot utterance (call when bot starts speaking)
  resetCurrentBotUtterance: () => set({ currentBotUtterance: '' }),

  finalizeUserUtterance: () => {
    const { currentUserUtterance, addTranscriptMessage } = get()
    if (currentUserUtterance.trim()) {
      addTranscriptMessage({
        role: 'user',
        content: currentUserUtterance.trim(),
        final: true,
      })
    }
    set({ currentUserUtterance: '' })
  },

  finalizeBotUtterance: () => {
    const { currentBotUtterance, addTranscriptMessage } = get()
    if (currentBotUtterance.trim()) {
      addTranscriptMessage({
        role: 'assistant',
        content: currentBotUtterance.trim(),
        final: true,
      })
    }
    set({ currentBotUtterance: '' })
  },

  clearTranscript: () => set({ transcript: [], currentUserUtterance: '', currentBotUtterance: '' }),
}))
