'use client'

import { type FC, useState } from 'react'
import { cn } from '@/lib/utils'
import { Volume2, Loader } from '@/components/ui/Icons'
import { useVoiceStore } from '@/stores/useVoiceStore'
import type { VoiceProfile } from '@/types'

interface MessageVoiceButtonProps {
  messageId: string
  text: string
  voiceProfile: VoiceProfile
  speakerName: string
  mayaTags?: string[]
  compact?: boolean
}

export const MessageVoiceButton: FC<MessageVoiceButtonProps> = ({
  messageId,
  text,
  voiceProfile,
  speakerName,
  mayaTags,
  compact = false
}) => {
  const { addToQueue, currentItem, playbackState } = useVoiceStore()
  const [isGenerating, setIsGenerating] = useState(false)

  const isCurrentlyPlaying = currentItem?.messageId === messageId && playbackState === 'playing'

  const handleClick = () => {
    if (isGenerating) return

    // Simulate voice generation
    setIsGenerating(true)
    
    setTimeout(() => {
      addToQueue({
        id: `voice_${messageId}_${Date.now()}`,
        text,
        voiceProfile,
        speakerName,
        messageId,
        mayaTags
      })
      setIsGenerating(false)
    }, 500)
  }

  if (compact) {
    return (
      <button
        onClick={handleClick}
        disabled={isGenerating}
        className={cn(
          'p-1.5 rounded-lg transition-colors',
          isCurrentlyPlaying
            ? 'bg-voice-contact/20 text-voice-contact'
            : 'text-text-secondary hover:text-text-primary hover:bg-hover-surface'
        )}
        aria-label="Play voice"
      >
        {isGenerating ? (
          <Loader size={14} className="animate-spin" />
        ) : (
          <Volume2 size={14} />
        )}
      </button>
    )
  }

  return (
    <button
      onClick={handleClick}
      disabled={isGenerating}
      className={cn(
        'flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium transition-all',
        isCurrentlyPlaying
          ? 'bg-voice-contact/10 text-voice-contact border border-voice-contact/20'
          : 'text-text-secondary hover:text-text-primary hover:bg-hover-surface border border-transparent hover:border-border-light'
      )}
    >
      {isGenerating ? (
        <>
          <Loader size={14} className="animate-spin" />
          <span>Generating...</span>
        </>
      ) : (
        <>
          <Volume2 size={14} />
          <span>{isCurrentlyPlaying ? 'Playing' : 'Play Voice'}</span>
        </>
      )}
      
      {mayaTags && mayaTags.length > 0 && !isGenerating && (
        <span className="text-xs opacity-60">
          ({mayaTags.join(', ')})
        </span>
      )}
    </button>
  )
}

