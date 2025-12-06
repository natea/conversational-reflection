#!/bin/bash
# Startup script for Ginger Voice Bot

# Create app directory
mkdir -p /opt/ginger-bot
cd /opt/ginger-bot

# Install Node.js and Python
curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
apt-get update
apt-get install -y nodejs python3 python3-pip python3-venv git

# Clone the app
git clone https://github.com/your-username/conversational-reflection.git .
cd conversational-reflection

# Setup environment
cat > /opt/ginger-bot/.env << 'EOF'
DEEPGRAM_API_KEY=5c7b55dcdf0518a750ded48d7325e4816dc6fbf0
CARTESIA_API_KEY=sk_car_NfamFvnzMcgYcp8JhdCrYe
GOOGLE_API_KEY=AIzaSyAuDQhtxA9KyMKna4H35CEKOuNGLRqyWWM
NODE_ENV=production
EOF

# Install PM2 globally
npm install -g pm2

# Setup and start frontend
cd ginger_rp
npm install
npm run build
pm2 start npm --name "frontend" -- start

# Return to root
cd ..

# Setup backend
cd pipecat
python3 -m venv venv
source venv/bin/activate
pip install --upgrade pip
# Install minimal requirements
pip install pipecat-ai python-dotenv loguru

# Start backend
pm2 start bot.py --name "backend" --interpreter venv/bin/python

# Save PM2 configuration
pm2 save
pm2 startup

# Create a simple health check server
cat > /opt/ginger-bot/healthcheck.py << 'EOF'
from http.server import HTTPServer, BaseHTTPRequestHandler
import json

class HealthHandler(BaseHTTPRequestHandler):
    def do_GET(self):
        self.send_response(200)
        self.send_header('Content-type', 'application/json')
        self.end_headers()
        self.wfile.write(json.dumps({"status": "healthy"}).encode())

HTTPServer(('0.0.0.0', 8080), HealthHandler).serve_forever()
EOF

# Start health check
pm2 start /opt/ginger-bot/healthcheck.py --name "healthcheck" --interpreter python3

echo "✅ Ginger Voice Bot started successfully!"
echo "External IP: $(curl -s ifconfig.me)"
echo "Frontend: http://$(curl -s ifconfig.me):3000"
echo "Health: http://$(curl -s ifconfig.me):8080"