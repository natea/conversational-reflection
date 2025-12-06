'use client'

import { type FC, useState, useEffect } from 'react'
import { Modal } from '@/components/ui/Modal'
import { useGingerStore } from '@/stores/useGingerStore'
import { cn } from '@/lib/utils'
import { GitBranch, TrendingDown, TrendingUp, ChevronRight, Check, Sparkles, Brain, Activity } from '@/components/ui/Icons'

interface Pattern {
  id: string
  title: string
  description: string
  occurrences: number
  trend: 'stable' | 'increasing' | 'decreasing'
  lens: 'damasio' | 'cbt' | 'ifs' | 'act' | 'stoic'
  insights: string[]
  sources: string[]
}

const MOCK_PATTERNS: Pattern[] = [
  {
    id: '1',
    title: 'Defensive Response to Criticism',
    description: 'Pattern of chest tightness and defensive reactions when feeling unheard or criticized.',
    occurrences: 12,
    trend: 'stable',
    lens: 'damasio',
    insights: [
      'This pattern activates your fight-or-flight response',
      'Body tension appears before conscious awareness of threat',
      'May be linked to early experiences of feeling unheard'
    ],
    sources: ['Sarah (WhatsApp)', 'Journal']
  },
  {
    id: '2',
    title: 'Evening Anxiety Loop',
    description: 'Recurring anxious thoughts before bed, triggered by unresolved interactions.',
    occurrences: 8,
    trend: 'decreasing',
    lens: 'cbt',
    insights: [
      'Cognitive distortion: catastrophizing about outcomes',
      'Mind-reading pattern: assuming negative intent',
      'Improvement since starting journaling practice'
    ],
    sources: ['Journal']
  },
  {
    id: '3',
    title: 'Work Boundary Struggles',
    description: 'Difficulty saying no to additional requests, leading to overwhelm.',
    occurrences: 6,
    trend: 'increasing',
    lens: 'ifs',
    insights: [
      'People-pleaser part trying to maintain safety through approval',
      'Inner critic activates when considering saying no',
      'Core belief: "My worth depends on being helpful"'
    ],
    sources: ['Work (Email)', 'Journal']
  }
]

const EMOTIONAL_THEMES = [
  { name: 'Anxiety', count: 24, color: 'bg-damasio-lens', description: 'Worry about future outcomes' },
  { name: 'Defensiveness', count: 18, color: 'bg-cbt-lens', description: 'Protective reactions to perceived criticism' },
  { name: 'Overwhelm', count: 15, color: 'bg-ifs-lens', description: 'Feeling unable to cope with demands' },
  { name: 'Frustration', count: 12, color: 'bg-voice-accent', description: 'Blocked goals or unmet needs' }
]

const LENS_INFO = {
  damasio: { name: 'Damasio', color: 'damasio-lens', icon: Activity },
  cbt: { name: 'CBT', color: 'cbt-lens', icon: Brain },
  ifs: { name: 'IFS', color: 'ifs-lens', icon: Sparkles },
  act: { name: 'ACT', color: 'act-lens', icon: GitBranch },
  stoic: { name: 'Stoic', color: 'stoic-lens', icon: Brain }
}

// Helper to get static lens classes (Tailwind needs static classes)
const getLensClasses = (color: string) => {
  const classes: Record<string, { bg: string; text: string; bgLight: string }> = {
    'damasio-lens': { bg: 'bg-damasio-lens', text: 'text-damasio-lens', bgLight: 'bg-damasio-lens/10' },
    'cbt-lens': { bg: 'bg-cbt-lens', text: 'text-cbt-lens', bgLight: 'bg-cbt-lens/10' },
    'ifs-lens': { bg: 'bg-ifs-lens', text: 'text-ifs-lens', bgLight: 'bg-ifs-lens/10' },
    'act-lens': { bg: 'bg-act-lens', text: 'text-act-lens', bgLight: 'bg-act-lens/10' },
    'stoic-lens': { bg: 'bg-stoic-lens', text: 'text-stoic-lens', bgLight: 'bg-stoic-lens/10' },
  }
  return classes[color] || { bg: 'bg-text-secondary', text: 'text-text-secondary', bgLight: 'bg-surface' }
}

