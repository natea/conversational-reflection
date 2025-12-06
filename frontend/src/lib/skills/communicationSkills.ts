import type { LensType } from '@/types'

export interface CommunicationSkill {
  id: string
  name: string
  description: string
  difficultyLevel: 1 | 2 | 3
  practiceScenarios: string[]
  keyTechniques: string[]
  relatedLens: LensType
  icon: string
  color: string
}

export interface SkillResponsePattern {
  opening: string[]
  escalation: string[]
  deescalation: string[]
  challenging: string[]
  receptive: string[]
}

// Communication skills database
export const COMMUNICATION_SKILLS: CommunicationSkill[] = [
  {
    id: 'boundary-setting',
    name: 'Setting Boundaries',
    description: 'Express limits clearly while maintaining connection and respect',
    difficultyLevel: 2,
    practiceScenarios: [
      'A friend keeps asking to borrow money despite not paying you back',
      'Your partner wants to see you every evening but you need alone time',
      'A family member expects you to attend all gatherings',
      'A colleague keeps asking you to cover their shifts'
    ],
    keyTechniques: [
      'Use "I" statements to express your needs',
      'Be clear and specific about your limits',
      'Acknowledge the other person\'s feelings',
      'Offer alternatives when possible',
      'Stay firm without being aggressive'
    ],
    relatedLens: 'act',
    icon: 'shield',
    color: 'amber'
  },
  {
    id: 'conflict-resolution',
    name: 'Resolving Conflicts',
    description: 'Address disagreements constructively and find mutual understanding',
    difficultyLevel: 3,
    practiceScenarios: [
      'You and your partner disagree about household responsibilities',
      'A friend accused you of being unsupportive',
      'Your parent criticizes your life choices',
      'A roommate is upset about cleaning standards'
    ],
    keyTechniques: [
      'Separate facts from interpretations',
      'Identify cognitive distortions in your thinking',
      'Use "What evidence supports/contradicts this?"',
      'Focus on specific behaviors, not character',
      'Find common ground before addressing differences'
    ],
    relatedLens: 'cbt',
    icon: 'git-merge',
    color: 'blue'
  },
  {
    id: 'emotional-expression',
    name: 'Expressing Emotions',
    description: 'Communicate feelings clearly and authentically without overwhelming others',
    difficultyLevel: 2,
    practiceScenarios: [
      'You feel hurt by a friend\'s comment but haven\'t said anything',
      'Your partner doesn\'t know how stressed you\'ve been',
      'You\'re excited about something but fear being judged',
      'You need to tell someone they disappointed you'
    ],
    keyTechniques: [
      'Name the emotion and where you feel it in your body',
      'Connect emotion to specific situation',
      'Use emotion as information, not blame',
      'Allow vulnerability while staying grounded',
      'Check in with somatic sensations'
    ],
    relatedLens: 'damasio',
    icon: 'heart',
    color: 'rose'
  },
  {
    id: 'active-listening',
    name: 'Active Listening',
    description: 'Fully hear and validate others while managing your own reactions',
    difficultyLevel: 1,
    practiceScenarios: [
      'Your friend is venting about their relationship troubles',
      'Your parent is expressing worry about your choices',
      'Your partner is sharing something that triggers you',
      'A colleague is explaining why they\'re upset with you'
    ],
    keyTechniques: [
      'Reflect back what you hear without judgment',
      'Notice which "part" is activated in you',
      'Stay curious about their perspective',
      'Resist the urge to fix or defend',
      'Acknowledge their emotional experience'
    ],
    relatedLens: 'ifs',
    icon: 'ear',
    color: 'green'
  },
  {
    id: 'assertiveness',
    name: 'Being Assertive',
    description: 'Express needs and opinions confidently without aggression',
    difficultyLevel: 2,
    practiceScenarios: [
      'You need to ask your boss for a raise',
      'Someone is treating you disrespectfully',
      'You want to suggest a different plan than your group',
      'You need to say no to a request'
    ],
    keyTechniques: [
      'Focus on what\'s within your control',
      'State your position clearly and calmly',
      'Use confident body language and tone',
      'Don\'t over-explain or apologize excessively',
      'Accept that others may disagree'
    ],
    relatedLens: 'stoic',
    icon: 'zap',
    color: 'purple'
  },
  {
    id: 'repair-after-rupture',
    name: 'Repairing Ruptures',
    description: 'Reconnect after conflict or misunderstanding with authenticity',
    difficultyLevel: 3,
    practiceScenarios: [
      'You said something hurtful in an argument yesterday',
      'There\'s been tension with a friend for weeks',
      'You need to apologize for missing an important event',
      'A misunderstanding created distance in your relationship'
    ],
    keyTechniques: [
      'Acknowledge the hurt without defensiveness',
      'Take responsibility for your part',
      'Listen to their protective parts',
      'Express genuine remorse',
      'Ask what they need to feel safe again'
    ],
    relatedLens: 'ifs',
    icon: 'heart-handshake',
    color: 'teal'
  }
]

