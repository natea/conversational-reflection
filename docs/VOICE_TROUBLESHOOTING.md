# Voice Integration Setup

## Prerequisites

1. Pipecat backend running locally
2. Chrome or Firefox browser (WebRTC support)
3. Microphone access

## Running Locally

### 1. Start the Pipecat Backend

```bash
cd backend
uv run bot.py --transport webrtc
```

The backend will start on http://localhost:7860

### 2. Start the Frontend

```bash
npm run dev
```

The frontend will start on http://localhost:3000

### 3. Connect

1. Open http://localhost:3000
2. Click "Connect to Ginger" in the voice input bar (or use the connection button in the navigation)
3. Allow microphone access when prompted
4. Wait for the "Connected" status indicator to turn green
5. Start talking!

## Voice Input Features

- **Voice Mode**: Click the phone icon to connect. Speak naturally and Ginger will respond.
- **Text Mode**: Click the keyboard icon to switch to text input.
- **Mic Mute**: When connected, click the microphone icon to mute/unmute.
- **Disconnect**: Click the phone-off icon to disconnect.

## Connection Status Indicators

- **Phone icon (red)**: Disconnected - click to connect
- **Loader spinning**: Connecting...
- **Phone icon (green)**: Connected and ready
- **Green dot in nav**: Connection active
- **Yellow pulsing dot**: Connected but bot not ready yet

## Troubleshooting

### "Connection failed" error
- Verify Pipecat backend is running on port 7860
- Check browser console for CORS errors
- Ensure no firewall blocking localhost connections
- Try restarting the Pipecat backend

### No audio from Ginger
- Check browser audio permissions in site settings
- Verify Cartesia, Deepgram and OpenAI keys are set in `backend/.env`
- Check Pipecat backend logs for TTS errors
- Ensure speaker volume is up

### Microphone not detected
- Grant microphone permission in browser settings
- Check system audio settings
- Select the correct input source in the audio select gear icon 
- Try a different browser (Chrome recommended)
- Verify no other app is using the microphone


### Connection drops frequently
- Check network stability
- Ensure Pipecat backend is still running
- Look for errors in browser console
- Try refreshing the page

## Environment Configuration

Create a `.env.local` file in the `frontend` directory:

```bash
# For local development (default)
PIPECAT_WEBRTC_URL=http://localhost:7860/offer

# For production
PIPECAT_WEBRTC_URL=https://your-pipecat-backend.com/offer
```

## Architecture

```
Browser (frontend)
    ↓ WebRTC via SmallWebRTCTransport
/api/offer (Next.js proxy)
    ↓ HTTP POST
Pipecat Backend (localhost:7860)
    ↓ Audio Pipeline
STT (Deepgram) → LLM (GPT-4) → TTS (Cartesia)
    ↓
Audio response via WebRTC
```
