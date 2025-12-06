'use client'

import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export interface AudioDevice {
  deviceId: string
  label: string
  kind: 'audioinput' | 'audiooutput'
}

interface AudioDeviceState {
  // Available devices
  inputDevices: AudioDevice[]
  outputDevices: AudioDevice[]

  // Selected device IDs (empty string = system default)
  selectedInputDeviceId: string
  selectedOutputDeviceId: string

  // Permission state
  hasPermission: boolean
  permissionError: string | null

  // Actions
  setInputDevices: (devices: AudioDevice[]) => void
  setOutputDevices: (devices: AudioDevice[]) => void
  selectInputDevice: (deviceId: string) => void
  selectOutputDevice: (deviceId: string) => void
  setHasPermission: (has: boolean) => void
  setPermissionError: (error: string | null) => void
}

export const useAudioDeviceStore = create<AudioDeviceState>()(
  persist(
    (set) => ({
      // Initial state
      inputDevices: [],
      outputDevices: [],
      selectedInputDeviceId: '',
      selectedOutputDeviceId: '',
      hasPermission: false,
      permissionError: null,

      // Actions
      setInputDevices: (devices) => set({ inputDevices: devices }),
      setOutputDevices: (devices) => set({ outputDevices: devices }),
      selectInputDevice: (deviceId) => set({ selectedInputDeviceId: deviceId }),
      selectOutputDevice: (deviceId) => set({ selectedOutputDeviceId: deviceId }),
      setHasPermission: (has) => set({ hasPermission: has }),
      setPermissionError: (error) => set({ permissionError: error }),
    }),
    {
      name: 'ginger-audio-devices',
      partialize: (state) => ({
        selectedInputDeviceId: state.selectedInputDeviceId,
        selectedOutputDeviceId: state.selectedOutputDeviceId,
      }),
    }
  )
)
