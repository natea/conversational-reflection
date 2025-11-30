# Role-Play Emotional Coaching PRD

## Overview
Transform the conversational reflection tool into an emotional role-play coaching system that helps users prepare for difficult conversations by analyzing their iMessage history, role-playing as the difficult person, and coaching them through multiple communication approaches.

## Target Use Case
**Patrick's Story:** Patrick has a conflict with his mother who threatened not to attend his wedding. He's hurt but will see her at Thanksgiving/Christmas. He needs emotional prep for setting boundaries and handling that conversation.

## Core Features

### Feature 1: Conflict Pattern Analysis
**Purpose:** Analyze iMessage history to identify conflict patterns, communication styles, and recurring issues.

**New Tools:**
- `analyze_conflict_pattern` - Extract conflict themes, escalation points, triggers
- `get_relationship_summary` - Get overall relationship health metrics

**Data Extracted:**
- Conflict themes (control, guilt, boundaries, money, etc.)
- Communication style of the other person (guilt-tripping, dismissive, volatile, etc.)
- Escalation triggers (specific topics, phrases, times)
- Historical pattern (frequency, severity, resolution rate)

---

### Feature 2: Role-Play Session Management
**Purpose:** Enable the bot to "become" the difficult person for practice conversations.

**New Tools:**
- `start_roleplay` - Begin a role-play session with persona configuration
- `end_roleplay` - End session and provide summary
- `switch_persona_style` - Change how the difficult person behaves mid-session

**Persona Styles:**
- `guilt-tripping` - "After everything I've done for you..."
- `dismissive` - "You're overreacting, it's not a big deal"
- `volatile` - Unpredictable anger, raised voices
- `passive-aggressive` - Silent treatment, backhanded comments
- `controlling` - "You should do X because I said so"
- `victim` - "You're always attacking me"

**Communication Approaches (for coaching):**
- `boundary-setting` - Clear, firm, repeatable limits
- `de-escalation` - Calm the situation, validate feelings
- `assertive` - Direct "I" statements, clear needs
- `grey-rock` - Minimal emotional engagement
- `empathetic` - Lead with understanding

---

### Feature 3: Response Coaching
**Purpose:** Provide real-time feedback and alternatives during role-play.

**New Tools:**
- `coach_response` - Analyze user's response and provide feedback
- `generate_alternatives` - Suggest 3 different ways to respond
- `rate_response` - Score response on assertiveness, boundary clarity, emotional regulation

**Coaching Dimensions:**
- Boundary clarity (1-10)
- Emotional regulation (1-10)
- Assertiveness (1-10)
- De-escalation effectiveness (1-10)
- Self-advocacy (1-10)

---

### Feature 4: Boundary Script Generator
**Purpose:** Generate structured scripts for specific boundary-setting scenarios.

**New Tools:**
- `generate_boundary_script` - Create a boundary statement using proven frameworks
- `create_exit_strategy` - Generate graceful conversation exit lines

**Boundary Frameworks:**
- DEAR MAN (DBT): Describe, Express, Assert, Reinforce, Mindful, Appear confident, Negotiate
- I-Statement: "I feel X when Y happens. I need Z."
- Broken Record: Repeat the boundary calmly without JADE (Justify, Argue, Defend, Explain)

---

### Feature 5: Voice Synthesis for Contacts
**Purpose:** Make role-play more realistic by generating speech as the contact.

**New Tools:**
- `create_contact_voice_profile` - Generate voice description from message analysis
- `speak_as_contact` - TTS as the contact with emotional expression
- `speak_as_coach` - TTS as the supportive coach voice

---

### Feature 6: Session Recording & Video Generation
**Purpose:** Record sessions and generate shareable video content.

**New Tools:**
- `start_recording` - Begin recording session audio/transcript
- `stop_recording` - End recording
- `extract_highlights` - Find breakthrough moments, key insights
- `generate_video` - Create shareable video in various formats

**Video Formats:**
- TikTok/Reels (9:16, 60s max)
- YouTube Short (9:16, 60s max)
- Full session (16:9, any length)
- Highlight reel (best moments compiled)

---

