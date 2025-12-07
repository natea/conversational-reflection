                        # Sable MCP Server

A Model Context Protocol (MCP) server that wraps the Sable (Her) CLI for emotional analysis using Antonio Damasio's consciousness model.

## Overview

This MCP server provides tools for:
- Analyzing text for emotional content
- Registering emotional events
- Tracking emotional state and body responses
- Managing autobiographical memories with emotional salience
- Querying somatic markers (gut feelings) for decision-making

## Prerequisites

Install the Sable CLI:
```bash
npm install -g sable-cli
```

## Installation

```bash
cd /Users/nateaune/Documents/code/conversational-reflection/src/mcp-servers/sable-mcp
npm install
npm run build
```

## Usage

### Running the Server

```bash
npm start
```

Or using npx:
```bash
npx sable-mcp
```

### Configuration for Claude Desktop

Add to your Claude Desktop configuration (`~/Library/Application Support/Claude/claude_desktop_config.json`):

```json
{
  "mcpServers": {
    "sable": {
      "command": "node",
      "args": ["/Users/nateaune/Documents/code/conversational-reflection/src/mcp-servers/sable-mcp/index.js"]
    }
  }
}
```

## Available Tools

### 1. analyze_emotion

Analyze text for emotional content.

**Parameters:**
- `text` (string, required): The text to analyze

**Example:**
```json
{
  "text": "I'm so happy and excited about this opportunity!"
}
```

**Returns:**
```json
{
  "emotions": [
    { "type": "joy", "intensity": 0.9 },
    { "type": "surprise", "intensity": 0.6 }
  ]
}
```

### 2. feel_emotion

Register an emotional event in the system.

**Parameters:**
- `emotion` (enum, required): One of: fear, anger, joy, sadness, disgust, surprise
- `intensity` (number, required): 0.0 to 1.0
- `cause` (string, required): The reason for the emotion

**Example:**
```json
{
  "emotion": "joy",
  "intensity": 0.8,
  "cause": "received positive feedback on project"
}
```

### 3. get_emotional_state

Get current emotional state including body responses and background feelings.

**Parameters:** None

**Returns:**
```json
{
  "body_state": {
    "heart_rate": 72,
    "temperature": 98.6,
    "tension": 0.3
  },
  "emotions": [
    { "type": "joy", "intensity": 0.6 }
  ],
  "background_feelings": ["content", "calm"]
}
```

### 4. record_memory

Store an autobiographical memory with emotional salience.

**Parameters:**
- `description` (string, required): Description of the memory
- `salience` (number, required): Emotional importance (0.0 to 1.0)

**Example:**
```json
{
  "description": "Successfully launched the new feature",
  "salience": 0.9
}
```

### 5. query_memories

Search autobiographical memories by emotional salience.

**Parameters:**
- `min_salience` (number, optional): Minimum threshold (default: 0.5)
- `limit` (number, optional): Max results to return (default: 10)

**Returns:**
```json
{
  "memories": [
    {
      "id": "mem_123",
      "description": "Successfully launched the new feature",
      "salience": 0.9,
      "timestamp": "2025-01-15T10:30:00Z"
    }
  ]
}
```

### 6. check_somatic_markers

Find gut feelings associated with a context.

**Parameters:**
- `context` (string, required): The situation to check

**Example:**
```json
{
  "context": "making a risky investment decision"
}
```

**Returns:**
```json
{
  "markers": [
    {
      "context": "risky investment",
      "feeling": "unease",
      "strength": 0.7
    }
  ]
}
```

## Architecture

The server:
1. Uses `@modelcontextprotocol/sdk` for MCP protocol implementation
2. Executes Sable CLI commands via `child_process.spawn`
3. Parses both JSON and structured text output formats
4. Handles errors gracefully with clear messages
5. Checks for Sable CLI installation on startup

## Error Handling

The server handles:
- Missing Sable CLI installation
- Invalid command arguments
- CLI command failures
- JSON and text parsing errors

All errors return structured JSON responses with clear error messages.

## Development

### Build
```bash
npm run build
```

### Watch mode
```bash
npm run dev
```

## Theoretical Foundation

Based on Antonio Damasio's model of consciousness:
- **Body State**: Physiological responses (homeostatic regulation)
- **Emotions**: Primary responses to stimuli
- **Background Feelings**: Ongoing emotional tone
- **Autobiographical Memory**: Self-narrative with emotional tags
- **Somatic Markers**: Emotional associations guiding decisions

## License

MIT
