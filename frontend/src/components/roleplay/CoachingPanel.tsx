'use client'

import { type FC } from 'react'
import { cn } from '@/lib/utils'
import { X, CheckCircle, AlertCircle, Lightbulb, TrendingUp, Target } from '@/components/ui/Icons'
import type { CoachingHint, RoleplayGoal } from '@/types'
import { getSkillById } from '@/lib/skills/communicationSkills'

interface CoachingPanelProps {
  skillId: string
  hints: CoachingHint[]
  goals: RoleplayGoal[]
  techniquesAttempted: string[]
  partnerEmotionalState: string
  onDismissHint: (hintId: string) => void
  onToggleGoal: (goalId: string) => void
}

export const CoachingPanel: FC<CoachingPanelProps> = ({
  skillId,
  hints,
  goals,
  techniquesAttempted,
  partnerEmotionalState,
  onDismissHint,
  onToggleGoal
}) => {
  const skill = getSkillById(skillId)
  
  const getEmotionColor = (state: string) => {
    switch (state) {
      case 'receptive':
        return 'text-success'
      case 'escalation':
        return 'text-error'
      case 'deescalation':
        return 'text-amber-500'
      case 'challenging':
        return 'text-warning'
      default:
        return 'text-text-secondary'
    }
  }

  const getEmotionLabel = (state: string) => {
    return state.charAt(0).toUpperCase() + state.slice(1)
  }

  return (
    <div className="h-full flex flex-col bg-background">
      {/* Header */}
      <div className="p-4 border-b border-border-light">
        <h3 className="font-medium text-text-primary mb-1">Coaching Panel</h3>
        <p className="text-xs text-text-secondary">Real-time guidance and progress</p>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {/* Active Hints */}
        {hints.filter(h => !h.dismissed).length > 0 && (
          <div className="space-y-2">
            <h4 className="text-xs font-medium text-text-secondary uppercase tracking-wide">Active Hints</h4>
            {hints
              .filter(h => !h.dismissed)
              .map((hint) => {
                const Icon = hint.type === 'warning' ? AlertCircle : 
                           hint.type === 'encouragement' ? CheckCircle : Lightbulb
                const colorClass = hint.type === 'warning' ? 'bg-error/10 border-error/20 text-error' :
                                 hint.type === 'encouragement' ? 'bg-success/10 border-success/20 text-success' :
                                 'bg-amber-500/10 border-amber-500/20 text-amber-600'
                
                return (
                  <div
                    key={hint.id}
                    className={cn(
                      'p-3 rounded-lg border relative animate-fade-in',
                      colorClass
                    )}
                  >
                    <button
                      onClick={() => onDismissHint(hint.id)}
                      className="absolute top-2 right-2 p-1 hover:bg-white/20 rounded transition-colors"
                    >
                      <X size={12} />
                    </button>
                    <div className="flex items-start gap-2 pr-6">
                      <Icon size={16} className="flex-shrink-0 mt-0.5" />
                      <p className="text-xs leading-relaxed">{hint.content}</p>
                    </div>
                  </div>
                )
              })}
          </div>
        )}

        {/* Emotional State */}
        <div>
          <h4 className="text-xs font-medium text-text-secondary uppercase tracking-wide mb-2">
            Partner Emotional State
          </h4>
          <div className="bg-surface rounded-lg p-3 border border-border-light">
            <div className="flex items-center justify-between">
              <span className="text-sm text-text-primary">Current State:</span>
              <span className={cn('text-sm font-medium', getEmotionColor(partnerEmotionalState))}>
                {getEmotionLabel(partnerEmotionalState)}
              </span>
            </div>
            <div className="mt-2 h-1.5 bg-background rounded-full overflow-hidden">
              <div 
                className={cn(
                  'h-full rounded-full transition-all duration-500',
                  partnerEmotionalState === 'receptive' && 'bg-success w-full',
                  partnerEmotionalState === 'deescalation' && 'bg-amber-500 w-3/4',
                  partnerEmotionalState === 'opening' && 'bg-blue-500 w-1/2',
                  partnerEmotionalState === 'challenging' && 'bg-warning w-2/3',
                  partnerEmotionalState === 'escalation' && 'bg-error w-5/6'
                )}
              />
            </div>
          </div>
        </div>

        {/* Goals Progress */}
        <div>
          <h4 className="text-xs font-medium text-text-secondary uppercase tracking-wide mb-2">
            Your Goals
          </h4>
          <div className="space-y-2">
            {goals.map((goal) => (
              <button
                key={goal.id}
                onClick={() => onToggleGoal(goal.id)}
                className={cn(
                  'w-full p-3 rounded-lg border text-left transition-all',
                  goal.completed
                    ? 'bg-success/5 border-success/20'
                    : 'bg-surface border-border-light hover:border-border-medium'
                )}
              >
                <div className="flex items-start gap-2">
                  <div className={cn(
                    'w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 mt-0.5',
                    goal.completed
                      ? 'border-success bg-success'
                      : 'border-border-medium'
                  )}>
                    {goal.completed && <CheckCircle size={12} className="text-white" />}
                  </div>
                  <p className={cn(
                    'text-xs leading-relaxed',
                    goal.completed ? 'text-text-secondary line-through' : 'text-text-primary'
                  )}>
                    {goal.description}
                  </p>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Techniques Checklist */}
        {skill && (
          <div>
            <h4 className="text-xs font-medium text-text-secondary uppercase tracking-wide mb-2">
              Key Techniques
            </h4>
            <div className="space-y-2">
              {skill.keyTechniques.map((technique, idx) => {
                const attempted = techniquesAttempted.some(t => 
                  technique.toLowerCase().includes(t.toLowerCase()) ||
                  t.toLowerCase().includes(technique.toLowerCase())
                )
                
                return (
                  <div
                    key={idx}
                    className={cn(
                      'p-2 rounded-lg border',
                      attempted
                        ? 'bg-amber-500/5 border-amber-500/20'
                        : 'bg-surface border-border-light'
                    )}
                  >
                    <div className="flex items-start gap-2">
                      <div className={cn(
                        'w-4 h-4 rounded border flex items-center justify-center flex-shrink-0 mt-0.5',
                        attempted
                          ? 'border-amber-500 bg-amber-500'
                          : 'border-border-medium'
                      )}>
                        {attempted && <CheckCircle size={10} className="text-white" />}
                      </div>
                      <p className={cn(
                        'text-xs',
                        attempted ? 'text-text-primary' : 'text-text-secondary'
                      )}>
                        {technique}
                      </p>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* Quick Tips */}
        <div className="bg-amber-500/5 border border-amber-500/20 rounded-lg p-3">
          <div className="flex items-start gap-2">
            <Target size={14} className="text-amber-500 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-xs font-medium text-amber-700 mb-1">Practice Tip</p>
              <p className="text-xs text-amber-600 leading-relaxed">
                Take your time. Real conversations have natural pauses. There's no rush.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

