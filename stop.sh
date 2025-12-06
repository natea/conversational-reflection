#!/bin/bash

# Stop script for Ginger Voice Bot
# Kills the Pipecat backend and Next.js frontend processes

echo "🛑 Stopping Ginger Voice Bot..."

# Find and kill the Pipecat bot process
echo "🤖 Stopping Pipecat bot..."
BOT_PID=$(pgrep -f "bot.py --transport webrtc")
if [ -n "$BOT_PID" ]; then
    kill $BOT_PID
    echo "✅ Pipecat bot (PID: $BOT_PID) stopped"
else
    echo "ℹ️  Pipecat bot not found"
fi

# Find and kill the Next.js dev server
echo "🌐 Stopping Next.js frontend..."
FRONTEND_PID=$(pgrep -f "next dev")
if [ -n "$FRONTEND_PID" ]; then
    kill $FRONTEND_PID
    echo "✅ Next.js frontend (PID: $FRONTEND_PID) stopped"
else
    echo "ℹ️  Next.js frontend not found"
fi

# Also check for uv run bot.py processes
UV_BOT_PID=$(pgrep -f "uv run bot.py")
if [ -n "$UV_BOT_PID" ]; then
    kill $UV_BOT_PID
    echo "✅ UV bot process (PID: $UV_BOT_PID) stopped"
fi

# Wait a moment for processes to terminate
sleep 2

# Verify processes are stopped
if pgrep -f "bot.py --transport webrtc" > /dev/null || pgrep -f "uv run bot.py" > /dev/null || pgrep -f "next dev" > /dev/null; then
    echo "⚠️  Some processes are still running. Force killing..."
    pkill -9 -f "bot.py"
    pkill -9 -f "uv run bot.py"
    pkill -9 -f "next dev"
fi

echo "🎉 All processes stopped!"