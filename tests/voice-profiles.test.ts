/**
 * Voice Profiles Tests
 *
 * Tests for voice profile management.
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { existsSync, unlinkSync, mkdirSync, rmdirSync } from 'fs'
import { join } from 'path'
import { tmpdir } from 'os'
import {
  VoiceProfileManager,
  getVoiceProfileManager,
  type ContactVoiceProfile,
  type AIVoiceProfile
} from '../src/lib/voice-profiles.js'

describe('VoiceProfileManager', () => {
  let manager: VoiceProfileManager
  let testStorePath: string

  beforeEach(() => {
    // Use temp directory for tests
    const testDir = join(tmpdir(), 'conversation-reflection-test')
    if (!existsSync(testDir)) {
      mkdirSync(testDir, { recursive: true })
    }
    testStorePath = join(testDir, `voice-profiles-${Date.now()}.json`)
    manager = new VoiceProfileManager(testStorePath)
  })

  afterEach(() => {
    // Clean up test files
    if (existsSync(testStorePath)) {
      unlinkSync(testStorePath)
    }
  })

  describe('initialization', () => {
    it('should create a new manager instance', () => {
      expect(manager).toBeInstanceOf(VoiceProfileManager)
    })

    it('should create store file on first save', () => {
      manager.setContactProfile('+1234567890', {
        voiceDescription: { gender: 'female' },
        typicalEmotions: ['joy']
      })

      expect(existsSync(testStorePath)).toBe(true)
    })
  })

  describe('getContactProfile', () => {
    it('should return null for non-existent contact', () => {
      const profile = manager.getContactProfile('+1234567890')
      expect(profile).toBeNull()
    })
  })

  describe('setContactProfile', () => {
    it('should create a new contact profile', () => {
      const profile = manager.setContactProfile('+1234567890', {
        name: 'Sarah',
        voiceDescription: {
          gender: 'female',
          age: '30s',
          accent: 'American',
          timbre: 'warm',
          pace: 'conversational'
        },
        typicalEmotions: ['joy', 'frustration' as any],
        speakingStyle: 'expressive'
      })

      expect(profile.contactId).toBe('+1234567890')
      expect(profile.name).toBe('Sarah')
      expect(profile.voiceDescription.gender).toBe('female')
      expect(profile.createdAt).toBeInstanceOf(Date)
      expect(profile.updatedAt).toBeInstanceOf(Date)
    })

    it('should update existing profile', () => {
      manager.setContactProfile('+1234567890', {
        name: 'Sarah',
        voiceDescription: { gender: 'female' },
        typicalEmotions: ['joy']
      })

      const originalCreatedAt = manager.getContactProfile('+1234567890')?.createdAt

      // Update the profile
      const updated = manager.setContactProfile('+1234567890', {
        name: 'Sarah Updated',
        voiceDescription: { gender: 'female', tone: 'warm' },
        typicalEmotions: ['joy', 'anger']
      })

      expect(updated.name).toBe('Sarah Updated')
      expect(updated.createdAt).toEqual(originalCreatedAt)
      expect(updated.updatedAt.getTime()).toBeGreaterThanOrEqual(updated.createdAt.getTime())
    })
  })

  describe('updateContactProfile', () => {
    it('should update specific fields', () => {
      manager.setContactProfile('+1234567890', {
        name: 'Sarah',
        voiceDescription: { gender: 'female' },
        typicalEmotions: ['joy']
      })

      const updated = manager.updateContactProfile('+1234567890', {
        speakingStyle: 'expressive'
      })

      expect(updated?.name).toBe('Sarah')
      expect(updated?.speakingStyle).toBe('expressive')
    })

    it('should return null for non-existent contact', () => {
      const result = manager.updateContactProfile('+9999999999', {
        speakingStyle: 'calm'
      })

      expect(result).toBeNull()
    })
  })

  describe('deleteContactProfile', () => {
    it('should delete existing profile', () => {
      manager.setContactProfile('+1234567890', {
        name: 'Sarah',
        voiceDescription: { gender: 'female' },
        typicalEmotions: []
      })

      const deleted = manager.deleteContactProfile('+1234567890')

      expect(deleted).toBe(true)
      expect(manager.getContactProfile('+1234567890')).toBeNull()
    })

    it('should return false for non-existent profile', () => {
      const deleted = manager.deleteContactProfile('+9999999999')
      expect(deleted).toBe(false)
    })
  })

  describe('getAllContactProfiles', () => {
    it('should return all profiles', () => {
      manager.setContactProfile('+1111111111', {
        name: 'Person 1',
        voiceDescription: {},
        typicalEmotions: []
      })

      manager.setContactProfile('+2222222222', {
        name: 'Person 2',
        voiceDescription: {},
        typicalEmotions: []
      })

      const profiles = manager.getAllContactProfiles()

      expect(profiles).toHaveLength(2)
    })

    it('should return empty array when no profiles', () => {
      const profiles = manager.getAllContactProfiles()
      expect(profiles).toEqual([])
    })
  })

  describe('AI Profile', () => {
    it('should have default AI profile', () => {
      const aiProfile = manager.getAIProfile()

      expect(aiProfile).toBeDefined()
      expect(aiProfile.voiceDescription).toBeDefined()
      expect(aiProfile.allowedTones).toBeInstanceOf(Array)
      expect(aiProfile.forbiddenEmotionTags).toBeInstanceOf(Array)
    })

    it('should update AI profile', () => {
      const updated = manager.updateAIProfile({
        allowedTones: ['calm', 'warm']
      })

      expect(updated.allowedTones).toEqual(['calm', 'warm'])
    })

    it('should reset AI profile to defaults', () => {
      manager.updateAIProfile({ allowedTones: ['custom'] })
      const reset = manager.resetAIProfile()

      expect(reset.allowedTones).toContain('neutral')
    })
  })

  describe('buildContactVoiceString', () => {
    it('should build voice description string', () => {
      manager.setContactProfile('+1234567890', {
        name: 'Sarah',
        voiceDescription: {
          gender: 'female',
          age: '30s',
          accent: 'American',
          timbre: 'warm'
        },
        typicalEmotions: [],
        speakingStyle: 'conversational and expressive'
      })

      const voiceString = manager.buildContactVoiceString('+1234567890')

      expect(voiceString).toContain('female voice')
      expect(voiceString).toContain('30s')
      expect(voiceString).toContain('American accent')
      expect(voiceString).toContain('warm timbre')
      expect(voiceString).toContain('conversational and expressive')
    })

    it('should return null for non-existent contact', () => {
      const voiceString = manager.buildContactVoiceString('+9999999999')
      expect(voiceString).toBeNull()
    })
  })

  describe('buildAIVoiceString', () => {
    it('should build AI voice description', () => {
      const voiceString = manager.buildAIVoiceString()

      expect(voiceString).toBeTruthy()
      expect(typeof voiceString).toBe('string')
    })

    it('should use custom tone when provided', () => {
      const voiceString = manager.buildAIVoiceString('concerned')

      expect(voiceString).toContain('concerned')
    })
  })

  describe('isEmotionTagAllowed', () => {
    it('should return true for allowed tags', () => {
      expect(manager.isEmotionTagAllowed('sigh')).toBe(true)
    })

    it('should return false for forbidden tags', () => {
      // Default AI profile forbids 'angry', 'cry', 'laugh'
      expect(manager.isEmotionTagAllowed('angry')).toBe(false)
    })
  })

  describe('inferProfileFromMessages', () => {
    it('should create profile from observed emotions', () => {
      const emotions: any[] = ['joy', 'joy', 'anger', 'joy', 'sadness']

      const profile = manager.inferProfileFromMessages(
        '+1234567890',
        'Sarah',
        emotions
      )

      expect(profile.contactId).toBe('+1234567890')
      expect(profile.name).toBe('Sarah')
      expect(profile.typicalEmotions).toContain('joy')
      expect(profile.typicalEmotions.length).toBeLessThanOrEqual(3)
    })
  })

  describe('export/import', () => {
    it('should export profiles as JSON', () => {
      manager.setContactProfile('+1234567890', {
        name: 'Sarah',
        voiceDescription: { gender: 'female' },
        typicalEmotions: []
      })

      const json = manager.exportProfiles()
      const parsed = JSON.parse(json)

      expect(parsed.contacts['+1234567890']).toBeDefined()
      expect(parsed.aiProfile).toBeDefined()
    })

    it('should import profiles from JSON', () => {
      const importData = {
        contacts: {
          '+1234567890': {
            contactId: '+1234567890',
            name: 'Imported',
            voiceDescription: { gender: 'male' },
            typicalEmotions: ['joy'],
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          }
        },
        aiProfile: {
          voiceDescription: { tone: 'calm' },
          allowedTones: ['calm'],
          forbiddenEmotionTags: []
        },
        version: '1.0.0'
      }

      manager.importProfiles(JSON.stringify(importData))

      const profile = manager.getContactProfile('+1234567890')
      expect(profile?.name).toBe('Imported')
    })

    it('should throw on invalid import data', () => {
      expect(() => {
        manager.importProfiles('{}')
      }).toThrow()
    })
  })
})

describe('VoiceProfileManager Singleton', () => {
  it('should return singleton instance', () => {
    const manager1 = getVoiceProfileManager()
    const manager2 = getVoiceProfileManager()

    expect(manager1).toBe(manager2)
  })
})
