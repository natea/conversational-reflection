'use client'

import { type FC } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import { Brain, MessageSquare, GitBranch, Activity, User, Settings as SettingsIcon } from '@/components/ui/Icons'
import { GingerLogo } from '@/components/ui/Icons'
import { useUIStore } from '@/stores/useUIStore'
import { useContactsStore } from '@/stores/useContactsStore'
import { usePipecatStore } from '@/stores/usePipecatStore'
import { ConsciousnessPanel } from '@/components/consciousness/ConsciousnessPanel'
import { useConsciousnessStore } from '@/stores/useConsciousnessStore'
import { VoiceConnectionButton } from '@/components/voice/VoiceConnectionButton'

const NAV_ITEMS = [
  { href: '/reflect', icon: Brain, label: 'Reflect' },
  { href: '/patterns', icon: GitBranch, label: 'Patterns' },
  { href: '/roleplay', icon: MessageSquare, label: 'Roleplay' },
  { href: '/somatic', icon: Activity, label: 'Somatic' },
]

export const Navigation: FC = () => {
  const pathname = usePathname()
  const { isDarkMode, toggleDarkMode, consciousnessExpanded, setConsciousnessExpanded } = useUIStore()
  const { contacts, selectedContactId } = useContactsStore()
  const { connectionStatus, isReady } = usePipecatStore()
  const { currentBodyState, activeEmotions, somaticMarkers } = useConsciousnessStore()

  const selectedContact = selectedContactId ? contacts.find(c => c.id === selectedContactId) : null

  return (
    <>
      {/* Top navigation bar */}
      <nav className="h-14 border-b border-border-light bg-surface flex items-center justify-between px-6 flex-shrink-0">
        {/* Left: Logo and mode navigation */}
        <div className="flex items-center gap-6">
          <Link href="/" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
            <GingerLogo size={24} className="text-voice-accent" />
            <span className="text-xl font-serif font-semibold text-text-primary">Ginger</span>
          </Link>

          <div className="flex items-center gap-1">
            {NAV_ITEMS.map(item => {
              const Icon = item.icon
              const isActive = pathname === item.href
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    'flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors',
                    isActive
                      ? 'bg-voice-accent/10 text-voice-accent'
                      : 'text-text-secondary hover:text-text-primary hover:bg-hover-surface'
                  )}
                >
                  <Icon size={16} />
                  {item.label}
                </Link>
              )
            })}
          </div>
        </div>

        {/* Center: Active contact indicator */}
        {selectedContact && (
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-surface border border-border-light">
            <User size={14} className="text-text-secondary" />
            <span className="text-sm text-text-primary">{selectedContact.name}</span>
          </div>
        )}

        {/* Right: Voice connection, settings and consciousness toggle */}
        <div className="flex items-center gap-2">
          {/* Voice connection status */}
          <div className="flex items-center gap-2">
            <VoiceConnectionButton size="sm" />
            {connectionStatus === 'connected' && (
              <span className={cn(
                'w-2 h-2 rounded-full',
                isReady ? 'bg-success' : 'bg-warning animate-pulse'
              )} />
            )}
          </div>

          <button
            onClick={() => setConsciousnessExpanded(!consciousnessExpanded)}
            className={cn(
              'p-2 rounded-lg transition-colors',
              consciousnessExpanded
                ? 'bg-damasio-lens/10 text-damasio-lens'
                : 'text-text-secondary hover:text-text-primary hover:bg-hover-surface'
            )}
            aria-label="Toggle consciousness panel"
          >
            <Brain size={18} />
          </button>

          <Link
            href="/settings"
            className={cn(
              'p-2 rounded-lg transition-colors',
              pathname === '/settings'
                ? 'bg-voice-accent/10 text-voice-accent'
                : 'text-text-secondary hover:text-text-primary hover:bg-hover-surface'
            )}
          >
            <SettingsIcon size={18} />
          </Link>
        </div>
      </nav>

      {/* Consciousness panel (collapsible sidebar) */}
      {consciousnessExpanded && (
        <div className="fixed right-0 top-14 bottom-0 w-80 bg-background border-l border-border-light shadow-panel z-40 overflow-y-auto custom-scrollbar animate-slide-in-right">
          <ConsciousnessPanel
            bodyState={currentBodyState}
            recentEmotions={activeEmotions}
            activeMarkers={somaticMarkers}
            compact={false}
          />
        </div>
      )}
    </>
  )
}

