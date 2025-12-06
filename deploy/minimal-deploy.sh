#!/bin/bash
# Minimal deployment for e2-micro VM
set -e

echo "🚀 Minimal deployment for Ginger Voice Bot..."

# Copy the application
cd /tmp
git clone https://github.com/your-username/conversational-reflection.git
cd conversational-reflection

# Create production environment
cp pipecat/.env .env

# Install Python 3.13
add-apt-repository ppa:deadsnakes/ppa -y
apt-get update
apt-get install -y python3.13 python3.13-venv python3.13-dev

# Install Node.js
curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
apt-get install -y nodejs

# Setup Python backend
cd /opt/conversational-reflection/pipecat
python3.13 -m venv venv
source venv/bin/activate
pip install --upgrade pip
pip install -e .

# Setup frontend
cd /opt/conversational-reflection/ginger_rp
npm install
npm run build

# Install PM2
npm install -g pm2

# Start services with PM2
cd /opt/conversational-reflection

# Start backend
pm2 start pipecat/bot.py --name "ginger-backend" --interpreter /opt/conversational-reflection/pipecat/venv/bin/python

# Start frontend
pm2 start "npm start" --name "ginger-frontend" --cwd /opt/conversational-reflection/ginger_rp

# Save PM2 config
pm2 save
pm2 startup

echo "✅ Deployment complete!"
echo "🌐 Frontend: http://$(curl -s ifconfig.me):3000"
echo "🔧 PM2 status: pm2 status"