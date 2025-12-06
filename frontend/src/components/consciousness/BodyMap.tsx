'use client'

import { type FC } from 'react'
import { cn } from '@/lib/utils'
import type { BodyState } from '@/types'

interface BodyMapProps {
  bodyState: BodyState
  compact?: boolean
  interactive?: boolean
  highlightedPart?: 'head' | 'chest' | 'stomach' | 'legs' | null
  onPartClick?: (part: string) => void
}

export const BodyMap: FC<BodyMapProps> = ({
  bodyState,
  compact = false,
  interactive = false,
  highlightedPart = null,
  onPartClick
}) => {
  const size = compact ? 120 : 200
  const viewBox = `0 0 ${size} ${size * 2}`

  // Calculate intensity colors based on body state
  const getTensionColor = () => {
    const intensity = bodyState.tension
    return `rgba(155, 89, 182, ${intensity * 0.6})`
  }

  const getStressColor = () => {
    const intensity = bodyState.stress
    return `rgba(231, 76, 60, ${intensity * 0.6})`
  }

  const getEnergyColor = () => {
    const intensity = bodyState.energy
    return `rgba(39, 174, 96, ${intensity * 0.6})`
  }

  const getPartOpacity = (part: string) => {
    return highlightedPart === part ? 1 : 0.7
  }

  const getPartStroke = (part: string) => {
    return highlightedPart === part ? 'var(--voice-accent)' : 'var(--border-medium)'
  }

  const handlePartClick = (part: string) => {
    if (interactive && onPartClick) {
      onPartClick(part)
    }
  }

  return (
    <div className={cn('flex justify-center', compact ? 'w-full' : 'w-full max-w-[200px]')}>
      <svg
        viewBox={viewBox}
        className={cn('w-full', compact ? 'max-w-[120px]' : 'max-w-[200px]')}
        style={{ filter: 'drop-shadow(0 2px 8px rgba(0, 0, 0, 0.1))' }}
      >
        {/* Body silhouette */}
        <g>
          {/* Head */}
          <ellipse
            cx={size / 2}
            cy={size * 0.2}
            rx={size * 0.175}
            ry={size * 0.2}
            fill={getTensionColor()}
            stroke={getPartStroke('head')}
            strokeWidth="2"
            opacity={getPartOpacity('head')}
            className={cn(
              'transition-all duration-500',
              interactive && 'cursor-pointer hover:opacity-100',
              highlightedPart === 'head' && 'body-part-active'
            )}
            onClick={() => handlePartClick('head')}
          />

          {/* Neck */}
          <rect
            x={size * 0.425}
            y={size * 0.375}
            width={size * 0.15}
            height={size * 0.125}
            rx={size * 0.025}
            fill={getTensionColor()}
            stroke={getPartStroke('chest')}
            strokeWidth="2"
            opacity={0.8}
            className="transition-all duration-500"
          />

          {/* Chest */}
          <ellipse
            cx={size / 2}
            cy={size * 0.75}
            rx={size * 0.25}
            ry={size * 0.3}
            fill={getStressColor()}
            stroke={getPartStroke('chest')}
            strokeWidth="2"
            opacity={getPartOpacity('chest')}
            className={cn(
              'transition-all duration-500',
              interactive && 'cursor-pointer hover:opacity-100',
              highlightedPart === 'chest' && 'body-part-active'
            )}
            onClick={() => handlePartClick('chest')}
          />

          {/* Stomach/Gut */}
          <ellipse
            cx={size / 2}
            cy={size * 1.15}
            rx={size * 0.225}
            ry={size * 0.2}
            fill={getStressColor()}
            stroke={getPartStroke('stomach')}
            strokeWidth="2"
            opacity={getPartOpacity('stomach')}
            className={cn(
              'transition-all duration-500',
              interactive && 'cursor-pointer hover:opacity-100',
              highlightedPart === 'stomach' && 'body-part-active'
            )}
            onClick={() => handlePartClick('stomach')}
          />

          {/* Legs */}
          <rect
            x={size * 0.325}
            y={size * 1.325}
            width={size * 0.35}
            height={size * 0.6}
            rx={size * 0.05}
            fill={getEnergyColor()}
            stroke={getPartStroke('legs')}
            strokeWidth="2"
            opacity={getPartOpacity('legs')}
            className={cn(
              'transition-all duration-500',
              interactive && 'cursor-pointer hover:opacity-100',
              highlightedPart === 'legs' && 'body-part-active'
            )}
            onClick={() => handlePartClick('legs')}
          />
        </g>
      </svg>
    </div>
  )
}

