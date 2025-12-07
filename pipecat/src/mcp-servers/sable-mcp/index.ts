#!/usr/bin/env node

import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  Tool,
} from "@modelcontextprotocol/sdk/types.js";

/**
 * Sable - Self-contained Emotional Analysis MCP Server
 * Based on Antonio Damasio's consciousness model
 *
 * Implements:
 * - Emotion detection and analysis
 * - Body state simulation (physiological responses)
 * - Autobiographical memory with emotional salience
 * - Somatic markers for gut-feeling associations
 */

// Emotion types based on Ekman's basic emotions
type EmotionType = "fear" | "anger" | "joy" | "sadness" | "disgust" | "surprise";

interface EmotionResult {
  type: EmotionType;
  intensity: number;
}

interface BodyState {
  heart_rate: number;      // 60-180 bpm simulation
  temperature: number;     // -1 to 1 (cold to hot)
  tension: number;         // 0 to 1 (relaxed to tense)
  energy: number;          // 0 to 1 (depleted to energized)
  breathing: number;       // 0 to 1 (slow to rapid)
}

interface EmotionalState {
  body_state: BodyState;
  emotions: EmotionResult[];
  background_feelings: string[];
  last_updated: string;
}

interface Memory {
  id: string;
  description: string;
  salience: number;
  timestamp: string;
  associated_emotions: EmotionResult[];
}

interface SomaticMarker {
  id: string;
  context: string;
  feeling: string;
  strength: number;
  valence: "positive" | "negative" | "neutral";
  created: string;
}

// In-memory storage
let emotionalState: EmotionalState = {
  body_state: {
    heart_rate: 72,
    temperature: 0,
    tension: 0.2,
    energy: 0.6,
    breathing: 0.3,
  },
  emotions: [],
  background_feelings: ["calm", "present"],
  last_updated: new Date().toISOString(),
};

const memories: Memory[] = [];
const somaticMarkers: SomaticMarker[] = [];
let idCounter = 0;

// Emotion keywords for analysis
const emotionKeywords: Record<EmotionType, string[]> = {
  joy: [
    "happy", "joy", "excited", "wonderful", "amazing", "love", "great", "fantastic",
    "delighted", "pleased", "thrilled", "elated", "cheerful", "grateful", "blessed",
    "ecstatic", "overjoyed", "content", "satisfied", "proud", "laugh", "smile"
  ],
  sadness: [
    "sad", "unhappy", "depressed", "miserable", "heartbroken", "grief", "sorrow",
    "melancholy", "disappointed", "down", "blue", "lonely", "hopeless", "despair",
    "crying", "tears", "loss", "miss", "regret", "empty"
  ],
  anger: [
    "angry", "furious", "mad", "rage", "irritated", "annoyed", "frustrated",
    "outraged", "hostile", "resentful", "bitter", "hate", "enraged", "livid",
    "infuriated", "aggravated", "upset", "offended"
  ],
  fear: [
    "afraid", "scared", "terrified", "anxious", "worried", "nervous", "panic",
    "dread", "horror", "frightened", "alarmed", "uneasy", "apprehensive",
    "threatened", "vulnerable", "insecure", "paranoid"
  ],
  disgust: [
    "disgusted", "revolted", "repulsed", "nauseated", "sick", "gross", "awful",
    "horrible", "terrible", "distaste", "aversion", "loathing", "contempt",
    "repelled", "offended"
  ],
  surprise: [
    "surprised", "shocked", "amazed", "astonished", "stunned", "startled",
    "unexpected", "incredible", "unbelievable", "wow", "whoa", "sudden",
    "speechless", "bewildered"
  ],
};

// Body state modifiers per emotion
const emotionBodyEffects: Record<EmotionType, Partial<BodyState>> = {
  joy: { heart_rate: 85, temperature: 0.3, tension: 0.1, energy: 0.8, breathing: 0.4 },
  sadness: { heart_rate: 65, temperature: -0.3, tension: 0.3, energy: 0.3, breathing: 0.2 },
  anger: { heart_rate: 110, temperature: 0.7, tension: 0.9, energy: 0.9, breathing: 0.8 },
  fear: { heart_rate: 120, temperature: -0.2, tension: 0.8, energy: 0.7, breathing: 0.9 },
  disgust: { heart_rate: 75, temperature: -0.1, tension: 0.5, energy: 0.4, breathing: 0.3 },
  surprise: { heart_rate: 95, temperature: 0.1, tension: 0.4, energy: 0.7, breathing: 0.6 },
};

