'use client'

import { type FC, useState } from 'react'
import { cn } from '@/lib/utils'
import { useContactsStore } from '@/stores/useContactsStore'
import { useConsciousnessStore } from '@/stores/useConsciousnessStore'
import { useConversationStore } from '@/stores/useConversationStore'
import { GitBranch, TrendingUp, TrendingDown, Sparkles, Brain, Heart, AlertCircle, Calendar } from '@/components/ui/Icons'
import { UnifiedSearch } from '@/components/search/UnifiedSearch'

interface Pattern {
  id: string
  title: string
  description: string
  occurrences: number
  trend: 'increasing' | 'stable' | 'decreasing'
  relatedContactIds: string[]
  relatedEmotions: string[]
  somaticMarkers: string[]
}

// Mock patterns data
const mockPatterns: Pattern[] = [
  {
    id: '1',
    title: 'Defensive Response to Criticism',
    description: 'Pattern of chest tightness and defensive reactions when feeling unheard or criticized.',
    occurrences: 12,
    trend: 'stable',
    relatedContactIds: ['+1234567890'],
    relatedEmotions: ['anger', 'sadness'],
    somaticMarkers: ['chest tightness', 'tension']
  },
  {
    id: '2',
    title: 'Evening Anxiety Loop',
    description: 'Recurring anxious thoughts before bed, triggered by unresolved interactions.',
    occurrences: 8,
    trend: 'decreasing',
    relatedContactIds: ['+1234567890'],
    relatedEmotions: ['fear', 'sadness'],
    somaticMarkers: ['racing thoughts', 'restlessness']
  }
]

