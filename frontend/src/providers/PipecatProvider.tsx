'use client'

import { createContext, useContext, useState, useCallback, useEffect, type ReactNode } from 'react'
import { PipecatClient, RTVIEvent, RTVIMessage } from '@pipecat-ai/client-js'
import { PipecatClientProvider as ReactProvider, PipecatClientAudio } from '@pipecat-ai/client-react'
import { SmallWebRTCTransport } from '@pipecat-ai/small-webrtc-transport'
import { DailyTransport } from '@pipecat-ai/daily-transport'
import { useAudioDeviceStore } from '@/stores/useAudioDeviceStore'

export type ConnectionStatus = 'disconnected' | 'connecting' | 'connected' | 'error'

// Check if we're using Pipecat Cloud (which requires DailyTransport)
const PIPECAT_WEBRTC_URL = process.env.NEXT_PUBLIC_PIPECAT_WEBRTC_URL || ''
const isCloudDeployment = PIPECAT_WEBRTC_URL.includes('pipecat.daily.co')

interface PipecatContextValue {
  client: PipecatClient | null
  status: ConnectionStatus
  error: string | null
  connect: () => Promise<void>
  disconnect: () => void
  isReady: boolean
}

const PipecatContext = createContext<PipecatContextValue | null>(null)

interface PipecatProviderProps {
  children: ReactNode
  webrtcEndpoint?: string
}

