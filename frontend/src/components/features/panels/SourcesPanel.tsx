'use client'

import { type FC, useState } from 'react'
import { cn } from '@/lib/utils'
import { useGingerStore } from '@/stores/useGingerStore'
import type { Source, SourcePlatform } from '@/types'
import {
  ChevronLeft,
  ChevronRight,
  Plus,
  Search,
  Lock,
  Link,
  Check,
  FileChat,
  FileMail,
  FileText
} from '@/components/ui/Icons'

const getPlatformIcon = (platform: SourcePlatform, size = 20, className = ""): React.ReactNode => {
  const props = { size, className }
  switch (platform) {
    case 'whatsapp':
    case 'imessage':
      return <FileChat {...props} />
    case 'email':
      return <FileMail {...props} />
    case 'journal':
      return <FileText {...props} />
    default:
      return <FileText {...props} />
  }
}

const SourceItem: FC<{
  source: Source
  isSelected: boolean
  onToggle: () => void
}> = ({ source, isSelected, onToggle }) => {
  return (
    <button
      className={cn(
        'w-full p-3 rounded-xl border bg-surface transition-all duration-200 text-left group',
        'hover:shadow-card hover:-translate-y-0.5',
        isSelected
          ? 'border-text-primary ring-2 ring-text-primary/10'
          : 'border-border-light'
      )}
      onClick={onToggle}
    >
      <div className="flex items-start gap-3">
        {/* Checkbox */}
        <div
          className={cn(
            'w-5 h-5 rounded border-2 flex items-center justify-center flex-shrink-0 mt-0.5 transition-colors',
            isSelected
              ? 'bg-voice-accent border-voice-accent'
              : 'border-border-medium bg-surface'
          )}
        >
          {isSelected && <Check size={12} className="text-white" />}
        </div>

        {/* Source Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2 mb-1">
            <span className="font-medium text-sm text-text-primary">{source.name}</span>
            {getPlatformIcon(source.platform, 20, "text-text-secondary group-hover:text-text-primary transition-colors opacity-70")}
          </div>
          <p className="text-xs text-text-secondary truncate pr-6">
            {source.previewText}
          </p>
          <div className="flex items-center gap-2 mt-1.5">
            {source.messageCount && (
              <span className="text-xs text-text-secondary">{source.messageCount} msgs</span>
            )}
            {source.entryCount && (
              <span className="text-xs text-text-secondary">{source.entryCount} entries</span>
            )}
            {source.isSyncing && (
              <span className="text-xs text-text-secondary animate-pulse">Syncing...</span>
            )}
          </div>
        </div>
      </div>
    </button>
  )
}

const CollapsedRail: FC<{
  onExpand: () => void
  sources: Source[]
}> = ({ onExpand, sources }) => {
  return (
    <div className="w-[60px] h-full bg-background border-r border-border-light flex flex-col items-center py-4 gap-3">
      {/* Expand button at top */}
      <button
        onClick={onExpand}
        className="p-2 rounded-lg hover:bg-hover-surface transition-colors"
        aria-label="Expand sources panel"
      >
        <ChevronRight size={18} className="text-text-secondary" />
      </button>

      {/* Add source button */}
      <button
        onClick={onExpand}
        className="p-2 rounded-lg hover:bg-hover-surface transition-colors"
        aria-label="Add source"
      >
        <Plus size={20} className="text-voice-accent" />
      </button>

      <div className="h-px w-8 bg-border-light" />

      {/* List of source icons */}
      <div className="flex-1 flex flex-col items-center gap-2 overflow-y-auto custom-scrollbar">
        {sources.slice(0, 6).map((source) => (
          <button
            key={source.id}
            onClick={onExpand}
            className="p-2 rounded-lg hover:bg-hover-surface transition-colors relative"
            aria-label={`Source: ${source.name}`}
          >
            {getPlatformIcon(source.platform, 20, "text-text-secondary hover:text-text-primary transition-colors")}
            {source.isSyncing && (
              <span className="absolute top-0 right-0 w-2 h-2 bg-warning rounded-full" />
            )}
          </button>
        ))}
        {sources.length > 6 && (
          <div className="text-xs text-text-secondary font-medium">
            +{sources.length - 6}
          </div>
        )}
      </div>
    </div>
  )
}

