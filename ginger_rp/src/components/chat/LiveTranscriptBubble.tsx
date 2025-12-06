'use client'

import { type FC } from 'react'
import { cn } from '@/lib/utils'
import { GingerLogo, Mic } from '@/components/ui/Icons'
import { useGingerStore } from '@/stores/useGingerStore'
import { LENSES } from '@/constants'
import type { LensType } from '@/types'

interface LiveTranscriptBubbleProps {
  role: 'user' | 'assistant'
  text: string
  isInterim?: boolean
}

// Helper to get lens background class
const getLensBgClass = (lens: LensType) => {
  const bgClasses: Record<LensType, string> = {
    'damasio': 'bg-damasio-lens',
    'cbt': 'bg-cbt-lens',
    'act': 'bg-act-lens',
    'ifs': 'bg-ifs-lens',
    'stoic': 'bg-stoic-lens',
  }
  return bgClasses[lens] || 'bg-text-secondary'
}

const LensBadge: FC<{ lens: LensType }> = ({ lens }) => {
  const lensInfo = LENSES.find(l => l.id === lens)
  if (!lensInfo) return null

  return (
    <span className={cn('lens-badge', `lens-badge--${lens}`)}>
      <span className={cn('w-1.5 h-1.5 rounded-full', getLensBgClass(lens))} />
      {lensInfo.name} Lens
    </span>
  )
}

export const LiveTranscriptBubble: FC<LiveTranscriptBubbleProps> = ({
  role,
  text,
  isInterim = true,
}) => {
  const { activeLenses } = useGingerStore()
  const currentLens = activeLenses[0] as LensType | undefined

  if (role === 'user') {
    return (
      <div className="flex justify-end animate-slide-up">
        <div className="max-w-[85%]">
          <div
            className={cn(
              'message-bubble message-bubble--user',
              isInterim && 'opacity-70'
            )}
          >
            <p className="text-sm leading-relaxed">{text}</p>
            {isInterim && (
              <span className="inline-block ml-1 w-1.5 h-4 bg-voice-accent/60 animate-pulse" />
            )}
          </div>
          <div className="flex items-center justify-end gap-1 mt-1 text-voice-accent">
            <Mic size={12} />
            <span className="text-xs">Listening...</span>
          </div>
        </div>
      </div>
    )
  }

  // AI/Assistant message
  return (
    <div className="flex gap-3 animate-slide-up">
      <div className="flex-shrink-0 w-8 h-8 rounded-full bg-surface border border-border-light flex items-center justify-center">
        <GingerLogo size={18} className="text-text-secondary" />
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-2">
          {currentLens && <LensBadge lens={currentLens} />}
          <span className="text-xs text-success font-medium">Speaking...</span>
        </div>

        <div
          className={cn(
            'message-bubble message-bubble--ai',
            isInterim && 'opacity-80'
          )}
        >
          <p className="text-sm leading-relaxed text-text-primary">
            {text}
            {isInterim && (
              <span className="inline-block ml-1 w-1.5 h-4 bg-success/60 animate-pulse" />
            )}
          </p>
        </div>
      </div>
    </div>
  )
}
