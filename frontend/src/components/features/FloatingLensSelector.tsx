'use client'

import { type FC, useState, useRef, useEffect } from 'react'
import { cn } from '@/lib/utils'
import { useGingerStore } from '@/stores/useGingerStore'
import { type LensType } from '@/types'
import { LENSES } from '@/constants'
import { ChevronUp, Check } from '@/components/ui/Icons'

export const FloatingLensSelector: FC = () => {
  const { activeLenses, toggleLens } = useGingerStore()
  const [isOpen, setIsOpen] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)
  
  const primaryLens = activeLenses.length > 0 
    ? LENSES.find(l => l.id === activeLenses[0])
    : null

  // Close when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
    }
    
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isOpen])

  return (
    <div ref={containerRef} className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          'flex items-center gap-2 px-3 py-2 rounded-full transition-all duration-200 ease-out',
          'border border-transparent hover:bg-hover-surface',
          isOpen && 'bg-hover-surface'
        )}
      >
        {/* Lens Color Indicator */}
        {primaryLens ? (
          <div 
            className="w-3 h-3 rounded-full transition-all duration-200"
            style={{ backgroundColor: `var(--${primaryLens.color})` }}
          />
        ) : (
          <div className="w-3 h-3 rounded-full bg-text-secondary/30" />
        )}
        
        {/* Lens Label */}
        <span className="text-sm font-medium text-text-primary hidden sm:inline-block">
          {activeLenses.length === 0 && 'Select Lens'}
          {activeLenses.length === 1 && primaryLens?.name}
          {activeLenses.length > 1 && `${activeLenses.length} Lenses`}
        </span>
        
        {/* Expand Indicator */}
        <ChevronUp 
          size={14} 
          className={cn(
            'text-text-secondary transition-transform duration-200',
            isOpen && 'rotate-180'
          )} 
        />
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute bottom-full left-0 mb-2 w-64 animate-slide-up z-50">
          <div className="bg-surface rounded-lg border border-border-light shadow-modal overflow-hidden">
            <div className="py-1 max-h-[300px] overflow-y-auto custom-scrollbar">
              {LENSES.map((lens) => {
                const isActive = activeLenses.includes(lens.id)
                return (
                  <button
                    key={lens.id}
                    onClick={() => toggleLens(lens.id)}
                    className={cn(
                      'w-full flex items-center gap-3 px-3 py-2 hover:bg-hover-surface transition-colors text-left',
                      isActive && 'bg-surface'
                    )}
                  >
                    {/* Checkbox */}
                    <div
                      className={cn(
                        'w-4 h-4 rounded border flex items-center justify-center flex-shrink-0 transition-colors',
                        !isActive && 'border-border-medium bg-background'
                      )}
                      style={isActive ? {
                        backgroundColor: `var(--${lens.color})`,
                        borderColor: `var(--${lens.color})`
                      } : undefined}
                    >
                      {isActive && <Check size={10} className="text-white" />}
                    </div>

                    {/* Lens info */}
                    <div className="flex-1 min-w-0">
                      <p
                        className={cn(
                          'text-sm font-medium',
                          !isActive && 'text-text-primary'
                        )}
                        style={isActive ? { color: `var(--${lens.color})` } : undefined}
                      >
                        {lens.name}
                      </p>
                      <p className="text-xs text-text-secondary truncate">{lens.fullName}</p>
                    </div>
                  </button>
                )
              })}
            </div>
            
            {/* Quick info footer */}
            {primaryLens && activeLenses.length === 1 && (
              <div className="px-3 py-2 bg-surface border-t border-border-light">
                <p className="text-[10px] text-text-secondary leading-relaxed">
                  {primaryLens.description}
                </p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
