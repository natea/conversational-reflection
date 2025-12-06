#!/bin/bash
# Production deployment script for Ginger Voice Bot on e2-standard-4
set -e

echo "🚀 Deploying Ginger Voice Bot on e2-standard-4 VM (4 vCPU, 16GB RAM)..."
echo "💰 With $1000 credits, we can run this for ~3 months!"

# Update system
export DEBIAN_FRONTEND=noninteractive
apt-get update && apt-get upgrade -y

# Install basic utilities
apt-get install -y curl wget git htop vim unzip software-properties-common \
  build-essential python3-dev python3-pip python3-venv

# Install Docker and Docker Compose
curl -fsSL https://get.docker.com -o get-docker.sh
sh get-docker.sh
systemctl enable docker
systemctl start docker
usermod -aG docker ubuntu

# Install Node.js 20 LTS
curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
apt-get install -y nodejs

# Install Python 3.13
add-apt-repository ppa:deadsnakes/ppa -y
apt-get update
apt-get install -y python3.13 python3.13-venv python3.13-dev

# Install PM2 globally
npm install -g pm2

# Create application directories
mkdir -p /opt/ginger-bot
mkdir -p /opt/ginger-bot/logs
cd /opt/ginger-bot

# Clone the repository
git clone https://github.com/your-username/conversational-reflection.git .
cd conversational-reflection

# Create environment file with all API keys
cat > /opt/ginger-bot/conversational-reflection/.env << 'EOF'
# Production Environment Variables
DEEPGRAM_API_KEY=5c7b55dcdf0518a750ded48d7325e4816dc6fbf0
CARTESIA_API_KEY=sk_car_NfamFvnzMcgYcp8JhdCrYe
GOOGLE_API_KEY=AIzaSyAuDQhtxA9KyMKna4H35CEKOuNGLRqyWWM
NODE_ENV=production
PORT=7860
HOST=0.0.0.0

# WebRTC Configuration
STUN_SERVER=stun:stun.l.google.com:19302

# Resource Limits (now we can handle more!)
MAX_CONCURRENT_USERS=50
WORKER_PROCESSES=4

# Monitoring
LOG_LEVEL=INFO
METRICS_ENABLED=true

# Frontend Configuration
NEXT_PUBLIC_API_URL=http://34.168.212.188:7860
NEXT_PUBLIC_WS_URL=ws://34.168.212.188:7860
EOF

# Setup Python backend
cd /opt/ginger-bot/conversational-reflection/pipecat
python3.13 -m venv venv
source venv/bin/activate

# Install pipecat and dependencies
pip install --upgrade pip
pip install pipecat-ai
pip install python-dotenv loguru
pip install deepmind-software>=0.0.1,<0.1.0

echo "✅ Python backend dependencies installed"

# Setup Node.js dependencies for MCP servers
cd /opt/ginger-bot/conversational-reflection/src/mcp-servers

# Install and build each MCP server
for server in sable-mcp private-journal-mcp; do
  echo "📦 Installing $server..."
  cd $server
  npm install
  npm run build
  cd ..
done

# Setup frontend
cd /opt/ginger-bot/conversational-reflection/ginger_rp
npm install
npm run build

echo "✅ Frontend built successfully"

# Create monitoring dashboard
cat > /opt/ginger-bot/monitor.js << 'EOF'
const http = require('http');
const { exec } = require('child_process');

const server = http.createServer((req, res) => {
  res.writeHead(200, { 'Content-Type': 'application/json' });

  if (req.url === '/health') {
    res.end(JSON.stringify({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      vm: 'e2-standard-4',
      uptime: require('os').uptime()
    }));
  } else if (req.url === '/metrics') {
    exec('pm2 jlist', (error, stdout) => {
      if (error) {
        res.end(JSON.stringify({ error: error.message }));
        return;
      }
      const processes = JSON.parse(stdout);
      res.end(JSON.stringify({
        total_processes: processes.length,
        running: processes.filter(p => p.pm2_env.status === 'online').length,
        memory_usage: processes.reduce((acc, p) => acc + (p.monit?.memory || 0), 0)
      }));
    });
  } else {
    res.end(JSON.stringify({
      message: 'Ginger Voice Bot Monitor',
      endpoints: ['/health', '/metrics']
    }));
  }
});

