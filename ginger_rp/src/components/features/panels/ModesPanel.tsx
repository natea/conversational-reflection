'use client'

import { type FC, useState } from 'react'
import { cn } from '@/lib/utils'
import { formatTimestamp } from '@/lib/utils'
import { useGingerStore } from '@/stores/useGingerStore'
import { type ModeType, type ArtifactType, type Artifact } from '@/types'
import { MODES } from '@/constants'
import { ChevronLeft, ChevronRight, Plus, Brain, MessageSquare, GitBranch, Activity, FileText, Sparkles, Bookmark, Mic } from '@/components/ui/Icons'
import { ArtifactPreview } from './ArtifactPreview'

const ModeIcon: FC<{ mode: ModeType; className?: string }> = ({ mode, className }) => {
  const iconProps = { size: 24, className }
  switch (mode) {
    case 'reflect':
      return <Brain {...iconProps} />
    case 'roleplay':
      return <MessageSquare {...iconProps} />
    case 'patterns':
      return <GitBranch {...iconProps} />
    case 'somatic':
      return <Activity {...iconProps} />
    default:
      return <Brain {...iconProps} />
  }
}

const ArtifactBadge: FC<{ type: ArtifactType }> = ({ type }) => {
  const colorMap: Record<ArtifactType, string> = {
    reflection: 'bg-damasio-lens/10 text-damasio-lens',
    pattern: 'bg-cbt-lens/10 text-cbt-lens',
    'voice-note': 'bg-voice-accent/10 text-voice-accent',
    insight: 'bg-act-lens/10 text-act-lens',
    export: 'bg-text-secondary/10 text-text-secondary'
  }

  const labelMap: Record<ArtifactType, string> = {
    reflection: 'Reflection',
    pattern: 'Pattern',
    'voice-note': 'Voice Note',
    insight: 'Insight',
    export: 'Export'
  }

  return (
    <span className={cn('px-2 py-0.5 rounded text-xs font-medium', colorMap[type])}>
      {labelMap[type]}
    </span>
  )
}

const CollapsedRail: FC<{
  onExpand: () => void
  artifacts: Artifact[]
}> = ({ onExpand, artifacts }) => {
  const getArtifactIcon = (type: ArtifactType) => {
    switch (type) {
      case 'reflection':
        return <Brain size={18} className="text-damasio-lens" />
      case 'pattern':
        return <GitBranch size={18} className="text-cbt-lens" />
      case 'voice-note':
        return <Mic size={18} className="text-voice-accent" />
      case 'insight':
        return <Bookmark size={18} className="text-act-lens" />
      default:
        return <FileText size={18} className="text-text-secondary" />
    }
  }

  return (
    <div className="w-[60px] h-full bg-background border-l border-border-light flex flex-col items-center py-4 gap-3">
      {/* Expand button at top */}
      <button
        onClick={onExpand}
        className="p-2 rounded-lg hover:bg-hover-surface transition-colors"
        aria-label="Expand modes panel"
      >
        <ChevronLeft size={18} className="text-text-secondary" />
      </button>

      {/* Configure modes button */}
      <button
        onClick={onExpand}
        className="p-2 rounded-lg hover:bg-hover-surface transition-colors"
        aria-label="Configure modes"
      >
        <Sparkles size={20} className="text-damasio-lens" />
      </button>

      <div className="h-px w-8 bg-border-light" />

      {/* List of artifact icons */}
      <div className="flex-1 flex flex-col items-center gap-2 overflow-y-auto custom-scrollbar">
        {artifacts.slice(0, 6).map((artifact) => (
          <button
            key={artifact.id}
            onClick={onExpand}
            className="p-2 rounded-lg hover:bg-hover-surface transition-colors"
            aria-label={`Artifact: ${artifact.title}`}
          >
            {getArtifactIcon(artifact.type)}
          </button>
        ))}
        {artifacts.length > 6 && (
          <div className="text-xs text-text-secondary font-medium">
            +{artifacts.length - 6}
          </div>
        )}
      </div>
    </div>
  )
}