export const PatternAnalysisModal: FC = () => {
  const { patternModalOpen, setPatternModalOpen, addArtifact, selectedSourceIds, sources } = useGingerStore()
  const [isAnalyzing, setIsAnalyzing] = useState(true)
  const [selectedPattern, setSelectedPattern] = useState<Pattern | null>(null)
  const [analysisStep, setAnalysisStep] = useState(0)

  const selectedSourceNames = sources
    .filter(s => selectedSourceIds.includes(s.id))
    .map(s => s.name)

  useEffect(() => {
    if (patternModalOpen) {
      setIsAnalyzing(true)
      setAnalysisStep(0)

      // Progressive analysis steps
      const steps = [
        setTimeout(() => setAnalysisStep(1), 500),
        setTimeout(() => setAnalysisStep(2), 1200),
        setTimeout(() => setAnalysisStep(3), 1800),
        setTimeout(() => {
          setIsAnalyzing(false)
          setSelectedPattern(MOCK_PATTERNS[0])
        }, 2500)
      ]

      return () => steps.forEach(clearTimeout)
    }
  }, [patternModalOpen])

  const handleClose = () => {
    setPatternModalOpen(false)
    setTimeout(() => {
      setIsAnalyzing(true)
      setSelectedPattern(null)
      setAnalysisStep(0)
    }, 300)
  }

  const handleSave = () => {
    addArtifact({
      type: 'pattern',
      title: `Pattern Analysis: ${new Date().toLocaleDateString()}`,
      description: `Identified ${MOCK_PATTERNS.length} patterns across ${selectedSourceNames.join(', ')}`,
      date: new Date()
    })
    handleClose()
  }

  const analysisSteps = [
    'Scanning conversation sources...',
    'Identifying emotional markers...',
    'Analyzing recurring patterns...',
    'Generating insights...'
  ]

  return (
    <Modal
      isOpen={patternModalOpen}
      onClose={handleClose}
      size="xl"
    >
      {isAnalyzing ? (
        <div className="flex flex-col items-center justify-center py-20 px-8">
          <div className="relative mb-8">
            <GitBranch size={56} className="text-voice-accent animate-pulse" />
            <div className="absolute inset-0 animate-ping">
              <GitBranch size={56} className="text-voice-accent/30" />
            </div>
          </div>
          <h3 className="font-serif text-2xl font-medium text-text-primary mb-2">
            Analyzing Patterns
          </h3>
          <p className="text-text-secondary text-center max-w-md mb-8">
            Reviewing your conversations from {selectedSourceNames.join(' & ') || 'selected sources'}
          </p>

          {/* Analysis Steps */}
          <div className="space-y-3 w-full max-w-sm">
            {analysisSteps.map((step, index) => (
              <div
                key={index}
                className={cn(
                  'flex items-center gap-3 px-4 py-2 rounded-lg transition-all duration-300',
                  analysisStep > index
                    ? 'bg-success/10 text-success'
                    : analysisStep === index
                      ? 'bg-voice-accent/10 text-voice-accent'
                      : 'text-text-secondary'
                )}
              >
                <div className={cn(
                  'w-5 h-5 rounded-full flex items-center justify-center text-xs transition-all',
                  analysisStep > index
                    ? 'bg-success text-white'
                    : analysisStep === index
                      ? 'bg-voice-accent text-white animate-pulse'
                      : 'bg-border-light'
                )}>
                  {analysisStep > index ? <Check size={12} /> : index + 1}
                </div>
                <span className="text-sm">{step}</span>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="p-6">
          {/* Header */}
          <div className="mb-6">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-12 h-12 rounded-xl bg-voice-accent/10 flex items-center justify-center">
                <GitBranch size={24} className="text-voice-accent" />
              </div>
              <div>
                <h2 className="font-serif text-2xl font-medium text-text-primary">
                  Pattern Analysis
                </h2>
                <p className="text-sm text-text-secondary">
                  {MOCK_PATTERNS.length} patterns found across {selectedSourceNames.join(', ')}
                </p>
              </div>
            </div>
          </div>

          {/* Content */}
          <div className="grid grid-cols-12 gap-4 mb-6">
            {/* Pattern List */}
            <div className="col-span-4 space-y-2">
              <h3 className="text-xs font-medium text-text-secondary uppercase tracking-wider mb-3">
                Identified Patterns
              </h3>
              {MOCK_PATTERNS.map((pattern) => {
                const lensInfo = LENS_INFO[pattern.lens]
                return (
                  <button
                    key={pattern.id}
                    onClick={() => setSelectedPattern(pattern)}
                    className={cn(
                      'w-full text-left p-3 rounded-xl border transition-all',
                      selectedPattern?.id === pattern.id
                        ? 'border-voice-accent bg-voice-accent/5 shadow-sm'
                        : 'border-border-light hover:border-border-medium bg-surface hover:bg-hover-surface'
                    )}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <h4 className="font-medium text-sm text-text-primary line-clamp-2">
                        {pattern.title}
                      </h4>
                      <ChevronRight size={16} className={cn(
                        'flex-shrink-0 transition-transform',
                        selectedPattern?.id === pattern.id ? 'text-voice-accent rotate-90' : 'text-text-secondary'
                      )} />
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={cn(
                        'px-1.5 py-0.5 rounded text-xs',
                        getLensClasses(lensInfo.color).bgLight,
                        getLensClasses(lensInfo.color).text
                      )}>
                        {lensInfo.name}
                      </span>
                      <span className={cn(
                        'inline-flex items-center gap-1 text-xs',
                        pattern.trend === 'decreasing' && 'text-success',
                        pattern.trend === 'increasing' && 'text-warning',
                        pattern.trend === 'stable' && 'text-text-secondary'
                      )}>
                        {pattern.trend === 'decreasing' && <TrendingDown size={10} />}
                        {pattern.trend === 'increasing' && <TrendingUp size={10} />}
                        {pattern.occurrences}x
                      </span>
                    </div>
                  </button>
                )
              })}
            </div>

            {/* Pattern Detail */}
            <div className="col-span-5">
              {selectedPattern && (
                <div className="bg-surface rounded-xl border border-border-light p-5 h-full">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h3 className="font-serif text-lg font-medium text-text-primary mb-1">
                        {selectedPattern.title}
                      </h3>
                      <div className="flex items-center gap-2">
                        <span className={cn(
                          'px-2 py-0.5 rounded text-xs font-medium',
                          getLensClasses(LENS_INFO[selectedPattern.lens].color).bgLight,
                          getLensClasses(LENS_INFO[selectedPattern.lens].color).text
                        )}>
                          {LENS_INFO[selectedPattern.lens].name} Lens
                        </span>
                        <span className={cn(
                          'inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded',
                          selectedPattern.trend === 'decreasing' && 'text-success bg-success/10',
                          selectedPattern.trend === 'increasing' && 'text-warning bg-warning/10',
                          selectedPattern.trend === 'stable' && 'text-text-secondary bg-border-light'
                        )}>
                          {selectedPattern.trend === 'decreasing' && <TrendingDown size={10} />}
                          {selectedPattern.trend === 'increasing' && <TrendingUp size={10} />}
                          {selectedPattern.trend.charAt(0).toUpperCase() + selectedPattern.trend.slice(1)}
                        </span>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="text-2xl font-medium text-text-primary">{selectedPattern.occurrences}</span>
                      <p className="text-xs text-text-secondary">occurrences</p>
                    </div>
                  </div>

                  <p className="text-sm text-text-secondary mb-4 leading-relaxed">
                    {selectedPattern.description}
                  </p>

                  <div className="mb-4">
                    <h4 className="text-xs font-medium text-text-secondary uppercase tracking-wider mb-2">
                      Key Insights
                    </h4>
                    <ul className="space-y-2">
                      {selectedPattern.insights.map((insight, i) => (
                        <li key={i} className="flex items-start gap-2 text-sm text-text-primary">
                          <Sparkles size={14} className="text-voice-accent flex-shrink-0 mt-0.5" />
                          {insight}
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div>
                    <h4 className="text-xs font-medium text-text-secondary uppercase tracking-wider mb-2">
                      Found In
                    </h4>
                    <div className="flex flex-wrap gap-2">
                      {selectedPattern.sources.map((source, i) => (
                        <span key={i} className="px-2 py-1 rounded-lg bg-surface border border-border-light text-xs text-text-secondary">
                          {source}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Emotional Themes */}
            <div className="col-span-3">
              <h3 className="text-xs font-medium text-text-secondary uppercase tracking-wider mb-3">
                Emotional Themes
              </h3>
              <div className="bg-surface rounded-xl border border-border-light p-4 space-y-4">
                {EMOTIONAL_THEMES.map((theme) => {
                  const maxCount = EMOTIONAL_THEMES[0].count
                  const percentage = (theme.count / maxCount) * 100
                  return (
                    <div key={theme.name} className="group cursor-default">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs font-medium text-text-primary">{theme.name}</span>
                        <span className="text-xs text-text-secondary">{theme.count}</span>
                      </div>
                      <div className="h-2 bg-border-light rounded-full overflow-hidden mb-1">
                        <div
                          className={cn('h-full rounded-full transition-all duration-500', theme.color)}
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                      <p className="text-xs text-text-secondary opacity-0 group-hover:opacity-100 transition-opacity">
                        {theme.description}
                      </p>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-between pt-4 border-t border-border-light">
            <button
              onClick={handleClose}
              className="px-6 py-2.5 rounded-lg text-sm font-medium text-text-secondary hover:text-text-primary hover:bg-hover-surface transition-all"
            >
              Close
            </button>
            <button
              onClick={handleSave}
              className="px-6 py-2.5 rounded-lg text-sm font-medium bg-voice-accent text-white hover:bg-voice-accent/90 transition-all shadow-sm hover:shadow-md flex items-center gap-2"
            >
              <Check size={16} />
              Save as Artifact
            </button>
          </div>
        </div>
      )}
    </Modal>
  )
}
