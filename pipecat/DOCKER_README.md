# Ginger Voice Bot Docker Deployment

This document provides comprehensive instructions for deploying the Ginger Voice Bot backend using Docker and Docker Compose.

## Overview

The Ginger Voice Bot is a sophisticated conversational AI system with emotional awareness, built on the Pipecat framework. This Docker configuration includes:

- **Base Image**: Extends `dailyco/pipecat-base:latest` with all Pipecat functionality preserved
- **MCP Servers**: Model Context Protocol servers for emotional analysis, memory, and conversation access
- **Production Process Management**: PM2 for robust process management and monitoring
- **Health Monitoring**: Comprehensive health checks and status endpoints
- **Optimized Build**: Multi-layer caching and efficient dependency management

## Architecture

### Backend Components

1. **Core Voice Bot** (`bot.py`)
   - Pipecat-based voice AI with WebRTC transport
   - Deepgram STT, Google LLM, Cartesia TTS
   - Emotional expression via EmotiveTTSProcessor

2. **MCP Servers**
   - **sable-mcp**: Emotional analysis using Damasio's consciousness model
   - **private-journal-mcp**: Long-term semantic memory and journaling
   - **imessage-mcp**: Access to user's iMessage conversations
   - **maya-tts-mcp**: Additional text-to-speech capabilities

3. **Supporting Services**
   - PM2 process manager for production reliability
   - Health check endpoint at `/api/status`
   - Comprehensive logging to `/app/logs`

### Docker Layers

```
dailyco/pipecat-base:latest
├── System dependencies (ffmpeg, nodejs, build tools)
├── Python dependencies (via uv)
├── Node.js dependencies and MCP servers
├── Application code
└── Runtime configuration and startup scripts
```

## Quick Start

### Prerequisites

- Docker 20.0+ and Docker Compose 2.0+
- Required API keys (see Environment Variables section)
- At least 2GB RAM and 4GB disk space

### Environment Variables

Create a `.env` file with the following required variables:

```bash
# AI Service API Keys
DEEPGRAM_API_KEY=your_deepgram_api_key
CARTESIA_API_KEY=your_cartesia_api_key
GOOGLE_API_KEY=your_google_api_key

# Optional Configuration
CARTESIA_VOICE_ID=6ccbfb76-1fc6-48f7-b71d-91ac6298247b  # Default: Tessa
NODE_ENV=production
PYTHONUNBUFFERED=1
```

### Single Container Deployment

```bash
# Build the image
docker build -t ginger-voice-bot .

# Run the container
docker run -d \
  --name ginger-bot \
  --env-file .env \
  -p 7860:7860 \
  -v $(pwd)/logs:/app/logs \
  -v $(pwd)/data:/app/data \
  ginger-voice-bot
```

### Docker Compose Deployment

Use the provided Docker Compose configuration for full-stack deployment:

```bash
# Navigate to deployment directory
cd deployment

# Copy and configure environment file
cp .env.example .env
# Edit .env with your API keys

# Start all services
docker-compose up -d

# View logs
docker-compose logs -f backend

# Check status
curl http://localhost:7860/api/status
```

## Configuration

### MCP Server Configuration

MCP servers are configured in `mcp_config.py`. The Docker container automatically builds and starts:

1. **sable-mcp**: Emotional consciousness model
2. **private-journal-mcp**: Semantic memory and journaling
3. **imessage-mcp**: Conversation access (macOS only)
4. **maya-tts-mcp**: Additional TTS capabilities

### Port Configuration

- **7860**: Main application and health check endpoint
- **WebRTC**: Dynamic ports for real-time communication

### Volume Configuration

Recommended volume mounts for data persistence:

```yaml
volumes:
  - ./logs:/app/logs          # Application logs
  - ./data:/app/data          # Runtime data
  - ./storage:/app/storage    # Persistent storage
  - ./uploads:/app/uploads    # File uploads
```

## Health Monitoring

### Health Check Endpoint

Access health status at: `http://localhost:7860/api/status`

Response format:
```json
{
  "status": "healthy",
  "version": "1.0.0",
  "services": {
    "python": "3.12.12",
    "uv": "installed",
    "node": "v20.10.0",
    "mcp_servers": {
      "sable": "running",
      "private-journal": "running",
      "imessage": "running",
      "maya-tts": "running"
    }
  }
}
```

### Docker Health Checks

Built-in Docker health check:
```bash
docker ps --format "table {{.Names}}\t{{.Status}}"
```

### PM2 Monitoring

Access PM2 monitoring inside the container:
```bash
docker exec -it ginger-bot pm2 monit
```

## Scaling and Performance

### Resource Requirements

- **Minimum**: 2GB RAM, 1 CPU core
- **Recommended**: 4GB RAM, 2+ CPU cores
- **Storage**: 10GB for container and dependencies

