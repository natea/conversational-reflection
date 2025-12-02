# Roleplay Feature Design

## Overview

A "difficult conversation rehearsal" mode where Ginger takes on the persona of someone the user needs to have a hard conversation with. Ginger presents two contrasting scenarios sequentially, fully embodying the other person with a distinct character voice, then provides coaching feedback after each.

## Activation (Three Ways)

1. **Explicit request**: "Ginger, can you roleplay as my mom?" or "I need to practice a conversation"
2. **Specific trigger**: "Start roleplay mode"
3. **Context detection**: When user describes an upcoming difficult conversation, Ginger offers: "Would you like to practice that conversation? I can play [person] so you can rehearse different approaches."

## Information Gathering

Minimal - Ginger works with whatever the user volunteers and improvises the rest. She might ask one or two clarifying questions if truly needed ("What's your mom usually like when she's defensive?") but doesn't run through a structured intake.

## Session Flow

### Step 1: Setup
User describes the situation. Ginger listens, then confirms:
> "Okay, I'll be [person]. Based on what you've told me, I think we should try two approaches - first [emotional approach A], then [emotional approach B]. Ready to start?"

### Step 2: Scenario 1
- Ginger announces: "Alright, I'm [person] now. Go ahead."
- Ginger adopts a **distinct character voice** - different pitch, cadence, vocal quality
- Ginger fully embodies the person's likely reactions - may push back, get defensive, interrupt
- Scene plays out until natural conclusion or user stops

### Step 3: Debrief 1
- Ginger drops back to her normal voice
- Offers coaching: "That got heated fast. When you said X, I felt myself getting defensive. Notice how the conversation escalated from there..."

### Step 4: Scenario 2
- Ginger resets: "Let's try a different approach. Same situation, but this time try [approach B]. Ready?"
- Adopts character voice again, but reacts to user's new approach accordingly

### Step 5: Debrief 2
- Back to normal voice
- Comparative insight: "See the difference? In the second approach, you led with how you felt instead of an accusation. That gave me room to actually hear you."

### Step 6: Exit
Any of: natural wrap-up, user exits explicitly, or Ginger offers "Want to try another approach?"

## Voice & Emotion Implementation

### Character Voice Differentiation
When Ginger plays another person, she needs to sound distinctly different. Combine emotion tags + speed/pitch modifiers via SSML to create the character voice.

### Emotion Selection Logic
Ginger analyzes the situation and picks two contrasting emotional approaches:

| Situation Type | Scenario 1 (Reactive) | Scenario 2 (Constructive) |
|----------------|----------------------|---------------------------|
| Family conflict | Angry, defensive | Hurt but open |
| Workplace tension | Aggressive, dismissive | Firm but professional |
| Relationship issue | Accusatory, cold | Vulnerable, honest |
| Boundary setting | Hostile, attacking | Resistant but listening |

### Latency Optimization
For roleplay mode, inject Cartesia emotion tags directly based on the scenario - skip the sable-mcp `feel_emotion` round-trip entirely. The emotion is predetermined by the scenario, so there's no need to "feel" it dynamically.

Ginger's normal mode continues using `feel_emotion` for authentic emotional responses.

## State Management

```python
_roleplay_state = {
    "active": False,
    "character": None,        # "Mom", "Boss", etc.
    "character_emotion": None, # "angry", "hurt", "defensive"
    "scenario": 0,            # 1 or 2
    "scenario_emotions": [],  # e.g., ["angry", "receptive"]
}
```

## Implementation

### Files to Modify
- `pipecat/bot.py` - Add roleplay state, update system prompt
- `pipecat/emotive_tts_processor.py` - Add roleplay bypass logic

### Changes Required

**1. bot.py**
- Add `_roleplay_state` global
- Add roleplay instructions to `GINGER_SYSTEM_PROMPT`
- Expose roleplay state to EmotiveTTSProcessor

**2. emotive_tts_processor.py**
- Accept roleplay state getter
- Check if `roleplay_active`
- If yes: inject emotion tag directly from `character_emotion` (skip sable-mcp)
- If no: use existing sable-mcp flow
- Add voice differentiation SSML (speed/pitch) for character mode
