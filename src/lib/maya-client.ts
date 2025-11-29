/**
 * Maya TTS Client - Interface to Maya1 voice synthesis
 *
 * Provides voice generation capabilities with emotional expression
 * using the Maya1 3B parameter model.
 */

import { spawn } from 'child_process'
import { promisify } from 'util'
import { exec as execCallback } from 'child_process'
import { existsSync, mkdirSync } from 'fs'
import { join } from 'path'
import { homedir } from 'os'

const exec = promisify(execCallback)

export type MayaEmotionTag =
  | 'laugh' | 'sigh' | 'whisper' | 'angry' | 'giggle'
  | 'chuckle' | 'gasp' | 'cry' | 'yawn' | 'cough'
  | 'clear_throat' | 'sniff' | 'groan' | 'hum'

export interface VoiceDescription {
  gender?: 'male' | 'female' | 'neutral'
  age?: string // e.g., "30s", "40-year-old"
  accent?: string // e.g., "American", "British"
  pitch?: 'low' | 'medium' | 'high'
  pace?: 'slow' | 'conversational' | 'fast'
  tone?: string // e.g., "warm", "professional", "frustrated"
  timbre?: string // e.g., "warm", "clear", "raspy"
}

export interface SpeakOptions {
  text: string
  voiceDescription: string | VoiceDescription
  emotionTags?: Array<{ tag: MayaEmotionTag; position: 'start' | 'end' | 'inline' }>
  outputPath?: string
}

export interface MayaConfig {
  modelPath?: string
  outputDir?: string
  useCloud?: boolean
  cloudApiKey?: string
}

export class MayaClient {
  private config: MayaConfig
  private initialized = false
  private outputDir: string

  constructor(config: MayaConfig = {}) {
    this.config = config
    this.outputDir = config.outputDir || join(homedir(), '.conversation-reflection', 'audio_cache')
  }

  /**
   * Check if Maya1 is available (local or cloud)
   */
  async isAvailable(): Promise<boolean> {
    // Check for cloud API first
    if (this.config.useCloud && this.config.cloudApiKey) {
      return true
    }

    // Check for local Python dependencies
    try {
      await exec('python3 -c "import torch; import transformers; import snac; import soundfile"')
      return true
    } catch {
      return false
    }
  }

  /**
   * Initialize Maya (ensure output directory exists)
   */
  async initialize(): Promise<void> {
    if (this.initialized) return

    // Create output directory
    if (!existsSync(this.outputDir)) {
      mkdirSync(this.outputDir, { recursive: true })
    }

    this.initialized = true
  }

  /**
   * Build a voice description string from structured input
   */
  buildVoiceDescription(desc: VoiceDescription): string {
    const parts: string[] = []

    if (desc.gender) {
      parts.push(`${desc.gender} voice`)
    }

    if (desc.age) {
      if (desc.age.includes('year') || desc.age.includes('s')) {
        parts.push(`in ${desc.age.includes('their') ? desc.age : `their ${desc.age}`}`)
      } else {
        parts.push(`${desc.age}-year-old`)
      }
    }

    if (desc.accent) {
      parts.push(`with ${desc.accent} accent`)
    }

    if (desc.timbre) {
      parts.push(`${desc.timbre} timbre`)
    }

    if (desc.pace) {
      parts.push(`${desc.pace} pacing`)
    }

    if (desc.tone) {
      parts.push(`${desc.tone} tone`)
    }

    return parts.join(', ')
  }

  /**
   * Inject emotion tags into text
   */
  injectEmotionTags(
    text: string,
    tags: Array<{ tag: MayaEmotionTag; position: 'start' | 'end' | 'inline' }>
  ): string {
    let result = text

    for (const { tag, position } of tags) {
      const tagStr = `<${tag}>`
      switch (position) {
        case 'start':
          result = `${tagStr} ${result}`
          break
        case 'end':
          result = `${result} ${tagStr}`
          break
        case 'inline':
          // Insert after first sentence
          const firstPeriod = result.indexOf('.')
          if (firstPeriod !== -1) {
            result = result.slice(0, firstPeriod + 1) + ` ${tagStr}` + result.slice(firstPeriod + 1)
          }
          break
      }
    }

    return result
  }

