'use client'

import { useEffect, useRef } from 'react'
import { RTVIEvent } from '@pipecat-ai/client-js'
import { usePipecat } from '@/providers/PipecatProvider'
import { usePipecatStore } from '@/stores/usePipecatStore'
import { useGingerStore } from '@/stores/useGingerStore'
import { useConversationStore } from '@/stores/useConversationStore'

export function usePipecatSync() {
  const { client, status, isReady } = usePipecat()

  // Debounce timer for user stopped speaking to prevent rapid-fire message creation
  const userStoppedDebounceRef = useRef<NodeJS.Timeout | null>(null)
  // Track last saved utterance to prevent duplicates
  const lastSavedUtteranceRef = useRef<string>('')
  // Track if we're in a new LLM response (to know when to reset bot utterance)
  const isNewBotResponseRef = useRef<boolean>(true)
  // Accumulate finalized transcript segments for the current user turn
  const finalizedSegmentsRef = useRef<string>('')

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
    const handleAudioLevel = (data: number | { level: number }) => {
      const now = Date.now()
      // Handle both number and object formats
      const level = typeof data === 'number' ? data : data?.level
      if (typeof level !== 'number') return
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
      // Cancel any pending "stopped speaking" debounce - user is still talking
      if (userStoppedDebounceRef.current) {
        clearTimeout(userStoppedDebounceRef.current)
        userStoppedDebounceRef.current = null
      }
      // Reset finalized segments when user starts a new turn
      finalizedSegmentsRef.current = ''
      setUserSpeaking(true)
      setVoiceState('listening')
    }

    // User stopped speaking - debounce and save transcript to conversation store
    const handleUserStoppedSpeaking = () => {
      console.log('[PipecatSync] User stopped speaking event received')

      // Cancel any existing debounce
      if (userStoppedDebounceRef.current) {
        clearTimeout(userStoppedDebounceRef.current)
      }

      // Debounce: wait 300ms before finalizing to allow for continued speech
      userStoppedDebounceRef.current = setTimeout(() => {
        const utterance = getCurrentUserUtterance()
        console.log('[PipecatSync] Finalizing utterance after debounce:', utterance)

        if (utterance.trim()) {
          // Only save if this is a new utterance (not a duplicate)
          if (utterance.trim() !== lastSavedUtteranceRef.current) {
            lastSavedUtteranceRef.current = utterance.trim()
            // Add user's voice transcript to conversation store
            addConversationMessage({
              role: 'user',
              content: utterance.trim(),
              isVoiceTranscript: true,
            })
          } else {
            console.log('[PipecatSync] Skipping duplicate utterance')
          }
        }
        setUserSpeaking(false)
        finalizeUserUtterance()
        // Clear finalized segments for next turn
        finalizedSegmentsRef.current = ''
        setVoiceState('processing')
        userStoppedDebounceRef.current = null
      }, 300)
    }

    // Bot started speaking - just mark as speaking (don't reset utterance here!)
    // The utterance is reset when first BotLlmText arrives to avoid race condition
    const handleBotStartedSpeaking = () => {
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
      // Mark that next LLM text will be a new response
      isNewBotResponseRef.current = true
    }

    // User transcript - handles both interim and final transcripts from Deepgram
    // Deepgram sends: { text: string, final?: boolean }
    // Interim transcripts replace each other, final transcripts should be accumulated
    const handleUserTranscript = (data: { text: string; final?: boolean }) => {
      console.log('[PipecatSync] User transcript:', data.text, 'final:', data.final)

      if (data.final) {
        // Final transcript: accumulate it with previous finalized segments
        if (data.text.trim()) {
          finalizedSegmentsRef.current = finalizedSegmentsRef.current
            ? finalizedSegmentsRef.current + ' ' + data.text.trim()
            : data.text.trim()
        }
        // Update display with accumulated final text
        updateCurrentUserUtterance(finalizedSegmentsRef.current)
      } else {
        // Interim transcript: show accumulated finals + current interim
        const fullText = finalizedSegmentsRef.current
          ? finalizedSegmentsRef.current + ' ' + data.text
          : data.text
        updateCurrentUserUtterance(fullText)
      }
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
      // Reset utterance on first text of a new response to avoid race condition
      // (LLM text arrives before BotStartedSpeaking event)
      if (isNewBotResponseRef.current) {
        resetCurrentBotUtterance()
        isNewBotResponseRef.current = false
      }
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
      // Clear any pending debounce timer
      if (userStoppedDebounceRef.current) {
        clearTimeout(userStoppedDebounceRef.current)
        userStoppedDebounceRef.current = null
      }
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
