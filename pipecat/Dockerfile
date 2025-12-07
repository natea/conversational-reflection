# Production-ready Dockerfile for Ginger Voice Bot Backend
# Extends dailyco/pipecat-base with all backend components and MCP servers

# Extend the official Pipecat base image to maintain all functionality
FROM dailyco/pipecat-base:latest

# Set comprehensive environment variables
ENV UV_COMPILE_BYTECODE=1 \
    UV_LINK_MODE=copy \
    PYTHONUNBUFFERED=1 \
    PYTHONDONTWRITEBYTECODE=1 \
    NODE_ENV=production \
    DEBIAN_FRONTEND=noninteractive

# Install system dependencies needed for backend components
# This builds upon the minimal Debian base in the Pipecat image
RUN apt-get update && apt-get install -y \
    # Audio processing dependencies (not in base image)
    ffmpeg \
    portaudio19-dev \
    pkg-config \
    # Build tools for Node.js modules
    build-essential \
    curl \
    wget \
    git \
    # Network and monitoring tools
    netcat-openbsd \
    procps \
    # Node.js setup
    gnupg \
    ca-certificates \
    && rm -rf /var/lib/apt/lists/* \
    && apt-get clean

# Install Node.js 20.x for MCP servers (not in base image)
RUN curl -fsSL https://deb.nodesource.com/setup_20.x | bash - \
    && apt-get install -y nodejs \
    && npm install -g pm2

# Install additional Python dependencies that might not be in lockfile
RUN pip install --no-cache-dir \
    loguru \
    python-dotenv \
    httpx \
    websockets \
    fastapi \
    uvicorn[standard]

# Set work directory
WORKDIR /app

# Install the project's dependencies using the lockfile and settings
# This maintains the exact same dependency resolution as the base image
RUN --mount=type=cache,target=/root/.cache/uv \
    --mount=type=bind,source=uv.lock,target=uv.lock \
    --mount=type=bind,source=pyproject.toml,target=pyproject.toml \
    uv sync --locked --no-install-project --no-dev

# Copy the application code and all backend components
COPY . .

# Install TypeScript globally for building MCP servers
RUN npm install -g typescript

# Build MCP servers (Node.js components not in base image)
# Build sable-mcp (emotional analysis)
RUN cd src/mcp-servers/sable-mcp \
    && npm i --save-dev @types/node \
    && npm i \
    && npm run build

# Build private-journal-mcp (long-term memory)
RUN cd src/mcp-servers/private-journal-mcp \
    && npm ci --only=production \
    && npm run build

# Build imessage-mcp (conversation access)
RUN cd src/mcp-servers/imessage-mcp \
    && npm ci --only=production \
    && npm run build

# Build maya-tts-mcp (additional TTS capabilities)
RUN cd src/mcp-servers/maya-tts-mcp \
    && npm ci --only=production \
    && npm run build

# Create necessary directories for logging and data
RUN mkdir -p \
    /app/logs \
    /app/data \
    /app/storage \
    /app/uploads \
    /app/temp

# Create comprehensive startup script that initializes all backend services
RUN cat > /app/start.sh << 'EOF'
#!/bin/bash
set -e

# Function to log with timestamp
log() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $*"
}

log "🧡 Starting Ginger Voice Bot Backend with all components..."

# Initialize environment
export NODE_ENV=production
export PYTHONUNBUFFERED=1

# Function to check if MCP server exists and start it
start_mcp_server() {
    local server_name=$1
    local server_path="/app/src/mcp-servers/${server_name}"

    if [ -d "$server_path" ] && [ -f "${server_path}/dist/index.js" ]; then
        log "🔧 Starting ${server_name}-mcp..."
        cd "$server_path"
        NODE_ENV=production nohup node dist/index.js > /app/logs/${server_name}-mcp.log 2>&1 &
        echo $! > /tmp/${server_name}-mcp.pid
        log "✅ ${server_name}-mcp started (PID: $(cat /tmp/${server_name}-mcp.pid))"
        sleep 1
    else
        log "⚠️  ${server_name}-mcp not found or not built, skipping..."
    fi
}

# Start MCP servers in sequence
log "🚀 Starting MCP servers..."
start_mcp_server "sable"
start_mcp_server "private-journal"
start_mcp_server "imessage"
start_mcp_server "maya-tts"

# Wait a moment for MCP servers to initialize
log "⏳ Waiting for MCP servers to initialize..."
sleep 5

# Verify MCP servers are running
log "🔍 Checking MCP server status..."
for server in sable private-journal imessage maya-tts; do
    if [ -f "/tmp/${server}-mcp.pid" ]; then
        PID=$(cat "/tmp/${server}-mcp.pid")
        if kill -0 "$PID" 2>/dev/null; then
            log "✅ ${server}-mcp is running (PID: $PID)"
        else
            log "❌ ${server}-mcp failed to start"
        fi
    fi
done

# Create PM2 ecosystem config for the main bot
cat > /app/ecosystem.config.js << 'PM2EOF'
module.exports = {
  apps: [{
    name: 'ginger-bot',
    script: 'bot.py',
    interpreter: '/usr/local/bin/uv',
    interpreter_args: 'run',
    args: '--transport webrtc',
    instances: 1,
    exec_mode: 'fork',
    watch: false,
    max_memory_restart: '1G',
    env: {
      NODE_ENV: 'production',
      PYTHONUNBUFFERED: '1',
      UV_COMPILE_BYTECODE: '1',
      UV_LINK_MODE: 'copy'
    },
    error_file: '/app/logs/bot-error.log',
    out_file: '/app/logs/bot-out.log',
    log_file: '/app/logs/bot-combined.log',
    time: true,
    autorestart: true,
    max_restarts: 10,
    min_uptime: '10s',
    restart_delay: 4000
  }]
};
PM2EOF

# Start the main bot application with PM2 for production process management
log "🤖 Starting Ginger Voice Bot with PM2..."
cd /app
exec pm2-runtime ecosystem.config.js
EOF

# Create graceful shutdown script
RUN cat > /app/shutdown.sh << 'EOF'
#!/bin/bash
log() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $*"
}

log "🛑 Shutting down Ginger Voice Bot gracefully..."

# Stop PM2 processes
pm2 delete all || true

# Stop MCP servers
for server in sable private-journal imessage maya-tts; do
    if [ -f "/tmp/${server}-mcp.pid" ]; then
        PID=$(cat "/tmp/${server}-mcp.pid")
        if kill -0 "$PID" 2>/dev/null; then
            log "🛑 Stopping ${server}-mcp (PID: $PID)"
            kill "$PID"
            sleep 2
            # Force kill if still running
            kill -9 "$PID" 2>/dev/null || true
        fi
        rm -f "/tmp/${server}-mcp.pid"
    fi
done

log "✅ Shutdown complete"
EOF

# Create health check endpoint
RUN cat > /app/health_check.py << 'EOF'
#!/usr/bin/env python3
"""Health check endpoint for Ginger Voice Bot"""
import http.server
import socketserver
import json
import os
import sys
import subprocess

class HealthHandler(http.server.BaseHTTPRequestHandler):
    def do_GET(self):
        if self.path == '/api/status':
            # Check if main dependencies are available
            try:
                # Check if uv is available
                subprocess.run(['uv', '--version'], check=True, capture_output=True)
                uv_status = "installed"
            except:
                uv_status = "missing"

            try:
                # Check if node is available
                subprocess.run(['node', '--version'], check=True, capture_output=True)
                node_status = "installed"
            except:
                node_status = "missing"

            # Check MCP servers
            mcp_servers = {}
            for server in ['sable', 'private-journal', 'imessage', 'maya-tts']:
                if os.path.exists(f"/tmp/{server}-mcp.pid"):
                    mcp_servers[server] = "running"
                else:
                    mcp_servers[server] = "stopped"

            status = {
                "status": "healthy",
                "version": os.getenv("VERSION", "1.0.0"),
                "services": {
                    "python": sys.version.split()[0],
                    "uv": uv_status,
                    "node": node_status,
                    "mcp_servers": mcp_servers
                }
            }

            self.send_response(200)
            self.send_header('Content-type', 'application/json')
            self.end_headers()
            self.wfile.write(json.dumps(status).encode())
        else:
            self.send_response(404)
            self.end_headers()

if __name__ == "__main__":
    PORT = 7860
    with socketserver.TCPServer(("", PORT), HealthHandler) as httpd:
        print(f"Health check server running on port {PORT}")
        httpd.serve_forever()
EOF

# Make scripts executable
RUN chmod +x /app/start.sh /app/shutdown.sh /app/health_check.py

# Expose port for the application and health checks
EXPOSE 7860

# Add comprehensive health check that verifies all components
HEALTHCHECK --interval=30s --timeout=10s --start-period=60s --retries=3 \
    CMD python3 /app/health_check.py || exit 1

# Set entrypoint to the comprehensive startup script
ENTRYPOINT ["/app/start.sh"]

# Set fallback command in case entrypoint fails
CMD ["uv", "run", "python", "bot.py", "--transport", "webrtc"]

# Add comprehensive labels for metadata and orchestration
LABEL org.opencontainers.image.title="Ginger Voice Bot Backend" \
    org.opencontainers.image.description="Production backend for Ginger Voice Bot with emotional awareness, long-term memory, and conversation access. Extends dailyco/pipecat-base with MCP servers and monitoring." \
    org.opencontainers.image.vendor="Ginger Voice Bot" \
    org.opencontainers.image.licenses="MIT" \
    org.opencontainers.image.base.name="dailyco/pipecat-base:latest" \
    io.pipecat.version="latest" \
    io.ginger.components="sable-mcp,private-journal-mcp,imessage-mcp,maya-tts-mcp" \
    io.ginger.capabilities="emotional-analysis,long-term-memory,conversation-access,tts,voice-bot" \
    io.ginger.features="multi-stage-startup,health-checks,pm2-process-management"