// Background feelings based on body state
function computeBackgroundFeelings(state: BodyState): string[] {
  const feelings: string[] = [];

  if (state.energy > 0.7) feelings.push("energized");
  else if (state.energy < 0.3) feelings.push("fatigued");

  if (state.tension > 0.6) feelings.push("tense");
  else if (state.tension < 0.2) feelings.push("relaxed");

  if (state.temperature > 0.3) feelings.push("warm");
  else if (state.temperature < -0.3) feelings.push("cold");

  if (state.heart_rate > 100) feelings.push("aroused");
  else if (state.heart_rate < 65) feelings.push("calm");

  if (state.breathing > 0.6) feelings.push("breathless");
  else if (state.breathing < 0.3) feelings.push("steady");

  if (feelings.length === 0) feelings.push("neutral");

  return feelings;
}

// Analyze text for emotional content
function analyzeEmotion(text: string): EmotionResult[] {
  const lowerText = text.toLowerCase();
  const words = lowerText.split(/\W+/);
  const emotionScores: Record<EmotionType, number> = {
    joy: 0, sadness: 0, anger: 0, fear: 0, disgust: 0, surprise: 0
  };

  // Count keyword matches
  for (const word of words) {
    for (const [emotion, keywords] of Object.entries(emotionKeywords)) {
      if (keywords.some(kw => word.includes(kw) || kw.includes(word))) {
        emotionScores[emotion as EmotionType] += 1;
      }
    }
  }

  // Check for intensifiers
  const intensifiers = ["very", "extremely", "incredibly", "so", "really", "absolutely"];
  const hasIntensifier = words.some(w => intensifiers.includes(w));
  const multiplier = hasIntensifier ? 1.5 : 1;

  // Check for negation (simple)
  const negations = ["not", "no", "never", "don't", "doesn't", "didn't", "won't", "can't"];
  const hasNegation = words.some(w => negations.includes(w));

  // Convert to results
  const results: EmotionResult[] = [];
  const totalMatches = Object.values(emotionScores).reduce((a, b) => a + b, 0);

  if (totalMatches > 0) {
    for (const [emotion, score] of Object.entries(emotionScores)) {
      if (score > 0) {
        let intensity = Math.min((score / totalMatches) * multiplier, 1);

        // Negation flips positive/negative emotions
        if (hasNegation) {
          if (emotion === "joy") {
            results.push({ type: "sadness", intensity: intensity * 0.7 });
            continue;
          } else if (emotion === "sadness") {
            results.push({ type: "joy", intensity: intensity * 0.5 });
            continue;
          }
        }

        results.push({ type: emotion as EmotionType, intensity });
      }
    }
  }

  // Sort by intensity
  results.sort((a, b) => b.intensity - a.intensity);

  return results;
}

// Valid emotion types
const VALID_EMOTIONS: EmotionType[] = ["fear", "anger", "joy", "sadness", "disgust", "surprise"];

