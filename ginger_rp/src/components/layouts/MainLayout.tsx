'use client'

import { type FC, type ReactNode, useEffect } from 'react'
import { Navigation } from './Navigation'
import { PipecatSyncWrapper } from './PipecatSyncWrapper'
import { AudioPlayerBar } from '@/components/voice/AudioPlayerBar'
import { AddSourceModal } from '@/components/features'
import { useUIStore } from '@/stores/useUIStore'

interface MainLayoutProps {
  children: ReactNode
}

export const MainLayout: FC<MainLayoutProps> = ({ children }) => {
  const { isDarkMode, consciousnessExpanded } = useUIStore()

  // Apply dark mode class to html element
  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark')
    } else {
      document.documentElement.classList.remove('dark')
    }
  }, [isDarkMode])

  return (
    <div className="h-screen flex flex-col overflow-hidden bg-background">
      {/* Global Navigation */}
      <Navigation />

      {/* Main Content Area */}
      <div className="flex-1 flex overflow-hidden">
        {/* Main content */}
        <main
          className={cn(
            'flex-1 overflow-hidden transition-all duration-300',
            consciousnessExpanded && 'mr-80'
          )}
        >
          <PipecatSyncWrapper>
            {children}
          </PipecatSyncWrapper>
        </main>
      </div>

      {/* Global Voice Player */}
      <AudioPlayerBar />

      {/* Global Modals */}
      <AddSourceModal />
    </div>
  )
}

// Helper for cn import
function cn(...classes: (string | boolean | undefined)[]) {
  return classes.filter(Boolean).join(' ')
}
