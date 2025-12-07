# Audio Device Selection Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Allow users to select their preferred microphone and speaker devices for voice conversations with Ginger.

**Architecture:** Create a Zustand store for audio device state, a custom hook for device enumeration, integrate device constraints into the PipecatProvider, and add a device selector UI to the Settings page with a quick-access dropdown in the voice input area.

**Tech Stack:** React, Zustand, Web Audio API (navigator.mediaDevices), TypeScript, Tailwind CSS

---

## Task 1: Create Audio Device Store

**Files:**
- Create: `src/stores/useAudioDeviceStore.ts`

**Step 1: Write the store file**

```typescript
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
```

**Step 2: Verify file created**

Run: `ls -la src/stores/useAudioDeviceStore.ts`
Expected: File exists

**Step 3: Commit**

```bash
git add src/stores/useAudioDeviceStore.ts
git commit -m "feat: add audio device store with persistence"
```

---

## Task 2: Create Audio Device Enumeration Hook

**Files:**
- Create: `src/hooks/useAudioDevices.ts`

**Step 1: Write the hook file**

```typescript
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
```

**Step 2: Verify file created**

Run: `ls -la src/hooks/useAudioDevices.ts`
Expected: File exists

**Step 3: Commit**

```bash
git add src/hooks/useAudioDevices.ts
git commit -m "feat: add audio device enumeration hook"
```

---

## Task 3: Update PipecatProvider to Accept Device Constraints

**Files:**
- Modify: `src/providers/PipecatProvider.tsx`

**Step 1: Add device store import and constraint handling**

Add import at top of file (after line 6):
```typescript
import { useAudioDeviceStore } from '@/stores/useAudioDeviceStore'
```

**Step 2: Modify the useEffect that creates PipecatClient**

Replace lines 36-74 with:
```typescript
  // Get selected device from store
  const selectedInputDeviceId = useAudioDeviceStore((state) => state.selectedInputDeviceId)

  // Initialize client on mount or when device changes
  useEffect(() => {
    // Build audio constraints
    const audioConstraints: MediaTrackConstraints | boolean = selectedInputDeviceId
      ? { deviceId: { exact: selectedInputDeviceId } }
      : true

    const pcClient = new PipecatClient({
      transport: new SmallWebRTCTransport(),
      enableMic: true,
      enableCam: false,
      // Pass audio constraints to the transport
      customAudioConstraints: audioConstraints,
      callbacks: {
        onConnected: () => {
          console.log('[Pipecat] Connected')
          setStatus('connected')
          setError(null)
        },
        onDisconnected: () => {
          console.log('[Pipecat] Disconnected')
          setStatus('disconnected')
          setIsReady(false)
        },
        onBotReady: () => {
          console.log('[Pipecat] Bot ready')
          setIsReady(true)
        },
      },
    })

    // Set up event listeners
    pcClient.on(RTVIEvent.Error, (message: RTVIMessage) => {
      console.error('[Pipecat] Error:', message)
      const data = message.data as Record<string, unknown>
      const errorMsg = data?.error || data?.message || 'Unknown error'
      setError(typeof errorMsg === 'string' ? errorMsg : 'Connection error')
      setStatus('error')
    })

    setClient(pcClient)

    return () => {
      pcClient.disconnect()
    }
  }, [selectedInputDeviceId])
```

**Note:** If `customAudioConstraints` is not a valid PipecatClient option, we may need to explore alternative approaches:
- Fork SmallWebRTCTransport
- Use a pre-connection getUserMedia with constraints
- File an issue with Pipecat team

**Step 3: Build to check for type errors**

Run: `npm run build`
Expected: Build succeeds or we identify the correct API

**Step 4: Commit**

```bash
git add src/providers/PipecatProvider.tsx
git commit -m "feat: integrate device selection into PipecatProvider"
```

---

## Task 4: Create AudioDeviceSelector Component

**Files:**
- Create: `src/components/settings/AudioDeviceSelector.tsx`

**Step 1: Write the component**

