'use client'

import { type FC, useState } from 'react'
import { Modal } from '@/components/ui/Modal'
import { useGingerStore } from '@/stores/useGingerStore'
import { cn } from '@/lib/utils'
import { GingerLogo, Brain, MessageSquare, GitBranch, Activity, ChevronRight, Check } from '@/components/ui/Icons'
import { LENSES } from '@/constants'
import type { LensType } from '@/types'

// Helper to get static lens background colors (Tailwind needs static classes)
const getLensBgClass = (color: string) => {
  const bgClasses: Record<string, string> = {
    'damasio-lens': 'bg-damasio-lens/10',
    'cbt-lens': 'bg-cbt-lens/10',
    'act-lens': 'bg-act-lens/10',
    'ifs-lens': 'bg-ifs-lens/10',
    'stoic-lens': 'bg-stoic-lens/10',
  }
  return bgClasses[color] || 'bg-surface'
}

const getLensSolidBgClass = (color: string) => {
  const bgClasses: Record<string, string> = {
    'damasio-lens': 'bg-damasio-lens',
    'cbt-lens': 'bg-cbt-lens',
    'act-lens': 'bg-act-lens',
    'ifs-lens': 'bg-ifs-lens',
    'stoic-lens': 'bg-stoic-lens',
  }
  return bgClasses[color] || 'bg-text-secondary'
}

const ONBOARDING_STEPS = [
  {
    id: 'welcome',
    title: 'Welcome to Ginger',
    subtitle: 'Your voice-first emotional reflection companion'
  },
  {
    id: 'lenses',
    title: 'Choose Your Lens',
    subtitle: 'Different frameworks for understanding your emotions'
  },
  {
    id: 'modes',
    title: 'Explore Modes',
    subtitle: 'Four ways to reflect and grow'
  },
  {
    id: 'ready',
    title: 'You\'re Ready',
    subtitle: 'Start your reflection journey'
  }
]

