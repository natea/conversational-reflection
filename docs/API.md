# Conversational Reflection API Documentation

## Overview

The Conversational Reflection Tool provides a unified API for emotion analysis, voice synthesis, and conversation management. This document describes the main API and how to use it.

## Installation

```bash
npm install conversational-reflection
```

## Quick Start

```typescript
import { createAPI } from 'conversational-reflection'

const api = createAPI()

// Analyze emotions in text
const emotions = api.analyzeEmotions("I'm so happy!")

// Process text with emotion tags
const tagged = api.processTextWithEmotions("This is amazing!", emotions)

// Manage voice profiles
const profile = api.setVoiceProfile('contact-123', {
  name: 'Alice',
  voiceDescription: {
    gender: 'female',
    pace: 'conversational',
    timbre: 'warm'
  },
  typicalEmotions: ['joy', 'surprise']
})
```

## API Reference

### `createAPI()`

Creates a unified API instance with all functionality.

**Returns:** `ConversationalReflectionAPI`

```typescript
const api = createAPI()
```

### ConversationalReflectionAPI

#### `analyzeEmotions(text: string): EmotionAnalysisResult[]`

Analyzes emotions in the provided text using keyword-based detection.

**Parameters:**
- `text` - The text to analyze

**Returns:** Array of detected emotions with intensity scores

**Example:**
```typescript
const emotions = api.analyzeEmotions("I'm furious about this!")
// [{ type: 'anger', intensity: 0.8 }]
```

#### `processTextWithEmotions(text: string, emotions?: EmotionAnalysisResult[]): string`

Processes text and injects Maya emotion tags based on detected emotions.

**Parameters:**
- `text` - The text to process
- `emotions` - Optional pre-analyzed emotions (will auto-analyze if not provided)

**Returns:** Text with emotion tags injected

**Example:**
```typescript
const result = api.processTextWithEmotions("This is terrible!")
// "<groan> This is terrible!"
```

#### `getVoiceProfile(contactId: string): ContactVoiceProfile | null`

Retrieves the voice profile for a contact.

**Parameters:**
- `contactId` - Unique identifier for the contact

**Returns:** Voice profile or null if not found

**Example:**
```typescript
const profile = api.getVoiceProfile('contact-123')
if (profile) {
  console.log(profile.name)
  console.log(profile.voiceDescription)
}
```

#### `setVoiceProfile(contactId: string, profile: Partial<ContactVoiceProfile>): ContactVoiceProfile`

Creates or updates a voice profile for a contact.

**Parameters:**
- `contactId` - Unique identifier for the contact
- `profile` - Voice profile data (name, voiceDescription, etc.)

**Returns:** The created/updated profile

**Example:**
```typescript
const profile = api.setVoiceProfile('contact-123', {
  name: 'Bob',
  voiceDescription: {
    gender: 'male',
    age: '40s',
    pace: 'slow',
    timbre: 'deep',
    tone: 'calm and authoritative'
  },
  typicalEmotions: ['anger', 'joy'],
  relationshipType: 'colleague'
})
```

#### `getMessages(options?: GetMessagesOptions): Promise<Message[]>`

Retrieves messages from iMessage.

**Parameters:**
- `options` - Query options (contact, chatId, since, until, limit, unreadOnly)

**Returns:** Promise of message array

**Example:**
```typescript
const messages = await api.getMessages({
  contact: 'alice@example.com',
  limit: 50,
  since: new Date('2024-01-01')
})
```

#### `isIMessageAvailable(): Promise<boolean>`

Checks if iMessage access is available.

**Returns:** Promise resolving to availability status

#### `isSableAvailable(): Promise<boolean>`

Checks if Sable consciousness framework is available.

**Returns:** Promise resolving to availability status

#### `isMayaAvailable(): Promise<boolean>`

Checks if Maya TTS is available.

**Returns:** Promise resolving to availability status

## Direct Exports

