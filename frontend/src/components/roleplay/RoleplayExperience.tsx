'use client'

import { type FC, useState, useEffect, useRef } from 'react'
import { cn } from '@/lib/utils'
import { User, Send, Pause, Play, X, ChevronLeft, ChevronRight } from '@/components/ui/Icons'
import { useRoleplayStore } from '@/stores/useRoleplayStore'
import { CoachingPanel } from './CoachingPanel'
import type { RoleplayMessage } from '@/types'

interface RoleplayExperienceProps {
  onEnd: () => void
}

export const RoleplayExperience: FC<RoleplayExperienceProps> = ({ onEnd }) => {
  const {
    currentSession,
    isSessionActive,
    activeHints,
    showCoachingPanel,
    addUserMessage,
    pauseSession,
    resumeSession,
    dismissHint,
    toggleGoalCompleted,
    toggleCoachingPanel
  } = useRoleplayStore()

  const [inputText, setInputText] = useState('')
  const [isPartnerTyping, setIsPartnerTyping] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [currentSession?.messages])

  useEffect(() => {
    // Show typing indicator when partner is about to respond
    const lastMessage = currentSession?.messages[currentSession.messages.length - 1]
    if (lastMessage?.role === 'user') {
      setIsPartnerTyping(true)
      const timer = setTimeout(() => setIsPartnerTyping(false), 1500)
      return () => clearTimeout(timer)
    }
  }, [currentSession?.messages])

  const handleSendMessage = () => {
    if (!inputText.trim() || !isSessionActive) return
    addUserMessage(inputText)
    setInputText('')
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSendMessage()
    }
  }

  if (!currentSession) return null

  const userMessageCount = currentSession.messages.filter(m => m.role === 'user').length

  return (
    <div className="h-full flex">
      {/* Main Chat Area */}
      <div className={cn(
        'flex flex-col transition-all',
        showCoachingPanel ? 'flex-1' : 'w-full'
      )}>
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border-light bg-gradient-to-r from-amber-500/5 to-transparent">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-amber-500/20 flex items-center justify-center">
              <User size={20} className="text-amber-500" />
            </div>
            <div>
              <p className="font-medium text-text-primary">{currentSession.partnerName}</p>
              <p className="text-xs text-text-secondary">
                Practicing: {currentSession.skillName}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {currentSession.coachingLevel !== 'off' && (
              <button
                onClick={toggleCoachingPanel}
                className="p-2 rounded-lg text-text-secondary hover:text-text-primary hover:bg-hover-surface transition-colors"
                title={showCoachingPanel ? 'Hide coaching' : 'Show coaching'}
              >
                {showCoachingPanel ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
              </button>
            )}
            <button
              onClick={isSessionActive ? pauseSession : resumeSession}
              className="p-2 rounded-lg text-text-secondary hover:text-text-primary hover:bg-hover-surface transition-colors"
              title={isSessionActive ? 'Pause' : 'Resume'}
            >
              {isSessionActive ? <Pause size={18} /> : <Play size={18} />}
            </button>
            <button
              onClick={onEnd}
              className="px-4 py-2 rounded-lg text-sm font-medium bg-surface text-text-primary hover:bg-hover-surface transition-colors"
            >
              End Practice
            </button>
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {currentSession.messages.map((msg) => (
            <div
              key={msg.id}
              className={cn(
                'flex',
                msg.role === 'user' ? 'justify-end' : 'justify-start'
              )}
            >
              <div className={cn(
                'max-w-[75%] px-4 py-3 rounded-2xl',
                msg.role === 'user'
                  ? 'bg-amber-500 text-white rounded-br-sm'
                  : 'bg-surface text-text-primary rounded-bl-sm border border-border-light'
              )}>
                <p className="text-sm leading-relaxed whitespace-pre-wrap">{msg.content}</p>
                {msg.emotionalTone && msg.role === 'partner' && (
                  <div className="mt-2 pt-2 border-t border-border-light/50">
                    <span className="text-xs text-text-secondary capitalize">
                      Tone: {msg.emotionalTone}
                    </span>
                  </div>
                )}
              </div>
            </div>
          ))}
          
          {isPartnerTyping && (
            <div className="flex justify-start">
              <div className="bg-surface px-4 py-3 rounded-2xl rounded-bl-sm border border-border-light">
                <div className="flex gap-1">
                  <div className="w-2 h-2 rounded-full bg-text-secondary animate-bounce" style={{ animationDelay: '0ms' }} />
                  <div className="w-2 h-2 rounded-full bg-text-secondary animate-bounce" style={{ animationDelay: '150ms' }} />
                  <div className="w-2 h-2 rounded-full bg-text-secondary animate-bounce" style={{ animationDelay: '300ms' }} />
                </div>
              </div>
            </div>
          )}
          
          <div ref={messagesEndRef} />
        </div>

        {/* Progress Indicator */}
        <div className="px-6 py-2 bg-surface border-t border-border-light">
          <div className="flex items-center justify-between text-xs text-text-secondary">
            <span>{userMessageCount} exchanges</span>
            <span>{currentSession.goals.filter(g => g.completed).length}/{currentSession.goals.length} goals completed</span>
          </div>
        </div>

        {/* Input Area */}
        <div className="p-6 border-t border-border-light bg-background">
          {!isSessionActive && (
            <div className="mb-3 px-4 py-2 rounded-lg bg-warning/10 border border-warning/20 text-warning text-sm text-center">
              Session paused. Click Resume to continue.
            </div>
          )}
          <div className="flex items-end gap-2">
            <textarea
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={isSessionActive ? "Type your response..." : "Paused - Resume to continue"}
              disabled={!isSessionActive}
              className="flex-1 px-4 py-3 rounded-2xl border border-border-light bg-surface text-text-primary placeholder:text-text-secondary focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 resize-none disabled:opacity-50 disabled:cursor-not-allowed"
              rows={2}
              style={{ maxHeight: '120px' }}
            />
            <button
              onClick={handleSendMessage}
              disabled={!inputText.trim() || !isSessionActive}
              className={cn(
                'p-3 rounded-full transition-colors flex-shrink-0',
                inputText.trim() && isSessionActive
                  ? 'bg-amber-500 text-white hover:bg-amber-600'
                  : 'bg-surface text-text-secondary cursor-not-allowed'
              )}
            >
              <Send size={18} />
            </button>
          </div>
          <p className="text-xs text-text-secondary mt-2 text-center">
            Press Enter to send · Shift + Enter for new line
          </p>
        </div>
      </div>

      {/* Coaching Panel */}
      {showCoachingPanel && currentSession.coachingLevel !== 'off' && (
        <div className="w-80 border-l border-border-light flex-shrink-0">
          <CoachingPanel
            skillId={currentSession.skillId}
            hints={activeHints}
            goals={currentSession.goals}
            techniquesAttempted={currentSession.techniquesAttempted}
            partnerEmotionalState={currentSession.partnerEmotionalState}
            onDismissHint={dismissHint}
            onToggleGoal={toggleGoalCompleted}
          />
        </div>
      )}
    </div>
  )
}

