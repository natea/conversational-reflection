/**
 * Example: Using the Conversational Reflection API
 *
 * This example demonstrates the unified API for:
 * - Analyzing emotions in text
 * - Processing text with emotion tags
 * - Managing voice profiles
 * - Checking service availability
 */

import {
  createAPI,
  VERSION,
  analyzeTextEmotion,
  processEmotions,
  getVoiceProfileManager,
  type EmotionAnalysisResult,
  type ContactVoiceProfile
} from '../src/index.js'

async function main() {
  console.log(`Conversational Reflection Tool v${VERSION}\n`)

  // Create API instance
  const api = createAPI()

  // ============================================================================
  // Example 1: Emotion Analysis
  // ============================================================================
  console.log('=== Emotion Analysis ===\n')

  const texts = [
    "I'm so happy and excited!",
    "This is terrible and frustrating 😠",
    "I can't believe this happened... 😢",
    "Wow, that's amazing! 😮"
  ]

  for (const text of texts) {
    const emotions = api.analyzeEmotions(text)
    console.log(`Text: "${text}"`)
    console.log('Emotions detected:')
    for (const emotion of emotions) {
      console.log(`  - ${emotion.type}: ${(emotion.intensity * 100).toFixed(0)}%`)
    }
    console.log()
  }

  // ============================================================================
  // Example 2: Process Text with Emotion Tags
  // ============================================================================
  console.log('=== Text Processing with Emotion Tags ===\n')

  const textToProcess = "This is absolutely incredible!"
  const processedText = api.processTextWithEmotions(textToProcess)
  console.log(`Original: "${textToProcess}"`)
  console.log(`Processed: "${processedText}"`)
  console.log()

  // ============================================================================
  // Example 3: Voice Profile Management
  // ============================================================================
  console.log('=== Voice Profile Management ===\n')

  const contactId = 'example-contact-456'
  const profile = {
    name: 'Alice',
    voiceDescription: {
      gender: 'female' as const,
      age: '30s',
      pace: 'conversational' as const,
      timbre: 'warm',
      tone: 'friendly and enthusiastic'
    },
    typicalEmotions: ['joy' as const, 'surprise' as const],
    speakingStyle: 'animated and expressive',
    relationshipType: 'friend' as const
  }

  // Create profile
  const created = api.setVoiceProfile(contactId, profile)
  console.log('Created voice profile:')
  console.log(`  Name: ${created.name}`)
  console.log(`  Voice: ${created.voiceDescription.gender}, ${created.voiceDescription.timbre}`)
  console.log(`  Typical emotions: ${created.typicalEmotions.join(', ')}`)
  console.log()

  // Retrieve profile
  const retrieved = api.getVoiceProfile(contactId)
  if (retrieved) {
    console.log('Retrieved voice profile:')
    console.log(`  Contact ID: ${retrieved.contactId}`)
    console.log(`  Name: ${retrieved.name}`)
    console.log(`  Created: ${retrieved.createdAt.toISOString()}`)
    console.log()
  }

  // Build voice description string
  const manager = getVoiceProfileManager()
  const voiceString = manager.buildContactVoiceString(contactId)
  console.log(`Voice description string: "${voiceString}"`)
  console.log()

  // ============================================================================
  // Example 4: Service Availability Checks
  // ============================================================================
  console.log('=== Service Availability ===\n')

  const iMessageAvailable = await api.isIMessageAvailable()
  const sableAvailable = await api.isSableAvailable()
  const mayaAvailable = await api.isMayaAvailable()

  console.log(`iMessage: ${iMessageAvailable ? '✓ Available' : '✗ Not available'}`)
  console.log(`Sable: ${sableAvailable ? '✓ Available' : '✗ Not available'}`)
  console.log(`Maya: ${mayaAvailable ? '✓ Available' : '✗ Not available'}`)
  console.log()

  // ============================================================================
  // Example 5: Direct Function Usage (Alternative to API)
  // ============================================================================
  console.log('=== Direct Function Usage ===\n')

  const directEmotions = analyzeTextEmotion("I'm feeling great today!")
  console.log('Direct emotion analysis:')
  console.log(directEmotions)
  console.log()

  const directProcessed = processEmotions("This is wonderful!", directEmotions)
  console.log(`Direct text processing: "${directProcessed}"`)
  console.log()

  // ============================================================================
  // Example 6: AI Voice Profile
  // ============================================================================
  console.log('=== AI Voice Profile ===\n')

  const aiProfile = manager.getAIProfile()
  console.log('AI voice profile:')
  console.log(`  Voice: ${aiProfile.voiceDescription.gender}, ${aiProfile.voiceDescription.timbre}`)
  console.log(`  Tone: ${aiProfile.voiceDescription.tone}`)
  console.log(`  Allowed tones: ${aiProfile.allowedTones.join(', ')}`)
  console.log(`  Forbidden emotion tags: ${aiProfile.forbiddenEmotionTags.join(', ')}`)
  console.log()

  const aiVoiceString = manager.buildAIVoiceString('thoughtful and reflective')
  console.log(`AI voice string: "${aiVoiceString}"`)
  console.log()

  // ============================================================================
  // Cleanup
  // ============================================================================
  manager.deleteContactProfile(contactId)
  console.log('Cleanup complete!')
}

// Run the example
main().catch(console.error)
