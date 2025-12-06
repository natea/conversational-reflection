'use client'

import { type FC, useState, useEffect, useCallback } from 'react'
import { cn } from '@/lib/utils'
import { usePipecat } from '@/providers/PipecatProvider'
import { usePipecatStore } from '@/stores/usePipecatStore'
import { useGingerStore } from '@/stores/useGingerStore'
import { Mic, MicOff, Keyboard, Phone, PhoneOff, Loader } from 'lucide-react'
import { FloatingLensSelector } from './FloatingLensSelector'
import { QuickDeviceSelector } from '@/components/voice/QuickDeviceSelector'

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
  const { connect, disconnect, client } = usePipecat()
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
    const newState = !isMicEnabled
    // Actually enable/disable the microphone on the WebRTC client
    if (client) {
      client.enableMic(newState)
    }
    setMicEnabled(newState)
  }, [isMicEnabled, setMicEnabled, client])

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
            {/* Device selector (always visible in voice mode) */}
            {inputMode === 'voice' && (
              <QuickDeviceSelector />
            )}

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
