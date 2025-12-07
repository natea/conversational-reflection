# Conversational Reflection - System Architecture

## Project Overview

**Conversational Reflection** (also known as "Ginger") is an emotionally-aware AI companion that analyzes iMessage conversations, develops genuine emotional responses through Antonio Damasio's consciousness model, maintains a private journal of reflections, and expresses insights through emotionally-authentic voice synthesis.

The system enables users to:
- Have natural voice conversations with an emotionally intelligent AI
- Practice difficult conversations through roleplay scenarios
- Analyze emotional patterns in their text conversations
- Receive coaching for interpersonal communication

---

## High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                              USER INTERFACE LAYER                                │
│  ┌────────────────────────────────────────────────────────────────────────────┐ │
│  │  ginger_rp (Next.js 14 Frontend)                                           │ │
│  │  - React 18 with App Router                                                │ │
│  │  - Pipecat WebRTC Client                                                   │ │
│  │  - Zustand State Management                                                │ │
│  │  - Tailwind CSS                                                            │ │
│  └────────────────────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────────────────────┘
                                        │
                                        ▼ WebRTC
┌─────────────────────────────────────────────────────────────────────────────────┐
│                           VOICE PIPELINE LAYER (Pipecat)                         │
│  ┌────────────────────────────────────────────────────────────────────────────┐ │
│  │  bot.py - Ginger Voice Bot                                                 │ │
│  │  ┌─────────┐   ┌─────────┐   ┌─────────┐   ┌───────────┐   ┌─────────┐   │ │
│  │  │Deepgram │──▶│ Context │──▶│ OpenAI  │──▶│ Emotive   │──▶│Cartesia │   │ │
│  │  │  STT    │   │ Aggr.   │   │ GPT-4o  │   │ Processor │   │   TTS   │   │ │
│  │  └─────────┘   └─────────┘   └─────────┘   └───────────┘   └─────────┘   │ │
│  │      ▲                            │              │                         │ │
│  │      │                            ▼              │                         │ │
│  │  SileroVAD               MCP Tool Calls        Emotion                     │ │
│  │  + SmartTurn                    │              State                       │ │
│  │  Analyzer                       │              Injection                   │ │
│  └─────────────────────────────────┼───────────────────────────────────────────┘ │
└────────────────────────────────────┼────────────────────────────────────────────┘
                                     │
                                     ▼ stdio
┌─────────────────────────────────────────────────────────────────────────────────┐
│                         MCP SERVER LAYER (Node.js)                               │
│  ┌─────────────────┐  ┌───────────────┐  ┌───────────────────┐                  │
│  │ sable-mcp       │  │ imessage-mcp  │  │ private-journal   │                  │
│  │ (Emotional AI)  │  │ (macOS)       │  │ -mcp (Memory)     │                  │
│  │                 │  │               │  │                   │                  │
│  │ • feel_emotion  │  │ • get_messages│  │ • process_thoughts│                  │
│  │ • analyze_emot. │  │ • list_chats  │  │ • search_journal  │                  │
│  │ • get_state     │  │ • watch_msgs  │  │ • read_entry      │                  │
│  │ • create_marker │  │               │  │ • list_recent     │                  │
│  │ • query_memory  │  │               │  │                   │                  │
│  └────────┬────────┘  └───────┬───────┘  └─────────┬─────────┘                  │
│           │                   │                    │                            │
└───────────┼───────────────────┼────────────────────┼────────────────────────────┘
            │                   │                    │
            ▼                   ▼                    ▼
