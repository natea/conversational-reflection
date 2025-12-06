'use client'

import { type FC, useState, useEffect, useCallback } from 'react'
import { Modal } from '@/components/ui/Modal'
import { useGingerStore } from '@/stores/useGingerStore'
import { cn } from '@/lib/utils'
import { Activity, ChevronRight, Check, Play, Pause } from '@/components/ui/Icons'

type BodyPart = 'head' | 'neck' | 'chest' | 'stomach' | 'legs'

interface BodyPartConfig {
  id: BodyPart
  name: string
  duration: number // seconds for this part
  instruction: string
  guidance: string[]
}

const BODY_PARTS: BodyPartConfig[] = [
  {
    id: 'head',
    name: 'Head',
    duration: 90,
    instruction: 'Bring your attention to your head. Notice any sensations - warmth, tension, tingling.',
    guidance: [
      'Notice your forehead... is there any tightness?',
      'Become aware of your temples and jaw...',
      'Simply observe without judgment...'
    ]
  },
  {
    id: 'neck',
    name: 'Neck & Shoulders',
    duration: 90,
    instruction: 'Shift focus to your neck and shoulders. Notice any tightness or relaxation.',
    guidance: [
      'Feel the back of your neck...',
      'Notice your shoulders... are they raised or relaxed?',
      'Let any tension you find soften...'
    ]
  },
  {
    id: 'chest',
    name: 'Chest',
    duration: 120,
    instruction: 'Move awareness to your chest. Notice your breathing and any emotional sensations.',
    guidance: [
      'Notice your breath... is it shallow or deep?',
      'Feel your heartbeat... is it calm or racing?',
      'This is where we often hold emotion...'
    ]
  },
  {
    id: 'stomach',
    name: 'Stomach',
    duration: 90,
    instruction: 'Bring attention to your stomach and gut. This is where emotions often live.',
    guidance: [
      'Notice any butterflies, tightness, or warmth...',
      'Your gut holds wisdom... what is it telling you?',
      'Simply notice without trying to change anything...'
    ]
  },
  {
    id: 'legs',
    name: 'Legs & Feet',
    duration: 90,
    instruction: 'Finally, notice your legs and feet. Are they grounded and stable?',
    guidance: [
      'Feel your connection to the ground...',
      'Notice any tension, restlessness, or stability...',
      'You are safe and grounded in this moment...'
    ]
  }
]

