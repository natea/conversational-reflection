'use client'

import { type FC, useEffect, useRef } from 'react'
import { cn } from '@/lib/utils'
import { useVoiceStore } from '@/stores/useVoiceStore'
import { Play, Pause, SkipForward, SkipBack, X, Volume2 } from '@/components/ui/Icons'

export const AudioPlayerBar: FC = () => {
  const {
    currentItem,
    queue,
    playbackState,
    progress,
    speed,
    togglePlayPause,
    playNext,
    playPrevious,
    setSpeed,
    clearQueue
  } = useVoiceStore()

  const progressBarRef = useRef<HTMLDivElement>(null)

  // If nothing is playing or queued, don't show the player
  if (!currentItem && queue.length === 0) {
    return null
  }

  const handleProgressClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!progressBarRef.current) return
    const rect = progressBarRef.current.getBoundingClientRect()
    const x = e.clientX - rect.left
    const percentage = x / rect.width
    // In a real implementation, we'd seek to this position
    console.log('Seek to:', percentage)
  }

  const cycleSpeed = () => {
    const speeds = [0.5, 0.75, 1.0, 1.25, 1.5, 2.0]
    const currentIndex = speeds.indexOf(speed)
    const nextSpeed = speeds[(currentIndex + 1) % speeds.length]
    setSpeed(nextSpeed)
  }

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-surface border-t border-border-light shadow-voice-bar z-50 animate-slide-up">
      <div className="max-w-7xl mx-auto">
        {/* Progress bar */}
        <div
          ref={progressBarRef}
          onClick={handleProgressClick}
          className="h-1 bg-border-light cursor-pointer hover:h-1.5 transition-all relative"
        >
          <div
            className="h-full bg-voice-accent transition-all duration-100"
            style={{ width: `${progress * 100}%` }}
          />
        </div>

        {/* Player controls */}
        <div className="flex items-center gap-4 px-4 py-3">
          {/* Now playing info */}
          <div className="flex-1 min-w-0 flex items-center gap-3">
            {/* Speaker indicator */}
            <div className="flex items-center gap-2 min-w-0">
              <div className="flex-shrink-0">
                <div className="w-10 h-10 rounded-full bg-voice-contact/10 flex items-center justify-center">
                  <Volume2 size={18} className="text-voice-contact" />
                </div>
              </div>
              <div className="min-w-0">
                <p className="text-sm font-medium text-text-primary truncate">
                  {currentItem?.speakerName || 'Loading...'}
                </p>
                <p className="text-xs text-text-secondary truncate">
                  {currentItem ? currentItem.text.slice(0, 60) + '...' : 'Preparing audio...'}
                </p>
              </div>
            </div>

            {/* Waveform visualization */}
            {playbackState === 'playing' && (
              <div className="voice-waveform hidden md:flex">
                {[...Array(8)].map((_, i) => (
                  <div
                    key={i}
                    className="voice-waveform-bar"
                    style={{
                      height: `${Math.random() * 24 + 8}px`,
                      animationDelay: `${i * 50}ms`
                    }}
                  />
                ))}
              </div>
            )}
          </div>

          {/* Playback controls */}
          <div className="flex items-center gap-2">
            {/* Previous */}
            <button
              onClick={playPrevious}
              className="p-2 rounded-lg hover:bg-hover-surface transition-colors text-text-secondary hover:text-text-primary"
              aria-label="Previous"
            >
              <SkipBack size={18} />
            </button>

            {/* Play/Pause */}
            <button
              onClick={togglePlayPause}
              disabled={playbackState === 'loading'}
              className={cn(
                'w-10 h-10 rounded-full flex items-center justify-center transition-colors',
                'bg-voice-accent text-white hover:bg-voice-accent/90',
                playbackState === 'loading' && 'opacity-50 cursor-not-allowed'
              )}
              aria-label={playbackState === 'playing' ? 'Pause' : 'Play'}
            >
              {playbackState === 'loading' ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : playbackState === 'playing' ? (
                <Pause size={18} />
              ) : (
                <Play size={18} />
              )}
            </button>

            {/* Next */}
            <button
              onClick={playNext}
              disabled={queue.length === 0}
              className={cn(
                'p-2 rounded-lg hover:bg-hover-surface transition-colors',
                queue.length === 0
                  ? 'text-text-secondary opacity-30 cursor-not-allowed'
                  : 'text-text-secondary hover:text-text-primary'
              )}
              aria-label="Next"
            >
              <SkipForward size={18} />
            </button>

            {/* Speed control */}
            <button
              onClick={cycleSpeed}
              className="px-3 py-1.5 rounded-lg hover:bg-hover-surface transition-colors text-xs font-medium text-text-secondary hover:text-text-primary"
              aria-label={`Playback speed: ${speed}x`}
            >
              {speed}x
            </button>

            {/* Queue count */}
            {queue.length > 0 && (
              <div className="px-2 py-1 rounded-lg bg-surface border border-border-light text-xs text-text-secondary">
                +{queue.length}
              </div>
            )}

            {/* Close */}
            <button
              onClick={clearQueue}
              className="p-2 rounded-lg hover:bg-hover-surface transition-colors text-text-secondary hover:text-text-primary"
              aria-label="Close player"
            >
              <X size={18} />
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

