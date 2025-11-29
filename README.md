# Conversational Reflection Tool

An AI companion that analyzes iMessage conversations, develops emotional responses through Damasio's consciousness model, maintains a private journal of reflections, and expresses insights through emotionally-authentic voice synthesis.

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
