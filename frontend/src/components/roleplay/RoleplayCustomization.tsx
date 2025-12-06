'use client'

import { type FC, useState } from 'react'
import { cn } from '@/lib/utils'
import { User, ChevronRight, ChevronLeft, Target, Sparkles, Check, Shield, GitMerge, Heart, Ear, Zap } from '@/components/ui/Icons'
import { useContactsStore } from '@/stores/useContactsStore'
import { useGingerStore } from '@/stores/useGingerStore'
import { COMMUNICATION_SKILLS, getRecommendedSkills, type CommunicationSkill } from '@/lib/skills/communicationSkills'
import type { Contact, LensType } from '@/types'

interface RoleplayCustomizationProps {
  onStart: (config: {
    partnerId: string
    partnerName: string
    skillId: string
    scenario: string
    goals: string[]
    coachingLevel: 'off' | 'subtle' | 'active'
    activeLens?: LensType
  }) => void
  onCancel: () => void
}

const SKILL_ICONS: Record<string, typeof Shield> = {
  'boundary-setting': Shield,
  'conflict-resolution': GitMerge,
  'emotional-expression': Heart,
  'active-listening': Ear,
  'assertiveness': Zap,
  'repair-after-rupture': Heart
}

export const RoleplayCustomization: FC<RoleplayCustomizationProps> = ({ onStart, onCancel }) => {
  const { contacts } = useContactsStore()
  const { activeLenses } = useGingerStore()
  
  const [step, setStep] = useState(1)
  const [selectedPartner, setSelectedPartner] = useState<Contact | null>(null)
  const [customPartner, setCustomPartner] = useState('')
  const [selectedSkill, setSelectedSkill] = useState<CommunicationSkill | null>(null)
  const [scenario, setScenario] = useState('')
  const [goals, setGoals] = useState<string[]>([''])
  const [coachingLevel, setCoachingLevel] = useState<'off' | 'subtle' | 'active'>('active')

  const handlePartnerSelect = (contact: Contact) => {
    setSelectedPartner(contact)
  }

  const handleSkillSelect = (skill: CommunicationSkill) => {
    setSelectedSkill(skill)
    // Auto-populate scenario template
    if (selectedPartner) {
      const scenarioTemplate = skill.practiceScenarios[0]
      setScenario(`${scenarioTemplate} (with ${selectedPartner.name})`)
    } else {
      setScenario(skill.practiceScenarios[0])
    }
  }

  const handleGoalChange = (index: number, value: string) => {
    const newGoals = [...goals]
    newGoals[index] = value
    setGoals(newGoals)
  }

  const addGoal = () => {
    if (goals.length < 5) {
      setGoals([...goals, ''])
    }
  }

  const removeGoal = (index: number) => {
    if (goals.length > 1) {
      setGoals(goals.filter((_, i) => i !== index))
    }
  }

  const handleStart = () => {
    if (!selectedSkill) return
    
    const partnerId = selectedPartner ? selectedPartner.id : 'custom'
    const partnerName = selectedPartner ? selectedPartner.name : customPartner || 'Partner'
    const filteredGoals = goals.filter(g => g.trim().length > 0)
    
    onStart({
      partnerId,
      partnerName,
      skillId: selectedSkill.id,
      scenario,
      goals: filteredGoals.length > 0 ? filteredGoals : ['Practice the conversation'],
      coachingLevel,
      activeLens: activeLenses[0]
    })
  }

  const canProceedStep1 = selectedPartner !== null || customPartner.trim().length > 0
  const canProceedStep2 = selectedSkill !== null && scenario.trim().length > 0
  const canProceedStep3 = goals.some(g => g.trim().length > 0)

  const recommendedSkills = selectedPartner 
    ? getRecommendedSkills(selectedPartner.relationshipType)
    : COMMUNICATION_SKILLS

  return (
    <div className="h-full flex flex-col">
      {/* Progress Steps */}
      <div className="flex items-center justify-center gap-2 mb-6 px-6 pt-6">
        {[1, 2, 3].map((s) => (
          <div key={s} className="flex items-center gap-2">
            <div
              className={cn(
                'w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-colors',
                step === s
                  ? 'bg-amber-500 text-white'
                  : step > s
                    ? 'bg-success text-white'
                    : 'bg-surface text-text-secondary'
              )}
            >
              {step > s ? <Check size={16} /> : s}
            </div>
            {s < 3 && (
              <div className={cn(
                'w-8 h-0.5',
                step > s ? 'bg-success' : 'bg-border-light'
              )} />
            )}
          </div>
        ))}
      </div>

      <div className="flex-1 overflow-y-auto px-6 pb-6">
        {/* Step 1: Choose Partner */}
        {step === 1 && (
          <div className="animate-fade-in">
            <div className="text-center mb-6">
              <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-amber-500/10 mb-4">
                <User size={28} className="text-amber-500" />
              </div>
              <h2 className="font-serif text-2xl font-medium text-text-primary mb-2">
                Who would you like to practice with?
              </h2>
              <p className="text-text-secondary text-sm">
                Choose someone from your contacts or create a custom partner
              </p>
            </div>

            {/* Existing Contacts */}
            {contacts.length > 0 && (
              <div className="mb-6">
                <h3 className="text-sm font-medium text-text-primary mb-3">Your Contacts</h3>
                <div className="grid gap-3">
                  {contacts.map((contact) => (
                    <button
                      key={contact.id}
                      onClick={() => handlePartnerSelect(contact)}
                      className={cn(
                        'p-4 rounded-xl border-2 text-left transition-all',
                        selectedPartner?.id === contact.id
                          ? 'border-amber-500 bg-amber-500/5'
                          : 'border-border-light hover:border-border-medium bg-surface'
                      )}
                    >
                      <div className="flex items-center gap-3">
                        <div className={cn(
                          'w-12 h-12 rounded-full flex items-center justify-center',
                          selectedPartner?.id === contact.id
                            ? 'bg-amber-500/20'
                            : 'bg-surface'
                        )}>
                          <User size={20} className={cn(
                            selectedPartner?.id === contact.id
                              ? 'text-amber-500'
                              : 'text-text-secondary'
                          )} />
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <p className="font-medium text-text-primary">{contact.name}</p>
                            <span className="text-xs px-2 py-0.5 rounded-full bg-surface text-text-secondary capitalize">
                              {contact.relationshipType}
                            </span>
                          </div>
                          <p className="text-xs text-text-secondary">
                            {contact.totalMessages} messages · Last interaction {contact.lastInteraction.toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Custom Partner */}
            <div className="mb-6">
              <h3 className="text-sm font-medium text-text-primary mb-3">Or Create Custom Partner</h3>
              <div className="space-y-3">
                <input
                  type="text"
                  value={customPartner}
                  onChange={(e) => {
                    setCustomPartner(e.target.value)
                    if (e.target.value.trim()) {
                      setSelectedPartner(null)
                    }
                  }}
                  placeholder="e.g., My manager, A friend, My sibling..."
                  className="w-full px-4 py-3 rounded-lg border border-border-light bg-surface text-text-primary placeholder:text-text-secondary focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500"
                />
              </div>
            </div>

            <div className="flex justify-between pt-4 border-t border-border-light">
              <button
                onClick={onCancel}
                className="px-6 py-2.5 rounded-lg text-sm font-medium text-text-secondary hover:text-text-primary hover:bg-hover-surface transition-all"
              >
                Cancel
              </button>
              <button
                onClick={() => setStep(2)}
                disabled={!canProceedStep1}
                className={cn(
                  'px-6 py-2.5 rounded-lg text-sm font-medium transition-all flex items-center gap-2',
                  canProceedStep1
                    ? 'bg-amber-500 text-white hover:bg-amber-600'
                    : 'bg-border-light text-text-secondary cursor-not-allowed'
                )}
              >
                Continue
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
        )}

        {/* Step 2: Choose Skill & Scenario */}
        {step === 2 && (
          <div className="animate-fade-in">
            <div className="text-center mb-6">
              <h2 className="font-serif text-2xl font-medium text-text-primary mb-2">
                What skill do you want to practice?
              </h2>
              <p className="text-text-secondary text-sm">
                Choose a communication skill and scenario
              </p>
            </div>

            {/* Skills Grid */}
            <div className="mb-6">
              <h3 className="text-sm font-medium text-text-primary mb-3">
                {selectedPartner ? `Recommended for ${selectedPartner.relationshipType} relationships` : 'All Skills'}
              </h3>
              <div className="grid gap-3">
                {recommendedSkills.map((skill) => {
                  const IconComponent = SKILL_ICONS[skill.id] || Target
                  return (
                    <button
                      key={skill.id}
                      onClick={() => handleSkillSelect(skill)}
                      className={cn(
                        'p-4 rounded-xl border-2 text-left transition-all',
                        selectedSkill?.id === skill.id
                          ? 'border-amber-500 bg-amber-500/5'
                          : 'border-border-light hover:border-border-medium bg-surface'
                      )}
                    >
                      <div className="flex items-start gap-3">
                        <div className={cn(
                          'w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0',
                          selectedSkill?.id === skill.id
                            ? 'bg-amber-500/20'
                            : 'bg-surface'
                        )}>
                          <IconComponent size={20} className={cn(
                            selectedSkill?.id === skill.id
                              ? 'text-amber-500'
                              : 'text-text-secondary'
                          )} />
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <p className="font-medium text-text-primary">{skill.name}</p>
                            <div className="flex gap-1">
                              {Array.from({ length: skill.difficultyLevel }).map((_, i) => (
                                <div key={i} className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                              ))}
                            </div>
                          </div>
                          <p className="text-xs text-text-secondary mb-2">{skill.description}</p>
                          <div className="flex items-center gap-2">
                            <span className="text-xs px-2 py-0.5 rounded-full bg-surface text-text-secondary">
                              {skill.relatedLens.toUpperCase()} lens
                            </span>
                          </div>
                        </div>
                      </div>
                    </button>
                  )
                })}
              </div>
            </div>

            {/* Scenario Input */}
            {selectedSkill && (
              <div className="mb-6 animate-fade-in">
                <h3 className="text-sm font-medium text-text-primary mb-3">Describe the scenario</h3>
                <textarea
                  value={scenario}
                  onChange={(e) => setScenario(e.target.value)}
                  placeholder="Describe the specific situation you want to practice..."
                  className="w-full h-28 px-4 py-3 rounded-lg border border-border-light bg-surface text-text-primary placeholder:text-text-secondary focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 resize-none"
                />
                
                {/* Scenario Templates */}
                {selectedSkill.practiceScenarios.length > 0 && (
                  <div className="mt-2">
                    <p className="text-xs text-text-secondary mb-2">Quick templates:</p>
                    <div className="flex flex-wrap gap-2">
                      {selectedSkill.practiceScenarios.slice(0, 3).map((template, idx) => (
                        <button
                          key={idx}
                          onClick={() => setScenario(template)}
                          className="text-xs px-3 py-1.5 rounded-full border border-border-light hover:border-amber-500 hover:bg-amber-500/5 text-text-secondary hover:text-text-primary transition-all"
                        >
                          {template.slice(0, 40)}...
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            <div className="flex justify-between pt-4 border-t border-border-light">
              <button
                onClick={() => setStep(1)}
                className="px-6 py-2.5 rounded-lg text-sm font-medium text-text-secondary hover:text-text-primary hover:bg-hover-surface transition-all flex items-center gap-2"
              >
                <ChevronLeft size={16} />
                Back
              </button>
              <button
                onClick={() => setStep(3)}
                disabled={!canProceedStep2}
                className={cn(
                  'px-6 py-2.5 rounded-lg text-sm font-medium transition-all flex items-center gap-2',
                  canProceedStep2
                    ? 'bg-amber-500 text-white hover:bg-amber-600'
                    : 'bg-border-light text-text-secondary cursor-not-allowed'
                )}
              >
                Continue
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
        )}

        {/* Step 3: Set Goals & Coaching Level */}
        {step === 3 && (
          <div className="animate-fade-in">
            <div className="text-center mb-6">
              <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-amber-500/10 mb-4">
                <Target size={28} className="text-amber-500" />
              </div>
              <h2 className="font-serif text-2xl font-medium text-text-primary mb-2">
                Set your goals
              </h2>
              <p className="text-text-secondary text-sm">
                What does success look like for this practice session?
              </p>
            </div>

            {/* Goals */}
            <div className="mb-6">
              <h3 className="text-sm font-medium text-text-primary mb-3">Your Goals</h3>
              <div className="space-y-2">
                {goals.map((goal, idx) => (
                  <div key={idx} className="flex items-center gap-2">
                    <input
                      type="text"
                      value={goal}
                      onChange={(e) => handleGoalChange(idx, e.target.value)}
                      placeholder={`Goal ${idx + 1}...`}
                      className="flex-1 px-4 py-2.5 rounded-lg border border-border-light bg-surface text-text-primary placeholder:text-text-secondary focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500"
                    />
                    {goals.length > 1 && (
                      <button
                        onClick={() => removeGoal(idx)}
                        className="p-2 text-text-secondary hover:text-error transition-colors"
                      >
                        ×
                      </button>
                    )}
                  </div>
                ))}
              </div>
              {goals.length < 5 && (
                <button
                  onClick={addGoal}
                  className="mt-2 text-sm text-amber-500 hover:text-amber-600 transition-colors"
                >
                  + Add another goal
                </button>
              )}
            </div>

            {/* Coaching Level */}
            <div className="mb-6">
              <h3 className="text-sm font-medium text-text-primary mb-3">Coaching Level</h3>
              <div className="grid gap-2">
                {[
                  { id: 'off' as const, name: 'No Coaching', description: 'Practice independently' },
                  { id: 'subtle' as const, name: 'Subtle Hints', description: 'Gentle suggestions when needed' },
                  { id: 'active' as const, name: 'Active Coaching', description: 'Real-time guidance and feedback' }
                ].map((level) => (
                  <button
                    key={level.id}
                    onClick={() => setCoachingLevel(level.id)}
                    className={cn(
                      'p-3 rounded-lg border-2 text-left transition-all',
                      coachingLevel === level.id
                        ? 'border-amber-500 bg-amber-500/5'
                        : 'border-border-light hover:border-border-medium bg-surface'
                    )}
                  >
                    <div className="flex items-center gap-3">
                      <div className={cn(
                        'w-4 h-4 rounded-full border-2 flex items-center justify-center',
                        coachingLevel === level.id
                          ? 'border-amber-500'
                          : 'border-border-light'
                      )}>
                        {coachingLevel === level.id && (
                          <div className="w-2 h-2 rounded-full bg-amber-500" />
                        )}
                      </div>
                      <div>
                        <p className="font-medium text-text-primary text-sm">{level.name}</p>
                        <p className="text-xs text-text-secondary">{level.description}</p>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Session Summary */}
            {selectedSkill && (
              <div className="bg-surface rounded-xl p-4 mb-6">
                <h3 className="text-sm font-medium text-text-primary mb-2">Session Preview</h3>
                <ul className="space-y-1 text-sm text-text-secondary">
                  <li>Partner: {selectedPartner?.name || customPartner || 'Partner'}</li>
                  <li>Skill: {selectedSkill.name}</li>
                  <li>Scenario: {scenario.slice(0, 60)}...</li>
                  <li>Goals: {goals.filter(g => g.trim()).length} set</li>
                </ul>
              </div>
            )}

            <div className="flex justify-between pt-4 border-t border-border-light">
              <button
                onClick={() => setStep(2)}
                className="px-6 py-2.5 rounded-lg text-sm font-medium text-text-secondary hover:text-text-primary hover:bg-hover-surface transition-all flex items-center gap-2"
              >
                <ChevronLeft size={16} />
                Back
              </button>
              <button
                onClick={handleStart}
                disabled={!canProceedStep3}
                className={cn(
                  'px-6 py-2.5 rounded-lg text-sm font-medium transition-all flex items-center gap-2',
                  canProceedStep3
                    ? 'bg-amber-500 text-white hover:bg-amber-600'
                    : 'bg-border-light text-text-secondary cursor-not-allowed'
                )}
              >
                <Sparkles size={16} />
                Start Practice
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

