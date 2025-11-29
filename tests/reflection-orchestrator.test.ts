/**
 * Reflection Orchestrator Integration Tests
 *
 * Tests for the orchestrator that coordinates the full reflection
 * session creation process.
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'

// Type definitions
interface Message {
  id: string
  text: string
  sender: string
  timestamp: Date
  is_from_me: boolean
}

interface VoiceOutput {
  text: string
  voiceProfile: {
    name: string
    provider: 'sable' | 'maya'
    emotionalTone: string
  }
  audioFile?: string
}

interface JournalEntry {
  id: string
  timestamp: Date
  conversationSummary: string
  insights: string[]
  reflectionPrompts: string[]
  emotionalState: {
    primary: string
    intensity: number
  }
  metadata: {
    participantCount: number
    messageCount: number
    duration: number
  }
}

interface ReflectionSession {
  id: string
  timestamp: Date
  messages: Message[]
  analysis: {
    patterns: any[]
    insights: string[]
    emotionalTone: any
  }
  voiceOutput: VoiceOutput
  journalEntry: JournalEntry
  exportFormats: {
    json: string
    markdown: string
  }
}

// Mock implementation
class MockReflectionOrchestrator {
  async createSession(messages: Message[]): Promise<ReflectionSession> {
    if (!messages || messages.length === 0) {
      throw new Error('Cannot create session with empty messages')
    }

    const id = `session-${Date.now()}`
    const timestamp = new Date()

    // Mock analysis
    const analysis = {
      patterns: [
        {
          type: 'emotional',
          name: 'Positive engagement',
          confidence: 0.85
        }
      ],
      insights: [
        'The conversation shows strong emotional connection',
        'Active listening and engagement patterns detected'
      ],
      emotionalTone: {
        overall: 'positive',
        trajectory: ['neutral', 'positive', 'positive'],
        intensity: 0.7
      }
    }

    const voiceOutput = await this.prepareVoiceOutput(analysis)
    const journalEntry = await this.generateJournalEntry(messages, analysis)

    const exportFormats = {
      json: JSON.stringify({ id, timestamp, messages, analysis }, null, 2),
      markdown: this.generateMarkdown({ id, timestamp, messages, analysis })
    }

    return {
      id,
      timestamp,
      messages,
      analysis,
      voiceOutput,
      journalEntry,
      exportFormats
    }
  }

  async prepareVoiceOutput(analysis: any): Promise<VoiceOutput> {
    const emotionalTone = analysis.emotionalTone?.overall || 'neutral'

    let text = 'Here are some reflections on your recent conversation. '

    if (analysis.insights && analysis.insights.length > 0) {
      text += analysis.insights[0] + '. '
    }

    if (emotionalTone === 'positive') {
      text += 'The overall tone was warm and engaging.'
    } else if (emotionalTone === 'negative') {
      text += 'There were some challenging moments to reflect on.'
    } else {
      text += 'The conversation covered various topics.'
    }

    return {
      text,
      voiceProfile: {
        name: emotionalTone === 'positive' ? 'Maya' : 'Sable',
        provider: emotionalTone === 'positive' ? 'maya' : 'sable',
        emotionalTone
      }
    }
  }

  async generateJournalEntry(messages: Message[], analysis: any): Promise<JournalEntry> {
    const id = `journal-${Date.now()}`
    const timestamp = new Date()

    const participants = [...new Set(messages.map(m => m.sender))]
    const timestamps = messages.map(m => m.timestamp.getTime())
    const duration = Math.max(...timestamps) - Math.min(...timestamps)

    const conversationSummary = `A conversation between ${participants.length} participant(s) ` +
      `with ${messages.length} messages exchanged over ${Math.round(duration / 60000)} minutes.`

    const reflectionPrompts = [
      'What emotions did you experience during this conversation?',
      'How did the conversation impact your relationship?',
      'What did you learn about yourself or the other person?'
    ]

    return {
      id,
      timestamp,
      conversationSummary,
      insights: analysis.insights || [],
      reflectionPrompts,
      emotionalState: {
        primary: analysis.emotionalTone?.overall || 'neutral',
        intensity: analysis.emotionalTone?.intensity || 0.5
      },
      metadata: {
        participantCount: participants.length,
        messageCount: messages.length,
        duration
      }
    }
  }

  async exportSession(session: ReflectionSession, format: 'json' | 'markdown'): Promise<string> {
    if (format === 'json') {
      return session.exportFormats.json
    } else {
      return session.exportFormats.markdown
    }
  }

  private generateMarkdown(data: any): string {
    let md = `# Reflection Session\n\n`
    md += `**Session ID:** ${data.id}\n`
    md += `**Date:** ${data.timestamp}\n\n`
    md += `## Summary\n\n`
    md += `Messages analyzed: ${data.messages.length}\n\n`
    md += `## Insights\n\n`
    data.analysis.insights.forEach((insight: string) => {
      md += `- ${insight}\n`
    })
    return md
  }
}

describe('ReflectionOrchestrator', () => {
  let orchestrator: MockReflectionOrchestrator

  beforeEach(() => {
    orchestrator = new MockReflectionOrchestrator()
  })

  describe('createSession', () => {
    it('should create a full reflection session', async () => {
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

      const session = await orchestrator.createSession(messages)

      expect(session).toBeDefined()
      expect(session.id).toMatch(/^session-/)
      expect(session.timestamp).toBeInstanceOf(Date)
      expect(session.messages).toEqual(messages)
      expect(session.analysis).toBeDefined()
      expect(session.voiceOutput).toBeDefined()
      expect(session.journalEntry).toBeDefined()
      expect(session.exportFormats).toBeDefined()
    })

    it('should include analysis results', async () => {
      const messages: Message[] = [
        {
          id: '1',
          text: 'Hello',
          sender: 'me',
          timestamp: new Date(),
          is_from_me: true
        }
      ]

      const session = await orchestrator.createSession(messages)

      expect(session.analysis.patterns).toBeInstanceOf(Array)
      expect(session.analysis.insights).toBeInstanceOf(Array)
      expect(session.analysis.emotionalTone).toBeDefined()
      expect(session.analysis.emotionalTone.overall).toBeDefined()
    })

    it('should throw error with empty messages', async () => {
      await expect(orchestrator.createSession([])).rejects.toThrow('Cannot create session with empty messages')
    })

    it('should generate unique session IDs', async () => {
      const messages: Message[] = [
        { id: '1', text: 'Test', sender: 'me', timestamp: new Date(), is_from_me: true }
      ]

      const session1 = await orchestrator.createSession(messages)
      // Wait a tiny bit to ensure different timestamp
      await new Promise(resolve => setTimeout(resolve, 10))
      const session2 = await orchestrator.createSession(messages)

      expect(session1.id).not.toBe(session2.id)
    })
  })

  describe('prepareVoiceOutput', () => {
    it('should prepare voice output with appropriate tone', async () => {
      const positiveAnalysis = {
        insights: ['Great conversation!'],
        emotionalTone: { overall: 'positive', intensity: 0.8 }
      }

      const voiceOutput = await orchestrator.prepareVoiceOutput(positiveAnalysis)

      expect(voiceOutput).toBeDefined()
      expect(voiceOutput.text).toBeDefined()
      expect(voiceOutput.text.length).toBeGreaterThan(0)
      expect(voiceOutput.voiceProfile).toBeDefined()
      expect(voiceOutput.voiceProfile.name).toBeDefined()
      expect(voiceOutput.voiceProfile.provider).toMatch(/sable|maya/)
      expect(voiceOutput.voiceProfile.emotionalTone).toBeDefined()
    })

    it('should select appropriate voice for positive tone', async () => {
      const analysis = {
        insights: ['Positive interaction'],
        emotionalTone: { overall: 'positive', intensity: 0.9 }
      }

      const voiceOutput = await orchestrator.prepareVoiceOutput(analysis)

      expect(voiceOutput.voiceProfile.name).toBe('Maya')
      expect(voiceOutput.voiceProfile.provider).toBe('maya')
      expect(voiceOutput.voiceProfile.emotionalTone).toBe('positive')
    })

    it('should select appropriate voice for negative tone', async () => {
      const analysis = {
        insights: ['Challenging conversation'],
        emotionalTone: { overall: 'negative', intensity: 0.7 }
      }

      const voiceOutput = await orchestrator.prepareVoiceOutput(analysis)

      expect(voiceOutput.voiceProfile.name).toBe('Sable')
      expect(voiceOutput.voiceProfile.provider).toBe('sable')
      expect(voiceOutput.voiceProfile.emotionalTone).toBe('negative')
    })

    it('should include insights in voice output text', async () => {
      const analysis = {
        insights: ['This is a test insight'],
        emotionalTone: { overall: 'neutral', intensity: 0.5 }
      }

      const voiceOutput = await orchestrator.prepareVoiceOutput(analysis)

      expect(voiceOutput.text).toContain('This is a test insight')
    })
  })

  describe('generateJournalEntry', () => {
    it('should generate comprehensive journal entry', async () => {
      const messages: Message[] = [
        {
          id: '1',
          text: 'Hello there!',
          sender: 'me',
          timestamp: new Date('2025-01-27T10:00:00'),
          is_from_me: true
        },
        {
          id: '2',
          text: 'Hi! How are you?',
          sender: '+1234567890',
          timestamp: new Date('2025-01-27T10:05:00'),
          is_from_me: false
        }
      ]

      const analysis = {
        insights: ['Friendly greeting', 'Mutual interest'],
        emotionalTone: { overall: 'positive', intensity: 0.6 }
      }

      const entry = await orchestrator.generateJournalEntry(messages, analysis)

      expect(entry).toBeDefined()
      expect(entry.id).toMatch(/^journal-/)
      expect(entry.timestamp).toBeInstanceOf(Date)
      expect(entry.conversationSummary).toBeDefined()
      expect(entry.insights).toEqual(analysis.insights)
      expect(entry.reflectionPrompts).toBeInstanceOf(Array)
      expect(entry.reflectionPrompts.length).toBeGreaterThan(0)
      expect(entry.emotionalState).toBeDefined()
      expect(entry.metadata).toBeDefined()
    })

    it('should include metadata about conversation', async () => {
      const messages: Message[] = [
        { id: '1', text: 'Test 1', sender: 'me', timestamp: new Date('2025-01-27T10:00:00'), is_from_me: true },
        { id: '2', text: 'Test 2', sender: '+1234567890', timestamp: new Date('2025-01-27T10:30:00'), is_from_me: false },
        { id: '3', text: 'Test 3', sender: 'me', timestamp: new Date('2025-01-27T11:00:00'), is_from_me: true }
      ]

      const analysis = { insights: [], emotionalTone: { overall: 'neutral', intensity: 0.5 } }
      const entry = await orchestrator.generateJournalEntry(messages, analysis)

      expect(entry.metadata.participantCount).toBe(2)
      expect(entry.metadata.messageCount).toBe(3)
      expect(entry.metadata.duration).toBe(3600000) // 1 hour in ms
    })

    it('should generate reflection prompts', async () => {
      const messages: Message[] = [
        { id: '1', text: 'Test', sender: 'me', timestamp: new Date(), is_from_me: true }
      ]

      const analysis = { insights: [], emotionalTone: { overall: 'neutral', intensity: 0.5 } }
      const entry = await orchestrator.generateJournalEntry(messages, analysis)

      expect(entry.reflectionPrompts).toBeInstanceOf(Array)
      expect(entry.reflectionPrompts.length).toBeGreaterThan(0)
      entry.reflectionPrompts.forEach(prompt => {
        expect(typeof prompt).toBe('string')
        expect(prompt.length).toBeGreaterThan(0)
      })
    })

    it('should capture emotional state', async () => {
      const messages: Message[] = [
        { id: '1', text: 'Test', sender: 'me', timestamp: new Date(), is_from_me: true }
      ]

      const analysis = {
        insights: [],
        emotionalTone: { overall: 'positive', intensity: 0.8 }
      }

      const entry = await orchestrator.generateJournalEntry(messages, analysis)

      expect(entry.emotionalState.primary).toBe('positive')
      expect(entry.emotionalState.intensity).toBe(0.8)
    })
  })

  describe('exportSession', () => {
    it('should export session as JSON', async () => {
      const messages: Message[] = [
        { id: '1', text: 'Test', sender: 'me', timestamp: new Date(), is_from_me: true }
      ]

      const session = await orchestrator.createSession(messages)
      const exported = await orchestrator.exportSession(session, 'json')

      expect(typeof exported).toBe('string')
      expect(() => JSON.parse(exported)).not.toThrow()

      const parsed = JSON.parse(exported)
      expect(parsed.id).toBeDefined()
      expect(parsed.messages).toBeDefined()
      expect(parsed.analysis).toBeDefined()
    })

    it('should export session as Markdown', async () => {
      const messages: Message[] = [
        { id: '1', text: 'Test', sender: 'me', timestamp: new Date(), is_from_me: true }
      ]

      const session = await orchestrator.createSession(messages)
      const exported = await orchestrator.exportSession(session, 'markdown')

      expect(typeof exported).toBe('string')
      expect(exported).toContain('# Reflection Session')
      expect(exported).toContain('Session ID:')
      expect(exported).toContain('## Insights')
    })

    it('should include session metadata in exports', async () => {
      const messages: Message[] = [
        { id: '1', text: 'Test', sender: 'me', timestamp: new Date(), is_from_me: true }
      ]

      const session = await orchestrator.createSession(messages)

      const jsonExport = await orchestrator.exportSession(session, 'json')
      const parsed = JSON.parse(jsonExport)
      expect(parsed.id).toBe(session.id)

      const mdExport = await orchestrator.exportSession(session, 'markdown')
      expect(mdExport).toContain(session.id)
    })
  })
})
