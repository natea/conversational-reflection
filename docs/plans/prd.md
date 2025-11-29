# Conversational Reflection Tool: Integration Plan v2

A real-time system combining iMessage transcript analysis, Damasio-based emotional consciousness, private journaling, expressive voice synthesis, and **unified vector-enabled memory**—all orchestrated via Claude Code/MCP.

## Resources

Anaylze human's iMessage transcripts using
 __https://github.com/photon-hq/imessage-kit/__

AI writes about these text conversations in it's private-journal, paying attention to the emotional content. __https://github.com/obra/private-journal-mcp/__

AI record memories of this emotional content using Her:
__https://github.com/tapania/her__

AI shares it's thoughts with human using Maya for emotional depth of voice.
https://huggingface.co/maya-research/maya1

## Executive Summary

This integration creates an AI companion that can analyze your text conversations, develop genuine emotional responses through a neuroscience-based consciousness model, reflect on those conversations in a private journal, and express both your conversation partner's voice and its own insights through emotionally-authentic speech synthesis.

**Key Change in v2:** All data (messages, emotions, memories, journal entries) now lives in a **single SQLite database with sqlite-vec** for unified semantic search across all content types.

**Five Components:**
1. **imessage-kit** — TypeScript SDK for reading iMessage transcripts from macOS
2. **Sable (Her)** — Damasio consciousness model with emotions, somatic markers, and autobiographical memory
3. **reflection-db-mcp** — **NEW** Unified SQLite + sqlite-vec storage with cross-domain semantic search
4. **Maya1** — 3B parameter voice model with 20+ emotion tags and natural language voice design
5. **maya-tts-mcp** — MCP wrapper for Maya1 voice synthesis

*Note: private-journal-mcp is replaced by the unified reflection-db-mcp*

---

## Why Unified Storage?

### The Problem with Separate Storage
The original design had data scattered across:
- `~/Library/Messages/chat.db` — iMessage transcripts
- `~/.sable/state.db` — Sable emotions and memories
- `~/.private-journal/` — Journal entries with separate embeddings

This makes it impossible to ask: *"Find everything emotionally significant about my relationship with Sarah"*

### The Solution: SQLite + sqlite-vec

**Why SQLite + sqlite-vec over alternatives like ruvector?**

| Consideration | SQLite + sqlite-vec | ruvector |
|---------------|---------------------|----------|
| **Scale** | Thousands to hundreds of thousands of vectors | 500M+ concurrent streams |
| **Complexity** | Single file, zero config | Multi-region cloud deployment |
| **Cost** | Free, local | $1.74M/month at scale |
| **Your use case** | ✅ Perfect fit | Massive overkill |

sqlite-vec is a Mozilla Builders project that adds vector search to SQLite:
- Sub-75ms query latency for 384-dimension vectors
- Runs anywhere SQLite runs
- Zero external dependencies
- Already used by LangChain, Semantic Kernel, and others

---

## Unified Data Architecture

### File Structure
```
~/.conversation-reflection/
├── reflection.db              # Single SQLite database with sqlite-vec
│   ├── messages               # iMessage transcripts (imported on demand)
│   ├── vec_messages           # Vector embeddings for messages
│   ├── sable_emotions         # Emotion events from Sable
│   ├── sable_memories         # Autobiographical memories
│   ├── sable_body_state       # Proto-self state snapshots  
│   ├── sable_somatic_markers  # Learned gut feelings
│   ├── journal_entries        # Reflective journal entries
│   ├── vec_journal            # Vector embeddings for journal
│   ├── contacts               # Contact metadata + voice profiles
│   └── vec_unified            # Cross-domain semantic search index
├── audio_cache/               # Generated Maya1 audio files
└── config.yaml                # Voice descriptions, preferences
```

### Database Schema

