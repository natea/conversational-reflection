/**
 * Voice Profiles - Manage voice descriptions for contacts and AI
 *
 * Stores and retrieves Maya1 voice profiles for different speakers,
 * enabling consistent voice synthesis across sessions.
 */

import { existsSync, readFileSync, writeFileSync, mkdirSync } from 'fs'
import { join } from 'path'
import { homedir } from 'os'
import type { VoiceDescription } from './maya-client.js'
import type { EmotionType } from './sable-client.js'

export interface ContactVoiceProfile {
  contactId: string
  name?: string
  voiceDescription: VoiceDescription
  typicalEmotions: EmotionType[]
  speakingStyle?: string
  relationshipType?: 'friend' | 'family' | 'colleague' | 'acquaintance' | 'other'
  notes?: string
  createdAt: Date
  updatedAt: Date
}

export interface AIVoiceProfile {
  voiceDescription: VoiceDescription
  allowedTones: string[]
  forbiddenEmotionTags: string[]
}

export interface VoiceProfileStore {
  contacts: Record<string, ContactVoiceProfile>
  aiProfile: AIVoiceProfile
  version: string
}

const DEFAULT_AI_PROFILE: AIVoiceProfile = {
  voiceDescription: {
    gender: 'neutral',
    pace: 'conversational',
    timbre: 'clear',
    tone: 'calm and measured, warm but professional'
  },
  allowedTones: ['neutral', 'gentle', 'thoughtful', 'concerned', 'warm'],
  forbiddenEmotionTags: ['angry', 'cry', 'laugh']
}

export class VoiceProfileManager {
  private storePath: string
  private store: VoiceProfileStore

  constructor(storePath?: string) {
    const baseDir = join(homedir(), '.conversation-reflection')
    this.storePath = storePath || join(baseDir, 'voice-profiles.json')

    // Ensure directory exists
    const dir = join(baseDir)
    if (!existsSync(dir)) {
      mkdirSync(dir, { recursive: true })
    }

    this.store = this.loadStore()
  }

  /**
   * Load store from disk
   */
  private loadStore(): VoiceProfileStore {
    if (existsSync(this.storePath)) {
      try {
        const data = readFileSync(this.storePath, 'utf-8')
        const parsed = JSON.parse(data)

        // Convert date strings back to Date objects
        for (const profile of Object.values(parsed.contacts || {})) {
          const p = profile as ContactVoiceProfile
          p.createdAt = new Date(p.createdAt)
          p.updatedAt = new Date(p.updatedAt)
        }

        return parsed
      } catch {
        // Return default if file is corrupted
      }
    }

    return {
      contacts: {},
      aiProfile: DEFAULT_AI_PROFILE,
      version: '1.0.0'
    }
  }

  /**
   * Save store to disk
   */
  private saveStore(): void {
    writeFileSync(this.storePath, JSON.stringify(this.store, null, 2))
  }

  /**
   * Get voice profile for a contact
   */
  getContactProfile(contactId: string): ContactVoiceProfile | null {
    return this.store.contacts[contactId] || null
  }

  /**
   * Set voice profile for a contact
   */
  setContactProfile(
    contactId: string,
    profile: Omit<ContactVoiceProfile, 'contactId' | 'createdAt' | 'updatedAt'>
  ): ContactVoiceProfile {
    const existing = this.store.contacts[contactId]
    const now = new Date()

    const fullProfile: ContactVoiceProfile = {
      ...profile,
      contactId,
      createdAt: existing?.createdAt || now,
      updatedAt: now
    }

    this.store.contacts[contactId] = fullProfile
    this.saveStore()

    return fullProfile
  }

  /**
   * Update specific fields of a contact profile
   */
  updateContactProfile(
    contactId: string,
    updates: Partial<Omit<ContactVoiceProfile, 'contactId' | 'createdAt' | 'updatedAt'>>
  ): ContactVoiceProfile | null {
    const existing = this.store.contacts[contactId]
    if (!existing) return null

    const updated: ContactVoiceProfile = {
      ...existing,
      ...updates,
      updatedAt: new Date()
    }

    this.store.contacts[contactId] = updated
    this.saveStore()

    return updated
  }

  /**
   * Delete a contact profile
   */
  deleteContactProfile(contactId: string): boolean {
    if (this.store.contacts[contactId]) {
      delete this.store.contacts[contactId]
      this.saveStore()
      return true
    }
    return false
  }

