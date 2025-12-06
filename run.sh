#!/bin/bash

# Create logs directory with timestamp so each run has its own folder
TIMESTAMP=$(date +"%Y%m%d-%H%M%S")
LOG_DIR="$(pwd)/logs/$TIMESTAMP"
mkdir -p "$LOG_DIR"
echo "Logs will be written to: $LOG_DIR"

echo "Setting up MCP servers..." | tee -a "$LOG_DIR/setup.log"

# Setup sable-mcp (requires sable-cli)
echo "Setting up sable-mcp..." | tee -a "$LOG_DIR/setup.log"
cd src/mcp-servers/sable-mcp
{
    echo "=== npm install ($(date)) ==="
    npm install
    echo "=== npm run build ($(date)) ==="
    npm run build
} >> "$LOG_DIR/sable-mcp.log" 2>&1 || echo "sable-mcp build failed (see $LOG_DIR/sable-mcp.log)" | tee -a "$LOG_DIR/setup.log"

# Setup imessage-mcp (requires Full Disk Access on macOS)
echo "Setting up imessage-mcp..." | tee -a "$LOG_DIR/setup.log"
cd ../imessage-mcp
{
    echo "=== npm install ($(date)) ==="
    npm install
    echo "=== npm run build ($(date)) ==="
    npm run build
} >> "$LOG_DIR/imessage-mcp.log" 2>&1 || echo "imessage-mcp build failed (see $LOG_DIR/imessage-mcp.log)" | tee -a "$LOG_DIR/setup.log"
if [[ "$OSTYPE" == "darwin"* ]]; then
        echo "Note: imessage-mcp requires Full Disk Access permissions for Terminal on macOS" | tee -a "$LOG_DIR/setup.log"
        echo "To enable: System Settings → Privacy & Security → Full Disk Access → Add Terminal" | tee -a "$LOG_DIR/setup.log"
fi

# Setup private-journal-mcp (no additional dependencies)
echo "Setting up private-journal-mcp..." | tee -a "$LOG_DIR/setup.log"
cd ../private-journal-mcp
{
    echo "=== npm install ($(date)) ==="
    npm install
    echo "=== npm run build ($(date)) ==="
    npm run build
} >> "$LOG_DIR/private-journal-mcp.log" 2>&1 || echo "private-journal-mcp build failed (see $LOG_DIR/private-journal-mcp.log)" | tee -a "$LOG_DIR/setup.log"

# Go back to project root and start services
cd ../../..

# Start Pipecat bot with logs
cd pipecat
echo "Starting pipecat bot (uv run)..." | tee -a "$LOG_DIR/setup.log"
nohup uv run bot.py --transport webrtc >> "$LOG_DIR/pipecat-bot.log" 2>&1 &
echo "pipecat bot PID: $!" >> "$LOG_DIR/pids.log"

# Prepare Ginger RP env and start dev server
cp ../ginger_rp/.env.local.example ../ginger_rp/.env.local
cd ../ginger_rp
echo "Installing ginger_rp dependencies..." | tee -a "$LOG_DIR/setup.log"
{
    echo "=== npm install ($(date)) ==="
    npm i
} >> "$LOG_DIR/ginger_rp-install.log" 2>&1 || echo "ginger_rp install failed (see $LOG_DIR/ginger_rp-install.log)" | tee -a "$LOG_DIR/setup.log"

echo "Starting ginger_rp dev server..." | tee -a "$LOG_DIR/setup.log"
nohup npm run dev >> "$LOG_DIR/ginger_rp-dev.log" 2>&1 &
echo "ginger_rp dev PID: $!" >> "$LOG_DIR/pids.log"

echo "All background processes started. PID file: $LOG_DIR/pids.log" | tee -a "$LOG_DIR/setup.log"