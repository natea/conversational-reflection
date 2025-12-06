'use client'

import { type FC, useState, useEffect, useRef } from 'react'
import { cn } from '@/lib/utils'
import { useGingerStore } from '@/stores/useGingerStore'
import { Mic, Keyboard } from '@/components/ui/Icons'
import type { VoiceState } from '@/types'
import { FloatingLensSelector } from './FloatingLensSelector'

const Waveform: FC<{ isActive: boolean }> = ({ isActive }) => {
  const [heights, setHeights] = useState<number[]>(Array(12).fill(4))
  const animationRef = useRef<number>()

  useEffect(() => {
    if (isActive) {
      const animate = () => {
        setHeights(Array(12).fill(0).map(() => {
          // Simulate natural speech patterns with varied heights
          const baseHeight = Math.random() * 20 + 8
          const variation = Math.sin(Date.now() / 200) * 4
          return baseHeight + variation
        }))
        animationRef.current = requestAnimationFrame(animate)
      }
      animate()
    } else {
      setHeights(Array(12).fill(4))
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current)
      }
    }

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current)
      }
    }
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

export const VoiceInput: FC = () => {
  const { voiceState, setVoiceState, activeLenses, addMessageWithResponse } = useGingerStore()
  const [textInput, setTextInput] = useState('')
  const [breathingPauseDetected, setBreathingPauseDetected] = useState(false)
  const breathingTimerRef = useRef<NodeJS.Timeout>()

  const handleVoiceClick = () => {
    if (voiceState === 'idle' || voiceState === 'text') {
      setVoiceState('listening')
      
      // Simulate breathing pause detection
      breathingTimerRef.current = setTimeout(() => {
        setBreathingPauseDetected(true)
        setTimeout(() => setBreathingPauseDetected(false), 2000)
      }, 2000)
      
      // Simulate listening with realistic duration
      setTimeout(() => {
        setVoiceState('processing')
        if (breathingTimerRef.current) {
          clearTimeout(breathingTimerRef.current)
        }
        setTimeout(() => {
          setVoiceState('idle')
          setBreathingPauseDetected(false)
        }, 1500)
      }, 3000)
    } else if (voiceState === 'listening') {
      setVoiceState('processing')
      if (breathingTimerRef.current) {
        clearTimeout(breathingTimerRef.current)
      }
      setTimeout(() => {
        setVoiceState('idle')
        setBreathingPauseDetected(false)
      }, 1500)
    }
  }

  useEffect(() => {
    return () => {
      if (breathingTimerRef.current) {
        clearTimeout(breathingTimerRef.current)
      }
    }
  }, [])

  const handleKeyboardClick = () => {
    setVoiceState(voiceState === 'text' ? 'idle' : 'text')
  }

  const handleTextSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!textInput.trim()) return

    addMessageWithResponse({
      role: 'user',
      content: textInput
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

  return (
    <div>
      <form onSubmit={handleTextSubmit} className="relative">
        <div
          className={cn(
            'flex items-center gap-2 px-3 py-2 bg-surface rounded-full shadow-voice-bar border border-border-light transition-all',
            voiceState === 'listening' && 'border-voice-accent'
          )}
        >
          {/* Lens Selector */}
          <div className="flex-shrink-0 border-r border-border-light pr-2 mr-1">
            <FloatingLensSelector />
          </div>

          {/* Voice/Text content area */}
          <div className="flex-1 flex items-center justify-center min-h-[40px]">
            {voiceState === 'idle' && (
              <button
                type="button"
                onClick={handleVoiceClick}
                className="flex items-center gap-2 text-text-secondary hover:text-text-primary transition-colors"
              >
                <Mic size={20} className="text-voice-accent" />
                <span className="text-sm">Tap to talk to Ginger...</span>
              </button>
            )}

            {voiceState === 'listening' && (
              <div className="flex-1 flex flex-col items-center gap-2">
                <button
                  type="button"
                  onClick={handleVoiceClick}
                  className="flex items-center gap-4"
                >
                  <span className="text-sm font-medium text-voice-accent tracking-wide">LISTENING</span>
                  <Waveform isActive={true} />
                </button>
                {breathingPauseDetected && (
                  <span className="text-xs text-text-secondary animate-fade-in">
                    Taking a breath...
                  </span>
                )}
              </div>
            )}

            {voiceState === 'processing' && (
              <div className="flex items-center gap-2 text-text-secondary">
                <div className="w-4 h-4 border-2 border-text-secondary border-t-transparent rounded-full animate-spin" />
                <span className="text-sm">Thinking through {getLensLabel()} lens...</span>
              </div>
            )}

            {voiceState === 'text' && (
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

          {/* Keyboard toggle */}
          <button
            type="button"
            onClick={handleKeyboardClick}
            className={cn(
              'p-2 rounded-lg transition-colors flex-shrink-0',
              voiceState === 'text'
                ? 'text-voice-accent bg-voice-accent/10'
                : 'text-text-secondary hover:text-text-primary hover:bg-hover-surface'
            )}
            aria-label={voiceState === 'text' ? 'Switch to voice' : 'Switch to keyboard'}
          >
            {voiceState === 'text' ? <Mic size={18} /> : <Keyboard size={18} />}
          </button>
        </div>
      </form>

    </div>
  )
}
