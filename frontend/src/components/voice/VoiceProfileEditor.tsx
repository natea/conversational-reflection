'use client'

import { type FC, useState } from 'react'
import { cn } from '@/lib/utils'
import type { VoiceProfile } from '@/types'
import { Volume2, Play, Check, Sparkles } from '@/components/ui/Icons'

interface VoiceProfileEditorProps {
  initialProfile: VoiceProfile
  onSave: (profile: VoiceProfile) => void
  onCancel: () => void
  contactName?: string
}

const TYPICAL_EMOTIONS = [
  'affectionate', 'angry', 'anxious', 'calm', 'caring', 'cheerful',
  'concerned', 'confident', 'disappointed', 'excited', 'frustrated',
  'gentle', 'happy', 'hopeful', 'nervous', 'playful', 'sad',
  'sarcastic', 'supportive', 'thoughtful', 'worried'
]

const GENDER_OPTIONS = ['male', 'female', 'nonbinary']
const AGE_RANGES = ['teens', '20s', '30s', '40s', '50s', '60s', '70+']
const ACCENTS = [
  'American', 'British', 'Australian', 'Canadian', 'Indian',
  'Scottish', 'Irish', 'Southern US', 'New York', 'Other'
]
const SPEAKING_STYLES = [
  'conversational', 'formal', 'casual', 'expressive', 'measured',
  'rapid', 'slow', 'energetic', 'calm', 'professional'
]

