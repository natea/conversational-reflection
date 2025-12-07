'use client'

import { create } from 'zustand'
import type { Message, AnalyzedMessage, JournalEntry } from '@/types'

interface ConversationState {
  // Messages
  messages: Message[]
  analyzedMessages: AnalyzedMessage[]
  
  // Journal
  journalEntries: JournalEntry[]
  
  // Import state
  isImporting: boolean
  importProgress: number
  
  // Actions
  addMessage: (message: Omit<Message, 'id' | 'timestamp'>) => void
  addAnalyzedMessage: (message: AnalyzedMessage) => void
  updateMessage: (id: string, updates: Partial<Message>) => void
  deleteMessage: (id: string) => void
  clearMessages: () => void
  
  addJournalEntry: (entry: Omit<JournalEntry, 'id' | 'timestamp'>) => void
  updateJournalEntry: (id: string, updates: Partial<JournalEntry>) => void
  deleteJournalEntry: (id: string) => void
  
  setIsImporting: (importing: boolean) => void
  setImportProgress: (progress: number) => void
  
  getMessagesByContact: (contactId: string) => Message[]
  getJournalEntriesByContact: (contactId: string) => JournalEntry[]
}

// Mock data
const mockMessages: Message[] = [
  {
    id: '1',
    role: 'assistant',
    content: 'Hello. I\'m Ginger. I see you\'ve connected your conversations with Sarah.\n\nThrough the Damasio lens, we can look at how your "somatic markers"—those gut feelings and body states—might be influencing your perception of these interactions. How are you feeling in your body right now when you think about that last message from her?',
    timestamp: new Date(Date.now() - 300000),
    lens: 'damasio',
    highlightedTerms: ['somatic markers', 'Damasio lens']
  },
  {
    id: '2',
    role: 'user',
    content: 'I just feel really tight in my chest when I read her message about me not listening. It feels like I\'m being attacked.',
    timestamp: new Date(Date.now() - 120000),
    isVoiceTranscript: true
  },
  {
    id: '3',
    role: 'assistant',
    content: 'That tightness in your chest is a classic **somatic marker**. Your *proto-self* is registering a threat to your social homeostasis.\n\nWhen Sarah\'s accusation triggers a defensive state. Let\'s sit with that sensation. Does it remind you of a younger version of yourself feeling unheard?',
    timestamp: new Date(),
    lens: 'damasio',
    highlightedTerms: ['somatic marker', 'proto-self']
  }
]

const mockJournalEntries: JournalEntry[] = [
  {
    id: 'journal_1',
    timestamp: new Date(Date.now() - 86400000 * 2),
    content: '# The "Listening" Trigger\n\nReflecting on my conversation with Sarah, I notice a recurring pattern. When she says I\'m not listening, my immediate reaction is defensiveness and chest tightness.\n\nThis somatic marker has formed over multiple interactions. The body responds before conscious thought - a proto-self response to perceived threat.\n\n## Key Insights\n- The defensive response is automatic\n- It may be protecting an earlier wound\n- The intensity suggests high salience',
    entryType: 'reflection',
    mood: 'contemplative',
    relatedContactIds: ['+1234567890'],
    keyThemes: ['defensiveness', 'somatic markers', 'communication patterns']
  }
]

export const useConversationStore = create<ConversationState>((set, get) => ({
  messages: mockMessages,
  analyzedMessages: [],
  journalEntries: mockJournalEntries,
  isImporting: false,
  importProgress: 0,
  
  addMessage: (message) => set((state) => ({
    messages: [
      ...state.messages,
      {
        ...message,
        id: `msg_${Date.now()}`,
        timestamp: new Date()
      }
    ]
  })),
  
  addAnalyzedMessage: (message) => set((state) => ({
    analyzedMessages: [...state.analyzedMessages, message],
    messages: [...state.messages, message]
  })),
  
  updateMessage: (id, updates) => set((state) => ({
    messages: state.messages.map(m => 
      m.id === id ? { ...m, ...updates } : m
    )
  })),
  
  deleteMessage: (id) => set((state) => ({
    messages: state.messages.filter(m => m.id !== id),
    analyzedMessages: state.analyzedMessages.filter(m => m.id !== id)
  })),
  
  clearMessages: () => set({
    messages: [],
    analyzedMessages: []
  }),
  
  addJournalEntry: (entry) => set((state) => ({
    journalEntries: [
      {
        ...entry,
        id: `journal_${Date.now()}`,
        timestamp: new Date()
      },
      ...state.journalEntries
    ]
  })),
  
  updateJournalEntry: (id, updates) => set((state) => ({
    journalEntries: state.journalEntries.map(e => 
      e.id === id ? { ...e, ...updates } : e
    )
  })),
  
  deleteJournalEntry: (id) => set((state) => ({
    journalEntries: state.journalEntries.filter(e => e.id !== id)
  })),
  
  setIsImporting: (importing) => set({ isImporting: importing }),
  setImportProgress: (progress) => set({ importProgress: progress }),
  
  getMessagesByContact: (contactId) => {
    return get().messages.filter(m => m.contactId === contactId)
  },
  
  getJournalEntriesByContact: (contactId) => {
    return get().journalEntries.filter(e => 
      e.relatedContactIds?.includes(contactId)
    )
  }
}))