┌───────────────────┐  ┌─────────────────┐  ┌─────────────────────┐
│ Damasio Model     │  │ macOS Chat.db   │  │ SQLite + Embeddings │
│ (In-Memory)       │  │ (Full Disk Acc) │  │ (Semantic Search)   │
└───────────────────┘  └─────────────────┘  └─────────────────────┘
```

---

## External Service Dependencies

### 1. OpenAI (Language Model)
- **Purpose**: Core reasoning, conversation, and function calling
- **Model**: GPT-4o
- **API**: OpenAI REST API
- **Usage**:
  - Natural language understanding and generation
  - MCP tool invocation for emotions, memory, messages
  - Roleplay character generation
  - Emotional analysis guidance

### 2. Deepgram (Speech-to-Text)
- **Purpose**: Real-time voice transcription
- **Model**: Nova-2
- **Features**:
  - Low-latency streaming transcription
  - Word-level timestamps
  - Speaker diarization support
- **Integration**: Pipecat `DeepgramSTTService`

### 3. Cartesia (Text-to-Speech)
- **Purpose**: Emotionally expressive voice synthesis
- **Model**: Sonic-3
- **Features**:
  - 60+ emotion tags via SSML
  - Real-time streaming audio
  - Voice speed/volume control
  - Multiple voice personalities
- **Emotion Tags Supported**:
  - `<emotion value="excited" />`
  - `<speed ratio="1.2" />`
  - `<volume ratio="1.1" />`
- **Integration**: Pipecat `CartesiaTTSService`

### 4. Pipecat Framework
- **Purpose**: Voice AI pipeline orchestration
- **Version**: Latest with MCP support
- **Components Used**:
  - `PipelineRunner` - Main execution loop
  - `DeepgramSTTService` - Speech recognition
  - `CartesiaTTSService` - Voice synthesis
  - `OpenAILLMService` - Language model
  - `MCPClient` - Tool server connections
  - `SileroVADAnalyzer` - Voice activity detection
  - `LocalSmartTurnAnalyzerV3` - Turn-taking logic
  - `LLMContextAggregator` - Conversation context
  - `RTVIProcessor` - Real-time voice interface

---

## MCP Server Architecture

### sable-mcp (Emotional AI)
**Location**: `src/mcp-servers/sable-mcp/index.ts`

Implements Antonio Damasio's three-level consciousness model:

| Level | Components | Function |
|-------|------------|----------|
| **Proto-self** | Body state (heart rate, temperature, tension, energy, breathing) | Physiological simulation |
| **Core Consciousness** | Primary emotions (Ekman's 6), somatic markers | Present-moment feelings |
| **Extended Consciousness** | Autobiographical memory with salience | Long-term emotional memory |

**Tools**:
| Tool | Description |
|------|-------------|
| `analyze_emotion` | Detect emotions in text using keyword analysis |
| `feel_emotion` | Register an emotion with intensity (updates body state) |
| `get_emotional_state` | Get current emotional + body state |
| `record_memory` | Store autobiographical memory with salience |
| `query_memories` | Search memories by salience threshold |
| `create_somatic_marker` | Create gut-feeling association |
| `check_somatic_markers` | Find relevant gut feelings for context |

**Emotion Mapping** (Ekman's Basic):
- joy, sadness, anger, fear, disgust, surprise

### imessage-mcp (Message Access)
**Location**: `src/mcp-servers/imessage-mcp/index.ts`

Provides read access to macOS iMessage database.

**Requirements**:
- macOS with Full Disk Access permission
- `@photon-ai/imessage-kit` SDK

**Tools**:
| Tool | Description |
|------|-------------|
| `get_messages` | Retrieve messages with filters (contact, date, limit) |
| `list_chats` | List conversations (direct, group, all) |
| `watch_messages` | Real-time message monitoring |

### private-journal-mcp (Semantic Memory)
**Location**: `src/mcp-servers/private-journal-mcp/`

Provides semantic journal storage with embeddings for long-term memory.

**Tools**:
| Tool | Description |
|------|-------------|
| `process_thoughts` | Write to private journal sections |
| `search_journal` | Semantic search across entries |
| `read_journal_entry` | Read specific entry by path |
| `list_recent_entries` | Get chronological recent entries |

**Journal Sections**:
- `feelings` - Emotional processing
- `project_notes` - Technical insights
- `technical_insights` - Broader learnings
- `user_context` - User collaboration notes
- `world_knowledge` - General knowledge

---

## Voice Pipeline Components

### EmotiveTTSProcessor
**Location**: `pipecat/emotive_tts_processor.py`

Custom Pipecat processor that intercepts text before TTS and applies emotional SSML tags.

**Features**:
1. **Normal Mode**: Queries sable-mcp for emotional state
2. **Roleplay Mode**: Direct emotion injection (bypasses sable-mcp for low latency)

**Emotion Mapping** (Sable → Cartesia):

| Sable Emotion | Low Intensity | Medium | High Intensity |
|---------------|---------------|--------|----------------|
| joy | content | happy | excited |
| sadness | tired | sad | melancholic |
| anger | frustrated | angry | outraged |
| fear | hesitant | anxious | panicked |
| surprise | curious | surprised | amazed |

**Voice Modulation**:

| Body State | Effect | SSML Output |
|------------|--------|-------------|
| High energy (>0.7) | Faster speech | `<speed ratio="1.2" />` |
| Low energy (<0.3) | Slower speech | `<speed ratio="0.85" />` |
| High tension (>0.6) | Louder | `<volume ratio="1.15" />` |

### Roleplay System
**Location**: `pipecat/bot.py` (lines 102-240, 535-590)

Enables users to practice difficult conversations by having Ginger roleplay as the other person.

**Function Tools Registered**:
- `start_roleplay(character, first_emotion, second_emotion)` - Begin session
- `set_roleplay_emotion(emotion)` - Change character emotion
- `end_roleplay()` - End session and return to normal voice

**Roleplay Emotions** (mapped to Cartesia):
```
angry → anger:high
defensive → anger
receptive → positivity
hurt → sadness
dismissive → anger:low
```

---

## Frontend Architecture (ginger_rp)

### Technology Stack
- **Framework**: Next.js 14 (App Router)
- **State**: Zustand
- **Styling**: Tailwind CSS
- **Voice**: Pipecat WebRTC Client
- **Icons**: Lucide React

### Key Pages

| Route | Purpose |
|-------|---------|
| `/reflect` | Default - Main conversation interface |
| `/roleplay` | Roleplay practice setup and experience |
| `/contacts/[id]` | View specific contact conversations |
| `/patterns` | Emotional pattern analysis |
| `/somatic` | Somatic marker visualization |
| `/settings` | Configuration |

### Components
**Location**: `ginger_rp/src/components/`

- `roleplay/RoleplayCustomization` - Partner and skill selection
- `roleplay/RoleplayExperience` - Active roleplay conversation
- `roleplay/RoleplaySummary` - Post-session insights

### State Management
**Location**: `ginger_rp/src/stores/`

- `useRoleplayStore` - Roleplay session state
- `useGingerStore` - Global artifacts and preferences

---

## Data Flow

### 1. Voice Input Flow
```
User speaks → WebRTC → Deepgram STT → Text
                                        │
                                        ▼
                         LLMContextAggregator (adds history)
                                        │
                                        ▼
                         OpenAI GPT-4o (generates response + tool calls)
                                        │
                                        ▼
                         MCP Tool Execution (sable, imessage, journal)
                                        │
                                        ▼
                         EmotiveTTSProcessor (adds emotion SSML)
                                        │
                                        ▼
                         Cartesia TTS → WebRTC → User hears response
