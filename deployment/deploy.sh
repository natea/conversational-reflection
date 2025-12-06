#!/bin/bash

# Ginger Voice Bot Deployment Script
# This script deploys the entire application to a fresh Ubuntu server

set -e

# Configuration
APP_DIR="/opt/ginger-voice-bot"
REPO_URL="https://github.com/your-username/conversational-reflection.git"  # Update this
BRANCH="main"  # Update this
DOMAIN=""  # Set your domain name here, e.g., "ginger.example.com"
EMAIL=""  # Set your email for Let's Encrypt

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Logging
log() {
    echo -e "${GREEN}[$(date +'%Y-%m-%d %H:%M:%S')] $1${NC}"
}

warn() {
    echo -e "${YELLOW}[$(date +'%Y-%m-%d %H:%M:%S')] WARNING: $1${NC}"
}

error() {
    echo -e "${RED}[$(date +'%Y-%m-%d %H:%M:%S')] ERROR: $1${NC}"
    exit 1
}

log "🚀 Starting Ginger Voice Bot deployment..."

# Check if running as root
if [ "$EUID" -ne 0 ]; then
    error "Please run as root (use sudo)"
fi

# Update system
log "Updating system packages..."
apt-get update -y
apt-get upgrade -y

# Install essential packages
log "Installing essential packages..."
apt-get install -y \
    curl \
    wget \
    git \
    build-essential \
    python3 \
    python3-pip \
    python3-venv \
    nginx \
    certbot \
    python3-certbot-nginx \
    supervisor \
    htop \
    unzip \
    ufw \
    jq

# Install Node.js 20.x
log "Installing Node.js..."
curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
apt-get install -y nodejs

# Install uv for Python package management
log "Installing uv..."
curl -LsSf https://astral.sh/uv/install.sh | sh
source $HOME/.cargo/env

# Configure firewall
log "Configuring firewall..."
ufw --force reset
ufw default deny incoming
ufw default allow outgoing
ufw allow ssh
ufw allow 80/tcp
ufw allow 443/tcp
ufw allow 7860/tcp
ufw allow 3000/tcp
ufw allow 10000:20000/udp
ufw --force enable

# Create application directory
log "Creating application directory..."
mkdir -p $APP_DIR
cd $APP_DIR

# Clone repository
log "Cloning application repository..."
git clone $REPO_URL .
git checkout $BRANCH

# Install Python dependencies
log "Installing Python dependencies..."
cd $APP_DIR/pipecat
/opt/uv/bin/uv venv
source $APP_DIR/pipecat/.venv/bin/activate
/opt/uv/bin/uv pip install -e .

# Install MCP server dependencies
log "Installing MCP servers..."
cd $APP_DIR/src/mcp-servers

# sable-mcp
cd sable-mcp
npm install
npm run build
cd ..

# private-journal-mcp
cd private-journal-mcp
npm install
npm run build
cd ..

# imessage-mcp (Linux warning)
cd imessage-mcp
warn "iMessage MCP server requires macOS - installing dependencies but it won't work on Linux"
npm install
npm run build
cd ..

# Build frontend
log "Building frontend..."
cd $APP_DIR/ginger_rp
npm install
npm run build

# Create environment file
log "Creating environment file..."
cd $APP_DIR/pipecat
cat > .env << EOF
# API Keys (replace with your actual keys)
DEEPGRAM_API_KEY=5c7b55dcdf0518a750ded48d7325e4816dc6fbf0
CARTESIA_API_KEY=sk_car_NfamFvnzMcgYcp8JhdCrYe
GOOGLE_API_KEY=AIzaSyAuDQhtxA9KyMKna4H35CEKOuNGLRqyWWM

# Server Configuration
NODE_ENV=production
PORT=7860

# Frontend Configuration
NEXT_PUBLIC_API_URL=http://localhost:7860
EOF

warn "Please update the API keys in $APP_DIR/pipecat/.env with your actual keys"

# Update absolute paths in mcp_config.py
log "Updating MCP configuration..."
sed -i "s|PROJECT_ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))|PROJECT_ROOT = '$APP_DIR'|" $APP_DIR/pipecat/mcp_config.py

