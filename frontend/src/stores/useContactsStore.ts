'use client'

import { create } from 'zustand'
import type { Contact, VoiceProfile } from '@/types'

interface ContactsState {
  // State
  contacts: Contact[]
  selectedContactId: string | null
  
  // Actions
  addContact: (contact: Omit<Contact, 'id' | 'firstInteraction' | 'lastInteraction'>) => void
  updateContact: (id: string, updates: Partial<Contact>) => void
  deleteContact: (id: string) => void
  selectContact: (id: string | null) => void
  updateVoiceProfile: (contactId: string, voiceProfile: Partial<VoiceProfile>) => void
  getContactById: (id: string) => Contact | undefined
}

// Mock data for development
const mockContacts: Contact[] = [
  {
    id: '+1234567890',
    name: 'Sarah',
    relationshipType: 'friend',
    voiceProfile: {
      description: 'Female voice in her 30s, warm timbre, conversational pacing, can be frustrated',
      gender: 'female',
      ageRange: '30s',
      accent: 'American',
      typicalEmotions: ['affectionate', 'frustrated', 'thoughtful'],
      speakingStyle: 'expressive, occasionally rapid when upset'
    },
    firstInteraction: new Date('2023-01-15'),
    lastInteraction: new Date(),
    totalMessages: 847,
    typicalValence: -0.2,
    typicalIntensity: 0.6
  },
  {
    id: '+0987654321',
    name: 'Mom',
    relationshipType: 'family',
    voiceProfile: {
      description: 'Female voice in her 60s, warm and caring tone, measured pacing',
      gender: 'female',
      ageRange: '60s',
      accent: 'American',
      typicalEmotions: ['caring', 'concerned', 'gentle'],
      speakingStyle: 'calm, supportive, occasionally worried'
    },
    firstInteraction: new Date('2022-06-01'),
    lastInteraction: new Date(),
    totalMessages: 234,
    typicalValence: 0.5,
    typicalIntensity: 0.4
  }
]

export const useContactsStore = create<ContactsState>((set, get) => ({
  contacts: mockContacts,
  selectedContactId: null,
  
  addContact: (contact) => set((state) => ({
    contacts: [
      ...state.contacts,
      {
        ...contact,
        id: `contact_${Date.now()}`,
        firstInteraction: new Date(),
        lastInteraction: new Date()
      }
    ]
  })),
  
  updateContact: (id, updates) => set((state) => ({
    contacts: state.contacts.map(c => 
      c.id === id ? { ...c, ...updates, lastInteraction: new Date() } : c
    )
  })),
  
  deleteContact: (id) => set((state) => ({
    contacts: state.contacts.filter(c => c.id !== id),
    selectedContactId: state.selectedContactId === id ? null : state.selectedContactId
  })),
  
  selectContact: (id) => set({ selectedContactId: id }),
  
  updateVoiceProfile: (contactId, voiceProfile) => set((state) => ({
    contacts: state.contacts.map(c => 
      c.id === contactId 
        ? { ...c, voiceProfile: { ...c.voiceProfile, ...voiceProfile } }
        : c
    )
  })),
  
  getContactById: (id) => {
    return get().contacts.find(c => c.id === id)
  }
}))

