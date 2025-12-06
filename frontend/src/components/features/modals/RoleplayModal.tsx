'use client'

import { type FC, useState } from 'react'
import { Modal } from '@/components/ui/Modal'
import { useGingerStore } from '@/stores/useGingerStore'
import { cn } from '@/lib/utils'
import { MessageCircle, ChevronRight, ChevronLeft, User, Send, Check, Sparkles } from '@/components/ui/Icons'

const QUICK_PROMPTS = [
  'Setting a boundary',
  'Addressing a conflict',
  'Asking for support',
  'Expressing hurt feelings'
]

const PARTNERS = [
  { id: 'sarah', name: 'Sarah', description: 'Your partner from WhatsApp' },
  { id: 'mom', name: 'Mom', description: 'Family dynamics' },
  { id: 'work', name: 'Work Colleague', description: 'Professional boundaries' },
  { id: 'other', name: 'Someone else', description: 'Describe the relationship' }
]

// Simulated roleplay responses based on scenario
const generateRoleplayResponse = (scenario: string): string => {
  const responses: Record<string, string[]> = {
    boundary: [
      "I hear what you're saying, but I'm not sure I understand why you need this right now.",
      "Oh... I didn't realize that was bothering you. Can you help me understand more?",
      "That feels a bit sudden. Have I done something wrong?",
      "I want to respect your needs. What would work better for both of us?"
    ],
    conflict: [
      "I feel like you're attacking me. That's not fair.",
      "Can we take a step back? I don't want this to escalate.",
      "I understand you're upset. I'm willing to listen if you can explain calmly.",
      "What do you need from me right now to help resolve this?"
    ],
    support: [
      "Of course, I'm here for you. What's going on?",
      "I want to help, but I'm not sure what you need. Can you be more specific?",
      "That sounds really hard. Tell me more about what you're feeling.",
      "I didn't know you were going through this. Thank you for sharing with me."
    ],
    hurt: [
      "I'm sorry you feel that way. That wasn't my intention.",
      "I can see I've hurt you. Can you tell me what specifically upset you?",
      "Thank you for telling me. I want to understand better.",
      "I feel defensive hearing this, but I want to work through it with you."
    ],
    default: [
      "Can you tell me more about that?",
      "I'm listening. Go on.",
      "How does that make you feel?",
      "What would you like to happen next?"
    ]
  }

  // Determine scenario type
  let type = 'default'
  const lowerScenario = scenario.toLowerCase()
  if (lowerScenario.includes('boundary')) type = 'boundary'
  else if (lowerScenario.includes('conflict')) type = 'conflict'
  else if (lowerScenario.includes('support')) type = 'support'
  else if (lowerScenario.includes('hurt') || lowerScenario.includes('feeling')) type = 'hurt'

  const options = responses[type]
  return options[Math.floor(Math.random() * options.length)]
}

interface RoleplayMessage {
  id: string
  role: 'user' | 'partner'
  content: string
}

