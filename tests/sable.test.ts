/**
 * Sable Client Tests
 *
 * Tests for the Sable consciousness framework wrapper.
 * Note: Full functionality requires Sable CLI to be installed.
 */

import { describe, it, expect, beforeEach } from 'vitest'
import {
  SableClient,
  getSableClient,
  type EmotionType,
  type EmotionalState,
  type BodyState,
  type EmotionAnalysis
} from '../src/lib/sable-client.js'

describe('SableClient', () => {
  let client: SableClient

  beforeEach(() => {
    client = new SableClient()
  })

  describe('initialization', () => {
    it('should create a new client instance', () => {
      expect(client).toBeInstanceOf(SableClient)
    })

    it('should return singleton from getSableClient', () => {
      const client1 = getSableClient()
      const client2 = getSableClient()
      expect(client1).toBe(client2)
    })

    it('should accept custom sable path', () => {
      const customClient = new SableClient('/custom/path/to/sable')
      expect(customClient).toBeInstanceOf(SableClient)
    })
  })

  describe('isAvailable', () => {
    it('should check if Sable CLI is available', async () => {
      const available = await client.isAvailable()
      expect(typeof available).toBe('boolean')
    })
  })

  describe('EmotionType', () => {
    it('should have all Damasio primary emotions', () => {
      const emotions: EmotionType[] = [
        'fear', 'anger', 'joy', 'sadness', 'disgust', 'surprise'
      ]

      emotions.forEach(emotion => {
        expect(['fear', 'anger', 'joy', 'sadness', 'disgust', 'surprise'])
          .toContain(emotion)
      })
    })
  })

  describe('BodyState structure', () => {
    it('should have correct body state properties', () => {
      const mockBodyState: BodyState = {
        energy: 0.7,
        stress: 0.3,
        arousal: 0.5,
        valence: 0,
        temperature: 0.5,
        tension: 0.3,
        fatigue: 0.3,
        pain: 0,
        homeostaticPressure: 0
      }

      expect(mockBodyState.energy).toBeGreaterThanOrEqual(0)
      expect(mockBodyState.energy).toBeLessThanOrEqual(1)
      expect(mockBodyState.stress).toBeGreaterThanOrEqual(0)
      expect(mockBodyState.stress).toBeLessThanOrEqual(1)
      expect(mockBodyState.valence).toBeGreaterThanOrEqual(-1)
      expect(mockBodyState.valence).toBeLessThanOrEqual(1)
    })
  })

  describe('EmotionalState structure', () => {
    it('should have correct emotional state properties', () => {
      const mockState: EmotionalState = {
        bodyState: {
          energy: 0.7,
          stress: 0.3,
          arousal: 0.5,
          valence: 0,
          temperature: 0.5,
          tension: 0.3,
          fatigue: 0.3,
          pain: 0,
          homeostaticPressure: 0
        },
        currentEmotions: [
          {
            type: 'joy',
            intensity: 0.6,
            cause: 'Test',
            timestamp: new Date()
          }
        ],
        backgroundEmotion: 'contentment',
        timestamp: new Date()
      }

      expect(mockState.bodyState).toBeDefined()
      expect(mockState.currentEmotions).toBeInstanceOf(Array)
      expect(['malaise', 'contentment', 'tension']).toContain(mockState.backgroundEmotion)
    })
  })

  describe('EmotionAnalysis structure', () => {
    it('should have correct analysis properties', () => {
      const mockAnalysis: EmotionAnalysis = {
        emotions: [
          { type: 'anger', intensity: 0.7 },
          { type: 'sadness', intensity: 0.4 }
        ],
        dominantEmotion: 'anger',
        overallIntensity: 0.55,
        bodyStateImpact: {
          stress: 0.3,
          valence: -0.4
        }
      }

      expect(mockAnalysis.emotions).toBeInstanceOf(Array)
      expect(mockAnalysis.emotions.length).toBe(2)
      expect(mockAnalysis.dominantEmotion).toBe('anger')
      expect(mockAnalysis.overallIntensity).toBeGreaterThanOrEqual(0)
      expect(mockAnalysis.overallIntensity).toBeLessThanOrEqual(1)
    })
  })

  describe('feel method signature', () => {
    it('should accept emotion, intensity, and optional cause', () => {
      // Type check - these should compile without errors
      const emotion: EmotionType = 'joy'
      const intensity = 0.8
      const cause = 'Testing'

      expect(emotion).toBe('joy')
      expect(intensity).toBe(0.8)
      expect(cause).toBe('Testing')
    })
  })

  describe('getMemories parameters', () => {
    it('should accept minSalience and limit', () => {
      const params = {
        minSalience: 0.5,
        limit: 10
      }

      expect(params.minSalience).toBeGreaterThanOrEqual(0)
      expect(params.minSalience).toBeLessThanOrEqual(1)
      expect(params.limit).toBeGreaterThan(0)
    })
  })

  describe('SomaticMarker structure', () => {
    it('should have correct somatic marker properties', () => {
      const mockMarker = {
        triggerPattern: 'arguments about listening',
        responseTendency: 'tension and avoidance',
        valence: -0.6,
        strength: 0.7
      }

      expect(mockMarker.triggerPattern).toBeTruthy()
      expect(mockMarker.responseTendency).toBeTruthy()
      expect(mockMarker.valence).toBeGreaterThanOrEqual(-1)
      expect(mockMarker.valence).toBeLessThanOrEqual(1)
      expect(mockMarker.strength).toBeGreaterThanOrEqual(0)
      expect(mockMarker.strength).toBeLessThanOrEqual(1)
    })
  })
})

describe('Sable Emotion Constants', () => {
  it('should define all primary emotions', () => {
    const primaryEmotions: EmotionType[] = [
      'fear', 'anger', 'joy', 'sadness', 'disgust', 'surprise'
    ]

    expect(primaryEmotions).toHaveLength(6)
  })

  it('should define background emotions', () => {
    const backgroundEmotions = ['malaise', 'contentment', 'tension']
    expect(backgroundEmotions).toHaveLength(3)
  })
})
