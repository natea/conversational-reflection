# Conversational Reflection Tool

An AI companion that analyzes iMessage conversations, helps you practice difficult emotional conversations through role-play coaching, and creates shareable viral videos of your breakthrough moments.

## 🎬 Create Viral Videos of Emotional Breakthroughs

Ever wish you could practice that tough conversation with your mom, ex, or boss before having it for real? This tool:

1. **Analyzes your iMessage history** to understand conflict patterns
2. **Role-plays as your difficult person** with authentic voice synthesis
3. **Coaches you** on boundary-setting and de-escalation
4. **Records breakthrough moments** and generates TikTok/Reels-ready clips

> *"My AI mom guilt-tripped me for 10 minutes and I finally learned to say no"* - the video that goes viral

---

## 🚀 Quick Start (5 minutes)

```bash
# Clone and run the setup script
git clone https://github.com/bsneider/conversational-reflection.git
cd conversational-reflection
./quickstart.sh
```

The script will:
- ✅ Check prerequisites (Node.js 18+, Python 3.10+)
- ✅ Install dependencies
- ✅ Set up the Pipecat voice bot
- ✅ Guide you through API key configuration

### API Keys Needed

| Service | Purpose | Get Key |
|---------|---------|---------|
| Deepgram | Speech-to-Text | [console.deepgram.com](https://console.deepgram.com/) |
| OpenAI or Anthropic | LLM | [platform.openai.com](https://platform.openai.com/api-keys) |
| Cartesia | Text-to-Speech | [play.cartesia.ai](https://play.cartesia.ai/) |

---

## 🎭 How to Record a Viral Video

### Step 1: Start the Bot

```bash
cd pipecat
uv run bot.py
```

Open: **http://localhost:7860**

### Step 2: Analyze Your Difficult Relationship

Say to the bot:
> "Analyze my texts with Mom from the last month"

The bot will identify:
- Conflict patterns (guilt-tripping, dismissiveness, control)
- Trigger topics (money, time, boundaries)
- Communication style of the difficult person

### Step 3: Start Role-Playing

Say:
> "Let's practice the wedding planning conversation with Mom"

The bot becomes your mom - complete with guilt trips, sighs, and emotional manipulation based on your actual message history.

### Step 4: Practice Your Responses

The bot coaches you on:
- **Boundary-setting**: "I need you to respect my decision"
- **De-escalation**: Staying calm under pressure
- **Self-advocacy**: Expressing needs without guilt

### Step 5: Record the Breakthrough

When you're ready for a good take:

> "Start recording"

Practice the conversation. When you nail it:

> "Stop recording"

### Step 6: Generate Your Video

> "Generate a TikTok video with emotional style"

Options:
- **Format**: `tiktok`, `reels`, `shorts`, `square`
- **Style**: `emotional`, `documentary`, `energetic`, `therapeutic`

Video saved to: `/tmp/roleplay_videos/`

---

## 📱 Example Viral Video Flow

```
You: I want to practice telling my mom I'm not coming to Thanksgiving

Bot: [Analyzes your iMessage history with Mom]
     Found pattern: guilt-tripping (78% of conflicts)
     Key triggers: holidays, family obligations, money
     
     Starting role-play as Mom...

Mom (AI): "So you're telling me you're not coming to Thanksgiving? 
          After everything I've done for you? Your grandmother will 
          be devastated. But I guess that doesn't matter to you anymore."

You: "Mom, I understand you're disappointed, but I need to spend 
     the holiday with my partner's family this year."

[Bot coaches: "Good boundary! Try acknowledging her feelings 
 without taking responsibility for them."]

Mom (AI): *sigh* "I just don't understand what I did wrong. 
          I guess I'll just tell everyone you're too busy for us."

You: "I love you, and this isn't about you doing anything wrong. 
     I'm making a decision for my own family."

[Bot: "BREAKTHROUGH! That's excellent self-advocacy. 
      Starting recording..."]
```

---

## Overview

This tool creates a reflective AI experience that can:

- **Analyze** your text conversations for emotional content
- **Develop** genuine emotional responses through a neuroscience-based consciousness model
- **Reflect** on conversations in a private journal
- **Express** both your conversation partner's voice and its own insights through emotionally-authentic speech

## Component Stack

| Component | Purpose |
|-----------|---------|
| **imessage-kit** | TypeScript SDK for reading iMessage transcripts from macOS |
| **Sable (Her)** | Damasio consciousness model with emotions, somatic markers, and autobiographical memory |
| **private-journal-mcp** | MCP server for semantic journal entries with embeddings |
| **Maya1** | 3B parameter voice model with 20+ emotion tags and natural language voice design |

## Architecture

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                      CLAUDE CODE / MCP ORCHESTRATION                        │
│  ┌────────────────────────────────────────────────────────────────────────┐ │
│  │  Claude with MCP servers + Sable skill loaded                          │ │
│  │  - Reads iMessage transcripts via imessage-kit                         │ │
│  │  - Analyzes emotional content via Sable                                │ │
│  │  - Writes reflections to private-journal-mcp                           │ │
│  │  - Generates voice output via Maya1                                    │ │
│  └────────────────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────────────────┘
         │                │                │                │
         ▼                ▼                ▼                ▼
┌─────────────────┐ ┌───────────────┐ ┌─────────────────┐ ┌──────────────────┐
│ imessage-mcp    │ │ sable-mcp     │ │ private-journal │ │ maya-tts-mcp     │
│ (TypeScript)    │ │ (TypeScript)  │ │ -mcp (Node.js)  │ │ (Python/TS)      │
│                 │ │               │ │                 │ │                  │
│ • get_messages  │ │ • analyze     │ │ • process_      │ │ • speak_as       │
│ • list_chats    │ │ • feel        │ │   thoughts      │ │ • speak_reflect  │
│ • watch_messages│ │ • status      │ │ • search_       │ │ • preview_voice  │
│                 │ │ • memories    │ │   journal       │ │                  │
└─────────────────┘ └───────────────┘ └─────────────────┘ └──────────────────┘
```

## Installation

### Prerequisites

- **macOS** (required for iMessage access)
- **Full Disk Access** permission for your terminal
- **Node.js** 18+
- **Python** 3.10+ (for Maya TTS)

### Setup

```bash
# Clone the repository
git clone https://github.com/natea/conversational-reflection.git
cd conversational-reflection

# Install dependencies
npm install

# Build the project
npm run build
```

### Grant Full Disk Access

1. Open **System Settings** → **Privacy & Security** → **Full Disk Access**
2. Add your terminal application (Terminal, iTerm, VS Code, etc.)

### Configure MCP Servers

Add the MCP servers to your Claude configuration:

```bash
# Private Journal
claude mcp add private-journal -- npx github:natea/private-journal-mcp

# iMessage (from this project)
claude mcp add imessage -- node ./dist/mcp-servers/imessage-mcp/index.js

# Sable emotional consciousness
claude mcp add sable -- node ./dist/mcp-servers/sable-mcp/index.js

# Maya TTS (requires Python environment)
claude mcp add maya-tts -- python ./src/mcp-servers/maya-tts-mcp/server.py
```

Or add to your Claude MCP config JSON directly:

```json
{
  "mcpServers": {
    "private-journal": {
      "command": "npx",
      "args": ["github:natea/private-journal-mcp"],
      "type": "stdio",
      "description": "Semantic journal entries for reflections"
    }
  }
}
```

## Usage

### Basic Reflection Session

```
You: Let's reflect on my texts with Sarah from yesterday.

Claude: [Imports transcripts via imessage-mcp]
        [Stores with analysis in reflection.db]
        [Checks somatic markers and relationship context]
        [Writes journal reflection]

I've analyzed your conversations with Sarah from this week. My somatic markers
are already activating—there's a familiar pattern here.

[Plays Sarah's voice - warm but strained]
"I just feel like we keep having the same argument over and over."

The frustration in that message registered at 0.7 intensity, but underneath
I sense sadness—around 0.4. When I search my memories, this pattern appears
three times in the past month with increasing intensity each time.

[Plays AI reflection voice - calm, thoughtful]
What strikes me is the meta-level of her frustration. She's not just upset about
the topic—she's upset about the pattern itself. My gut feeling? This is a
relationship inflection point.
```

### API Usage

```typescript
import { createAPI } from 'conversational-reflection'

const api = createAPI()

// Get recent messages
const messages = await api.getMessages({ limit: 10 })

// Analyze emotions in text
const emotions = api.analyzeEmotions("I'm so frustrated!")

// Process text with emotion tags for Maya TTS
const tagged = api.processTextWithEmotions("This is amazing!", emotions)

// Manage voice profiles
api.setVoiceProfile('+1234567890', {
  name: 'Sarah',
  voiceDescription: 'Female voice in her 30s, warm timbre, American accent',
  typicalEmotions: ['affectionate', 'frustrated', 'thoughtful']
})
```

## Core Libraries

### Emotion Mapper (`src/lib/emotion-mapper.ts`)

Maps detected emotions to Maya TTS emotion tags:

| Emotion | Intensity | Maya Tags | Placement |
|---------|-----------|-----------|-----------|
| anger | > 0.7 | `<angry>` | Start of sentence |
| anger | 0.4-0.7 | `<sigh>` | Before key phrase |
| sadness | > 0.6 | `<cry>` | Near emotional peak |
| joy | > 0.7 | `<laugh>` | After joyful phrase |
| fear | > 0.5 | `<gasp>`, `<whisper>` | Start, then whisper |
| surprise | any | `<gasp>` | Start of sentence |

### Voice Profiles (`src/lib/voice-profiles.ts`)

Manages contact-specific voice configurations:

```typescript
interface ContactVoiceProfile {
  contactId: string
  name: string
  voiceDescription: string      // Maya1 natural language prompt
  voiceGender?: string
  voiceAgeRange?: string        // '20s', '30s', etc.
  voiceAccent?: string          // 'American', 'British', etc.
  typicalEmotions?: string[]
  speakingStyle?: string
}
```

### Sable Client (`src/lib/sable-client.ts`)

Interface to Damasio's three-level consciousness model:

| Level | Components | Function |
|-------|------------|----------|
| **Proto-self** | Energy, stress, arousal, valence | Body state representation |
| **Core Consciousness** | Primary emotions, somatic markers | Present-moment feelings |
| **Extended Consciousness** | Autobiographical memory, identity | Memory with emotional salience |

## Development

```bash
# Run tests
npm test

# Run specific test suites
npm run test:imessage
npm run test:sable
npm run test:maya

# Type checking
npm run typecheck

# Development mode
npm run dev
```

## Project Structure

```
conversational-reflection/
├── quickstart.sh                # 🚀 One-command setup script
├── src/
│   ├── index.ts                 # Main API exports
│   ├── lib/
│   │   ├── emotion-mapper.ts    # Emotion to Maya tag mapping
│   │   ├── voice-profiles.ts    # Contact voice management
│   │   ├── imessage-client.ts   # iMessage MCP client
│   │   ├── sable-client.ts      # Sable consciousness client
│   │   ├── maya-client.ts       # Maya TTS client
│   │   ├── conversation-analyzer.ts
│   │   ├── analysis-pipeline.ts
│   │   └── reflection-orchestrator.ts
│   ├── mcp-servers/
│   │   ├── imessage-mcp/        # iMessage MCP server
│   │   ├── sable-mcp/           # Sable MCP server
│   │   ├── maya-tts-mcp/        # Maya TTS MCP server
│   │   └── private-journal-mcp/ # Private journal MCP server
│   └── types/
├── pipecat/                     # 🎭 Voice Bot & Role-Play Engine
│   ├── bot.py                   # Main voice bot (31 tools, role-play)
│   ├── conflict_analysis.py     # iMessage conflict pattern detection
│   ├── voice_synthesis.py       # Voice profile & TTS integration
│   ├── video_generator.py       # Viral video creation
│   └── mcp_client.py            # MCP server communication
├── tests/                       # Test suites
├── config/                      # Configuration files
├── docs/
│   ├── API.md                   # API documentation
│   └── plans/                   # PRD and architecture docs
└── examples/                    # Usage examples
```

## 🎯 Role-Play Coaching Tools

The Pipecat voice bot includes 31 tools across 9 categories:

| Category | Tools | Purpose |
|----------|-------|---------|
| **Conflict Analysis** | `analyze_conflict_pattern`, `get_relationship_summary` | Understand your difficult relationships |
| **iMessage** | `get_contacts`, `get_messages`, `get_conversations` | Read your message history |
| **Role-Play** | `start_roleplay`, `end_roleplay`, `switch_persona_style` | Control the practice session |
| **Coaching** | `coach_response`, `rate_response`, `generate_alternatives` | Get real-time feedback |
| **Boundaries** | `generate_boundary_script`, `create_exit_strategy` | Pre-written scripts for tough moments |
| **Voice** | `speak_as_contact`, `speak_as_coach`, `set_voice_profile` | Dynamic voice synthesis |
| **Recording** | `start_recording`, `stop_recording`, `extract_highlights` | Capture breakthrough moments |
| **Video** | `generate_video` | Create TikTok/Reels/Shorts clips |
| **Journal** | `reflect`, `journal_entry`, `search_memories` | Private reflection storage |

### Persona Styles

The bot can role-play different difficult personality types:

- **Guilt-Tripping**: "After everything I've done for you..."
- **Dismissive**: "You're overreacting as usual"
- **Volatile**: Unpredictable emotional outbursts
- **Passive-Aggressive**: Subtle hostility with fake pleasantness
- **Controlling**: "Let me tell you what you should do"
- **Victim**: "I guess I'll just suffer in silence"

## Hardware Requirements

| Component | Minimum | Recommended |
|-----------|---------|-------------|
| **macOS** | Required | — |
| **Full Disk Access** | Required | — |
| **Node.js** | 18+ | 20+ |
| **Python** | 3.10+ | 3.11+ |
| **GPU (local Maya1)** | 8GB VRAM | 16GB+ VRAM |
| **RAM** | 16GB | 32GB |

**No GPU?** Maya1 can be used via cloud API.

## Two-Voice Strategy

The system uses two distinct voices:

### Voice A: Conversation Partner (Dynamic)
- Voice description customized per contact
- Emotion tags inserted based on analyzed emotions
- Expressive, natural delivery

### Voice B: AI Reflection (Consistent)
- Fixed calm, thoughtful voice
- Maintains therapeutic distance
- Never uses extreme emotion tags

## Resources

- [imessage-kit](https://github.com/photon-hq/imessage-kit) - iMessage SDK
- [Sable (Her)](https://github.com/tapania/her) - Damasio consciousness model
- [private-journal-mcp](https://github.com/obra/private-journal-mcp) - Private journaling
- [Maya1](https://huggingface.co/maya-research/maya1) - Expressive voice synthesis
- [Pipecat](https://github.com/pipecat-ai/pipecat) - Real-time voice AI framework

## Branch: pierre/fixes

This branch adds the **Role-Play Coaching & Viral Video** feature:

- 🎭 AI role-plays as your difficult person based on iMessage analysis
- 🎯 Real-time coaching on boundaries, de-escalation, self-advocacy  
- 🎬 Video generation for TikTok, Reels, YouTube Shorts
- 🗣️ Dynamic voice synthesis with emotion tags
- 📊 Conflict pattern detection and relationship health assessment

## License

MIT