export const VoiceProfileEditor: FC<VoiceProfileEditorProps> = ({
  initialProfile,
  onSave,
  onCancel,
  contactName
}) => {
  const [profile, setProfile] = useState<VoiceProfile>(initialProfile)
  const [isPreviewing, setIsPreviewing] = useState(false)

  const handlePreview = () => {
    setIsPreviewing(true)
    // Simulate preview generation
    setTimeout(() => setIsPreviewing(false), 3000)
  }

  const toggleEmotion = (emotion: string) => {
    setProfile(prev => ({
      ...prev,
      typicalEmotions: prev.typicalEmotions.includes(emotion)
        ? prev.typicalEmotions.filter(e => e !== emotion)
        : [...prev.typicalEmotions, emotion]
    }))
  }

  const updateDescription = () => {
    // Auto-generate description from components
    const parts = []
    if (profile.gender) parts.push(`${profile.gender.charAt(0).toUpperCase() + profile.gender.slice(1)} voice`)
    if (profile.ageRange) parts.push(`in their ${profile.ageRange}`)
    if (profile.accent) parts.push(`${profile.accent} accent`)
    if (profile.speakingStyle) parts.push(`${profile.speakingStyle} pacing`)
    
    const description = parts.join(', ')
    setProfile(prev => ({ ...prev, description }))
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center">
        <div className="w-16 h-16 rounded-full bg-voice-accent/10 flex items-center justify-center mx-auto mb-4">
          <Volume2 size={32} className="text-voice-accent" />
        </div>
        <h2 className="text-2xl font-serif font-medium text-text-primary mb-2">
          Voice Profile{contactName && ` for ${contactName}`}
        </h2>
        <p className="text-text-secondary text-sm">
          Configure how Maya1 should voice this person's messages
        </p>
      </div>

      {/* Natural Language Description */}
      <div>
        <label className="block text-sm font-medium text-text-primary mb-2">
          Natural Language Description
        </label>
        <textarea
          value={profile.description}
          onChange={(e) => setProfile(prev => ({ ...prev, description: e.target.value }))}
          placeholder="e.g., Female voice in her 30s, warm timbre, conversational pacing, occasionally frustrated"
          className="w-full h-24 px-4 py-3 rounded-lg border border-border-light bg-surface text-text-primary placeholder:text-text-secondary focus:outline-none focus:ring-2 focus:ring-voice-accent/20 focus:border-voice-accent resize-none text-sm"
        />
        <div className="flex items-center justify-between mt-2">
          <button
            onClick={updateDescription}
            className="text-xs text-voice-accent hover:text-voice-accent/80 flex items-center gap-1"
          >
            <Sparkles size={12} />
            Auto-generate from settings below
          </button>
          <button
            onClick={handlePreview}
            disabled={isPreviewing}
            className={cn(
              'flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors',
              isPreviewing
                ? 'bg-surface text-text-secondary cursor-wait'
                : 'bg-voice-accent text-white hover:bg-voice-accent/90'
            )}
          >
            <Play size={12} />
            {isPreviewing ? 'Generating...' : 'Preview Voice'}
          </button>
        </div>
      </div>

      {/* Voice Characteristics Grid */}
      <div className="grid grid-cols-2 gap-4">
        {/* Gender */}
        <div>
          <label className="block text-sm font-medium text-text-primary mb-2">
            Gender
          </label>
          <select
            value={profile.gender || ''}
            onChange={(e) => setProfile(prev => ({ ...prev, gender: e.target.value || undefined }))}
            className="w-full px-3 py-2 rounded-lg border border-border-light bg-surface text-text-primary text-sm focus:outline-none focus:ring-2 focus:ring-voice-accent/20 focus:border-voice-accent"
          >
            <option value="">Not specified</option>
            {GENDER_OPTIONS.map(option => (
              <option key={option} value={option}>
                {option.charAt(0).toUpperCase() + option.slice(1)}
              </option>
            ))}
          </select>
        </div>

        {/* Age Range */}
        <div>
          <label className="block text-sm font-medium text-text-primary mb-2">
            Age Range
          </label>
          <select
            value={profile.ageRange || ''}
            onChange={(e) => setProfile(prev => ({ ...prev, ageRange: e.target.value || undefined }))}
            className="w-full px-3 py-2 rounded-lg border border-border-light bg-surface text-text-primary text-sm focus:outline-none focus:ring-2 focus:ring-voice-accent/20 focus:border-voice-accent"
          >
            <option value="">Not specified</option>
            {AGE_RANGES.map(option => (
              <option key={option} value={option}>{option}</option>
            ))}
          </select>
        </div>

        {/* Accent */}
        <div>
          <label className="block text-sm font-medium text-text-primary mb-2">
            Accent
          </label>
          <select
            value={profile.accent || ''}
            onChange={(e) => setProfile(prev => ({ ...prev, accent: e.target.value || undefined }))}
            className="w-full px-3 py-2 rounded-lg border border-border-light bg-surface text-text-primary text-sm focus:outline-none focus:ring-2 focus:ring-voice-accent/20 focus:border-voice-accent"
          >
            <option value="">Not specified</option>
            {ACCENTS.map(option => (
              <option key={option} value={option}>{option}</option>
            ))}
          </select>
        </div>

        {/* Speaking Style */}
        <div>
          <label className="block text-sm font-medium text-text-primary mb-2">
            Speaking Style
          </label>
          <select
            value={profile.speakingStyle || ''}
            onChange={(e) => setProfile(prev => ({ ...prev, speakingStyle: e.target.value || undefined }))}
            className="w-full px-3 py-2 rounded-lg border border-border-light bg-surface text-text-primary text-sm focus:outline-none focus:ring-2 focus:ring-voice-accent/20 focus:border-voice-accent"
          >
            <option value="">Not specified</option>
            {SPEAKING_STYLES.map(option => (
              <option key={option} value={option}>
                {option.charAt(0).toUpperCase() + option.slice(1)}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Typical Emotions */}
      <div>
        <label className="block text-sm font-medium text-text-primary mb-2">
          Typical Emotions
          <span className="text-text-secondary font-normal ml-2">
            (Select emotions commonly expressed by this person)
          </span>
        </label>
        <div className="flex flex-wrap gap-2">
          {TYPICAL_EMOTIONS.map(emotion => {
            const isSelected = profile.typicalEmotions.includes(emotion)
            return (
              <button
                key={emotion}
                onClick={() => toggleEmotion(emotion)}
                className={cn(
                  'px-3 py-1.5 rounded-lg text-sm font-medium transition-all',
                  isSelected
                    ? 'bg-voice-accent text-white'
                    : 'bg-surface border border-border-light text-text-secondary hover:text-text-primary hover:border-border-medium'
                )}
              >
                {isSelected && <Check size={12} className="inline mr-1" />}
                {emotion}
              </button>
            )
          })}
        </div>
      </div>

      {/* Actions */}
      <div className="flex gap-3 pt-4 border-t border-border-light">
        <button
          onClick={onCancel}
          className="flex-1 px-6 py-3 rounded-lg text-sm font-medium bg-surface text-text-primary hover:bg-hover-surface transition-colors"
        >
          Cancel
        </button>
        <button
          onClick={() => onSave(profile)}
          className="flex-1 px-6 py-3 rounded-lg text-sm font-medium bg-voice-accent text-white hover:bg-voice-accent/90 transition-colors"
        >
          Save Voice Profile
        </button>
      </div>
    </div>
  )
}

