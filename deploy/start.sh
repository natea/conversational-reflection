#!/bin/bash
# Lightweight service startup script for minimal resource usage

set -e

# Create logs directory
mkdir -p /app/logs

# Function to start a service in background with minimal resources
start_service() {
    local name=$1
    local cmd=$2
    local log_file="/app/logs/${name}.log"

    echo "Starting $name..."
    nohup $cmd > "$log_file" 2>&1 &
    local pid=$!
    echo "$name started with PID: $pid"
    echo $pid > "/app/logs/${name}.pid"
}

# Start Nginx first (reverse proxy)
echo "Configuring Nginx..."
sudo cp /app/nginx.conf /etc/nginx/sites-enabled/default
sudo nginx -g 'daemon off;' &
NGINX_PID=$!
echo $NGINX_PID > /app/logs/nginx.pid

# Start Python backend (main API server)
cd /app/pipecat
source /opt/venv/bin/activate
start_service "backend" "python server.py --host 0.0.0.0 --port 8000"

# Start MCP servers (only the ones needed)
cd /app/mcp/private-journal-mcp
start_service "mcp-journal" "npm start"

# Note: Skip sable-mcp and imessage-mcp in production to save resources
# They require additional system dependencies not needed in cloud deployment

# Start Next.js frontend in production mode (not dev)
cd /app/frontend
start_service "frontend" "npm start"

# Start main bot service
cd /app/pipecat
start_service "bot" "python bot.py --transport webrtc"

echo "All services started successfully!"

# Wait for services
wait $NGINX_PID