## System Prompt Enhancement

The bot needs a new mode: **Role-Play Coach Mode**

When activated, the bot:
1. Analyzes the contact's communication patterns
2. Offers different practice scenarios
3. Becomes the difficult person during role-play
4. Provides coaching feedback after each exchange
5. Offers alternative responses
6. Summarizes learnings at the end

---

## Implementation Tasks

### Task 1: Add Conflict Analysis Tools
- [ ] Add `analyze_conflict_pattern` FunctionSchema
- [ ] Add `get_relationship_summary` FunctionSchema
- [ ] Add to MCP_TOOL_INFO

### Task 2: Add Role-Play Session Tools
- [ ] Add `start_roleplay` FunctionSchema
- [ ] Add `end_roleplay` FunctionSchema
- [ ] Add `switch_persona_style` FunctionSchema
- [ ] Add session state management

### Task 3: Add Coaching Tools
- [ ] Add `coach_response` FunctionSchema
- [ ] Add `generate_alternatives` FunctionSchema
- [ ] Add `rate_response` FunctionSchema

### Task 4: Add Boundary Script Tools
- [ ] Add `generate_boundary_script` FunctionSchema
- [ ] Add `create_exit_strategy` FunctionSchema

### Task 5: Add Voice Profile Tools
- [ ] Add `create_contact_voice_profile` FunctionSchema
- [ ] Add `speak_as_contact` FunctionSchema
- [ ] Add `speak_as_coach` FunctionSchema

### Task 6: Add Recording/Video Tools
- [ ] Add `start_recording` FunctionSchema
- [ ] Add `stop_recording` FunctionSchema
- [ ] Add `extract_highlights` FunctionSchema
- [ ] Add `generate_video` FunctionSchema

### Task 7: Update System Prompt
- [ ] Add Role-Play Coach Mode instructions
- [ ] Add persona style descriptions
- [ ] Add coaching framework guidelines
- [ ] Add session flow instructions

### Task 8: Implement Tool Handlers
- [ ] Create roleplay session state management
- [ ] Create mock handlers for new tools
- [ ] Add logging for all new tools

---

## Example Flow

```
User: "I need help preparing to see my mom at Christmas. She threatened to skip my wedding."

Bot: [Uses analyze_conflict_pattern + get_messages]
"I've analyzed your recent conversations with Mom. I see a pattern of:
- Communication style: Guilt-tripping with victim positioning
- Key triggers: Wedding planning decisions, your independence
- Escalation pattern: Threats when she feels excluded

Would you like to practice the conversation? I can play your mom in different styles:
1. 🎭 Guilt-tripping mode - 'After everything I've done...'
2. 😢 Victim mode - 'You never think about my feelings'
3. 😤 Volatile mode - Sudden anger shifts

Which approach do you want to practice handling?"

User: "Let's try guilt-tripping mode. I want to practice boundary setting."

Bot: [Uses start_roleplay]
"Starting role-play. I'll be Mom using guilt-tripping. You practice boundary-setting.

---
*As Mom, sighing heavily*
'I just don't understand why you're doing this to me. The wedding is supposed to be about family, and you're making decisions without even asking me. After everything I sacrificed to raise you...'"

User: "Mom, I understand you have feelings about this, but the wedding decisions are mine and Sarah's to make."

Bot: [Uses coach_response + generate_alternatives]
"📊 Response Rating:
- Boundary clarity: 7/10 ✓
- Emotional regulation: 9/10 ✓
- Assertiveness: 6/10 - could be stronger

💡 Alternative responses:
1. (More assertive): 'Mom, I hear you're upset. And, the wedding decisions belong to Sarah and me. I'm not available to debate this.'

2. (Broken record): 'I understand. The decisions are ours to make.' [Repeat as needed]

3. (Exit strategy): 'I can see this is hard. Let's take a break and talk later when we're both calmer.'

Want to try again with one of these approaches, or continue the conversation?"
```

---

## Success Metrics
- User completes at least one full role-play session
- User rates coaching as helpful (thumbs up)
- User generates at least one shareable clip
- User reports feeling more prepared for the real conversation
