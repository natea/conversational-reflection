'use client'

import { type FC, useRef, useEffect, useState } from 'react'
import { cn } from '@/lib/utils'
import { formatTime } from '@/lib/utils'
import { useConversationStore } from '@/stores/useConversationStore'
import { useContactsStore } from '@/stores/useContactsStore'
import { useUIStore } from '@/stores/useUIStore'
import { useConsciousnessStore } from '@/stores/useConsciousnessStore'
import { usePipecatStore } from '@/stores/usePipecatStore'
import type { Message, LensType } from '@/types'
import { LENSES } from '@/constants'
import { Save, GingerLogo, Mic, Info, User, ChevronDown, Calendar, FileText } from '@/components/ui/Icons'
import { LiveVoiceInput } from '../LiveVoiceInput'
import { MessageVoiceButton } from '@/components/voice/MessageVoiceButton'
import { LiveTranscriptBubble } from '@/components/chat/LiveTranscriptBubble'

// Parse message content for highlighted terms and markdown-like formatting
const formatMessageContent = (content: string, highlightedTerms?: string[]) => {
  let formatted = content
    .replace(/\*\*([^*]+)\*\*/g, '<strong class="font-semibold">$1</strong>')
    .replace(/\*([^*]+)\*/g, '<em>$1</em>')

  if (highlightedTerms) {
    highlightedTerms.forEach(term => {
      const regex = new RegExp(`(${term})`, 'gi')
      formatted = formatted.replace(regex, '<span class="term-highlight">$1</span>')
    })
  }

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
  onSaveToJournal?: () => void
  contactName?: string
}> = ({ message, onSaveInsight, onSaveToJournal, contactName }) => {
  const isUser = message.role === 'user'
  const isContact = message.role === 'contact'
  const { getContactById } = useContactsStore()
  const contact = message.contactId ? getContactById(message.contactId) : null

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

  if (isContact && contact) {
    return (
      <div className="flex gap-3 animate-slide-up">
        <div className="flex-shrink-0 w-8 h-8 rounded-full bg-voice-contact/10 flex items-center justify-center">
          <User size={18} className="text-voice-contact" />
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-sm font-medium text-text-primary">{contact.name}</span>
            <span className="text-xs text-text-secondary font-mono">
              {formatTime(message.timestamp)}
            </span>
          </div>

          <div className="p-3 rounded-2xl rounded-tl-sm bg-surface border border-border-light">
            <p className="text-sm leading-relaxed text-text-primary">{message.content}</p>
          </div>

          {/* Voice playback */}
          <div className="mt-2">
            <MessageVoiceButton
              messageId={message.id}
              text={message.content}
              voiceProfile={contact.voiceProfile}
              speakerName={contact.name}
              compact
            />
          </div>
        </div>
      </div>
    )
  }

  // AI message
  const paragraphs = formatMessageContent(message.content, message.highlightedTerms)

  return (
    <div className="flex gap-3 animate-slide-up">
      <div className="flex-shrink-0 w-8 h-8 rounded-full bg-surface border border-border-light flex items-center justify-center">
        <GingerLogo size={18} className="text-text-secondary" />
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-2">
          {message.lens && <LensBadge lens={message.lens} />}
          <span className="text-xs text-text-secondary font-mono">
            {formatTime(message.timestamp)}
          </span>
        </div>

        <div className="message-bubble message-bubble--ai space-y-3">
          {paragraphs.map((paragraph, i) => (
            <p
              key={i}
              className="text-sm leading-relaxed text-text-primary"
              dangerouslySetInnerHTML={{ __html: paragraph }}
            />
          ))}
        </div>

        <div className="flex items-center gap-2 mt-3">
          {onSaveInsight && (
            <button
              onClick={onSaveInsight}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-text-secondary hover:text-text-primary hover:bg-hover-surface rounded-lg transition-colors border border-transparent hover:border-border-light"
            >
              <Save size={14} />
              Save Insight
            </button>
          )}
          {onSaveToJournal && (
            <button
              onClick={onSaveToJournal}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-text-secondary hover:text-text-primary hover:bg-hover-surface rounded-lg transition-colors border border-transparent hover:border-border-light"
            >
              <FileText size={14} />
              Save to Journal
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

const ChatHeader: FC = () => {
  const [showContactSelector, setShowContactSelector] = useState(false)
  const [showTimeRange, setShowTimeRange] = useState(false)
  const { contacts, selectedContactId, selectContact } = useContactsStore()
  const { isImporting, importProgress } = useConversationStore()
  const { addEmotionEvent } = useConsciousnessStore()

  const selectedContact = selectedContactId ? contacts.find(c => c.id === selectedContactId) : null

  const handleImport = () => {
    // Mock import - in production this would trigger iMessage import
    console.log('Import messages for:', selectedContact?.name)
  }

  return (
    <div className="border-b border-border-light bg-surface">
      <div className="flex items-center justify-between px-4 py-3">
        <div className="flex items-center gap-3">
          <h2 className="text-sm font-medium text-text-primary">Reflect</h2>
          <Info size={16} className="text-text-secondary cursor-help" />
        </div>

        <div className="flex items-center gap-2">
          {/* Time range picker */}
          <div className="relative">
            <button
              onClick={() => setShowTimeRange(!showTimeRange)}
              className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium bg-surface border border-border-light text-text-secondary hover:text-text-primary hover:border-border-medium transition-colors"
            >
              <Calendar size={14} />
              Last 7 days
              <ChevronDown size={12} />
            </button>
          </div>

          {/* Contact selector */}
          <div className="relative">
            <button
              onClick={() => setShowContactSelector(!showContactSelector)}
              className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium bg-surface border border-border-light text-text-primary hover:border-border-medium transition-colors"
            >
              <User size={14} />
              {selectedContact ? selectedContact.name : 'All Contacts'}
              <ChevronDown size={12} />
            </button>

            {showContactSelector && (
              <>
                <div
                  className="fixed inset-0 z-40"
                  onClick={() => setShowContactSelector(false)}
                />
                <div className="absolute right-0 top-full mt-2 w-56 bg-surface border border-border-light rounded-lg shadow-lg z-50 py-2 max-h-64 overflow-y-auto custom-scrollbar">
                  <button
                    onClick={() => {
                      selectContact(null)
                      setShowContactSelector(false)
                    }}
                    className="w-full px-4 py-2 text-left text-sm text-text-primary hover:bg-hover-surface transition-colors"
                  >
                    All Contacts
                  </button>
                  <div className="h-px bg-border-light my-1" />
                  {contacts.map(contact => (
                    <button
                      key={contact.id}
                      onClick={() => {
                        selectContact(contact.id)
                        setShowContactSelector(false)
                      }}
                      className={cn(
                        'w-full px-4 py-2 text-left text-sm transition-colors',
                        selectedContactId === contact.id
                          ? 'bg-voice-accent/10 text-voice-accent'
                          : 'text-text-primary hover:bg-hover-surface'
                      )}
                    >
                      <div className="flex items-center gap-2">
                        <User size={14} />
                        {contact.name}
                      </div>
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>

          {/* Import button */}
          {selectedContact && (
            <button
              onClick={handleImport}
              disabled={isImporting}
              className={cn(
                'px-3 py-1.5 rounded-lg text-xs font-medium transition-colors',
                isImporting
                  ? 'bg-surface text-text-secondary cursor-wait'
                  : 'bg-voice-accent text-white hover:bg-voice-accent/90'
              )}
            >
              {isImporting ? `Importing ${Math.round(importProgress * 100)}%` : 'Import Messages'}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

export const EnhancedChatPanel: FC = () => {
  const { messages, addJournalEntry } = useConversationStore()
  const {
    currentUserUtterance,
    currentBotUtterance,
    isUserSpeaking,
    isBotSpeaking,
    connectionStatus,
  } = usePipecatStore()
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const isConnected = connectionStatus === 'connected'

  // Scroll to bottom when messages change or when live transcripts update
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, currentUserUtterance, currentBotUtterance])

  const handleSaveInsight = (messageId: string) => {
    const message = messages.find((m) => m.id === messageId)
    if (!message) return

    // In the old store, this was saved as an artifact
    // Now we could also save it to journal
    console.log('Save insight:', messageId)
  }

  const handleSaveToJournal = (messageId: string) => {
    const message = messages.find((m) => m.id === messageId)
    if (!message) return

    addJournalEntry({
      content: `# Reflection\n\n${message.content}`,
      entryType: 'reflection',
      relatedMessageIds: [messageId]
    })
  }

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
              onSaveInsight={message.role === 'assistant' ? () => handleSaveInsight(message.id) : undefined}
              onSaveToJournal={message.role === 'assistant' ? () => handleSaveToJournal(message.id) : undefined}
            />
          ))}

          {/* Live interim transcripts */}
          {isConnected && currentUserUtterance && (
            <LiveTranscriptBubble
              role="user"
              text={currentUserUtterance}
              isInterim
            />
          )}
          {isConnected && currentBotUtterance && (
            <LiveTranscriptBubble
              role="assistant"
              text={currentBotUtterance}
              isInterim
            />
          )}

          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Voice input */}
      <div className="border-t border-border-light">
        <div className="max-w-3xl mx-auto">
          <div className="flex items-end gap-3 px-4 pb-4 pt-4">
            <div className="flex-1">
              <LiveVoiceInput />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

