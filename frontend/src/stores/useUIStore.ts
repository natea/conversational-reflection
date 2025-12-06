'use client'

import { create } from 'zustand'
import type { ModeType, LensType } from '@/types'

interface UIState {
  // Current view/mode
  currentMode: ModeType
  
  // Lenses
  activeLenses: LensType[]
  
  // Panel states
  sourcesExpanded: boolean
  modesOpen: boolean
  consciousnessExpanded: boolean
  
  // Modal states
  onboardingOpen: boolean
  hasCompletedOnboarding: boolean
  lensModalOpen: boolean
  reflectModalOpen: boolean
  roleplayModalOpen: boolean
  patternModalOpen: boolean
  somaticModalOpen: boolean
  artifactsModalOpen: boolean
  selectedArtifactId: string | null
  addSourceModalOpen: boolean
  voiceProfileModalOpen: boolean
  selectedVoiceContactId: string | null
  
  // Dark mode
  isDarkMode: boolean
  
  // Actions
  setCurrentMode: (mode: ModeType) => void
  toggleLens: (lens: LensType) => void
  setActiveLenses: (lenses: LensType[]) => void
  setSourcesExpanded: (expanded: boolean) => void
  setModesOpen: (open: boolean) => void
  setConsciousnessExpanded: (expanded: boolean) => void
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
  setVoiceProfileModalOpen: (open: boolean, contactId?: string | null) => void
  toggleDarkMode: () => void
}

export const useUIStore = create<UIState>((set) => ({
  currentMode: 'reflect',
  activeLenses: ['damasio'],
  sourcesExpanded: true,
  modesOpen: true,
  consciousnessExpanded: false,
  
  onboardingOpen: false, // Changed to false to avoid showing on every load
  hasCompletedOnboarding: true,
  lensModalOpen: false,
  reflectModalOpen: false,
  roleplayModalOpen: false,
  patternModalOpen: false,
  somaticModalOpen: false,
  artifactsModalOpen: false,
  selectedArtifactId: null,
  addSourceModalOpen: false,
  voiceProfileModalOpen: false,
  selectedVoiceContactId: null,
  
  isDarkMode: false,
  
  setCurrentMode: (mode) => set({ currentMode: mode }),
  
  toggleLens: (lens) => set((state) => ({
    activeLenses: state.activeLenses.includes(lens)
      ? state.activeLenses.filter((l) => l !== lens)
      : [...state.activeLenses, lens]
  })),
  
  setActiveLenses: (lenses) => set({ activeLenses: lenses }),
  setSourcesExpanded: (expanded) => set({ sourcesExpanded: expanded }),
  setModesOpen: (open) => set({ modesOpen: open }),
  setConsciousnessExpanded: (expanded) => set({ consciousnessExpanded: expanded }),
  
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
  
  setVoiceProfileModalOpen: (open, contactId = null) => set({
    voiceProfileModalOpen: open,
    selectedVoiceContactId: contactId
  }),
  
  toggleDarkMode: () => set((state) => ({ isDarkMode: !state.isDarkMode }))
}))

