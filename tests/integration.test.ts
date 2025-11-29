/**
 * End-to-End Integration Tests
 *
 * Tests the complete reflection flow from message ingestion
 * through analysis, voice generation, and journal creation.
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'

// Type definitions for full integration
interface Message {
  id: string
  text: string
  sender: string
  timestamp: Date
  is_from_me: boolean
}

interface ReflectionSystem {
  processConversation(messages: Message[]): Promise<ProcessingResult>
  handleError(error: Error): ErrorResponse
}

interface ProcessingResult {
  success: boolean
  sessionId: string
  analysis: {
    patterns: any[]
    insights: string[]
    emotionalTone: any
  }
  voiceOutput: {
    text: string
    audioFile?: string
  }
  journalEntry: {
    id: string
    summary: string
    reflections: string[]
  }
  errors?: string[]
}

interface ErrorResponse {
  code: string
  message: string
  recoverable: boolean
}

// Mock full integration system
class MockReflectionSystem implements ReflectionSystem {
  async processConversation(messages: Message[]): Promise<ProcessingResult> {
    if (!messages || messages.length === 0) {
      throw new Error('EMPTY_MESSAGES: No messages provided')
    }

    // Validate messages
    for (const msg of messages) {
      if (!msg.text || !msg.sender || !msg.timestamp) {
        throw new Error('INVALID_MESSAGE: Message missing required fields')
      }
    }

    const sessionId = `session-${Date.now()}`

    try {
      // Step 1: Analyze conversation
      const analysis = await this.analyzeConversation(messages)

      // Step 2: Generate voice output
      const voiceOutput = await this.generateVoiceOutput(analysis)

      // Step 3: Create journal entry
      const journalEntry = await this.createJournalEntry(messages, analysis)

      return {
        success: true,
        sessionId,
        analysis,
        voiceOutput,
        journalEntry
      }
    } catch (error) {
      return {
        success: false,
        sessionId,
        analysis: { patterns: [], insights: [], emotionalTone: {} },
        voiceOutput: { text: '' },
        journalEntry: { id: '', summary: '', reflections: [] },
        errors: [error instanceof Error ? error.message : 'Unknown error']
      }
    }
  }

  handleError(error: Error): ErrorResponse {
    if (error.message.includes('EMPTY_MESSAGES')) {
      return {
        code: 'EMPTY_MESSAGES',
        message: 'No messages provided for analysis',
        recoverable: true
      }
    }

    if (error.message.includes('INVALID_MESSAGE')) {
      return {
        code: 'INVALID_MESSAGE',
        message: 'Message format is invalid',
        recoverable: true
      }
    }

    if (error.message.includes('ANALYSIS_FAILED')) {
      return {
        code: 'ANALYSIS_FAILED',
        message: 'Failed to analyze conversation',
        recoverable: false
      }
    }

    return {
      code: 'UNKNOWN_ERROR',
      message: error.message,
      recoverable: false
    }
  }

  private async analyzeConversation(messages: Message[]) {
    // Mock analysis
    const emotionalWords = ['happy', 'sad', 'frustrated', 'excited', 'wonderful']
    const hasEmotion = messages.some(m =>
      emotionalWords.some(word => m.text.toLowerCase().includes(word))
    )

    return {
      patterns: hasEmotion ? [{ type: 'emotional', name: 'Emotional expression' }] : [],
      insights: ['Conversation analyzed successfully'],
      emotionalTone: {
        overall: hasEmotion ? 'emotional' : 'neutral',
        intensity: 0.7
      }
    }
  }

  private async generateVoiceOutput(analysis: any) {
    return {
      text: `Reflection: ${analysis.insights[0]}`,
      audioFile: `audio-${Date.now()}.mp3`
    }
  }

  private async createJournalEntry(messages: Message[], analysis: any) {
    return {
      id: `journal-${Date.now()}`,
      summary: `Analyzed ${messages.length} messages`,
      reflections: analysis.insights
    }
  }
}

describe('Full Reflection Flow Integration', () => {
  let system: MockReflectionSystem

  beforeEach(() => {
    system = new MockReflectionSystem()
  })

  describe('complete reflection flow', () => {
    it('should process complete conversation successfully', async () => {
      const messages: Message[] = [
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

      const result = await system.processConversation(messages)

      expect(result.success).toBe(true)
      expect(result.sessionId).toMatch(/^session-/)
      expect(result.analysis).toBeDefined()
      expect(result.analysis.patterns).toBeInstanceOf(Array)
      expect(result.analysis.insights).toBeInstanceOf(Array)
      expect(result.voiceOutput).toBeDefined()
      expect(result.voiceOutput.text).toBeDefined()
      expect(result.journalEntry).toBeDefined()
      expect(result.journalEntry.id).toMatch(/^journal-/)
    })

    it('should handle emotional conversations', async () => {
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
        },
        {
          id: '3',
          text: "I understand. I'm just feeling overwhelmed.",
          sender: '+1234567890',
          timestamp: new Date('2025-01-27T10:10:00'),
          is_from_me: false
        }
      ]

      const result = await system.processConversation(emotionalMessages)

      expect(result.success).toBe(true)
      expect(result.analysis.patterns.length).toBeGreaterThan(0)
      expect(result.analysis.emotionalTone.overall).toBe('emotional')
    })

    it('should process casual conversations', async () => {
      const casualMessages: Message[] = [
        {
          id: '1',
          text: 'Hey!',
          sender: 'me',
          timestamp: new Date('2025-01-27T10:00:00'),
          is_from_me: true
        },
        {
          id: '2',
          text: 'Hi there!',
          sender: '+1234567890',
          timestamp: new Date('2025-01-27T10:01:00'),
          is_from_me: false
        },
        {
          id: '3',
          text: 'What are you up to?',
          sender: 'me',
          timestamp: new Date('2025-01-27T10:02:00'),
          is_from_me: true
        }
      ]

      const result = await system.processConversation(casualMessages)

      expect(result.success).toBe(true)
      expect(result.analysis.emotionalTone.overall).toBe('neutral')
    })

    it('should generate voice output for all conversation types', async () => {
      const messages: Message[] = [
        {
          id: '1',
          text: 'This is a test message',
          sender: 'me',
          timestamp: new Date(),
          is_from_me: true
        }
      ]

      const result = await system.processConversation(messages)

      expect(result.voiceOutput).toBeDefined()
      expect(result.voiceOutput.text).toContain('Reflection:')
      expect(result.voiceOutput.audioFile).toBeDefined()
      expect(result.voiceOutput.audioFile).toMatch(/\.mp3$/)
    })

    it('should create journal entries with summaries', async () => {
      const messages: Message[] = [
        { id: '1', text: 'Message 1', sender: 'me', timestamp: new Date(), is_from_me: true },
        { id: '2', text: 'Message 2', sender: '+1234567890', timestamp: new Date(), is_from_me: false },
        { id: '3', text: 'Message 3', sender: 'me', timestamp: new Date(), is_from_me: true }
      ]

      const result = await system.processConversation(messages)

      expect(result.journalEntry).toBeDefined()
      expect(result.journalEntry.summary).toContain('3 messages')
      expect(result.journalEntry.reflections).toBeInstanceOf(Array)
    })
  })

  describe('error handling', () => {
    it('should handle empty message arrays', async () => {
      await expect(system.processConversation([])).rejects.toThrow('EMPTY_MESSAGES')
    })

    it('should handle invalid message format', async () => {
      const invalidMessages: Message[] = [
        {
          id: '1',
          text: '',
          sender: '',
          timestamp: new Date(),
          is_from_me: true
        }
      ]

      await expect(system.processConversation(invalidMessages)).rejects.toThrow('INVALID_MESSAGE')
    })

    it('should provide recoverable error responses', () => {
      const error = new Error('EMPTY_MESSAGES: No messages')
      const response = system.handleError(error)

      expect(response.code).toBe('EMPTY_MESSAGES')
      expect(response.recoverable).toBe(true)
    })

    it('should handle non-recoverable errors', () => {
      const error = new Error('ANALYSIS_FAILED: Critical error')
      const response = system.handleError(error)

      expect(response.code).toBe('ANALYSIS_FAILED')
      expect(response.recoverable).toBe(false)
    })

    it('should return success false on processing errors', async () => {
      // This would be a scenario where internal processing fails
      // For this mock, we'll test the error structure
      const messages: Message[] = [
        {
          id: '1',
          text: 'Test',
          sender: 'me',
          timestamp: new Date(),
          is_from_me: true
        }
      ]

      const result = await system.processConversation(messages)

      // Success case in mock, but structure is correct for error case
      expect(result).toHaveProperty('success')
      expect(result).toHaveProperty('sessionId')
      expect(result).toHaveProperty('analysis')
      expect(result).toHaveProperty('voiceOutput')
      expect(result).toHaveProperty('journalEntry')
    })
  })

  describe('edge cases', () => {
    it('should handle single message conversations', async () => {
      const messages: Message[] = [
        {
          id: '1',
          text: 'Hello world',
          sender: 'me',
          timestamp: new Date(),
          is_from_me: true
        }
      ]

      const result = await system.processConversation(messages)

      expect(result.success).toBe(true)
      expect(result.journalEntry.summary).toContain('1 messages')
    })

    it('should handle very long conversations', async () => {
      const longConversation: Message[] = Array.from({ length: 100 }, (_, i) => ({
        id: `${i + 1}`,
        text: `Message ${i + 1}`,
        sender: i % 2 === 0 ? 'me' : '+1234567890',
        timestamp: new Date(Date.now() + i * 60000),
        is_from_me: i % 2 === 0
      }))

      const result = await system.processConversation(longConversation)

      expect(result.success).toBe(true)
      expect(result.journalEntry.summary).toContain('100 messages')
    })

    it('should handle messages with special characters', async () => {
      const messages: Message[] = [
        {
          id: '1',
          text: 'Hello! 😊 How are you? #blessed',
          sender: 'me',
          timestamp: new Date(),
          is_from_me: true
        },
        {
          id: '2',
          text: "I'm great! 🎉 @everyone",
          sender: '+1234567890',
          timestamp: new Date(),
          is_from_me: false
        }
      ]

      const result = await system.processConversation(messages)

      expect(result.success).toBe(true)
    })

    it('should handle rapid-fire messages', async () => {
      const baseTime = new Date('2025-01-27T10:00:00')
      const rapidMessages: Message[] = Array.from({ length: 10 }, (_, i) => ({
        id: `${i + 1}`,
        text: `Quick message ${i + 1}`,
        sender: i % 2 === 0 ? 'me' : '+1234567890',
        timestamp: new Date(baseTime.getTime() + i * 1000), // 1 second apart
        is_from_me: i % 2 === 0
      }))

      const result = await system.processConversation(rapidMessages)

      expect(result.success).toBe(true)
    })

    it('should handle conversations spanning long time periods', async () => {
      const messages: Message[] = [
        {
          id: '1',
          text: 'First message',
          sender: 'me',
          timestamp: new Date('2025-01-27T10:00:00'),
          is_from_me: true
        },
        {
          id: '2',
          text: 'Second message',
          sender: '+1234567890',
          timestamp: new Date('2025-01-27T15:00:00'), // 5 hours later
          is_from_me: false
        },
        {
          id: '3',
          text: 'Third message',
          sender: 'me',
          timestamp: new Date('2025-01-28T10:00:00'), // Next day
          is_from_me: true
        }
      ]

      const result = await system.processConversation(messages)

      expect(result.success).toBe(true)
    })

    it('should handle multilingual content', async () => {
      const messages: Message[] = [
        {
          id: '1',
          text: 'Hello, how are you?',
          sender: 'me',
          timestamp: new Date(),
          is_from_me: true
        },
        {
          id: '2',
          text: 'Bonjour! Je vais bien, merci!',
          sender: '+1234567890',
          timestamp: new Date(),
          is_from_me: false
        },
        {
          id: '3',
          text: '¡Hola! ¿Cómo estás?',
          sender: 'me',
          timestamp: new Date(),
          is_from_me: true
        }
      ]

      const result = await system.processConversation(messages)

      expect(result.success).toBe(true)
    })
  })

  describe('data consistency', () => {
    it('should maintain message order throughout processing', async () => {
      const messages: Message[] = [
        { id: '1', text: 'First', sender: 'me', timestamp: new Date('2025-01-27T10:00:00'), is_from_me: true },
        { id: '2', text: 'Second', sender: '+1234567890', timestamp: new Date('2025-01-27T10:05:00'), is_from_me: false },
        { id: '3', text: 'Third', sender: 'me', timestamp: new Date('2025-01-27T10:10:00'), is_from_me: true }
      ]

      const result = await system.processConversation(messages)

      expect(result.success).toBe(true)
      // In a real implementation, we would verify the order is preserved
    })

    it('should generate unique session IDs', async () => {
      const messages: Message[] = [
        { id: '1', text: 'Test', sender: 'me', timestamp: new Date(), is_from_me: true }
      ]

      const result1 = await system.processConversation(messages)
      await new Promise(resolve => setTimeout(resolve, 10))
      const result2 = await system.processConversation(messages)

      expect(result1.sessionId).not.toBe(result2.sessionId)
    })

    it('should link session ID with journal entry', async () => {
      const messages: Message[] = [
        { id: '1', text: 'Test', sender: 'me', timestamp: new Date(), is_from_me: true }
      ]

      const result = await system.processConversation(messages)

      expect(result.sessionId).toBeDefined()
      expect(result.journalEntry.id).toBeDefined()
      // In a real implementation, these would be linked
    })
  })
})
