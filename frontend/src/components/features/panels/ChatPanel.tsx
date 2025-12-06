'use client'

import { type FC, useRef, useEffect } from 'react'
import { cn } from '@/lib/utils'
import { formatTime } from '@/lib/utils'
import { useGingerStore } from '@/stores/useGingerStore'
import type { Message, LensType } from '@/types'
import { LENSES } from '@/constants'
import { Save, GingerLogo, Mic, Info } from '@/components/ui/Icons'
import { VoiceInput } from '../VoiceInput'
import { ReflectModal } from '../modals/ReflectModal'
import { RoleplayModal } from '../modals/RoleplayModal'
import { PatternAnalysisModal } from '../modals/PatternAnalysisModal'
import { SomaticModal } from '../modals/SomaticModal'
import { OnboardingModal } from '../modals/OnboardingModal'
import { ArtifactsModal } from '../modals/ArtifactsModal'

// Parse message content for highlighted terms and markdown-like formatting
const formatMessageContent = (content: string, highlightedTerms?: string[]) => {
  // Simple markdown-like parsing
  let formatted = content
    // Bold: **text**
    .replace(/\*\*([^*]+)\*\*/g, '<strong class="font-semibold">$1</strong>')
    // Italic: *text*
    .replace(/\*([^*]+)\*/g, '<em>$1</em>')

  // Highlight terms
  if (highlightedTerms) {
    highlightedTerms.forEach(term => {
      const regex = new RegExp(`(${term})`, 'gi')
      formatted = formatted.replace(regex, '<span class="term-highlight">$1</span>')
    })
  }

  // Split into paragraphs
  const paragraphs = formatted.split('\n\n')

  return paragraphs
}

// Helper to get static lens background colors
const getLensBgClass = (lens: LensType) => {
  const bgClasses: Record<LensType, string> = {
    'damasio': 'bg-damasio-lens',
    'cbt': 'bg-cbt-lens',
    'act': 'bg-act-lens',
    'ifs': 'bg-ifs-lens',
    'stoic': 'bg-stoic-lens',
  }
  return bgClasses[lens] || 'bg-text-secondary'
}

const LensBadge: FC<{ lens: LensType }> = ({ lens }) => {
  const lensInfo = LENSES.find(l => l.id === lens)
  if (!lensInfo) return null

  return (
    <span className={cn('lens-badge', `lens-badge--${lens}`)}>
      <span className={cn('w-1.5 h-1.5 rounded-full', getLensBgClass(lens))} />
      {lensInfo.name} Lens
    </span>
  )
}

const MessageBubble: FC<{
  message: Message
  onSaveInsight?: () => void
}> = ({ message, onSaveInsight }) => {
  const isUser = message.role === 'user'

  if (isUser) {
    return (
      <div className="flex justify-end animate-slide-up">
        <div className="max-w-[85%]">
          <div className="message-bubble message-bubble--user">
            <p className="text-sm leading-relaxed">{message.content}</p>
          </div>
          {message.isVoiceTranscript && (
            <div className="flex items-center justify-end gap-1 mt-1 text-text-secondary">
              <Mic size={12} />
              <span className="text-xs">Voice Transcript</span>
            </div>
          )}
        </div>
      </div>
    )
  }

  // AI message
  const paragraphs = formatMessageContent(message.content, message.highlightedTerms)

  return (
    <div className="flex gap-3 animate-slide-up">
      {/* Avatar */}
      <div className="flex-shrink-0 w-8 h-8 rounded-full bg-surface border border-border-light flex items-center justify-center">
        <GingerLogo size={18} className="text-text-secondary" />
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        {/* Header */}
        <div className="flex items-center gap-2 mb-2">
          {message.lens && <LensBadge lens={message.lens} />}
          <span className="text-xs text-text-secondary font-mono">
            {formatTime(message.timestamp)}
          </span>
        </div>

        {/* Message content */}
        <div className="message-bubble message-bubble--ai space-y-3">
          {paragraphs.map((paragraph, i) => (
            <p
              key={i}
              className="text-sm leading-relaxed text-text-primary"
              dangerouslySetInnerHTML={{ __html: paragraph }}
            />
          ))}
        </div>

        {/* Save insight action */}
        {onSaveInsight && (
          <button
            onClick={onSaveInsight}
            className="flex items-center gap-1.5 mt-3 px-3 py-1.5 text-xs text-text-secondary hover:text-text-primary hover:bg-hover-surface rounded-lg transition-colors border border-transparent hover:border-border-light"
          >
            <Save size={14} />
            Save Insight
          </button>
        )}
      </div>
    </div>
  )
}

const ChatHeader: FC = () => {
  return (
    <div className="h-12 border-b border-border-light bg-surface flex items-center px-4">
      <div className="flex items-center gap-2">
        <h2 className="text-sm font-medium text-text-primary">Chat</h2>
        <Info size={16} className="text-text-secondary cursor-help" />
      </div>
    </div>
  )
}

export const ChatPanel: FC = () => {
  const { messages, saveInsight } = useGingerStore()
  const messagesEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  return (
    <div className="h-full flex flex-col bg-background">
      <ChatHeader />

      {/* Messages */}
      <div className="flex-1 overflow-y-auto custom-scrollbar px-4 py-4">
        <div className="max-w-3xl mx-auto space-y-6">
          {messages.map((message) => (
            <MessageBubble
              key={message.id}
              message={message}
              onSaveInsight={message.role === 'assistant' ? () => saveInsight(message.id) : undefined}
            />
          ))}
          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Voice input with floating lens selector */}
      <div className="border-t border-border-light">
        <div className="max-w-3xl mx-auto">
          <div className="flex items-end gap-3 px-4 pb-4 pt-4">
            <div className="flex-1">
              <VoiceInput />
            </div>
          </div>
        </div>
      </div>
      
      {/* Modals */}
      <ReflectModal />
      <RoleplayModal />
      <PatternAnalysisModal />
      <SomaticModal />
      <OnboardingModal />
      <ArtifactsModal />
    </div>
  )
}
