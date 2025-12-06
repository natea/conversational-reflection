'use client'

import { type FC, useState, useEffect } from 'react'
import { useAudioDevices } from '@/hooks/useAudioDevices'
import { Settings } from 'lucide-react'
import { cn } from '@/lib/utils'

export const QuickDeviceSelector: FC = () => {
  const [isOpen, setIsOpen] = useState(false)
  const {
    inputDevices,
    selectedInputDeviceId,
    hasPermission,
    selectInputDevice,
    requestPermission,
    refreshDevices,
  } = useAudioDevices()

  // Refresh devices when opening
  useEffect(() => {
    if (isOpen) {
      refreshDevices()
    }
  }, [isOpen, refreshDevices])

  const selectedDevice = inputDevices.find(d => d.deviceId === selectedInputDeviceId)

  return (
    <div className="relative">
      <button
        onClick={() => {
          if (!hasPermission) {
            requestPermission()
          } else {
            setIsOpen(!isOpen)
          }
        }}
        className={cn(
          'p-2 rounded-lg transition-colors',
          selectedInputDeviceId
            ? 'text-voice-accent bg-voice-accent/10'
            : 'text-text-secondary hover:text-text-primary hover:bg-hover-surface'
        )}
        title={selectedDevice ? `Mic: ${selectedDevice.label}` : 'Select microphone'}
      >
        <Settings size={16} />
      </button>

      {isOpen && hasPermission && (
        <>
          <div
            className="fixed inset-0 z-40"
            onClick={() => setIsOpen(false)}
          />
          <div className="absolute bottom-full left-0 mb-2 w-72 bg-surface border border-border-light rounded-lg shadow-lg z-50 py-2 max-h-64 overflow-y-auto">
            <div className="px-3 py-1.5 text-xs font-medium text-text-secondary uppercase tracking-wide border-b border-border-light mb-1">
              Select Microphone
            </div>
            <button
              onClick={() => {
                selectInputDevice('')
                setIsOpen(false)
              }}
              className={cn(
                'w-full px-3 py-2 text-left text-sm transition-colors',
                selectedInputDeviceId === ''
                  ? 'bg-voice-accent/10 text-voice-accent'
                  : 'text-text-primary hover:bg-hover-surface'
              )}
            >
              System Default
            </button>
            {inputDevices.map((device) => (
              <button
                key={device.deviceId}
                onClick={() => {
                  selectInputDevice(device.deviceId)
                  setIsOpen(false)
                }}
                className={cn(
                  'w-full px-3 py-2 text-left text-sm transition-colors',
                  selectedInputDeviceId === device.deviceId
                    ? 'bg-voice-accent/10 text-voice-accent'
                    : 'text-text-primary hover:bg-hover-surface'
                )}
              >
                <span className="block truncate">{device.label}</span>
              </button>
            ))}
            {inputDevices.length === 0 && (
              <p className="px-3 py-2 text-sm text-text-secondary">
                No microphones found
              </p>
            )}
          </div>
        </>
      )}
    </div>
  )
}
