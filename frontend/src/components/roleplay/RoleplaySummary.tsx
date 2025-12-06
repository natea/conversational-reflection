'use client'

import { type FC } from 'react'
import { cn } from '@/lib/utils'
import { Check, TrendingUp, AlertCircle, Clock, MessageCircle, Target, Heart, Download, Save, X } from '@/components/ui/Icons'
import type { RoleplaySession } from '@/types'
import { getSkillById } from '@/lib/skills/communicationSkills'

interface RoleplaySummaryProps {
  session: RoleplaySession
  onSave: () => void
  onDiscard: () => void
  onViewTranscript?: () => void
}

export const RoleplaySummary: FC<RoleplaySummaryProps> = ({
  session,
  onSave,
  onDiscard,
  onViewTranscript
}) => {
  const skill = getSkillById(session.skillId)
  const insights = session.insights
  const duration = session.duration || 0
  const minutes = Math.floor(duration / 60)
  const seconds = duration % 60
  const userMessageCount = session.messages.filter(m => m.role === 'user').length
  const goalsCompleted = session.goals.filter(g => g.completed).length

  const getScoreColor = (score?: number) => {
    if (!score) return 'text-text-secondary'
    if (score >= 80) return 'text-success'
    if (score >= 60) return 'text-amber-500'
    return 'text-warning'
  }

  const getScoreLabel = (score?: number) => {
    if (!score) return 'N/A'
    if (score >= 80) return 'Excellent'
    if (score >= 60) return 'Good'
    if (score >= 40) return 'Fair'
    return 'Keep Practicing'
  }

  return (
    <div className="h-full overflow-y-auto">
      <div className="max-w-3xl mx-auto p-6">
        {/* Success Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-success/10 mb-4">
            <Check size={32} className="text-success" />
          </div>
          <h2 className="font-serif text-3xl font-medium text-text-primary mb-2">
            Practice Complete!
          </h2>
          <p className="text-text-secondary">
            Great work practicing with {session.partnerName}
          </p>
        </div>

        {/* Score Card */}
        {insights?.overallScore !== undefined && (
          <div className="bg-gradient-to-br from-amber-500/10 to-transparent rounded-2xl p-6 mb-6 border border-amber-500/20">
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="text-sm text-text-secondary mb-1">Overall Performance</p>
                <p className={cn('text-4xl font-bold', getScoreColor(insights.overallScore))}>
                  {insights.overallScore}
                  <span className="text-xl text-text-secondary">/100</span>
                </p>
                <p className="text-sm text-text-secondary mt-1">
                  {getScoreLabel(insights.overallScore)}
                </p>
              </div>
              <div className="text-right space-y-2">
                <div className="flex items-center gap-2 text-sm text-text-secondary">
                  <Clock size={16} />
                  <span>{minutes}m {seconds}s</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-text-secondary">
                  <MessageCircle size={16} />
                  <span>{userMessageCount} exchanges</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-text-secondary">
                  <Target size={16} />
                  <span>{goalsCompleted}/{session.goals.length} goals</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Quick Stats */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          <div className="bg-surface rounded-xl p-4 border border-border-light text-center">
            <p className="text-2xl font-bold text-text-primary mb-1">{userMessageCount}</p>
            <p className="text-xs text-text-secondary">Exchanges</p>
          </div>
          <div className="bg-surface rounded-xl p-4 border border-border-light text-center">
            <p className="text-2xl font-bold text-text-primary mb-1">
              {insights?.techniquesUsed.length || 0}
            </p>
            <p className="text-xs text-text-secondary">Techniques Used</p>
          </div>
          <div className="bg-surface rounded-xl p-4 border border-border-light text-center">
            <p className="text-2xl font-bold text-text-primary mb-1">{goalsCompleted}</p>
            <p className="text-xs text-text-secondary">Goals Achieved</p>
          </div>
        </div>

        {/* What Went Well */}
        {insights && insights.highlights.length > 0 && (
          <div className="bg-success/5 rounded-xl p-6 mb-6 border border-success/20">
            <div className="flex items-start gap-3 mb-4">
              <div className="w-8 h-8 rounded-full bg-success/20 flex items-center justify-center flex-shrink-0">
                <TrendingUp size={16} className="text-success" />
              </div>
              <div className="flex-1">
                <h3 className="font-medium text-text-primary mb-1">What Went Well</h3>
                <p className="text-sm text-text-secondary">Your strengths in this session</p>
              </div>
            </div>
            <ul className="space-y-2">
              {insights.highlights.map((highlight, idx) => (
                <li key={idx} className="flex items-start gap-2 text-sm text-text-primary">
                  <Check size={16} className="text-success flex-shrink-0 mt-0.5" />
                  <span>{highlight}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Growth Opportunities */}
        {insights && insights.growthAreas.length > 0 && (
          <div className="bg-amber-500/5 rounded-xl p-6 mb-6 border border-amber-500/20">
            <div className="flex items-start gap-3 mb-4">
              <div className="w-8 h-8 rounded-full bg-amber-500/20 flex items-center justify-center flex-shrink-0">
                <TrendingUp size={16} className="text-amber-600" />
              </div>
              <div className="flex-1">
                <h3 className="font-medium text-text-primary mb-1">Growth Opportunities</h3>
                <p className="text-sm text-text-secondary">Areas to focus on next time</p>
              </div>
            </div>
            <ul className="space-y-2">
              {insights.growthAreas.map((area, idx) => (
                <li key={idx} className="flex items-start gap-2 text-sm text-text-primary">
                  <AlertCircle size={16} className="text-amber-600 flex-shrink-0 mt-0.5" />
                  <span>{area}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Key Moments */}
        {insights && insights.keyMoments.length > 0 && (
          <div className="bg-surface rounded-xl p-6 mb-6 border border-border-light">
            <h3 className="font-medium text-text-primary mb-4">Key Moments</h3>
            <div className="space-y-3">
              {insights.keyMoments.map((moment, idx) => (
                <div key={idx} className="flex items-start gap-3 pb-3 border-b border-border-light last:border-0 last:pb-0">
                  <div className={cn(
                    'w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0',
                    moment.type === 'breakthrough' && 'bg-success/20',
                    moment.type === 'challenge' && 'bg-warning/20',
                    moment.type === 'technique' && 'bg-amber-500/20'
                  )}>
                    {moment.type === 'breakthrough' && <Check size={16} className="text-success" />}
                    {moment.type === 'challenge' && <AlertCircle size={16} className="text-warning" />}
                    {moment.type === 'technique' && <Target size={16} className="text-amber-600" />}
                  </div>
                  <div className="flex-1">
                    <p className="text-sm text-text-primary mb-1">{moment.description}</p>
                    <p className="text-xs text-text-secondary">
                      {moment.timestamp.toLocaleTimeString()}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Emotional Journey */}
        {insights && insights.emotionalJourney.length > 0 && (
          <div className="bg-surface rounded-xl p-6 mb-6 border border-border-light">
            <h3 className="font-medium text-text-primary mb-4">Emotional Journey</h3>
            <div className="space-y-2">
              {insights.emotionalJourney.map((point, idx) => {
                const emotionColor = point.emotion === 'receptive' ? 'bg-success' :
                                    point.emotion === 'escalation' ? 'bg-error' :
                                    point.emotion === 'deescalation' ? 'bg-amber-500' :
                                    'bg-blue-500'
                
                return (
                  <div key={idx} className="flex items-center gap-3">
                    <span className="text-xs text-text-secondary w-16">
                      {point.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                    <div className="flex-1 h-2 bg-background rounded-full overflow-hidden">
                      <div
                        className={cn('h-full rounded-full transition-all', emotionColor)}
                        style={{ width: `${point.intensity * 100}%` }}
                      />
                    </div>
                    <span className="text-xs text-text-secondary capitalize w-20 text-right">
                      {point.emotion}
                    </span>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* Goals Completed */}
        <div className="bg-surface rounded-xl p-6 mb-6 border border-border-light">
          <h3 className="font-medium text-text-primary mb-4">Your Goals</h3>
          <div className="space-y-2">
            {session.goals.map((goal) => (
              <div
                key={goal.id}
                className={cn(
                  'flex items-start gap-3 p-3 rounded-lg',
                  goal.completed ? 'bg-success/5' : 'bg-background'
                )}
              >
                <div className={cn(
                  'w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 mt-0.5',
                  goal.completed ? 'border-success bg-success' : 'border-border-medium'
                )}>
                  {goal.completed && <Check size={12} className="text-white" />}
                </div>
                <p className={cn(
                  'text-sm',
                  goal.completed ? 'text-text-primary' : 'text-text-secondary'
                )}>
                  {goal.description}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Techniques Used */}
        {insights && insights.techniquesUsed.length > 0 && (
          <div className="bg-surface rounded-xl p-6 mb-6 border border-border-light">
            <h3 className="font-medium text-text-primary mb-4">Techniques You Practiced</h3>
            <div className="flex flex-wrap gap-2">
              {insights.techniquesUsed.map((technique, idx) => (
                <span
                  key={idx}
                  className="px-3 py-1.5 rounded-full bg-amber-500/10 text-amber-700 text-sm border border-amber-500/20"
                >
                  {technique}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Body Awareness Prompt */}
        <div className="bg-gradient-to-br from-purple-500/5 to-transparent rounded-xl p-6 mb-6 border border-purple-500/20">
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-full bg-purple-500/20 flex items-center justify-center flex-shrink-0">
              <Heart size={16} className="text-purple-600" />
            </div>
            <div className="flex-1">
              <h3 className="font-medium text-text-primary mb-2">Body Check-In</h3>
              <p className="text-sm text-text-secondary mb-3">
                How is your body feeling after this practice? Notice any tension, warmth, or lightness.
              </p>
              <button className="text-sm text-purple-600 hover:text-purple-700 font-medium transition-colors">
                Start Somatic Practice →
              </button>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3">
          <button
            onClick={onDiscard}
            className="flex-1 px-4 py-3 rounded-xl text-sm font-medium bg-surface text-text-primary hover:bg-hover-surface transition-colors border border-border-light"
          >
            Discard
          </button>
          {onViewTranscript && (
            <button
              onClick={onViewTranscript}
              className="flex-1 px-4 py-3 rounded-xl text-sm font-medium bg-surface text-text-primary hover:bg-hover-surface transition-colors border border-border-light flex items-center justify-center gap-2"
            >
              <Download size={16} />
              View Transcript
            </button>
          )}
          <button
            onClick={onSave}
            className="flex-1 px-4 py-3 rounded-xl text-sm font-medium bg-amber-500 text-white hover:bg-amber-600 transition-colors flex items-center justify-center gap-2"
          >
            <Save size={16} />
            Save as Artifact
          </button>
        </div>

        {/* Next Steps */}
        <div className="mt-6 p-4 bg-background rounded-xl border border-border-light">
          <h4 className="text-sm font-medium text-text-primary mb-2">What's Next?</h4>
          <ul className="space-y-1 text-sm text-text-secondary">
            <li>• Practice this skill again to build muscle memory</li>
            <li>• Try a different skill with {session.partnerName}</li>
            <li>• Review your saved artifacts to track progress over time</li>
          </ul>
        </div>
      </div>
    </div>
  )
}

