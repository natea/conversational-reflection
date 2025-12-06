# Cost-Optimized Multi-Service Dockerfile
# Using Alpine Linux for minimal footprint and multi-stage builds

# Stage 1: Build frontend
FROM node:18-alpine AS frontend-builder
WORKDIR /app/frontend
COPY ginger_rp/package*.json ./
RUN npm ci --only=production && npm cache clean --force
COPY ginger_rp/ ./
RUN npm run build

# Stage 2: Build MCP servers
FROM node:18-alpine AS mcp-builder
WORKDIR /app/mcp
# Build each MCP server separately to minimize layer size
COPY src/mcp-servers/private-journal-mcp/package*.json ./private-journal-mcp/
WORKDIR /app/mcp/private-journal-mcp
RUN npm ci --only=production && npm run build
WORKDIR /app/mcp
COPY src/mcp-servers/sable-mcp/package*.json ./sable-mcp/
WORKDIR /app/mcp/sable-mcp
RUN npm ci --only=production && npm run build

# Stage 3: Production image with minimal services
FROM python:3.13-slim-bookworm

# Install system dependencies efficiently
RUN apt-get update && apt-get install -y \
    nodejs \
    npm \
    nginx \
    supervisor \
    curl \
    && rm -rf /var/lib/apt/lists/* \
    && apt-get clean

# Set up Python environment
WORKDIR /app
RUN python -m venv /opt/venv
ENV PATH="/opt/venv/bin:$PATH"

# Copy and install Python dependencies with minimal cache
COPY pipecat/pyproject.toml pipecat/uv.lock ./
RUN pip install --no-cache-dir uv && \
    uv sync --frozen --no-dev && \
    rm -rf /root/.cache/uv

# Copy application code
COPY pipecat/ ./pipecat/
COPY --from=frontend-builder /app/frontend/.next/ ./frontend/.next/
COPY --from=frontend-builder /app/frontend/public/ ./frontend/public/
COPY --from=frontend-builder /app/frontend/node_modules/ ./frontend/node_modules/
COPY --from=frontend-builder /app/frontend/next.config.js ./frontend/
COPY --from=mcp-builder /app/mcp/ ./mcp/

# Create non-root user for security
RUN useradd -m -u 1000 appuser && \
    chown -R appuser:appuser /app
USER appuser

# Expose ports
EXPOSE 3000 8080 8000

# Health check
HEALTHCHECK --interval=60s --timeout=10s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:8080/health || exit 1

# Start script will handle service orchestration
CMD ["./start.sh"]