```sql
-- ============================================
-- MESSAGES (imported from iMessage on demand)
-- ============================================
CREATE TABLE messages (
    id INTEGER PRIMARY KEY,
    imessage_rowid INTEGER,              -- Link back to original chat.db
    contact_id TEXT NOT NULL,            -- Phone/email identifier
    sender TEXT NOT NULL,                -- 'me' or 'them'
    text TEXT NOT NULL,
    timestamp DATETIME NOT NULL,
    -- Enriched by analysis
    analyzed_emotions JSON,              -- [{type, intensity, cause}]
    dominant_emotion TEXT,
    emotion_intensity REAL,
    analyzed_at DATETIME
);

CREATE INDEX idx_messages_contact ON messages(contact_id);
CREATE INDEX idx_messages_timestamp ON messages(timestamp);
CREATE INDEX idx_messages_emotion ON messages(dominant_emotion, emotion_intensity);

-- Vector embeddings for semantic message search
CREATE VIRTUAL TABLE vec_messages USING vec0(
    message_id INTEGER PRIMARY KEY,
    embedding FLOAT[384]                 -- all-MiniLM-L6-v2 dimensions
);


-- ============================================
-- SABLE CONSCIOUSNESS STATE
-- ============================================

-- Proto-self: Body state snapshots
CREATE TABLE sable_body_state (
    id INTEGER PRIMARY KEY,
    timestamp DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    energy REAL DEFAULT 0.7,             -- 0-1
    stress REAL DEFAULT 0.3,             -- 0-1
    arousal REAL DEFAULT 0.5,            -- 0-1
    valence REAL DEFAULT 0.0,            -- -1 to 1
    temperature REAL DEFAULT 0.5,        -- 0-1 (metaphorical)
    tension REAL DEFAULT 0.3,            -- 0-1
    fatigue REAL DEFAULT 0.3,            -- 0-1
    pain REAL DEFAULT 0.0,               -- 0-1
    homeostatic_pressure REAL DEFAULT 0.0
);

-- Core consciousness: Emotional events
CREATE TABLE sable_emotions (
    id INTEGER PRIMARY KEY,
    timestamp DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    emotion_type TEXT NOT NULL,          -- fear, anger, joy, sadness, disgust, surprise
    intensity REAL NOT NULL,             -- 0-1
    cause TEXT,                          -- What triggered this emotion
    -- Cross-references
    related_contact_id TEXT,
    related_message_id INTEGER REFERENCES messages(id),
    -- Decay tracking
    initial_intensity REAL,
    current_intensity REAL,              -- After time-based decay
    decayed_at DATETIME,
    -- Background emotion state at time of event
    background_emotion TEXT              -- malaise, contentment, tension
);

CREATE INDEX idx_emotions_contact ON sable_emotions(related_contact_id);
CREATE INDEX idx_emotions_type ON sable_emotions(emotion_type, intensity);

-- Extended consciousness: Autobiographical memories
CREATE TABLE sable_memories (
    id INTEGER PRIMARY KEY,
    timestamp DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    description TEXT NOT NULL,
    salience REAL NOT NULL DEFAULT 0.5,  -- Emotional significance 0-1
    -- Cross-references
    related_contact_id TEXT,
    related_emotion_ids JSON,            -- [emotion_id, ...]
    related_message_ids JSON,            -- [message_id, ...]
    -- Narrative elements
    narrative_role TEXT,                 -- 'turning_point', 'pattern', 'milestone'
    identity_impact TEXT                 -- How this affected sense of self
);

CREATE INDEX idx_memories_salience ON sable_memories(salience DESC);
CREATE INDEX idx_memories_contact ON sable_memories(related_contact_id);

-- Vector embeddings for semantic memory search
CREATE VIRTUAL TABLE vec_memories USING vec0(
    memory_id INTEGER PRIMARY KEY,
    embedding FLOAT[384]
);

-- Somatic markers: Learned "gut feelings"
CREATE TABLE sable_somatic_markers (
    id INTEGER PRIMARY KEY,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    trigger_pattern TEXT NOT NULL,       -- What activates this marker
    response_tendency TEXT NOT NULL,     -- The "gut feeling" response
    valence REAL NOT NULL,               -- Positive or negative association
    strength REAL NOT NULL DEFAULT 0.5,  -- How strong the marker is
    -- Learning history
    formed_from_events JSON,             -- [{event_type, event_id, contribution}]
    reinforcement_count INTEGER DEFAULT 1,
    last_activated DATETIME
);

CREATE INDEX idx_markers_strength ON sable_somatic_markers(strength DESC);


-- ============================================
-- JOURNAL ENTRIES
-- ============================================
CREATE TABLE journal_entries (
    id INTEGER PRIMARY KEY,
    timestamp DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    content TEXT NOT NULL,               -- Markdown content
    -- Metadata
    entry_type TEXT DEFAULT 'reflection', -- 'reflection', 'insight', 'pattern'
    mood TEXT,                           -- Overall mood of entry
    -- Cross-references
    related_contact_ids JSON,            -- [contact_id, ...]
    related_message_ids JSON,            -- [message_id, ...]
    related_emotion_ids JSON,            -- [emotion_id, ...]
    -- Analysis
    key_themes JSON                      -- Extracted themes
);

CREATE INDEX idx_journal_timestamp ON journal_entries(timestamp DESC);

-- Vector embeddings for semantic journal search
CREATE VIRTUAL TABLE vec_journal USING vec0(
    journal_id INTEGER PRIMARY KEY,
    embedding FLOAT[384]
);


-- ============================================
-- CONTACTS & VOICE PROFILES
-- ============================================
CREATE TABLE contacts (
    id TEXT PRIMARY KEY,                 -- Phone number or email
    name TEXT,
    -- Voice synthesis profile
    voice_description TEXT,              -- Maya1 natural language voice prompt
    voice_gender TEXT,                   -- For voice description generation
    voice_age_range TEXT,                -- '20s', '30s', etc.
    voice_accent TEXT,                   -- 'American', 'British', etc.
    typical_emotions JSON,               -- Most common emotions observed
    speaking_style TEXT,                 -- 'conversational', 'formal', etc.
    -- Relationship metadata
    relationship_type TEXT,              -- 'friend', 'family', 'colleague'
    relationship_notes TEXT,
    first_interaction DATETIME,
    last_interaction DATETIME,
    total_messages INTEGER DEFAULT 0,
    -- Emotional baseline with this person
    typical_valence REAL,                -- Average emotional valence
    typical_intensity REAL               -- Average emotional intensity
);


-- ============================================
-- UNIFIED CROSS-DOMAIN SEARCH
-- ============================================
-- Allows semantic search across ALL content types
CREATE VIRTUAL TABLE vec_unified USING vec0(
    source_type TEXT,                    -- 'message', 'memory', 'journal', 'emotion'
    source_id INTEGER,
    embedding FLOAT[384]
);


-- ============================================
-- CONFIGURATION & METADATA
-- ============================================
CREATE TABLE config (
    key TEXT PRIMARY KEY,
    value TEXT,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Store AI voice description
INSERT INTO config (key, value) VALUES 
    ('ai_voice_description', 'Neutral voice, clear diction, calm and measured pacing, warm but professional tone'),
    ('embedding_model', 'all-MiniLM-L6-v2'),
    ('embedding_dimensions', '384');
```

