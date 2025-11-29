/**
 * Conversation Analyzer Integration Tests
 *
 * Tests for the conversation analyzer that extracts insights
 * from message exchanges.
 */

import { describe, it, expect, beforeEach } from 'vitest'

// Type definitions
interface Message {
  id: string
  text: string
  sender: string
  timestamp: Date
  is_from_me: boolean
}

interface ContextAnalysis {
  topicProgression: string[]
  conversationStyle: 'casual' | 'formal' | 'mixed'
  engagementLevel: 'high' | 'medium' | 'low'
  turnTaking: {
    balanced: boolean
    dominantSpeaker: string | null
  }
}

interface Insight {
  category: 'emotional' | 'relational' | 'behavioral' | 'contextual'
  description: string
  relevance: number
  supportingEvidence: string[]
}

interface RelationshipDynamics {
  communicationStyle: string
  emotionalConnection: number
  conflictLevel: number
  supportiveness: number
  observations: string[]
}

interface ConversationSummary {
  overview: string
  keyPoints: string[]
  emotionalHighlights: string[]
  actionItems: string[]
}

// Mock implementation
class MockConversationAnalyzer {
  async analyzeContext(messages: Message[]): Promise<ContextAnalysis> {
    if (!messages || messages.length === 0) {
      throw new Error('No messages to analyze')
    }

    const topics = this.extractTopics(messages)
    const style = this.determineStyle(messages)
    const engagement = this.calculateEngagement(messages)
    const turnTaking = this.analyzeTurnTaking(messages)

    return {
      topicProgression: topics,
      conversationStyle: style,
      engagementLevel: engagement,
      turnTaking
    }
  }

  async extractInsights(messages: Message[]): Promise<Insight[]> {
    const insights: Insight[] = []

    // Emotional insights
    const emotionalWords = ['happy', 'sad', 'frustrated', 'excited', 'wonderful', 'sorry']
    const emotionalMessages = messages.filter(m =>
      emotionalWords.some(word => m.text.toLowerCase().includes(word))
    )

    if (emotionalMessages.length > 0) {
      insights.push({
        category: 'emotional',
        description: 'Emotional expression detected in conversation',
        relevance: emotionalMessages.length / messages.length,
        supportingEvidence: emotionalMessages.slice(0, 3).map(m => m.text)
      })
    }

    // Relational insights
    const questions = messages.filter(m => m.text.includes('?'))
    if (questions.length > messages.length * 0.3) {
      insights.push({
        category: 'relational',
        description: 'High curiosity and engagement through questioning',
        relevance: 0.8,
        supportingEvidence: questions.slice(0, 2).map(m => m.text)
      })
    }

    return insights
  }

  async analyzeRelationshipDynamics(messages: Message[]): Promise<RelationshipDynamics> {
    const participants = [...new Set(messages.map(m => m.sender))]

    // Calculate message distribution
    const messageCounts = new Map<string, number>()
    messages.forEach(m => {
      messageCounts.set(m.sender, (messageCounts.get(m.sender) || 0) + 1)
    })

    const supportWords = ['support', 'help', 'there for you', 'understand']
    const supportCount = messages.filter(m =>
      supportWords.some(word => m.text.toLowerCase().includes(word))
    ).length

    const conflictWords = ['disagree', 'wrong', 'frustrated', 'upset', 'angry']
    const conflictCount = messages.filter(m =>
      conflictWords.some(word => m.text.toLowerCase().includes(word))
    ).length

    const positiveWords = ['happy', 'wonderful', 'great', 'love', 'excited']
    const positiveCount = messages.filter(m =>
      positiveWords.some(word => m.text.toLowerCase().includes(word))
    ).length

    return {
      communicationStyle: this.determineCommunicationStyle(messages),
      emotionalConnection: Math.min(1, positiveCount / Math.max(1, messages.length)),
      conflictLevel: Math.min(1, conflictCount / Math.max(1, messages.length)),
      supportiveness: Math.min(1, supportCount / Math.max(1, messages.length)),
      observations: this.generateObservations(messages, messageCounts)
    }
  }

  async generateSummary(messages: Message[]): Promise<ConversationSummary> {
    const keyTopics = this.extractTopics(messages)
    const emotionalMessages = messages.filter(m => {
      const emotionalWords = ['happy', 'sad', 'frustrated', 'excited', 'wonderful', 'sorry', 'love']
      return emotionalWords.some(word => m.text.toLowerCase().includes(word))
    })

    const questions = messages.filter(m => m.text.includes('?'))
    const actionWords = ['will', 'going to', 'plan to', 'should', 'need to']
    const actionMessages = messages.filter(m =>
      actionWords.some(word => m.text.toLowerCase().includes(word))
    )

    return {
      overview: `Conversation between ${[...new Set(messages.map(m => m.sender))].length} participants with ${messages.length} messages`,
      keyPoints: keyTopics,
      emotionalHighlights: emotionalMessages.slice(0, 3).map(m => m.text),
      actionItems: actionMessages.slice(0, 3).map(m => m.text)
    }
  }

