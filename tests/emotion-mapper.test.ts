/**
 * Emotion Mapper Tests
 *
 * Tests for mapping Sable emotions to Maya1 voice tags.
 */

import { describe, it, expect } from 'vitest'
import {
  mapEmotionsToMayaTags,
  getDominantEmotion,
  calculateOverallIntensity,
  isEmotionallySignificant,
  getEmotionValence,
  suggestVoiceTone,
  summarizeEmotions,
  injectEmotionTags,
  analyzeTextEmotion,
  processEmotions,
  stripEmotionTags,
  type EmotionAnalysisResult,
  type MayaTagPlacement
} from '../src/lib/emotion-mapper.js'

describe('mapEmotionsToMayaTags', () => {
  describe('anger emotions', () => {
    it('should map high intensity anger to angry tag', () => {
      const emotions: EmotionAnalysisResult[] = [
        { type: 'anger', intensity: 0.8 }
      ]

      const tags = mapEmotionsToMayaTags(emotions)

      expect(tags).toContainEqual({ tag: 'angry', position: 'start' })
    })

    it('should map medium intensity anger to sigh tag', () => {
      const emotions: EmotionAnalysisResult[] = [
        { type: 'anger', intensity: 0.5 }
      ]

      const tags = mapEmotionsToMayaTags(emotions)

      expect(tags).toContainEqual({ tag: 'sigh', position: 'start' })
    })

    it('should map low intensity anger to groan tag', () => {
      const emotions: EmotionAnalysisResult[] = [
        { type: 'anger', intensity: 0.35 }
      ]

      const tags = mapEmotionsToMayaTags(emotions)

      expect(tags).toContainEqual({ tag: 'groan', position: 'inline' })
    })
  })

  describe('sadness emotions', () => {
    it('should map high intensity sadness to cry tag', () => {
      const emotions: EmotionAnalysisResult[] = [
        { type: 'sadness', intensity: 0.8 }
      ]

      const tags = mapEmotionsToMayaTags(emotions)

      expect(tags).toContainEqual({ tag: 'cry', position: 'end' })
    })

    it('should map medium intensity sadness to sigh tag', () => {
      const emotions: EmotionAnalysisResult[] = [
        { type: 'sadness', intensity: 0.6 }
      ]

      const tags = mapEmotionsToMayaTags(emotions)

      expect(tags).toContainEqual({ tag: 'sigh', position: 'end' })
    })
  })

  describe('joy emotions', () => {
    it('should map high intensity joy to laugh tag', () => {
      const emotions: EmotionAnalysisResult[] = [
        { type: 'joy', intensity: 0.9 }
      ]

      const tags = mapEmotionsToMayaTags(emotions)

      expect(tags).toContainEqual({ tag: 'laugh', position: 'end' })
    })

    it('should map medium intensity joy to giggle tag', () => {
      const emotions: EmotionAnalysisResult[] = [
        { type: 'joy', intensity: 0.55 }
      ]

      const tags = mapEmotionsToMayaTags(emotions)

      expect(tags).toContainEqual({ tag: 'giggle', position: 'end' })
    })
  })

  describe('fear emotions', () => {
    it('should map fear to gasp tag', () => {
      const emotions: EmotionAnalysisResult[] = [
        { type: 'fear', intensity: 0.6 }
      ]

      const tags = mapEmotionsToMayaTags(emotions)

      expect(tags).toContainEqual({ tag: 'gasp', position: 'start' })
    })

    it('should add whisper for high intensity fear', () => {
      const emotions: EmotionAnalysisResult[] = [
        { type: 'fear', intensity: 0.8 }
      ]

      const tags = mapEmotionsToMayaTags(emotions)

      expect(tags).toContainEqual({ tag: 'gasp', position: 'start' })
      expect(tags).toContainEqual({ tag: 'whisper', position: 'start' })
    })
  })

  describe('surprise emotions', () => {
    it('should map surprise to gasp tag', () => {
      const emotions: EmotionAnalysisResult[] = [
        { type: 'surprise', intensity: 0.5 }
      ]

      const tags = mapEmotionsToMayaTags(emotions)

      expect(tags).toContainEqual({ tag: 'gasp', position: 'start' })
    })
  })

  describe('disgust emotions', () => {
    it('should map medium intensity disgust to groan tag', () => {
      const emotions: EmotionAnalysisResult[] = [
        { type: 'disgust', intensity: 0.6 }
      ]

      const tags = mapEmotionsToMayaTags(emotions)

      expect(tags).toContainEqual({ tag: 'groan', position: 'inline' })
    })
  })

  describe('multiple emotions', () => {
    it('should handle multiple emotions', () => {
      const emotions: EmotionAnalysisResult[] = [
        { type: 'anger', intensity: 0.7 },
        { type: 'sadness', intensity: 0.4 }
      ]

      const tags = mapEmotionsToMayaTags(emotions)

      expect(tags.length).toBeGreaterThan(0)
    })

    it('should deduplicate tags', () => {
      const emotions: EmotionAnalysisResult[] = [
        { type: 'fear', intensity: 0.6 },
        { type: 'surprise', intensity: 0.5 }
      ]

      const tags = mapEmotionsToMayaTags(emotions)

      // Both would generate gasp, but should be deduplicated
      const gaspTags = tags.filter(t => t.tag === 'gasp')
      expect(gaspTags.length).toBe(1)
    })
  })

  describe('empty emotions', () => {
    it('should return empty array for no emotions', () => {
      const tags = mapEmotionsToMayaTags([])
      expect(tags).toEqual([])
    })
  })

  describe('custom thresholds', () => {
    it('should respect custom intensity thresholds', () => {
      const emotions: EmotionAnalysisResult[] = [
        { type: 'anger', intensity: 0.4 }
      ]

      const tags = mapEmotionsToMayaTags(emotions, {
        intensityThresholds: { low: 0.2, medium: 0.35, high: 0.5 }
      })

      // With custom thresholds, 0.4 is now "medium"
      expect(tags).toContainEqual({ tag: 'sigh', position: 'start' })
    })
  })
})

