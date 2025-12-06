# Ginger Voice Bot Deployment Guide

This guide covers deploying the Ginger Voice Bot application to Google Cloud Platform (GCP) with Docker and Docker Compose, or directly to a VM using the provided scripts.

## Architecture Overview

The Ginger Voice Bot consists of:

- **Backend**: Python/Flask application using Pipecat-AI for voice processing
- **Frontend**: Next.js application with WebRTC for voice communication
- **MCP Servers**: Node.js services providing AI capabilities
  - `sable-mcp`: Emotional analysis (Damasio consciousness model)
  - `private-journal-mcp`: Long-term memory
  - `imessage-mcp`: iMessage integration (macOS only)
- **Services**: Deepgram (STT), Cartesia (TTS), Google AI (LLM)
- **Infrastructure**: Nginx reverse proxy, SSL certificates, monitoring

## Deployment Options

### Option 1: Google Cloud VM with Scripts (Recommended)

#### Prerequisites

1. Google Cloud SDK (gcloud CLI) installed
2. A Google Cloud project with billing enabled
3. Your API keys:
   - Deepgram API Key
   - Cartesia API Key
   - Google AI Studio API Key

#### Step 1: Set up GCP Environment

```bash
# Make the setup script executable
chmod +x deployment/gcp-setup.sh

# Run the setup script
./deployment/gcp-setup.sh
```

This will:
- Create a GCP project (ginger-voice-bot)
- Enable required APIs
- Create a VM instance (e2-standard-4, 100GB SSD)
- Configure firewall rules for ports 22, 80, 443, 7860, 3000, and UDP 10000-20000
- Assign a static IP address

#### Step 2: Deploy the Application

```bash
# SSH into the VM
gcloud compute ssh ginger-vm --zone=us-central1-a

# Download and run the deployment script
curl -sSL https://raw.githubusercontent.com/your-repo/main/deployment/deploy.sh | bash -s -- \
  --repo-url=https://github.com/your-username/conversational-reflection.git \
  --branch=main \
  --domain=yourdomain.com \
  --email=your@email.com
```

Or clone the repo and run directly:

```bash
git clone https://github.com/your-username/conversational-reflection.git
cd conversational-reflection
sudo deployment/deploy.sh
```

#### Step 3: Configure Environment Variables

Edit `/opt/ginger-voice-bot/pipecat/.env`:

```bash
sudo nano /opt/ginger-voice-bot/pipecat/.env
```

Replace with your actual API keys:
- `DEEPGRAM_API_KEY`
- `CARTESIA_API_KEY`
- `GOOGLE_API_KEY`

#### Step 4: Verify Deployment

```bash
# Check service status
/opt/ginger-voice-bot/status.sh

# Check logs
sudo journalctl -u ginger-backend -f
```

### Option 2: Docker/Docker Compose

#### Prerequisites

- Docker and Docker Compose installed
- A Linux server (Ubuntu 22.04 recommended)

#### Step 1: Prepare Environment

```bash
# Clone the repository
git clone https://github.com/your-username/conversational-reflection.git
cd conversational-reflection

# Copy environment template
cp deployment/.env.example .env

# Edit .env with your API keys
nano .env
```

#### Step 2: Deploy with Docker Compose

```bash
# Build and start all services
cd deployment
docker-compose up -d

# Check status
docker-compose ps

# View logs
docker-compose logs -f
```

#### Step 3: Setup SSL (Optional)

```bash
# Generate self-signed certificates for testing
mkdir -p ssl
openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
  -keyout ssl/key.pem \
  -out ssl/cert.pem

# Or use Let's Encrypt for production
sudo apt-get install certbot
sudo certbot certonly --standalone -d yourdomain.com
sudo cp /etc/letsencrypt/live/yourdomain.com/fullchain.pem ssl/cert.pem
sudo cp /etc/letsencrypt/live/yourdomain.com/privkey.pem ssl/key.pem
```

## Configuration Details

### Port Mapping

| Service | Port | Description |
|---------|------|-------------|
| Frontend (Next.js) | 3000 | Web interface |
| Backend (Flask) | 7860 | API and WebRTC signaling |
| Nginx | 80/443 | Reverse proxy |
| WebRTC Media | 10000-20000 UDP | Audio/video streams |

### Environment Variables

#### Backend (.env)