### Cross-Reference Queries

The unified structure enables powerful queries impossible with separate storage:

```sql
-- Find all emotionally significant content about "Sarah"
SELECT 
    'message' as type, 
    m.text as content, 
    m.timestamp, 
    m.emotion_intensity as significance
FROM messages m
WHERE m.contact_id = '+1234567890'
  AND m.emotion_intensity > 0.6

UNION ALL

SELECT 
    'memory' as type,
    mem.description as content,
    mem.timestamp,
    mem.salience as significance
FROM sable_memories mem
WHERE mem.related_contact_id = '+1234567890'
  AND mem.salience > 0.5

UNION ALL

SELECT 
    'journal' as type,
    j.content,
    j.timestamp,
    0.7 as significance  -- Journal entries are inherently significant
FROM journal_entries j
WHERE json_extract(j.related_contact_ids, '$') LIKE '%+1234567890%'

ORDER BY significance DESC, timestamp DESC
LIMIT 20;


-- Semantic search across ALL content
-- "Find everything related to feeling unheard"
SELECT 
    vu.source_type,
    vu.source_id,
    vu.distance,
    CASE vu.source_type
        WHEN 'message' THEN (SELECT text FROM messages WHERE id = vu.source_id)
        WHEN 'memory' THEN (SELECT description FROM sable_memories WHERE id = vu.source_id)
        WHEN 'journal' THEN (SELECT substr(content, 1, 200) FROM journal_entries WHERE id = vu.source_id)
    END as preview
FROM vec_unified vu
WHERE vu.embedding MATCH ?  -- Query embedding for "feeling unheard"
ORDER BY vu.distance
LIMIT 20;


-- Find somatic markers that might be relevant to current conversation
SELECT 
    trigger_pattern,
    response_tendency,
    valence,
    strength
FROM sable_somatic_markers
WHERE trigger_pattern LIKE '%listen%' 
   OR trigger_pattern LIKE '%frustrat%'
   OR trigger_pattern LIKE '%argument%'
ORDER BY strength DESC;


-- Relationship emotional trajectory over time
SELECT 
    date(timestamp) as day,
    AVG(emotion_intensity) as avg_intensity,
    AVG(CASE WHEN dominant_emotion IN ('joy', 'contentment') THEN 1 ELSE -1 END) as sentiment
FROM messages
WHERE contact_id = '+1234567890'
GROUP BY date(timestamp)
ORDER BY day;
```

