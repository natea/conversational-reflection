# Conversational Reflection Tool: Implementation Plan

## Executive Summary

This plan implements an AI companion that analyzes iMessage conversations, develops emotional responses through Damasio's consciousness model, maintains a private journal of reflections, and expresses insights through emotionally-authentic voice synthesis.

## Component Stack

| Component | Repository | Purpose |
|-----------|------------|---------|
| **imessage-kit** | [github.com/photon-hq/imessage-kit](https://github.com/photon-hq/imessage-kit) | TypeScript library for reading iMessage transcripts |
| **private-journal-mcp** | [github.com/obra/private-journal-mcp](https://github.com/natea/private-journal-mcp) | MCP server for semantic journal entries |
| **Sable (Her)** | [github.com/tapania/her](https://github.com/tapania/her) | Damasio consciousness model |
| **Maya1** | [huggingface.co/maya-research/maya1](https://huggingface.co/maya-research/maya1) | 3B parameter expressive voice model |

---

## System Architecture

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
│ imessage-kit    │ │ sable         │ │ private-journal │ │ maya-tts-mcp     │
│ (TypeScript)    │ │ (Python)      │ │ -mcp (Node.js)  │ │ (Python)         │
│                 │ │               │ │                 │ │                  │
│ • getMessages   │ │ • analyze     │ │ • process_      │ │ • speak_as       │
│ • listChats     │ │ • feel        │ │   thoughts      │ │ • speak_reflect  │
│ • startWatching │ │ • status      │ │ • search_       │ │ • preview_voice  │
│ • send          │ │ • memories    │ │   journal       │ │                  │
└────────┬────────┘ └───────┬───────┘ └────────┬────────┘ └────────┬─────────┘
         │                  │                  │                   │
         ▼                  ▼                  ▼                   ▼
┌─────────────────┐ ┌───────────────┐ ┌─────────────────┐ ┌──────────────────┐
│ ~/Library/      │ │ ~/.sable/     │ │ ~/.private-     │ │ Maya1 Model      │
│ Messages/       │ │ state.db      │ │ journal/        │ │ (Local/API)      │
│ chat.db         │ │               │ │                 │ │                  │
│ (read only)     │ │ emotions,     │ │ entries/*.md    │ │ 24kHz audio      │
└─────────────────┘ │ memories,     │ │ *.embedding     │ │ output           │
                    │ markers       │ └─────────────────┘ └──────────────────┘
                    └───────────────┘
```

---

## Data Flow: Complete Reflection Session

### Trigger: User asks to reflect on a conversation

```
User: "Let's reflect on my texts with Sarah from yesterday"
```

### Step 1: Fetch iMessage Transcripts
```typescript
// imessage-kit
const sdk = new IMessageSDK({ debug: true })
const messages = await sdk.getMessages({
  sender: '+1234567890',  // Sarah's number
  since: new Date('2025-01-27'),
  limit: 100
})
```

### Step 2: Analyze Emotional Content (Sable)
```bash
# For each significant message
sable analyze "I'm so frustrated that you never listen to me"
# Returns: {emotions: [{type: "anger", intensity: 0.7}, {type: "sadness", intensity: 0.4}]}

# Update Sable's emotional state
sable feel anger 0.6 --cause "analyzing Sarah's frustration"

# Check for relevant gut feelings
sable markers --context "feeling unheard"
```

### Step 3: Write Journal Reflection
```typescript
// private-journal-mcp: process_thoughts tool
{
  "feelings": "Analyzing the conversation with Sarah triggered a sense of concern...",
  "user_context": "Sarah and the user have a recurring pattern around feeling heard...",
  "technical_insights": "The frustration intensity (0.7) combined with underlying sadness (0.4) suggests..."
}
```

### Step 4: Record Significant Memories
```bash
# If conversation is emotionally significant
sable event "Third instance of Sarah expressing frustration about not being heard. Pattern emerging."
```

### Step 5: Generate Voice Output
```python
# Maya1 for Sarah's voice (role-play)
voice_description = "Female voice in her 30s, American accent, warm but strained timbre, frustrated tone"
text = "<sigh> I just feel like we keep having the same argument over and over."

# Maya1 for AI reflection voice
ai_voice = "Neutral voice, clear diction, calm and measured pacing, warm but professional tone"
reflection = "I notice a pattern here. This is the third time recently where Sarah has expressed feeling unheard."
```

---

## Implementation Phases

### Phase 1: Foundation Setup

**Goal:** Install and verify all core dependencies work independently.

#### 1.1 imessage-kit Setup
```bash
# Install
npm install @photon-ai/imessage-kit better-sqlite3

# Grant Full Disk Access
# System Settings → Privacy & Security → Full Disk Access → Add Terminal/IDE
```

**Verification test:**
```typescript
import { IMessageSDK } from '@photon-ai/imessage-kit'

const sdk = new IMessageSDK({ debug: true })
const chats = await sdk.listChats({ limit: 5 })
console.log('Found chats:', chats.length)
await sdk.close()
```

#### 1.2 private-journal-mcp Setup
```bash
# Add to Claude MCP config
claude mcp add-json private-journal '{"type":"stdio","command":"npx","args":["github:obra/private-journal-mcp"]}' -s user
```

**Verification:** In Claude, test `process_thoughts` tool.

#### 1.3 Sable (Her) Setup
```bash
# Clone and install
git clone https://github.com/tapania/her
cd her
uv sync  # or pip install -e .

# Verify
sable status
sable feel joy 0.5 --cause "testing installation"
sable status
```

#### 1.4 Maya1 Setup
```bash
# Install dependencies
pip install torch transformers snac soundfile

# Test via HuggingFace Space first
# https://huggingface.co/spaces/maya-research/maya1

# Local test (requires 16GB+ VRAM)
python -c "
from transformers import AutoModelForCausalLM
model = AutoModelForCausalLM.from_pretrained('maya-research/maya1')
print('Maya1 loaded successfully')
"
```

**Deliverables:**
- [ ] imessage-kit reads messages successfully
- [ ] private-journal-mcp creates entries
- [ ] Sable tracks emotional state
- [ ] Maya1 generates audio

---

### Phase 2: MCP Integration Layer

**Goal:** Create MCP wrappers for components that don't have them.

#### 2.1 imessage-mcp (New MCP Server)

Create a thin MCP wrapper around imessage-kit:

```typescript
// src/mcp-servers/imessage-mcp/index.ts
const tools = [
  {
    name: "get_messages",
    description: "Get iMessage messages with filters",
    inputSchema: {
      type: "object",
      properties: {
        contact: { type: "string", description: "Phone number or email" },
        since: { type: "string", description: "ISO date or relative ('yesterday')" },
        limit: { type: "number", default: 50 },
        unread_only: { type: "boolean", default: false }
      }
    }
  },
  {
    name: "list_chats",
    description: "List available iMessage conversations",
    inputSchema: {
      type: "object",
      properties: {
        type: { type: "string", enum: ["direct", "group", "all"], default: "all" },
        has_unread: { type: "boolean" },
        search: { type: "string" },
        limit: { type: "number", default: 20 }
      }
    }
  },
  {
    name: "watch_messages",
    description: "Start watching for new messages",
    inputSchema: {
      type: "object",
      properties: {
        poll_interval: { type: "number", default: 3000 },
        contacts: { type: "array", items: { type: "string" } }
      }
    }
  }
]
```

#### 2.2 sable-mcp (New MCP Server)

Wrap Sable's Python CLI as MCP:

```typescript
// src/mcp-servers/sable-mcp/index.ts
const tools = [
  {
    name: "analyze_emotion",
    description: "Analyze text for emotional content using Damasio model",
    inputSchema: {
      type: "object",
      properties: {
        text: { type: "string" }
      },
      required: ["text"]
    }
  },
  {
    name: "feel_emotion",
    description: "Register an emotional event",
    inputSchema: {
      type: "object",
      properties: {
        emotion: {
          type: "string",
          enum: ["fear", "anger", "joy", "sadness", "disgust", "surprise"]
        },
        intensity: { type: "number", minimum: 0, maximum: 1 },
        cause: { type: "string" }
      },
      required: ["emotion", "intensity"]
    }
  },
  {
    name: "get_emotional_state",
    description: "Get current body state, emotions, and background feelings",
    inputSchema: { type: "object", properties: {} }
  },
  {
    name: "record_memory",
    description: "Store an autobiographical memory with salience",
    inputSchema: {
      type: "object",
      properties: {
        description: { type: "string" },
        salience: { type: "number", minimum: 0, maximum: 1 }
      },
      required: ["description", "salience"]
    }
  },
  {
    name: "query_memories",
    description: "Search autobiographical memories",
    inputSchema: {
      type: "object",
      properties: {
        min_salience: { type: "number", default: 0.5 },
        limit: { type: "number", default: 10 }
      }
    }
  },
  {
    name: "check_somatic_markers",
    description: "Find relevant gut feelings for context",
    inputSchema: {
      type: "object",
      properties: {
        context: { type: "string" }
      },
      required: ["context"]
    }
  }
]
```

#### 2.3 maya-tts-mcp (New MCP Server)

```typescript
// src/mcp-servers/maya-tts-mcp/index.ts
const tools = [
  {
    name: "speak_as_contact",
    description: "Generate speech as a contact with their voice profile",
    inputSchema: {
      type: "object",
      properties: {
        text: { type: "string" },
        voice_description: { type: "string" },
        emotion_tags: {
          type: "array",
          items: { type: "string" },
          description: "Maya emotion tags: laugh, sigh, whisper, angry, etc."
        }
      },
      required: ["text", "voice_description"]
    }
  },
  {
    name: "speak_reflection",
    description: "Generate AI reflection speech in calm, neutral voice",
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
    description: "Generate a sample of a voice description",
    inputSchema: {
      type: "object",
      properties: {
        voice_description: { type: "string" },
        sample_text: { type: "string", default: "Hello, this is how I sound." }
      },
      required: ["voice_description"]
    }
  }
]
```

**Deliverables:**
- [ ] imessage-mcp functional
- [ ] sable-mcp functional
- [ ] maya-tts-mcp functional
- [ ] All registered in Claude MCP config

---

### Phase 3: Emotional Analysis Pipeline

**Goal:** Connect message analysis to emotional processing.

#### 3.1 Emotion-to-Maya Tag Mapping

```typescript
// src/lib/emotion-mapper.ts
interface EmotionAnalysis {
  type: 'fear' | 'anger' | 'joy' | 'sadness' | 'disgust' | 'surprise'
  intensity: number
}

interface MayaTag {
  tag: string
  position: 'start' | 'end' | 'before_punctuation'
}

function mapEmotionToMayaTags(emotions: EmotionAnalysis[]): MayaTag[] {
  const tags: MayaTag[] = []

  for (const e of emotions) {
    switch (e.type) {
      case 'anger':
        if (e.intensity > 0.7) tags.push({ tag: '<angry>', position: 'start' })
        else if (e.intensity > 0.4) tags.push({ tag: '<sigh>', position: 'before_punctuation' })
        break
      case 'sadness':
        if (e.intensity > 0.6) tags.push({ tag: '<cry>', position: 'end' })
        else tags.push({ tag: '<sigh>', position: 'end' })
        break
      case 'joy':
        if (e.intensity > 0.7) tags.push({ tag: '<laugh>', position: 'end' })
        else tags.push({ tag: '<giggle>', position: 'end' })
        break
      case 'fear':
        tags.push({ tag: '<gasp>', position: 'start' })
        if (e.intensity > 0.5) tags.push({ tag: '<whisper>', position: 'start' })
        break
      case 'surprise':
        tags.push({ tag: '<gasp>', position: 'start' })
        break
    }
  }

  return tags
}
```

#### 3.2 Contact Voice Profile Management

```typescript
// src/lib/voice-profiles.ts
interface VoiceProfile {
  contact_id: string
  name: string
  voice_description: string
  typical_emotions: string[]
  speaking_style: string
}

// Store in private-journal or local config
const profiles: Map<string, VoiceProfile> = new Map()

// AI's own reflection voice
const AI_VOICE = {
  description: "Neutral voice, clear diction, calm and measured pacing, warm but professional tone",
  allowed_emotions: ["gentle", "thoughtful", "concerned"],
  forbidden_emotions: ["angry", "cry", "laugh_harder"]
}
```

#### 3.3 Analysis Pipeline Flow

```typescript
async function analyzeConversation(messages: Message[]) {
  const emotionalEvents = []

  for (const msg of messages) {
    // 1. Analyze with Sable
    const analysis = await sableMcp.analyze_emotion({ text: msg.text })

    // 2. Record significant emotions
    if (analysis.intensity > 0.5) {
      await sableMcp.feel_emotion({
        emotion: analysis.dominant_emotion,
        intensity: analysis.intensity,
        cause: `Message from ${msg.sender}: "${msg.text.substring(0, 50)}..."`
      })

      emotionalEvents.push({
        message: msg,
        emotions: analysis.emotions
      })
    }
  }

  // 3. Check for patterns
  const memories = await sableMcp.query_memories({ min_salience: 0.5 })
  const markers = await sableMcp.check_somatic_markers({
    context: summarizeConversation(messages)
  })

  return { emotionalEvents, memories, markers }
}
```

**Deliverables:**
- [ ] Emotion-to-Maya tag mapping works
- [ ] Voice profiles stored and retrieved
- [ ] Full analysis pipeline processes messages

---

### Phase 4: Voice Synthesis Integration

**Goal:** Generate emotionally appropriate audio output.

#### 4.1 Maya1 Inference Wrapper

```python
# src/maya/inference.py
import torch
from transformers import AutoModelForCausalLM, AutoTokenizer
import soundfile as sf

class MayaTTS:
    def __init__(self, model_path="maya-research/maya1"):
        self.model = AutoModelForCausalLM.from_pretrained(model_path)
        self.tokenizer = AutoTokenizer.from_pretrained(model_path)

    def generate(self, text: str, voice_description: str) -> bytes:
        prompt = f'<description="{voice_description}">\n{text}\n</description>'

        inputs = self.tokenizer(prompt, return_tensors="pt")
        outputs = self.model.generate(
            **inputs,
            max_new_tokens=2048,
            temperature=0.4,
            top_p=0.9
        )

        # Decode SNAC tokens to audio
        audio = self._decode_snac(outputs)
        return audio

    def inject_emotion_tags(self, text: str, tags: list) -> str:
        """Insert Maya emotion tags into text"""
        result = text
        for tag in tags:
            if tag['position'] == 'start':
                result = f"{tag['tag']} {result}"
            elif tag['position'] == 'end':
                result = f"{result} {tag['tag']}"
        return result
```

#### 4.2 Two-Voice Output Strategy

```typescript
// Voice A: Contact role-play (dynamic per contact)
async function speakAsContact(text: string, contactId: string, emotions: EmotionAnalysis[]) {
  const profile = await getVoiceProfile(contactId)
  const tags = mapEmotionToMayaTags(emotions)
  const taggedText = injectEmotionTags(text, tags)

  return mayaTtsMcp.speak_as_contact({
    text: taggedText,
    voice_description: profile.voice_description
  })
}

// Voice B: AI reflection (consistent, calm)
async function speakReflection(text: string, tone: string = 'neutral') {
  return mayaTtsMcp.speak_reflection({
    text,
    tone  // Maps to subtle voice variations
  })
}
```

**Deliverables:**
- [ ] Maya1 generates audio from text
- [ ] Emotion tags properly injected
- [ ] Two distinct voices working

---

### Phase 5: End-to-End Workflow

**Goal:** Complete reflection session orchestration.

#### 5.1 Claude CLAUDE.md Skill

```markdown
# Conversational Reflection Skill

## Available Tools
- `imessage-mcp`: Read iMessage transcripts
- `sable-mcp`: Analyze emotions, track state, query memories
- `private-journal-mcp`: Write reflections, search past entries
- `maya-tts-mcp`: Generate expressive voice output

## Reflection Session Flow

1. **Import & Analyze**
   - Fetch messages from specified contact/timeframe
   - Run each through Sable emotional analysis
   - Record significant emotions and patterns

2. **Check Context**
   - Query relevant autobiographical memories
   - Check somatic markers for gut feelings
   - Search journal for related past reflections

3. **Generate Insight**
   - Synthesize emotional patterns
   - Identify recurring themes
   - Note relationship trajectory

4. **Output**
   - Write journal entry with sections: feelings, user_context, technical_insights
   - Voice-act key messages with contact's voice + emotions
   - Speak AI reflection in calm, professional voice

5. **Record Memory**
   - If significant pattern detected, store as autobiographical memory
   - Update somatic markers if gut feeling reinforced
```

#### 5.2 MCP Configuration

```json
// ~/.config/claude/claude_desktop_config.json
{
  "mcpServers": {
    "private-journal": {
      "command": "npx",
      "args": ["github:obra/private-journal-mcp"]
    },
    "imessage": {
      "command": "node",
      "args": ["./src/mcp-servers/imessage-mcp/index.js"]
    },
    "sable": {
      "command": "node",
      "args": ["./src/mcp-servers/sable-mcp/index.js"]
    },
    "maya-tts": {
      "command": "python",
      "args": ["./src/mcp-servers/maya-tts-mcp/server.py"]
    }
  }
}
```

**Deliverables:**
- [ ] Full reflection flow works end-to-end
- [ ] Journal entries created with proper sections
- [ ] Voice output plays correctly
- [ ] Memories and markers persist across sessions

---

## Project Structure

```
conversational-reflection/
├── src/
│   ├── mcp-servers/
│   │   ├── imessage-mcp/
│   │   │   ├── index.ts
│   │   │   └── package.json
│   │   ├── sable-mcp/
│   │   │   ├── index.ts
│   │   │   └── package.json
│   │   └── maya-tts-mcp/
│   │       ├── server.py
│   │       └── requirements.txt
│   ├── lib/
│   │   ├── emotion-mapper.ts
│   │   ├── voice-profiles.ts
│   │   └── utils.ts
│   └── maya/
│       ├── inference.py
│       └── snac_decoder.py
├── config/
│   ├── voice-profiles.yaml
│   └── mcp-config.json
├── tests/
│   ├── imessage-mcp.test.ts
│   ├── sable-mcp.test.ts
│   ├── emotion-mapper.test.ts
│   └── integration.test.ts
├── plans/
│   ├── prd.md
│   └── architecture/
│       └── implementation-plan.md
├── package.json
├── tsconfig.json
└── CLAUDE.md
```

---

## Hardware Requirements

| Component | Minimum | Recommended |
|-----------|---------|-------------|
| **macOS** | Required (iMessage) | — |
| **Full Disk Access** | Required | — |
| **Node.js** | 18+ | 20+ |
| **Python** | 3.10+ | 3.11+ |
| **GPU (Maya1 local)** | 8GB VRAM | 16GB+ VRAM |
| **RAM** | 16GB | 32GB |

**No GPU?** Use Maya1 Cloud API at mayaresearch.ai

---

## Success Criteria

1. **Phase 1:** All four components install and run independently
2. **Phase 2:** MCP servers respond to tool calls correctly
3. **Phase 3:** Emotional analysis produces consistent, meaningful results
4. **Phase 4:** Voice output sounds natural with appropriate emotion
5. **Phase 5:** Full reflection session completes in <60 seconds

---

## Risk Mitigation

| Risk | Mitigation |
|------|------------|
| Full Disk Access denied | Document permission steps clearly; test with minimal permissions first |
| Maya1 GPU requirements | Fallback to cloud API; provide quantized model option |
| Sable emotional accuracy | Tune thresholds; provide manual emotion override |
| MCP server crashes | Add health checks; implement graceful degradation |
| iMessage DB locked | Read-only access; copy DB for heavy operations |

---

## Next Steps

1. Clone all repositories
2. Complete Phase 1 verification checklist
3. Begin MCP wrapper development
4. Test each phase before proceeding
