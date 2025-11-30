#!/bin/bash
#
# Conversational Reflection - Quick Start Setup
# Creates a viral video of AI-assisted emotional role-play coaching
#

set -e

echo "🎭 Conversational Reflection - Quick Start Setup"
echo "================================================"
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Check macOS
if [[ "$OSTYPE" != "darwin"* ]]; then
    echo -e "${RED}❌ This tool requires macOS for iMessage access${NC}"
    exit 1
fi

echo -e "${BLUE}📋 Checking prerequisites...${NC}"

# Check Node.js
if ! command -v node &> /dev/null; then
    echo -e "${RED}❌ Node.js is not installed. Please install Node.js 18+${NC}"
    echo "   brew install node"
    exit 1
fi

NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 18 ]; then
    echo -e "${RED}❌ Node.js 18+ required. Current version: $(node -v)${NC}"
    exit 1
fi
echo -e "${GREEN}✓ Node.js $(node -v)${NC}"

# Check Python
if ! command -v python3 &> /dev/null; then
    echo -e "${RED}❌ Python 3 is not installed. Please install Python 3.10+${NC}"
    echo "   brew install python@3.11"
    exit 1
fi
echo -e "${GREEN}✓ Python $(python3 --version)${NC}"

# Check uv (Python package manager)
if ! command -v uv &> /dev/null; then
    echo -e "${YELLOW}⚠ uv not found. Installing...${NC}"
    curl -LsSf https://astral.sh/uv/install.sh | sh
    export PATH="$HOME/.local/bin:$PATH"
fi
echo -e "${GREEN}✓ uv installed${NC}"

# Check for Full Disk Access
echo ""
echo -e "${YELLOW}📱 iMessage Access Check${NC}"
echo "   To read iMessage history, your terminal needs Full Disk Access."
echo "   System Settings → Privacy & Security → Full Disk Access"
echo "   Add your terminal app (Terminal, iTerm, VS Code, etc.)"
echo ""
read -p "Press Enter when Full Disk Access is granted..."

# Step 1: Install Node.js dependencies
echo ""
echo -e "${BLUE}📦 Step 1: Installing Node.js dependencies...${NC}"
npm install

# Step 2: Build TypeScript
echo ""
echo -e "${BLUE}🔨 Step 2: Building TypeScript...${NC}"
npm run build

# Step 3: Set up Pipecat Python environment
echo ""
echo -e "${BLUE}🐍 Step 3: Setting up Pipecat voice bot...${NC}"
cd pipecat
uv sync
cd ..

# Step 4: Configure API keys
echo ""
echo -e "${BLUE}🔑 Step 4: Configuring API keys...${NC}"

if [ ! -f "pipecat/.env" ]; then
    cp pipecat/env.example pipecat/.env
    echo -e "${YELLOW}⚠ Created pipecat/.env from template${NC}"
    echo ""
    echo "Please add your API keys to pipecat/.env:"
    echo "  - DEEPGRAM_API_KEY (Speech-to-Text)"
    echo "  - OPENAI_API_KEY or ANTHROPIC_API_KEY (LLM)"
    echo "  - CARTESIA_API_KEY (Text-to-Speech)"
    echo ""
    echo "Get keys from:"
    echo "  • Deepgram: https://console.deepgram.com/"
    echo "  • OpenAI: https://platform.openai.com/api-keys"
    echo "  • Anthropic: https://console.anthropic.com/"
    echo "  • Cartesia: https://play.cartesia.ai/"
    echo ""
    read -p "Press Enter after adding your API keys..."
else
    echo -e "${GREEN}✓ pipecat/.env already exists${NC}"
fi

# Step 5: Summary
echo ""
echo -e "${GREEN}================================================${NC}"
echo -e "${GREEN}🎉 Setup Complete!${NC}"
echo -e "${GREEN}================================================${NC}"
echo ""
echo "To start the role-play coaching bot:"
echo ""
echo -e "  ${BLUE}cd pipecat${NC}"
echo -e "  ${BLUE}uv run bot.py${NC}"
echo ""
echo "Then open the web interface at: http://localhost:7860"
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo -e "${YELLOW}🎬 TO CREATE A VIRAL VIDEO:${NC}"
echo ""
echo "1. Tell the bot: 'I want to practice a tough conversation with my mom'"
echo "2. It will analyze your iMessage history for conflict patterns"  
echo "3. Start role-playing - the bot plays your difficult person"
echo "4. Practice setting boundaries and handling guilt trips"
echo "5. Say 'start recording' to capture the session"
echo "6. After the breakthrough moment, say 'stop recording'"
echo "7. Say 'generate video for TikTok' to create the clip"
echo ""
echo "The video will be saved to /tmp/roleplay_videos/"
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