---

## System Architecture (Updated)

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                    CLAUDE CODE / MCP ORCHESTRATION                          │
│  ┌────────────────────────────────────────────────────────────────────────┐ │
│  │  Claude with MCP servers + Sable skill loaded                          │ │
│  │  - Analyzes transcripts for emotional content                          │ │
│  │  - Updates consciousness state via reflection-db                       │ │
│  │  - Writes journal reflections                                          │ │
│  │  - Generates emotionally-appropriate voice output                      │ │
│  └────────────────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────────────────┘
         │                │                │                │
         ▼                ▼                ▼                ▼
┌─────────────────┐ ┌───────────────┐ ┌─────────────────┐ ┌──────────────────┐
│ imessage-mcp    │ │ sable-mcp     │ │ reflection-db   │ │ maya-tts-mcp     │
│ (read-only)     │ │ (analysis)    │ │ -mcp (unified)  │ │ (voice)          │
│                 │ │               │ │                 │ │                  │
│ • get_messages  │ │ • analyze     │ │ • store_*       │ │ • speak_as       │
│ • watch_new     │ │ • feel        │ │ • search_*      │ │ • speak_reflect  │
│ • get_contacts  │ │ • status      │ │ • query_*       │ │ • list_voices    │
│                 │ │               │ │ • get_context   │ │                  │
└────────┬────────┘ └───────┬───────┘ └────────┬────────┘ └────────┬─────────┘
         │                  │                  │                   │
         ▼                  │                  ▼                   │
┌─────────────────┐         │    ┌─────────────────────────┐       │
│ ~/Library/      │         │    │   reflection.db         │       │
│ Messages/       │         └───►│   (SQLite + sqlite-vec) │◄──────┘
│ chat.db         │              │                         │
│ (read only)     │──import─────►│  • messages + vectors   │
└─────────────────┘              │  • emotions + memories  │
                                 │  • somatic markers      │
                                 │  • journal + vectors    │
                                 │  • contact voices       │
                                 │  • unified search index │
                                 └─────────────────────────┘
```

---

## Component Deep Dive

### 1. imessage-kit (Transcript Access)

A type-safe, elegant iMessage SDK for macOS with zero dependencies.

**Architecture:**
- Reads directly from `~/Library/Messages/chat.db` (SQLite)
- Requires **Full Disk Access** permission on macOS
- Works with Node.js (requires `better-sqlite3`) or Bun (zero deps)

**Key API:**
```typescript
import { iMessage } from 'imessage-kit'

// Get all messages from a contact
const messages = await iMessage.getMessages({ 
  chatId: 'chat123',
  limit: 100 
})