export const ModesPanel: FC = () => {
  const {
    activeMode, setActiveMode, modesOpen, setModesOpen, artifacts,
    setReflectModalOpen, setRoleplayModalOpen, setPatternModalOpen, setSomaticModalOpen,
    setArtifactsModalOpen, setSelectedArtifactId
  } = useGingerStore()

  const [previewArtifactId, setPreviewArtifactId] = useState<string | null>(null)

  const handleModeClick = (modeId: ModeType) => {
    setActiveMode(modeId)
    
    // Open appropriate modal for each mode
    if (modeId === 'reflect') {
      setReflectModalOpen(true)
    } else if (modeId === 'roleplay') {
      setRoleplayModalOpen(true)
    } else if (modeId === 'patterns') {
      setPatternModalOpen(true)
    } else if (modeId === 'somatic') {
      setSomaticModalOpen(true)
    }
  }

  if (!modesOpen) {
    return (
      <CollapsedRail
        onExpand={() => setModesOpen(true)}
        artifacts={artifacts}
      />
    )
  }

  if (modesOpen && previewArtifactId) {
    const artifact = artifacts.find(a => a.id === previewArtifactId)
    if (artifact) {
      return (
        <div className="w-[320px] h-full bg-background border-l border-border-light flex flex-col panel-transition">
          <ArtifactPreview
            artifact={artifact}
            onBack={() => setPreviewArtifactId(null)}
            onExpand={() => {
              setPreviewArtifactId(null)
              setSelectedArtifactId(artifact.id)
              setArtifactsModalOpen(true)
            }}
          />
        </div>
      )
    }
  }

  return (
    <div className="w-[320px] h-full bg-background border-l border-border-light flex flex-col panel-transition">
      {/* Header */}
      <div className="h-12 border-b border-border-light flex items-center justify-between px-4 flex-shrink-0">
        <div className="flex items-center gap-2">
          <h2 className="text-sm font-medium text-text-primary">Modes</h2>
        </div>
        <button
          onClick={() => setModesOpen(false)}
          className="p-1.5 rounded-lg hover:bg-hover-surface transition-colors"
          aria-label="Collapse modes panel"
        >
          <ChevronRight size={16} className="text-text-secondary" />
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto custom-scrollbar p-4">
        {/* Modes Grid */}
        <div className="grid grid-cols-2 gap-3 mb-4">
          {MODES.map((mode) => {
            const isActive = activeMode === mode.id
            return (
              <button
                key={mode.id}
                onClick={() => handleModeClick(mode.id)}
                className={cn('mode-card', isActive && 'mode-card--active')}
              >
                <ModeIcon
                  mode={mode.id}
                  className={cn(
                    'transition-colors',
                    isActive ? 'text-text-primary' : 'text-text-secondary'
                  )}
                />
                <div className="text-center">
                  <p className={cn(
                    'font-medium text-sm',
                    isActive ? 'text-text-primary' : 'text-text-secondary'
                  )}>
                    {mode.name}
                  </p>
                  <p className="text-xs text-text-secondary">{mode.subtitle}</p>
                </div>
              </button>
            )
          })}
        </div>

        {/* Artifacts Section */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-xs font-medium text-text-secondary tracking-wide uppercase">
              Artifacts
            </h3>
            <button
              onClick={() => setArtifactsModalOpen(true)}
              className="text-xs text-text-secondary hover:text-text-primary transition-colors"
            >
              View All
            </button>
          </div>

          <div className="space-y-2">
            {artifacts.map((artifact) => {
              const getIcon = () => {
                switch (artifact.type) {
                  case 'reflection':
                    return <Brain size={18} className="text-text-secondary" />
                  case 'pattern':
                    return <GitBranch size={18} className="text-text-secondary" />
                  default:
                    return <FileText size={18} className="text-text-secondary" />
                }
              }

              const timeAgo = () => {
                const days = Math.floor((Date.now() - artifact.date.getTime()) / (1000 * 60 * 60 * 24))
                if (days === 0) return 'Today'
                return `${days}d ago`
              }

              return (
                <button
                  key={artifact.id}
                  onClick={() => setPreviewArtifactId(artifact.id)}
                  className="w-full p-3 rounded-lg border border-border-light bg-surface hover:bg-hover-surface transition-colors text-left group"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <h4 className="font-medium text-sm text-text-primary mb-1">
                        {artifact.title}
                      </h4>
                      <p className="text-xs text-text-secondary">
                        {timeAgo()}
                      </p>
                    </div>
                    <div className="flex-shrink-0">
                      {getIcon()}
                    </div>
                  </div>
                </button>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}
