'use client'

import { type FC, useState, useEffect } from 'react'
import { Modal } from '@/components/ui/Modal'
import { useGingerStore } from '@/stores/useGingerStore'
import { cn } from '@/lib/utils'
import { Brain, Check, Sparkles, ChevronRight, MessageCircle } from '@/components/ui/Icons'

const QUICK_PROMPTS = [
  'A difficult conversation',
  'Recurring anxiety',
  'Relationship pattern',
  'Emotional reaction',
  'Decision I\'m facing',
  'Something that hurt me'
]

const SUGGESTED_THEMES = [
  { id: 'emotional', label: 'Emotional awareness', description: 'Notice what you\'re feeling' },
  { id: 'patterns', label: 'Pattern recognition', description: 'Identify recurring themes' },
  { id: 'somatic', label: 'Body sensations', description: 'Connect to physical feelings' },
  { id: 'relationships', label: 'Relationship dynamics', description: 'Explore interpersonal patterns' },
  { id: 'values', label: 'Values alignment', description: 'Check in with what matters' }
]

export const ReflectModal: FC = () => {
  const { 
    reflectModalOpen, 
    setReflectModalOpen, 
    addMessageWithResponse,
    sources,
    selectedSourceIds,
    toggleSource
  } = useGingerStore()
  
  const [step, setStep] = useState(1)
  const [intention, setIntention] = useState('')
  const [selectedPrompt, setSelectedPrompt] = useState<string | null>(null)
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [analysisStep, setAnalysisStep] = useState(0)
  const [selectedThemes, setSelectedThemes] = useState<string[]>([])

  const selectedSources = sources.filter(s => selectedSourceIds.includes(s.id))

  // Reset state when modal closes
  useEffect(() => {
    if (!reflectModalOpen) {
      setTimeout(() => {
        setStep(1)
        setIntention('')
        setSelectedPrompt(null)
        setIsAnalyzing(false)
        setAnalysisStep(0)
        setSelectedThemes([])
      }, 300)
    }
  }, [reflectModalOpen])

  // Analysis animation
  useEffect(() => {
    if (isAnalyzing && step === 2) {
      const steps = [
        setTimeout(() => setAnalysisStep(1), 400),
        setTimeout(() => setAnalysisStep(2), 1000),
        setTimeout(() => setAnalysisStep(3), 1600),
        setTimeout(() => {
          setIsAnalyzing(false)
          setStep(3)
          // Auto-select first two themes
          setSelectedThemes([SUGGESTED_THEMES[0].id, SUGGESTED_THEMES[2].id])
        }, 2200)
      ]
      return () => steps.forEach(clearTimeout)
    }
  }, [isAnalyzing, step])

  const handleClose = () => {
    setReflectModalOpen(false)
  }

  const handlePromptSelect = (prompt: string) => {
    setSelectedPrompt(prompt)
    setIntention(`I want to reflect on ${prompt.toLowerCase()}.`)
  }

  const handleContinue = () => {
    setStep(2)
    setIsAnalyzing(true)
  }

  const handleStartReflection = () => {
    // Post the intention to chat
    const contextNote = selectedSources.length > 0 
      ? ` (Context: ${selectedSources.map(s => s.name).join(', ')})`
      : ''
    
    const themesNote = selectedThemes.length > 0
      ? ` I'd like to focus on ${selectedThemes.map(id => SUGGESTED_THEMES.find(t => t.id === id)?.label.toLowerCase()).join(' and ')}.`
      : ''

    addMessageWithResponse({
      role: 'user',
      content: intention + themesNote + contextNote
    })
    
    handleClose()
  }

  const toggleTheme = (themeId: string) => {
    setSelectedThemes(prev => 
      prev.includes(themeId) 
        ? prev.filter(id => id !== themeId)
        : [...prev, themeId]
    )
  }

  const canProceedStep1 = intention.trim().length > 10
  const analysisSteps = [
    'Reviewing your intention...',
    `Analyzing context from ${selectedSources.map(s => s.name).join(' & ') || 'sources'}...`,
    'Identifying relevant themes...',
    'Preparing reflection space...'
  ]

  return (
    <Modal
      isOpen={reflectModalOpen}
      onClose={handleClose}
      size="lg"
    >
      <div className="p-6">
        {/* Step 1: Intention & Context */}
        {step === 1 && (
          <div className="animate-slide-up">
            <div className="text-center mb-6">
              <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-damasio-lens/10 mb-4">
                <Brain size={28} className="text-damasio-lens" />
              </div>
              <h2 className="font-serif text-2xl font-medium text-text-primary mb-2">
                Start a Reflection
              </h2>
              <p className="text-text-secondary text-sm">
                What's on your mind? Set an intention for this session.
              </p>
            </div>

            {/* Quick Prompts */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-text-primary mb-2">
                Quick Prompts
              </label>
              <div className="grid grid-cols-2 gap-2">
                {QUICK_PROMPTS.map((prompt) => (
                  <button
                    key={prompt}
                    onClick={() => handlePromptSelect(prompt)}
                    className={cn(
                      'px-4 py-2.5 rounded-lg border text-sm transition-all text-left',
                      selectedPrompt === prompt
                        ? 'border-damasio-lens bg-damasio-lens/10 text-damasio-lens font-medium'
                        : 'border-border-light hover:border-border-medium text-text-secondary hover:text-text-primary'
                    )}
                  >
                    {prompt}
                  </button>
                ))}
              </div>
            </div>

            {/* Intention Input */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-text-primary mb-2">
                What would you like to explore?
              </label>
              <textarea
                value={intention}
                onChange={(e) => setIntention(e.target.value)}
                placeholder="I want to reflect on..."
                className="w-full h-28 px-4 py-3 rounded-lg border border-border-light bg-surface text-text-primary placeholder:text-text-secondary focus:outline-none focus:ring-2 focus:ring-damasio-lens/20 focus:border-damasio-lens resize-none"
              />
              <p className="text-xs text-text-secondary mt-1">
                {intention.length} characters
              </p>
            </div>

            {/* Source Context */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-text-primary mb-2">
                Context Sources
              </label>
              <div className="bg-surface rounded-lg border border-border-light p-3">
                <div className="flex flex-wrap gap-2">
                  {sources.map((source) => (
                    <button
                      key={source.id}
                      onClick={() => toggleSource(source.id)}
                      className={cn(
                        'px-3 py-1.5 rounded-lg text-sm transition-all',
                        selectedSourceIds.includes(source.id)
                          ? 'bg-damasio-lens text-white'
                          : 'bg-surface border border-border-light text-text-secondary hover:text-text-primary'
                      )}
                    >
                      {source.name}
                    </button>
                  ))}
                </div>
                <p className="text-xs text-text-secondary mt-2">
                  {selectedSources.length > 0 
                    ? `Ginger will consider insights from ${selectedSources.map(s => s.name).join(', ')}`
                    : 'Select sources to provide context for your reflection'
                  }
                </p>
              </div>
            </div>

            <div className="flex justify-end">
              <button
                onClick={handleContinue}
                disabled={!canProceedStep1}
                className={cn(
                  'px-6 py-2.5 rounded-lg text-sm font-medium transition-all flex items-center gap-2',
                  canProceedStep1
                    ? 'bg-damasio-lens text-white hover:bg-damasio-lens/90'
                    : 'bg-border-light text-text-secondary cursor-not-allowed'
                )}
              >
                Continue
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
        )}

        {/* Step 2: Analysis */}
        {step === 2 && isAnalyzing && (
          <div className="flex flex-col items-center justify-center py-20 px-8">
            <div className="relative mb-8">
              <Brain size={56} className="text-damasio-lens animate-pulse" />
              <div className="absolute inset-0 animate-ping">
                <Brain size={56} className="text-damasio-lens/30" />
              </div>
            </div>
            <h3 className="font-serif text-2xl font-medium text-text-primary mb-2">
              Preparing Your Space
            </h3>
            <p className="text-text-secondary text-center max-w-md mb-8">
              Setting up a reflective environment based on your intention
            </p>

            {/* Analysis Steps */}
            <div className="space-y-3 w-full max-w-sm">
              {analysisSteps.map((stepText, index) => (
                <div
                  key={index}
                  className={cn(
                    'flex items-center gap-3 px-4 py-2 rounded-lg transition-all duration-300',
                    analysisStep > index
                      ? 'bg-success/10 text-success'
                      : analysisStep === index
                        ? 'bg-damasio-lens/10 text-damasio-lens'
                        : 'text-text-secondary'
                  )}
                >
                  <div className={cn(
                    'w-5 h-5 rounded-full flex items-center justify-center text-xs transition-all',
                    analysisStep > index
                      ? 'bg-success text-white'
                      : analysisStep === index
                        ? 'bg-damasio-lens text-white animate-pulse'
                        : 'bg-border-light'
                  )}>
                    {analysisStep > index ? <Check size={12} /> : index + 1}
                  </div>
                  <span className="text-sm">{stepText}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Step 3: Session Setup */}
        {step === 3 && (
          <div className="animate-slide-up">
            <div className="text-center mb-6">
              <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-success/10 mb-4">
                <Sparkles size={28} className="text-success" />
              </div>
              <h2 className="font-serif text-2xl font-medium text-text-primary mb-2">
                Ready to Reflect
              </h2>
              <p className="text-text-secondary text-sm">
                Based on your intention, here are suggested focus areas
              </p>
            </div>

            {/* Your Intention */}
            <div className="bg-surface rounded-xl border border-border-light p-4 mb-6">
              <h3 className="text-xs font-medium text-text-secondary uppercase tracking-wider mb-2">
                Your Intention
              </h3>
              <p className="text-text-primary leading-relaxed">
                {intention}
              </p>
            </div>

            {/* Suggested Themes */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-text-primary mb-3">
                Focus Areas (Optional)
              </label>
              <div className="space-y-2">
                {SUGGESTED_THEMES.map((theme) => (
                  <button
                    key={theme.id}
                    onClick={() => toggleTheme(theme.id)}
                    className={cn(
                      'w-full p-3 rounded-lg border transition-all text-left',
                      selectedThemes.includes(theme.id)
                        ? 'border-damasio-lens bg-damasio-lens/5'
                        : 'border-border-light hover:border-border-medium bg-surface'
                    )}
                  >
                    <div className="flex items-center gap-3">
                      <div className={cn(
                        'w-5 h-5 rounded border-2 flex items-center justify-center transition-all',
                        selectedThemes.includes(theme.id)
                          ? 'border-damasio-lens bg-damasio-lens'
                          : 'border-border-medium'
                      )}>
                        {selectedThemes.includes(theme.id) && (
                          <Check size={12} className="text-white" />
                        )}
                      </div>
                      <div className="flex-1">
                        <p className="font-medium text-sm text-text-primary">
                          {theme.label}
                        </p>
                        <p className="text-xs text-text-secondary">
                          {theme.description}
                        </p>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={handleClose}
                className="flex-1 px-6 py-2.5 rounded-lg text-sm font-medium bg-surface text-text-primary hover:bg-hover-surface transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleStartReflection}
                className="flex-1 px-6 py-2.5 rounded-lg text-sm font-medium bg-damasio-lens text-white hover:bg-damasio-lens/90 transition-colors flex items-center justify-center gap-2"
              >
                <MessageCircle size={16} />
                Start Reflection
              </button>
            </div>
          </div>
        )}
      </div>
    </Modal>
  )
}

