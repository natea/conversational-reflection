'use client'

import { use } from 'react'
import { useRouter } from 'next/navigation'
import { useContactsStore } from '@/stores/useContactsStore'

interface ContactDetailClientProps {
  params: Promise<{ id: string }>
}

export default function ContactDetailClient({ params }: ContactDetailClientProps) {
  const { id } = use(params)
  const router = useRouter()
  const contacts = useContactsStore((state) => state.contacts)
  const contact = contacts.find((c) => c.id === id)

  if (!contact) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-8">
        <h1 className="text-2xl font-bold text-text-primary mb-4">Contact Not Found</h1>
        <p className="text-text-secondary mb-6">The contact you're looking for doesn't exist.</p>
        <button
          onClick={() => router.push('/')}
          className="px-4 py-2 bg-voice-accent text-white rounded-lg hover:bg-voice-accent/90"
        >
          Go Home
        </button>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background p-8">
      <button
        onClick={() => router.back()}
        className="mb-6 text-text-secondary hover:text-text-primary flex items-center gap-2"
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
        Back
      </button>

      <div className="max-w-2xl mx-auto">
        <div className="flex items-center gap-4 mb-8">
          <div className="w-20 h-20 rounded-full bg-voice-accent/20 flex items-center justify-center text-3xl font-bold text-voice-accent">
            {contact.name.charAt(0)}
          </div>
          <div>
            <h1 className="text-3xl font-bold text-text-primary">{contact.name}</h1>
            <p className="text-text-secondary capitalize">{contact.relationshipType}</p>
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-surface rounded-lg p-6">
            <h2 className="text-lg font-semibold text-text-primary mb-4">Recent Conversations</h2>
            <p className="text-text-secondary">
              {contact.totalMessages} messages exchanged
            </p>
            {contact.lastInteraction && (
              <p className="text-sm text-text-secondary mt-2">
                Last interaction: {new Date(contact.lastInteraction).toLocaleDateString()}
              </p>
            )}
          </div>

          <div className="bg-surface rounded-lg p-6">
            <h2 className="text-lg font-semibold text-text-primary mb-4">Communication Patterns</h2>
            <p className="text-text-secondary">
              Analysis of your communication patterns with {contact.name} will appear here.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