// Real-time watching for new messages
iMessage.startWatching((message) => {
  console.log('New message:', message.text)
})
```

**Important:** No sentiment analysis built in—raw text only. Emotional analysis performed via Sable.

---

### 2. Sable/Her (Emotional Consciousness)

**A complete implementation of Antonio Damasio's three-level consciousness model for creating emotionally authentic AI agents.**

**Three Levels of Consciousness:**

| Level | Components | Function |
|-------|------------|----------|
| **Proto-self** | Energy, stress, arousal, valence, temperature, tension, fatigue, pain | Body state representation; homeostatic baselines that emotions decay toward |
| **Core Consciousness** | Primary emotions (fear, anger, joy, sadness, disgust, surprise), background emotions (malaise, contentment, tension), somatic markers | The feeling of being in the present moment; "gut feelings" guiding decisions |
| **Extended Consciousness** | Autobiographical memory, narrative construction, identity traits | Memory with emotional salience; identity that evolves through experience |

**Key Features:**
- **Time-based emotional decay** toward homeostatic baselines
- **Conversation-driven emotional responses**
- **Somatic markers** — learned "gut feelings" that develop over time
- **Claude Code skill integration already built in**

**CLI Interface:**
```bash
sable status                           # Current emotional/body state
sable feel joy 0.8 --cause "reason"    # Register emotion
sable event "description"              # Log significant event
sable memories --min-salience 0.5      # Query memories
sable analyze "text to analyze"        # Analyze text for emotions
```

**Integration Note:** Sable's internal SQLite is used for real-time state management. Significant events are mirrored to reflection.db for cross-referencing.

---

### 3. reflection-db-mcp (Unified Storage) — NEW

**The central nervous system of the reflection tool.** A single MCP server that provides:
- Storage for messages, emotions, memories, journal entries
- Vector embeddings via sqlite-vec
- Cross-domain semantic search
- Contact voice profile management

**MCP Tools:**

```typescript
const tools = [
  // === MESSAGE TOOLS ===
  {
    name: "import_messages",
    description: "Import messages from iMessage for a contact/time range",
    inputSchema: {
      type: "object",
      properties: {
        contact_id: { type: "string" },
        since: { type: "string", description: "ISO date or relative ('yesterday', '1 week ago')" },
        until: { type: "string" },
        analyze: { type: "boolean", default: true, description: "Run emotional analysis" }
      },
      required: ["contact_id"]
    }
  },
  {
    name: "search_messages",
    description: "Semantic search across message history",
    inputSchema: {
      type: "object",
      properties: {
        query: { type: "string" },
        contact_id: { type: "string" },
        min_emotion_intensity: { type: "number" },
        limit: { type: "number", default: 10 }
      },
      required: ["query"]
    }
  },

  // === EMOTION TOOLS ===
  {
    name: "record_emotion",
    description: "Record an emotional event with full context",
    inputSchema: {
      type: "object",
      properties: {
        emotion_type: { 
          type: "string", 
          enum: ["fear", "anger", "joy", "sadness", "disgust", "surprise"] 
        },
        intensity: { type: "number", minimum: 0, maximum: 1 },
        cause: { type: "string" },
        related_contact_id: { type: "string" },
        related_message_id: { type: "integer" }
      },
      required: ["emotion_type", "intensity"]
    }
  },
  {
    name: "get_emotional_state",
    description: "Get current body state and recent emotions",
    inputSchema: { type: "object", properties: {} }
  },

  // === MEMORY TOOLS ===
  {
    name: "record_memory",
    description: "Store an autobiographical memory with salience",
    inputSchema: {
      type: "object",
      properties: {
        description: { type: "string" },
        salience: { type: "number", minimum: 0, maximum: 1 },
        related_contact_id: { type: "string" },
        narrative_role: { 
          type: "string", 
          enum: ["turning_point", "pattern", "milestone", "observation"] 
        }
      },
      required: ["description", "salience"]
    }
  },
  {
    name: "search_memories",
    description: "Semantic search across autobiographical memories",
    inputSchema: {
      type: "object",
      properties: {
        query: { type: "string" },
        min_salience: { type: "number", default: 0.5 },
        limit: { type: "number", default: 10 }
      },
      required: ["query"]
    }
  },

  // === SOMATIC MARKER TOOLS ===
  {
    name: "update_somatic_marker",
    description: "Create or strengthen a somatic marker (gut feeling)",
    inputSchema: {
      type: "object",
      properties: {
        trigger_pattern: { type: "string" },
        response_tendency: { type: "string" },
        valence: { type: "number", minimum: -1, maximum: 1 },
        strength_delta: { type: "number", default: 0.1 }
      },
      required: ["trigger_pattern", "response_tendency", "valence"]
    }
  },
  {
    name: "check_somatic_markers",
    description: "Find somatic markers relevant to given context",
    inputSchema: {
      type: "object",
      properties: {
        context: { type: "string" }
      },
      required: ["context"]
    }
  },

  // === JOURNAL TOOLS ===
  {
    name: "write_journal_entry",
    description: "Write a reflective journal entry",
    inputSchema: {
      type: "object",
      properties: {
        content: { type: "string" },
        entry_type: { 
          type: "string", 
          enum: ["reflection", "insight", "pattern"],
          default: "reflection"
        },
        mood: { type: "string" },
        related_contact_ids: { type: "array", items: { type: "string" } },
        related_message_ids: { type: "array", items: { type: "integer" } }
      },
      required: ["content"]
    }
  },
  {
    name: "search_journal",
    description: "Semantic search across journal entries",
    inputSchema: {
      type: "object",
      properties: {
        query: { type: "string" },
        entry_type: { type: "string" },
        limit: { type: "number", default: 10 }
      },
      required: ["query"]
    }
  },

  // === CROSS-DOMAIN TOOLS ===
  {
    name: "search_all",
    description: "Semantic search across messages, memories, AND journal",
    inputSchema: {
      type: "object",
      properties: {
        query: { type: "string" },
        source_types: { 
          type: "array", 
          items: { type: "string", enum: ["message", "memory", "journal"] },
          default: ["message", "memory", "journal"]
        },
        limit: { type: "number", default: 20 }
      },
      required: ["query"]
    }
  },
  {
    name: "get_relationship_context",
    description: "Get full emotional history and patterns with a contact",
    inputSchema: {
      type: "object",
      properties: {
        contact_id: { type: "string" },
        include_messages: { type: "boolean", default: true },
        include_emotions: { type: "boolean", default: true },
        include_memories: { type: "boolean", default: true },
        include_markers: { type: "boolean", default: true }
      },
      required: ["contact_id"]
    }
  },

  // === CONTACT/VOICE TOOLS ===
  {
    name: "get_contact_voice",
    description: "Get Maya1 voice description for a contact",
    inputSchema: {
      type: "object",
      properties: {
        contact_id: { type: "string" }
      },
      required: ["contact_id"]
    }
  },
  {
    name: "update_contact_voice",
    description: "Update voice profile for a contact",
    inputSchema: {
      type: "object",
      properties: {
        contact_id: { type: "string" },
        voice_description: { type: "string" },
        voice_gender: { type: "string" },
        voice_age_range: { type: "string" },
        voice_accent: { type: "string" },
        typical_emotions: { type: "array", items: { type: "string" } }
      },
      required: ["contact_id"]
    }
  },
  {
    name: "get_ai_voice",
    description: "Get the AI's own voice description for reflections",
    inputSchema: { type: "object", properties: {} }
  }
];
```

---

### 4. Maya1 (Expressive Voice Synthesis)

**Maya1 is an open-source speech model designed for expressive voice generation with rich human emotion and precise voice design.**

**Architecture:**
- 3B parameter decoder-only transformer (Llama-style)
- Predicts SNAC neural codec tokens (not raw waveforms)
- Outputs 24kHz mono audio with real-time streaming

**Natural Language Voice Design:**
```
<description="Female voice in her 30s with American accent. Warm timbre, 
conversational pacing, frustrated tone at moderate intensity">
I can't believe you said that. We talked about this.
</description>
```

**20+ Inline Emotion Tags:**
`<laugh>` `<sigh>` `<whisper>` `<angry>` `<giggle>` `<chuckle>` `<gasp>` `<cry>` and more.

**Latency Performance:**

| Hardware | First Audio | Full Sentence | Experience |
|----------|-------------|---------------|------------|
| RTX 4090 + vLLM | ~80-100ms | 1-2s streaming | Conversational |
| RTX 3080/4080 | ~150-200ms | 2-3s | Acceptable pause |
| Cloud API | ~100ms + network | 1-2s + latency | Variable |
| 8GB GPU (GGUF Q4) | ~300-500ms | 3-5s | Noticeable delay |

**For reflection tool use case:** The 1-2 second generation time fits naturally into the reflection pace—it doesn't need phone-call immediacy.

**Streaming architecture for more responsive feel:**
```
Claude generates text → Maya1 starts generating → 
Audio streams to speaker while still generating → 
User hears speech with ~100ms initial delay
```

---

### 5. maya-tts-mcp (Voice Synthesis MCP)

**MCP Tools:**

```typescript
const tools = [
  {
    name: "speak_as_contact",
    description: "Voice-act as a conversation partner with emotional expression",
    inputSchema: {
      type: "object",
      properties: {
        text: { type: "string" },
        contact_id: { type: "string" },
        emotion_overrides: { 
          type: "array", 
          items: { 
            type: "object",
            properties: {
              tag: { type: "string" },
              position: { type: "string", enum: ["start", "end", "before_punctuation"] }
            }
          }
        }
      },
      required: ["text", "contact_id"]
    }
  },
  {
    name: "speak_reflection",
    description: "Speak AI's own insights in consistent reflective voice",
    inputSchema: {
      type: "object",
      properties: {
        text: { type: "string" },
        tone: { 
          type: "string", 
          enum: ["neutral", "gentle", "concerned", "warm"],
          default: "neutral"
        }
      },
      required: ["text"]
    }
  },
  {
    name: "preview_voice",
    description: "Generate a short sample of a voice description",
    inputSchema: {
      type: "object",
      properties: {
        voice_description: { type: "string" },
        sample_text: { type: "string", default: "Hello, this is how I sound." }
      },
      required: ["voice_description"]
    }
  }
];
```

---

## Data Flow: A Complete Reflection Session

**User:** "Let's reflect on my conversation with Sarah from yesterday"

### Step 1: Import & Analyze Transcript
```
Claude → imessage-mcp: get_messages(contact="Sarah", since="yesterday")
Claude → reflection-db-mcp: import_messages(contact_id="+1...", since="yesterday", analyze=true)