// Map similar emotions to valid ones
function normalizeEmotion(emotion: string): EmotionType {
  const normalized = emotion.toLowerCase().trim();

  // Direct match
  if (VALID_EMOTIONS.includes(normalized as EmotionType)) {
    return normalized as EmotionType;
  }

  // Map similar emotions to valid ones
  const emotionMap: Record<string, EmotionType> = {
    // Joy variants
    "happy": "joy", "happiness": "joy", "excited": "joy", "elated": "joy",
    "content": "joy", "pleased": "joy", "delighted": "joy", "cheerful": "joy",
    // Sadness variants
    "sad": "sadness", "unhappy": "sadness", "depressed": "sadness", "melancholy": "sadness",
    "grief": "sadness", "sorrow": "sadness", "regret": "sadness", "disappointed": "sadness",
    "lonely": "sadness", "heartbroken": "sadness",
    // Anger variants
    "angry": "anger", "mad": "anger", "furious": "anger", "irritated": "anger",
    "frustrated": "anger", "annoyed": "anger", "outraged": "anger",
    // Fear variants
    "afraid": "fear", "scared": "fear", "anxious": "fear", "worried": "fear",
    "nervous": "fear", "terrified": "fear", "panic": "fear", "dread": "fear",
    // Disgust variants
    "disgusted": "disgust", "revolted": "disgust", "repulsed": "disgust",
    // Surprise variants
    "surprised": "surprise", "shocked": "surprise", "amazed": "surprise",
    "astonished": "surprise", "startled": "surprise",
  };

  if (emotionMap[normalized]) {
    return emotionMap[normalized];
  }

  // Default to joy for positive-sounding, sadness for negative-sounding
  console.error(`Unknown emotion "${emotion}", defaulting to joy`);
  return "joy";
}

// Update body state based on emotion
function updateBodyState(emotion: EmotionType, intensity: number): void {
  const effects = emotionBodyEffects[emotion];
  if (!effects) {
    console.error(`No body effects for emotion "${emotion}", using neutral`);
    return;
  }
  const decay = 0.7; // How much existing state persists
  const impact = intensity * (1 - decay);

  emotionalState.body_state = {
    heart_rate: emotionalState.body_state.heart_rate * decay + (effects.heart_rate || 72) * impact,
    temperature: emotionalState.body_state.temperature * decay + (effects.temperature || 0) * impact,
    tension: emotionalState.body_state.tension * decay + (effects.tension || 0.2) * impact,
    energy: emotionalState.body_state.energy * decay + (effects.energy || 0.5) * impact,
    breathing: emotionalState.body_state.breathing * decay + (effects.breathing || 0.3) * impact,
  };

  emotionalState.background_feelings = computeBackgroundFeelings(emotionalState.body_state);
  emotionalState.last_updated = new Date().toISOString();
}

// Register an emotion
function feelEmotion(emotion: EmotionType, intensity: number, cause: string): void {
  // Add to active emotions (or update if exists)
  const existing = emotionalState.emotions.find(e => e.type === emotion);
  if (existing) {
    existing.intensity = Math.min(existing.intensity + intensity * 0.5, 1);
  } else {
    emotionalState.emotions.push({ type: emotion, intensity });
  }

  // Keep only top 3 emotions
  emotionalState.emotions.sort((a, b) => b.intensity - a.intensity);
  emotionalState.emotions = emotionalState.emotions.slice(0, 3);

  // Update body state
  updateBodyState(emotion, intensity);

  // Create a memory if significant
  if (intensity > 0.5) {
    memories.push({
      id: `mem_${++idCounter}`,
      description: cause,
      salience: intensity,
      timestamp: new Date().toISOString(),
      associated_emotions: [{ type: emotion, intensity }],
    });
  }
}

// Decay emotions over time (called periodically)
function decayEmotions(): void {
  const decayRate = 0.95;
  emotionalState.emotions = emotionalState.emotions
    .map(e => ({ ...e, intensity: e.intensity * decayRate }))
    .filter(e => e.intensity > 0.1);

  // Gradually normalize body state
  emotionalState.body_state.heart_rate = emotionalState.body_state.heart_rate * 0.98 + 72 * 0.02;
  emotionalState.body_state.temperature *= 0.95;
  emotionalState.body_state.tension = emotionalState.body_state.tension * 0.95 + 0.2 * 0.05;
  emotionalState.body_state.energy = emotionalState.body_state.energy * 0.98 + 0.5 * 0.02;
  emotionalState.body_state.breathing = emotionalState.body_state.breathing * 0.95 + 0.3 * 0.05;

  emotionalState.background_feelings = computeBackgroundFeelings(emotionalState.body_state);
}

