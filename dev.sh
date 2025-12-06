#!/bin/bash

# Conversational Reflection - Development Server Script
# Usage: ./dev.sh [start|stop|restart|status]

set -e

PROJECT_DIR="$(cd "$(dirname "$0")" && pwd)"
FRONTEND_DIR="$PROJECT_DIR/frontend"
BACKEND_DIR="$PROJECT_DIR/backend"
PID_DIR="$PROJECT_DIR/.pids"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Create PID directory if it doesn't exist
mkdir -p "$PID_DIR"

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

    # Start backend with uv
    uv run bot.py --transport webrtc > "$PID_DIR/backend.log" 2>&1 &
    echo $! > "$PID_DIR/backend.pid"

    log_success "Backend started (PID: $(cat "$PID_DIR/backend.pid"))"
    log_info "Backend logs: $PID_DIR/backend.log"
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

    # Start frontend
    npm run dev > "$PID_DIR/frontend.log" 2>&1 &
    echo $! > "$PID_DIR/frontend.pid"

    log_success "Frontend started (PID: $(cat "$PID_DIR/frontend.pid"))"
    log_info "Frontend logs: $PID_DIR/frontend.log"
}

stop_backend() {
    if [ -f "$PID_DIR/backend.pid" ]; then
        local pid=$(cat "$PID_DIR/backend.pid")
        if kill -0 "$pid" 2>/dev/null; then
            log_info "Stopping backend (PID: $pid)..."
            kill "$pid" 2>/dev/null || true
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

    echo ""
}

show_logs() {
    local service="$1"
    case "$service" in
        backend)
            if [ -f "$PID_DIR/backend.log" ]; then
                tail -f "$PID_DIR/backend.log"
            else
                log_error "No backend logs found"
            fi
            ;;
        frontend)
            if [ -f "$PID_DIR/frontend.log" ]; then
                tail -f "$PID_DIR/frontend.log"
            else
                log_error "No frontend logs found"
            fi
            ;;
        *)
            log_error "Usage: $0 logs [backend|frontend]"
            ;;
    esac
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
        echo "Use './dev.sh logs backend' or './dev.sh logs frontend' to view logs"
        echo "Use './dev.sh stop' to stop all services"
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
    logs)
        show_logs "$2"
        ;;
    *)
        echo "Conversational Reflection - Development Server"
        echo ""
        echo "Usage: $0 {start|stop|restart|status|logs}"
        echo ""
        echo "Commands:"
        echo "  start    Start both frontend and backend servers"
        echo "  stop     Stop all running servers"
        echo "  restart  Restart all servers"
        echo "  status   Show running status of all servers"
        echo "  logs     View logs (usage: $0 logs [backend|frontend])"
        echo ""
        exit 1
        ;;
esac