```

### 2. Emotional State Flow
```
LLM calls feel_emotion("joy", 0.7, "user shared good news")
                    │
                    ▼
         sable-mcp updates internal state
         - emotions: [{type: "joy", intensity: 0.7}]
         - body_state: {heart_rate: 85, energy: 0.8, ...}
         - background_feelings: ["energized", "warm"]
                    │
                    ▼
         bot.py captures state via callback
                    │
                    ▼
         EmotiveTTSProcessor reads state
                    │
                    ▼
         Generates SSML: <emotion value="excited" /> <speed ratio="1.2" />
                    │
                    ▼
         Cartesia TTS speaks with emotion
```

### 3. Roleplay Flow
```
User: "I need to practice talking to my mom about boundaries"
                    │
                    ▼
LLM recognizes roleplay request
                    │
                    ▼
LLM calls start_roleplay("Mom", "defensive", "receptive")
                    │
                    ▼
Roleplay state updated: active=true, character="Mom", emotion="defensive"
                    │
                    ▼
EmotiveTTSProcessor detects roleplay mode
                    │
                    ▼
Bypasses sable-mcp, uses roleplay emotion directly
                    │
                    ▼
Generates SSML: <emotion name="anger" /> (for "defensive")
                    │
                    ▼
[After scenario 1, LLM calls set_roleplay_emotion("receptive")]
                    │
                    ▼