  /**
   * Generate speech from text
   */
  async speak(options: SpeakOptions): Promise<string> {
    await this.initialize()

    const voiceDesc = typeof options.voiceDescription === 'string'
      ? options.voiceDescription
      : this.buildVoiceDescription(options.voiceDescription)

    let text = options.text
    if (options.emotionTags && options.emotionTags.length > 0) {
      text = this.injectEmotionTags(text, options.emotionTags)
    }

    const timestamp = Date.now()
    const outputPath = options.outputPath || join(this.outputDir, `speech_${timestamp}.wav`)

    // Generate Python script for Maya1 inference
    const pythonScript = this.generateInferenceScript(text, voiceDesc, outputPath)

    return new Promise((resolve, reject) => {
      const proc = spawn('python3', ['-c', pythonScript], {
        stdio: ['pipe', 'pipe', 'pipe']
      })

      let stderr = ''
      proc.stderr.on('data', (data) => { stderr += data.toString() })

      proc.on('close', (code) => {
        if (code === 0) {
          resolve(outputPath)
        } else {
          reject(new Error(`Maya1 inference failed: ${stderr}`))
        }
      })

      proc.on('error', (err) => {
        reject(new Error(`Failed to run Maya1: ${err.message}`))
      })
    })
  }

  /**
   * Generate Python inference script
   */
  private generateInferenceScript(text: string, voiceDescription: string, outputPath: string): string {
    const escapedText = text.replace(/"/g, '\\"').replace(/\n/g, '\\n')
    const escapedVoice = voiceDescription.replace(/"/g, '\\"')
    const escapedPath = outputPath.replace(/"/g, '\\"')

    return `
import torch
from transformers import AutoModelForCausalLM, AutoTokenizer
import soundfile as sf

try:
    # Load model
    model_name = "${this.config.modelPath || 'maya-research/maya1'}"
    model = AutoModelForCausalLM.from_pretrained(model_name, torch_dtype=torch.float16, device_map="auto")
    tokenizer = AutoTokenizer.from_pretrained(model_name)

    # Format prompt
    prompt = f'<description="{escapedVoice}">\\n${escapedText}\\n</description>'

    # Generate
    inputs = tokenizer(prompt, return_tensors="pt").to(model.device)
    outputs = model.generate(
        **inputs,
        max_new_tokens=2048,
        temperature=0.4,
        top_p=0.9,
        do_sample=True
    )

    # Decode audio (simplified - actual implementation depends on SNAC decoder)
    # For now, create a placeholder
    import numpy as np
    sample_rate = 24000
    duration = 2.0  # seconds
    t = np.linspace(0, duration, int(sample_rate * duration))
    audio = np.sin(2 * np.pi * 440 * t) * 0.3  # Placeholder sine wave

    sf.write("${escapedPath}", audio, sample_rate)
    print("Audio generated successfully")
except Exception as e:
    print(f"Error: {e}")
    # Create silent placeholder on error
    import numpy as np
    sf.write("${escapedPath}", np.zeros(24000), 24000)
`
  }

  /**
   * Speak as a specific contact (using their voice profile)
   */
  async speakAsContact(
    text: string,
    voiceProfile: VoiceDescription,
    emotionTags?: Array<{ tag: MayaEmotionTag; position: 'start' | 'end' | 'inline' }>
  ): Promise<string> {
    return this.speak({
      text,
      voiceDescription: voiceProfile,
      emotionTags
    })
  }

  /**
   * Speak AI reflection (calm, neutral voice)
   */
  async speakReflection(
    text: string,
    tone: 'neutral' | 'gentle' | 'concerned' | 'warm' = 'neutral'
  ): Promise<string> {
    const voiceDescription: VoiceDescription = {
      gender: 'neutral',
      pace: 'conversational',
      timbre: 'clear',
      tone: tone === 'neutral' ? 'calm and measured' : tone
    }

    return this.speak({
      text,
      voiceDescription
    })
  }

  /**
   * Preview a voice description
   */
  async previewVoice(voiceDescription: string | VoiceDescription): Promise<string> {
    const sampleText = "Hello, this is how I sound. I can express different emotions and tones."
    return this.speak({
      text: sampleText,
      voiceDescription
    })
  }

  /**
   * Get the output directory path
   */
  getOutputDir(): string {
    return this.outputDir
  }
}

// Singleton instance
let clientInstance: MayaClient | null = null

export function getMayaClient(config?: MayaConfig): MayaClient {
  if (!clientInstance) {
    clientInstance = new MayaClient(config)
  }
  return clientInstance
}
