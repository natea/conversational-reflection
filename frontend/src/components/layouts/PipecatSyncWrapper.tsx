'use client'

import { type FC, type ReactNode } from 'react'
import { usePipecatSync } from '@/hooks/usePipecatSync'

interface PipecatSyncWrapperProps {
  children: ReactNode
}

export const PipecatSyncWrapper: FC<PipecatSyncWrapperProps> = ({ children }) => {
  // This hook sets up all Pipecat event listeners and syncs to stores
  usePipecatSync()

  return <>{children}</>
}