Voice switches to <emotion name="positivity" />
```

---

## Configuration

### Environment Variables

| Variable | Service | Description |
|----------|---------|-------------|
| `OPENAI_API_KEY` | OpenAI | GPT-4o API access |
| `DEEPGRAM_API_KEY` | Deepgram | Nova-2 STT access |
| `CARTESIA_API_KEY` | Cartesia | Sonic-3 TTS access |
| `CARTESIA_VOICE_ID` | Cartesia | Voice personality ID |

### MCP Server Configuration
**Location**: `pipecat/mcp_config.py`

```python
MCP_SERVERS = {
    "sable": StdioServerParameters(
        command="node",
        args=["PROJECT_ROOT/src/mcp-servers/sable-mcp/dist/index.js"],
    ),
    "imessage": StdioServerParameters(
        command="node",
        args=["PROJECT_ROOT/src/mcp-servers/imessage-mcp/dist/index.js"],
    ),
    "journal": StdioServerParameters(
        command="node",
        args=["PROJECT_ROOT/src/mcp-servers/private-journal-mcp/dist/index.js"],
    ),
}
```

---

## Dependencies

### Python (pipecat/)
```toml
dependencies = [
    "pipecat-ai[webrtc,daily,silero,deepgram,openai,cartesia,local-smart-turn-v3,runner,mcp]",
    "pipecat-ai-cli"
]
```

### Node.js (root package.json)
```json
{
  "dependencies": {
    "@cartesia/cartesia-js": "^2.2.9",
    "zod": "^3.23.0"
  },
  "optionalDependencies": {
    "@modelcontextprotocol/sdk": "^1.0.0",
    "@photon-ai/imessage-kit": "^0.1.0",
    "better-sqlite3": "^11.10.0"
  }
}
```

### Frontend (ginger_rp/)
```json
{
  "dependencies": {
    "@pipecat-ai/client-js": "^1.5.0",
    "@pipecat-ai/client-react": "^1.1.0",
    "@pipecat-ai/small-webrtc-transport": "^1.8.0",
    "@pipecat-ai/voice-ui-kit": "^0.5.0",
    "next": "14.2.0",
    "react": "^18.2.0",
    "zustand": "^4.5.0"
  }
}
```

---

## System Requirements

| Component | Minimum | Recommended |
|-----------|---------|-------------|
| **macOS** | Required (for iMessage) | — |
| **Full Disk Access** | Required | — |
| **Node.js** | 18+ | 20+ |
| **Python** | 3.10+ | 3.13+ |
| **RAM** | 16GB | 32GB |

---

## File Structure

```
conversational-reflection/
├── pipecat/                      # Voice bot backend (Python)
│   ├── bot.py                    # Main Ginger bot with MCP integration
│   ├── emotive_tts_processor.py  # Emotion → SSML processor
│   ├── mcp_config.py             # MCP server configuration
│   └── pyproject.toml            # Python dependencies
│
├── ginger_rp/                    # Frontend (Next.js)
│   ├── src/
│   │   ├── app/                  # Next.js App Router pages
│   │   │   ├── page.tsx          # Redirects to /reflect
│   │   │   ├── reflect/          # Main conversation
│   │   │   ├── roleplay/         # Roleplay practice
│   │   │   ├── contacts/         # Contact conversations
│   │   │   ├── patterns/         # Emotional patterns
│   │   │   └── somatic/          # Somatic markers
│   │   ├── components/           # React components
│   │   ├── stores/               # Zustand state stores
│   │   └── hooks/                # Custom React hooks
│   └── package.json
│
├── src/
│   ├── mcp-servers/              # MCP servers (TypeScript)
│   │   ├── sable-mcp/            # Emotional AI (Damasio model)
│   │   ├── imessage-mcp/         # iMessage access
│   │   ├── private-journal-mcp/  # Semantic journal
│   │   └── maya-tts-mcp/         # Maya TTS (optional)
│   ├── lib/                      # Shared TypeScript libraries
│   │   ├── emotive-tts-adapter/  # TTS emotion adapters
│   │   ├── sable-client.ts       # Sable client
│   │   ├── imessage-client.ts    # iMessage client
│   │   └── emotion-mapper.ts     # Emotion mapping utilities
│   └── index.ts                  # Main API exports
│
├── docs/                         # Documentation
│   └── ARCHITECTURE.md           # This file
│
└── package.json                  # Root Node.js dependencies
```

---

## Running the System

### 1. Start the Voice Bot
```bash
cd pipecat
uv run bot.py --transport webrtc
```

### 2. Start the Frontend
```bash
cd ginger_rp
npm run dev
```

### 3. Connect
Open browser to `http://localhost:3000`

---

## Security Considerations

1. **Full Disk Access**: Required for iMessage access - grants read access to user's messages
2. **API Keys**: Store in `.env` files, never commit to version control
3. **Local Processing**: Emotional state and journal entries stored locally
4. **WebRTC**: Audio streams encrypted in transit