describe('getDominantEmotion', () => {
  it('should return emotion with highest intensity', () => {
    const emotions: EmotionAnalysisResult[] = [
      { type: 'joy', intensity: 0.3 },
      { type: 'anger', intensity: 0.8 },
      { type: 'sadness', intensity: 0.5 }
    ]

    const dominant = getDominantEmotion(emotions)

    expect(dominant?.type).toBe('anger')
    expect(dominant?.intensity).toBe(0.8)
  })

  it('should return null for empty array', () => {
    const dominant = getDominantEmotion([])
    expect(dominant).toBeNull()
  })

  it('should return first emotion when tied', () => {
    const emotions: EmotionAnalysisResult[] = [
      { type: 'joy', intensity: 0.5 },
      { type: 'anger', intensity: 0.5 }
    ]

    const dominant = getDominantEmotion(emotions)

    expect(dominant?.type).toBe('joy')
  })
})

describe('calculateOverallIntensity', () => {
  it('should calculate average intensity', () => {
    const emotions: EmotionAnalysisResult[] = [
      { type: 'joy', intensity: 0.6 },
      { type: 'anger', intensity: 0.4 }
    ]

    const overall = calculateOverallIntensity(emotions)

    expect(overall).toBe(0.5)
  })

  it('should return 0 for empty array', () => {
    const overall = calculateOverallIntensity([])
    expect(overall).toBe(0)
  })
})

describe('isEmotionallySignificant', () => {
  it('should return true when any emotion exceeds threshold', () => {
    const emotions: EmotionAnalysisResult[] = [
      { type: 'joy', intensity: 0.2 },
      { type: 'anger', intensity: 0.5 }
    ]

    expect(isEmotionallySignificant(emotions)).toBe(true)
  })

  it('should return false when all emotions below threshold', () => {
    const emotions: EmotionAnalysisResult[] = [
      { type: 'joy', intensity: 0.2 },
      { type: 'anger', intensity: 0.3 }
    ]

    expect(isEmotionallySignificant(emotions)).toBe(false)
  })

  it('should respect custom threshold', () => {
    const emotions: EmotionAnalysisResult[] = [
      { type: 'anger', intensity: 0.5 }
    ]

    expect(isEmotionallySignificant(emotions, 0.6)).toBe(false)
    expect(isEmotionallySignificant(emotions, 0.4)).toBe(true)
  })
})

describe('getEmotionValence', () => {
  it('should return positive for joy', () => {
    expect(getEmotionValence('joy')).toBe('positive')
  })

  it('should return negative for anger', () => {
    expect(getEmotionValence('anger')).toBe('negative')
  })

  it('should return negative for sadness', () => {
    expect(getEmotionValence('sadness')).toBe('negative')
  })

  it('should return negative for fear', () => {
    expect(getEmotionValence('fear')).toBe('negative')
  })

  it('should return negative for disgust', () => {
    expect(getEmotionValence('disgust')).toBe('negative')
  })

  it('should return neutral for surprise', () => {
    expect(getEmotionValence('surprise')).toBe('neutral')
  })
})

