# Conversational Reflection Tool

An AI companion that analyzes iMessage conversations, develops emotional responses through Damasio's consciousness model, maintains a private journal of reflections, and expresses insights through emotionally-authentic voice synthesis.

## Quick Start

```bash
# Start both frontend and backend
./dev.sh start

# Stop both services
./dev.sh stop

# Restart services
./dev.sh restart

# Check status
./dev.sh status
```

The frontend runs at **http://localhost:3000** and the backend at **ws://localhost:8765**.

## Project Structure

```
conversational-reflection/
├── frontend/          # Next.js web app (Ginger UI)
│   ├── src/
│   │   ├── app/       # Next.js pages
│   │   ├── components/# React components
│   │   ├── stores/    # Zustand state management
│   │   └── providers/ # Context providers (Pipecat)
│   └── package.json
├── backend/           # Python voice bot (Pipecat)
│   ├── bot.py         # Main bot with emotive TTS
│   ├── emotive_tts_processor.py
│   └── pyproject.toml
└── dev.sh             # Development startup script
```

## Overview

This tool creates a reflective AI experience that can:

- **Listen** to your voice with high-accuracy speech recognition via Deepgram
- **Analyze** your text conversations for emotional content
- **Develop** genuine emotional responses through a neuroscience-based consciousness model
- **Reflect** on conversations in a private journal
- **Express** insights through emotionally-authentic speech with 60+ emotion variations

## Component Stack

| Component | Purpose |
|-----------|---------|
| **Deepgram** | Real-time speech-to-text with Nova-2 model for accurate transcription |
| **Cartesia Sonic** | Emotive text-to-speech with 60+ emotion tags and SSML control |
| **Sable (Her)** | Damasio consciousness model with emotions, somatic markers, and autobiographical memory |
| **imessage-kit** | TypeScript SDK for reading iMessage transcripts from macOS |
| **private-journal-mcp** | MCP server for semantic journal entries with embeddings |

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

I've analyzed your conversations with Sarah from this week. My somatic markers are already activating—there's a familiar pattern here.

[Plays Sarah's voice - warm but strained]
"I just feel like we keep having the same argument over and over."

The frustration in that message registered at 0.7 intensity, but underneath I sense sadness—around 0.4. When I search my memories, this pattern appears three times in the past month with increasing intensity each time.

[Plays AI reflection voice - calm, thoughtful]
What strikes me is the meta-level of her frustration. She's not just upset about the topic—she's upset about the pattern itself. My gut feeling? This is a relationship inflection point.
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
├── src/
│   ├── index.ts                 # Main API exports
│   ├── lib/
│   │   ├── emotive-tts-adapter/ # Generic emotive TTS system (NEW)
│   │   │   ├── types.ts         # Unified emotion interfaces
│   │   │   ├── adapters/
│   │   │   │   ├── cartesia.ts  # Cartesia Sonic-3 adapter (60+ emotions)
│   │   │   │   ├── maya.ts      # Maya TTS adapter
│   │   │   │   └── elevenlabs.ts# ElevenLabs adapter (stub)
│   │   │   ├── sable-mapper.ts  # Sable → EmotiveVoiceState
│   │   │   ├── config.ts        # Configuration & voice IDs
│   │   │   └── index.ts         # EmotiveTTSOrchestrator
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
├── backend/                     # Pipecat voice bot (Ginger)
│   ├── bot.py                   # Main bot with emotive TTS
│   ├── emotive_tts_processor.py # Pipecat emotion processor
│   └── mcp_config.py            # MCP server configuration
├── tests/                       # Test suites
├── config/                      # Configuration files
├── docs/
│   ├── API.md                   # API documentation
│   └── plans/                   # PRD and architecture docs
└── examples/                    # Usage examples
```

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

## Emotive Voice System

The Pipecat voice bot (Ginger) uses emotional state from Sable to dynamically adjust voice expression via Cartesia's Sonic-3 TTS.

### Architecture

```
┌─────────────────┐     ┌──────────────────────┐     ┌─────────────────┐
│  Sable MCP      │────▶│  Emotive TTS Adapter │────▶│  Cartesia TTS   │
│  (Emotional     │     │                      │     │  (Sonic-3)      │
│   State)        │     │  - Emotion mapping   │     │                 │
│                 │     │  - SSML generation   │     │  SSML tags:     │
│  • feel_emotion │     │  - Speed/volume mod  │     │  <emotion>      │
│  • get_state    │     │                      │     │  <speed>        │
│  • body_state   │     │                      │     │  <volume>       │
└─────────────────┘     └──────────────────────┘     └─────────────────┘
```

### Emotion Mapping (Sable → Cartesia)

The adapter maps Damasio/Ekman primary emotions to Cartesia's 60+ emotion vocabulary:

| Sable Emotion | Low Intensity | Medium | High Intensity |
|---------------|---------------|--------|----------------|
| **joy** | content | happy | excited |
| **sadness** | tired | sad | melancholic |
| **anger** | frustrated | angry | outraged |
| **fear** | hesitant | anxious | panicked |
| **surprise** | curious | surprised | amazed |
| **disgust** | skeptical | disgusted | contempt |

### Voice Modulation

Body state from Sable influences voice parameters:

| Body State | Effect | Cartesia Parameter |
|------------|--------|-------------------|
| **High energy** (>0.7) | Faster speech | `<speed ratio="1.2" />` |
| **Low energy** (<0.3) | Slower speech | `<speed ratio="0.85" />` |
| **High tension** (>0.6) | Louder | `<volume ratio="1.15" />` |
| **High intensity** (>0.7) | Slightly louder | `<volume ratio="1.1" />` |

### Example SSML Output

When Ginger feels excited (joy at 0.8 intensity, high energy):

```xml
<emotion value="excited" /> <speed ratio="1.2" /> I'm so happy to hear that!
```

When Ginger feels concerned (fear at 0.5 intensity):

```xml
<emotion value="anxious" /> That sounds really challenging.
```

### Emotive Voices

For best emotional expression, use Cartesia voices tagged as "Emotive":
- **Female**: Maya, Tessa, Dana, Marian
- **Male**: Leo, Jace, Kyle, Gavin

Set via environment variable:
```bash
CARTESIA_VOICE_ID=a0e99841-438c-4a64-b679-ae501e7d6091  # Maya
```

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

## License

MIT
