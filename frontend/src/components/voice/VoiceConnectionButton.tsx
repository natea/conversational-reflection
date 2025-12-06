'use client'

import { type FC } from 'react'
import { cn } from '@/lib/utils'
import { usePipecat } from '@/providers/PipecatProvider'
import { usePipecatStore } from '@/stores/usePipecatStore'
import { Phone, PhoneOff, Loader } from 'lucide-react'

interface VoiceConnectionButtonProps {
  className?: string
  size?: 'sm' | 'md' | 'lg'
}

export const VoiceConnectionButton: FC<VoiceConnectionButtonProps> = ({
  className,
  size = 'md',
}) => {
  const { connect, disconnect } = usePipecat()
  const { connectionStatus, isReady, error } = usePipecatStore()

  const isConnected = connectionStatus === 'connected'
  const isConnecting = connectionStatus === 'connecting'
  const hasError = connectionStatus === 'error'

  const handleClick = () => {
    if (isConnected) {
      disconnect()
    } else if (!isConnecting) {
      connect()
    }
  }

  const sizeClasses = {
    sm: 'p-2 text-sm',
    md: 'p-3 text-base',
    lg: 'p-4 text-lg',
  }

  const iconSizes = {
    sm: 16,
    md: 20,
    lg: 24,
  }

  return (
    <div className="flex flex-col items-center gap-2">
      <button
        onClick={handleClick}
        disabled={isConnecting}
        className={cn(
          'rounded-full transition-all duration-200',
          'flex items-center justify-center gap-2',
          sizeClasses[size],
          isConnected
            ? 'bg-success text-white hover:bg-success/90'
            : hasError
            ? 'bg-error text-white hover:bg-error/90'
            : isConnecting
            ? 'bg-voice-accent/50 text-white cursor-wait'
            : 'bg-voice-accent text-white hover:bg-voice-accent/90',
          className
        )}
        aria-label={isConnected ? 'Disconnect from Ginger' : 'Connect to Ginger'}
      >
        {isConnecting ? (
          <Loader className="animate-spin" size={iconSizes[size]} />
        ) : isConnected ? (
          <Phone size={iconSizes[size]} />
        ) : (
          <PhoneOff size={iconSizes[size]} />
        )}

        <span className="hidden sm:inline">
          {isConnecting
            ? 'Connecting...'
            : isConnected
            ? isReady
              ? 'Connected'
              : 'Waiting...'
            : hasError
            ? 'Retry'
            : 'Connect'}
        </span>
      </button>

      {error && (
        <p className="text-xs text-error max-w-[200px] text-center">
          {error}
        </p>
      )}
    </div>
  )
}