describe('suggestVoiceTone', () => {
  it('should suggest warm tone for high joy', () => {
    const emotions: EmotionAnalysisResult[] = [
      { type: 'joy', intensity: 0.8 }
    ]

    const tone = suggestVoiceTone(emotions)

    expect(tone).toContain('excited')
  })

  it('should suggest somber tone for high sadness', () => {
    const emotions: EmotionAnalysisResult[] = [
      { type: 'sadness', intensity: 0.8 }
    ]

    const tone = suggestVoiceTone(emotions)

    expect(tone).toContain('somber')
  })

  it('should suggest intense tone for high anger', () => {
    const emotions: EmotionAnalysisResult[] = [
      { type: 'anger', intensity: 0.8 }
    ]

    const tone = suggestVoiceTone(emotions)

    expect(tone).toContain('intense')
  })

  it('should return neutral for no emotions', () => {
    const tone = suggestVoiceTone([])
    expect(tone).toBe('neutral')
  })
})

describe('summarizeEmotions', () => {
  it('should create readable summary', () => {
    const emotions: EmotionAnalysisResult[] = [
      { type: 'anger', intensity: 0.7 },
      { type: 'sadness', intensity: 0.4 }
    ]

    const summary = summarizeEmotions(emotions)

    expect(summary).toContain('anger')
    expect(summary).toContain('70%')
    expect(summary).toContain('sadness')
    expect(summary).toContain('40%')
  })

  it('should sort by intensity', () => {
    const emotions: EmotionAnalysisResult[] = [
      { type: 'joy', intensity: 0.3 },
      { type: 'anger', intensity: 0.9 }
    ]

    const summary = summarizeEmotions(emotions)

    expect(summary.indexOf('anger')).toBeLessThan(summary.indexOf('joy'))
  })

  it('should handle no emotions', () => {
    const summary = summarizeEmotions([])
    expect(summary).toBe('No emotions detected')
  })
})

describe('injectEmotionTags', () => {
  it('should inject start tags at the beginning', () => {
    const text = 'Hello world'
    const tags: MayaTagPlacement[] = [
      { tag: 'gasp', position: 'start' }
    ]

    const result = injectEmotionTags(text, tags)

    expect(result).toBe('<gasp> Hello world')
  })

  it('should inject end tags at the end', () => {
    const text = 'Hello world'
    const tags: MayaTagPlacement[] = [
      { tag: 'laugh', position: 'end' }
    ]

    const result = injectEmotionTags(text, tags)

    expect(result).toBe('Hello world <laugh>')
  })

  it('should inject inline tags before final punctuation', () => {
    const text = 'This is amazing!'
    const tags: MayaTagPlacement[] = [
      { tag: 'chuckle', position: 'inline' }
    ]

    const result = injectEmotionTags(text, tags)

    expect(result).toBe('This is amazing <chuckle>!')
  })

  it('should inject inline tags at end if no punctuation', () => {
    const text = 'This is amazing'
    const tags: MayaTagPlacement[] = [
      { tag: 'chuckle', position: 'inline' }
    ]

    const result = injectEmotionTags(text, tags)

    expect(result).toBe('This is amazing <chuckle>')
  })

  it('should handle multiple tags in different positions', () => {
    const text = 'I cannot believe this.'
    const tags: MayaTagPlacement[] = [
      { tag: 'gasp', position: 'start' },
      { tag: 'groan', position: 'inline' },
      { tag: 'sigh', position: 'end' }
    ]

    const result = injectEmotionTags(text, tags)

    expect(result).toContain('<gasp>')
    expect(result).toContain('<groan>')
    expect(result).toContain('<sigh>')
    expect(result.startsWith('<gasp>')).toBe(true)
    expect(result.endsWith('<sigh>')).toBe(true)
  })

  it('should handle multiple tags at same position', () => {
    const text = 'Oh no'
    const tags: MayaTagPlacement[] = [
      { tag: 'gasp', position: 'start' },
      { tag: 'whisper', position: 'start' }
    ]

    const result = injectEmotionTags(text, tags)

    expect(result).toContain('<gasp>')
    expect(result).toContain('<whisper>')
  })

  it('should return original text if no tags', () => {
    const text = 'Hello world'
    const result = injectEmotionTags(text, [])

    expect(result).toBe('Hello world')
  })

  it('should handle text with various punctuation', () => {
    const punctuations = ['.', '!', '?', ',', ';']

    punctuations.forEach(punct => {
      const text = `Hello world${punct}`
      const tags: MayaTagPlacement[] = [
        { tag: 'chuckle', position: 'inline' }
      ]

      const result = injectEmotionTags(text, tags)

      expect(result).toContain('<chuckle>')
      expect(result.endsWith(punct)).toBe(true)
    })
  })

  it('should trim whitespace', () => {
    const text = '  Hello world  '
    const tags: MayaTagPlacement[] = [
      { tag: 'laugh', position: 'end' }
    ]

    const result = injectEmotionTags(text, tags)

    expect(result).toBe('Hello world <laugh>')
  })
})