```typescript
'use client'

import { type FC } from 'react'
import { useAudioDevices } from '@/hooks/useAudioDevices'
import { Mic, Volume2, RefreshCw, AlertCircle } from 'lucide-react'
import { cn } from '@/lib/utils'

export const AudioDeviceSelector: FC = () => {
  const {
    inputDevices,
    outputDevices,
    selectedInputDeviceId,
    selectedOutputDeviceId,
    hasPermission,
    permissionError,
    selectInputDevice,
    selectOutputDevice,
    requestPermission,
    refreshDevices,
  } = useAudioDevices()

  return (
    <div className="space-y-6">
      {/* Permission request */}
      {!hasPermission && (
        <div className="flex items-center gap-3 p-4 bg-voice-accent/10 border border-voice-accent/20 rounded-lg">
          <AlertCircle size={20} className="text-voice-accent flex-shrink-0" />
          <div className="flex-1">
            <p className="text-sm text-text-primary font-medium">
              Microphone permission required
            </p>
            <p className="text-xs text-text-secondary mt-1">
              Grant permission to see available audio devices
            </p>
          </div>
          <button
            onClick={requestPermission}
            className="px-4 py-2 bg-voice-accent text-white text-sm font-medium rounded-lg hover:bg-voice-accent/90 transition-colors"
          >
            Grant Access
          </button>
        </div>
      )}

      {permissionError && (
        <div className="p-3 bg-error/10 border border-error/20 rounded-lg">
          <p className="text-sm text-error">{permissionError}</p>
        </div>
      )}

      {/* Microphone selector */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <label className="flex items-center gap-2 text-sm font-medium text-text-primary">
            <Mic size={16} className="text-voice-accent" />
            Microphone
          </label>
          <button
            onClick={refreshDevices}
            className="p-1.5 text-text-secondary hover:text-text-primary hover:bg-hover-surface rounded-lg transition-colors"
            title="Refresh devices"
          >
            <RefreshCw size={14} />
          </button>
        </div>
        <select
          value={selectedInputDeviceId}
          onChange={(e) => selectInputDevice(e.target.value)}
          disabled={!hasPermission || inputDevices.length === 0}
          className={cn(
            'w-full px-3 py-2 bg-background border border-border-light rounded-lg',
            'text-sm text-text-primary',
            'focus:outline-none focus:ring-2 focus:ring-voice-accent/50 focus:border-voice-accent',
            'disabled:opacity-50 disabled:cursor-not-allowed'
          )}
        >
          <option value="">System Default</option>
          {inputDevices.map((device) => (
            <option key={device.deviceId} value={device.deviceId}>
              {device.label}
            </option>
          ))}
        </select>
        {inputDevices.length === 0 && hasPermission && (
          <p className="text-xs text-text-secondary mt-1">
            No microphones detected
          </p>
        )}
      </div>

      {/* Speaker selector */}
      <div>
        <label className="flex items-center gap-2 text-sm font-medium text-text-primary mb-2">
          <Volume2 size={16} className="text-voice-accent" />
          Speaker
        </label>
        <select
          value={selectedOutputDeviceId}
          onChange={(e) => selectOutputDevice(e.target.value)}
          disabled={!hasPermission || outputDevices.length === 0}
          className={cn(
            'w-full px-3 py-2 bg-background border border-border-light rounded-lg',
            'text-sm text-text-primary',
            'focus:outline-none focus:ring-2 focus:ring-voice-accent/50 focus:border-voice-accent',
            'disabled:opacity-50 disabled:cursor-not-allowed'
          )}
        >
          <option value="">System Default</option>
          {outputDevices.map((device) => (
            <option key={device.deviceId} value={device.deviceId}>
              {device.label}
            </option>
          ))}
        </select>
        {outputDevices.length === 0 && hasPermission && (
          <p className="text-xs text-text-secondary mt-1">
            No speakers detected
          </p>
        )}
      </div>
    </div>
  )
}
```

**Step 2: Verify file created**

Run: `ls -la src/components/settings/AudioDeviceSelector.tsx`
Expected: File exists

**Step 3: Commit**

```bash
git add src/components/settings/AudioDeviceSelector.tsx
git commit -m "feat: add AudioDeviceSelector component"
```

---

## Task 5: Add Audio Device Section to Settings Page

**Files:**
- Modify: `src/app/settings/page.tsx`

**Step 1: Add import at top of file**

After line 3, add:
```typescript
import { AudioDeviceSelector } from '@/components/settings/AudioDeviceSelector'
import { Mic } from '@/components/ui/Icons'
```

**Step 2: Add Audio Devices section after Voice Settings section**

After line 36 (after Voice Settings closing div), add:
```typescript
        {/* Audio Devices */}
        <div className="bg-surface border border-border-light rounded-xl p-6">
          <div className="flex items-center gap-2 mb-4">
            <Mic size={20} className="text-voice-accent" />
            <h2 className="text-lg font-medium text-text-primary">
              Audio Devices
            </h2>
          </div>
          <p className="text-sm text-text-secondary mb-4">
            Select which microphone and speaker to use for voice conversations
          </p>
          <AudioDeviceSelector />
        </div>
```

**Step 3: Build and verify**

Run: `npm run build`
Expected: Build succeeds

**Step 4: Commit**

```bash
git add src/app/settings/page.tsx
git commit -m "feat: add audio device selector to settings page"
```

---

## Task 6: Add Quick Device Selector to LiveVoiceInput (Optional Enhancement)

