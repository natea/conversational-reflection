/**
 * Sable Client - Interface to the Sable (Her) consciousness framework
 *
 * Wraps the Sable Python CLI to provide emotional analysis, state tracking,
 * and memory management based on Damasio's consciousness model.
 */

import { spawn } from 'child_process'
import { promisify } from 'util'
import { exec as execCallback } from 'child_process'

const exec = promisify(execCallback)

export type EmotionType = 'fear' | 'anger' | 'joy' | 'sadness' | 'disgust' | 'surprise'

export type BackgroundEmotion = 'malaise' | 'contentment' | 'tension'

export interface EmotionEvent {
  type: EmotionType
  intensity: number
  cause?: string
  timestamp: Date
}

export interface BodyState {
  energy: number
  stress: number
  arousal: number
  valence: number
  temperature: number
  tension: number
  fatigue: number
  pain: number
  homeostaticPressure: number
}

export interface EmotionalState {
  bodyState: BodyState
  currentEmotions: EmotionEvent[]
  backgroundEmotion: BackgroundEmotion
  timestamp: Date
}

export interface Memory {
  id: number
  description: string
  salience: number
  timestamp: Date
  relatedEmotions?: EmotionType[]
}

export interface SomaticMarker {
  triggerPattern: string
  responseTendency: string
  valence: number
  strength: number
}

export interface EmotionAnalysis {
  emotions: Array<{ type: EmotionType; intensity: number }>
  dominantEmotion: EmotionType
  overallIntensity: number
  bodyStateImpact: Partial<BodyState>
}

export class SableClient {
  private sablePath: string
  private initialized = false

  constructor(sablePath?: string) {
    this.sablePath = sablePath || 'sable'
  }

  /**
   * Check if Sable CLI is available
   */
  async isAvailable(): Promise<boolean> {
    try {
      await exec(`${this.sablePath} --version`)
      return true
    } catch {
      // Try with python -m sable
      try {
        await exec('python3 -m sable --version')
        this.sablePath = 'python3 -m sable'
        return true
      } catch {
        return false
      }
    }
  }

  /**
   * Initialize Sable (ensure database exists)
   */
  async initialize(): Promise<void> {
    if (this.initialized) return

    const available = await this.isAvailable()
    if (!available) {
      throw new Error(
        'Sable CLI not found. Install via: git clone https://github.com/tapania/her && cd her && uv sync'
      )
    }

    this.initialized = true
  }

  /**
   * Execute a Sable CLI command
   */
  private async runCommand(args: string[]): Promise<string> {
    await this.initialize()

    return new Promise((resolve, reject) => {
      const parts = this.sablePath.split(' ')
      const command = parts[0]
      const baseArgs = parts.slice(1)

      const proc = spawn(command, [...baseArgs, ...args], {
        stdio: ['pipe', 'pipe', 'pipe']
      })

      let stdout = ''
      let stderr = ''

      proc.stdout.on('data', (data) => { stdout += data.toString() })
      proc.stderr.on('data', (data) => { stderr += data.toString() })

      proc.on('close', (code) => {
        if (code === 0) {
          resolve(stdout.trim())
        } else {
          reject(new Error(`Sable command failed: ${stderr || stdout}`))
        }
      })

      proc.on('error', (err) => {
        reject(new Error(`Failed to run Sable: ${err.message}`))
      })
    })
  }

  /**
   * Get current emotional and body state
   */
  async getStatus(): Promise<EmotionalState> {
    const output = await this.runCommand(['status', '--json'])

    try {
      const data = JSON.parse(output)
      return {
        bodyState: {
          energy: data.body_state?.energy ?? 0.7,
          stress: data.body_state?.stress ?? 0.3,
          arousal: data.body_state?.arousal ?? 0.5,
          valence: data.body_state?.valence ?? 0,
          temperature: data.body_state?.temperature ?? 0.5,
          tension: data.body_state?.tension ?? 0.3,
          fatigue: data.body_state?.fatigue ?? 0.3,
          pain: data.body_state?.pain ?? 0,
          homeostaticPressure: data.body_state?.homeostatic_pressure ?? 0
        },
        currentEmotions: (data.current_emotions || []).map((e: any) => ({
          type: e.type as EmotionType,
          intensity: e.intensity,
          cause: e.cause,
          timestamp: new Date(e.timestamp)
        })),
        backgroundEmotion: data.background_emotion || 'contentment',
        timestamp: new Date()
      }
    } catch {
      // Return default state if parsing fails
      return this.getDefaultState()
    }
  }

  /**
   * Register an emotional event
   */
  async feel(emotion: EmotionType, intensity: number, cause?: string): Promise<void> {
    const args = ['feel', emotion, intensity.toString()]
    if (cause) {
      args.push('--cause', cause)
    }
    await this.runCommand(args)
  }

  /**
   * Record a significant event/memory
   */
  async recordEvent(description: string, salience?: number): Promise<void> {
    const args = ['event', description]
    if (salience !== undefined) {
      args.push('--salience', salience.toString())
    }
    await this.runCommand(args)
  }

  /**
   * Query autobiographical memories
   */
  async getMemories(minSalience = 0.5, limit = 10): Promise<Memory[]> {
    const output = await this.runCommand([
      'memories',
      '--min-salience', minSalience.toString(),
      '--limit', limit.toString(),
      '--json'
    ])

    try {
      const data = JSON.parse(output)
      return (data.memories || []).map((m: any) => ({
        id: m.id,
        description: m.description,
        salience: m.salience,
        timestamp: new Date(m.timestamp),
        relatedEmotions: m.related_emotions
      }))
    } catch {
      return []
    }
  }

  /**
   * Analyze text for emotional content
   */
  async analyze(text: string): Promise<EmotionAnalysis> {
    const output = await this.runCommand(['analyze', text, '--json'])

    try {
      const data = JSON.parse(output)
      return {
        emotions: (data.emotions || []).map((e: any) => ({
          type: e.type as EmotionType,
          intensity: e.intensity
        })),
        dominantEmotion: data.dominant_emotion || 'contentment',
        overallIntensity: data.overall_intensity || 0,
        bodyStateImpact: data.body_state_impact || {}
      }
    } catch {
      // Return neutral analysis if parsing fails
      return {
        emotions: [],
        dominantEmotion: 'joy',
        overallIntensity: 0,
        bodyStateImpact: {}
      }
    }
  }

  /**
   * Check somatic markers for a given context
   */
  async checkSomaticMarkers(context: string): Promise<SomaticMarker[]> {
    const output = await this.runCommand(['markers', '--context', context, '--json'])

    try {
      const data = JSON.parse(output)
      return (data.markers || []).map((m: any) => ({
        triggerPattern: m.trigger_pattern,
        responseTendency: m.response_tendency,
        valence: m.valence,
        strength: m.strength
      }))
    } catch {
      return []
    }
  }

  /**
   * Get default emotional state
   */
  private getDefaultState(): EmotionalState {
    return {
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
      currentEmotions: [],
      backgroundEmotion: 'contentment',
      timestamp: new Date()
    }
  }
}

// Singleton instance
let clientInstance: SableClient | null = null

export function getSableClient(): SableClient {
  if (!clientInstance) {
    clientInstance = new SableClient()
  }
  return clientInstance
}