You can also import and use functions directly without the unified API:

### Emotion Analysis

```typescript
import {
  analyzeTextEmotion,
  processEmotions,
  getDominantEmotion,
  calculateOverallIntensity,
  suggestVoiceTone,
  injectEmotionTags,
  stripEmotionTags
} from 'conversational-reflection'

// Analyze emotions
const emotions = analyzeTextEmotion("I'm so excited!")

// Get dominant emotion
const dominant = getDominantEmotion(emotions)

// Calculate overall intensity
const intensity = calculateOverallIntensity(emotions)

// Suggest voice tone
const tone = suggestVoiceTone(emotions)
```

### Voice Profile Management

```typescript
import {
  VoiceProfileManager,
  getVoiceProfileManager
} from 'conversational-reflection'

const manager = getVoiceProfileManager()

// Set profile
manager.setContactProfile('contact-123', {
  name: 'Charlie',
  voiceDescription: { gender: 'neutral', pace: 'fast' },
  typicalEmotions: ['joy']
})

// Get all profiles
const allProfiles = manager.getAllContactProfiles()

// Build voice string
const voiceString = manager.buildContactVoiceString('contact-123')

// AI profile
const aiProfile = manager.getAIProfile()
manager.updateAIProfile({
  allowedTones: ['neutral', 'gentle', 'warm']
})
```

### Client Libraries

```typescript
import {
  IMessageClient,
  SableClient,
  MayaClient
} from 'conversational-reflection'

// iMessage
const imessage = new IMessageClient()
await imessage.initialize()
const messages = await imessage.getMessages({ limit: 10 })

// Sable
const sable = new SableClient()
if (await sable.isAvailable()) {
  await sable.initialize()
  // Use Sable for advanced emotion analysis
}

// Maya
const maya = new MayaClient()
if (await maya.isAvailable()) {
  await maya.initialize()
  // Use Maya for voice synthesis
}
```

## Types

### EmotionAnalysisResult

```typescript
interface EmotionAnalysisResult {
  type: EmotionType
  intensity: number
}
```

### EmotionType

```typescript
type EmotionType = 'fear' | 'anger' | 'joy' | 'sadness' | 'disgust' | 'surprise'
```

### ContactVoiceProfile

```typescript
interface ContactVoiceProfile {
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
```

### VoiceDescription

```typescript
interface VoiceDescription {
  gender?: 'male' | 'female' | 'neutral'
  age?: string
  accent?: string
  pitch?: 'low' | 'medium' | 'high'
  pace?: 'slow' | 'conversational' | 'fast'
  tone?: string
  timbre?: string
}
```

### Message

```typescript
interface Message {
  id: number
  chatId: string
  sender: string
  text: string
  timestamp: Date
  isFromMe: boolean
  isRead: boolean
}
```

## Examples

See the [examples directory](../examples) for complete working examples:

- **api-usage.ts** - Comprehensive API usage examples
- More examples coming soon...

## Advanced Usage

### Custom Emotion Thresholds

```typescript
import { mapEmotionsToMayaTags } from 'conversational-reflection'

const emotions = [{ type: 'joy', intensity: 0.6 }]
const tags = mapEmotionsToMayaTags(emotions, {
  intensityThresholds: {
    low: 0.2,
    medium: 0.5,
    high: 0.8
  }
})
```

### Voice Profile Inference

```typescript
const manager = getVoiceProfileManager()

// Infer profile from conversation
const profile = manager.inferProfileFromMessages(
  'contact-123',
  'David',
  ['joy', 'surprise', 'joy', 'anger']
)
```

### Export/Import Profiles

```typescript
const manager = getVoiceProfileManager()

// Export all profiles
const json = manager.exportProfiles()

// Import profiles
manager.importProfiles(json)
```

## Version

Current version: **1.0.0**

```typescript
import { VERSION } from 'conversational-reflection'
console.log(VERSION) // "1.0.0"
```

## License

MIT