**Files:**
- Create: `src/components/voice/QuickDeviceSelector.tsx`
- Modify: `src/components/features/LiveVoiceInput.tsx`

**Step 1: Create QuickDeviceSelector component**

```typescript
'use client'

import { type FC, useState } from 'react'
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
  } = useAudioDevices()

  if (!hasPermission) {
    return (
      <button
        onClick={requestPermission}
        className="p-2 text-text-secondary hover:text-text-primary hover:bg-hover-surface rounded-lg transition-colors"
        title="Grant microphone permission"
      >
        <Settings size={16} />
      </button>
    )
  }

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="p-2 text-text-secondary hover:text-text-primary hover:bg-hover-surface rounded-lg transition-colors"
        title="Select microphone"
      >
        <Settings size={16} />
      </button>

      {isOpen && (
        <>
          <div
            className="fixed inset-0 z-40"
            onClick={() => setIsOpen(false)}
          />
          <div className="absolute bottom-full left-0 mb-2 w-64 bg-surface border border-border-light rounded-lg shadow-lg z-50 py-2 max-h-48 overflow-y-auto">
            <div className="px-3 py-1.5 text-xs font-medium text-text-secondary uppercase tracking-wide">
              Microphone
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
                  'w-full px-3 py-2 text-left text-sm transition-colors truncate',
                  selectedInputDeviceId === device.deviceId
                    ? 'bg-voice-accent/10 text-voice-accent'
                    : 'text-text-primary hover:bg-hover-surface'
                )}
              >
                {device.label}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  )
}
```

**Step 2: Add QuickDeviceSelector to LiveVoiceInput**

In `src/components/features/LiveVoiceInput.tsx`, add import:
```typescript
import { QuickDeviceSelector } from '@/components/voice/QuickDeviceSelector'
```

Add the component in the controls section (around line 187), before the mic toggle:
```typescript
{/* Quick device selector */}
<QuickDeviceSelector />
```

**Step 3: Build and verify**

Run: `npm run build`
Expected: Build succeeds

**Step 4: Commit**

```bash
git add src/components/voice/QuickDeviceSelector.tsx src/components/features/LiveVoiceInput.tsx
git commit -m "feat: add quick device selector to voice input"
```

---

## Task 7: Test Audio Device Selection End-to-End

**Step 1: Start development server**

Run: `npm run dev`

**Step 2: Test Settings page**

1. Navigate to `/settings`
2. Verify "Audio Devices" section appears
3. Click "Grant Access" if permission not granted
4. Verify microphone dropdown shows available devices
5. Select a different microphone
6. Verify selection persists after page refresh

**Step 3: Test voice input**

1. Navigate to `/reflect`
2. Click settings icon in voice input area
3. Verify device selector dropdown appears
4. Select a microphone
5. Connect to Ginger
6. Speak and verify correct microphone is used

**Step 4: Final commit**

```bash
git add .
git commit -m "feat: complete audio device selection implementation"
```

---

## Alternative Approach: Pre-Connection Device Selection

If PipecatClient doesn't support `customAudioConstraints`, use this alternative:

**In PipecatProvider.tsx**, before calling `client.connect()`:

```typescript
const connect = useCallback(async () => {
  if (!client) return

  try {
    setStatus('connecting')
    setError(null)

    // Pre-acquire microphone with selected device
    const selectedDeviceId = useAudioDeviceStore.getState().selectedInputDeviceId
    if (selectedDeviceId) {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: { deviceId: { exact: selectedDeviceId } }
      })
      // The stream will be used by WebRTC - keep it active
      // Note: This may require passing the stream to PipecatClient
    }

    await client.connect({
      webrtcUrl,
    })
  } catch (err) {
    console.error('[Pipecat] Connection failed:', err)
    setError(err instanceof Error ? err.message : 'Connection failed')
    setStatus('error')
  }
}, [client, webrtcUrl])
```

---

## Summary

| Task | Component | Purpose |
|------|-----------|---------|
| 1 | `useAudioDeviceStore.ts` | Persist device selection |
| 2 | `useAudioDevices.ts` | Enumerate and manage devices |
| 3 | `PipecatProvider.tsx` | Pass constraints to WebRTC |
| 4 | `AudioDeviceSelector.tsx` | Full settings UI |
| 5 | `settings/page.tsx` | Integrate into Settings |
| 6 | `QuickDeviceSelector.tsx` | Quick access in voice bar |
| 7 | Testing | End-to-end verification |

---

**Plan complete and saved to `docs/plans/2025-12-02-audio-device-selection.md`. Two execution options:**

**1. Subagent-Driven (this session)** - I dispatch fresh subagent per task, review between tasks, fast iteration

**2. Parallel Session (separate)** - Open new session with executing-plans, batch execution with checkpoints

**Which approach?**