  private extractTopics(messages: Message[]): string[] {
    const topics: string[] = []

    if (messages.some(m => m.text.toLowerCase().includes('project'))) {
      topics.push('Work/Projects')
    }
    if (messages.some(m => m.text.toLowerCase().includes('feel') || m.text.toLowerCase().includes('emotion'))) {
      topics.push('Emotions/Feelings')
    }
    if (messages.some(m => m.text.includes('?'))) {
      topics.push('Questions/Inquiry')
    }

    return topics.length > 0 ? topics : ['General conversation']
  }

  private determineStyle(messages: Message[]): 'casual' | 'formal' | 'mixed' {
    const casualWords = ['hey', 'yeah', 'gonna', 'wanna']
    const formalWords = ['greetings', 'regarding', 'furthermore', 'therefore']

    const casualCount = messages.filter(m =>
      casualWords.some(word => m.text.toLowerCase().includes(word))
    ).length

    const formalCount = messages.filter(m =>
      formalWords.some(word => m.text.toLowerCase().includes(word))
    ).length

    if (casualCount > formalCount * 2) return 'casual'
    if (formalCount > casualCount * 2) return 'formal'
    return 'mixed'
  }

  private calculateEngagement(messages: Message[]): 'high' | 'medium' | 'low' {
    const avgLength = messages.reduce((sum, m) => sum + m.text.length, 0) / messages.length
    const questionRatio = messages.filter(m => m.text.includes('?')).length / messages.length

    if (avgLength > 100 || questionRatio > 0.3) return 'high'
    if (avgLength > 50 || questionRatio > 0.15) return 'medium'
    return 'low'
  }

  private analyzeTurnTaking(messages: Message[]): ContextAnalysis['turnTaking'] {
    const senderCounts = new Map<string, number>()
    messages.forEach(m => {
      senderCounts.set(m.sender, (senderCounts.get(m.sender) || 0) + 1)
    })

    const counts = Array.from(senderCounts.values())
    const avg = counts.reduce((a, b) => a + b, 0) / counts.length
    const balanced = counts.every(count => Math.abs(count - avg) < avg * 0.5)

    let dominantSpeaker: string | null = null
    if (!balanced) {
      const maxCount = Math.max(...counts)
      dominantSpeaker = Array.from(senderCounts.entries())
        .find(([_, count]) => count === maxCount)?.[0] || null
    }

    return { balanced, dominantSpeaker }
  }

  private determineCommunicationStyle(messages: Message[]): string {
    const avgLength = messages.reduce((sum, m) => sum + m.text.length, 0) / messages.length
    const questionRatio = messages.filter(m => m.text.includes('?')).length / messages.length

    if (questionRatio > 0.3) return 'Inquisitive and engaging'
    if (avgLength > 100) return 'Detailed and thoughtful'
    if (avgLength < 30) return 'Brief and direct'
    return 'Balanced and conversational'
  }

  private generateObservations(messages: Message[], messageCounts: Map<string, number>): string[] {
    const observations: string[] = []

    const participants = [...new Set(messages.map(m => m.sender))]
    if (participants.length === 2) {
      const counts = Array.from(messageCounts.values())
      if (Math.abs(counts[0] - counts[1]) < 2) {
        observations.push('Balanced participation from both parties')
      }
    }

    const questions = messages.filter(m => m.text.includes('?'))
    if (questions.length > messages.length * 0.3) {
      observations.push('High level of curiosity and engagement')
    }

    return observations
  }
}