export const SourcesPanel: FC = () => {
  const {
    sources,
    selectedSourceIds,
    sourcesExpanded,
    toggleSource,
    setSourcesExpanded
  } = useGingerStore()
  
  const [searchQuery, setSearchQuery] = useState('')
  const [urlInput, setUrlInput] = useState('')

  const handleAddSource = (e: React.FormEvent) => {
    e.preventDefault()
    if (!urlInput.trim()) return
    
    console.log('Adding source with URL:', urlInput)
    // TODO: Implement actual source addition logic
    setUrlInput('')
  }

  if (!sourcesExpanded) {
    return (
      <CollapsedRail
        onExpand={() => setSourcesExpanded(true)}
        sources={sources}
      />
    )
  }

  return (
    <div className="w-[280px] h-full bg-background border-r border-border-light flex flex-col panel-transition">
      {/* Header */}
      <div className="h-12 border-b border-border-light flex items-center justify-between px-4 flex-shrink-0">
        <div className="flex items-center gap-2">
          <h2 className="text-sm font-medium text-text-primary">Sources</h2>
        </div>
        <button
          onClick={() => setSourcesExpanded(false)}
          className="p-1.5 rounded-lg hover:bg-hover-surface transition-colors"
          aria-label="Collapse sources panel"
        >
          <ChevronLeft size={16} className="text-text-secondary" />
        </button>
      </div>

      {/* Search Bar */}
      <div className="px-4 pt-4 pb-2">
        <div className="flex items-center gap-2 px-3 py-1.5 bg-surface rounded-lg border border-border-light transition-colors hover:border-border-medium">
          <Search size={14} className="text-text-secondary flex-shrink-0" />
          <input
            type="text"
            placeholder="Search sources..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="flex-1 bg-transparent text-sm text-text-primary placeholder:text-text-secondary outline-none"
          />
        </div>
      </div>

      {/* Add Source Input */}
      <div className="px-4 pb-4">
        <form onSubmit={handleAddSource}>
          <div className="flex items-center gap-2 px-3 py-2 bg-surface border border-border-light hover:border-voice-accent/50 focus-within:border-voice-accent rounded-lg transition-all">
            <Link size={16} className="text-voice-accent flex-shrink-0" />
            <input
              type="url"
              placeholder="Add source URL..."
              value={urlInput}
              onChange={(e) => setUrlInput(e.target.value)}
              className="flex-1 bg-transparent text-sm text-text-primary placeholder:text-text-secondary outline-none"
            />
            {urlInput && (
              <button
                type="submit"
                className="p-1 rounded-md bg-voice-accent text-white hover:bg-voice-accent/90 transition-colors flex-shrink-0"
                aria-label="Add source"
              >
                <Plus size={14} />
              </button>
            )}
          </div>
        </form>
      </div>

      {/* Select All */}
      <div className="px-4 py-2 border-b border-border-light bg-surface/30">
        <button
          className="flex items-center gap-2 text-xs font-medium text-text-secondary hover:text-text-primary transition-colors w-full"
          onClick={() => {
            // Toggle select all
            if (selectedSourceIds.length === sources.length) {
              sources.forEach(s => toggleSource(s.id))
            } else {
              sources.forEach(s => {
                if (!selectedSourceIds.includes(s.id)) {
                  toggleSource(s.id)
                }
              })
            }
          }}
        >
          <div
            className={cn(
              'w-4 h-4 rounded border-2 flex items-center justify-center flex-shrink-0 transition-colors',
              selectedSourceIds.length === sources.length
                ? 'bg-voice-accent border-voice-accent'
                : 'border-border-medium bg-surface'
            )}
          >
            {selectedSourceIds.length === sources.length && <Check size={10} className="text-white" />}
          </div>
          <span>Select All Sources</span>
        </button>
      </div>

      {/* Source List */}
      <div className="flex-1 overflow-y-auto custom-scrollbar p-4 space-y-2">
        {sources
          .filter(source =>
            searchQuery === '' ||
            source.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            source.previewText.toLowerCase().includes(searchQuery.toLowerCase()) ||
            source.platform.toLowerCase().includes(searchQuery.toLowerCase())
          )
          .map((source) => (
            <SourceItem
              key={source.id}
              source={source}
              isSelected={selectedSourceIds.includes(source.id)}
              onToggle={() => toggleSource(source.id)}
            />
          ))}
        {searchQuery && sources.filter(s =>
          s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          s.previewText.toLowerCase().includes(searchQuery.toLowerCase())
        ).length === 0 && (
          <div className="text-center py-8 text-text-secondary text-sm">
            No sources match "{searchQuery}"
          </div>
        )}
      </div>

      {/* Privacy Footer */}
      <div className="flex items-center gap-2 px-4 py-3 border-t border-border-light">
        <Lock size={14} className="text-text-secondary" />
        <span className="text-xs text-text-secondary">Encrypted • Local storage</span>
      </div>
    </div>
  )
}
