'use client'

import { type FC, useEffect, useRef, useCallback } from 'react'
import { cn } from '@/lib/utils'
import { User, Pause, Play, ChevronLeft, ChevronRight } from '@/components/ui/Icons'
import { Mic, MicOff } from 'lucide-react'
import { useRoleplayStore } from '@/stores/useRoleplayStore'
import { usePipecat } from '@/providers/PipecatProvider'
import { usePipecatStore } from '@/stores/usePipecatStore'
import { LiveTranscriptBubble } from '@/components/chat/LiveTranscriptBubble'
import { CoachingPanel } from './CoachingPanel'
import { QuickDeviceSelector } from '@/components/voice/QuickDeviceSelector'

interface RoleplayExperienceProps {
  onEnd: () => void
}

export const RoleplayExperience: FC<RoleplayExperienceProps> = ({ onEnd }) => {
  const {
    currentSession,
    isSessionActive,
    activeHints,
    showCoachingPanel,
    pauseSession,
    resumeSession,
    dismissHint,
    toggleGoalCompleted,
    toggleCoachingPanel,
    syncFromTranscript
  } = useRoleplayStore()

  // Pipecat voice state
  const { status, isReady, client } = usePipecat()
  const {
    transcript,
    currentUserUtterance,
    currentBotUtterance,
    isUserSpeaking,
    isBotSpeaking,
    isMicEnabled,
    setMicEnabled
  } = usePipecatStore()

  // Mic toggle handler
  const handleMicToggle = useCallback(() => {
    const newState = !isMicEnabled
    if (client) {
      client.enableMic(newState)
    }
    setMicEnabled(newState)
  }, [isMicEnabled, setMicEnabled, client])

  // Note: usePipecatSync is already called in PipecatSyncWrapper at the layout level
  // Do NOT call it here or event handlers will be registered twice, doubling text

  const messagesEndRef = useRef<HTMLDivElement>(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  // Scroll when transcript or live utterances change
  useEffect(() => {
    scrollToBottom()
  }, [transcript, currentUserUtterance, currentBotUtterance])

  // Sync Pipecat transcript to roleplay store for insights generation
  useEffect(() => {
    if (transcript.length > 0) {
      syncFromTranscript(transcript.map(t => ({
        role: t.role,
        content: t.content,
        timestamp: t.timestamp
      })))
    }
  }, [transcript, syncFromTranscript])

  if (!currentSession) return null

  // Map Pipecat transcript to display messages
  const voiceMessages = transcript.map(msg => ({
    id: msg.id,
    role: msg.role === 'user' ? 'user' as const : 'partner' as const,
    content: msg.content,
    timestamp: msg.timestamp
  }))

  const userMessageCount = voiceMessages.filter(m => m.role === 'user').length

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

        {/* Messages - Voice Transcript */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {/* Initial greeting */}
          {voiceMessages.length === 0 && !currentUserUtterance && !currentBotUtterance && (
            <div className="flex justify-start">
              <div className="max-w-[75%] px-4 py-3 rounded-2xl bg-surface text-text-primary rounded-bl-sm border border-border-light">
                <p className="text-sm leading-relaxed italic">
                  *{currentSession.partnerName} is ready for the conversation.*
                </p>
              </div>
            </div>
          )}

          {/* Completed transcript messages */}
          {voiceMessages.map((msg) => (
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
              </div>
            </div>
          ))}

          {/* Live user transcription */}
          {currentUserUtterance && (
            <LiveTranscriptBubble
              role="user"
              text={currentUserUtterance}
              isInterim={isUserSpeaking}
            />
          )}

          {/* Live bot transcription */}
          {currentBotUtterance && (
            <LiveTranscriptBubble
              role="assistant"
              text={currentBotUtterance}
              isInterim={isBotSpeaking}
            />
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

        {/* Voice Status Area */}
        <div className="p-6 border-t border-border-light bg-background">
          {status !== 'connected' && (
            <div className="mb-3 px-4 py-2 rounded-lg bg-warning/10 border border-warning/20 text-warning text-sm text-center">
              {status === 'connecting' ? 'Connecting to voice...' : 'Voice disconnected'}
            </div>
          )}
          {!isReady && status === 'connected' && (
            <div className="text-center text-sm text-text-secondary py-2">
              Waiting for Ginger to be ready...
            </div>
          )}
          {isReady && (
            <div className="py-2">
              {/* Voice controls bar */}
              <div className="flex items-center justify-center gap-4 mb-3">
                {/* Device selector */}
                <QuickDeviceSelector />

                {/* Mic mute toggle */}
                <button
                  type="button"
                  onClick={handleMicToggle}
                  className={cn(
                    'p-3 rounded-full transition-colors',
                    isMicEnabled
                      ? 'text-amber-500 bg-amber-500/10 hover:bg-amber-500/20'
                      : 'text-error bg-error/10 hover:bg-error/20'
                  )}
                  aria-label={isMicEnabled ? 'Mute microphone' : 'Unmute microphone'}
                  title={isMicEnabled ? 'Mute microphone' : 'Unmute microphone'}
                >
                  {isMicEnabled ? <Mic size={20} /> : <MicOff size={20} />}
                </button>
              </div>

              {/* Status indicator */}
              <div className="flex items-center justify-center gap-2 mb-2">
                {!isMicEnabled ? (
                  <>
                    <MicOff size={18} className="text-error" />
                    <span className="text-sm text-error font-medium">Microphone muted</span>
                  </>
                ) : isUserSpeaking ? (
                  <>
                    <Mic size={18} className="text-amber-500 animate-pulse" />
                    <span className="text-sm text-amber-500 font-medium">Listening...</span>
                  </>
                ) : isBotSpeaking ? (
                  <>
                    <div className="flex gap-1">
                      <div className="w-2 h-2 rounded-full bg-success animate-bounce" style={{ animationDelay: '0ms' }} />
                      <div className="w-2 h-2 rounded-full bg-success animate-bounce" style={{ animationDelay: '150ms' }} />
                      <div className="w-2 h-2 rounded-full bg-success animate-bounce" style={{ animationDelay: '300ms' }} />
                    </div>
                    <span className="text-sm text-success font-medium">Ginger is speaking...</span>
                  </>
                ) : (
                  <>
                    <Mic size={18} className="text-text-secondary" />
                    <span className="text-sm text-text-secondary">Ready - speak to begin</span>
                  </>
                )}
              </div>
              <p className="text-xs text-text-secondary text-center">
                Say something like: &quot;Can you roleplay as {currentSession.partnerName}?&quot; to start the practice.
              </p>
            </div>
          )}
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

