# Pipecat Voice Integration - Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Connect the Ginger React/Next.js frontend to the Pipecat voice AI backend using the Pipecat Voice UI Kit and Client SDK.

**Architecture:** The frontend will use `@pipecat-ai/voice-ui-kit` components wrapped in `PipecatAppBase` to establish WebRTC connections to the Python Pipecat backend. The existing Zustand stores will be updated to sync with Pipecat events, and the mock voice input will be replaced with real WebRTC audio streaming.

**Tech Stack:**
- Next.js 14.2 (App Router)
- Pipecat Client SDK (`@pipecat-ai/client-js`, `@pipecat-ai/client-react`)
- Pipecat Voice UI Kit (`@pipecat-ai/voice-ui-kit`)
- SmallWebRTC Transport (`@pipecat-ai/small-webrtc-transport`)
- Zustand (state management)
- Tailwind CSS

---

## Prerequisites

Before starting, ensure:
1. The Pipecat backend is running locally: `cd pipecat && uv run bot.py --transport webrtc`
2. You're on the `frontend` branch
3. Node.js 18+ is installed

---

## Task 1: Install Pipecat Dependencies

**Files:**
- Modify: `ginger_rp/package.json`

**Step 1: Install Pipecat packages**

Run:
```bash
cd ginger_rp && npm install @pipecat-ai/client-js @pipecat-ai/client-react @pipecat-ai/voice-ui-kit @pipecat-ai/small-webrtc-transport
```

Expected: Successfully added 4 packages to package.json

**Step 2: Verify installation**

Run:
```bash
cd ginger_rp && npm ls @pipecat-ai/client-js
```

Expected: Shows `@pipecat-ai/client-js@X.X.X` in the dependency tree

**Step 3: Commit**

```bash
cd ginger_rp && git add package.json package-lock.json && git commit -m "feat: add Pipecat client SDK and voice-ui-kit dependencies"
```

---

## Task 2: Create API Route for WebRTC Offer/Answer

**Files:**
- Create: `ginger_rp/src/app/api/offer/route.ts`

The SmallWebRTC transport requires a server endpoint to proxy WebRTC signaling to the Pipecat backend.

**Step 1: Write the failing test**

Create: `ginger_rp/src/app/api/offer/__tests__/route.test.ts`

```typescript
import { POST } from '../route'
import { NextRequest } from 'next/server'

describe('POST /api/offer', () => {
  it('should proxy WebRTC offer to Pipecat backend', async () => {
    const mockOffer = {
      sdp: 'mock-sdp',
      type: 'offer'
    }

    const request = new NextRequest('http://localhost:3000/api/offer', {
      method: 'POST',
      body: JSON.stringify(mockOffer),
      headers: { 'Content-Type': 'application/json' }
    })

    // This will fail until we implement the route
    const response = await POST(request)
    expect(response.status).toBe(200)
  })
})
```

**Step 2: Run test to verify it fails**

Run: `cd ginger_rp && npm test -- --testPathPattern="offer" --passWithNoTests`