// Find relevant somatic markers
function findSomaticMarkers(context: string): SomaticMarker[] {
  const lowerContext = context.toLowerCase();
  return somaticMarkers.filter(marker => {
    const markerWords = marker.context.toLowerCase().split(/\W+/);
    const contextWords = lowerContext.split(/\W+/);
    return markerWords.some(mw => contextWords.some(cw => mw.includes(cw) || cw.includes(mw)));
  });
}

// Define available tools
const tools: Tool[] = [
  {
    name: "analyze_emotion",
    description:
      "Analyze text for emotional content using Damasio's consciousness model. Returns detected emotions with intensities.",
    inputSchema: {
      type: "object",
      properties: {
        text: {
          type: "string",
          description: "The text to analyze for emotional content",
        },
      },
      required: ["text"],
    },
  },
  {
    name: "feel_emotion",
    description:
      "Register an emotional experience. Updates the emotional state and body state simulation.",
    inputSchema: {
      type: "object",
      properties: {
        emotion: {
          type: "string",
          enum: ["fear", "anger", "joy", "sadness", "disgust", "surprise"],
          description: "The type of emotion to register",
        },
        intensity: {
          type: "number",
          minimum: 0,
          maximum: 1,
          description: "The intensity of the emotion (0.0 to 1.0)",
        },
        cause: {
          type: "string",
          description: "The reason or cause of the emotion",
        },
      },
      required: ["emotion", "intensity", "cause"],
    },
  },
  {
    name: "get_emotional_state",
    description:
      "Get the current emotional state including body state (physiological simulation), active emotions, and background feelings.",
    inputSchema: {
      type: "object",
      properties: {},
    },
  },
  {
    name: "record_memory",
    description:
      "Store an autobiographical memory with emotional salience. Higher salience = more emotionally significant.",
    inputSchema: {
      type: "object",
      properties: {
        description: {
          type: "string",
          description: "Description of the memory or event",
        },
        salience: {
          type: "number",
          minimum: 0,
          maximum: 1,
          description: "Emotional salience/importance (0.0 to 1.0)",
        },
      },
      required: ["description", "salience"],
    },
  },
  {
    name: "query_memories",
    description:
      "Search autobiographical memories by salience threshold. Returns emotionally significant memories.",
    inputSchema: {
      type: "object",
      properties: {
        min_salience: {
          type: "number",
          minimum: 0,
          maximum: 1,
          default: 0.5,
          description: "Minimum salience threshold",
        },
        limit: {
          type: "number",
          minimum: 1,
          maximum: 100,
          default: 10,
          description: "Maximum memories to return",
        },
      },
    },
  },
  {
    name: "create_somatic_marker",
    description:
      "Create a somatic marker - an emotional association (gut feeling) for a context. Used for intuitive decision-making.",
    inputSchema: {
      type: "object",
      properties: {
        context: {
          type: "string",
          description: "The situation or context for this marker",
        },
        feeling: {
          type: "string",
          description: "The gut feeling associated with this context",
        },
        strength: {
          type: "number",
          minimum: 0,
          maximum: 1,
          description: "Strength of the association (0.0 to 1.0)",
        },
        valence: {
          type: "string",
          enum: ["positive", "negative", "neutral"],
          description: "Whether this is a positive, negative, or neutral association",
        },
      },
      required: ["context", "feeling", "strength", "valence"],
    },
  },
  {
    name: "check_somatic_markers",
    description:
      "Find relevant somatic markers (gut feelings) for a context. Helps with intuitive decision guidance.",
    inputSchema: {
      type: "object",
      properties: {
        context: {
          type: "string",
          description: "The context to check for somatic markers",
        },
      },
      required: ["context"],
    },
  },
];

