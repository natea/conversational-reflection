# Maya TTS MCP Server

Model Context Protocol (MCP) server for Maya1 text-to-speech with emotional expression.

## Features

- **speak_as_contact**: Generate speech as a contact with their voice profile and emotional tags
- **speak_reflection**: Generate AI reflection speech in calm, neutral tones
- **preview_voice**: Preview voice descriptions with sample text

## Installation

### 1. Install Node.js dependencies

```bash
npm install
```

### 2. Install Python dependencies

```bash
pip install -r requirements.txt
```

### 3. Build TypeScript

```bash
npm run build
```

## Usage

### As MCP Server

The server runs on stdio transport and can be integrated with Claude Desktop or other MCP clients.

```bash
npm start
```

### Configuration for Claude Desktop

Add to your Claude Desktop configuration:

```json
{
  "mcpServers": {
    "maya-tts": {
      "command": "node",
      "args": ["/path/to/maya-tts-mcp/dist/index.js"]
    }
  }
}
```

## Tools

### speak_as_contact

Generate speech as a contact with voice profile and emotions.

**Parameters:**
- `text` (string, required): The text to speak
- `voice_description` (string, required): Voice description (e.g., "Female voice in her 30s, American accent, warm timbre")
- `emotion_tags` (array, optional): Emotion tags to apply: `laugh`, `giggle`, `sigh`, `gasp`, `cry`, `whisper`, `angry`

**Returns:**
```json
{
  "audio_path": "/tmp/maya-tts/audio.wav",
  "audio_base64": "base64_encoded_audio",
  "duration_seconds": 3.5
}
```

### speak_reflection

Generate AI reflection speech in calm, neutral voice.

**Parameters:**
- `text` (string, required): The reflection text to speak
- `tone` (enum, optional): Tone of voice - `neutral`, `gentle`, `concerned`, `warm` (default: `neutral`)

**Returns:**
```json
{
  "audio_path": "/tmp/maya-tts/audio.wav",
  "audio_base64": "base64_encoded_audio",
  "duration_seconds": 4.2,
  "tone": "gentle"
}
```

### preview_voice

Preview a voice description with sample text.

**Parameters:**
- `voice_description` (string, required): Voice description to preview
- `sample_text` (string, optional): Sample text to speak (default: "Hello, this is how I sound.")

**Returns:**
```json
{
  "audio_path": "/tmp/maya-tts/audio.wav",
  "audio_base64": "base64_encoded_audio",
  "duration_seconds": 2.1
}
```

## Voice Description Format

Maya1 uses natural language voice descriptions:

```
"Female voice in her 30s, American accent, warm but strained timbre, frustrated tone"
"Male voice in his 50s, British accent, deep timbre, calm and professional"
"Young female voice, Australian accent, energetic and cheerful"
```

## Emotion Tags

Supported emotion tags that can be embedded in speech:

- `<laugh>` - Natural laughter
- `<giggle>` - Light giggling
- `<sigh>` - Deep sigh
- `<gasp>` - Surprised gasp
- `<cry>` - Crying/sobbing
- `<whisper>` - Whispered speech
- `<angry>` - Angry tone

## Architecture

The MCP server consists of two components:

1. **TypeScript MCP Server** (`src/index.ts`): Handles MCP protocol and client communication
2. **Python Inference Server** (`server.py`): Runs Maya1 model inference via Flask HTTP API

The TypeScript server automatically starts and manages the Python server lifecycle.

## Model Notes

**Important**: Maya1 model is not yet publicly available. This implementation includes a placeholder that generates silent audio files for testing. When Maya1 is released, uncomment the model loading code in `server.py`.

## Requirements

- Node.js 20+
- Python 3.9+
- CUDA-capable GPU (optional, for faster inference)

## Development

```bash
# Watch mode for TypeScript
npm run watch

# Run Python server directly
python server.py

# Environment variables
export MAYA_TTS_PORT=8765  # Custom port for Python server
```

## Troubleshooting

### Python server won't start

- Check Python dependencies: `pip install -r requirements.txt`
- Verify Python 3 is available: `python3 --version`
- Check server.py permissions: `chmod +x server.py`

### Audio generation errors

- Verify GPU/CUDA availability for faster inference
- Check temp directory permissions: `/tmp/maya-tts/`
- Ensure sufficient disk space for audio files

## License

MIT