Expected: FAIL (route.ts doesn't exist)

**Step 3: Write the API route implementation**

Create: `ginger_rp/src/app/api/offer/route.ts`

```typescript
import { NextRequest, NextResponse } from 'next/server'

const PIPECAT_WEBRTC_URL = process.env.PIPECAT_WEBRTC_URL || 'http://localhost:7860/offer'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    const response = await fetch(PIPECAT_WEBRTC_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error('Pipecat backend error:', errorText)
      return NextResponse.json(
        { error: 'Failed to connect to voice backend', details: errorText },
        { status: response.status }
      )
    }

    const data = await response.json()
    return NextResponse.json(data)
  } catch (error) {
    console.error('WebRTC offer proxy error:', error)
    return NextResponse.json(
      { error: 'Failed to establish voice connection', details: String(error) },
      { status: 500 }
    )
  }
}

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  })
}
```

**Step 4: Commit**

```bash
cd ginger_rp && git add src/app/api/offer/route.ts && git commit -m "feat: add WebRTC offer proxy API route for Pipecat"
```

---

## Task 3: Create Pipecat Provider Component

**Files:**
- Create: `ginger_rp/src/providers/PipecatProvider.tsx`
- Create: `ginger_rp/src/providers/index.ts`

**Step 1: Write the provider component**

Create: `ginger_rp/src/providers/PipecatProvider.tsx`

```typescript
'use client'

import { createContext, useContext, useState, useCallback, useEffect, type ReactNode } from 'react'
import { PipecatClient, RTVIEvent } from '@pipecat-ai/client-js'
import { SmallWebRTCTransport } from '@pipecat-ai/small-webrtc-transport'

export type ConnectionStatus = 'disconnected' | 'connecting' | 'connected' | 'error'

interface PipecatContextValue {
  client: PipecatClient | null
  status: ConnectionStatus
  error: string | null
  connect: () => Promise<void>
  disconnect: () => void
  isReady: boolean
}

const PipecatContext = createContext<PipecatContextValue | null>(null)

interface PipecatProviderProps {
  children: ReactNode
  webrtcUrl?: string
}

export function PipecatProvider({
  children,
  webrtcUrl = '/api/offer'
}: PipecatProviderProps) {
  const [client, setClient] = useState<PipecatClient | null>(null)
  const [status, setStatus] = useState<ConnectionStatus>('disconnected')
  const [error, setError] = useState<string | null>(null)
  const [isReady, setIsReady] = useState(false)

  // Initialize client on mount
  useEffect(() => {
    const pcClient = new PipecatClient({
      transport: new SmallWebRTCTransport(),
      enableMic: true,
      enableCam: false,
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
    pcClient.on(RTVIEvent.Error, (err: Error) => {
      console.error('[Pipecat] Error:', err)
      setError(err.message)
      setStatus('error')
    })

    setClient(pcClient)

    return () => {
      pcClient.disconnect()
    }
  }, [])

  const connect = useCallback(async () => {
    if (!client) return

    try {
      setStatus('connecting')
      setError(null)

      await client.connect({
        webrtcUrl,
      })
    } catch (err) {
      console.error('[Pipecat] Connection failed:', err)
      setError(err instanceof Error ? err.message : 'Connection failed')
      setStatus('error')
    }
  }, [client, webrtcUrl])

  const disconnect = useCallback(() => {
    if (!client) return
    client.disconnect()
  }, [client])

  return (
    <PipecatContext.Provider value={{
      client,
      status,
      error,
      connect,
      disconnect,
      isReady,
    }}>
      {children}
    </PipecatContext.Provider>
  )
}

export function usePipecat() {
  const context = useContext(PipecatContext)
  if (!context) {
    throw new Error('usePipecat must be used within a PipecatProvider')
  }
  return context
}
```

**Step 2: Create index export**

Create: `ginger_rp/src/providers/index.ts`

```typescript
export { PipecatProvider, usePipecat, type ConnectionStatus } from './PipecatProvider'
```

**Step 3: Commit**

```bash
cd ginger_rp && git add src/providers && git commit -m "feat: add PipecatProvider context for voice connection management"
```

---

## Task 4: Create Pipecat Connection Store

**Files:**
- Create: `ginger_rp/src/stores/usePipecatStore.ts`

This store syncs Pipecat events with the application state.

**Step 1: Write the store**

Create: `ginger_rp/src/stores/usePipecatStore.ts`

```typescript
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
  updateCurrentBotUtterance: (text) => set({ currentBotUtterance: text }),

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
```

**Step 2: Commit**

```bash
cd ginger_rp && git add src/stores/usePipecatStore.ts && git commit -m "feat: add Pipecat store for connection and transcript state"
```

---

## Task 5: Create Pipecat Event Sync Hook

**Files:**
- Create: `ginger_rp/src/hooks/usePipecatSync.ts`

This hook connects Pipecat client events to our Zustand stores.

**Step 1: Write the sync hook**

Create: `ginger_rp/src/hooks/usePipecatSync.ts`

```typescript
'use client'

import { useEffect } from 'react'
import { RTVIEvent } from '@pipecat-ai/client-js'
import { usePipecat } from '@/providers/PipecatProvider'
import { usePipecatStore } from '@/stores/usePipecatStore'
import { useGingerStore } from '@/stores/useGingerStore'

export function usePipecatSync() {
  const { client, status, isReady } = usePipecat()
  const pipecatStore = usePipecatStore()
  const gingerStore = useGingerStore()

  // Sync connection status
  useEffect(() => {
    pipecatStore.setConnectionStatus(status)
  }, [status])

  // Sync ready state
  useEffect(() => {
    pipecatStore.setIsReady(isReady)
  }, [isReady])

  // Set up event listeners when client is available
  useEffect(() => {
    if (!client) return

    // User started speaking
    const handleUserStartedSpeaking = () => {
      pipecatStore.setUserSpeaking(true)
      gingerStore.setVoiceState('listening')
    }

    // User stopped speaking
    const handleUserStoppedSpeaking = () => {
      pipecatStore.setUserSpeaking(false)
      pipecatStore.finalizeUserUtterance()
      gingerStore.setVoiceState('processing')
    }

    // Bot started speaking
    const handleBotStartedSpeaking = () => {
      pipecatStore.setBotSpeaking(true)
    }

    // Bot stopped speaking
    const handleBotStoppedSpeaking = () => {
      pipecatStore.setBotSpeaking(false)
      pipecatStore.finalizeBotUtterance()
      gingerStore.setVoiceState('idle')
    }

    // User transcript (interim)
    const handleUserTranscript = (data: { text: string }) => {
      pipecatStore.updateCurrentUserUtterance(data.text)
    }

    // Bot transcript (interim)
    const handleBotTranscript = (data: { text: string }) => {
      pipecatStore.updateCurrentBotUtterance(data.text)
    }

    // Bot LLM text (for adding to Ginger's message store)
    const handleBotLLMText = (data: { text: string }) => {
      // This is the final LLM response text
      gingerStore.addMessage({
        role: 'assistant',
        content: data.text,
      })
    }

    // Register event handlers
    client.on(RTVIEvent.UserStartedSpeaking, handleUserStartedSpeaking)
    client.on(RTVIEvent.UserStoppedSpeaking, handleUserStoppedSpeaking)
    client.on(RTVIEvent.BotStartedSpeaking, handleBotStartedSpeaking)
    client.on(RTVIEvent.BotStoppedSpeaking, handleBotStoppedSpeaking)
    client.on(RTVIEvent.UserTranscript, handleUserTranscript)
    client.on(RTVIEvent.BotTranscript, handleBotTranscript)
    client.on(RTVIEvent.BotLLMText, handleBotLLMText)

    // Cleanup
    return () => {
      client.off(RTVIEvent.UserStartedSpeaking, handleUserStartedSpeaking)
      client.off(RTVIEvent.UserStoppedSpeaking, handleUserStoppedSpeaking)
      client.off(RTVIEvent.BotStartedSpeaking, handleBotStartedSpeaking)
      client.off(RTVIEvent.BotStoppedSpeaking, handleBotStoppedSpeaking)
      client.off(RTVIEvent.UserTranscript, handleUserTranscript)
      client.off(RTVIEvent.BotTranscript, handleBotTranscript)
      client.off(RTVIEvent.BotLLMText, handleBotLLMText)
    }
  }, [client, pipecatStore, gingerStore])

  return {
    isConnected: status === 'connected',
    isReady,
  }
}
```

**Step 2: Create hooks index**

Create: `ginger_rp/src/hooks/index.ts`

```typescript
export { usePipecatSync } from './usePipecatSync'
```

**Step 3: Commit**

```bash
cd ginger_rp && git add src/hooks && git commit -m "feat: add usePipecatSync hook to bridge Pipecat events to Zustand"
```

---

## Task 6: Create Voice Connection Button Component

**Files:**
- Create: `ginger_rp/src/components/voice/VoiceConnectionButton.tsx`

**Step 1: Write the component**

Create: `ginger_rp/src/components/voice/VoiceConnectionButton.tsx`

```typescript
'use client'

import { type FC } from 'react'
import { cn } from '@/lib/utils'
import { usePipecat } from '@/providers/PipecatProvider'
import { usePipecatStore } from '@/stores/usePipecatStore'
import { Phone, PhoneOff, Loader } from 'lucide-react'

interface VoiceConnectionButtonProps {
  className?: string
  size?: 'sm' | 'md' | 'lg'
}

export const VoiceConnectionButton: FC<VoiceConnectionButtonProps> = ({
  className,
  size = 'md',
}) => {
  const { connect, disconnect } = usePipecat()
  const { connectionStatus, isReady, error } = usePipecatStore()

  const isConnected = connectionStatus === 'connected'
  const isConnecting = connectionStatus === 'connecting'
  const hasError = connectionStatus === 'error'

  const handleClick = () => {
    if (isConnected) {
      disconnect()
    } else if (!isConnecting) {
      connect()
    }
  }

  const sizeClasses = {
    sm: 'p-2 text-sm',
    md: 'p-3 text-base',
    lg: 'p-4 text-lg',
  }

  const iconSizes = {
    sm: 16,
    md: 20,
    lg: 24,
  }

  return (
    <div className="flex flex-col items-center gap-2">
      <button
        onClick={handleClick}
        disabled={isConnecting}
        className={cn(
          'rounded-full transition-all duration-200',
          'flex items-center justify-center gap-2',
          sizeClasses[size],
          isConnected
            ? 'bg-success text-white hover:bg-success/90'
            : hasError
            ? 'bg-error text-white hover:bg-error/90'
            : isConnecting
            ? 'bg-voice-accent/50 text-white cursor-wait'
            : 'bg-voice-accent text-white hover:bg-voice-accent/90',
          className
        )}
        aria-label={isConnected ? 'Disconnect from Ginger' : 'Connect to Ginger'}
      >
        {isConnecting ? (
          <Loader className="animate-spin" size={iconSizes[size]} />
        ) : isConnected ? (
          <Phone size={iconSizes[size]} />
        ) : (
          <PhoneOff size={iconSizes[size]} />
        )}

        <span className="hidden sm:inline">
          {isConnecting
            ? 'Connecting...'
            : isConnected
            ? isReady
              ? 'Connected'
              : 'Waiting...'
            : hasError
            ? 'Retry'
            : 'Connect'}
        </span>
      </button>

      {error && (
        <p className="text-xs text-error max-w-[200px] text-center">
          {error}
        </p>
      )}
    </div>
  )
}
```

**Step 2: Update voice components index**

Modify: `ginger_rp/src/components/voice/index.ts` (create if doesn't exist)

```typescript
export { AudioPlayerBar } from './AudioPlayerBar'
export { MessageVoiceButton } from './MessageVoiceButton'
export { VoiceProfileEditor } from './VoiceProfileEditor'
export { VoiceConnectionButton } from './VoiceConnectionButton'
```

**Step 3: Commit**

```bash
cd ginger_rp && git add src/components/voice && git commit -m "feat: add VoiceConnectionButton component for Pipecat connectivity"
```

---

## Task 7: Create Live Voice Input Component

**Files:**
- Create: `ginger_rp/src/components/features/LiveVoiceInput.tsx`

This replaces the mock VoiceInput with real WebRTC audio.

**Step 1: Write the component**

Create: `ginger_rp/src/components/features/LiveVoiceInput.tsx`

```typescript
'use client'

import { type FC, useState, useEffect, useCallback } from 'react'
import { cn } from '@/lib/utils'
import { usePipecat } from '@/providers/PipecatProvider'
import { usePipecatStore } from '@/stores/usePipecatStore'
import { useGingerStore } from '@/stores/useGingerStore'
import { Mic, MicOff, Keyboard, Phone, PhoneOff, Loader } from 'lucide-react'
import { FloatingLensSelector } from './FloatingLensSelector'

const LiveWaveform: FC<{ isActive: boolean }> = ({ isActive }) => {
  const [heights, setHeights] = useState<number[]>(Array(12).fill(4))

  useEffect(() => {
    if (!isActive) {
      setHeights(Array(12).fill(4))
      return
    }

    let animationId: number
    const animate = () => {
      setHeights(
        Array(12)
          .fill(0)
          .map(() => {
            const baseHeight = Math.random() * 20 + 8
            const variation = Math.sin(Date.now() / 200) * 4
            return baseHeight + variation
          })
      )
      animationId = requestAnimationFrame(animate)
    }
    animate()

    return () => cancelAnimationFrame(animationId)
  }, [isActive])

  return (
    <div className="voice-listening flex items-center gap-0.5 h-8">
      {heights.map((height, i) => (
        <div
          key={i}
          className="waveform-bar transition-all duration-75 ease-out"
          style={{ height: `${height}px` }}
        />
      ))}
    </div>
  )
}

export const LiveVoiceInput: FC = () => {
  const { connect, disconnect } = usePipecat()
  const {
    connectionStatus,
    isReady,
    isMicEnabled,
    isUserSpeaking,
    isBotSpeaking,
    currentUserUtterance,
    currentBotUtterance,
    setMicEnabled,
  } = usePipecatStore()
  const { activeLenses, addMessageWithResponse } = useGingerStore()

  const [textInput, setTextInput] = useState('')
  const [inputMode, setInputMode] = useState<'voice' | 'text'>('voice')

  const isConnected = connectionStatus === 'connected'
  const isConnecting = connectionStatus === 'connecting'

  const handleConnectToggle = useCallback(() => {
    if (isConnected) {
      disconnect()
    } else if (!isConnecting) {
      connect()
    }
  }, [isConnected, isConnecting, connect, disconnect])

  const handleMicToggle = useCallback(() => {
    setMicEnabled(!isMicEnabled)
  }, [isMicEnabled, setMicEnabled])

  const handleTextSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!textInput.trim()) return

    // When in text mode but connected, we'd ideally send through Pipecat
    // For now, use the existing message system
    addMessageWithResponse({
      role: 'user',
      content: textInput,
    })
    setTextInput('')
  }

  const getLensLabel = () => {
    if (activeLenses.length === 0) return 'Lens'
    if (activeLenses.length === 1) {
      return activeLenses[0].charAt(0).toUpperCase() + activeLenses[0].slice(1)
    }
    return `${activeLenses.length} Lenses`
  }

  const getStatusMessage = () => {
    if (!isConnected) return 'Connect to talk to Ginger'
    if (!isReady) return 'Ginger is waking up...'
    if (isBotSpeaking) return currentBotUtterance || 'Ginger is speaking...'
    if (isUserSpeaking) return currentUserUtterance || 'Listening...'
    return 'Listening...'
  }

  return (
    <div>
      <form onSubmit={handleTextSubmit} className="relative">
        <div
          className={cn(
            'flex items-center gap-2 px-3 py-2 bg-surface rounded-full shadow-voice-bar border border-border-light transition-all',
            isUserSpeaking && 'border-voice-accent',
            isBotSpeaking && 'border-success'
          )}
        >
          {/* Lens Selector */}
          <div className="flex-shrink-0 border-r border-border-light pr-2 mr-1">
            <FloatingLensSelector />
          </div>

          {/* Voice/Text content area */}
          <div className="flex-1 flex items-center justify-center min-h-[40px]">
            {inputMode === 'voice' ? (
              <>
                {!isConnected ? (
                  <button
                    type="button"
                    onClick={handleConnectToggle}
                    className="flex items-center gap-2 text-text-secondary hover:text-text-primary transition-colors"
                  >
                    {isConnecting ? (
                      <Loader className="animate-spin text-voice-accent" size={20} />
                    ) : (
                      <Phone size={20} className="text-voice-accent" />
                    )}
                    <span className="text-sm">
                      {isConnecting ? 'Connecting...' : 'Tap to connect to Ginger'}
                    </span>
                  </button>
                ) : (
                  <div className="flex-1 flex flex-col items-center gap-1">
                    <div className="flex items-center gap-4">
                      {isUserSpeaking && (
                        <span className="text-sm font-medium text-voice-accent tracking-wide">
                          LISTENING
                        </span>
                      )}
                      {isBotSpeaking && (
                        <span className="text-sm font-medium text-success tracking-wide">
                          GINGER
                        </span>
                      )}
                      {!isUserSpeaking && !isBotSpeaking && isReady && (
                        <span className="text-sm font-medium text-text-secondary tracking-wide">
                          READY
                        </span>
                      )}
                      <LiveWaveform isActive={isUserSpeaking || isBotSpeaking} />
                    </div>
                    {(currentUserUtterance || currentBotUtterance) && (
                      <p className="text-xs text-text-secondary max-w-[300px] truncate">
                        {currentUserUtterance || currentBotUtterance}
                      </p>
                    )}
                  </div>
                )}
              </>
            ) : (
              <input
                type="text"
                value={textInput}
                onChange={(e) => setTextInput(e.target.value)}
                placeholder="Type your message..."
                className="flex-1 bg-transparent text-text-primary placeholder:text-text-secondary outline-none text-sm px-2"
                autoFocus
              />
            )}
          </div>

          {/* Controls */}
          <div className="flex items-center gap-1">
            {/* Mic mute toggle (only when connected) */}
            {isConnected && inputMode === 'voice' && (
              <button
                type="button"
                onClick={handleMicToggle}
                className={cn(
                  'p-2 rounded-lg transition-colors flex-shrink-0',
                  isMicEnabled
                    ? 'text-voice-accent bg-voice-accent/10'
                    : 'text-text-secondary hover:text-text-primary hover:bg-hover-surface'
                )}
                aria-label={isMicEnabled ? 'Mute microphone' : 'Unmute microphone'}
              >
                {isMicEnabled ? <Mic size={18} /> : <MicOff size={18} />}
              </button>
            )}

            {/* Disconnect button (only when connected) */}
            {isConnected && (
              <button
                type="button"
                onClick={handleConnectToggle}
                className="p-2 rounded-lg text-error hover:bg-error/10 transition-colors flex-shrink-0"
                aria-label="Disconnect"
              >
                <PhoneOff size={18} />
              </button>
            )}

            {/* Voice/Keyboard toggle */}
            <button
              type="button"
              onClick={() => setInputMode(inputMode === 'voice' ? 'text' : 'voice')}
              className={cn(
                'p-2 rounded-lg transition-colors flex-shrink-0',
                inputMode === 'text'
                  ? 'text-voice-accent bg-voice-accent/10'
                  : 'text-text-secondary hover:text-text-primary hover:bg-hover-surface'
              )}
              aria-label={inputMode === 'text' ? 'Switch to voice' : 'Switch to keyboard'}
            >
              {inputMode === 'text' ? <Mic size={18} /> : <Keyboard size={18} />}
            </button>
          </div>
        </div>
      </form>
    </div>
  )
}
```

**Step 2: Update features index**

Modify: `ginger_rp/src/components/features/index.ts`

Add this line:
```typescript
export { LiveVoiceInput } from './LiveVoiceInput'
```

**Step 3: Commit**

```bash
cd ginger_rp && git add src/components/features/LiveVoiceInput.tsx src/components/features/index.ts && git commit -m "feat: add LiveVoiceInput component with real Pipecat WebRTC audio"
```

---

## Task 8: Update App Layout to Include Pipecat Provider

**Files:**
- Modify: `ginger_rp/src/app/layout.tsx`

**Step 1: Update the layout**

Modify: `ginger_rp/src/app/layout.tsx`

```typescript
import type { Metadata } from 'next'
import { DM_Sans, Fraunces, JetBrains_Mono } from 'next/font/google'
import { MainLayout } from '@/components/layouts/MainLayout'
import { PipecatProvider } from '@/providers/PipecatProvider'
import '@/styles/globals.css'

const dmSans = DM_Sans({
  subsets: ['latin'],
  variable: '--font-dm-sans',
  display: 'swap',
})

const fraunces = Fraunces({
  subsets: ['latin'],
  variable: '--font-fraunces',
  display: 'swap',
})

const jetbrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  variable: '--font-jetbrains-mono',
  display: 'swap',
})

export const metadata: Metadata = {
  title: 'Ginger - Voice-First Emotional Reflection Companion',
  description: 'Ginger helps users understand their relationships and themselves through multiple psychological lenses.',
  icons: {
    icon: '/favicon.ico',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className={`${dmSans.variable} ${fraunces.variable} ${jetbrainsMono.variable}`}>
      <body className="antialiased">
        <PipecatProvider>
          <MainLayout>
            {children}
          </MainLayout>
        </PipecatProvider>
      </body>
    </html>
  )
}
```

**Step 2: Commit**

```bash
cd ginger_rp && git add src/app/layout.tsx && git commit -m "feat: wrap app in PipecatProvider for voice connectivity"
```

---

## Task 9: Create Pipecat Sync Wrapper Component

**Files:**
- Create: `ginger_rp/src/components/layouts/PipecatSyncWrapper.tsx`
- Modify: `ginger_rp/src/components/layouts/MainLayout.tsx`

**Step 1: Create the sync wrapper**

Create: `ginger_rp/src/components/layouts/PipecatSyncWrapper.tsx`

```typescript
'use client'

import { type FC, type ReactNode } from 'react'
import { usePipecatSync } from '@/hooks/usePipecatSync'

interface PipecatSyncWrapperProps {
  children: ReactNode
}

export const PipecatSyncWrapper: FC<PipecatSyncWrapperProps> = ({ children }) => {
  // This hook sets up all Pipecat event listeners and syncs to stores
  usePipecatSync()

  return <>{children}</>
}
```

**Step 2: Update MainLayout to use the sync wrapper**

Read the current MainLayout first, then modify to wrap children:

Modify: `ginger_rp/src/components/layouts/MainLayout.tsx`

Add the import at the top:
```typescript
import { PipecatSyncWrapper } from './PipecatSyncWrapper'
```

Wrap the children with `PipecatSyncWrapper`:
```typescript
// Inside the component, wrap children:
<PipecatSyncWrapper>
  {children}
</PipecatSyncWrapper>
```

**Step 3: Update layouts index**

Modify: `ginger_rp/src/components/layouts/index.ts`

```typescript
export { MainLayout } from './MainLayout'
export { Navigation } from './Navigation'
export { PipecatSyncWrapper } from './PipecatSyncWrapper'
```

**Step 4: Commit**

```bash
cd ginger_rp && git add src/components/layouts && git commit -m "feat: add PipecatSyncWrapper to connect events to Zustand stores"
```

---

## Task 10: Update EnhancedChatPanel to Use LiveVoiceInput

**Files:**
- Modify: `ginger_rp/src/components/features/panels/EnhancedChatPanel.tsx`

**Step 1: Update imports and component**

In `EnhancedChatPanel.tsx`, replace:
```typescript
import { VoiceInput } from '../VoiceInput'
```

With:
```typescript
import { LiveVoiceInput } from '../LiveVoiceInput'
```

And replace the `<VoiceInput />` component usage with:
```typescript
<LiveVoiceInput />
```

**Step 2: Commit**

```bash
cd ginger_rp && git add src/components/features/panels/EnhancedChatPanel.tsx && git commit -m "feat: replace VoiceInput with LiveVoiceInput in chat panel"
```

---

## Task 11: Add Connection Status to Navigation

**Files:**
- Modify: `ginger_rp/src/components/layouts/Navigation.tsx`

**Step 1: Add connection indicator**

Add to Navigation.tsx imports:
```typescript
import { usePipecatStore } from '@/stores/usePipecatStore'
import { VoiceConnectionButton } from '@/components/voice/VoiceConnectionButton'
```

Add the connection status indicator in the navigation bar (exact placement depends on current layout):
```typescript
// Inside the navigation component
const { connectionStatus, isReady } = usePipecatStore()

// Add to JSX, typically in the header area:
<div className="flex items-center gap-2">
  <VoiceConnectionButton size="sm" />
  {connectionStatus === 'connected' && (
    <span className={cn(
      'w-2 h-2 rounded-full',
      isReady ? 'bg-success' : 'bg-warning animate-pulse'
    )} />
  )}
</div>
```

**Step 2: Commit**

```bash
cd ginger_rp && git add src/components/layouts/Navigation.tsx && git commit -m "feat: add voice connection status indicator to navigation"
```

---

## Task 12: Create Environment Configuration

**Files:**
- Create: `ginger_rp/.env.local.example`
- Modify: `ginger_rp/next.config.js`

**Step 1: Create environment example file**

Create: `ginger_rp/.env.local.example`

```bash
# Pipecat Backend Configuration
# The URL where your Pipecat backend is running
PIPECAT_WEBRTC_URL=http://localhost:7860/offer

# For production, set this to your deployed Pipecat backend URL
# PIPECAT_WEBRTC_URL=https://your-pipecat-backend.com/offer
```

**Step 2: Update next.config.js for environment variables**

Modify: `ginger_rp/next.config.js`

```javascript
/** @type {import('next').NextConfig} */
const nextConfig = {
  env: {
    PIPECAT_WEBRTC_URL: process.env.PIPECAT_WEBRTC_URL || 'http://localhost:7860/offer',
  },
  // Allow cross-origin requests to Pipecat backend in development
  async headers() {
    return [
      {
        source: '/api/:path*',
        headers: [
          { key: 'Access-Control-Allow-Credentials', value: 'true' },
          { key: 'Access-Control-Allow-Origin', value: '*' },
          { key: 'Access-Control-Allow-Methods', value: 'GET,POST,OPTIONS' },
          { key: 'Access-Control-Allow-Headers', value: 'Content-Type' },
        ],
      },
    ]
  },
}

module.exports = nextConfig
```

**Step 3: Commit**

```bash
cd ginger_rp && git add .env.local.example next.config.js && git commit -m "feat: add environment configuration for Pipecat backend URL"
```

---

## Task 13: Add TypeScript Types for Pipecat

**Files:**
- Create: `ginger_rp/src/types/pipecat.ts`
- Modify: `ginger_rp/src/types/index.ts`

**Step 1: Create Pipecat types**

Create: `ginger_rp/src/types/pipecat.ts`

```typescript
// Pipecat RTVI Event Types
export interface RTVITranscriptEvent {
  text: string
  final: boolean
  timestamp?: number
}

export interface RTVIBotTextEvent {
  text: string
}

export interface RTVIErrorEvent {
  error: string
  code?: string
}

// Pipecat Connection Types
export type PipecatConnectionStatus = 'disconnected' | 'connecting' | 'connected' | 'error'

export interface PipecatConfig {
  webrtcUrl: string
  enableMic?: boolean
  enableCam?: boolean
}

// Pipecat Bot State (from backend)
export interface GingerEmotionalState {
  body_state: {
    heart_rate: number
    temperature: number
    tension: number
    energy: number
    breathing: number
  }
  emotions: Array<{
    type: string
    intensity: number
    cause: string
  }>
  background_feelings: string[]
  last_updated: string
}

export interface GingerRoleplayState {
  active: boolean
  character: string | null
  character_emotion: string | null
  scenario: number
  scenario_emotions: string[]
  voice_modifiers: {
    speed: number
    pitch: string
  }
}
```

**Step 2: Export from types index**

Modify: `ginger_rp/src/types/index.ts`

Add at the end:
```typescript
// Pipecat Types
export * from './pipecat'
```

**Step 3: Commit**

```bash
cd ginger_rp && git add src/types && git commit -m "feat: add TypeScript types for Pipecat integration"
```

---

## Task 14: Integration Testing

**Files:**
- No files created, just manual testing

**Step 1: Start the Pipecat backend**

In a separate terminal:
```bash
cd /Users/nateaune/Documents/code/conversational-reflection/pipecat
uv run bot.py --transport webrtc
```

Expected: Backend starts on http://localhost:7860

**Step 2: Start the Next.js frontend**

```bash
cd /Users/nateaune/Documents/code/conversational-reflection/ginger_rp
npm run dev
```

Expected: Frontend starts on http://localhost:3000

**Step 3: Test the connection**

1. Open http://localhost:3000 in Chrome (WebRTC requires Chrome/Firefox)
2. Click the "Connect to Ginger" button
3. Allow microphone permission when prompted
4. Wait for "Connected" status
5. Speak and verify:
   - Waveform animates during speech
   - Transcript appears
   - Ginger responds with voice

**Step 4: Document any issues**

If issues occur, check:
- Browser console for JavaScript errors
- Network tab for failed API calls
- Pipecat backend logs for connection errors

---

## Task 15: Final Commit and PR Preparation

**Step 1: Verify all changes are committed**

```bash
cd ginger_rp && git status
```

Expected: Clean working directory (no uncommitted changes)

**Step 2: Review commit history**

```bash
cd ginger_rp && git log --oneline -15
```

Expected: All commits from this implementation visible

**Step 3: Update README with voice connection instructions**

Create: `ginger_rp/docs/VOICE_SETUP.md`

```markdown
# Voice Integration Setup

## Prerequisites

1. Pipecat backend running locally
2. Chrome or Firefox browser (WebRTC support)
3. Microphone access

## Running Locally

### 1. Start the Pipecat Backend

```bash
cd ../pipecat
uv run bot.py --transport webrtc
```

### 2. Start the Frontend

```bash
npm run dev
```

### 3. Connect

1. Open http://localhost:3000
2. Click "Connect to Ginger" in the voice input bar
3. Allow microphone access
4. Start talking!

## Troubleshooting

### "Connection failed" error
- Verify Pipecat backend is running on port 7860
- Check browser console for CORS errors
- Ensure no firewall blocking localhost connections

### No audio from Ginger
- Check browser audio permissions
- Verify Cartesia API key in pipecat/.env
- Check Pipecat logs for TTS errors

### Microphone not detected
- Grant microphone permission in browser settings
- Check system audio settings
```

**Step 4: Commit documentation**

```bash
cd ginger_rp && git add docs/VOICE_SETUP.md && git commit -m "docs: add voice integration setup guide"
```

---

## Summary

This plan implements a complete Pipecat voice integration with:

1. **Pipecat SDK packages** installed
2. **WebRTC proxy API route** for signaling
3. **PipecatProvider** context for connection management
4. **Zustand store** for Pipecat state
5. **Event sync hook** bridging RTVI events to stores
6. **LiveVoiceInput component** with real WebRTC audio
7. **Connection UI** with status indicators
8. **Environment configuration** for backend URL
9. **TypeScript types** for type safety
10. **Documentation** for setup and troubleshooting

**Total Tasks:** 15
**Estimated Files Modified/Created:** 18
**Key Dependencies:** @pipecat-ai/client-js, @pipecat-ai/client-react, @pipecat-ai/voice-ui-kit, @pipecat-ai/small-webrtc-transport
