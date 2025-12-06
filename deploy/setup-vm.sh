#!/bin/bash
# Setup script for Ginger Voice Bot VM
set -e

echo "🚀 Setting up Ginger Voice Bot on e2-micro VM..."

# Update system
apt-get update && apt-get upgrade -y

# Install basic utilities
apt-get install -y curl wget git htop

# Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sh get-docker.sh
systemctl enable docker
systemctl start docker

# Install Docker Compose
curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
chmod +x /usr/local/bin/docker-compose

# Create application directory
mkdir -p /opt/ginger-bot
cd /opt/ginger-bot

# Clone the repository (replace with your actual repo)
git clone https://github.com/your-username/conversational-reflection.git .

# Create production environment file
cat > /opt/ginger-bot/.env << EOF
# Production Environment Variables
DEEPGRAM_API_KEY=5c7b55dcdf0518a750ded48d7325e4816dc6fbf0
CARTESIA_API_KEY=sk_car_NfamFvnzMcgYcp8JhdCrYe
GOOGLE_API_KEY=AIzaSyAuDQhtxA9KyMKna4H35CEKOuNGLRqyWWM
NODE_ENV=production
PORT=7860
HOST=0.0.0.0
EOF

# Build and start services
cd /opt/ginger-bot
docker-compose -f deploy/docker-compose.yml up -d

echo "✅ Setup complete!"
echo "🌐 External IP: $(curl -s ifconfig.me)"
echo "📊 Status check: docker-compose ps"