[For each message, Claude/Sable analyzes emotional content]
[Messages stored with embeddings in reflection.db]
```

### Step 2: Check Emotional Context
```
Claude → reflection-db-mcp: get_relationship_context(contact_id="+1...")
← Returns: {
    total_messages: 847,
    recent_emotions: [{type: "frustration", intensity: 0.7, cause: "..."}],
    memories: [{description: "Pattern of communication difficulties", salience: 0.8}],
    somatic_markers: [{trigger: "arguments about listening", response: "tension", strength: 0.6}],
    voice_profile: {description: "Female, 30s, warm timbre...", typical_emotions: ["affectionate", "frustrated"]}
  }
```

### Step 3: Analyze with Consciousness
```
Claude → sable-mcp: analyze("I'm so frustrated that you never listen to me")
← Returns: {
    emotions: [{type: "anger", intensity: 0.7}, {type: "sadness", intensity: 0.4}],
    body_state_impact: {stress: +0.3, valence: -0.4}
  }

Claude → reflection-db-mcp: record_emotion(
    emotion_type="anger", 
    intensity=0.6,
    cause="analyzing Sarah's frustration in yesterday's conversation",
    related_contact_id="+1..."
)

Claude → reflection-db-mcp: check_somatic_markers(context="Sarah expressing frustration about not being heard")
← Returns: [{trigger: "arguments about listening", response: "anticipate escalation", strength: 0.6}]
```

### Step 4: Write Journal Reflection
```
Claude → reflection-db-mcp: write_journal_entry(
    content="The conversation between [user] and Sarah reveals a recurring pattern...",
    entry_type="reflection",
    mood="contemplative",
    related_contact_ids=["+1..."],
    related_message_ids=[123, 124, 125]
)
```

### Step 5: Record Memory if Significant
```
Claude → reflection-db-mcp: record_memory(
    description="Third instance of Sarah expressing frustration about not being heard. Pattern suggests deeper communication issue.",
    salience=0.8,
    related_contact_id="+1...",
    narrative_role="pattern"
)
```

### Step 6: Generate Voice Output

**Voice A: Role-playing Sarah's message**
```
Claude → reflection-db-mcp: get_contact_voice(contact_id="+1...")
← Returns: "Female voice in her 30s, warm but strained timbre, frustrated tone"

