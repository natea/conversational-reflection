'use client'

import { useState, useEffect } from 'react'
import { useRoleplayStore } from '@/stores/useRoleplayStore'
import { useGingerStore } from '@/stores/useGingerStore'
import { RoleplayCustomization } from '@/components/roleplay/RoleplayCustomization'
import { RoleplayExperience } from '@/components/roleplay/RoleplayExperience'
import { RoleplaySummary } from '@/components/roleplay/RoleplaySummary'
import { MessageCircle } from '@/components/ui/Icons'

type RoleplayStage = 'setup' | 'practice' | 'summary'

export default function RoleplayPage() {
  const [stage, setStage] = useState<RoleplayStage>('setup')
  const { startSession, endSession, currentSession, saveSession } = useRoleplayStore()
  const { addArtifact } = useGingerStore()

  // Check if there's an active session
  useEffect(() => {
    if (currentSession) {
      if (currentSession.endedAt) {
        setStage('summary')
      } else {
        setStage('practice')
      }
    } else {
      setStage('setup')
    }
  }, [currentSession])

  const handleStartSession = (config: Parameters<typeof startSession>[0]) => {
    startSession(config)
    setStage('practice')
  }

  const handleEndSession = () => {
    endSession()
    setStage('summary')
  }

  const handleSaveSession = () => {
    if (!currentSession) return
    
    // Save to artifacts
    addArtifact({
      type: 'reflection',
      title: `Roleplay: ${currentSession.skillName} with ${currentSession.partnerName}`,
      description: `Practiced ${currentSession.skillName}. ${currentSession.messages.length - 1} exchanges. Score: ${currentSession.insights?.overallScore || 'N/A'}/100`,
      date: new Date()
    })
    
    // Save to roleplay store
    saveSession()
    
    // Reset to setup
    setStage('setup')
  }

  const handleDiscardSession = () => {
    setStage('setup')
  }

  const handleCancelSetup = () => {
    setStage('setup')
  }

  return (
    <div className="h-full flex flex-col bg-background">
      {/* Header - Only show when in setup */}
      {stage === 'setup' && (
        <div className="border-b border-border-light bg-gradient-to-r from-amber-500/5 to-transparent">
          <div className="max-w-6xl mx-auto px-6 py-8">
            <div className="flex items-center gap-4 mb-4">
              <div className="w-12 h-12 rounded-xl bg-amber-500/20 flex items-center justify-center">
                <MessageCircle size={24} className="text-amber-500" />
              </div>
              <div>
                <h1 className="text-3xl font-serif font-medium text-text-primary">
                  Roleplay Practice
                </h1>
                <p className="text-text-secondary">
                  Practice difficult conversations in a safe, guided environment
                </p>
              </div>
            </div>
            
            {/* Info Cards */}
            <div className="grid grid-cols-3 gap-4 mt-6">
              <div className="bg-surface rounded-lg p-4 border border-border-light">
                <h3 className="font-medium text-text-primary mb-1">Choose Your Partner</h3>
                <p className="text-sm text-text-secondary">
                  Practice with someone from your contacts or create a custom partner
                </p>
              </div>
              <div className="bg-surface rounded-lg p-4 border border-border-light">
                <h3 className="font-medium text-text-primary mb-1">Select a Skill</h3>
                <p className="text-sm text-text-secondary">
                  Focus on specific communication techniques like boundaries or conflict resolution
                </p>
              </div>
              <div className="bg-surface rounded-lg p-4 border border-border-light">
                <h3 className="font-medium text-text-primary mb-1">Get Real-Time Coaching</h3>
                <p className="text-sm text-text-secondary">
                  Receive hints and feedback as you practice the conversation
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className="flex-1 overflow-hidden">
        {stage === 'setup' && (
          <div className="max-w-4xl mx-auto h-full">
            <RoleplayCustomization
              onStart={handleStartSession}
              onCancel={handleCancelSetup}
            />
          </div>
        )}

        {stage === 'practice' && (
          <RoleplayExperience onEnd={handleEndSession} />
        )}

        {stage === 'summary' && currentSession && (
          <RoleplaySummary
            session={currentSession}
            onSave={handleSaveSession}
            onDiscard={handleDiscardSession}
          />
        )}
      </div>
    </div>
  )
}