# Create systemd service for backend
log "Creating systemd service for backend..."
cat > /etc/systemd/system/ginger-backend.service << EOF
[Unit]
Description=Ginger Voice Bot Backend
After=network.target

[Service]
Type=simple
User=root
WorkingDirectory=$APP_DIR/pipecat
Environment=PATH=$APP_DIR/pipecat/.venv/bin:/usr/local/bin:/usr/bin:/bin
ExecStart=$APP_DIR/pipecat/.venv/bin/python server.py
Restart=always
RestartSec=10
StandardOutput=journal
StandardError=journal

[Install]
WantedBy=multi-user.target
EOF

# Create systemd service for MCP servers
log "Creating systemd service for MCP servers..."
cat > /etc/systemd/system/ginger-mcp.service << EOF
[Unit]
Description=Ginger Voice Bot MCP Servers
After=network.target

[Service]
Type=simple
User=root
WorkingDirectory=$APP_DIR
ExecStart=/bin/bash -c '
    # Start sable-mcp
    cd $APP_DIR/src/mcp-servers/sable-mcp
    node dist/index.js &
    echo \$! > /tmp/sable-mcp.pid

    # Start private-journal-mcp
    cd $APP_DIR/src/mcp-servers/private-journal-mcp
    node dist/index.js &
    echo \$! > /tmp/journal-mcp.pid

    # Wait for all background processes
    wait
'
Restart=always
RestartSec=10
StandardOutput=journal
StandardError=journal

[Install]
WantedBy=multi-user.target
EOF

# Create systemd service for frontend (using PM2)
log "Installing PM2 for frontend management..."
npm install -g pm2

cd $APP_DIR/ginger_rp
cat > ecosystem.config.js << EOF
module.exports = {
  apps: [{
    name: 'ginger-frontend',
    script: 'npm',
    args: 'start',
    cwd: '$APP_DIR/ginger_rp',
    env: {
      NODE_ENV: 'production',
      PORT: 3000
    },
    instances: 'max',
    exec_mode: 'cluster',
    watch: false,
    max_memory_restart: '1G',
    error_file: '$APP_DIR/logs/frontend-error.log',
    out_file: '$APP_DIR/logs/frontend-out.log',
    log_file: '$APP_DIR/logs/frontend-combined.log',
    time: true
  }]
};
EOF

# Create logs directory
mkdir -p $APP_DIR/logs

# Setup Nginx
log "Configuring Nginx..."
cat > /etc/nginx/sites-available/ginger-voice-bot << EOF
server {
    listen 80;
    server_name _;

    # Frontend
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_cache_bypass \$http_upgrade;
    }

    # Backend API
    location /api/ {
        proxy_pass http://localhost:7860;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_cache_bypass \$http_upgrade;
    }

    # WebSocket for WebRTC
    location /ws {
        proxy_pass http://localhost:7860;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
    }
}
EOF

# Enable site
ln -sf /etc/nginx/sites-available/ginger-voice-bot /etc/nginx/sites-enabled/
rm -f /etc/nginx/sites-enabled/default

# Test Nginx config
nginx -t

# Setup SSL if domain provided
if [ ! -z "$DOMAIN" ] && [ ! -z "$EMAIL" ]; then
    log "Setting up SSL certificate for $DOMAIN..."
    certbot --nginx -d $DOMAIN --email $EMAIL --agree-tos --non-interactive --redirect
else
    warn "No domain provided. Skipping SSL setup."
    warn "To enable SSL later, run: certbot --nginx -d yourdomain.com"
fi

# Reload services
log "Reloading services..."
systemctl daemon-reload
systemctl enable ginger-backend
systemctl enable ginger-mcp
systemctl enable nginx

# Start services
log "Starting services..."
systemctl start ginger-backend
systemctl start ginger-mcp
systemctl start nginx

# Start frontend with PM2
cd $APP_DIR/ginger_rp
pm2 start ecosystem.config.js
pm2 save
pm2 startup