server.listen(8080, '0.0.0.0', () => {
  console.log('🔍 Monitor server running on port 8080');
});
EOF

# Create a process manager for MCP servers
cat > /opt/ginger-bot/start-mcp-servers.sh << 'EOF'
#!/bin/bash
cd /opt/ginger-bot/conversational-reflection/src/mcp-servers

# Start sable-mcp
echo "🧠 Starting sable-mcp (emotional analysis)..."
cd sable-mcp
npm start &
SABLE_PID=$!
cd ..

# Start private-journal-mcp
echo "📔 Starting private-journal-mcp (long-term memory)..."
cd private-journal-mcp
npm start &
JOURNAL_PID=$!
cd ..

# Save PIDs
echo $SABLE_PID > /tmp/sable-mcp.pid
echo $JOURNAL_PID > /tmp/journal-mcp.pid

echo "✅ All MCP servers started"
EOF

chmod +x /opt/ginger-bot/start-mcp-servers.sh

# Start MCP servers
/opt/ginger-bot/start-mcp-servers.sh

# Start backend with PM2
cd /opt/ginger-bot/conversational-reflection/pipecat
pm2 start bot.py --name "ginger-backend" \
  --interpreter /opt/ginger-bot/conversational-reflection/pipecat/venv/bin/python \
  --log-date-format "YYYY-MM-DD HH:mm:ss Z" \
  --log /opt/ginger-bot/logs/backend.log \
  --error /opt/ginger-bot/logs/backend-error.log

# Start frontend with PM2
cd /opt/ginger-bot/conversational-reflection/ginger_rp
pm2 start npm --name "ginger-frontend" -- start \
  --log-date-format "YYYY-MM-DD HH:mm:ss Z" \
  --log /opt/ginger-bot/logs/frontend.log \
  --error /opt/ginger-bot/logs/frontend-error.log

# Start monitoring server
pm2 start /opt/ginger-bot/monitor.js --name "ginger-monitor" \
  --log-date-format "YYYY-MM-DD HH:mm:ss Z" \
  --log /opt/ginger-bot/logs/monitor.log

# Save PM2 configuration
pm2 save
pm2 startup

# Create Nginx configuration for reverse proxy
apt-get install -y nginx

cat > /etc/nginx/sites-available/ginger-bot << 'EOF'
server {
    listen 80;
    server_name _;

    # Frontend
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }

    # Backend API
    location /api/ {
        proxy_pass http://localhost:7860/;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }

    # WebRTC WebSocket
    location /ws {
        proxy_pass http://localhost:7860;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # Monitoring
    location /admin {
        proxy_pass http://localhost:8080;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    }
}
EOF

# Enable the site
ln -s /etc/nginx/sites-available/ginger-bot /etc/nginx/sites-enabled/
rm -f /etc/nginx/sites-enabled/default

# Test and reload Nginx
nginx -t && systemctl reload nginx

echo ""
echo "🎉 Ginger Voice Bot deployment complete!"
echo ""
echo "📊 VM Configuration:"
echo "   - Type: e2-standard-4 (4 vCPU, 16GB RAM)"
echo "   - Cost: ~$96/month (with $1000 credits, you're set for ~10 months!)"
echo ""
echo "🌐 Access URLs:"
echo "   - Frontend: http://34.168.212.188"
echo "   - API: http://34.168.212.188/api/"
echo "   - Monitoring: http://34.168.212.188/admin"
echo "   - Health: http://34.168.212.188/admin/health"
echo "   - Metrics: http://34.168.212.188/admin/metrics"
echo ""
echo "🔧 Management Commands:"
echo "   - PM2 status: pm2 status"
echo "   - View logs: pm2 logs"
echo "   - Restart all: pm2 restart all"
echo "   - Restart specific: pm2 restart ginger-backend"
echo ""
echo "✨ All services are running with Nginx reverse proxy!"