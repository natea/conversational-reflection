'use client'

import { type FC } from 'react'
import { cn } from '@/lib/utils'
import type { EmotionEvent, EmotionType } from '@/types'
import { Brain, Heart, Frown, Smile, AlertTriangle, Zap } from '@/components/ui/Icons'

interface EmotionTimelineProps {
  emotions: EmotionEvent[]
  compact?: boolean
  maxItems?: number
  onEmotionClick?: (emotion: EmotionEvent) => void
}

const getEmotionIcon = (type: EmotionType) => {
  const iconProps = { size: 16 }
  switch (type) {
    case 'fear':
      return <AlertTriangle {...iconProps} />
    case 'anger':
      return <Zap {...iconProps} />
    case 'joy':
      return <Smile {...iconProps} />
    case 'sadness':
      return <Frown {...iconProps} />
    case 'disgust':
      return <Frown {...iconProps} />
    case 'surprise':
      return <Zap {...iconProps} />
    default:
      return <Heart {...iconProps} />
  }
}

const getEmotionTextColor = (type: EmotionType) => {
  switch (type) {
    case 'fear':
      return 'text-emotion-fear'
    case 'anger':
      return 'text-emotion-anger'
    case 'joy':
      return 'text-emotion-joy'
    case 'sadness':
      return 'text-emotion-sadness'
    case 'disgust':
      return 'text-emotion-disgust'
    case 'surprise':
      return 'text-emotion-surprise'
    default:
      return 'text-text-secondary'
  }
}

const getEmotionBgColor = (type: EmotionType) => {
  switch (type) {
    case 'fear':
      return 'bg-emotion-fear'
    case 'anger':
      return 'bg-emotion-anger'
    case 'joy':
      return 'bg-emotion-joy'
    case 'sadness':
      return 'bg-emotion-sadness'
    case 'disgust':
      return 'bg-emotion-disgust'
    case 'surprise':
      return 'bg-emotion-surprise'
    default:
      return 'bg-text-secondary'
  }
}

const getEmotionBgLightColor = (type: EmotionType) => {
  switch (type) {
    case 'fear':
      return 'bg-emotion-fear/10'
    case 'anger':
      return 'bg-emotion-anger/10'
    case 'joy':
      return 'bg-emotion-joy/10'
    case 'sadness':
      return 'bg-emotion-sadness/10'
    case 'disgust':
      return 'bg-emotion-disgust/10'
    case 'surprise':
      return 'bg-emotion-surprise/10'
    default:
      return 'bg-surface'
  }
}

const formatTimeAgo = (date: Date): string => {
  const now = new Date()
  const diffInMs = now.getTime() - date.getTime()
  const diffInMinutes = Math.floor(diffInMs / (1000 * 60))
  const diffInHours = Math.floor(diffInMs / (1000 * 60 * 60))
  const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24))

  if (diffInMinutes < 1) return 'Just now'
  if (diffInMinutes < 60) return `${diffInMinutes}m ago`
  if (diffInHours < 24) return `${diffInHours}h ago`
  return `${diffInDays}d ago`
}

export const EmotionTimeline: FC<EmotionTimelineProps> = ({
  emotions,
  compact = false,
  maxItems = 10,
  onEmotionClick
}) => {
  const sortedEmotions = [...emotions]
    .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
    .slice(0, maxItems)

  if (emotions.length === 0) {
    return (
      <div className="text-center py-8 text-text-secondary text-sm">
        <Brain size={32} className="mx-auto mb-2 opacity-30" />
        <p>No emotion events yet</p>
      </div>
    )
  }

  return (
    <div className={cn('space-y-2', compact && 'space-y-1')}>
      {sortedEmotions.map((emotion, index) => {
        const isDecaying = emotion.currentIntensity < emotion.initialIntensity * 0.8
        const decayAmount = 1 - (emotion.currentIntensity / emotion.initialIntensity)

        return (
          <div
            key={emotion.id}
            onClick={() => onEmotionClick?.(emotion)}
            className={cn(
              'flex items-center gap-3 p-3 rounded-lg border border-border-light',
              'transition-all duration-200',
              onEmotionClick && 'cursor-pointer hover:border-border-medium hover:bg-hover-surface',
              isDecaying && 'opacity-70'
            )}
            style={{
              animation: isDecaying ? 'emotion-decay 5s ease-out forwards' : 'none'
            }}
          >
            {/* Emotion Icon */}
            <div
              className={cn(
                'flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center',
                getEmotionBgLightColor(emotion.emotionType),
                getEmotionTextColor(emotion.emotionType)
              )}
            >
              {getEmotionIcon(emotion.emotionType)}
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between gap-2 mb-1">
                <span className="font-medium text-sm text-text-primary capitalize">
                  {emotion.emotionType}
                </span>
                <span className="text-xs text-text-secondary whitespace-nowrap">
                  {formatTimeAgo(emotion.timestamp)}
                </span>
              </div>

              {/* Intensity bar */}
              <div className="relative h-1.5 bg-border-light rounded-full overflow-hidden mb-1">
                <div
                  className={cn(
                    'h-full rounded-full transition-all duration-500',
                    getEmotionBgColor(emotion.emotionType)
                  )}
                  style={{ width: `${emotion.currentIntensity * 100}%` }}
                />
              </div>

              {/* Cause */}
              {emotion.cause && (
                <p className="text-xs text-text-secondary line-clamp-1">
                  {emotion.cause}
                </p>
              )}

              {/* Decay indicator */}
              {isDecaying && (
                <div className="flex items-center gap-1 mt-1">
                  <div className="w-1 h-1 rounded-full bg-text-secondary animate-pulse" />
                  <span className="text-xs text-text-secondary">
                    Decaying ({Math.round(decayAmount * 100)}% reduced)
                  </span>
                </div>
              )}
            </div>
          </div>
        )
      })}
    </div>
  )
}