// Create server
const server = new Server(
  {
    name: "sable-mcp",
    version: "1.0.0",
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

// Handle tool listing
server.setRequestHandler(ListToolsRequestSchema, async () => {
  return { tools };
});

// Handle tool execution
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  // Decay emotions slightly on each interaction
  decayEmotions();

  try {
    switch (name) {
      case "analyze_emotion": {
        const text = args?.text as string;
        if (!text) throw new Error("Text parameter is required");

        const emotions = analyzeEmotion(text);

        // Update state based on analysis (empathic response)
        if (emotions.length > 0) {
          const primary = emotions[0];
          updateBodyState(primary.type, primary.intensity * 0.3);
        }

        return {
          content: [{
            type: "text",
            text: JSON.stringify({
              emotions,
              interpretation: emotions.length > 0
                ? `Primary emotion detected: ${emotions[0].type} (${(emotions[0].intensity * 100).toFixed(0)}%)`
                : "No strong emotions detected in text"
            }, null, 2),
          }],
        };
      }

      case "feel_emotion": {
        const rawEmotion = args?.emotion as string;
        const intensity = args?.intensity as number;
        const cause = args?.cause as string;

        if (!rawEmotion || intensity === undefined || !cause) {
          throw new Error("Emotion, intensity, and cause parameters are required");
        }

        // Normalize the emotion to a valid type (handles "regret" -> "sadness", etc.)
        const emotion = normalizeEmotion(rawEmotion);

        feelEmotion(emotion, intensity, cause);

        return {
          content: [{
            type: "text",
            text: JSON.stringify({
              success: true,
              message: `Registered ${emotion} at ${(intensity * 100).toFixed(0)}% intensity${rawEmotion !== emotion ? ` (normalized from "${rawEmotion}")` : ""}`,
              current_state: {
                primary_emotions: emotionalState.emotions,
                background_feelings: emotionalState.background_feelings,
              }
            }, null, 2),
          }],
        };
      }

      case "get_emotional_state": {
        return {
          content: [{
            type: "text",
            text: JSON.stringify(emotionalState, null, 2),
          }],
        };
      }

      case "record_memory": {
        const description = args?.description as string;
        const salience = args?.salience as number;

        if (!description || salience === undefined) {
          throw new Error("Description and salience are required");
        }

        const memory: Memory = {
          id: `mem_${++idCounter}`,
          description,
          salience,
          timestamp: new Date().toISOString(),
          associated_emotions: [...emotionalState.emotions],
        };
        memories.push(memory);

        return {
          content: [{
            type: "text",
            text: JSON.stringify({
              success: true,
              memory,
            }, null, 2),
          }],
        };
      }

      case "query_memories": {
        const minSalience = (args?.min_salience as number) ?? 0.5;
        const limit = (args?.limit as number) ?? 10;

        const filtered = memories
          .filter(m => m.salience >= minSalience)
          .sort((a, b) => b.salience - a.salience || new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
          .slice(0, limit);

        return {
          content: [{
            type: "text",
            text: JSON.stringify({ memories: filtered, total: filtered.length }, null, 2),
          }],
        };
      }

      case "create_somatic_marker": {
        const context = args?.context as string;
        const feeling = args?.feeling as string;
        const strength = args?.strength as number;
        const valence = args?.valence as "positive" | "negative" | "neutral";

        if (!context || !feeling || strength === undefined || !valence) {
          throw new Error("Context, feeling, strength, and valence are required");
        }

        const marker: SomaticMarker = {
          id: `sm_${++idCounter}`,
          context,
          feeling,
          strength,
          valence,
          created: new Date().toISOString(),
        };
        somaticMarkers.push(marker);

        return {
          content: [{
            type: "text",
            text: JSON.stringify({
              success: true,
              marker,
            }, null, 2),
          }],
        };
      }

      case "check_somatic_markers": {
        const context = args?.context as string;
        if (!context) throw new Error("Context is required");

        const markers = findSomaticMarkers(context);

        return {
          content: [{
            type: "text",
            text: JSON.stringify({
              markers,
              guidance: markers.length > 0
                ? markers.map(m => `${m.valence} feeling about "${m.context}": ${m.feeling} (strength: ${(m.strength * 100).toFixed(0)}%)`).join("\n")
                : "No somatic markers found for this context",
            }, null, 2),
          }],
        };
      }

      default:
        throw new Error(`Unknown tool: ${name}`);
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return {
      content: [{ type: "text", text: JSON.stringify({ error: errorMessage }) }],
      isError: true,
    };
  }
});

// Start server
async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("Sable MCP server running on stdio (self-contained mode)");
}

main().catch((error) => {
  console.error("Fatal error:", error);
  process.exit(1);
});
