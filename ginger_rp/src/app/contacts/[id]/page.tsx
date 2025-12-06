'use client'

import { use } from 'react'
import { useContactsStore } from '@/stores/useContactsStore'
import { useConsciousnessStore } from '@/stores/useConsciousnessStore'
import { useConversationStore } from '@/stores/useConversationStore'
import { User, Heart, Brain, MessageSquare, TrendingUp } from '@/components/ui/Icons'

export default function ContactDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params)
  const { getContactById } = useContactsStore()
  const { getEmotionsByContact, getMemoriesByContact } = useConsciousnessStore()
  const { getMessagesByContact, getJournalEntriesByContact } = useConversationStore()

  const contact = getContactById(decodeURIComponent(resolvedParams.id))
  const emotions = contact ? getEmotionsByContact(contact.id) : []
  const memories = contact ? getMemoriesByContact(contact.id) : []
  const messages = contact ? getMessagesByContact(contact.id) : []
  const journalEntries = contact ? getJournalEntriesByContact(contact.id) : []

  if (!contact) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-center">
          <User size={48} className="mx-auto mb-4 text-text-secondary opacity-50" />
          <h2 className="text-xl font-medium text-text-primary mb-2">Contact Not Found</h2>
          <p className="text-text-secondary">The contact you're looking for doesn't exist.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="h-full overflow-y-auto custom-scrollbar">
      <div className="max-w-6xl mx-auto p-6 space-y-6">
        {/* Header */}
        <div className="bg-surface border border-border-light rounded-xl p-6">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-full bg-voice-accent/10 flex items-center justify-center">
                <User size={32} className="text-voice-accent" />
              </div>
              <div>
                <h1 className="text-3xl font-serif font-medium text-text-primary mb-1">
                  {contact.name}
                </h1>
                <div className="flex items-center gap-2">
                  <span className={`relationship-badge relationship-badge--${contact.relationshipType}`}>
                    {contact.relationshipType}
                  </span>
                  <span className="text-sm text-text-secondary">
                    {contact.totalMessages} messages
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Stats grid */}
          <div className="grid grid-cols-3 gap-4 mt-6">
            <div className="p-4 rounded-lg bg-background border border-border-light">
              <div className="flex items-center gap-2 mb-2">
                <Heart size={16} className="text-voice-accent" />
                <span className="text-xs font-medium text-text-secondary uppercase tracking-wider">
                  Emotional Valence
                </span>
              </div>
              <p className="text-2xl font-medium text-text-primary">
                {contact.typicalValence > 0 ? '+' : ''}{(contact.typicalValence * 100).toFixed(0)}%
              </p>
            </div>

            <div className="p-4 rounded-lg bg-background border border-border-light">
              <div className="flex items-center gap-2 mb-2">
                <TrendingUp size={16} className="text-voice-accent" />
                <span className="text-xs font-medium text-text-secondary uppercase tracking-wider">
                  Intensity
                </span>
              </div>
              <p className="text-2xl font-medium text-text-primary">
                {(contact.typicalIntensity * 100).toFixed(0)}%
              </p>
            </div>

            <div className="p-4 rounded-lg bg-background border border-border-light">
              <div className="flex items-center gap-2 mb-2">
                <MessageSquare size={16} className="text-voice-accent" />
                <span className="text-xs font-medium text-text-secondary uppercase tracking-wider">
                  Recent Activity
                </span>
              </div>
              <p className="text-sm font-medium text-text-primary">
                {new Date(contact.lastInteraction).toLocaleDateString()}
              </p>
            </div>
          </div>
        </div>

        {/* Content sections */}
        <div className="grid grid-cols-2 gap-6">
          {/* Memories */}
          <div className="bg-surface border border-border-light rounded-xl p-6">
            <div className="flex items-center gap-2 mb-4">
              <Brain size={20} className="text-damasio-lens" />
              <h3 className="text-lg font-medium text-text-primary">
                Key Memories
              </h3>
              <span className="ml-auto px-2 py-0.5 rounded-full bg-damasio-lens/10 text-damasio-lens text-xs font-medium">
                {memories.length}
              </span>
            </div>
            {memories.length > 0 ? (
              <div className="space-y-2">
                {memories.slice(0, 5).map(memory => (
                  <div
                    key={memory.id}
                    className={`memory-card memory-card--${
                      memory.salience > 0.7 ? 'high' : memory.salience > 0.4 ? 'medium' : 'low'
                    }-salience`}
                  >
                    <p className="text-sm text-text-primary line-clamp-2">
                      {memory.description}
                    </p>
                    <div className="flex items-center gap-2 mt-2">
                      <div className="flex-1 h-1 bg-border-light rounded-full overflow-hidden">
                        <div
                          className="h-full bg-salience-high rounded-full"
                          style={{ width: `${memory.salience * 100}%` }}
                        />
                      </div>
                      <span className="text-xs text-text-secondary">
                        {(memory.salience * 100).toFixed(0)}%
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-text-secondary">No memories recorded yet</p>
            )}
          </div>

          {/* Emotions */}
          <div className="bg-surface border border-border-light rounded-xl p-6">
            <div className="flex items-center gap-2 mb-4">
              <Heart size={20} className="text-voice-accent" />
              <h3 className="text-lg font-medium text-text-primary">
                Emotion Events
              </h3>
              <span className="ml-auto px-2 py-0.5 rounded-full bg-voice-accent/10 text-voice-accent text-xs font-medium">
                {emotions.length}
              </span>
            </div>
            {emotions.length > 0 ? (
              <div className="space-y-2">
                {emotions.slice(0, 5).map(emotion => (
                  <div
                    key={emotion.id}
                    className="p-3 rounded-lg border border-border-light"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-text-primary capitalize">
                        {emotion.emotionType}
                      </span>
                      <span className="text-xs text-text-secondary">
                        {Math.round(emotion.intensity * 100)}%
                      </span>
                    </div>
                    {emotion.cause && (
                      <p className="text-xs text-text-secondary line-clamp-1">
                        {emotion.cause}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-text-secondary">No emotion events recorded yet</p>
            )}
          </div>
        </div>

        {/* Journal entries */}
        <div className="bg-surface border border-border-light rounded-xl p-6">
          <h3 className="text-lg font-medium text-text-primary mb-4">
            Related Journal Entries
          </h3>
          {journalEntries.length > 0 ? (
            <div className="space-y-3">
              {journalEntries.map(entry => (
                <div
                  key={entry.id}
                  className="p-4 rounded-lg border border-border-light hover:bg-hover-surface transition-colors"
                >
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-xs text-text-secondary">
                      {entry.timestamp.toLocaleDateString()}
                    </span>
                    {entry.entryType && (
                      <>
                        <span className="text-xs text-text-secondary">•</span>
                        <span className="text-xs text-text-secondary capitalize">
                          {entry.entryType}
                        </span>
                      </>
                    )}
                  </div>
                  <p className="text-sm text-text-primary line-clamp-3">
                    {entry.content.replace(/[#*_]/g, '')}
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-text-secondary">No journal entries about this contact yet</p>
          )}
        </div>
      </div>
    </div>
  )
}

