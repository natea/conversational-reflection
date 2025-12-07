/**
 * Conversational Reflection Tool
 *
 * An AI companion that analyzes iMessage conversations, develops emotional
 * responses through Damasio's consciousness model, maintains a private journal,
 * and expresses insights through emotionally-authentic voice synthesis.
 */

// ============================================================================
// Core emotion analysis
// ============================================================================
export {
  // Types
  type EmotionAnalysisResult,
  type MayaTagPlacement,
  type EmotionMappingConfig,

  // Emotion mapping functions
  mapEmotionsToMayaTags,
  getDominantEmotion,
  calculateOverallIntensity,
  isEmotionallySignificant,
  getEmotionValence,
  suggestVoiceTone,
  summarizeEmotions,

  // Text processing
  injectEmotionTags,
  analyzeTextEmotion,
  processEmotions,
  stripEmotionTags
} from './lib/emotion-mapper.js'

// ============================================================================
// Voice profile management
// ============================================================================
export {
  // Types
  type ContactVoiceProfile,
  type AIVoiceProfile,
  type VoiceProfileStore,

  // Class and singleton
  VoiceProfileManager,
  getVoiceProfileManager
} from './lib/voice-profiles.js'

// ============================================================================
// Client libraries
// ============================================================================

// iMessage client
export {
  // Types
  type Message,
  type Chat,
  type GetMessagesOptions,
  type ListChatsOptions,

  // Class and singleton
  IMessageClient,
  getIMessageClient
} from './lib/imessage-client.js'

// Sable consciousness framework client
export {
  // Types
  type EmotionType,
  type BackgroundEmotion,
  type EmotionEvent,
  type BodyState,
  type EmotionalState,
  type Memory,
  type SomaticMarker,
  type EmotionAnalysis,

  // Class
  SableClient
} from './lib/sable-client.js'

// Maya TTS client
export {
  // Types
  type MayaEmotionTag,
  type VoiceDescription,
  type SpeakOptions,
  type MayaConfig,

  // Class
  MayaClient
} from './lib/maya-client.js'

// ============================================================================
// Version info
// ============================================================================
export const VERSION = '1.0.0'

// ============================================================================
// Main unified API
// ============================================================================

export interface ConversationalReflectionAPI {
  /**
   * Get messages from iMessage
   */
  getMessages: (options?: import('./lib/imessage-client.js').GetMessagesOptions) => Promise<import('./lib/imessage-client.js').Message[]>

  /**
   * Analyze emotions in text
   */
  analyzeEmotions: (text: string) => import('./lib/emotion-mapper.js').EmotionAnalysisResult[]

  /**
   * Process text with emotion tags
   */
  processTextWithEmotions: (text: string, emotions?: import('./lib/emotion-mapper.js').EmotionAnalysisResult[]) => string

  /**
   * Get voice profile for a contact
   */
  getVoiceProfile: (contactId: string) => import('./lib/voice-profiles.js').ContactVoiceProfile | null

  /**
   * Set voice profile for a contact
   */
  setVoiceProfile: (
    contactId: string,
    profile: Omit<import('./lib/voice-profiles.js').ContactVoiceProfile, 'contactId' | 'createdAt' | 'updatedAt'>
  ) => import('./lib/voice-profiles.js').ContactVoiceProfile

  /**
   * Check if iMessage is available
   */
  isIMessageAvailable: () => Promise<boolean>

  /**
   * Check if Sable is available
   */
  isSableAvailable: () => Promise<boolean>

  /**
   * Check if Maya is available
   */
  isMayaAvailable: () => Promise<boolean>
}

/**
 * Create a unified API instance for conversational reflection
 *
 * @example
 * ```typescript
 * const api = createAPI();
 *
 * // Get recent messages
 * const messages = await api.getMessages({ limit: 10 });
 *
 * // Analyze emotions
 * const emotions = api.analyzeEmotions("I'm so happy!");
 *
 * // Process text with emotion tags
 * const tagged = api.processTextWithEmotions("This is amazing!", emotions);
 * ```
 */
export function createAPI(): ConversationalReflectionAPI {
  const iMessageClient = getIMessageClient()
  const voiceProfileManager = getVoiceProfileManager()
  const sableClient = new SableClient()
  const mayaClient = new MayaClient()

  return {
    // Message operations
    getMessages: async (options?) => {
      await iMessageClient.initialize()
      return iMessageClient.getMessages(options)
    },

    // Emotion analysis
    analyzeEmotions: (text: string) => {
      return analyzeTextEmotion(text)
    },

    // Text processing
    processTextWithEmotions: (text: string, emotions?) => {
      return processEmotions(text, emotions)
    },

    // Voice profile management
    getVoiceProfile: (contactId: string) => {
      return voiceProfileManager.getContactProfile(contactId)
    },

    setVoiceProfile: (contactId, profile) => {
      return voiceProfileManager.setContactProfile(contactId, profile)
    },

    // Availability checks
    isIMessageAvailable: () => iMessageClient.isAvailable(),
    isSableAvailable: () => sableClient.isAvailable(),
    isMayaAvailable: () => mayaClient.isAvailable()
  }
}

// Re-export helper functions for direct use
import {
  analyzeTextEmotion,
  processEmotions
} from './lib/emotion-mapper.js'

import {
  getIMessageClient
} from './lib/imessage-client.js'

import {
  getVoiceProfileManager
} from './lib/voice-profiles.js'

import {
  SableClient
} from './lib/sable-client.js'

import {
  MayaClient
} from './lib/maya-client.js'