export const PatternDashboard: FC = () => {
  const [selectedPattern, setSelectedPattern] = useState<Pattern | null>(mockPatterns[0])
  const [timeRange, setTimeRange] = useState<'week' | 'month' | 'all'>('month')
  
  const { contacts } = useContactsStore()
  const { memories, emotionEvents } = useConsciousnessStore()
  const { messages } = useConversationStore()

  const getContactName = (id: string) => {
    const contact = contacts.find(c => c.id === id)
    return contact?.name || 'Unknown'
  }

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'increasing':
        return <TrendingUp size={16} className="text-warning" />
      case 'decreasing':
        return <TrendingDown size={16} className="text-success" />
      default:
        return <div className="w-4 h-4 rounded-full bg-text-secondary" />
    }
  }

  const getTrendColor = (trend: string) => {
    switch (trend) {
      case 'increasing':
        return 'text-warning'
      case 'decreasing':
        return 'text-success'
      default:
        return 'text-text-secondary'
    }
  }

  return (
    <div className="h-full overflow-y-auto custom-scrollbar bg-background">
      <div className="max-w-7xl mx-auto p-6 space-y-6">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <div className="w-12 h-12 rounded-xl bg-voice-accent/10 flex items-center justify-center">
                <GitBranch size={24} className="text-voice-accent" />
              </div>
              <div>
                <h1 className="text-3xl font-serif font-medium text-text-primary">
                  Pattern Analysis
                </h1>
                <p className="text-text-secondary">
                  Cross-source analysis of recurring themes and behavioral patterns
                </p>
              </div>
            </div>
          </div>

          {/* Time range selector */}
          <div className="flex items-center gap-2 bg-surface border border-border-light rounded-lg p-1">
            {(['week', 'month', 'all'] as const).map(range => (
              <button
                key={range}
                onClick={() => setTimeRange(range)}
                className={cn(
                  'px-4 py-1.5 rounded-md text-sm font-medium transition-colors',
                  timeRange === range
                    ? 'bg-voice-accent text-white'
                    : 'text-text-secondary hover:text-text-primary'
                )}
              >
                {range === 'week' ? 'Last Week' : range === 'month' ? 'Last Month' : 'All Time'}
              </button>
            ))}
          </div>
        </div>

        {/* Stats overview */}
        <div className="grid grid-cols-4 gap-4">
          <div className="bg-surface border border-border-light rounded-xl p-4">
            <div className="flex items-center gap-2 mb-2">
              <GitBranch size={16} className="text-voice-accent" />
              <span className="text-xs font-medium text-text-secondary uppercase tracking-wider">
                Patterns Found
              </span>
            </div>
            <p className="text-3xl font-medium text-text-primary">{mockPatterns.length}</p>
          </div>

          <div className="bg-surface border border-border-light rounded-xl p-4">
            <div className="flex items-center gap-2 mb-2">
              <Brain size={16} className="text-damasio-lens" />
              <span className="text-xs font-medium text-text-secondary uppercase tracking-wider">
                Memories
              </span>
            </div>
            <p className="text-3xl font-medium text-text-primary">{memories.length}</p>
          </div>

          <div className="bg-surface border border-border-light rounded-xl p-4">
            <div className="flex items-center gap-2 mb-2">
              <Heart size={16} className="text-voice-accent" />
              <span className="text-xs font-medium text-text-secondary uppercase tracking-wider">
                Emotion Events
              </span>
            </div>
            <p className="text-3xl font-medium text-text-primary">{emotionEvents.length}</p>
          </div>

          <div className="bg-surface border border-border-light rounded-xl p-4">
            <div className="flex items-center gap-2 mb-2">
              <AlertCircle size={16} className="text-warning" />
              <span className="text-xs font-medium text-text-secondary uppercase tracking-wider">
                Active Markers
              </span>
            </div>
            <p className="text-3xl font-medium text-text-primary">3</p>
          </div>
        </div>

        {/* Main content grid */}
        <div className="grid grid-cols-12 gap-6">
          {/* Pattern list */}
          <div className="col-span-4 space-y-3">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-medium text-text-primary">Identified Patterns</h3>
              <span className="text-xs text-text-secondary">
                {mockPatterns.length} patterns
              </span>
            </div>

            {mockPatterns.map(pattern => (
              <button
                key={pattern.id}
                onClick={() => setSelectedPattern(pattern)}
                className={cn(
                  'w-full text-left p-4 rounded-xl border transition-all',
                  selectedPattern?.id === pattern.id
                    ? 'border-voice-accent bg-voice-accent/5 shadow-sm'
                    : 'border-border-light bg-surface hover:border-border-medium hover:bg-hover-surface'
                )}
              >
                <div className="flex items-start justify-between gap-3 mb-2">
                  <h4 className="font-medium text-sm text-text-primary flex-1 line-clamp-2">
                    {pattern.title}
                  </h4>
                  <div className={cn('flex items-center gap-1 text-xs', getTrendColor(pattern.trend))}>
                    {getTrendIcon(pattern.trend)}
                    <span>{pattern.occurrences}x</span>
                  </div>
                </div>
                
                <p className="text-xs text-text-secondary line-clamp-2 mb-2">
                  {pattern.description}
                </p>

                <div className="flex items-center gap-2 flex-wrap">
                  {pattern.relatedContactIds.slice(0, 2).map(contactId => (
                    <span
                      key={contactId}
                      className="px-2 py-0.5 rounded-full bg-surface border border-border-light text-xs text-text-secondary"
                    >
                      {getContactName(contactId)}
                    </span>
                  ))}
                </div>
              </button>
            ))}
          </div>

          {/* Pattern details and visualization */}
          <div className="col-span-8 space-y-6">
            {selectedPattern ? (
              <>
                {/* Pattern header */}
                <div className="bg-surface border border-border-light rounded-xl p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <h2 className="text-2xl font-serif font-medium text-text-primary mb-2">
                        {selectedPattern.title}
                      </h2>
                      <p className="text-text-secondary leading-relaxed">
                        {selectedPattern.description}
                      </p>
                    </div>
                    <div className="text-right ml-4">
                      <div className="text-4xl font-medium text-text-primary mb-1">
                        {selectedPattern.occurrences}
                      </div>
                      <div className={cn('text-xs font-medium flex items-center gap-1', getTrendColor(selectedPattern.trend))}>
                        {getTrendIcon(selectedPattern.trend)}
                        <span className="capitalize">{selectedPattern.trend}</span>
                      </div>
                    </div>
                  </div>

                  {/* Pattern metadata */}
                  <div className="grid grid-cols-3 gap-4 pt-4 border-t border-border-light">
                    <div>
                      <span className="text-xs text-text-secondary uppercase tracking-wider block mb-2">
                        Related Contacts
                      </span>
                      <div className="flex flex-wrap gap-1">
                        {selectedPattern.relatedContactIds.map(contactId => (
                          <span
                            key={contactId}
                            className="px-2 py-1 rounded-lg bg-background border border-border-light text-xs text-text-primary"
                          >
                            {getContactName(contactId)}
                          </span>
                        ))}
                      </div>
                    </div>

                    <div>
                      <span className="text-xs text-text-secondary uppercase tracking-wider block mb-2">
                        Emotions
                      </span>
                      <div className="flex flex-wrap gap-1">
                        {selectedPattern.relatedEmotions.map(emotion => (
                          <span
                            key={emotion}
                            className={cn(
                              'emotion-badge',
                              `emotion-badge--${emotion}`
                            )}
                          >
                            {emotion}
                          </span>
                        ))}
                      </div>
                    </div>

                    <div>
                      <span className="text-xs text-text-secondary uppercase tracking-wider block mb-2">
                        Somatic Markers
                      </span>
                      <div className="flex flex-wrap gap-1">
                        {selectedPattern.somaticMarkers.map(marker => (
                          <span
                            key={marker}
                            className="px-2 py-1 rounded-lg bg-warning/10 text-warning text-xs"
                          >
                            {marker}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Emotional trajectory chart placeholder */}
                <div className="bg-surface border border-border-light rounded-xl p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-medium text-text-primary">
                      Emotional Trajectory
                    </h3>
                    <Calendar size={16} className="text-text-secondary" />
                  </div>
                  
                  {/* Simplified visualization */}
                  <div className="h-48 flex items-end justify-around gap-2 p-4 bg-background rounded-lg">
                    {[...Array(12)].map((_, i) => {
                      const height = Math.random() * 100 + 20
                      return (
                        <div key={i} className="flex-1 flex flex-col items-center gap-2">
                          <div
                            className="w-full bg-voice-accent/20 rounded-t hover:bg-voice-accent/40 transition-colors cursor-pointer"
                            style={{ height: `${height}%` }}
                            title={`Intensity: ${Math.round(height)}%`}
                          />
                        </div>
                      )
                    })}
                  </div>
                  <div className="flex items-center justify-between mt-2 text-xs text-text-secondary">
                    <span>1 month ago</span>
                    <span>Today</span>
                  </div>
                </div>

                {/* Related memories */}
                <div className="bg-surface border border-border-light rounded-xl p-6">
                  <div className="flex items-center gap-2 mb-4">
                    <Brain size={20} className="text-damasio-lens" />
                    <h3 className="text-lg font-medium text-text-primary">
                      Related Memories
                    </h3>
                    <span className="ml-auto px-2 py-0.5 rounded-full bg-damasio-lens/10 text-damasio-lens text-xs">
                      {memories.filter(m => selectedPattern.relatedContactIds.includes(m.relatedContactId || '')).length}
                    </span>
                  </div>
                  
                  <div className="space-y-2">
                    {memories
                      .filter(m => selectedPattern.relatedContactIds.includes(m.relatedContactId || ''))
                      .slice(0, 3)
                      .map(memory => (
                        <div
                          key={memory.id}
                          className={cn(
                            'memory-card',
                            memory.salience > 0.7 ? 'memory-card--high-salience' : 
                            memory.salience > 0.4 ? 'memory-card--medium-salience' : 
                            'memory-card--low-salience'
                          )}
                        >
                          <div className="flex items-start justify-between gap-3">
                            <p className="text-sm text-text-primary flex-1">
                              {memory.description}
                            </p>
                            <span className="text-xs text-text-secondary whitespace-nowrap">
                              {Math.round(memory.salience * 100)}% salience
                            </span>
                          </div>
                        </div>
                      ))}
                  </div>
                </div>

                {/* Insights */}
                <div className="bg-surface border border-border-light rounded-xl p-6">
                  <div className="flex items-center gap-2 mb-4">
                    <Sparkles size={20} className="text-voice-accent" />
                    <h3 className="text-lg font-medium text-text-primary">
                      Key Insights
                    </h3>
                  </div>
                  
                  <ul className="space-y-3">
                    <li className="flex items-start gap-3">
                      <div className="w-1.5 h-1.5 rounded-full bg-voice-accent flex-shrink-0 mt-2" />
                      <p className="text-sm text-text-primary">
                        This pattern activates your fight-or-flight response, creating physical tension before conscious awareness of the threat.
                      </p>
                    </li>
                    <li className="flex items-start gap-3">
                      <div className="w-1.5 h-1.5 rounded-full bg-voice-accent flex-shrink-0 mt-2" />
                      <p className="text-sm text-text-primary">
                        Body tension appears before conscious awareness, suggesting a somatic marker that has formed from repeated experiences.
                      </p>
                    </li>
                    <li className="flex items-start gap-3">
                      <div className="w-1.5 h-1.5 rounded-full bg-voice-accent flex-shrink-0 mt-2" />
                      <p className="text-sm text-text-primary">
                        May be linked to early experiences of feeling unheard, creating a protective response pattern.
                      </p>
                    </li>
                  </ul>
                </div>
              </>
            ) : (
              <div className="h-full flex items-center justify-center text-center py-20">
                <div>
                  <GitBranch size={48} className="mx-auto mb-4 text-text-secondary opacity-30" />
                  <p className="text-text-secondary">Select a pattern to view details</p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Search section */}
        <div className="bg-surface border border-border-light rounded-xl p-6">
          <h3 className="text-lg font-medium text-text-primary mb-4">
            Search Across All Content
          </h3>
          <UnifiedSearch />
        </div>
      </div>
    </div>
  )
}

