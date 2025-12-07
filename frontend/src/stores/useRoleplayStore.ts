'use client'

import { create } from 'zustand'
import type {
  RoleplaySession,
  RoleplayMessage,
  RoleplayGoal,
  RoleplayInsights,
  CoachingLevel,
  PartnerEmotionalState,
  CoachingHint,
  LensType
} from '@/types'
import {
  generateSkillBasedResponse,
  analyzeMessageForState,
  getSkillById
} from '@/lib/skills/communicationSkills'

interface RoleplayState {
  // Current session
  currentSession: RoleplaySession | null
  isSessionActive: boolean
  
  // Session history
  completedSessions: RoleplaySession[]
  
  // Coaching state
  activeHints: CoachingHint[]
  showCoachingPanel: boolean
  
  // Progress tracking
  skillProgress: Record<string, {
    sessionsCompleted: number
    averageScore: number
    techniquesUsed: string[]
    lastPracticed: Date
  }>
  
  // Actions - Session Management
  startSession: (config: {
    partnerId: string
    partnerName: string
    skillId: string
    scenario: string
    goals: string[]
    coachingLevel: CoachingLevel
    activeLens?: LensType
  }) => void
  endSession: () => void
  pauseSession: () => void
  resumeSession: () => void
  
  // Actions - Messaging
  addUserMessage: (content: string) => void
  addPartnerMessage: (content: string, emotionalTone?: string) => void
  generatePartnerResponse: (userMessage: string) => void
  
  // Actions - Coaching
  addHint: (content: string, type: CoachingHint['type']) => void
  dismissHint: (hintId: string) => void
  toggleCoachingPanel: () => void
  markTechniqueUsed: (technique: string) => void
  
  // Actions - Goals
  toggleGoalCompleted: (goalId: string) => void
  
  // Actions - Insights
  generateInsights: () => RoleplayInsights
  saveSession: () => void
  
  // Getters
  getSessionsBySkill: (skillId: string) => RoleplaySession[]
  getSkillProgress: (skillId: string) => {
    sessionsCompleted: number
    averageScore: number
    techniquesUsed: string[]
    lastPracticed: Date
  } | null
}

