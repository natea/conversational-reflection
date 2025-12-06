'use client'

import { useEffect, useCallback } from 'react'
import { useAudioDeviceStore, type AudioDevice } from '@/stores/useAudioDeviceStore'

export function useAudioDevices() {
  const {
    inputDevices,
    outputDevices,
    selectedInputDeviceId,
    selectedOutputDeviceId,
    hasPermission,
    permissionError,
    setInputDevices,
    setOutputDevices,
    selectInputDevice,
    selectOutputDevice,
    setHasPermission,
    setPermissionError,
  } = useAudioDeviceStore()

  // Enumerate available devices
  const enumerateDevices = useCallback(async () => {
    try {
      const devices = await navigator.mediaDevices.enumerateDevices()

      const inputs: AudioDevice[] = devices
        .filter((d) => d.kind === 'audioinput')
        .map((d) => ({
          deviceId: d.deviceId,
          label: d.label || `Microphone ${d.deviceId.slice(0, 8)}`,
          kind: 'audioinput' as const,
        }))

      const outputs: AudioDevice[] = devices
        .filter((d) => d.kind === 'audiooutput')
        .map((d) => ({
          deviceId: d.deviceId,
          label: d.label || `Speaker ${d.deviceId.slice(0, 8)}`,
          kind: 'audiooutput' as const,
        }))

      setInputDevices(inputs)
      setOutputDevices(outputs)

      // Check if we have labels (indicates permission granted)
      const hasLabels = devices.some((d) => d.label !== '')
      setHasPermission(hasLabels)

      return { inputs, outputs }
    } catch (error) {
      console.error('[AudioDevices] Enumeration failed:', error)
      setPermissionError(error instanceof Error ? error.message : 'Failed to enumerate devices')
      return { inputs: [], outputs: [] }
    }
  }, [setInputDevices, setOutputDevices, setHasPermission, setPermissionError])

  // Request microphone permission and enumerate devices
  const requestPermission = useCallback(async () => {
    try {
      setPermissionError(null)

      // Request mic permission to get device labels
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })

      // Stop the stream immediately - we just needed permission
      stream.getTracks().forEach((track) => track.stop())

      setHasPermission(true)

      // Now enumerate with full labels
      await enumerateDevices()

      return true
    } catch (error) {
      console.error('[AudioDevices] Permission denied:', error)
      setHasPermission(false)
      setPermissionError(
        error instanceof Error
          ? error.message
          : 'Microphone permission denied'
      )
      return false
    }
  }, [enumerateDevices, setHasPermission, setPermissionError])

  // Listen for device changes
  useEffect(() => {
    const handleDeviceChange = () => {
      console.log('[AudioDevices] Device change detected')
      enumerateDevices()
    }

    navigator.mediaDevices.addEventListener('devicechange', handleDeviceChange)

    // Initial enumeration
    enumerateDevices()

    return () => {
      navigator.mediaDevices.removeEventListener('devicechange', handleDeviceChange)
    }
  }, [enumerateDevices])

  return {
    inputDevices,
    outputDevices,
    selectedInputDeviceId,
    selectedOutputDeviceId,
    hasPermission,
    permissionError,
    selectInputDevice,
    selectOutputDevice,
    requestPermission,
    refreshDevices: enumerateDevices,
  }
}