### Performance Optimizations

1. **Layer Caching**: Docker layer caching for faster rebuilds
2. **Dependency Management**: UV for efficient Python package management
3. **Process Management**: PM2 for automatic restarts and monitoring
4. **Memory Limits**: Configurable memory limits with automatic restart

### Scaling Considerations

For production scaling:

1. **Horizontal Scaling**: Use Docker Swarm or Kubernetes
2. **Load Balancing**: Nginx or cloud load balancer
3. **Database**: External database for MCP server data
4. **Monitoring**: Prometheus + Grafana integration

## Troubleshooting

### Common Issues

1. **Port Conflicts**
   ```bash
   # Check if port 7860 is in use
   lsof -i :7860
   # Use different port
   docker run -p 8080:7860 ginger-voice-bot
   ```

2. **MCP Server Failures**
   ```bash
   # Check MCP server logs
   docker exec -it ginger-bot tail -f /app/logs/sable-mcp.log
   docker exec -it ginger-bot tail -f /app/logs/private-journal-mcp.log
   ```

3. **Memory Issues**
   ```bash
   # Check container resource usage
   docker stats ginger-bot
   # Increase memory limit
   docker run --memory=4g ginger-voice-bot
   ```

4. **Build Failures**
   ```bash
   # Clean build without cache
   docker build --no-cache -t ginger-voice-bot .
   # Check build logs
   docker build --progress=plain -t ginger-voice-bot .
   ```

### Debug Mode

Run container with debugging enabled:
```bash
docker run -it --entrypoint /bin/bash ginger-voice-bot
```

### Log Analysis

```bash
# View all logs
docker exec -it ginger-bot find /app/logs -name "*.log" -exec tail -f {} \;

# Search for errors
docker exec -it ginger-bot grep -r "ERROR" /app/logs/
```

## Security Considerations

### Container Security

1. **Non-root User**: Runs as non-root user for security
2. **Minimal Base**: Based on slim Debian image
3. **Secrets Management**: Use environment variables for API keys
4. **Network Isolation**: Use Docker networks for service isolation

### API Key Management

```bash
# Use Docker secrets for production
echo "your_api_key" | docker secret create deepgram_key -
```

### SSL/TLS

For production deployments:
```yaml
# In docker-compose.yml
services:
  backend:
    environment:
      - HTTPS=true
      - SSL_CERT_PATH=/app/ssl/cert.pem
    volumes:
      - ./ssl:/app/ssl:ro
```

## Development Workflow

### Local Development

```bash
# Mount source code for development
docker run -it \
  --mount type=bind,source=$(pwd),target=/app \
  --entrypoint /bin/bash \
  ginger-voice-bot
```

### Testing

```bash
# Run tests in container
docker run --rm \
  -v $(pwd):/app \
  ginger-voice-bot \
  uv run pytest
```

### Debugging

```bash
# Interactive debugging
docker run -it --entrypoint /bin/bash ginger-voice-bot
# Inside container:
pm2 logs
pm2 monit
tail -f /app/logs/*.log
```

## Production Deployment

### Docker Compose Production

```yaml
# docker-compose.prod.yml
version: '3.8'
services:
  backend:
    image: ginger-voice-bot:latest
    restart: always
    environment:
      - NODE_ENV=production
      - DEEPGRAM_API_KEY=${DEEPGRAM_API_KEY}
      - CARTESIA_API_KEY=${CARTESIA_API_KEY}
      - GOOGLE_API_KEY=${GOOGLE_API_KEY}
    volumes:
      - ./logs:/app/logs
      - ./data:/app/data
    ports:
      - "7860:7860"
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:7860/api/status"]
      interval: 30s
      timeout: 10s
      retries: 3
    deploy:
      resources:
        limits:
          memory: 4G
        reservations:
          memory: 2G
```

### Monitoring and Alerting

Set up monitoring with:
- **Prometheus**: Metrics collection
- **Grafana**: Visualization
- **Alertmanager**: Alerting
- **ELK Stack**: Log aggregation

### Backup Strategy

```bash
# Backup important data
docker run --rm \
  -v ginger_bot_data:/data \
  -v $(pwd):/backup \
  alpine tar czf /backup/ginger-bot-backup.tar.gz -C /data .
```

## Maintenance

### Updates

```bash
# Pull latest image
docker pull ginger-voice-bot:latest

# Update running container
docker-compose up -d --force-recreate
```

### Cleanup

```bash
# Remove old images
docker image prune -f

# Clean up volumes
docker volume prune -f
```

## Support

For issues and support:

1. Check logs: `docker logs ginger-bot`
2. Verify health: `curl http://localhost:7860/api/status`
3. Review this documentation
4. Check the [Pipecat documentation](https://github.com/pipecat-ai/pipecat)
5. Open an issue in the repository