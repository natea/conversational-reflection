// Pipecat RTVI Event Types
export interface RTVITranscriptEvent {
  text: string
  final: boolean
  timestamp?: number
}

export interface RTVIBotTextEvent {
  text: string
}

export interface RTVIErrorEvent {
  error: string
  code?: string
}

// Pipecat Connection Types
export type PipecatConnectionStatus = 'disconnected' | 'connecting' | 'connected' | 'error'

export interface PipecatConfig {
  webrtcEndpoint: string
  enableMic?: boolean
  enableCam?: boolean
}

// Pipecat Bot State (from backend)
export interface GingerEmotionalState {
  body_state: {
    heart_rate: number
    temperature: number
    tension: number
    energy: number
    breathing: number
  }
  emotions: Array<{
    type: string
    intensity: number
    cause: string
  }>
  background_feelings: string[]
  last_updated: string
}

export interface GingerRoleplayState {
  active: boolean
  character: string | null
  character_emotion: string | null
  scenario: number
  scenario_emotions: string[]
  voice_modifiers: {
    speed: number
    pitch: string
  }
}
