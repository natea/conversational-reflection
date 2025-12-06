#!/bin/bash

# Setup MCP servers
echo "Setting up MCP servers..."

# Setup sable-mcp (requires sable-cli)
echo "Setting up sable-mcp..."
cd src/mcp-servers/sable-mcp
npm install && npm run build

# Setup imessage-mcp (requires Full Disk Access on macOS)
echo "Setting up imessage-mcp..."
cd ../imessage-mcp
npm install && npm run build
if [[ "$OSTYPE" == "darwin"* ]]; then
    echo "Note: imessage-mcp requires Full Disk Access permissions for Terminal on macOS"
    echo "To enable: System Settings → Privacy & Security → Full Disk Access → Add Terminal"
fi

# Setup private-journal-mcp (no additional dependencies)
echo "Setting up private-journal-mcp..."
cd ../private-journal-mcp
npm install && npm run build

# Go back to project root and start services
cd ../../..
cd pipecat;
uv run bot.py --transport webrtc &
cp ../ginger_rp/.env.local.example ../ginger_rp/.env.local
cd ../ginger_rp;
npm i
npm run dev &