export const useRoleplayStore = create<RoleplayState>((set, get) => ({
  // Initial state
  currentSession: null,
  isSessionActive: false,
  completedSessions: [],
  activeHints: [],
  showCoachingPanel: true,
  skillProgress: {},
  
  // Start a new roleplay session
  startSession: (config) => {
    const skill = getSkillById(config.skillId)
    
    const goals: RoleplayGoal[] = config.goals.map((goal, idx) => ({
      id: `goal_${idx}`,
      description: goal,
      completed: false
    }))
    
    const initialMessage: RoleplayMessage = {
      id: '0',
      role: 'partner',
      content: `*${config.partnerName} is ready to practice this conversation with you. Take a moment to ground yourself, then begin when you're ready.*`,
      timestamp: new Date()
    }
    
    const newSession: RoleplaySession = {
      id: `session_${Date.now()}`,
      partnerId: config.partnerId,
      partnerName: config.partnerName,
      skillId: config.skillId,
      skillName: skill?.name || 'Communication Practice',
      scenario: config.scenario,
      goals,
      coachingLevel: config.coachingLevel,
      messages: [initialMessage],
      startedAt: new Date(),
      partnerEmotionalState: 'opening',
      techniquesAttempted: [],
      activeLens: config.activeLens
    }
    
    set({
      currentSession: newSession,
      isSessionActive: true,
      activeHints: [],
      showCoachingPanel: config.coachingLevel !== 'off'
    })
    
    // Add initial coaching hint
    if (config.coachingLevel !== 'off') {
      get().addHint(
        `Remember to ${skill?.keyTechniques[0].toLowerCase() || 'stay present and engaged'}`,
        'technique'
      )
    }
  },
  
  // End the current session
  endSession: () => {
    const session = get().currentSession
    if (!session) return
    
    const endedSession = {
      ...session,
      endedAt: new Date(),
      duration: Math.floor((new Date().getTime() - session.startedAt.getTime()) / 1000),
      insights: get().generateInsights()
    }
    
    set((state) => ({
      currentSession: endedSession,
      isSessionActive: false
    }))
  },
  
  pauseSession: () => set({ isSessionActive: false }),
  
  resumeSession: () => set({ isSessionActive: true }),
  
  // Add a user message
  addUserMessage: (content) => {
    const session = get().currentSession
    if (!session) return
    
    const userMessage: RoleplayMessage = {
      id: String(Date.now()),
      role: 'user',
      content,
      timestamp: new Date()
    }
    
    set((state) => ({
      currentSession: state.currentSession ? {
        ...state.currentSession,
        messages: [...state.currentSession.messages, userMessage]
      } : null
    }))
    
    // Generate partner response after a delay
    setTimeout(() => {
      get().generatePartnerResponse(content)
    }, 1500)
  },
  
  // Add a partner message
  addPartnerMessage: (content, emotionalTone) => {
    const session = get().currentSession
    if (!session) return
    
    const partnerMessage: RoleplayMessage = {
      id: String(Date.now() + 1),
      role: 'partner',
      content,
      timestamp: new Date(),
      emotionalTone
    }
    
    set((state) => ({
      currentSession: state.currentSession ? {
        ...state.currentSession,
        messages: [...state.currentSession.messages, partnerMessage]
      } : null
    }))
  },
  
  // Generate AI partner response
  generatePartnerResponse: (userMessage) => {
    const session = get().currentSession
    if (!session) return
    
    // Analyze user message to determine next emotional state
    const nextState = analyzeMessageForState(
      userMessage,
      session.partnerEmotionalState,
      session.skillId
    )
    
    // Generate response based on skill and emotional state
    const response = generateSkillBasedResponse(
      session.skillId,
      userMessage,
      session.messages.length,
      nextState
    )
    
    // Update session state
    set((state) => ({
      currentSession: state.currentSession ? {
        ...state.currentSession,
        partnerEmotionalState: nextState
      } : null
    }))
    
    // Add partner message
    get().addPartnerMessage(response, nextState)
    
    // Generate coaching hints based on progress
    const skill = getSkillById(session.skillId)
    if (session.coachingLevel === 'active' && skill) {
      // Provide hints based on emotional state
      if (nextState === 'escalation') {
        get().addHint(
          'The conversation is escalating. Take a breath and try validating their feelings.',
          'warning'
        )
      } else if (nextState === 'receptive') {
        get().addHint(
          'Great job! They\'re becoming more receptive to your approach.',
          'encouragement'
        )
      } else if (session.messages.length > 4 && session.techniquesAttempted.length < 2) {
        const unusedTechnique = skill.keyTechniques.find(
          t => !session.techniquesAttempted.some(used => t.includes(used))
        )
        if (unusedTechnique) {
          get().addHint(
            `Try: ${unusedTechnique}`,
            'technique'
          )
        }
      }
    }
  },
  
  // Add a coaching hint
  addHint: (content, type) => {
    const newHint: CoachingHint = {
      id: `hint_${Date.now()}`,
      content,
      type,
      dismissed: false
    }
    
    set((state) => ({
      activeHints: [...state.activeHints, newHint]
    }))
    
    // Auto-dismiss encouragement hints after 5 seconds
    if (type === 'encouragement') {
      setTimeout(() => {
        get().dismissHint(newHint.id)
      }, 5000)
    }
  },
  
  // Dismiss a coaching hint
  dismissHint: (hintId) => {
    set((state) => ({
      activeHints: state.activeHints.filter(hint => hint.id !== hintId)
    }))
  },
  
  // Toggle coaching panel visibility
  toggleCoachingPanel: () => {
    set((state) => ({
      showCoachingPanel: !state.showCoachingPanel
    }))
  },
  
  // Mark a technique as used
  markTechniqueUsed: (technique) => {
    set((state) => ({
      currentSession: state.currentSession ? {
        ...state.currentSession,
        techniquesAttempted: [...state.currentSession.techniquesAttempted, technique]
      } : null
    }))
  },
  
  // Toggle goal completion
  toggleGoalCompleted: (goalId) => {
    set((state) => ({
      currentSession: state.currentSession ? {
        ...state.currentSession,
        goals: state.currentSession.goals.map(goal =>
          goal.id === goalId ? { ...goal, completed: !goal.completed } : goal
        )
      } : null
    }))
  },
  
  // Generate insights for the session
  generateInsights: (): RoleplayInsights => {
    const session = get().currentSession
    if (!session) {
      return {
        techniquesUsed: [],
        emotionalJourney: [],
        highlights: [],
        growthAreas: [],
        keyMoments: []
      }
    }
    
    const skill = getSkillById(session.skillId)
    const userMessages = session.messages.filter(m => m.role === 'user')
    
    // Analyze techniques used
    const techniquesUsed = session.techniquesAttempted
    
    // Build emotional journey
    const emotionalJourney = session.messages
      .filter(m => m.role === 'partner' && m.emotionalTone)
      .map(m => ({
        timestamp: m.timestamp,
        emotion: m.emotionalTone || 'neutral',
        intensity: m.emotionalTone === 'receptive' ? 0.3 : 
                   m.emotionalTone === 'escalation' ? 0.9 : 0.6
      }))
    
    // Generate highlights
    const highlights: string[] = []
    const goalsCompleted = session.goals.filter(g => g.completed).length
    
    if (goalsCompleted > 0) {
      highlights.push(`Achieved ${goalsCompleted} of ${session.goals.length} goals`)
    }
    
    if (session.partnerEmotionalState === 'receptive') {
      highlights.push('Successfully reached a receptive state with your partner')
    }
    
    if (techniquesUsed.length >= 3) {
      highlights.push(`Applied ${techniquesUsed.length} different communication techniques`)
    }
    
    const receptiveCount = session.messages.filter(
      m => m.emotionalTone === 'receptive'
    ).length
    if (receptiveCount >= 2) {
      highlights.push('Maintained a positive connection throughout the conversation')
    }
    
    // Generate growth areas
    const growthAreas: string[] = []
    
    if (skill) {
      const unusedTechniques = skill.keyTechniques.filter(
        t => !techniquesUsed.some(used => t.toLowerCase().includes(used.toLowerCase()))
      )
      if (unusedTechniques.length > 0) {
        growthAreas.push(`Try incorporating: ${unusedTechniques[0]}`)
      }
    }
    
    const escalationCount = session.messages.filter(
      m => m.emotionalTone === 'escalation'
    ).length
    if (escalationCount >= 2) {
      growthAreas.push('Work on de-escalation techniques when tension rises')
    }
    
    if (goalsCompleted < session.goals.length) {
      growthAreas.push('Continue working toward your stated goals')
    }
    
    // Identify key moments
    const keyMoments = session.messages
      .map((msg, idx) => {
        if (msg.role === 'partner' && idx > 0) {
          const prevMsg = session.messages[idx - 1]
          if (prevMsg.emotionalTone === 'escalation' && msg.emotionalTone === 'deescalation') {
            return {
              timestamp: msg.timestamp,
              description: 'Successfully de-escalated tension',
              type: 'breakthrough' as const
            }
          }
          if (msg.emotionalTone === 'receptive') {
            return {
              timestamp: msg.timestamp,
              description: 'Partner became receptive to your approach',
              type: 'breakthrough' as const
            }
          }
        }
        return null
      })
      .filter((moment): moment is NonNullable<typeof moment> => moment !== null)
    
    // Calculate overall score
    const scoreFactors = [
      goalsCompleted / session.goals.length,
      techniquesUsed.length / (skill?.keyTechniques.length || 1),
      receptiveCount / Math.max(1, session.messages.length / 4),
      1 - (escalationCount / Math.max(1, session.messages.length / 4))
    ]
    const overallScore = Math.round(
      (scoreFactors.reduce((a, b) => a + b, 0) / scoreFactors.length) * 100
    )
    
    return {
      techniquesUsed,
      emotionalJourney,
      highlights: highlights.length > 0 ? highlights : ['Completed practice session'],
      growthAreas: growthAreas.length > 0 ? growthAreas : ['Keep practicing regularly'],
      overallScore: Math.min(100, Math.max(0, overallScore)),
      keyMoments
    }
  },
  
  // Save the current session
  saveSession: () => {
    const session = get().currentSession
    if (!session || !session.endedAt) return
    
    const skillId = session.skillId
    const currentProgress = get().skillProgress[skillId] || {
      sessionsCompleted: 0,
      averageScore: 0,
      techniquesUsed: [],
      lastPracticed: new Date()
    }
    
    const newScore = session.insights?.overallScore || 0
    const newAverage = Math.round(
      (currentProgress.averageScore * currentProgress.sessionsCompleted + newScore) /
      (currentProgress.sessionsCompleted + 1)
    )
    
    const allTechniques = Array.from(new Set([
      ...currentProgress.techniquesUsed,
      ...session.techniquesAttempted
    ]))
    
    set((state) => ({
      completedSessions: [session, ...state.completedSessions],
      skillProgress: {
        ...state.skillProgress,
        [skillId]: {
          sessionsCompleted: currentProgress.sessionsCompleted + 1,
          averageScore: newAverage,
          techniquesUsed: allTechniques,
          lastPracticed: new Date()
        }
      },
      currentSession: null,
      isSessionActive: false,
      activeHints: []
    }))
  },
  
  // Get sessions by skill
  getSessionsBySkill: (skillId) => {
    return get().completedSessions.filter(s => s.skillId === skillId)
  },
  
  // Get skill progress
  getSkillProgress: (skillId) => {
    return get().skillProgress[skillId] || null
  }
}))