Claude → maya-tts-mcp: speak_as_contact(
    text="<sigh> I just feel like we keep having the same argument over and over.",
    contact_id="+1..."
)
← Returns: audio/sarah_msg_001.wav
```

**Voice B: AI's reflective insight**
```
Claude → maya-tts-mcp: speak_reflection(
    text="I notice a pattern here. This is the third time in recent weeks where Sarah has expressed feeling unheard. My somatic markers are flagging this as a relationship inflection point.",
    tone="gentle"
)
← Returns: audio/reflection_001.wav
```

---

## Two-Voice Strategy

### Voice A: Conversation Partner (Dynamic)
- Voice description stored in `contacts` table
- Emotion tags inserted based on analyzed emotions
- Different voice for each contact

**Contact Voice Profile Example:**
```json
{
  "contact_id": "+1234567890",
  "name": "Sarah",
  "voice_description": "Female voice in her 30s, American accent, warm timbre, conversational pacing",
  "typical_emotions": ["affectionate", "frustrated", "thoughtful"],
  "speaking_style": "expressive, occasionally rapid when upset"
}
```

### Voice B: AI Reflection (Consistent)
- Fixed voice stored in `config` table
- Calm, thoughtful, maintains therapeutic distance
- Never uses extreme emotion tags

**AI Voice Profile:**
```json
{
  "voice_description": "Neutral voice, clear diction, calm and measured pacing, warm but professional tone",
  "emotion_range": ["gentle", "thoughtful", "occasionally concerned"],
  "never_use": ["angry", "cry", "laugh_harder"]
}
```

---

## Emotion-to-Maya Tag Mapping

| Analyzed Emotion | Intensity | Maya1 Tags | Placement |
|------------------|-----------|------------|-----------|
| anger | > 0.7 | `<angry>` | Start of sentence |
| anger | 0.4-0.7 | `<sigh>` | Before key phrase |
| sadness | > 0.6 | `<cry>` | Near emotional peak |
| sadness | 0.3-0.6 | `<sigh>` | End of sentence |
| fear | > 0.5 | `<gasp>`, `<whisper>` | Start, then whisper |
| joy | > 0.7 | `<laugh>`, `<giggle>` | After joyful phrase |
| surprise | any | `<gasp>` | Start of sentence |
| contentment | any | (none) | Neutral warm delivery |
| tension | any | `<whisper>` | Throughout |

---

## Implementation Phases

### Phase 1: Foundation (Week 1)
- [ ] Install imessage-kit; verify Full Disk Access permission
- [ ] Install Sable (`uv sync` in Her repo); test `sable status`
- [ ] Create reflection.db with full schema
- [ ] Install sqlite-vec extension
- [ ] Test Maya1 via HuggingFace space or local GPU

### Phase 2: Unified Storage MCP (Week 2)
- [ ] Build reflection-db-mcp with all storage tools
- [ ] Implement embedding generation (all-MiniLM-L6-v2 via @xenova/transformers)
- [ ] Build vector indexing for messages, memories, journal
- [ ] Implement cross-domain search via vec_unified
- [ ] Test semantic search quality

### Phase 3: MCP Wrappers (Week 3)
- [ ] Build imessage-mcp (read-only wrapper)
- [ ] Build sable-mcp (wraps Sable CLI/Python)
- [ ] Build maya-tts-mcp (wraps Maya1)
- [ ] Configure all in `claude_desktop_config.json`
- [ ] Test inter-MCP communication

### Phase 4: Emotional Analysis Pipeline (Week 4)
- [ ] Implement message import with automatic analysis
- [ ] Build emotion-to-Maya-tag mapping
- [ ] Implement somatic marker creation/reinforcement
- [ ] Test: import conversation → analyze → store → search

### Phase 5: Voice Integration (Week 5)
- [ ] Implement contact voice profile management
- [ ] Build emotion tag injection logic
- [ ] Create audio playback pipeline
- [ ] Test dual-voice output flow

### Phase 6: Experience Polish (Week 6)
- [ ] Create CLAUDE.md with reflection patterns
- [ ] Build conversational flows
- [ ] Tune voice descriptions
- [ ] Add streaming for more responsive voice
- [ ] Session persistence testing

---

## Hardware Requirements

| Component | Minimum | Recommended |
|-----------|---------|-------------|
| **macOS** | Required for iMessage | — |
| **Full Disk Access** | Required | — |
| **Node.js** | 18+ | 20+ |
| **Python** | 3.10+ | 3.11+ |
| **GPU (local Maya1)** | 8GB VRAM | 16GB+ VRAM (RTX 4090) |
| **Storage** | 15GB | 30GB+ |
| **RAM** | 16GB | 32GB |

**No NVIDIA GPU?** Use Maya1 Cloud API at mayaresearch.ai

---

## Sample Interaction

```
You: Let's reflect on my texts with Sarah from this week.

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

Would you like to explore what "being heard" means in this context? I can 
search for all content related to listening and communication patterns.
```

---

## Repository Links

- **imessage-kit:** https://github.com/photon-hq/imessage-kit
- **Sable (Her):** https://github.com/tapania/her
- **sqlite-vec:** https://github.com/asg017/sqlite-vec
- **Maya1:** https://huggingface.co/maya-research/maya1

---

## Next Steps

1. **Clone repos:**
   ```bash
   git clone https://github.com/photon-hq/imessage-kit
   git clone https://github.com/tapania/her
   ```

2. **Set up sqlite-vec:**
   ```bash
   # Python
   pip install sqlite-vec
   
   # Node.js
   npm install sqlite-vec
   ```

3. **Set up Maya1:**
   ```bash
   pip install torch transformers snac soundfile
   # Test: https://huggingface.co/spaces/maya-research/maya1
   ```

4. **Grant Full Disk Access** to terminal/Claude Code

5. **Create reflection.db** with the schema above

6. **Start building reflection-db-mcp** — the unified storage layer