  /**
   * Get all contact profiles
   */
  getAllContactProfiles(): ContactVoiceProfile[] {
    return Object.values(this.store.contacts)
  }

  /**
   * Get the AI's voice profile
   */
  getAIProfile(): AIVoiceProfile {
    return this.store.aiProfile
  }

  /**
   * Update the AI's voice profile
   */
  updateAIProfile(updates: Partial<AIVoiceProfile>): AIVoiceProfile {
    this.store.aiProfile = {
      ...this.store.aiProfile,
      ...updates
    }
    this.saveStore()
    return this.store.aiProfile
  }

  /**
   * Reset AI profile to defaults
   */
  resetAIProfile(): AIVoiceProfile {
    this.store.aiProfile = DEFAULT_AI_PROFILE
    this.saveStore()
    return this.store.aiProfile
  }

  /**
   * Build a voice description string for a contact
   */
  buildContactVoiceString(contactId: string): string | null {
    const profile = this.getContactProfile(contactId)
    if (!profile) return null

    const desc = profile.voiceDescription
    const parts: string[] = []

    if (desc.gender) parts.push(`${desc.gender} voice`)
    if (desc.age) parts.push(`in their ${desc.age}`)
    if (desc.accent) parts.push(`with ${desc.accent} accent`)
    if (desc.timbre) parts.push(`${desc.timbre} timbre`)
    if (desc.pace) parts.push(`${desc.pace} pacing`)
    if (desc.tone) parts.push(`${desc.tone} tone`)

    if (profile.speakingStyle) {
      parts.push(profile.speakingStyle)
    }

    return parts.join(', ')
  }

  /**
   * Build AI voice description string
   */
  buildAIVoiceString(tone?: string): string {
    const desc = this.store.aiProfile.voiceDescription
    const parts: string[] = []

    if (desc.gender) parts.push(`${desc.gender} voice`)
    if (desc.timbre) parts.push(`${desc.timbre} timbre`)
    if (desc.pace) parts.push(`${desc.pace} pacing`)

    // Use provided tone or default
    const useTone = tone || desc.tone
    if (useTone) parts.push(`${useTone} tone`)

    return parts.join(', ')
  }

  /**
   * Check if an emotion tag is allowed for AI voice
   */
  isEmotionTagAllowed(tag: string): boolean {
    return !this.store.aiProfile.forbiddenEmotionTags.includes(tag)
  }

  /**
   * Create a profile from observed conversation patterns
   */
  inferProfileFromMessages(
    contactId: string,
    name: string | undefined,
    observedEmotions: EmotionType[]
  ): ContactVoiceProfile {
    // Count emotion frequencies
    const emotionCounts = new Map<EmotionType, number>()
    for (const emotion of observedEmotions) {
      emotionCounts.set(emotion, (emotionCounts.get(emotion) || 0) + 1)
    }

    // Get top 3 emotions
    const sortedEmotions = Array.from(emotionCounts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([emotion]) => emotion)

    // Infer speaking style from emotions
    let speakingStyle = 'conversational'
    if (sortedEmotions.includes('anger') || sortedEmotions.includes('fear')) {
      speakingStyle = 'expressive, occasionally intense'
    } else if (sortedEmotions.includes('joy')) {
      speakingStyle = 'warm and animated'
    } else if (sortedEmotions.includes('sadness')) {
      speakingStyle = 'soft and thoughtful'
    }

    return this.setContactProfile(contactId, {
      name,
      voiceDescription: {
        pace: 'conversational',
        timbre: 'natural'
      },
      typicalEmotions: sortedEmotions,
      speakingStyle
    })
  }

  /**
   * Export all profiles as JSON
   */
  exportProfiles(): string {
    return JSON.stringify(this.store, null, 2)
  }

  /**
   * Import profiles from JSON
   */
  importProfiles(json: string): void {
    const data = JSON.parse(json) as VoiceProfileStore

    // Validate structure
    if (!data.contacts || !data.aiProfile) {
      throw new Error('Invalid profile data structure')
    }

    // Convert date strings
    for (const profile of Object.values(data.contacts)) {
      profile.createdAt = new Date(profile.createdAt)
      profile.updatedAt = new Date(profile.updatedAt)
    }

    this.store = data
    this.saveStore()
  }
}

// Singleton instance
let managerInstance: VoiceProfileManager | null = null

export function getVoiceProfileManager(): VoiceProfileManager {
  if (!managerInstance) {
    managerInstance = new VoiceProfileManager()
  }
  return managerInstance
}