// Response patterns for AI partner based on skill
export const SKILL_RESPONSE_PATTERNS: Record<string, SkillResponsePattern> = {
  'boundary-setting': {
    opening: [
      "I don't understand why this is suddenly an issue...",
      "But you've always been okay with this before",
      "I just need this one favor, please?",
      "Are you saying you don't care about me?"
    ],
    escalation: [
      "This is really hurtful. I thought I could count on you.",
      "You're being selfish right now.",
      "Fine, I guess I know where I stand with you.",
      "Why are you making such a big deal out of this?"
    ],
    deescalation: [
      "I'm hearing that this is important to you...",
      "Can you help me understand your perspective better?",
      "I didn't realize this was affecting you this way.",
      "What would work better for both of us?"
    ],
    challenging: [
      "But what about my needs? Don't they matter?",
      "I feel like you're pushing me away.",
      "This seems to be coming out of nowhere.",
      "Can't you make an exception just this once?"
    ],
    receptive: [
      "Thank you for being honest with me about this.",
      "I appreciate you telling me. I want to respect your boundaries.",
      "That makes sense. I'm sorry I didn't see it before.",
      "What can I do to support you while respecting this limit?"
    ]
  },
  'conflict-resolution': {
    opening: [
      "We need to talk about what happened.",
      "I've been feeling really upset about this.",
      "I don't think you realize how your actions affected me.",
      "Can we clear the air about what's been going on?"
    ],
    escalation: [
      "You always do this! You never take responsibility!",
      "This is exactly what I'm talking about - you're not listening!",
      "I can't believe you're making excuses right now.",
      "You're being completely unreasonable."
    ],
    deescalation: [
      "Let me try to explain where I'm coming from...",
      "I can see this is important to both of us.",
      "Maybe I wasn't clear about what I meant.",
      "Can we take a breath and start over?"
    ],
    challenging: [
      "But that's not what happened from my perspective.",
      "I feel attacked right now.",
      "Are you saying this is all my fault?",
      "I don't think you're being fair."
    ],
    receptive: [
      "I see how my actions hurt you. I'm sorry.",
      "You're right, I could have handled that differently.",
      "Help me understand what you needed from me.",
      "I want to work through this together."
    ]
  },
  'emotional-expression': {
    opening: [
      "Is everything okay? You seem different lately.",
      "I want to understand how you're feeling.",
      "You can talk to me, you know.",
      "I'm here if you want to share what's going on."
    ],
    escalation: [
      "Why didn't you tell me sooner?",
      "I had no idea you felt this way!",
      "This is a lot to process right now.",
      "I feel like I don't even know you."
    ],
    deescalation: [
      "Thank you for trusting me with this.",
      "That sounds really difficult. I'm listening.",
      "I can see this is important to you.",
      "Take your time, I'm not going anywhere."
    ],
    challenging: [
      "Are you sure you're not overreacting?",
      "I don't really understand why you feel that way.",
      "But I didn't mean it like that...",
      "You're being really sensitive about this."
    ],
    receptive: [
      "I hear you. That must be really hard.",
      "Thank you for sharing this with me.",
      "I want to understand better. Tell me more.",
      "Your feelings make sense given what you're experiencing."
    ]
  },
  'active-listening': {
    opening: [
      "I really need to talk to you about something.",
      "Can I share what's been on my mind?",
      "I've been struggling with something and need to get it out.",
      "There's something I need you to hear."
    ],
    escalation: [
      "You're not really listening to me!",
      "I don't think you understand what I'm saying.",
      "This is exactly the problem - you're always defending yourself!",
      "Forget it, you don't get it."
    ],
    deescalation: [
      "I appreciate you trying to understand.",
      "It helps just to have you listen.",
      "Thank you for not jumping in with solutions.",
      "I feel heard. That means a lot."
    ],
    challenging: [
      "Did you even hear what I just said?",
      "You're thinking about what to say next, aren't you?",
      "I need you to just listen, not fix this.",
      "Why do you keep interrupting me?"
    ],
    receptive: [
      "That's exactly it. You really get it.",
      "Yes! I feel like you understand me.",
      "I'm so glad I talked to you about this.",
      "Thank you for being here with me in this."
    ]
  },
  'assertiveness': {
    opening: [
      "Actually, I have a different idea...",
      "I need to speak up about something.",
      "I'd like to share my perspective on this.",
      "Can we talk about what I need?"
    ],
    escalation: [
      "Who do you think you are?",
      "That's not going to work for me at all.",
      "You can't be serious.",
      "That's completely unreasonable."
    ],
    deescalation: [
      "I respect your position. Let me consider it.",
      "That's a valid point. Help me understand more.",
      "I appreciate you being direct with me.",
      "Let's see if we can find something that works for both of us."
    ],
    challenging: [
      "Why should we do it your way?",
      "You're being awfully demanding.",
      "What makes you think you know better?",
      "I don't appreciate your tone right now."
    ],
    receptive: [
      "I respect that. Thanks for being clear.",
      "I appreciate you standing up for what you need.",
      "That makes sense. I can work with that.",
      "I'm glad you were honest with me about this."
    ]
  },
  'repair-after-rupture': {
    opening: [
      "I've been thinking about what happened...",
      "I owe you an apology.",
      "Can we talk about the other day?",
      "I want to make things right between us."
    ],
    escalation: [
      "You really hurt me, you know.",
      "I don't know if I can just move past this.",
      "This isn't the first time this has happened.",
      "Actions speak louder than words."
    ],
    deescalation: [
      "I appreciate you reaching out about this.",
      "I can see you're trying. That means something.",
      "Thank you for acknowledging what happened.",
      "I'm willing to work through this with you."
    ],
    challenging: [
      "Why should I believe things will be different?",
      "You said this before and nothing changed.",
      "I'm not sure I'm ready to forgive yet.",
      "It's going to take time for me to trust again."
    ],
    receptive: [
      "I forgive you. Let's move forward.",
      "I appreciate your honesty. We're okay.",
      "Thank you for taking responsibility.",
      "I'm glad we can talk about this openly."
    ]
  }
}

