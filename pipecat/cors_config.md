# CORS Configuration for Pipecat WebRTC

## Understanding CORS in WebRTC

CORS (Cross-Origin Resource Sharing) is typically an HTTP-based security mechanism. WebRTC uses a different communication pattern:

1. **Signaling Phase**: Usually HTTP/WebSocket based - this is where CORS applies
2. **Peer Connection**: Direct peer-to-peer - CORS doesn't apply

## Current Configuration

The Pipecat WebRTC transport (`smallwebrtc`) doesn't have explicit CORS configuration in its transport parameters. This is because:

- WebRTC itself doesn't use HTTP for the actual media传输
- The transport handles peer connections directly
- CORS is handled at the signaling server level (if applicable)

## Solutions for Permissive CORS

### Option 1: Frontend Proxy Configuration (Recommended)

Configure your frontend to proxy API requests through the Next.js server:

```javascript
// next.config.js
module.exports = {
  async rewrites() {
    return [
      {
        source: '/api/webrtc/:path*',
        destination: 'http://localhost:8765/:path*',
      },
    ]
  },
}
```

### Option 2: Use Environment Variables for Signaling

Some WebRTC implementations use environment variables for signaling server configuration:

```bash
# Set in your .env file
PIPECAT_WEBRTC_HOST=0.0.0.0
PIPECAT_WEBRTC_PORT=8765
PIPECAT_ALLOW_ORIGIN=*
```

### Option 3: Reverse Proxy with nginx

If you need a production solution, use nginx as a reverse proxy:

```nginx
server {
    listen 80;

    location /webrtc/ {
        proxy_pass http://localhost:8765/;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;

        # CORS headers
        add_header Access-Control-Allow-Origin *;
        add_header Access-Control-Allow-Methods "GET, POST, OPTIONS";
        add_header Access-Control-Allow-Headers "Content-Type";
    }
}
```

### Option 4: Development Mode - Disable Browser Security

For development only, you can start Chrome with disabled web security:

```bash
# macOS
open -n -a /Applications/Google\ Chrome.app/Contents/MacOS/Google\ Chrome --args --user-data-dir="/tmp/chrome_dev_test" --disable-web-security --disable-features=VizDisplayCompositor

# Windows
chrome.exe --disable-web-security --disable-features=VizDisplayCompositor

# Linux
google-chrome --disable-web-security --disable-features=VizDisplayCompositor
```

⚠️ **Warning**: Never use this in production!

## Current Implementation

The current `bot.py` uses the SmallWebRTC transport with default settings:

```python
transport_params = {
    "webrtc": lambda: TransportParams(
        audio_in_enabled=True,
        audio_out_enabled=True,
        vad_analyzer=SileroVADAnalyzer(params=VADParams(stop_secs=0.2)),
        turn_analyzer=LocalSmartTurnAnalyzerV3(),
    ),
}
```

## Testing CORS Issues

If you're experiencing CORS issues, they're likely related to:

1. **Signaling server**: The initial HTTP/WebSocket connection for WebRTC setup
2. **API endpoints**: Any HTTP APIs your frontend calls

The WebRTC peer connection itself shouldn't have CORS issues as it's not HTTP-based.

## Recommendation

For development with the Ginger frontend:
1. Use Next.js API routes as a proxy
2. Keep the Pipecat bot running as is
3. Configure CORS on any HTTP APIs you create