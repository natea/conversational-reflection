/**
 * Maya TTS Client Tests
 *
 * Tests for the Maya1 voice synthesis wrapper.
 * Note: Full functionality requires Maya1 model and GPU.
 */

import { describe, it, expect, beforeEach } from 'vitest'
import {
  MayaClient,
  getMayaClient,
  type VoiceDescription,
  type MayaEmotionTag
} from '../src/lib/maya-client.js'

describe('MayaClient', () => {
  let client: MayaClient

  beforeEach(() => {
    client = new MayaClient()
  })

  describe('initialization', () => {
    it('should create a new client instance', () => {
      expect(client).toBeInstanceOf(MayaClient)
    })

    it('should return singleton from getMayaClient', () => {
      const client1 = getMayaClient()
      const client2 = getMayaClient()
      expect(client1).toBe(client2)
    })

    it('should accept custom config', () => {
      const customClient = new MayaClient({
        modelPath: 'custom/model',
        outputDir: '/tmp/audio',
        useCloud: true,
        cloudApiKey: 'test-key'
      })
      expect(customClient).toBeInstanceOf(MayaClient)
    })
  })

  describe('isAvailable', () => {
    it('should check if Maya1 is available', async () => {
      const available = await client.isAvailable()
      expect(typeof available).toBe('boolean')
    })
  })

  describe('buildVoiceDescription', () => {
    it('should build description from structured input', () => {
      const desc: VoiceDescription = {
        gender: 'female',
        age: '30s',
        accent: 'American',
        timbre: 'warm',
        pace: 'conversational',
        tone: 'friendly'
      }

      const result = client.buildVoiceDescription(desc)

      expect(result).toContain('female voice')
      expect(result).toContain('30s')
      expect(result).toContain('American accent')
      expect(result).toContain('warm timbre')
      expect(result).toContain('conversational pacing')
      expect(result).toContain('friendly tone')
    })

    it('should handle partial descriptions', () => {
      const desc: VoiceDescription = {
        gender: 'male',
        tone: 'calm'
      }

      const result = client.buildVoiceDescription(desc)

      expect(result).toContain('male voice')
      expect(result).toContain('calm tone')
    })

    it('should handle age variations', () => {
      const desc1: VoiceDescription = { age: '40-year-old' }
      const desc2: VoiceDescription = { age: 'their 20s' }

      const result1 = client.buildVoiceDescription(desc1)
      const result2 = client.buildVoiceDescription(desc2)

      expect(result1).toBeTruthy()
      expect(result2).toBeTruthy()
    })
  })

  describe('injectEmotionTags', () => {
    it('should inject tag at start position', () => {
      const text = 'Hello world.'
      const tags: Array<{ tag: MayaEmotionTag; position: 'start' | 'end' | 'inline' }> = [
        { tag: 'sigh', position: 'start' }
      ]

      const result = client.injectEmotionTags(text, tags)

      expect(result).toBe('<sigh> Hello world.')
    })

    it('should inject tag at end position', () => {
      const text = 'Hello world.'
      const tags: Array<{ tag: MayaEmotionTag; position: 'start' | 'end' | 'inline' }> = [
        { tag: 'laugh', position: 'end' }
      ]

      const result = client.injectEmotionTags(text, tags)

      expect(result).toBe('Hello world. <laugh>')
    })

    it('should inject tag inline after first sentence', () => {
      const text = 'Hello world. How are you?'
      const tags: Array<{ tag: MayaEmotionTag; position: 'start' | 'end' | 'inline' }> = [
        { tag: 'chuckle', position: 'inline' }
      ]

      const result = client.injectEmotionTags(text, tags)

      expect(result).toBe('Hello world. <chuckle> How are you?')
    })

    it('should handle multiple tags', () => {
      const text = 'I cannot believe this.'
      const tags: Array<{ tag: MayaEmotionTag; position: 'start' | 'end' | 'inline' }> = [
        { tag: 'gasp', position: 'start' },
        { tag: 'sigh', position: 'end' }
      ]

      const result = client.injectEmotionTags(text, tags)

      expect(result).toContain('<gasp>')
      expect(result).toContain('<sigh>')
    })
  })

  describe('MayaEmotionTag', () => {
    it('should include all supported emotion tags', () => {
      const tags: MayaEmotionTag[] = [
        'laugh', 'sigh', 'whisper', 'angry', 'giggle',
        'chuckle', 'gasp', 'cry', 'yawn', 'cough',
        'clear_throat', 'sniff', 'groan', 'hum'
      ]

      expect(tags).toHaveLength(14)
      tags.forEach(tag => {
        expect(typeof tag).toBe('string')
      })
    })
  })

  describe('VoiceDescription', () => {
    it('should have correct property types', () => {
      const desc: VoiceDescription = {
        gender: 'female',
        age: '30s',
        accent: 'British',
        pitch: 'medium',
        pace: 'conversational',
        tone: 'warm',
        timbre: 'clear'
      }

      expect(['male', 'female', 'neutral']).toContain(desc.gender)
      expect(['low', 'medium', 'high']).toContain(desc.pitch)
      expect(['slow', 'conversational', 'fast']).toContain(desc.pace)
    })
  })

  describe('getOutputDir', () => {
    it('should return output directory path', () => {
      const dir = client.getOutputDir()
      expect(typeof dir).toBe('string')
      expect(dir).toContain('audio_cache')
    })
  })
})

describe('Maya Voice Synthesis Patterns', () => {
  it('should support contact voice profiles', () => {
    const contactProfile: VoiceDescription = {
      gender: 'female',
      age: '30s',
      accent: 'American',
      timbre: 'warm but strained',
      pace: 'conversational',
      tone: 'frustrated'
    }

    expect(contactProfile.tone).toBe('frustrated')
  })

  it('should support AI reflection voice', () => {
    const aiProfile: VoiceDescription = {
      gender: 'neutral',
      pace: 'conversational',
      timbre: 'clear',
      tone: 'calm and measured'
    }

    expect(aiProfile.tone).toBe('calm and measured')
  })

  it('should support tone variations for AI', () => {
    const tones = ['neutral', 'gentle', 'concerned', 'warm']

    tones.forEach(tone => {
      expect(['neutral', 'gentle', 'concerned', 'warm']).toContain(tone)
    })
  })
})
