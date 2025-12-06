'use client'

import { type FC, useState } from 'react'
import { Modal } from '@/components/ui/Modal'
import { useGingerStore } from '@/stores/useGingerStore'
import { cn } from '@/lib/utils'
import type { ArtifactType, Artifact } from '@/types'
import { Brain, GitBranch, Mic, Bookmark, FileText, Search, X, Trash2 } from '@/components/ui/Icons'

const ArtifactIcon: FC<{ type: ArtifactType; className?: string }> = ({ type, className }) => {
  const iconProps = { size: 20, className }
  switch (type) {
    case 'reflection':
      return <Brain {...iconProps} />
    case 'pattern':
      return <GitBranch {...iconProps} />
    case 'voice-note':
      return <Mic {...iconProps} />
    case 'insight':
      return <Bookmark {...iconProps} />
    default:
      return <FileText {...iconProps} />
  }
}

const ArtifactTypeBadge: FC<{ type: ArtifactType }> = ({ type }) => {
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

const FILTER_OPTIONS: { id: ArtifactType | 'all'; label: string }[] = [
  { id: 'all', label: 'All' },
  { id: 'reflection', label: 'Reflections' },
  { id: 'pattern', label: 'Patterns' },
  { id: 'insight', label: 'Insights' },
  { id: 'voice-note', label: 'Voice Notes' }
]

export const ArtifactsModal: FC = () => {
  const { artifactsModalOpen, setArtifactsModalOpen, artifacts, deleteArtifact, selectedArtifactId, setSelectedArtifactId } = useGingerStore()
  const [searchQuery, setSearchQuery] = useState('')
  const [filterType, setFilterType] = useState<ArtifactType | 'all'>('all')
  
  const selectedArtifact = artifacts.find(a => a.id === selectedArtifactId) || null

  const handleClose = () => {
    setArtifactsModalOpen(false)
    setSelectedArtifactId(null)
    setSearchQuery('')
    setFilterType('all')
  }

  const filteredArtifacts = artifacts.filter(artifact => {
    const matchesSearch = artifact.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      artifact.description.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesType = filterType === 'all' || artifact.type === filterType
    return matchesSearch && matchesType
  })

  const formatDate = (date: Date) => {
    const now = new Date()
    const diffDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24))

    if (diffDays === 0) return 'Today'
    if (diffDays === 1) return 'Yesterday'
    if (diffDays < 7) return `${diffDays} days ago`

    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined
    })
  }

  const handleDelete = (id: string) => {
    deleteArtifact(id)
    if (selectedArtifact?.id === id) {
      setSelectedArtifactId(null)
    }
  }

  return (
    <Modal
      isOpen={artifactsModalOpen}
      onClose={handleClose}
      title="Your Artifacts"
      size="xl"
    >
      <div className="flex h-[600px]">
        {/* Left Panel - List */}
        <div className="w-1/2 border-r border-border-light flex flex-col">
          {/* Search and Filter */}
          <div className="p-4 border-b border-border-light space-y-3">
            <div className="flex items-center gap-2 px-3 py-2 bg-surface rounded-lg border border-border-light">
              <Search size={16} className="text-text-secondary flex-shrink-0" />
              <input
                type="text"
                placeholder="Search artifacts..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="flex-1 bg-transparent text-sm text-text-primary placeholder:text-text-secondary outline-none"
              />
              {searchQuery && (
                <button onClick={() => setSearchQuery('')} className="text-text-secondary hover:text-text-primary">
                  <X size={14} />
                </button>
              )}
            </div>
            <div className="flex items-center gap-2 overflow-x-auto">
              {FILTER_OPTIONS.map(option => (
                <button
                  key={option.id}
                  onClick={() => setFilterType(option.id)}
                  className={cn(
                    'px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-colors',
                    filterType === option.id
                      ? 'bg-voice-accent text-white'
                      : 'bg-surface text-text-secondary hover:text-text-primary'
                  )}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>

          {/* Artifacts List */}
          <div className="flex-1 overflow-y-auto custom-scrollbar p-2">
            {filteredArtifacts.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-center p-4">
                <div className="w-16 h-16 rounded-full bg-surface flex items-center justify-center mb-4">
                  <FileText size={24} className="text-text-secondary" />
                </div>
                <p className="text-text-secondary">No artifacts found</p>
                <p className="text-xs text-text-secondary mt-1">
                  {searchQuery ? 'Try a different search term' : 'Save insights from your conversations'}
                </p>
              </div>
            ) : (
              <div className="space-y-1">
                {filteredArtifacts.map(artifact => (
                  <button
                    key={artifact.id}
                    onClick={() => setSelectedArtifactId(artifact.id)}
                    className={cn(
                      'w-full p-3 rounded-lg text-left transition-all',
                      selectedArtifact?.id === artifact.id
                        ? 'bg-voice-accent/10 border border-voice-accent/30'
                        : 'hover:bg-surface border border-transparent'
                    )}
                  >
                    <div className="flex items-start gap-3">
                      <div className={cn(
                        'w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0',
                        artifact.type === 'reflection' && 'bg-damasio-lens/10',
                        artifact.type === 'pattern' && 'bg-cbt-lens/10',
                        artifact.type === 'voice-note' && 'bg-voice-accent/10',
                        artifact.type === 'insight' && 'bg-act-lens/10',
                        artifact.type === 'export' && 'bg-text-secondary/10'
                      )}>
                        <ArtifactIcon
                          type={artifact.type}
                          className={cn(
                            artifact.type === 'reflection' && 'text-damasio-lens',
                            artifact.type === 'pattern' && 'text-cbt-lens',
                            artifact.type === 'voice-note' && 'text-voice-accent',
                            artifact.type === 'insight' && 'text-act-lens',
                            artifact.type === 'export' && 'text-text-secondary'
                          )}
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="font-medium text-sm text-text-primary truncate">
                          {artifact.title}
                        </h4>
                        <p className="text-xs text-text-secondary mt-0.5">
                          {formatDate(artifact.date)}
                        </p>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Stats Footer */}
          <div className="p-3 border-t border-border-light">
            <p className="text-xs text-text-secondary text-center">
              {artifacts.length} artifact{artifacts.length !== 1 ? 's' : ''} saved
            </p>
          </div>
        </div>

        {/* Right Panel - Detail */}
        <div className="w-1/2 flex flex-col">
          {selectedArtifact ? (
            <>
              {/* Detail Header */}
              <div className="p-4 border-b border-border-light">
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-3">
                    <div className={cn(
                      'w-12 h-12 rounded-xl flex items-center justify-center',
                      selectedArtifact.type === 'reflection' && 'bg-damasio-lens/10',
                      selectedArtifact.type === 'pattern' && 'bg-cbt-lens/10',
                      selectedArtifact.type === 'voice-note' && 'bg-voice-accent/10',
                      selectedArtifact.type === 'insight' && 'bg-act-lens/10',
                      selectedArtifact.type === 'export' && 'bg-text-secondary/10'
                    )}>
                      <ArtifactIcon
                        type={selectedArtifact.type}
                        className={cn(
                          selectedArtifact.type === 'reflection' && 'text-damasio-lens',
                          selectedArtifact.type === 'pattern' && 'text-cbt-lens',
                          selectedArtifact.type === 'voice-note' && 'text-voice-accent',
                          selectedArtifact.type === 'insight' && 'text-act-lens',
                          selectedArtifact.type === 'export' && 'text-text-secondary'
                        )}
                      />
                    </div>
                    <div>
                      <h3 className="font-serif text-xl font-medium text-text-primary">
                        {selectedArtifact.title}
                      </h3>
                      <div className="flex items-center gap-2 mt-1">
                        <ArtifactTypeBadge type={selectedArtifact.type} />
                        <span className="text-xs text-text-secondary">
                          {formatDate(selectedArtifact.date)}
                        </span>
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={() => handleDelete(selectedArtifact.id)}
                    className="p-2 rounded-lg text-text-secondary hover:text-error hover:bg-error/10 transition-colors"
                    aria-label="Delete artifact"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              </div>

              {/* Detail Content */}
              <div className="flex-1 overflow-y-auto custom-scrollbar p-4">
                <div className="prose prose-sm max-w-none">
                  <p className="text-text-primary leading-relaxed">
                    {selectedArtifact.description}
                  </p>
                </div>

                {/* Related Context */}
                <div className="mt-6 p-4 rounded-xl bg-surface">
                  <h4 className="text-xs font-medium text-text-secondary uppercase tracking-wider mb-3">
                    Context
                  </h4>
                  <p className="text-sm text-text-secondary">
                    This artifact was created during a reflection session using the Damasio lens framework.
                  </p>
                </div>
              </div>

              {/* Actions Footer */}
              <div className="p-4 border-t border-border-light">
                <div className="flex items-center gap-2">
                  <button className="flex-1 px-4 py-2 rounded-lg text-sm font-medium bg-surface text-text-primary hover:bg-hover-surface transition-colors">
                    Export
                  </button>
                  <button className="flex-1 px-4 py-2 rounded-lg text-sm font-medium bg-voice-accent text-white hover:bg-voice-accent/90 transition-colors">
                    Continue Reflecting
                  </button>
                </div>
              </div>
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-center p-8">
              <div className="w-20 h-20 rounded-full bg-surface flex items-center justify-center mb-4">
                <Bookmark size={32} className="text-text-secondary" />
              </div>
              <h3 className="font-medium text-text-primary mb-2">Select an artifact</h3>
              <p className="text-sm text-text-secondary max-w-xs">
                Choose an artifact from the list to view its details and continue your reflection
              </p>
            </div>
          )}
        </div>
      </div>
    </Modal>
  )
}
