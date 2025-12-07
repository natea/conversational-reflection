'use client'

import { create } from 'zustand'
import type { AudioPlayerState, VoiceQueueItem, VoicePlaybackState } from '@/types'

interface VoiceState extends AudioPlayerState {
  // Actions
  addToQueue: (item: VoiceQueueItem) => void
  playNext: () => void
  playPrevious: () => void
  togglePlayPause: () => void
  setSpeed: (speed: number) => void
  setProgress: (progress: number) => void
  clearQueue: () => void
  removeFromQueue: (id: string) => void
}

export const useVoiceStore = create<VoiceState>((set, get) => ({
  currentItem: null,
  queue: [],
  playbackState: 'idle',
  progress: 0,
  speed: 1.0,
  
  addToQueue: (item) => set((state) => {
    const newQueue = [...state.queue, item]
    // If nothing is playing, start playing this item
    if (!state.currentItem) {
      return {
        queue: newQueue.slice(1),
        currentItem: item,
        playbackState: 'loading' as VoicePlaybackState
      }
    }
    return { queue: newQueue }
  }),
  
  playNext: () => set((state) => {
    if (state.queue.length === 0) {
      return {
        currentItem: null,
        playbackState: 'idle' as VoicePlaybackState,
        progress: 0
      }
    }
    
    const [nextItem, ...remainingQueue] = state.queue
    return {
      currentItem: nextItem,
      queue: remainingQueue,
      playbackState: 'loading' as VoicePlaybackState,
      progress: 0
    }
  }),
  
  playPrevious: () => set((state) => {
    // In a real implementation, we'd maintain a history
    // For now, just restart the current item
    return {
      progress: 0,
      playbackState: state.currentItem ? 'playing' as VoicePlaybackState : state.playbackState
    }
  }),
  
  togglePlayPause: () => set((state) => {
    if (state.playbackState === 'playing') {
      return { playbackState: 'paused' as VoicePlaybackState }
    } else if (state.playbackState === 'paused') {
      return { playbackState: 'playing' as VoicePlaybackState }
    }
    return state
  }),
  
  setSpeed: (speed) => set({ speed: Math.max(0.5, Math.min(2.0, speed)) }),
  
  setProgress: (progress) => set({ progress: Math.max(0, Math.min(1, progress)) }),
  
  clearQueue: () => set({
    queue: [],
    currentItem: null,
    playbackState: 'idle',
    progress: 0
  }),
  
  removeFromQueue: (id) => set((state) => ({
    queue: state.queue.filter(item => item.id !== id)
  }))
}))