export function PipecatProvider({
  children,
  webrtcEndpoint = '/api/offer'
}: PipecatProviderProps) {
  const [client, setClient] = useState<PipecatClient | null>(null)
  const [status, setStatus] = useState<ConnectionStatus>('disconnected')
  const [error, setError] = useState<string | null>(null)
  const [isReady, setIsReady] = useState(false)

  // Initialize client on mount
  useEffect(() => {
    // Use DailyTransport for Pipecat Cloud, SmallWebRTCTransport for local
    const transport = isCloudDeployment ? new DailyTransport() : new SmallWebRTCTransport()
    console.log('[Pipecat] Using transport:', isCloudDeployment ? 'DailyTransport (Cloud)' : 'SmallWebRTCTransport (Local)')

    const pcClient = new PipecatClient({
      transport,
      enableMic: true,
      enableCam: false,
      callbacks: {
        onConnected: () => {
          console.log('[Pipecat] Connected')
          setStatus('connected')
          setError(null)
        },
        onDisconnected: () => {
          console.log('[Pipecat] Disconnected')
          setStatus('disconnected')
          setIsReady(false)
        },
        onBotReady: () => {
          console.log('[Pipecat] Bot ready')
          setIsReady(true)
        },
      },
    })

    // Set up event listeners
    pcClient.on(RTVIEvent.Error, (message: RTVIMessage) => {
      console.error('[Pipecat] Error:', message)
      // RTVIMessage.data is typed as {} but can contain error info at runtime
      const data = message.data as Record<string, unknown>
      const errorMsg = data?.error || data?.message || 'Unknown error'
      setError(typeof errorMsg === 'string' ? errorMsg : 'Connection error')
      setStatus('error')
    })

    setClient(pcClient)

    return () => {
      pcClient.disconnect()
    }
  }, [])

  // Get selected device from store
  const selectedInputDeviceId = useAudioDeviceStore((state) => state.selectedInputDeviceId)

  const connect = useCallback(async () => {
    if (!client) return

    try {
      setStatus('connecting')
      setError(null)

      console.log('[Pipecat] Connecting with selected mic:', selectedInputDeviceId || '(empty - system default)')
      console.log('[Pipecat] selectedInputDeviceId type:', typeof selectedInputDeviceId, 'length:', selectedInputDeviceId?.length)

      // List all available mics for debugging and find a real microphone
      let micToUse = selectedInputDeviceId
      try {
        const allMics = await client.getAllMics()
        console.log('[Pipecat] Available microphones:', allMics.map(m => ({
          id: m.deviceId.slice(0, 8) + '...',
          label: m.label
        })))

        // If no specific mic selected, try to find a real microphone (not virtual)
        if (!micToUse) {
          // Look for MacBook microphone or any mic that isn't BlackHole/virtual
          const realMic = allMics.find(m =>
            m.label.toLowerCase().includes('macbook') ||
            m.label.toLowerCase().includes('built-in') ||
            m.label.toLowerCase().includes('internal') ||
            (!m.label.toLowerCase().includes('blackhole') &&
             !m.label.toLowerCase().includes('virtual') &&
             !m.label.toLowerCase().includes('aggregate'))
          )
          if (realMic) {
            console.log('[Pipecat] Auto-selecting real microphone:', realMic.label)
            micToUse = realMic.deviceId
          } else {
            console.warn('[Pipecat] No real microphone found! Available:', allMics.map(m => m.label))
          }
        }
      } catch (e) {
        console.warn('[Pipecat] Could not list mics:', e)
      }

      // If a specific mic is selected (or auto-detected), call updateMic BEFORE connecting
      // This ensures the transport uses the correct device from the start
      if (micToUse) {
        console.log('[Pipecat] Pre-selecting microphone before connection:', micToUse)
        try {
          await client.updateMic(micToUse)
          console.log('[Pipecat] Microphone pre-selected successfully')

          // Debug: verify the selection
          const selectedMic = client.selectedMic
          console.log('[Pipecat] Verified selected mic:', selectedMic)
        } catch (micErr) {
          console.warn('[Pipecat] Pre-selection failed (will try again after connect):', micErr)
        }
      }

      await client.connect({
        webrtcRequestParams: {
          endpoint: webrtcEndpoint,
        },
      })

      // Debug: Log the actual microphone being used after connection
      console.log('[Pipecat] Connected. Checking active microphone...')
      const postConnectMic = client.selectedMic
      console.log('[Pipecat] Post-connect mic:', postConnectMic)

      // If mic doesn't match what we intended, try to switch again
      if (micToUse && postConnectMic?.deviceId !== micToUse) {
        console.log('[Pipecat] Mic mismatch detected!')
        console.log('[Pipecat] Expected:', micToUse)
        console.log('[Pipecat] Got:', postConnectMic?.deviceId)
        console.log('[Pipecat] Switching to intended mic...')
        try {
          await client.updateMic(micToUse)
          console.log('[Pipecat] Microphone switched successfully')

          // Verify again
          const finalMic = client.selectedMic
          console.log('[Pipecat] Final mic after switch:', finalMic)
        } catch (micErr) {
          console.error('[Pipecat] Failed to switch microphone after connect:', micErr)
        }
      }

      // Debug: Check if mic is enabled and tracks
      console.log('[Pipecat] Mic enabled:', client.isMicEnabled)
      const tracks = client.tracks()
      console.log('[Pipecat] Current tracks:', tracks)
    } catch (err) {
      console.error('[Pipecat] Connection failed:', err)
      setError(err instanceof Error ? err.message : 'Connection failed')
      setStatus('error')
    }
  }, [client, webrtcEndpoint, selectedInputDeviceId])

  const disconnect = useCallback(() => {
    if (!client) return
    client.disconnect()
  }, [client])

  // Don't render ReactProvider until client is initialized
  if (!client) {
    return null
  }

  return (
    <PipecatContext.Provider value={{
      client,
      status,
      error,
      connect,
      disconnect,
      isReady,
    }}>
      <ReactProvider client={client}>
        {/* PipecatClientAudio handles playing the bot's audio through speakers */}
        <PipecatClientAudio />
        {children}
      </ReactProvider>
    </PipecatContext.Provider>
  )
}

export function usePipecat() {
  const context = useContext(PipecatContext)
  if (!context) {
    throw new Error('usePipecat must be used within a PipecatProvider')
  }
  return context
}