describe('analyzeTextEmotion', () => {
  it('should detect joy from happy keywords', () => {
    const text = 'I am so happy and excited!'
    const emotions = analyzeTextEmotion(text)

    const joyEmotion = emotions.find(e => e.type === 'joy')
    expect(joyEmotion).toBeDefined()
    expect(joyEmotion!.intensity).toBeGreaterThan(0.5)
  })

  it('should detect sadness from sad keywords', () => {
    const text = 'I feel so sad and heartbroken'
    const emotions = analyzeTextEmotion(text)

    const sadnessEmotion = emotions.find(e => e.type === 'sadness')
    expect(sadnessEmotion).toBeDefined()
    expect(sadnessEmotion!.intensity).toBeGreaterThan(0.5)
  })

  it('should detect anger from angry keywords', () => {
    const text = 'I am furious and outraged!'
    const emotions = analyzeTextEmotion(text)

    const angerEmotion = emotions.find(e => e.type === 'anger')
    expect(angerEmotion).toBeDefined()
    expect(angerEmotion!.intensity).toBeGreaterThan(0.5)
  })

  it('should detect fear from fearful keywords', () => {
    const text = 'I am terrified and worried'
    const emotions = analyzeTextEmotion(text)

    const fearEmotion = emotions.find(e => e.type === 'fear')
    expect(fearEmotion).toBeDefined()
    expect(fearEmotion!.intensity).toBeGreaterThan(0.5)
  })

  it('should boost intensity with exclamation marks', () => {
    const text1 = 'I am happy'
    const text2 = 'I am happy!!!'

    const emotions1 = analyzeTextEmotion(text1)
    const emotions2 = analyzeTextEmotion(text2)

    const joy1 = emotions1.find(e => e.type === 'joy')
    const joy2 = emotions2.find(e => e.type === 'joy')

    expect(joy2!.intensity).toBeGreaterThan(joy1!.intensity)
  })

  it('should boost intensity with ALL CAPS', () => {
    const text1 = 'I am angry'
    const text2 = 'I AM ANGRY'

    const emotions1 = analyzeTextEmotion(text1)
    const emotions2 = analyzeTextEmotion(text2)

    const anger1 = emotions1.find(e => e.type === 'anger')
    const anger2 = emotions2.find(e => e.type === 'anger')

    expect(anger2!.intensity).toBeGreaterThan(anger1!.intensity)
  })

  it('should detect multiple emotions from mixed keywords', () => {
    const text = 'I am happy but also worried'
    const emotions = analyzeTextEmotion(text)

    expect(emotions.length).toBeGreaterThan(1)
    expect(emotions.some(e => e.type === 'joy')).toBe(true)
    expect(emotions.some(e => e.type === 'fear')).toBe(true)
  })

  it('should increase intensity with multiple keyword matches', () => {
    const text1 = 'I am happy'
    const text2 = 'I am happy, joyful, and delighted'

    const emotions1 = analyzeTextEmotion(text1)
    const emotions2 = analyzeTextEmotion(text2)

    const joy1 = emotions1.find(e => e.type === 'joy')
    const joy2 = emotions2.find(e => e.type === 'joy')

    expect(joy2!.intensity).toBeGreaterThan(joy1!.intensity)
  })

  it('should detect emotions from emojis', () => {
    const text = 'This is great 😊❤️'
    const emotions = analyzeTextEmotion(text)

    const joyEmotion = emotions.find(e => e.type === 'joy')
    expect(joyEmotion).toBeDefined()
  })

  it('should return low joy for neutral text', () => {
    const text = 'The meeting is at 2pm'
    const emotions = analyzeTextEmotion(text)

    expect(emotions.length).toBeGreaterThan(0)
    expect(emotions[0].type).toBe('joy')
    expect(emotions[0].intensity).toBeLessThan(0.3)
  })

  it('should cap intensity at 1.0', () => {
    const text = 'I am SO INCREDIBLY AMAZINGLY HAPPY AND EXCITED!!!!!!!'
    const emotions = analyzeTextEmotion(text)

    emotions.forEach(emotion => {
      expect(emotion.intensity).toBeLessThanOrEqual(1.0)
    })
  })

  it('should sort emotions by intensity', () => {
    const text = 'I am a bit happy but very angry!'
    const emotions = analyzeTextEmotion(text)

    for (let i = 1; i < emotions.length; i++) {
      expect(emotions[i - 1].intensity).toBeGreaterThanOrEqual(emotions[i].intensity)
    }
  })
})

