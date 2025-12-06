#!/bin/bash

# Conversational Reflection - Development Server Script
# Usage: ./dev.sh [start|stop|restart|status|setup|logs]

set -e

PROJECT_DIR="$(cd "$(dirname "$0")" && pwd)"
FRONTEND_DIR="$PROJECT_DIR/frontend"
BACKEND_DIR="$PROJECT_DIR/backend"
MCP_DIR="$PROJECT_DIR/src/mcp-servers"
PID_DIR="$PROJECT_DIR/.pids"
LOG_DIR="$PROJECT_DIR/logs"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Create directories if they don't exist
mkdir -p "$PID_DIR"
mkdir -p "$LOG_DIR"

log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[OK]${NC} $1"
}

log_warn() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

check_dependencies() {
    # Check for Node.js
    if ! command -v node &> /dev/null; then
        log_error "Node.js is not installed. Please install Node.js 18+."
        exit 1
    fi

    # Check for uv (Python package manager)
    if ! command -v uv &> /dev/null; then
        log_error "uv is not installed. Please install uv: curl -LsSf https://astral.sh/uv/install.sh | sh"
        exit 1
    fi
}

setup_mcp_servers() {
    log_info "Setting up MCP servers..."

    # Create timestamped log directory for this setup run
    local TIMESTAMP=$(date +"%Y%m%d-%H%M%S")
    local SETUP_LOG_DIR="$LOG_DIR/setup-$TIMESTAMP"
    mkdir -p "$SETUP_LOG_DIR"
    log_info "Setup logs: $SETUP_LOG_DIR"

    # Setup sable-mcp
    if [ -d "$MCP_DIR/sable-mcp" ]; then
        log_info "Building sable-mcp..."
        cd "$MCP_DIR/sable-mcp"
        {
            echo "=== npm install ($(date)) ==="
            npm install
            echo "=== npm run build ($(date)) ==="
            npm run build
        } >> "$SETUP_LOG_DIR/sable-mcp.log" 2>&1 && log_success "sable-mcp built" || log_error "sable-mcp build failed (see $SETUP_LOG_DIR/sable-mcp.log)"
    fi

    # Setup imessage-mcp
    if [ -d "$MCP_DIR/imessage-mcp" ]; then
        log_info "Building imessage-mcp..."
        cd "$MCP_DIR/imessage-mcp"
        {
            echo "=== npm install ($(date)) ==="
            npm install
            echo "=== npm run build ($(date)) ==="
            npm run build
        } >> "$SETUP_LOG_DIR/imessage-mcp.log" 2>&1 && log_success "imessage-mcp built" || log_error "imessage-mcp build failed (see $SETUP_LOG_DIR/imessage-mcp.log)"

        if [[ "$OSTYPE" == "darwin"* ]]; then
            log_warn "imessage-mcp requires Full Disk Access on macOS"
            log_info "To enable: System Settings → Privacy & Security → Full Disk Access → Add Terminal"
        fi
    fi

    # Setup private-journal-mcp
    if [ -d "$MCP_DIR/private-journal-mcp" ]; then
        log_info "Building private-journal-mcp..."
        cd "$MCP_DIR/private-journal-mcp"
        {
            echo "=== npm install ($(date)) ==="
            npm install
            echo "=== npm run build ($(date)) ==="
            npm run build
        } >> "$SETUP_LOG_DIR/private-journal-mcp.log" 2>&1 && log_success "private-journal-mcp built" || log_error "private-journal-mcp build failed (see $SETUP_LOG_DIR/private-journal-mcp.log)"
    fi

    cd "$PROJECT_DIR"
    log_success "MCP server setup complete"
}

