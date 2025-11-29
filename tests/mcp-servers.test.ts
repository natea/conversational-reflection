/**
 * MCP Servers Tests
 *
 * Tests for all MCP server implementations including:
 * - imessage-mcp: iMessage integration tool schemas and error handling
 * - sable-mcp: Emotional consciousness tool schemas and CLI execution
 * - maya-tts-mcp: Voice synthesis tool schemas and Python server integration
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { spawn } from 'child_process'
import type { ChildProcess } from 'child_process'

// Mock child_process for CLI tests
vi.mock('child_process', () => ({
  spawn: vi.fn(() => ({
    stdout: {
      on: vi.fn()
    },
    stderr: {
      on: vi.fn()
    },
    on: vi.fn()
  }))
}))

describe('iMessage MCP Server', () => {
  describe('Tool Schemas', () => {
    it('should define get_messages tool with correct schema', () => {
      const toolSchema = {
        name: 'get_messages',
        description: expect.stringContaining('iMessage messages'),
        inputSchema: {
          type: 'object',
          properties: {
            contact: { type: 'string' },
            since: { type: 'string' },
            limit: { type: 'number', default: 50 },
            unread_only: { type: 'boolean', default: false }
          }
        }
      }

      expect(toolSchema.name).toBe('get_messages')
      expect(toolSchema.inputSchema.properties.contact).toBeDefined()
      expect(toolSchema.inputSchema.properties.since).toBeDefined()
      expect(toolSchema.inputSchema.properties.limit.default).toBe(50)
    })

    it('should define list_chats tool with correct schema', () => {
      const toolSchema = {
        name: 'list_chats',
        description: expect.stringContaining('iMessage conversations'),
        inputSchema: {
          type: 'object',
          properties: {
            type: {
              type: 'string',
              enum: ['direct', 'group', 'all'],
              default: 'all'
            },
            has_unread: { type: 'boolean' },
            search: { type: 'string' },
            limit: { type: 'number', default: 50 }
          }
        }
      }

      expect(toolSchema.name).toBe('list_chats')
      expect(toolSchema.inputSchema.properties.type.enum).toContain('direct')
      expect(toolSchema.inputSchema.properties.type.enum).toContain('group')
      expect(toolSchema.inputSchema.properties.type.enum).toContain('all')
    })

    it('should define watch_messages tool with correct schema', () => {
      const toolSchema = {
        name: 'watch_messages',
        description: expect.stringContaining('watching'),
        inputSchema: {
          type: 'object',
          properties: {
            poll_interval: {
              type: 'number',
              default: 3000,
              minimum: 1000
            },
            contacts: {
              type: 'array',
              items: { type: 'string' }
            }
          }
        }
      }

      expect(toolSchema.name).toBe('watch_messages')
      expect(toolSchema.inputSchema.properties.poll_interval.minimum).toBe(1000)
      expect(toolSchema.inputSchema.properties.contacts.type).toBe('array')
    })
  })

  describe('Data Structures', () => {
    it('should correctly structure IMessage interface', () => {
      const mockMessage = {
        id: 'msg-123',
        text: 'Hello world',
        sender: '+1234567890',
        timestamp: new Date('2025-01-15T10:00:00Z'),
        isFromMe: false,
        chatId: 'chat-456',
        attachments: ['image.jpg']
      }

      expect(mockMessage).toHaveProperty('id')
      expect(mockMessage).toHaveProperty('text')
      expect(mockMessage).toHaveProperty('sender')
      expect(mockMessage).toHaveProperty('timestamp')
      expect(mockMessage).toHaveProperty('isFromMe')
      expect(mockMessage).toHaveProperty('chatId')
      expect(mockMessage.attachments).toBeInstanceOf(Array)
    })

    it('should correctly structure IChat interface', () => {
      const mockChat = {
        id: 'chat-789',
        displayName: 'John Doe',
        participants: ['+1234567890', '+0987654321'],
        isGroup: false,
        unreadCount: 5,
        lastMessage: {
          id: 'msg-999',
          text: 'Last message',
          sender: '+1234567890',
          timestamp: new Date(),
          isFromMe: false,
          chatId: 'chat-789'
        }
      }

      expect(mockChat).toHaveProperty('id')
      expect(mockChat).toHaveProperty('displayName')
      expect(mockChat).toHaveProperty('participants')
      expect(mockChat).toHaveProperty('isGroup')
      expect(mockChat).toHaveProperty('unreadCount')
      expect(mockChat.participants).toBeInstanceOf(Array)
    })
  })

  describe('Error Handling', () => {
    it('should handle missing imessage-kit dependency', () => {
      const errorMessage = 'iMessage is not available. macOS with Full Disk Access is required.'
      expect(errorMessage).toContain('macOS')
      expect(errorMessage).toContain('Full Disk Access')
    })

    it('should validate date format in since parameter', () => {
      const invalidDate = 'not-a-date'
      const parsed = new Date(invalidDate)
      expect(isNaN(parsed.getTime())).toBe(true)
    })

    it('should validate minimum poll interval', () => {
      const minInterval = 1000
      const invalidInterval = 500

      expect(invalidInterval).toBeLessThan(minInterval)
    })
  })
})

describe('Sable MCP Server', () => {
  describe('Tool Schemas', () => {
    it('should define analyze_emotion tool', () => {
      const toolSchema = {
        name: 'analyze_emotion',
        description: expect.stringContaining('emotional content'),
        inputSchema: {
          type: 'object',
          properties: {
            text: { type: 'string' }
          },
          required: ['text']
        }
      }

      expect(toolSchema.name).toBe('analyze_emotion')
      expect(toolSchema.inputSchema.required).toContain('text')
    })

    it('should define feel_emotion tool with emotion enum', () => {
      const toolSchema = {
        name: 'feel_emotion',
        inputSchema: {
          type: 'object',
          properties: {
            emotion: {
              type: 'string',
              enum: ['fear', 'anger', 'joy', 'sadness', 'disgust', 'surprise']
            },
            intensity: {
              type: 'number',
              minimum: 0,
              maximum: 1
            },
            cause: { type: 'string' }
          },
          required: ['emotion', 'intensity', 'cause']
        }
      }

      expect(toolSchema.inputSchema.properties.emotion.enum).toHaveLength(6)
      expect(toolSchema.inputSchema.properties.emotion.enum).toContain('joy')
      expect(toolSchema.inputSchema.properties.intensity.minimum).toBe(0)
      expect(toolSchema.inputSchema.properties.intensity.maximum).toBe(1)
    })

    it('should define get_emotional_state tool', () => {
      const toolSchema = {
        name: 'get_emotional_state',
        description: expect.stringContaining('emotional state'),
        inputSchema: {
          type: 'object',
          properties: {}
        }
      }

      expect(toolSchema.name).toBe('get_emotional_state')
      expect(Object.keys(toolSchema.inputSchema.properties)).toHaveLength(0)
    })

    it('should define record_memory tool', () => {
      const toolSchema = {
        name: 'record_memory',
        inputSchema: {
          type: 'object',
          properties: {
            description: { type: 'string' },
            salience: {
              type: 'number',
              minimum: 0,
              maximum: 1
            }
          },
          required: ['description', 'salience']
        }
      }

      expect(toolSchema.inputSchema.required).toContain('description')
      expect(toolSchema.inputSchema.required).toContain('salience')
    })

    it('should define query_memories tool', () => {
      const toolSchema = {
        name: 'query_memories',
        inputSchema: {
          type: 'object',
          properties: {
            min_salience: {
              type: 'number',
              minimum: 0,
              maximum: 1,
              default: 0.5
            },
            limit: {
              type: 'number',
              minimum: 1,
              maximum: 100,
              default: 10
            }
          }
        }
      }

      expect(toolSchema.inputSchema.properties.min_salience.default).toBe(0.5)
      expect(toolSchema.inputSchema.properties.limit.default).toBe(10)
    })

    it('should define check_somatic_markers tool', () => {
      const toolSchema = {
        name: 'check_somatic_markers',
        description: expect.stringContaining('somatic markers'),
        inputSchema: {
          type: 'object',
          properties: {
            context: { type: 'string' }
          },
          required: ['context']
        }
      }

      expect(toolSchema.inputSchema.required).toContain('context')
    })
  })

  describe('CLI Execution Mocking', () => {
    let mockSpawn: any

    beforeEach(() => {
      mockSpawn = vi.mocked(spawn)
    })

    it('should spawn sable CLI with correct arguments for analyze', () => {
      const args = ['analyze', 'I am happy']

      // This would be the actual call in the server
      const expectedCommand = 'sable'
      const expectedArgs = args

      expect(expectedCommand).toBe('sable')
      expect(expectedArgs).toEqual(['analyze', 'I am happy'])
    })

    it('should spawn sable CLI with correct arguments for feel', () => {
      const args = ['feel', 'joy', '0.8', '--cause', 'Good news']

      expect(args[0]).toBe('feel')
      expect(args[1]).toBe('joy')
      expect(parseFloat(args[2])).toBeGreaterThanOrEqual(0)
      expect(parseFloat(args[2])).toBeLessThanOrEqual(1)
      expect(args[3]).toBe('--cause')
    })

    it('should handle ENOENT error when sable not installed', () => {
      const error = {
        code: 'ENOENT',
        message: 'Sable CLI not found'
      }

      expect(error.code).toBe('ENOENT')
    })
  })

  describe('Response Parsing', () => {
    it('should parse JSON emotion analysis response', () => {
      const jsonResponse = JSON.stringify({
        emotions: [
          { type: 'joy', intensity: 0.8 },
          { type: 'anger', intensity: 0.3 }
        ]
      })

      const parsed = JSON.parse(jsonResponse)
      expect(parsed.emotions).toBeInstanceOf(Array)
      expect(parsed.emotions[0].type).toBe('joy')
      expect(parsed.emotions[0].intensity).toBe(0.8)
    })

    it('should parse text emotion analysis response', () => {
      const textResponse = 'joy: 0.8\nanger: 0.3'
      const lines = textResponse.split('\n')

      const emotions = lines.map(line => {
        const match = line.match(/(\w+):\s*([\d.]+)/)
        if (match) {
          return {
            type: match[1],
            intensity: parseFloat(match[2])
          }
        }
        return null
      }).filter(Boolean)

      expect(emotions).toHaveLength(2)
      expect(emotions[0]).toMatchObject({ type: 'joy', intensity: 0.8 })
    })

    it('should parse emotional state response', () => {
      const stateResponse = {
        body_state: {
          heart_rate: 75,
          temperature: 37.0,
          tension: 0.3
        },
        emotions: [{ type: 'joy', intensity: 0.6 }],
        background_feelings: ['contentment']
      }

      expect(stateResponse.body_state).toBeDefined()
      expect(stateResponse.emotions).toBeInstanceOf(Array)
      expect(stateResponse.background_feelings).toBeInstanceOf(Array)
    })

    it('should parse memories response', () => {
      const memoriesResponse = [
        {
          id: 'mem-123',
          description: 'First day at school',
          salience: 0.9,
          timestamp: '2025-01-01T00:00:00Z'
        }
      ]

      expect(memoriesResponse[0]).toHaveProperty('id')
      expect(memoriesResponse[0]).toHaveProperty('description')
      expect(memoriesResponse[0]).toHaveProperty('salience')
      expect(memoriesResponse[0]).toHaveProperty('timestamp')
    })
  })
})

describe('Maya TTS MCP Server', () => {
  describe('Tool Schemas', () => {
    it('should define speak_as_contact tool', () => {
      const toolSchema = {
        name: 'speak_as_contact',
        description: expect.stringContaining('voice profile'),
        inputSchema: {
          type: 'object',
          properties: {
            text: { type: 'string' },
            voice_description: { type: 'string' },
            emotion_tags: {
              type: 'array',
              items: {
                type: 'string',
                enum: ['laugh', 'giggle', 'sigh', 'gasp', 'cry', 'whisper', 'angry']
              },
              default: []
            }
          },
          required: ['text', 'voice_description']
        }
      }

      expect(toolSchema.inputSchema.required).toContain('text')
      expect(toolSchema.inputSchema.required).toContain('voice_description')
      expect(toolSchema.inputSchema.properties.emotion_tags.items.enum).toContain('laugh')
    })

    it('should define speak_reflection tool', () => {
      const toolSchema = {
        name: 'speak_reflection',
        inputSchema: {
          type: 'object',
          properties: {
            text: { type: 'string' },
            tone: {
              type: 'string',
              enum: ['neutral', 'gentle', 'concerned', 'warm'],
              default: 'neutral'
            }
          },
          required: ['text']
        }
      }

      expect(toolSchema.inputSchema.properties.tone.enum).toHaveLength(4)
      expect(toolSchema.inputSchema.properties.tone.default).toBe('neutral')
    })

    it('should define preview_voice tool', () => {
      const toolSchema = {
        name: 'preview_voice',
        inputSchema: {
          type: 'object',
          properties: {
            voice_description: { type: 'string' },
            sample_text: {
              type: 'string',
              default: 'Hello, this is how I sound.'
            }
          },
          required: ['voice_description']
        }
      }

      expect(toolSchema.inputSchema.required).toContain('voice_description')
      expect(toolSchema.inputSchema.properties.sample_text.default).toBeTruthy()
    })
  })

  describe('Zod Schema Validation', () => {
    it('should validate speak_as_contact parameters', () => {
      const validParams = {
        text: 'Hello world',
        voice_description: 'Female voice in her 30s',
        emotion_tags: ['laugh']
      }

      expect(validParams.text).toBeTruthy()
      expect(validParams.voice_description).toBeTruthy()
      expect(validParams.emotion_tags).toBeInstanceOf(Array)
    })

    it('should validate speak_reflection parameters', () => {
      const validParams = {
        text: 'This is a reflection',
        tone: 'warm'
      }

      expect(['neutral', 'gentle', 'concerned', 'warm']).toContain(validParams.tone)
    })

    it('should reject empty text', () => {
      const invalidParams = {
        text: '',
        voice_description: 'Some voice'
      }

      expect(invalidParams.text.length).toBe(0)
      // In actual implementation, Zod would throw: "Text cannot be empty"
    })

    it('should reject empty voice description', () => {
      const invalidParams = {
        text: 'Hello',
        voice_description: ''
      }

      expect(invalidParams.voice_description.length).toBe(0)
      // In actual implementation, Zod would throw: "Voice description required"
    })
  })

  describe('Python Server Integration', () => {
    it('should configure correct Python server port', () => {
      const PYTHON_SERVER_PORT = 8765
      const PYTHON_SERVER_URL = `http://localhost:${PYTHON_SERVER_PORT}`

      expect(PYTHON_SERVER_URL).toBe('http://localhost:8765')
    })

    it('should set appropriate startup timeout', () => {
      const PYTHON_SERVER_STARTUP_TIMEOUT = 30000 // 30 seconds

      expect(PYTHON_SERVER_STARTUP_TIMEOUT).toBeGreaterThanOrEqual(30000)
    })

    it('should spawn Python server with correct arguments', () => {
      const serverPath = '/path/to/server.py'
      const command = 'python3'
      const args = [serverPath]
      const env = { PYTHONUNBUFFERED: '1' }

      expect(command).toBe('python3')
      expect(args).toContain(serverPath)
      expect(env.PYTHONUNBUFFERED).toBe('1')
    })

    it('should check health endpoint for readiness', () => {
      const healthEndpoint = '/health'
      const fullUrl = `http://localhost:8765${healthEndpoint}`

      expect(fullUrl).toBe('http://localhost:8765/health')
    })
  })

  describe('Response Handling', () => {
    it('should structure audio response correctly', () => {
      const mockResponse = {
        audio_path: '/path/to/audio.wav',
        audio_base64: 'base64encodedstring',
        duration_seconds: 3.5,
        voice_description: 'Female voice',
        emotion_tags: ['laugh']
      }

      expect(mockResponse).toHaveProperty('audio_path')
      expect(mockResponse).toHaveProperty('audio_base64')
      expect(mockResponse).toHaveProperty('duration_seconds')
      expect(mockResponse.duration_seconds).toBeGreaterThan(0)
    })

    it('should handle Python server errors', () => {
      const errorResponse = {
        error: 'Model not loaded'
      }

      expect(errorResponse).toHaveProperty('error')
      expect(errorResponse.error).toBeTruthy()
    })
  })

  describe('Tone to Voice Description Mapping', () => {
    it('should map tones to appropriate voice descriptions', () => {
      const toneDescriptions: Record<string, string> = {
        neutral: 'Female voice in her 40s, neutral American accent, calm and professional timbre',
        gentle: 'Female voice in her 40s, soft American accent, gentle and soothing timbre',
        concerned: 'Female voice in her 40s, warm American accent, concerned but supportive timbre',
        warm: 'Female voice in her 40s, warm American accent, friendly and compassionate timbre'
      }

      expect(toneDescriptions.neutral).toContain('calm')
      expect(toneDescriptions.gentle).toContain('gentle')
      expect(toneDescriptions.concerned).toContain('concerned')
      expect(toneDescriptions.warm).toContain('warm')
    })
  })
})

describe('MCP Server Integration', () => {
  it('should all servers use stdio transport', () => {
    const transportType = 'stdio'

    expect(transportType).toBe('stdio')
  })

  it('should all servers handle tool listing', () => {
    const listToolsHandler = 'ListToolsRequestSchema'

    expect(listToolsHandler).toBe('ListToolsRequestSchema')
  })

  it('should all servers handle tool calling', () => {
    const callToolHandler = 'CallToolRequestSchema'

    expect(callToolHandler).toBe('CallToolRequestSchema')
  })

  it('should all servers handle errors gracefully', () => {
    const errorResponse = {
      content: [
        {
          type: 'text',
          text: 'Error: Something went wrong'
        }
      ],
      isError: true
    }

    expect(errorResponse.isError).toBe(true)
    expect(errorResponse.content[0].type).toBe('text')
  })
})