describe('processEmotions', () => {
  it('should analyze and inject tags in one step', () => {
    const text = 'I am so happy!'
    const result = processEmotions(text)

    expect(result).toContain('<')
    expect(result).toContain('>')
    expect(result.length).toBeGreaterThan(text.length)
  })

  it('should use provided emotions instead of analyzing', () => {
    const text = 'Hello world'
    const emotions: EmotionAnalysisResult[] = [
      { type: 'anger', intensity: 0.8 }
    ]

    const result = processEmotions(text, emotions)

    expect(result).toContain('<angry>')
  })

  it('should respect custom config', () => {
    const text = 'Hello'
    const emotions: EmotionAnalysisResult[] = [
      { type: 'anger', intensity: 0.4 }
    ]
    const config = {
      intensityThresholds: { low: 0.2, medium: 0.35, high: 0.5 }
    }

    const result = processEmotions(text, emotions, config)

    // With custom thresholds, 0.4 should trigger medium intensity (sigh)
    expect(result).toContain('<sigh>')
  })

  it('should handle empty text gracefully', () => {
    const result = processEmotions('')
    expect(typeof result).toBe('string')
  })
})

describe('stripEmotionTags', () => {
  it('should remove all emotion tags', () => {
    const text = '<gasp> Hello world <sigh>'
    const result = stripEmotionTags(text)

    expect(result).toBe('Hello world')
  })

  it('should remove multiple tags', () => {
    const text = '<laugh> This is <chuckle> funny <giggle>'
    const result = stripEmotionTags(text)

    expect(result).toBe('This is funny')
  })

  it('should handle text without tags', () => {
    const text = 'Hello world'
    const result = stripEmotionTags(text)

    expect(result).toBe('Hello world')
  })

  it('should normalize whitespace', () => {
    const text = '<gasp>   Hello    world   <sigh>'
    const result = stripEmotionTags(text)

    expect(result).toBe('Hello world')
  })

  it('should handle inline tags', () => {
    const text = 'This is <chuckle> funny.'
    const result = stripEmotionTags(text)

    expect(result).toBe('This is funny.')
  })

  it('should handle empty string', () => {
    const result = stripEmotionTags('')
    expect(result).toBe('')
  })

  it('should handle tags only', () => {
    const text = '<gasp><sigh><laugh>'
    const result = stripEmotionTags(text)

    expect(result).toBe('')
  })
})

describe('Edge Cases and Integration', () => {
  it('should handle extreme emotion intensities', () => {
    const emotions: EmotionAnalysisResult[] = [
      { type: 'joy', intensity: 1.0 },
      { type: 'anger', intensity: 0.0 }
    ]

    const tags = mapEmotionsToMayaTags(emotions)
    expect(tags).toBeDefined()
  })

  it('should handle round-trip: analyze -> inject -> strip', () => {
    const originalText = 'I am so happy and excited!'

    const emotions = analyzeTextEmotion(originalText)
    const withTags = processEmotions(originalText, emotions)
    const stripped = stripEmotionTags(withTags)

    expect(stripped).toBe(originalText)
  })

  it('should handle empty input at all stages', () => {
    const emotions = analyzeTextEmotion('')
    const tags = mapEmotionsToMayaTags(emotions)
    const processed = processEmotions('')
    const stripped = stripEmotionTags('')

    expect(emotions).toBeDefined()
    expect(tags).toBeDefined()
    expect(processed).toBeDefined()
    expect(stripped).toBe('')
  })

  it('should handle very long text', () => {
    const longText = 'I am happy. '.repeat(100)
    const result = processEmotions(longText)

    expect(result).toBeDefined()
    expect(result.length).toBeGreaterThanOrEqual(longText.length)
  })

  it('should handle special characters in text', () => {
    const text = 'I am happy! @#$%^&*()'
    const result = processEmotions(text)

    expect(result).toContain('@#$%^&*()')
  })
})
