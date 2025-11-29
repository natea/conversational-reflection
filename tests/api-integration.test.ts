/**
 * API Integration Tests
 *
 * Tests for the unified ConversationalReflectionAPI
 */

import { describe, it, expect, beforeEach } from 'vitest'
import {
  createAPI,
  VERSION,
  analyzeTextEmotion,
  processEmotions,
  getVoiceProfileManager,
  type ConversationalReflectionAPI,
  type EmotionAnalysisResult
} from '../src/index.js'

describe('Conversational Reflection API', () => {
  describe('Version', () => {
    it('should export version constant', () => {
      expect(VERSION).toBe('1.0.0')
    })
  })

  describe('createAPI', () => {
    let api: ConversationalReflectionAPI

    beforeEach(() => {
      api = createAPI()
    })

    it('should create API instance', () => {
      expect(api).toBeDefined()
      expect(api.analyzeEmotions).toBeDefined()
      expect(api.processTextWithEmotions).toBeDefined()
      expect(api.getVoiceProfile).toBeDefined()
      expect(api.setVoiceProfile).toBeDefined()
      expect(api.isIMessageAvailable).toBeDefined()
      expect(api.isSableAvailable).toBeDefined()
      expect(api.isMayaAvailable).toBeDefined()
    })

    it('should analyze emotions', () => {
      const text = "I'm so happy and excited!"
      const emotions = api.analyzeEmotions(text)

      expect(emotions).toBeDefined()
      expect(Array.isArray(emotions)).toBe(true)
      expect(emotions.length).toBeGreaterThan(0)
      expect(emotions[0]).toHaveProperty('type')
      expect(emotions[0]).toHaveProperty('intensity')
    })

    it('should process text with emotions', () => {
      const text = "This is amazing!"
      const result = api.processTextWithEmotions(text)

      expect(result).toBeDefined()
      expect(typeof result).toBe('string')
      expect(result.length).toBeGreaterThan(0)
    })

    it('should manage voice profiles', () => {
      const contactId = 'test-contact-123'
      const profile = {
        name: 'Test User',
        voiceDescription: {
          gender: 'neutral' as const,
          pace: 'conversational' as const,
          timbre: 'clear'
        },
        typicalEmotions: ['joy' as const, 'sadness' as const]
      }

      // Set profile
      const created = api.setVoiceProfile(contactId, profile)
      expect(created).toBeDefined()
      expect(created.contactId).toBe(contactId)
      expect(created.name).toBe(profile.name)

      // Get profile
      const retrieved = api.getVoiceProfile(contactId)
      expect(retrieved).toBeDefined()
      expect(retrieved?.contactId).toBe(contactId)
      expect(retrieved?.name).toBe(profile.name)

      // Clean up
      const manager = getVoiceProfileManager()
      manager.deleteContactProfile(contactId)
    })

    it('should check iMessage availability', async () => {
      const available = await api.isIMessageAvailable()
      expect(typeof available).toBe('boolean')
    })

    it('should check Sable availability', async () => {
      const available = await api.isSableAvailable()
      expect(typeof available).toBe('boolean')
    })

    it('should check Maya availability', async () => {
      const available = await api.isMayaAvailable()
      expect(typeof available).toBe('boolean')
    })
  })

  describe('Direct exports', () => {
    it('should export emotion analysis function', () => {
      const emotions = analyzeTextEmotion("I'm so angry!")
      expect(emotions).toBeDefined()
      expect(Array.isArray(emotions)).toBe(true)
      expect(emotions.length).toBeGreaterThan(0)
    })

    it('should export emotion processing function', () => {
      const text = "This is terrible!"
      const result = processEmotions(text)
      expect(result).toBeDefined()
      expect(typeof result).toBe('string')
    })

    it('should export voice profile manager', () => {
      const manager = getVoiceProfileManager()
      expect(manager).toBeDefined()
      expect(manager.getContactProfile).toBeDefined()
      expect(manager.setContactProfile).toBeDefined()
      expect(manager.getAIProfile).toBeDefined()
    })
  })

  describe('Emotion analysis integration', () => {
    it('should analyze happy emotions', () => {
      const text = "I'm so excited and happy! This is wonderful! 😊"
      const emotions = analyzeTextEmotion(text)

      expect(emotions.length).toBeGreaterThan(0)
      expect(emotions[0].type).toBe('joy')
      expect(emotions[0].intensity).toBeGreaterThan(0.5)
    })

    it('should analyze sad emotions', () => {
      const text = "I'm so sad and disappointed 😢"
      const emotions = analyzeTextEmotion(text)

      expect(emotions.length).toBeGreaterThan(0)
      expect(emotions[0].type).toBe('sadness')
      expect(emotions[0].intensity).toBeGreaterThan(0.5)
    })

    it('should analyze angry emotions', () => {
      const text = "I'm FURIOUS and mad! This is terrible!"
      const emotions = analyzeTextEmotion(text)

      expect(emotions.length).toBeGreaterThan(0)
      expect(emotions[0].type).toBe('anger')
      expect(emotions[0].intensity).toBeGreaterThan(0.5)
    })

    it('should process emotions with tags', () => {
      const text = "This is amazing!"
      const emotions: EmotionAnalysisResult[] = [
        { type: 'joy', intensity: 0.8 }
      ]
      const result = processEmotions(text, emotions)

      expect(result).toContain('<')
      expect(result).toContain('>')
      expect(result).toContain('amazing')
    })
  })
})
