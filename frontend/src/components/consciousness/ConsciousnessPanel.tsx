'use client'

import { type FC, useState } from 'react'
import { cn } from '@/lib/utils'
import type { BodyState, EmotionEvent, SomaticMarker } from '@/types'
import { BodyMap } from './BodyMap'
import { EmotionTimeline } from './EmotionTimeline'
import { Activity, Brain, Heart, AlertCircle, ChevronDown, ChevronUp } from '@/components/ui/Icons'

interface ConsciousnessPanelProps {
  bodyState: BodyState
  recentEmotions: EmotionEvent[]
  activeMarkers: SomaticMarker[]
  compact?: boolean
  className?: string
}

type ConsciousnessTab = 'body' | 'emotions' | 'markers'

export const ConsciousnessPanel: FC<ConsciousnessPanelProps> = ({
  bodyState,
  recentEmotions,
  activeMarkers,
  compact = false,
  className
}) => {
  const [activeTab, setActiveTab] = useState<ConsciousnessTab>('body')
  const [isExpanded, setIsExpanded] = useState(!compact)

  // Calculate overall state indicators
  const overallValence = bodyState.valence
  const overallArousal = bodyState.arousal
  const stressLevel = bodyState.stress

  const getValenceLabel = () => {
    if (overallValence > 0.3) return 'Positive'
    if (overallValence < -0.3) return 'Negative'
    return 'Neutral'
  }

  const getValenceColor = () => {
    if (overallValence > 0.3) return 'text-body-valence-positive'
    if (overallValence < -0.3) return 'text-body-valence-negative'
    return 'text-text-secondary'
  }

  const getStressLevel = () => {
    if (stressLevel > 0.7) return 'High'
    if (stressLevel > 0.4) return 'Moderate'
    return 'Low'
  }

  if (compact && !isExpanded) {
    return (
      <div
        className={cn(
          'bg-surface border border-border-light rounded-xl p-3',
          'cursor-pointer hover:border-border-medium transition-all',
          className
        )}
        onClick={() => setIsExpanded(true)}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Brain size={20} className="text-damasio-lens" />
            <span className="text-sm font-medium text-text-primary">Consciousness</span>
          </div>
          <ChevronDown size={16} className="text-text-secondary" />
        </div>
        
        <div className="flex items-center gap-3 mt-2">
          {/* Mini indicators */}
          <div className="flex items-center gap-1">
            <div className={cn('w-2 h-2 rounded-full', getValenceColor())} />
            <span className="text-xs text-text-secondary">{getValenceLabel()}</span>
          </div>
          
          {recentEmotions.length > 0 && (
            <div className="flex items-center gap-1">
              <Heart size={12} className="text-voice-accent" />
              <span className="text-xs text-text-secondary">{recentEmotions.length}</span>
            </div>
          )}
          
          {activeMarkers.length > 0 && (
            <div className="flex items-center gap-1">
              <AlertCircle size={12} className="text-warning" />
              <span className="text-xs text-text-secondary">{activeMarkers.length}</span>
            </div>
          )}
        </div>
      </div>
    )
  }

  return (
    <div className={cn('bg-surface border border-border-light rounded-xl', className)}>
      {/* Header */}
      <div className="border-b border-border-light p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Brain size={20} className="text-damasio-lens" />
            <h3 className="text-sm font-medium text-text-primary">
              Consciousness State
            </h3>
          </div>
          {compact && (
            <button
              onClick={() => setIsExpanded(false)}
              className="p-1 rounded hover:bg-hover-surface"
            >
              <ChevronUp size={16} className="text-text-secondary" />
            </button>
          )}
        </div>

        {/* Overall state indicators */}
        <div className="flex items-center gap-4 mt-3">
          <div>
            <span className="text-xs text-text-secondary">Valence</span>
            <p className={cn('text-sm font-medium', getValenceColor())}>
              {getValenceLabel()}
            </p>
          </div>
          <div>
            <span className="text-xs text-text-secondary">Arousal</span>
            <p className="text-sm font-medium text-text-primary">
              {Math.round(overallArousal * 100)}%
            </p>
          </div>
          <div>
            <span className="text-xs text-text-secondary">Stress</span>
            <p className={cn(
              'text-sm font-medium',
              stressLevel > 0.7 ? 'text-error' : stressLevel > 0.4 ? 'text-warning' : 'text-success'
            )}>
              {getStressLevel()}
            </p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-border-light">
        <button
          onClick={() => setActiveTab('body')}
          className={cn(
            'flex-1 flex items-center justify-center gap-2 py-2 text-sm font-medium transition-colors',
            activeTab === 'body'
              ? 'text-text-primary border-b-2 border-voice-accent'
              : 'text-text-secondary hover:text-text-primary'
          )}
        >
          <Activity size={16} />
          Body
        </button>
        <button
          onClick={() => setActiveTab('emotions')}
          className={cn(
            'flex-1 flex items-center justify-center gap-2 py-2 text-sm font-medium transition-colors',
            activeTab === 'emotions'
              ? 'text-text-primary border-b-2 border-voice-accent'
              : 'text-text-secondary hover:text-text-primary'
          )}
        >
          <Heart size={16} />
          Emotions
          {recentEmotions.length > 0 && (
            <span className="px-1.5 py-0.5 rounded-full bg-voice-accent/10 text-voice-accent text-xs">
              {recentEmotions.length}
            </span>
          )}
        </button>
        <button
          onClick={() => setActiveTab('markers')}
          className={cn(
            'flex-1 flex items-center justify-center gap-2 py-2 text-sm font-medium transition-colors',
            activeTab === 'markers'
              ? 'text-text-primary border-b-2 border-voice-accent'
              : 'text-text-secondary hover:text-text-primary'
          )}
        >
          <AlertCircle size={16} />
          Markers
          {activeMarkers.length > 0 && (
            <span className="px-1.5 py-0.5 rounded-full bg-warning/10 text-warning text-xs">
              {activeMarkers.length}
            </span>
          )}
        </button>
      </div>

      {/* Content */}
      <div className="p-4">
        {activeTab === 'body' && (
          <div className="space-y-4">
            <BodyMap bodyState={bodyState} />
            
            {/* Body state metrics */}
            <div className="space-y-2">
              <div>
                <div className="flex items-center justify-between text-xs mb-1">
                  <span className="text-text-secondary">Energy</span>
                  <span className="text-text-primary">{Math.round(bodyState.energy * 100)}%</span>
                </div>
                <div className="consciousness-meter">
                  <div
                    className="consciousness-meter-fill bg-body-energy"
                    style={{ width: `${bodyState.energy * 100}%` }}
                  />
                </div>
              </div>
              
              <div>
                <div className="flex items-center justify-between text-xs mb-1">
                  <span className="text-text-secondary">Tension</span>
                  <span className="text-text-primary">{Math.round(bodyState.tension * 100)}%</span>
                </div>
                <div className="consciousness-meter">
                  <div
                    className="consciousness-meter-fill bg-body-tension"
                    style={{ width: `${bodyState.tension * 100}%` }}
                  />
                </div>
              </div>
              
              <div>
                <div className="flex items-center justify-between text-xs mb-1">
                  <span className="text-text-secondary">Stress</span>
                  <span className="text-text-primary">{Math.round(bodyState.stress * 100)}%</span>
                </div>
                <div className="consciousness-meter">
                  <div
                    className="consciousness-meter-fill bg-body-stress"
                    style={{ width: `${bodyState.stress * 100}%` }}
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'emotions' && (
          <EmotionTimeline emotions={recentEmotions} compact={compact} />
        )}

        {activeTab === 'markers' && (
          <div className="space-y-2">
            {activeMarkers.length === 0 ? (
              <div className="text-center py-8 text-text-secondary text-sm">
                <AlertCircle size={32} className="mx-auto mb-2 opacity-30" />
                <p>No somatic markers active</p>
              </div>
            ) : (
              activeMarkers.map((marker) => (
                <div
                  key={marker.id}
                  className="p-3 rounded-lg border border-border-light bg-surface hover:bg-hover-surface transition-colors"
                >
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div className="flex items-center gap-2">
                      <div className={cn(
                        'w-2 h-2 rounded-full somatic-pulse',
                        marker.valence > 0 ? 'bg-success' : 'bg-warning'
                      )} />
                      <span className="text-sm font-medium text-text-primary">
                        {marker.triggerPattern}
                      </span>
                    </div>
                    <span className="text-xs text-text-secondary">
                      {Math.round(marker.strength * 100)}%
                    </span>
                  </div>
                  <p className="text-xs text-text-secondary italic">
                    → {marker.responseTendency}
                  </p>
                  <div className="mt-2 text-xs text-text-secondary">
                    Reinforced {marker.reinforcementCount} times
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  )
}