start_backend() {
    log_info "Starting backend (Pipecat voice bot)..."

    if [ -f "$PID_DIR/backend.pid" ]; then
        local pid=$(cat "$PID_DIR/backend.pid")
        if kill -0 "$pid" 2>/dev/null; then
            log_warn "Backend already running (PID: $pid)"
            return 0
        fi
    fi

    cd "$BACKEND_DIR"

    # Check for .env file
    if [ ! -f ".env" ] && [ -f "env.example" ]; then
        log_warn "No .env file found. Copying from env.example..."
        cp env.example .env
        log_warn "Please update backend/.env with your API keys"
    fi

    # Create timestamped log file
    local TIMESTAMP=$(date +"%Y%m%d-%H%M%S")
    local BACKEND_LOG="$LOG_DIR/backend-$TIMESTAMP.log"

    # Start backend with uv
    nohup uv run bot.py --transport webrtc >> "$BACKEND_LOG" 2>&1 &
    echo $! > "$PID_DIR/backend.pid"

    # Also create symlink to latest log
    ln -sf "$BACKEND_LOG" "$LOG_DIR/backend-latest.log"

    log_success "Backend started (PID: $(cat "$PID_DIR/backend.pid"))"
    log_info "Backend logs: $BACKEND_LOG"
}

start_frontend() {
    log_info "Starting frontend (Next.js)..."

    if [ -f "$PID_DIR/frontend.pid" ]; then
        local pid=$(cat "$PID_DIR/frontend.pid")
        if kill -0 "$pid" 2>/dev/null; then
            log_warn "Frontend already running (PID: $pid)"
            return 0
        fi
    fi

    cd "$FRONTEND_DIR"

    # Check for .env.local file
    if [ ! -f ".env.local" ] && [ -f ".env.local.example" ]; then
        log_warn "No .env.local file found. Copying from .env.local.example..."
        cp .env.local.example .env.local
    fi

    # Install dependencies if needed
    if [ ! -d "node_modules" ]; then
        log_info "Installing frontend dependencies..."
        npm install
    fi

    # Create timestamped log file
    local TIMESTAMP=$(date +"%Y%m%d-%H%M%S")
    local FRONTEND_LOG="$LOG_DIR/frontend-$TIMESTAMP.log"

    # Start frontend
    nohup npm run dev >> "$FRONTEND_LOG" 2>&1 &
    echo $! > "$PID_DIR/frontend.pid"

    # Also create symlink to latest log
    ln -sf "$FRONTEND_LOG" "$LOG_DIR/frontend-latest.log"

    log_success "Frontend started (PID: $(cat "$PID_DIR/frontend.pid"))"
    log_info "Frontend logs: $FRONTEND_LOG"
}

stop_backend() {
    if [ -f "$PID_DIR/backend.pid" ]; then
        local pid=$(cat "$PID_DIR/backend.pid")
        if kill -0 "$pid" 2>/dev/null; then
            log_info "Stopping backend (PID: $pid)..."
            kill "$pid" 2>/dev/null || true
            # Also kill any child processes
            pkill -P "$pid" 2>/dev/null || true
            rm -f "$PID_DIR/backend.pid"
            log_success "Backend stopped"
        else
            log_warn "Backend not running (stale PID file)"
            rm -f "$PID_DIR/backend.pid"
        fi
    else
        log_warn "Backend not running"
    fi
}

stop_frontend() {
    if [ -f "$PID_DIR/frontend.pid" ]; then
        local pid=$(cat "$PID_DIR/frontend.pid")
        if kill -0 "$pid" 2>/dev/null; then
            log_info "Stopping frontend (PID: $pid)..."
            kill "$pid" 2>/dev/null || true
            # Also kill any child processes (Next.js spawns workers)
            pkill -P "$pid" 2>/dev/null || true
            rm -f "$PID_DIR/frontend.pid"
            log_success "Frontend stopped"
        else
            log_warn "Frontend not running (stale PID file)"
            rm -f "$PID_DIR/frontend.pid"
        fi
    else
        log_warn "Frontend not running"
    fi
}

show_status() {
    echo ""
    echo "=== Conversational Reflection Status ==="
    echo ""

    # Backend status
    if [ -f "$PID_DIR/backend.pid" ]; then
        local pid=$(cat "$PID_DIR/backend.pid")
        if kill -0 "$pid" 2>/dev/null; then
            log_success "Backend:  Running (PID: $pid) - ws://localhost:8765"
        else
            log_error "Backend:  Not running (stale PID)"
        fi
    else
        log_warn "Backend:  Not running"
    fi

    # Frontend status
    if [ -f "$PID_DIR/frontend.pid" ]; then
        local pid=$(cat "$PID_DIR/frontend.pid")
        if kill -0 "$pid" 2>/dev/null; then
            log_success "Frontend: Running (PID: $pid) - http://localhost:3000"
        else
            log_error "Frontend: Not running (stale PID)"
        fi
    else
        log_warn "Frontend: Not running"
    fi

    # MCP servers status
    echo ""
    log_info "MCP Servers (built):"
    [ -d "$MCP_DIR/sable-mcp/dist" ] && log_success "  sable-mcp" || log_warn "  sable-mcp (not built)"
    [ -d "$MCP_DIR/imessage-mcp/dist" ] && log_success "  imessage-mcp" || log_warn "  imessage-mcp (not built)"
    [ -d "$MCP_DIR/private-journal-mcp/dist" ] && log_success "  private-journal-mcp" || log_warn "  private-journal-mcp (not built)"

    echo ""
}

