'use client'

import dynamic from 'next/dynamic'

const VibeKanbanWebCompanion = dynamic(
  () => import('vibe-kanban-web-companion').then(mod => mod.VibeKanbanWebCompanion),
  { ssr: false }
)

export function VibeKanbanWrapper() {
  // Only render in development
  if (process.env.NODE_ENV !== 'development') {
    return null
  }

  return <VibeKanbanWebCompanion />
}
