/**
 * Analysis Pipeline Integration Tests
 *
 * Tests for the analysis pipeline that processes conversations
 * and generates insights for reflection.
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'

// Type definitions for the analysis pipeline
interface Message {
  id: string
  text: string
  sender: string
  timestamp: Date
  is_from_me: boolean
}

interface ConversationContext {
  participants: string[]
  duration: number
  messageCount: number
  timeRange: { start: Date; end: Date }
}

interface Pattern {
  type: 'emotional' | 'conversational' | 'behavioral'
  name: string
  description: string
  confidence: number
  occurrences: number
}

interface ReflectionPrompt {
  category: string
  question: string
  context: string
}

interface AnalysisResult {
  context: ConversationContext
  patterns: Pattern[]
  insights: string[]
  reflectionPrompts: ReflectionPrompt[]
  emotionalTone: {
    overall: string
    trajectory: string[]
    intensity: number
  }
}

// Mock implementation of AnalysisPipeline
class MockAnalysisPipeline {
  async analyzeConversation(messages: Message[]): Promise<AnalysisResult> {
    if (!messages || messages.length === 0) {
      throw new Error('No messages provided for analysis')
    }

    const timestamps = messages.map(m => m.timestamp.getTime())
    const duration = Math.max(...timestamps) - Math.min(...timestamps)

    const participants = [...new Set(messages.map(m => m.sender))]

    // Simple pattern detection
    const patterns: Pattern[] = []
    const emotionalWords = ['happy', 'sad', 'frustrated', 'excited', 'wonderful', 'sorry']
    const emotionalCount = messages.filter(m =>
      emotionalWords.some(word => m.text.toLowerCase().includes(word))
    ).length

    if (emotionalCount > 0) {
      patterns.push({
        type: 'emotional',
        name: 'Emotional Expression',
        description: 'Conversation contains emotional language',
        confidence: 0.85,
        occurrences: emotionalCount
      })
    }

    // Question detection
    const questionCount = messages.filter(m => m.text.includes('?')).length
    if (questionCount > 0) {
      patterns.push({
        type: 'conversational',
        name: 'Inquiry Pattern',
        description: 'Active questioning and engagement',
        confidence: 0.75,
        occurrences: questionCount
      })
    }

    const insights = this.generateInsights(messages, patterns)
    const reflectionPrompts = this.generateReflectionPrompts(patterns)
    const emotionalTone = this.analyzeEmotionalTone(messages)

    return {
      context: {
        participants,
        duration,
        messageCount: messages.length,
        timeRange: {
          start: new Date(Math.min(...timestamps)),
          end: new Date(Math.max(...timestamps))
        }
      },
      patterns,
      insights,
      reflectionPrompts,
      emotionalTone
    }
  }

  private generateInsights(messages: Message[], patterns: Pattern[]): string[] {
    const insights: string[] = []

    if (patterns.some(p => p.type === 'emotional')) {
      insights.push('The conversation shows emotional engagement between participants')
    }

    if (patterns.some(p => p.name === 'Inquiry Pattern')) {
      insights.push('Active questioning indicates curiosity and engagement')
    }

    const avgLength = messages.reduce((sum, m) => sum + m.text.length, 0) / messages.length
    if (avgLength > 100) {
      insights.push('Messages are detailed and thoughtful')
    }

    // Always provide at least one general insight
    if (insights.length === 0) {
      insights.push('Conversation demonstrates clear communication between participants')
    }

    return insights
  }

  private generateReflectionPrompts(patterns: Pattern[]): ReflectionPrompt[] {
    const prompts: ReflectionPrompt[] = []

    for (const pattern of patterns) {
      if (pattern.type === 'emotional') {
        prompts.push({
          category: 'emotional_awareness',
          question: 'What emotions did you notice in this conversation?',
          context: pattern.description
        })
      }

      if (pattern.name === 'Inquiry Pattern') {
        prompts.push({
          category: 'communication',
          question: 'What questions were most important in this exchange?',
          context: 'The conversation showed active inquiry and engagement'
        })
      }
    }

    return prompts
  }

  private analyzeEmotionalTone(messages: Message[]): AnalysisResult['emotionalTone'] {
    const positiveWords = ['happy', 'wonderful', 'great', 'excited', 'love']
    const negativeWords = ['frustrated', 'sad', 'sorry', 'upset', 'angry']

    let positiveCount = 0
    let negativeCount = 0

    messages.forEach(m => {
      const text = m.text.toLowerCase()
      positiveCount += positiveWords.filter(w => text.includes(w)).length
      negativeCount += negativeWords.filter(w => text.includes(w)).length
    })

    const overall = positiveCount > negativeCount ? 'positive' :
                    negativeCount > positiveCount ? 'negative' : 'neutral'

    const trajectory = messages.slice(0, 3).map((_, i) => {
      const segment = messages.slice(i * Math.floor(messages.length / 3), (i + 1) * Math.floor(messages.length / 3))
      const segmentPositive = segment.filter(m =>
        positiveWords.some(w => m.text.toLowerCase().includes(w))
      ).length
      const segmentNegative = segment.filter(m =>
        negativeWords.some(w => m.text.toLowerCase().includes(w))
      ).length

      return segmentPositive > segmentNegative ? 'positive' :
             segmentNegative > segmentPositive ? 'negative' : 'neutral'
    })

    const intensity = Math.min(1, (positiveCount + negativeCount) / messages.length)

    return { overall, trajectory, intensity }
  }
}

describe('AnalysisPipeline', () => {
  let pipeline: MockAnalysisPipeline

  beforeEach(() => {
    pipeline = new MockAnalysisPipeline()
  })

  describe('analyzeConversation', () => {
    it('should analyze conversation with sample messages', async () => {
      const sampleMessages: Message[] = [
        {
          id: '1',
          text: 'Hey, how are you doing?',
          sender: '+1234567890',
          timestamp: new Date('2025-01-27T10:00:00'),
          is_from_me: false
        },
        {
          id: '2',
          text: "I'm doing great! Just finished a big project.",
          sender: 'me',
          timestamp: new Date('2025-01-27T10:05:00'),
          is_from_me: true
        },
        {
          id: '3',
          text: "That's wonderful! I'm so happy for you!",
          sender: '+1234567890',
          timestamp: new Date('2025-01-27T10:06:00'),
          is_from_me: false
        }
      ]

      const result = await pipeline.analyzeConversation(sampleMessages)

      expect(result).toBeDefined()
      expect(result.context).toBeDefined()
      expect(result.context.participants).toHaveLength(2)
      expect(result.context.messageCount).toBe(3)
      expect(result.patterns).toBeInstanceOf(Array)
      expect(result.insights).toBeInstanceOf(Array)
      expect(result.reflectionPrompts).toBeInstanceOf(Array)
    })

    it('should identify emotional patterns', async () => {
      const emotionalMessages: Message[] = [
        {
          id: '1',
          text: "I can't believe you did that. I'm so frustrated!",
          sender: '+1234567890',
          timestamp: new Date('2025-01-27T10:00:00'),
          is_from_me: false
        },
        {
          id: '2',
          text: "I'm sorry, I didn't mean to upset you.",
          sender: 'me',
          timestamp: new Date('2025-01-27T10:05:00'),
          is_from_me: true
        }
      ]

      const result = await pipeline.analyzeConversation(emotionalMessages)

      const emotionalPattern = result.patterns.find(p => p.type === 'emotional')
      expect(emotionalPattern).toBeDefined()
      expect(emotionalPattern?.name).toBe('Emotional Expression')
      expect(emotionalPattern?.confidence).toBeGreaterThan(0.5)
    })

    it('should generate reflection prompts', async () => {
      const messages: Message[] = [
        {
          id: '1',
          text: 'What do you think about this situation?',
          sender: '+1234567890',
          timestamp: new Date('2025-01-27T10:00:00'),
          is_from_me: false
        },
        {
          id: '2',
          text: "I think it's quite complex and needs thought.",
          sender: 'me',
          timestamp: new Date('2025-01-27T10:05:00'),
          is_from_me: true
        }
      ]

      const result = await pipeline.analyzeConversation(messages)

      expect(result.reflectionPrompts).toBeInstanceOf(Array)
      expect(result.reflectionPrompts.length).toBeGreaterThan(0)

      const prompt = result.reflectionPrompts[0]
      expect(prompt).toHaveProperty('category')
      expect(prompt).toHaveProperty('question')
      expect(prompt).toHaveProperty('context')
    })

    it('should analyze emotional tone trajectory', async () => {
      const messages: Message[] = [
        {
          id: '1',
          text: "I'm so happy today!",
          sender: 'me',
          timestamp: new Date('2025-01-27T10:00:00'),
          is_from_me: true
        },
        {
          id: '2',
          text: 'That sounds wonderful!',
          sender: '+1234567890',
          timestamp: new Date('2025-01-27T10:05:00'),
          is_from_me: false
        }
      ]

      const result = await pipeline.analyzeConversation(messages)

      expect(result.emotionalTone).toBeDefined()
      expect(result.emotionalTone.overall).toMatch(/positive|negative|neutral/)
      expect(result.emotionalTone.trajectory).toBeInstanceOf(Array)
      expect(result.emotionalTone.intensity).toBeGreaterThanOrEqual(0)
      expect(result.emotionalTone.intensity).toBeLessThanOrEqual(1)
    })

    it('should throw error with empty messages', async () => {
      await expect(pipeline.analyzeConversation([])).rejects.toThrow('No messages provided')
    })

    it('should handle single message', async () => {
      const messages: Message[] = [
        {
          id: '1',
          text: 'Hello',
          sender: 'me',
          timestamp: new Date('2025-01-27T10:00:00'),
          is_from_me: true
        }
      ]

      const result = await pipeline.analyzeConversation(messages)

      expect(result).toBeDefined()
      expect(result.context.messageCount).toBe(1)
      expect(result.context.participants).toHaveLength(1)
    })

    it('should calculate conversation duration correctly', async () => {
      const messages: Message[] = [
        {
          id: '1',
          text: 'Start',
          sender: 'me',
          timestamp: new Date('2025-01-27T10:00:00'),
          is_from_me: true
        },
        {
          id: '2',
          text: 'Middle',
          sender: '+1234567890',
          timestamp: new Date('2025-01-27T10:30:00'),
          is_from_me: false
        },
        {
          id: '3',
          text: 'End',
          sender: 'me',
          timestamp: new Date('2025-01-27T11:00:00'),
          is_from_me: true
        }
      ]

      const result = await pipeline.analyzeConversation(messages)

      // Duration should be 1 hour (3600000 ms)
      expect(result.context.duration).toBe(3600000)
      expect(result.context.timeRange.start).toEqual(new Date('2025-01-27T10:00:00'))
      expect(result.context.timeRange.end).toEqual(new Date('2025-01-27T11:00:00'))
    })
  })

  describe('pattern identification', () => {
    it('should identify conversational patterns', async () => {
      const messages: Message[] = [
        {
          id: '1',
          text: 'How are you?',
          sender: 'me',
          timestamp: new Date('2025-01-27T10:00:00'),
          is_from_me: true
        },
        {
          id: '2',
          text: 'What do you think?',
          sender: 'me',
          timestamp: new Date('2025-01-27T10:05:00'),
          is_from_me: true
        }
      ]

      const result = await pipeline.analyzeConversation(messages)

      const inquiryPattern = result.patterns.find(p => p.name === 'Inquiry Pattern')
      expect(inquiryPattern).toBeDefined()
      expect(inquiryPattern?.type).toBe('conversational')
      expect(inquiryPattern?.occurrences).toBe(2)
    })

    it('should calculate pattern confidence scores', async () => {
      const messages: Message[] = [
        {
          id: '1',
          text: "I'm so excited about this!",
          sender: 'me',
          timestamp: new Date('2025-01-27T10:00:00'),
          is_from_me: true
        }
      ]

      const result = await pipeline.analyzeConversation(messages)

      result.patterns.forEach(pattern => {
        expect(pattern.confidence).toBeGreaterThan(0)
        expect(pattern.confidence).toBeLessThanOrEqual(1)
      })
    })
  })

  describe('insight generation', () => {
    it('should generate meaningful insights', async () => {
      const messages: Message[] = [
        {
          id: '1',
          text: 'I wanted to share something important with you. This has been on my mind for a while now.',
          sender: 'me',
          timestamp: new Date('2025-01-27T10:00:00'),
          is_from_me: true
        },
        {
          id: '2',
          text: "I'm listening. Please tell me what's going on.",
          sender: '+1234567890',
          timestamp: new Date('2025-01-27T10:05:00'),
          is_from_me: false
        }
      ]

      const result = await pipeline.analyzeConversation(messages)

      expect(result.insights).toBeInstanceOf(Array)
      expect(result.insights.length).toBeGreaterThan(0)
      result.insights.forEach(insight => {
        expect(typeof insight).toBe('string')
        expect(insight.length).toBeGreaterThan(0)
      })
    })
  })
})