# Create deployment status script
log "Creating status script..."
cat > $APP_DIR/status.sh << EOF
#!/bin/bash
echo "=== Ginger Voice Bot Status ==="
echo
echo "Backend Service:"
systemctl is-active ginger-backend
echo
echo "MCP Service:"
systemctl is-active ginger-mcp
echo
echo "Nginx Service:"
systemctl is-active nginx
echo
echo "Frontend (PM2):"
pm2 status ginger-frontend
echo
echo "Port Listeners:"
ss -tlnp | grep -E ':(7860|3000|80|443)'
echo
echo "Recent Logs:"
journalctl -u ginger-backend --no-pager -n 10
EOF

chmod +x $APP_DIR/status.sh

# Health check endpoint
log "Creating health check service..."
cat > /etc/systemd/system/ginger-health.service << EOF
[Unit]
Description=Ginger Voice Bot Health Check
After=network.target

[Service]
Type=oneshot
ExecStart=/usr/bin/curl -f http://localhost:7860/api/status || /usr/bin/systemctl restart ginger-backend
EOF

cat > /etc/systemd/system/ginger-health.timer << EOF
[Unit]
Description=Run Ginger Health Check every minute

[Timer]
OnCalendar=*:*:00

[Install]
WantedBy=timers.target
EOF

systemctl enable ginger-health.timer
systemctl start ginger-health.timer

# Create monitoring script
log "Creating monitoring script..."
cat > $APP_DIR/monitor.sh << EOF
#!/bin/bash
while true; do
    # Check if backend is responding
    if ! curl -f http://localhost:7860/api/status > /dev/null 2>&1; then
        echo "[\$(date)] Backend not responding, restarting..." >> $APP_DIR/logs/monitor.log
        systemctl restart ginger-backend
    fi

    # Check if frontend is responding
    if ! curl -f http://localhost:3000 > /dev/null 2>&1; then
        echo "[\$(date)] Frontend not responding, restarting..." >> $APP_DIR/logs/monitor.log
        cd $APP_DIR/ginger_rp && pm2 restart ginger-frontend
    fi

    # Check disk space
    DISK_USAGE=\$(df / | awk 'NR==2 {print \$5}' | sed 's/%//')
    if [ \$DISK_USAGE -gt 80 ]; then
        echo "[\$(date)] Disk usage high: \$DISK_USAGE%" >> $APP_DIR/logs/monitor.log
    fi

    sleep 60
done
EOF

chmod +x $APP_DIR/monitor.sh

# Create update script
log "Creating update script..."
cat > $APP_DIR/update.sh << EOF
#!/bin/bash
echo "Updating Ginger Voice Bot..."
cd $APP_DIR
git pull origin $BRANCH

# Update Python dependencies
cd $APP_DIR/pipecat
/opt/uv/bin/uv pip install -e .

# Update and rebuild MCP servers
cd $APP_DIR/src/mcp-servers
for dir in sable-mcp private-journal-mcp; do
    cd \$dir
    git pull
    npm install
    npm run build
    cd ..
done

# Update frontend
cd $APP_DIR/ginger_rp
git pull
npm install
npm run build

# Restart services
systemctl restart ginger-backend
systemctl restart ginger-mcp
pm2 restart ginger-frontend

echo "Update complete!"
EOF

chmod +x $APP_DIR/update.sh

# Show final status
log "✅ Deployment complete!"
echo
echo "Deployment Details:"
echo "  Application Directory: $APP_DIR"
echo "  Backend URL: http://$(curl -s ifconfig.me)/api/status"
echo "  Frontend URL: http://$(curl -s ifconfig.me)/"
echo
echo "Useful Commands:"
echo "  Check status: $APP_DIR/status.sh"
echo "  View logs: journalctl -u ginger-backend -f"
echo "  Update application: $APP_DIR/update.sh"
echo "  Monitor health: $APP_DIR/monitor.sh"
echo
warn "Remember to:"
echo "  1. Update API keys in $APP_DIR/pipecat/.env"
echo "  2. Configure domain and SSL if needed"
echo "  3. Check that all services are running properly"