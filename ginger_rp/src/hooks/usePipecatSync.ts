'use client'

import { useEffect } from 'react'
import { RTVIEvent } from '@pipecat-ai/client-js'
import { usePipecat } from '@/providers/PipecatProvider'
import { usePipecatStore } from '@/stores/usePipecatStore'
import { useGingerStore } from '@/stores/useGingerStore'
import { useConversationStore } from '@/stores/useConversationStore'

export function usePipecatSync() {
  const { client, status, isReady } = usePipecat()

  // Select only the action functions we need (stable references)
  const setConnectionStatus = usePipecatStore((state) => state.setConnectionStatus)
  const setIsReady = usePipecatStore((state) => state.setIsReady)
  const setUserSpeaking = usePipecatStore((state) => state.setUserSpeaking)
  const setBotSpeaking = usePipecatStore((state) => state.setBotSpeaking)
  const updateCurrentUserUtterance = usePipecatStore((state) => state.updateCurrentUserUtterance)
  const updateCurrentBotUtterance = usePipecatStore((state) => state.updateCurrentBotUtterance)
  const resetCurrentBotUtterance = usePipecatStore((state) => state.resetCurrentBotUtterance)
  const finalizeUserUtterance = usePipecatStore((state) => state.finalizeUserUtterance)
  const finalizeBotUtterance = usePipecatStore((state) => state.finalizeBotUtterance)
  const getCurrentUserUtterance = () => usePipecatStore.getState().currentUserUtterance
  const getCurrentBotUtterance = () => usePipecatStore.getState().currentBotUtterance

  const setVoiceState = useGingerStore((state) => state.setVoiceState)
  const addGingerMessage = useGingerStore((state) => state.addMessage)
  const getActiveLenses = () => useGingerStore.getState().activeLenses

  // Add to conversation store (what the chat panel displays)
  const addConversationMessage = useConversationStore((state) => state.addMessage)

  // Sync connection status
  useEffect(() => {
    setConnectionStatus(status)
  }, [status, setConnectionStatus])

  // Sync ready state
  useEffect(() => {
    setIsReady(isReady)
  }, [isReady, setIsReady])

  // Set up event listeners when client is available
  useEffect(() => {
    console.log('[PipecatSync] Setting up event listeners, client:', client ? 'available' : 'null')
    if (!client) return
    console.log('[PipecatSync] Registering event handlers...')

    // Debug: Log all available RTVIEvent values
    console.log('[PipecatSync] Available RTVIEvents:', Object.keys(RTVIEvent))

    // Listen to transport state changes for debugging
    const handleTransportState = (state: string) => {
      console.log('[PipecatSync] Transport state changed:', state)
    }
    client.on(RTVIEvent.TransportStateChanged, handleTransportState)

    // Listen to local audio level for debugging (only log significant levels)
    let lastLogTime = 0
    const handleAudioLevel = (level: number) => {
      const now = Date.now()
      // Only log every 500ms to avoid spam, and only if level > threshold
      if (level > 0.01 && now - lastLogTime > 500) {
        console.log('[PipecatSync] Local audio level:', level.toFixed(3))
        lastLogTime = now
      }
    }
    client.on(RTVIEvent.LocalAudioLevel, handleAudioLevel)

    // User started speaking
    const handleUserStartedSpeaking = () => {
      console.log('[PipecatSync] User started speaking')
      setUserSpeaking(true)
      setVoiceState('listening')
    }

    // User stopped speaking - save transcript to conversation store
    const handleUserStoppedSpeaking = () => {
      const utterance = getCurrentUserUtterance()
      console.log('[PipecatSync] User stopped speaking, utterance:', utterance)
      if (utterance.trim()) {
        // Add user's voice transcript to conversation store
        addConversationMessage({
          role: 'user',
          content: utterance.trim(),
          isVoiceTranscript: true,
        })
      }
      setUserSpeaking(false)
      finalizeUserUtterance()
      setVoiceState('processing')
    }

    // Bot started speaking - reset accumulated utterance
    const handleBotStartedSpeaking = () => {
      resetCurrentBotUtterance()
      setBotSpeaking(true)
    }

    // Bot stopped speaking - save the complete response to conversation store
    const handleBotStoppedSpeaking = () => {
      const utterance = getCurrentBotUtterance()
      if (utterance.trim()) {
        // Add bot's complete response to conversation store
        const activeLenses = getActiveLenses()
        addConversationMessage({
          role: 'assistant',
          content: utterance.trim(),
          lens: activeLenses[0],
        })
        // Also add to Ginger store for backwards compatibility
        addGingerMessage({
          role: 'assistant',
          content: utterance.trim(),
        })
      }
      setBotSpeaking(false)
      finalizeBotUtterance()
      setVoiceState('idle')
    }

    // User transcript (interim)
    const handleUserTranscript = (data: { text: string }) => {
      console.log('[PipecatSync] User transcript:', data.text)
      updateCurrentUserUtterance(data.text)
    }

    // Bot transcript (interim) - ignore this, we use BotLlmText instead
    // BotTranscript may duplicate with BotLlmText causing double text
    const handleBotTranscript = (_data: { text: string }) => {
      // Intentionally empty - using BotLlmText for bot response accumulation
    }

    // Bot LLM text - fires incrementally as LLM generates text
    // This is the primary source for bot response display
    const handleBotLlmText = (data: { text: string }) => {
      console.log('[PipecatSync] Bot LLM text:', data.text)
      // Accumulate LLM text for live display
      updateCurrentBotUtterance(data.text)
    }

    // Register event handlers
    client.on(RTVIEvent.UserStartedSpeaking, handleUserStartedSpeaking)
    client.on(RTVIEvent.UserStoppedSpeaking, handleUserStoppedSpeaking)
    client.on(RTVIEvent.BotStartedSpeaking, handleBotStartedSpeaking)
    client.on(RTVIEvent.BotStoppedSpeaking, handleBotStoppedSpeaking)
    client.on(RTVIEvent.UserTranscript, handleUserTranscript)
    client.on(RTVIEvent.BotTranscript, handleBotTranscript)
    client.on(RTVIEvent.BotLlmText, handleBotLlmText)

    // Cleanup
    return () => {
      client.off(RTVIEvent.TransportStateChanged, handleTransportState)
      client.off(RTVIEvent.LocalAudioLevel, handleAudioLevel)
      client.off(RTVIEvent.UserStartedSpeaking, handleUserStartedSpeaking)
      client.off(RTVIEvent.UserStoppedSpeaking, handleUserStoppedSpeaking)
      client.off(RTVIEvent.BotStartedSpeaking, handleBotStartedSpeaking)
      client.off(RTVIEvent.BotStoppedSpeaking, handleBotStoppedSpeaking)
      client.off(RTVIEvent.UserTranscript, handleUserTranscript)
      client.off(RTVIEvent.BotTranscript, handleBotTranscript)
      client.off(RTVIEvent.BotLlmText, handleBotLlmText)
    }
  }, [
    client,
    setUserSpeaking,
    setBotSpeaking,
    updateCurrentUserUtterance,
    updateCurrentBotUtterance,
    resetCurrentBotUtterance,
    finalizeUserUtterance,
    finalizeBotUtterance,
    setVoiceState,
    addGingerMessage,
    addConversationMessage,
  ])

  return {
    isConnected: status === 'connected',
    isReady,
  }
}