// Get skill by ID
export const getSkillById = (skillId: string): CommunicationSkill | undefined => {
  return COMMUNICATION_SKILLS.find(skill => skill.id === skillId)
}

// Get recommended skills based on relationship type
export const getRecommendedSkills = (relationshipType: string): CommunicationSkill[] => {
  const recommendations: Record<string, string[]> = {
    romantic: ['boundary-setting', 'emotional-expression', 'conflict-resolution', 'repair-after-rupture'],
    family: ['boundary-setting', 'assertiveness', 'conflict-resolution', 'emotional-expression'],
    friend: ['emotional-expression', 'boundary-setting', 'repair-after-rupture', 'active-listening'],
    colleague: ['assertiveness', 'conflict-resolution', 'boundary-setting', 'active-listening'],
    other: ['active-listening', 'emotional-expression', 'assertiveness', 'conflict-resolution']
  }

  const skillIds = recommendations[relationshipType] || recommendations.other
  return COMMUNICATION_SKILLS.filter(skill => skillIds.includes(skill.id))
}

// Generate a roleplay response based on skill, difficulty, and user progress
export const generateSkillBasedResponse = (
  skillId: string,
  userMessage: string,
  messageCount: number,
  partnerEmotionalState: 'opening' | 'escalation' | 'deescalation' | 'challenging' | 'receptive'
): string => {
  const pattern = SKILL_RESPONSE_PATTERNS[skillId]
  if (!pattern) {
    return "I hear what you're saying. Tell me more."
  }

  const responses = pattern[partnerEmotionalState]
  return responses[Math.floor(Math.random() * responses.length)]
}

// Analyze user message to determine partner's next emotional state
export const analyzeMessageForState = (
  userMessage: string,
  currentState: 'opening' | 'escalation' | 'deescalation' | 'challenging' | 'receptive',
  skillId: string
): 'opening' | 'escalation' | 'deescalation' | 'challenging' | 'receptive' => {
  const msg = userMessage.toLowerCase()

  // Positive indicators
  const hasAcknowledgment = msg.includes('i hear') || msg.includes('i understand') || msg.includes('you\'re right')
  const hasApology = msg.includes('sorry') || msg.includes('apologize') || msg.includes('my fault')
  const hasValidation = msg.includes('feel') || msg.includes('makes sense') || msg.includes('valid')
  const hasIStatements = msg.includes('i feel') || msg.includes('i need') || msg.includes('i want')

  // Negative indicators
  const hasDefensiveness = msg.includes('but') || msg.includes('actually') || msg.includes('however')
  const hasBlame = msg.includes('you always') || msg.includes('you never') || msg.includes('your fault')
  const hasAggression = msg.includes('!') && (msg.includes('wrong') || msg.includes('ridiculous'))

  // Calculate score
  let deescalationScore = 0
  if (hasAcknowledgment) deescalationScore += 2
  if (hasApology) deescalationScore += 2
  if (hasValidation) deescalationScore += 1
  if (hasIStatements) deescalationScore += 1

  let escalationScore = 0
  if (hasDefensiveness) escalationScore += 1
  if (hasBlame) escalationScore += 2
  if (hasAggression) escalationScore += 2

  // Determine next state
  if (deescalationScore >= 3) {
    return 'receptive'
  } else if (deescalationScore >= 1 && escalationScore === 0) {
    return 'deescalation'
  } else if (escalationScore >= 2) {
    return 'escalation'
  } else if (currentState === 'receptive' || currentState === 'deescalation') {
    return Math.random() > 0.3 ? 'receptive' : 'challenging'
  } else {
    return 'challenging'
  }
}