export const SomaticModal: FC = () => {
  const { somaticModalOpen, setSomaticModalOpen, addArtifact } = useGingerStore()
  const [phase, setPhase] = useState<'intro' | 'practice' | 'complete'>('intro')
  const [isActive, setIsActive] = useState(false)
  const [currentPartIndex, setCurrentPartIndex] = useState(0)
  const [partTime, setPartTime] = useState(0)
  const [guidanceIndex, setGuidanceIndex] = useState(0)
  const [notes, setNotes] = useState<Record<BodyPart, string>>({
    head: '', neck: '', chest: '', stomach: '', legs: ''
  })
  const [showNotes, setShowNotes] = useState(false)

  const currentPart = BODY_PARTS[currentPartIndex]
  const totalDuration = BODY_PARTS.reduce((sum, p) => sum + p.duration, 0)
  const elapsedTotal = BODY_PARTS.slice(0, currentPartIndex).reduce((sum, p) => sum + p.duration, 0) + partTime

  // Timer effect
  useEffect(() => {
    let interval: NodeJS.Timeout
    if (isActive && phase === 'practice') {
      interval = setInterval(() => {
        setPartTime((time) => {
          if (time >= currentPart.duration - 1) {
            // Move to next part
            if (currentPartIndex < BODY_PARTS.length - 1) {
              setCurrentPartIndex(idx => idx + 1)
              setGuidanceIndex(0)
              return 0
            } else {
              // Complete
              setIsActive(false)
              setPhase('complete')
              return time
            }
          }
          return time + 1
        })
      }, 1000)
    }
    return () => clearInterval(interval)
  }, [isActive, phase, currentPartIndex, currentPart.duration])

  // Guidance rotation
  useEffect(() => {
    if (!isActive || phase !== 'practice') return

    const guidanceInterval = setInterval(() => {
      setGuidanceIndex(idx => (idx + 1) % currentPart.guidance.length)
    }, 8000)

    return () => clearInterval(guidanceInterval)
  }, [isActive, phase, currentPart.guidance.length])

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  const handleClose = () => {
    setSomaticModalOpen(false)
    setTimeout(() => {
      setPhase('intro')
      setIsActive(false)
      setCurrentPartIndex(0)
      setPartTime(0)
      setGuidanceIndex(0)
      setNotes({ head: '', neck: '', chest: '', stomach: '', legs: '' })
      setShowNotes(false)
    }, 300)
  }

  const handleStart = () => {
    setPhase('practice')
    setIsActive(true)
  }

  const handleComplete = () => {
    const notesText = Object.entries(notes)
      .filter(([_, value]) => value.trim())
      .map(([part, value]) => `${part}: ${value}`)
      .join('; ')

    addArtifact({
      type: 'voice-note',
      title: `Somatic Session: ${new Date().toLocaleDateString()}`,
      description: notesText || 'Body awareness practice completed',
      date: new Date()
    })
    handleClose()
  }

  const handleSkipPart = () => {
    if (currentPartIndex < BODY_PARTS.length - 1) {
      setCurrentPartIndex(idx => idx + 1)
      setPartTime(0)
      setGuidanceIndex(0)
    } else {
      setIsActive(false)
      setPhase('complete')
    }
  }

  const partProgress = (partTime / currentPart.duration) * 100
  const totalProgress = (elapsedTotal / totalDuration) * 100

  return (
    <Modal
      isOpen={somaticModalOpen}
      onClose={handleClose}
      size="lg"
    >
      {/* Introduction Phase */}
      {phase === 'intro' && (
        <div className="p-8 text-center">
          <div className="w-20 h-20 rounded-full bg-voice-accent/10 flex items-center justify-center mx-auto mb-6">
            <Activity size={40} className="text-voice-accent" />
          </div>
          <h2 className="font-serif text-3xl font-medium text-text-primary mb-3">
            Somatic Body Scan
          </h2>
          <p className="text-text-secondary mb-8 max-w-md mx-auto">
            A guided practice based on Damasio's proto-self concept. We'll move through your body, noticing sensations and building awareness.
          </p>

          <div className="bg-surface rounded-xl p-6 mb-8 text-left max-w-sm mx-auto">
            <h3 className="text-sm font-medium text-text-primary mb-4">What to expect:</h3>
            <ul className="space-y-3">
              {BODY_PARTS.map((part, index) => (
                <li key={part.id} className="flex items-center gap-3 text-sm">
                  <span className="w-6 h-6 rounded-full bg-surface border border-border-light flex items-center justify-center text-xs text-text-secondary">
                    {index + 1}
                  </span>
                  <span className="text-text-primary">{part.name}</span>
                  <span className="text-text-secondary text-xs ml-auto">{Math.floor(part.duration / 60)}:{(part.duration % 60).toString().padStart(2, '0')}</span>
                </li>
              ))}
            </ul>
            <div className="mt-4 pt-4 border-t border-border-light flex justify-between text-sm">
              <span className="text-text-secondary">Total duration:</span>
              <span className="font-medium text-text-primary">{Math.floor(totalDuration / 60)} minutes</span>
            </div>
          </div>

          <button
            onClick={handleStart}
            className="px-8 py-3 rounded-xl text-sm font-medium bg-voice-accent text-white hover:bg-voice-accent/90 transition-all shadow-sm hover:shadow-md flex items-center gap-2 mx-auto"
          >
            <Play size={18} />
            Begin Practice
          </button>
        </div>
      )}

      {/* Practice Phase */}
      {phase === 'practice' && (
        <div className="p-6">
          {/* Progress Header */}
          <div className="mb-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-text-secondary">Overall Progress</span>
              <span className="text-sm font-medium text-text-primary">{formatTime(elapsedTotal)} / {formatTime(totalDuration)}</span>
            </div>
            <div className="h-1.5 bg-border-light rounded-full overflow-hidden">
              <div className="h-full bg-voice-accent rounded-full transition-all duration-300" style={{ width: `${totalProgress}%` }} />
            </div>
          </div>

          {/* Body Part Steps */}
          <div className="flex items-center gap-2 mb-8 overflow-x-auto pb-2">
            {BODY_PARTS.map((part, index) => (
              <div key={part.id} className="flex items-center">
                <div className={cn(
                  'w-8 h-8 rounded-full flex items-center justify-center text-xs font-medium transition-colors flex-shrink-0',
                  index < currentPartIndex
                    ? 'bg-success text-white'
                    : index === currentPartIndex
                      ? 'bg-voice-accent text-white'
                      : 'bg-surface text-text-secondary border border-border-light'
                )}>
                  {index < currentPartIndex ? <Check size={14} /> : index + 1}
                </div>
                {index < BODY_PARTS.length - 1 && (
                  <div className={cn(
                    'w-8 h-0.5 mx-1',
                    index < currentPartIndex ? 'bg-success' : 'bg-border-light'
                  )} />
                )}
              </div>
            ))}
          </div>

          {/* Current Body Part */}
          <div className="grid grid-cols-5 gap-6">
            {/* Body Map */}
            <div className="col-span-2">
              <div className="bg-surface rounded-xl border border-border-light p-4 sticky top-0">
                <div className="flex justify-center mb-4">
                  <svg viewBox="0 0 200 400" className="w-full max-w-[160px]">
                    <ellipse cx="100" cy="40" rx="35" ry="40"
                      className={cn('transition-all duration-500',
                        currentPart.id === 'head' ? 'fill-voice-accent/30 stroke-voice-accent' : 'fill-surface stroke-border-medium')}
                      strokeWidth="2" />
                    <rect x="85" y="75" width="30" height="25" rx="5"
                      className={cn('transition-all duration-500',
                        currentPart.id === 'neck' ? 'fill-voice-accent/30 stroke-voice-accent' : 'fill-surface stroke-border-medium')}
                      strokeWidth="2" />
                    <ellipse cx="100" cy="150" rx="50" ry="60"
                      className={cn('transition-all duration-500',
                        currentPart.id === 'chest' ? 'fill-voice-accent/30 stroke-voice-accent' : 'fill-surface stroke-border-medium')}
                      strokeWidth="2" />
                    <ellipse cx="100" cy="230" rx="45" ry="40"
                      className={cn('transition-all duration-500',
                        currentPart.id === 'stomach' ? 'fill-voice-accent/30 stroke-voice-accent' : 'fill-surface stroke-border-medium')}
                      strokeWidth="2" />
                    <rect x="65" y="265" width="70" height="120" rx="10"
                      className={cn('transition-all duration-500',
                        currentPart.id === 'legs' ? 'fill-voice-accent/30 stroke-voice-accent' : 'fill-surface stroke-border-medium')}
                      strokeWidth="2" />
                  </svg>
                </div>

                {/* Quick notes toggle */}
                <button
                  onClick={() => setShowNotes(!showNotes)}
                  className="w-full text-xs text-text-secondary hover:text-text-primary transition-colors"
                >
                  {showNotes ? 'Hide notes' : 'Add notes'}
                </button>
              </div>
            </div>

            {/* Instructions & Timer */}
            <div className="col-span-3 space-y-4">
              {/* Current Part Header */}
              <div className="bg-surface rounded-xl border border-voice-accent/30 p-5">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <span className="text-xs text-voice-accent font-medium uppercase tracking-wider">
                      Currently focusing on
                    </span>
                    <h3 className="font-serif text-2xl font-medium text-text-primary">
                      {currentPart.name}
                    </h3>
                  </div>
                  <div className="text-right">
                    <span className="text-3xl font-mono font-medium text-text-primary">
                      {formatTime(currentPart.duration - partTime)}
                    </span>
                    <p className="text-xs text-text-secondary">remaining</p>
                  </div>
                </div>

                {/* Part Progress */}
                <div className="h-2 bg-border-light rounded-full overflow-hidden mb-4">
                  <div className="h-full bg-voice-accent rounded-full transition-all duration-300" style={{ width: `${partProgress}%` }} />
                </div>

                {/* Instruction */}
                <p className="text-text-secondary leading-relaxed mb-4">
                  {currentPart.instruction}
                </p>

                {/* Rotating Guidance */}
                <div className="bg-voice-accent/5 rounded-lg p-4 min-h-[60px]">
                  <p className="text-voice-accent italic text-center animate-fade-in" key={guidanceIndex}>
                    "{currentPart.guidance[guidanceIndex]}"
                  </p>
                </div>
              </div>

              {/* Notes (optional) */}
              {showNotes && (
                <div className="animate-slide-up">
                  <textarea
                    value={notes[currentPart.id]}
                    onChange={(e) => setNotes(prev => ({ ...prev, [currentPart.id]: e.target.value }))}
                    placeholder={`What do you notice in your ${currentPart.name.toLowerCase()}?`}
                    className="w-full h-20 px-4 py-3 rounded-lg border border-border-light bg-surface text-text-primary placeholder:text-text-secondary focus:outline-none focus:ring-2 focus:ring-voice-accent/20 focus:border-voice-accent resize-none text-sm"
                  />
                </div>
              )}

              {/* Controls */}
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setIsActive(!isActive)}
                  className={cn(
                    'flex-1 py-3 rounded-xl font-medium transition-all flex items-center justify-center gap-2',
                    isActive
                      ? 'bg-surface text-text-primary hover:bg-hover-surface border border-border-light'
                      : 'bg-voice-accent text-white hover:bg-voice-accent/90'
                  )}
                >
                  {isActive ? <Pause size={18} /> : <Play size={18} />}
                  {isActive ? 'Pause' : 'Resume'}
                </button>
                <button
                  onClick={handleSkipPart}
                  className="px-6 py-3 rounded-xl font-medium bg-surface text-text-secondary hover:text-text-primary hover:bg-hover-surface transition-all border border-border-light flex items-center gap-2"
                >
                  Skip
                  <ChevronRight size={16} />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Complete Phase */}
      {phase === 'complete' && (
        <div className="p-8 text-center">
          <div className="w-20 h-20 rounded-full bg-success/10 flex items-center justify-center mx-auto mb-6">
            <Check size={40} className="text-success" />
          </div>
          <h2 className="font-serif text-3xl font-medium text-text-primary mb-3">
            Practice Complete
          </h2>
          <p className="text-text-secondary mb-8">
            You've completed a full body scan. Take a moment to notice how you feel overall.
          </p>

          {/* Summary */}
          <div className="bg-surface rounded-xl p-6 mb-8 text-left max-w-md mx-auto">
            <h3 className="text-sm font-medium text-text-primary mb-4">Session Summary</h3>
            <div className="space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-text-secondary">Duration</span>
                <span className="font-medium text-text-primary">{formatTime(elapsedTotal)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-text-secondary">Body parts scanned</span>
                <span className="font-medium text-text-primary">{BODY_PARTS.length}</span>
              </div>
              {Object.entries(notes).some(([_, v]) => v.trim()) && (
                <div className="pt-3 border-t border-border-light">
                  <span className="text-xs text-text-secondary uppercase tracking-wider">Your notes:</span>
                  <div className="mt-2 space-y-1">
                    {Object.entries(notes)
                      .filter(([_, v]) => v.trim())
                      .map(([part, note]) => (
                        <p key={part} className="text-sm text-text-primary">
                          <span className="font-medium capitalize">{part}:</span> {note}
                        </p>
                      ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Final notes */}
          <div className="mb-6 max-w-md mx-auto">
            <label className="block text-sm font-medium text-text-primary mb-2 text-left">
              Any final reflections?
            </label>
            <textarea
              value={notes.head} // Reuse head for final notes
              onChange={(e) => setNotes(prev => ({ ...prev, head: e.target.value }))}
              placeholder="How do you feel after this practice?"
              className="w-full h-20 px-4 py-3 rounded-lg border border-border-light bg-surface text-text-primary placeholder:text-text-secondary focus:outline-none focus:ring-2 focus:ring-voice-accent/20 focus:border-voice-accent resize-none text-sm"
            />
          </div>

          <div className="flex gap-3 max-w-md mx-auto">
            <button
              onClick={handleClose}
              className="flex-1 px-6 py-3 rounded-xl text-sm font-medium bg-surface text-text-primary hover:bg-hover-surface transition-colors"
            >
              Discard
            </button>
            <button
              onClick={handleComplete}
              className="flex-1 px-6 py-3 rounded-xl text-sm font-medium bg-voice-accent text-white hover:bg-voice-accent/90 transition-colors"
            >
              Save as Artifact
            </button>
          </div>
        </div>
      )}
    </Modal>
  )
}