export const OnboardingModal: FC = () => {
  const {
    onboardingOpen,
    setOnboardingOpen,
    activeLenses,
    toggleLens,
    setHasCompletedOnboarding
  } = useGingerStore()
  const [currentStep, setCurrentStep] = useState(0)

  const handleClose = () => {
    setOnboardingOpen(false)
    setHasCompletedOnboarding(true)
  }

  const handleNext = () => {
    if (currentStep < ONBOARDING_STEPS.length - 1) {
      setCurrentStep(currentStep + 1)
    } else {
      handleClose()
    }
  }

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1)
    }
  }

  const step = ONBOARDING_STEPS[currentStep]

  return (
    <Modal
      isOpen={onboardingOpen}
      onClose={handleClose}
      size="lg"
      showCloseButton={false}
    >
      <div className="p-8">
        {/* Progress Indicator */}
        <div className="flex items-center justify-center gap-2 mb-8">
          {ONBOARDING_STEPS.map((_, index) => (
            <div
              key={index}
              className={cn(
                'h-1.5 rounded-full transition-all duration-300',
                index === currentStep
                  ? 'w-8 bg-voice-accent'
                  : index < currentStep
                    ? 'w-4 bg-voice-accent/50'
                    : 'w-4 bg-border-light'
              )}
            />
          ))}
        </div>

        {/* Step Content */}
        <div className="min-h-[400px] flex flex-col">
          {step.id === 'welcome' && (
            <div className="flex-1 flex flex-col items-center justify-center text-center animate-slide-up">
              <div className="w-24 h-24 rounded-full bg-voice-accent/10 flex items-center justify-center mb-6">
                <GingerLogo size={48} className="text-voice-accent" />
              </div>
              <h1 className="font-serif text-4xl font-medium text-text-primary mb-3">
                {step.title}
              </h1>
              <p className="text-lg text-text-secondary mb-8 max-w-md">
                {step.subtitle}
              </p>
              <div className="space-y-4 text-left max-w-sm">
                <div className="flex items-start gap-3 p-4 rounded-lg bg-surface">
                  <div className="w-8 h-8 rounded-full bg-damasio-lens/10 flex items-center justify-center flex-shrink-0">
                    <Brain size={18} className="text-damasio-lens" />
                  </div>
                  <div>
                    <p className="font-medium text-text-primary">Analyze your conversations</p>
                    <p className="text-sm text-text-secondary">Through evidence-based psychological frameworks</p>
                  </div>
                </div>
                <div className="flex items-start gap-3 p-4 rounded-lg bg-surface">
                  <div className="w-8 h-8 rounded-full bg-voice-accent/10 flex items-center justify-center flex-shrink-0">
                    <MessageSquare size={18} className="text-voice-accent" />
                  </div>
                  <div>
                    <p className="font-medium text-text-primary">Voice-first interface</p>
                    <p className="text-sm text-text-secondary">Speak naturally, Ginger listens and reflects</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {step.id === 'lenses' && (
            <div className="flex-1 animate-slide-up">
              <div className="text-center mb-8">
                <h2 className="font-serif text-3xl font-medium text-text-primary mb-2">
                  {step.title}
                </h2>
                <p className="text-text-secondary">
                  {step.subtitle}
                </p>
              </div>
              <div className="grid gap-3">
                {LENSES.map((lens) => {
                  const isSelected = activeLenses.includes(lens.id)
                  return (
                    <button
                      key={lens.id}
                      onClick={() => toggleLens(lens.id)}
                      className={cn(
                        'flex items-center gap-4 p-4 rounded-xl border-2 text-left transition-all',
                        isSelected
                          ? 'border-voice-accent bg-voice-accent/5'
                          : 'border-border-light hover:border-border-medium bg-surface'
                      )}
                    >
                      <div
                        className={cn(
                          'w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0',
                          getLensBgClass(lens.color)
                        )}
                      >
                        <div className={cn('w-4 h-4 rounded-full', getLensSolidBgClass(lens.color))} />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <p className="font-medium text-text-primary">{lens.name}</p>
                          <span className="text-xs text-text-secondary">({lens.fullName})</span>
                        </div>
                        <p className="text-sm text-text-secondary">{lens.description}</p>
                      </div>
                      <div
                        className={cn(
                          'w-6 h-6 rounded-full border-2 flex items-center justify-center transition-colors',
                          isSelected
                            ? 'bg-voice-accent border-voice-accent'
                            : 'border-border-medium'
                        )}
                      >
                        {isSelected && <Check size={14} className="text-white" />}
                      </div>
                    </button>
                  )
                })}
              </div>
              <p className="text-xs text-text-secondary text-center mt-4">
                Select one or more lenses. You can change this anytime.
              </p>
            </div>
          )}

          {step.id === 'modes' && (
            <div className="flex-1 animate-slide-up">
              <div className="text-center mb-8">
                <h2 className="font-serif text-3xl font-medium text-text-primary mb-2">
                  {step.title}
                </h2>
                <p className="text-text-secondary">
                  {step.subtitle}
                </p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="p-5 rounded-xl bg-surface border border-border-light">
                  <div className="w-12 h-12 rounded-xl bg-damasio-lens/10 flex items-center justify-center mb-4">
                    <Brain size={24} className="text-damasio-lens" />
                  </div>
                  <h3 className="font-medium text-text-primary mb-1">Reflect</h3>
                  <p className="text-sm text-text-secondary">Deep analysis of your conversations through psychological lenses</p>
                </div>
                <div className="p-5 rounded-xl bg-surface border border-border-light">
                  <div className="w-12 h-12 rounded-xl bg-cbt-lens/10 flex items-center justify-center mb-4">
                    <MessageSquare size={24} className="text-cbt-lens" />
                  </div>
                  <h3 className="font-medium text-text-primary mb-1">Roleplay</h3>
                  <p className="text-sm text-text-secondary">Practice difficult conversations in a safe space</p>
                </div>
                <div className="p-5 rounded-xl bg-surface border border-border-light">
                  <div className="w-12 h-12 rounded-xl bg-act-lens/10 flex items-center justify-center mb-4">
                    <GitBranch size={24} className="text-act-lens" />
                  </div>
                  <h3 className="font-medium text-text-primary mb-1">Patterns</h3>
                  <p className="text-sm text-text-secondary">Identify recurring themes and behavioral patterns</p>
                </div>
                <div className="p-5 rounded-xl bg-surface border border-border-light">
                  <div className="w-12 h-12 rounded-xl bg-ifs-lens/10 flex items-center justify-center mb-4">
                    <Activity size={24} className="text-ifs-lens" />
                  </div>
                  <h3 className="font-medium text-text-primary mb-1">Somatic</h3>
                  <p className="text-sm text-text-secondary">Guided body-awareness and emotional check-ins</p>
                </div>
              </div>
            </div>
          )}

          {step.id === 'ready' && (
            <div className="flex-1 flex flex-col items-center justify-center text-center animate-slide-up">
              <div className="w-20 h-20 rounded-full bg-success/10 flex items-center justify-center mb-6">
                <Check size={40} className="text-success" />
              </div>
              <h2 className="font-serif text-3xl font-medium text-text-primary mb-3">
                {step.title}
              </h2>
              <p className="text-text-secondary mb-8 max-w-md">
                Tap the microphone to start talking, or type your thoughts. Ginger is here to help you understand yourself better.
              </p>
              <div className="p-4 rounded-xl bg-surface border border-border-light max-w-sm">
                <p className="text-sm text-text-secondary italic">
                  "How are you feeling in your body right now? What brings you here today?"
                </p>
                <p className="text-xs text-text-secondary mt-2">— A good place to start</p>
              </div>
            </div>
          )}
        </div>

        {/* Navigation */}
        <div className="flex items-center justify-between mt-8 pt-6 border-t border-border-light">
          <button
            onClick={handleBack}
            className={cn(
              'px-6 py-2.5 rounded-lg text-sm font-medium transition-all',
              currentStep === 0
                ? 'text-transparent cursor-default'
                : 'text-text-secondary hover:text-text-primary hover:bg-hover-surface'
            )}
            disabled={currentStep === 0}
          >
            Back
          </button>
          <button
            onClick={handleNext}
            className="px-6 py-2.5 rounded-lg text-sm font-medium bg-voice-accent text-white hover:bg-voice-accent/90 transition-all shadow-sm hover:shadow-md flex items-center gap-2"
          >
            {currentStep === ONBOARDING_STEPS.length - 1 ? 'Get Started' : 'Continue'}
            <ChevronRight size={16} />
          </button>
        </div>
      </div>
    </Modal>
  )
}