export const RoleplayModal: FC = () => {
  const { roleplayModalOpen, setRoleplayModalOpen, addArtifact } = useGingerStore()
  const [step, setStep] = useState(1)
  const [partner, setPartner] = useState('')
  const [customPartner, setCustomPartner] = useState('')
  const [scenario, setScenario] = useState('')
  const [selectedPrompt, setSelectedPrompt] = useState<string | null>(null)
  const [messages, setMessages] = useState<RoleplayMessage[]>([])
  const [inputText, setInputText] = useState('')
  const [isPartnerTyping, setIsPartnerTyping] = useState(false)

  const handleClose = () => {
    setRoleplayModalOpen(false)
    // Reset after animation
    setTimeout(() => {
      setStep(1)
      setPartner('')
      setCustomPartner('')
      setScenario('')
      setSelectedPrompt(null)
      setMessages([])
      setInputText('')
    }, 300)
  }

  const handlePromptSelect = (prompt: string) => {
    setSelectedPrompt(prompt)
    const partnerName = partner === 'other' ? customPartner || 'them' : partner
    setScenario(`I want to practice ${prompt.toLowerCase()} with ${partnerName}.`)
  }

  const handleStartPractice = () => {
    const partnerName = partner === 'other' ? customPartner || 'Partner' : partner
    // Add initial message from partner
    const initialMessage: RoleplayMessage = {
      id: '0',
      role: 'partner',
      content: `*${partnerName} is ready to practice this conversation with you. Start by saying what you'd like to say to them.*`
    }
    setMessages([initialMessage])
    setStep(3)
  }

  const handleSendMessage = () => {
    if (!inputText.trim()) return

    const userMessage: RoleplayMessage = {
      id: String(Date.now()),
      role: 'user',
      content: inputText
    }
    setMessages(prev => [...prev, userMessage])
    setInputText('')
    setIsPartnerTyping(true)

    // Simulate partner response
    setTimeout(() => {
      const response = generateRoleplayResponse(scenario)
      const partnerMessage: RoleplayMessage = {
        id: String(Date.now() + 1),
        role: 'partner',
        content: response
      }
      setMessages(prev => [...prev, partnerMessage])
      setIsPartnerTyping(false)
    }, 1500)
  }

  const handleEndPractice = () => {
    setStep(4)
  }

  const handleSaveAndClose = () => {
    const partnerName = partner === 'other' ? customPartner || 'Partner' : partner
    addArtifact({
      type: 'reflection',
      title: `Roleplay: ${selectedPrompt || 'Conversation'} with ${partnerName}`,
      description: `Practiced conversation with ${partnerName}. ${messages.length - 1} exchanges. Scenario: ${scenario}`,
      date: new Date()
    })
    handleClose()
  }

  const canProceedStep1 = partner !== '' && (partner !== 'other' || customPartner.trim() !== '')
  const canProceedStep2 = scenario.trim().length > 0

  return (
    <Modal
      isOpen={roleplayModalOpen}
      onClose={handleClose}
      size="lg"
    >
      <div className="p-6">
        {/* Progress Steps */}
        {step < 4 && (
          <div className="flex items-center justify-center gap-2 mb-6">
            {[1, 2, 3].map((s) => (
              <div key={s} className="flex items-center gap-2">
                <div
                  className={cn(
                    'w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-colors',
                    step === s
                      ? 'bg-voice-accent text-white'
                      : step > s
                        ? 'bg-success text-white'
                        : 'bg-surface text-text-secondary'
                  )}
                >
                  {step > s ? <Check size={16} /> : s}
                </div>
                {s < 3 && (
                  <div className={cn(
                    'w-8 h-0.5',
                    step > s ? 'bg-success' : 'bg-border-light'
                  )} />
                )}
              </div>
            ))}
          </div>
        )}

        {/* Step 1: Choose Partner */}
        {step === 1 && (
          <div className="animate-slide-up">
            <div className="text-center mb-6">
              <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-voice-accent/10 mb-4">
                <MessageCircle size={28} className="text-voice-accent" />
              </div>
              <h2 className="font-serif text-2xl font-medium text-text-primary mb-2">
                Who would you like to practice with?
              </h2>
              <p className="text-text-secondary text-sm">
                Choose someone from your life or describe a new person
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3 mb-6">
              {PARTNERS.map((p) => (
                <button
                  key={p.id}
                  onClick={() => setPartner(p.id === 'other' ? 'other' : p.name)}
                  className={cn(
                    'p-4 rounded-xl border-2 text-left transition-all',
                    partner === p.name || (p.id === 'other' && partner === 'other')
                      ? 'border-voice-accent bg-voice-accent/5'
                      : 'border-border-light hover:border-border-medium bg-surface'
                  )}
                >
                  <div className="flex items-center gap-3">
                    <div className={cn(
                      'w-10 h-10 rounded-full flex items-center justify-center',
                      partner === p.name || (p.id === 'other' && partner === 'other')
                        ? 'bg-voice-accent/20'
                        : 'bg-surface'
                    )}>
                      <User size={20} className={cn(
                        partner === p.name || (p.id === 'other' && partner === 'other')
                          ? 'text-voice-accent'
                          : 'text-text-secondary'
                      )} />
                    </div>
                    <div>
                      <p className="font-medium text-text-primary">{p.name}</p>
                      <p className="text-xs text-text-secondary">{p.description}</p>
                    </div>
                  </div>
                </button>
              ))}
            </div>

            {partner === 'other' && (
              <div className="mb-6 animate-fade-in">
                <label className="block text-sm font-medium text-text-primary mb-2">
                  Who is this person?
                </label>
                <input
                  type="text"
                  value={customPartner}
                  onChange={(e) => setCustomPartner(e.target.value)}
                  placeholder="e.g., My manager, A friend, My sibling..."
                  className="w-full px-4 py-3 rounded-lg border border-border-light bg-surface text-text-primary placeholder:text-text-secondary focus:outline-none focus:ring-2 focus:ring-voice-accent/20 focus:border-voice-accent"
                />
              </div>
            )}

            <div className="flex justify-end">
              <button
                onClick={() => setStep(2)}
                disabled={!canProceedStep1}
                className={cn(
                  'px-6 py-2.5 rounded-lg text-sm font-medium transition-all flex items-center gap-2',
                  canProceedStep1
                    ? 'bg-voice-accent text-white hover:bg-voice-accent/90'
                    : 'bg-border-light text-text-secondary cursor-not-allowed'
                )}
              >
                Continue
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
        )}

        {/* Step 2: Describe Scenario */}
        {step === 2 && (
          <div className="animate-slide-up">
            <div className="text-center mb-6">
              <h2 className="font-serif text-2xl font-medium text-text-primary mb-2">
                What do you want to practice?
              </h2>
              <p className="text-text-secondary text-sm">
                Describe the conversation or choose a quick prompt
              </p>
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium text-text-primary mb-2">
                Quick Prompts
              </label>
              <div className="grid grid-cols-2 gap-2">
                {QUICK_PROMPTS.map((prompt) => (
                  <button
                    key={prompt}
                    onClick={() => handlePromptSelect(prompt)}
                    className={cn(
                      'px-4 py-2.5 rounded-lg border text-sm transition-all',
                      selectedPrompt === prompt
                        ? 'border-voice-accent bg-voice-accent/10 text-voice-accent font-medium'
                        : 'border-border-light hover:border-border-medium text-text-secondary hover:text-text-primary'
                    )}
                  >
                    {prompt}
                  </button>
                ))}
              </div>
            </div>

            <div className="mb-6">
              <label className="block text-sm font-medium text-text-primary mb-2">
                Describe the scenario
              </label>
              <textarea
                value={scenario}
                onChange={(e) => setScenario(e.target.value)}
                placeholder={`I want to practice talking to ${partner === 'other' ? customPartner || 'them' : partner} about...`}
                className="w-full h-28 px-4 py-3 rounded-lg border border-border-light bg-surface text-text-primary placeholder:text-text-secondary focus:outline-none focus:ring-2 focus:ring-voice-accent/20 focus:border-voice-accent resize-none"
              />
            </div>

            <div className="flex justify-between">
              <button
                onClick={() => setStep(1)}
                className="px-6 py-2.5 rounded-lg text-sm font-medium text-text-secondary hover:text-text-primary hover:bg-hover-surface transition-all flex items-center gap-2"
              >
                <ChevronLeft size={16} />
                Back
              </button>
              <button
                onClick={handleStartPractice}
                disabled={!canProceedStep2}
                className={cn(
                  'px-6 py-2.5 rounded-lg text-sm font-medium transition-all flex items-center gap-2',
                  canProceedStep2
                    ? 'bg-voice-accent text-white hover:bg-voice-accent/90'
                    : 'bg-border-light text-text-secondary cursor-not-allowed'
                )}
              >
                <Sparkles size={16} />
                Start Practice
              </button>
            </div>
          </div>
        )}

        {/* Step 3: Practice Conversation */}
        {step === 3 && (
          <div className="animate-slide-up flex flex-col h-[500px]">
            {/* Header */}
            <div className="flex items-center justify-between pb-4 border-b border-border-light mb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-surface flex items-center justify-center">
                  <User size={20} className="text-text-secondary" />
                </div>
                <div>
                  <p className="font-medium text-text-primary">
                    {partner === 'other' ? customPartner || 'Partner' : partner}
                  </p>
                  <p className="text-xs text-text-secondary">Practicing: {selectedPrompt || 'Conversation'}</p>
                </div>
              </div>
              <button
                onClick={handleEndPractice}
                className="px-4 py-2 rounded-lg text-sm font-medium bg-surface text-text-primary hover:bg-hover-surface transition-colors"
              >
                End Practice
              </button>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto space-y-4 mb-4">
              {messages.map((msg) => (
                <div
                  key={msg.id}
                  className={cn(
                    'flex',
                    msg.role === 'user' ? 'justify-end' : 'justify-start'
                  )}
                >
                  <div className={cn(
                    'max-w-[80%] px-4 py-3 rounded-2xl',
                    msg.role === 'user'
                      ? 'bg-voice-accent text-white rounded-br-sm'
                      : 'bg-surface text-text-primary rounded-bl-sm'
                  )}>
                    <p className="text-sm">{msg.content}</p>
                  </div>
                </div>
              ))}
              {isPartnerTyping && (
                <div className="flex justify-start">
                  <div className="bg-surface px-4 py-3 rounded-2xl rounded-bl-sm">
                    <div className="flex gap-1">
                      <div className="w-2 h-2 rounded-full bg-text-secondary animate-bounce" style={{ animationDelay: '0ms' }} />
                      <div className="w-2 h-2 rounded-full bg-text-secondary animate-bounce" style={{ animationDelay: '150ms' }} />
                      <div className="w-2 h-2 rounded-full bg-text-secondary animate-bounce" style={{ animationDelay: '300ms' }} />
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Input */}
            <div className="flex items-center gap-2 pt-4 border-t border-border-light">
              <input
                type="text"
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                placeholder="Type your response..."
                className="flex-1 px-4 py-3 rounded-full border border-border-light bg-surface text-text-primary placeholder:text-text-secondary focus:outline-none focus:ring-2 focus:ring-voice-accent/20 focus:border-voice-accent"
              />
              <button
                onClick={handleSendMessage}
                disabled={!inputText.trim()}
                className={cn(
                  'p-3 rounded-full transition-colors',
                  inputText.trim()
                    ? 'bg-voice-accent text-white hover:bg-voice-accent/90'
                    : 'bg-surface text-text-secondary'
                )}
              >
                <Send size={18} />
              </button>
            </div>
          </div>
        )}

        {/* Step 4: Summary */}
        {step === 4 && (
          <div className="animate-slide-up text-center">
            <div className="w-16 h-16 rounded-full bg-success/10 flex items-center justify-center mx-auto mb-4">
              <Check size={32} className="text-success" />
            </div>
            <h2 className="font-serif text-2xl font-medium text-text-primary mb-2">
              Practice Complete
            </h2>
            <p className="text-text-secondary mb-6">
              You exchanged {messages.length - 1} messages with {partner === 'other' ? customPartner : partner}
            </p>

            <div className="bg-surface rounded-xl p-4 mb-6 text-left">
              <h3 className="text-sm font-medium text-text-primary mb-2">Session Summary</h3>
              <ul className="space-y-2 text-sm text-text-secondary">
                <li>Practiced: {selectedPrompt || 'Conversation'}</li>
                <li>Partner: {partner === 'other' ? customPartner : partner}</li>
                <li>Exchanges: {messages.length - 1}</li>
                <li>Scenario: {scenario.slice(0, 60)}...</li>
              </ul>
            </div>

            <div className="flex gap-3">
              <button
                onClick={handleClose}
                className="flex-1 px-4 py-2.5 rounded-lg text-sm font-medium bg-surface text-text-primary hover:bg-hover-surface transition-colors"
              >
                Discard
              </button>
              <button
                onClick={handleSaveAndClose}
                className="flex-1 px-4 py-2.5 rounded-lg text-sm font-medium bg-voice-accent text-white hover:bg-voice-accent/90 transition-colors"
              >
                Save as Artifact
              </button>
            </div>
          </div>
        )}
      </div>
    </Modal>
  )
}