show_logs() {
    local service="$1"
    case "$service" in
        backend)
            if [ -f "$LOG_DIR/backend-latest.log" ]; then
                tail -f "$LOG_DIR/backend-latest.log"
            else
                log_error "No backend logs found. Start the backend first."
            fi
            ;;
        frontend)
            if [ -f "$LOG_DIR/frontend-latest.log" ]; then
                tail -f "$LOG_DIR/frontend-latest.log"
            else
                log_error "No frontend logs found. Start the frontend first."
            fi
            ;;
        all)
            log_info "Tailing all logs (Ctrl+C to stop)..."
            tail -f "$LOG_DIR/backend-latest.log" "$LOG_DIR/frontend-latest.log" 2>/dev/null || log_error "No logs found"
            ;;
        *)
            log_error "Usage: $0 logs [backend|frontend|all]"
            ;;
    esac
}

clean_logs() {
    log_info "Cleaning old logs..."
    # Keep only the 10 most recent log files per service
    cd "$LOG_DIR"
    ls -t backend-*.log 2>/dev/null | tail -n +11 | xargs rm -f 2>/dev/null || true
    ls -t frontend-*.log 2>/dev/null | tail -n +11 | xargs rm -f 2>/dev/null || true
    # Clean old setup directories (keep last 5)
    ls -dt setup-* 2>/dev/null | tail -n +6 | xargs rm -rf 2>/dev/null || true
    log_success "Old logs cleaned"
}

case "$1" in
    start)
        check_dependencies
        echo ""
        echo "=== Starting Conversational Reflection ==="
        echo ""
        start_backend
        sleep 2  # Give backend time to initialize
        start_frontend
        echo ""
        log_success "All services started!"
        echo ""
        echo "  Frontend: http://localhost:3000"
        echo "  Backend:  ws://localhost:8765"
        echo ""
        echo "Commands:"
        echo "  ./dev.sh logs backend   - View backend logs"
        echo "  ./dev.sh logs frontend  - View frontend logs"
        echo "  ./dev.sh logs all       - View all logs"
        echo "  ./dev.sh stop           - Stop all services"
        echo ""
        ;;
    stop)
        echo ""
        echo "=== Stopping Conversational Reflection ==="
        echo ""
        stop_frontend
        stop_backend
        echo ""
        ;;
    restart)
        $0 stop
        sleep 1
        $0 start
        ;;
    status)
        show_status
        ;;
    setup)
        check_dependencies
        echo ""
        echo "=== Setting Up MCP Servers ==="
        echo ""
        setup_mcp_servers
        echo ""
        ;;
    logs)
        show_logs "$2"
        ;;
    clean)
        clean_logs
        ;;
    *)
        echo "Conversational Reflection - Development Server"
        echo ""
        echo "Usage: $0 {start|stop|restart|status|setup|logs|clean}"
        echo ""
        echo "Commands:"
        echo "  start    Start both frontend and backend servers"
        echo "  stop     Stop all running servers"
        echo "  restart  Restart all servers"
        echo "  status   Show running status of all servers"
        echo "  setup    Build MCP servers (sable, imessage, private-journal)"
        echo "  logs     View logs (usage: $0 logs [backend|frontend|all])"
        echo "  clean    Remove old log files (keeps last 10)"
        echo ""
        echo "First time setup:"
        echo "  1. Copy backend/env.example to backend/.env and add API keys"
        echo "  2. Run './dev.sh setup' to build MCP servers"
        echo "  3. Run './dev.sh start' to start all services"
        echo ""
        exit 1
        ;;
esac