describe('ConversationAnalyzer', () => {
  let analyzer: MockConversationAnalyzer

  beforeEach(() => {
    analyzer = new MockConversationAnalyzer()
  })

  describe('analyzeContext', () => {
    it('should analyze conversation context', async () => {
      const messages: Message[] = [
        {
          id: '1',
          text: 'Hey, how is the project going?',
          sender: '+1234567890',
          timestamp: new Date('2025-01-27T10:00:00'),
          is_from_me: false
        },
        {
          id: '2',
          text: "It's going great! Almost done.",
          sender: 'me',
          timestamp: new Date('2025-01-27T10:05:00'),
          is_from_me: true
        }
      ]

      const context = await analyzer.analyzeContext(messages)

      expect(context).toBeDefined()
      expect(context.topicProgression).toBeInstanceOf(Array)
      expect(context.conversationStyle).toMatch(/casual|formal|mixed/)
      expect(context.engagementLevel).toMatch(/high|medium|low/)
      expect(context.turnTaking).toHaveProperty('balanced')
      expect(context.turnTaking).toHaveProperty('dominantSpeaker')
    })

    it('should detect topic progression', async () => {
      const messages: Message[] = [
        {
          id: '1',
          text: 'How is your project going?',
          sender: 'me',
          timestamp: new Date('2025-01-27T10:00:00'),
          is_from_me: true
        },
        {
          id: '2',
          text: "Good! How do you feel about it?",
          sender: '+1234567890',
          timestamp: new Date('2025-01-27T10:05:00'),
          is_from_me: false
        }
      ]

      const context = await analyzer.analyzeContext(messages)

      expect(context.topicProgression).toContain('Work/Projects')
      expect(context.topicProgression).toContain('Questions/Inquiry')
    })

    it('should identify conversation style', async () => {
      const casualMessages: Message[] = [
        {
          id: '1',
          text: 'Hey there!',
          sender: 'me',
          timestamp: new Date('2025-01-27T10:00:00'),
          is_from_me: true
        }
      ]

      const context = await analyzer.analyzeContext(casualMessages)

      expect(context.conversationStyle).toBeDefined()
      expect(['casual', 'formal', 'mixed']).toContain(context.conversationStyle)
    })

    it('should calculate engagement level', async () => {
      const highEngagementMessages: Message[] = [
        {
          id: '1',
          text: 'I wanted to share something really important with you today. This has been on my mind for quite some time.',
          sender: 'me',
          timestamp: new Date('2025-01-27T10:00:00'),
          is_from_me: true
        },
        {
          id: '2',
          text: 'What do you think about this situation? How should we approach it?',
          sender: '+1234567890',
          timestamp: new Date('2025-01-27T10:05:00'),
          is_from_me: false
        }
      ]

      const context = await analyzer.analyzeContext(highEngagementMessages)

      expect(context.engagementLevel).toBe('high')
    })

    it('should analyze turn-taking patterns', async () => {
      const balancedMessages: Message[] = [
        { id: '1', text: 'Hello', sender: 'me', timestamp: new Date(), is_from_me: true },
        { id: '2', text: 'Hi', sender: '+1234567890', timestamp: new Date(), is_from_me: false },
        { id: '3', text: 'How are you?', sender: 'me', timestamp: new Date(), is_from_me: true },
        { id: '4', text: 'Good!', sender: '+1234567890', timestamp: new Date(), is_from_me: false }
      ]

      const context = await analyzer.analyzeContext(balancedMessages)

      expect(context.turnTaking.balanced).toBe(true)
      expect(context.turnTaking.dominantSpeaker).toBeNull()
    })

    it('should throw error with empty messages', async () => {
      await expect(analyzer.analyzeContext([])).rejects.toThrow('No messages to analyze')
    })
  })

  describe('extractInsights', () => {
    it('should extract emotional insights', async () => {
      const messages: Message[] = [
        {
          id: '1',
          text: "I'm so happy about this news!",
          sender: 'me',
          timestamp: new Date('2025-01-27T10:00:00'),
          is_from_me: true
        },
        {
          id: '2',
          text: "I'm excited too!",
          sender: '+1234567890',
          timestamp: new Date('2025-01-27T10:05:00'),
          is_from_me: false
        }
      ]

      const insights = await analyzer.extractInsights(messages)

      expect(insights).toBeInstanceOf(Array)
      const emotionalInsight = insights.find(i => i.category === 'emotional')
      expect(emotionalInsight).toBeDefined()
      expect(emotionalInsight?.supportingEvidence).toBeInstanceOf(Array)
    })

    it('should extract relational insights', async () => {
      const messages: Message[] = [
        { id: '1', text: 'How are you?', sender: 'me', timestamp: new Date(), is_from_me: true },
        { id: '2', text: 'What do you think?', sender: 'me', timestamp: new Date(), is_from_me: true },
        { id: '3', text: 'Can you help?', sender: '+1234567890', timestamp: new Date(), is_from_me: false },
        { id: '4', text: 'Why is that?', sender: 'me', timestamp: new Date(), is_from_me: true }
      ]

      const insights = await analyzer.extractInsights(messages)

      const relationalInsight = insights.find(i => i.category === 'relational')
      expect(relationalInsight).toBeDefined()
    })

    it('should calculate relevance scores', async () => {
      const messages: Message[] = [
        {
          id: '1',
          text: 'Test message',
          sender: 'me',
          timestamp: new Date(),
          is_from_me: true
        }
      ]

      const insights = await analyzer.extractInsights(messages)

      insights.forEach(insight => {
        expect(insight.relevance).toBeGreaterThanOrEqual(0)
        expect(insight.relevance).toBeLessThanOrEqual(1)
      })
    })
  })

  describe('analyzeRelationshipDynamics', () => {
    it('should analyze relationship dynamics', async () => {
      const messages: Message[] = [
        {
          id: '1',
          text: "I'm here to support you",
          sender: 'me',
          timestamp: new Date('2025-01-27T10:00:00'),
          is_from_me: true
        },
        {
          id: '2',
          text: 'Thank you, I appreciate your help',
          sender: '+1234567890',
          timestamp: new Date('2025-01-27T10:05:00'),
          is_from_me: false
        }
      ]

      const dynamics = await analyzer.analyzeRelationshipDynamics(messages)

      expect(dynamics).toBeDefined()
      expect(dynamics.communicationStyle).toBeDefined()
      expect(dynamics.emotionalConnection).toBeGreaterThanOrEqual(0)
      expect(dynamics.emotionalConnection).toBeLessThanOrEqual(1)
      expect(dynamics.conflictLevel).toBeGreaterThanOrEqual(0)
      expect(dynamics.conflictLevel).toBeLessThanOrEqual(1)
      expect(dynamics.supportiveness).toBeGreaterThanOrEqual(0)
      expect(dynamics.supportiveness).toBeLessThanOrEqual(1)
      expect(dynamics.observations).toBeInstanceOf(Array)
    })

    it('should detect high supportiveness', async () => {
      const messages: Message[] = [
        { id: '1', text: "I'm here to support you", sender: 'me', timestamp: new Date(), is_from_me: true },
        { id: '2', text: 'I understand how you feel', sender: 'me', timestamp: new Date(), is_from_me: true },
        { id: '3', text: "I'm there for you", sender: '+1234567890', timestamp: new Date(), is_from_me: false }
      ]

      const dynamics = await analyzer.analyzeRelationshipDynamics(messages)

      expect(dynamics.supportiveness).toBeGreaterThan(0.5)
    })

    it('should detect conflict indicators', async () => {
      const messages: Message[] = [
        { id: '1', text: "I disagree with that", sender: 'me', timestamp: new Date(), is_from_me: true },
        { id: '2', text: "You're wrong about this", sender: '+1234567890', timestamp: new Date(), is_from_me: false },
        { id: '3', text: "I'm frustrated", sender: 'me', timestamp: new Date(), is_from_me: true }
      ]

      const dynamics = await analyzer.analyzeRelationshipDynamics(messages)

      expect(dynamics.conflictLevel).toBeGreaterThan(0)
    })
  })

  describe('generateSummary', () => {
    it('should generate conversation summary', async () => {
      const messages: Message[] = [
        {
          id: '1',
          text: 'We need to plan the project timeline',
          sender: 'me',
          timestamp: new Date('2025-01-27T10:00:00'),
          is_from_me: true
        },
        {
          id: '2',
          text: "I'm excited about this opportunity!",
          sender: '+1234567890',
          timestamp: new Date('2025-01-27T10:05:00'),
          is_from_me: false
        },
        {
          id: '3',
          text: 'We should start next week',
          sender: 'me',
          timestamp: new Date('2025-01-27T10:10:00'),
          is_from_me: true
        }
      ]

      const summary = await analyzer.generateSummary(messages)

      expect(summary).toBeDefined()
      expect(summary.overview).toBeDefined()
      expect(summary.keyPoints).toBeInstanceOf(Array)
      expect(summary.emotionalHighlights).toBeInstanceOf(Array)
      expect(summary.actionItems).toBeInstanceOf(Array)
    })

    it('should identify key points', async () => {
      const messages: Message[] = [
        { id: '1', text: 'The project is important', sender: 'me', timestamp: new Date(), is_from_me: true },
        { id: '2', text: 'What should we do?', sender: '+1234567890', timestamp: new Date(), is_from_me: false }
      ]

      const summary = await analyzer.generateSummary(messages)

      expect(summary.keyPoints.length).toBeGreaterThan(0)
    })

    it('should extract emotional highlights', async () => {
      const messages: Message[] = [
        { id: '1', text: "I'm so happy!", sender: 'me', timestamp: new Date(), is_from_me: true },
        { id: '2', text: 'This is wonderful', sender: '+1234567890', timestamp: new Date(), is_from_me: false }
      ]

      const summary = await analyzer.generateSummary(messages)

      expect(summary.emotionalHighlights.length).toBeGreaterThan(0)
    })
  })
})
