#!/bin/bash
# Simple setup script for Ginger Voice Bot

echo "🚀 Quick Setup for Ginger Voice Bot"

# Create app directory
mkdir -p /opt/ginger-bot
cd /opt/ginger-bot

# Create environment file with correct API key
cat > .env << 'EOF'
DEEPGRAM_API_KEY=5c7b55dcdf0518a750ded48d7325e4816dc6fbf0
CARTESIA_API_KEY=sk_car_NfamFvnzMcgYcp8JhdCrYe
GOOGLE_API_KEY=YOUR_GOOGLE_API_KEY_HERE
NODE_ENV=production
EOF

# Install Node.js
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo bash -
sudo apt-get install -y nodejs

# Install PM2
sudo npm install -g pm2

# Create simple backend server
cat > server.py << 'EOF'
#!/usr/bin/env python3
import os
import json
from http.server import HTTPServer, BaseHTTPRequestHandler
from urllib.parse import urlparse
import subprocess

class GingerHandler(BaseHTTPRequestHandler):
    def do_OPTIONS(self):
        self.send_response(200)
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')
        self.end_headers()

    def do_GET(self):
        self.send_response(200)
        self.send_header('Content-Type', 'application/json')
        self.send_header('Access-Control-Allow-Origin', '*')
        self.end_headers()

        if self.path == '/health':
            self.wfile.write(json.dumps({
                "status": "healthy",
                "message": "Ginger Voice Bot API",
                "vm": "e2-standard-4"
            }).encode())
        else:
            self.wfile.write(json.dumps({
                "message": "Ginger Voice Bot API",
                "endpoints": ["/health", "/api/offer"]
            }).encode())

    def do_POST(self):
        content_length = int(self.headers['Content-Length'])
        post_data = self.rfile.read(content_length)

        if self.path == '/api/offer':
            # Handle WebRTC offer
            self.send_response(200)
            self.send_header('Content-Type', 'application/json')
            self.send_header('Access-Control-Allow-Origin', '*')
            self.end_headers()

            # Simple response for now
            response = {
                "type": "answer",
                "sdp": "v=0\r\no=- 0 0 IN IP4 127.0.0.1\r\ns=-\r\nt=0 0\r\n"
            }
            self.wfile.write(json.dumps(response).encode())

if __name__ == '__main__':
    server = HTTPServer(('0.0.0.0', 7860), GingerHandler)
    print("🎤 Ginger Bot API server running on port 7860")
    server.serve_forever()
EOF

# Create simple frontend
mkdir -p /opt/ginger-bot/public
cat > /opt/ginger-bot/public/index.html << 'EOF'
<!DOCTYPE html>
<html>
<head>
    <title>Ginger Voice Bot</title>
    <style>
        body {
            font-family: Arial, sans-serif;
            max-width: 800px;
            margin: 0 auto;
            padding: 20px;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            min-height: 100vh;
        }
        .container {
            background: rgba(255, 255, 255, 0.1);
            border-radius: 20px;
            padding: 30px;
            backdrop-filter: blur(10px);
        }
        h1 {
            text-align: center;
            margin-bottom: 30px;
        }
        .button {
            background: #ff6b6b;
            color: white;
            border: none;
            padding: 15px 30px;
            border-radius: 50px;
            font-size: 18px;
            cursor: pointer;
            transition: all 0.3s;
            display: block;
            margin: 20px auto;
        }
        .button:hover {
            transform: scale(1.05);
            background: #ff5252;
        }
        .button:disabled {
            background: #666;
            cursor: not-allowed;
            transform: scale(1);
        }
        .status {
            text-align: center;
            margin: 20px 0;
            padding: 10px;
            background: rgba(255, 255, 255, 0.1);
            border-radius: 10px;
        }
        .connected {
            background: rgba(76, 175, 80, 0.3);
        }
        .error {
            background: rgba(244, 67, 54, 0.3);
        }
    </style>