```bash
# AI Service Keys
DEEPGRAM_API_KEY=your_deepgram_key
CARTESIA_API_KEY=your_cartesia_key
GOOGLE_API_KEY=your_google_ai_key

# Optional
CARTESIA_VOICE_ID=6ccbfb76-1fc6-48f7-b71d-91ac6298247b  # Tessa's voice
NODE_ENV=production
```

#### Frontend (.env.local)

```bash
# API endpoint (will be proxied in production)
NEXT_PUBLIC_API_URL=http://localhost:7860
```

### Security Considerations

1. **API Keys**: Never commit API keys to version control. Use environment variables or secret management.

2. **Firewall Rules**: Only expose necessary ports. The provided script opens:
   - 22 (SSH)
   - 80/443 (HTTP/HTTPS)
   - 7860 (Backend API)
   - 3000 (Frontend - proxied through Nginx)
   - 10000-20000 UDP (WebRTC media)

3. **SSL/TLS**: Always use HTTPS in production. The setup includes Let's Encrypt integration.

4. **Rate Limiting**: Nginx configuration includes rate limiting for API endpoints.

5. **CORS**: Configured to allow your domain only in production.

## Monitoring and Logging

### Health Checks

- Backend: `GET /api/status`
- Frontend: `GET /`
- Automatic health checks restart failed services

### Logs Locations

- System logs: `journalctl -u ginger-backend`
- Application logs: `/opt/ginger-voice-bot/logs/`
- Nginx logs: `/var/log/nginx/`

### Monitoring Stack (Optional)

The Docker Compose setup includes:
- **Prometheus**: Metrics collection (port 9090)
- **Grafana**: Visualization dashboard (port 3001)
- **Node Exporter**: System metrics

Access Grafana at `http://your-server:3001` (admin/admin123).

## Troubleshooting

### Common Issues

1. **MCP Servers Not Starting**
   ```bash
   # Check MCP service status
   sudo systemctl status ginger-mcp

   # View MCP logs
   sudo journalctl -u ginger-mcp -f
   ```

2. **Frontend Not Building**
   ```bash
   # Clear Next.js cache
   cd /opt/ginger-voice-bot/ginger_rp
   rm -rf .next
   npm run build
   ```

3. **WebRTC Connection Issues**
   - Ensure UDP ports 10000-20000 are open
   - Check STUN/TURN server configuration
   - Verify firewall allows WebRTC traffic

4. **High Memory Usage**
   - Monitor with: `htop` or `docker stats`
   - Consider increasing VM size if needed
   - Restart services: `sudo systemctl restart ginger-backend`

5. **SSL Certificate Issues**
   ```bash
   # Renew Let's Encrypt certificate
   sudo certbot renew

   # Test Nginx configuration
   sudo nginx -t
   ```

### Recovery Commands

```bash
# Restart all services
sudo systemctl restart ginger-backend ginger-mcp nginx
pm2 restart ginger-frontend

# Full redeployment
cd /opt/ginger-voice-bot
./update.sh

# Emergency reset (last resort)
sudo systemctl stop ginger-backend ginger-mcp
docker-compose down -v  # Docker only
```

## Scaling Considerations

### Horizontal Scaling

1. **Load Balancer**: Use GCP Load Balancer for multiple instances
2. **Session Storage**: Redis is included for session persistence
3. **Database**: For scaling MCP servers, consider external databases

### Performance Optimization

1. **Caching**: Nginx caches static assets
2. **Compression**: Enabled for all text-based responses
3. **WebRTC**: Consider dedicated TURN servers for peer connections

## Maintenance

### Regular Tasks

1. **Updates**: Run `./update.sh` to pull latest code
2. **Backups**: Configure automated backups of `/opt/ginger-voice-bot/data`
3. **Logs**: Rotate logs to prevent disk space issues
4. **SSL**: Certbot auto-renews certificates, but verify monthly

### Monitoring Checklist

- Check service health: `/opt/ginger-voice-bot/status.sh`
- Monitor disk usage: `df -h`
- Review error logs: `journalctl -p err -n 100`
- Check WebRTC connectivity regularly

## Limitations

1. **iMessage MCP**: Requires macOS, won't work on Linux VMs
   - Alternative: Use API-based message services
   - Run iMessage MCP on a separate macOS instance

2. **WebRTC NAT Traversal**: May require STUN/TURN servers for some networks

3. **Resource Requirements**: Minimum 4GB RAM, 2 CPU cores recommended

## Support

For issues:
1. Check logs in `/opt/ginger-voice-bot/logs/`
2. Review this troubleshooting section
3. Open an issue on the GitHub repository

## License

This deployment configuration is provided under the MIT License.