</head>
<body>
    <div class="container">
        <h1>🧡 Ginger Voice Bot</h1>
        <div class="status" id="status">Ready to connect...</div>
        <button class="button" id="connectBtn" onclick="toggleConnection()">
            Start Conversation
        </button>
        <div style="text-align: center; margin-top: 30px;">
            <p>Hello! I'm Ginger, your emotionally-aware AI companion.</p>
            <p>Click "Start Conversation" to begin talking with me.</p>
            <p style="font-size: 14px; opacity: 0.8;">
                Powered by Google Gemini • Deepgram STT • Cartesia TTS
            </p>
        </div>
    </div>

    <script>
        let isConnected = false;
        let peerConnection = null;
        let localStream = null;
        let remoteAudio = new Audio();

        const statusEl = document.getElementById('status');
        const connectBtn = document.getElementById('connectBtn');

        async function toggleConnection() {
            if (!isConnected) {
                await startConnection();
            } else {
                stopConnection();
            }
        }

        async function startConnection() {
            try {
                statusEl.textContent = 'Connecting to Ginger...';
                statusEl.className = 'status';
                connectBtn.disabled = true;

                // Get microphone access
                localStream = await navigator.mediaDevices.getUserMedia({
                    audio: true,
                    video: false
                });

                // Create peer connection
                peerConnection = new RTCPeerConnection({
                    iceServers: [{ urls: 'stun:stun.l.google.com:19302' }]
                });

                // Add local stream
                localStream.getTracks().forEach(track => {
                    peerConnection.addTrack(track, localStream);
                });

                // Handle remote stream
                peerConnection.ontrack = (event) => {
                    remoteAudio.srcObject = event.streams[0];
                    remoteAudio.play();
                };

                // Create offer
                const offer = await peerConnection.createOffer();
                await peerConnection.setLocalDescription(offer);

                // Send offer to server
                const response = await fetch('http://34.168.212.188:7860/api/offer', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ offer: offer })
                });

                const data = await response.json();
                await peerConnection.setRemoteDescription(data.answer);

                isConnected = true;
                connectBtn.textContent = 'End Conversation';
                connectBtn.style.background = '#4CAF50';
                statusEl.textContent = 'Connected to Ginger! 🎤';
                statusEl.className = 'status connected';
                connectBtn.disabled = false;

            } catch (error) {
                console.error('Connection error:', error);
                statusEl.textContent = 'Error: ' + error.message;
                statusEl.className = 'status error';
                connectBtn.disabled = false;
            }
        }

        function stopConnection() {
            if (peerConnection) {
                peerConnection.close();
                peerConnection = null;
            }
            if (localStream) {
                localStream.getTracks().forEach(track => track.stop());
                localStream = null;
            }
            remoteAudio.pause();

            isConnected = false;
            connectBtn.textContent = 'Start Conversation';
            connectBtn.style.background = '#ff6b6b';
            statusEl.textContent = 'Disconnected';
            statusEl.className = 'status';
        }
    </script>
</body>
</html>
EOF

# Create simple HTTP server for frontend
cat > frontend.js << 'EOF'
const http = require('http');
const fs = require('fs');
const path = require('path');

const server = http.createServer((req, res) => {
    let filePath = '.' + req.url;
    if (filePath === './') filePath = './public/index.html';

    const extname = String(path.extname(filePath)).toLowerCase();
    const mimeTypes = {
        '.html': 'text/html',
        '.js': 'text/javascript',
        '.css': 'text/css',
        '.json': 'application/json',
    };

    const contentType = mimeTypes[extname] || 'application/octet-stream';

    fs.readFile(filePath, (error, content) => {
        if (error) {
            res.writeHead(404);
            res.end('File not found');
        } else {
            res.writeHead(200, { 'Content-Type': contentType });
            res.end(content, 'utf-8');
        }
    });
});

server.listen(3000, '0.0.0.0', () => {
    console.log('🌐 Frontend server running on port 3000');
});
EOF

# Start both servers with PM2
pm2 start server.py --name "ginger-backend" --interpreter python3
pm2 start frontend.js --name "ginger-frontend"
pm2 save

echo ""
echo "✅ Ginger Voice Bot is running!"
echo "🌐 Frontend: http://34.168.212.188:3000"
echo "🔧 Backend API: http://34.168.212.188:7860"
echo ""
echo "To manage:"
echo "  pm2 status"
echo "  pm2 logs"