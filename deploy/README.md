# Ginger Voice Bot - Cost-Optimized GCP Deployment

This deployment configuration is optimized for running the Ginger Voice Bot on the smallest possible GCP VM instance to minimize costs while maintaining full functionality.

## Architecture Overview

The application uses external APIs for all AI processing, so the VM only needs to handle:
- HTTP/WebSocket server for signaling
- Static file serving for the frontend
- MCP servers for additional functionality
- Nginx reverse proxy for load balancing

## Resource Optimization

### VM Configuration
- **Type**: e2-micro (2 vCPU, 1GB RAM)
- **Cost**: ~$4.83/month (regular) or ~$3.62/month (preemptible)
- **Disk**: 20GB pd-balanced (~$1/month)
- **Total**: ~$5-7/month

### Services Configuration
- **Frontend**: Next.js production mode (256MB RAM limit)
- **Backend**: Python/FastAPI (512MB RAM limit)
- **MCP Servers**: Individual 64-128MB RAM limits
- **Nginx**: Minimal 32MB RAM limit

## Quick Deploy

### Prerequisites
1. Google Cloud SDK installed
2. GCP project created
3. Billing enabled
4. API keys for external services

### Deployment Steps

1. **Clone and prepare**
   ```bash
   cd /Users/pierre/sundai/conversational-reflection/deploy
   chmod +x gcp-deploy.sh
   ```

2. **Set up environment variables**
   ```bash
   cp production.env.example .env
   # Edit .env with your API keys
   ```

3. **Deploy to GCP**
   ```bash
   ./gcp-deploy.sh
   ```

### Customization Options

#### For Development/Low Traffic (Default)
- Use `e2-micro` VM
- Preemptible instances (25% cheaper)
- Minimal monitoring

#### For Production
- Edit `gcp-deploy.sh`:
  - Change `MACHINE_TYPE` to `e2-small` for better performance
  - Remove `--preemptible` flag for persistence
  - Increase `DISK_SIZE` to 30GB for logs

#### For High Availability
- Use managed instance groups
- Add load balancer
- Enable auto-scaling

## Monitoring and Maintenance

### Health Checks
- Automated health check every 5 minutes
- Auto-restart on failure
- Daily restart at 2 AM

### Logs Location
- Application logs: `~/app/logs/`
- Docker logs: `docker-compose logs`
- System logs: `/var/log/`

### Useful Commands
```bash
# SSH into VM
gcloud compute ssh ginger-bot-prod --zone=us-west1-b

# View logs
gcloud compute ssh ginger-bot-prod --zone=us-west1-b --command="docker-compose logs -f"

# Restart services
gcloud compute ssh ginger-bot-prod --zone=us-west1-b --command="cd ~/app && docker-compose restart"

# Stop VM (when not in use)
gcloud compute instances stop ginger-bot-prod --zone=us-west1-b
```

## Cost Optimization Tips

1. **Use Preemptible VMs**: 25% cheaper but may be terminated
2. **Schedule Usage**: Run only when needed
3. **Monitor Resource Usage**: Adjust limits as needed
4. **Use Cloudflare**: Free CDN and DDoS protection
5. **Compress Assets**: Reduce bandwidth costs

## Security Considerations

- All services run in Docker containers
- Non-root user for application processes
- Rate limiting enabled
- Sensitive files excluded from image
- Environment variables for secrets

## Scaling

If you need to scale beyond the e2-micro limitations:

1. **Upgrade VM**: Edit `MACHINE_TYPE` to `e2-small` or `e2-medium`
2. **Add More Resources**: Increase `DISK_SIZE`
3. **Use Managed Database**: Switch from SQLite to Cloud SQL
4. **Add Caching**: Implement Redis for session storage

## Troubleshooting

### Common Issues

1. **Out of Memory**: e2-micro has only 1GB RAM
   - Check logs: `dmesg | grep -i oom`
   - Reduce worker processes
   - Upgrade to e2-small

2. **Slow Performance**: High CPU usage
   - Check with `top`
   - Enable preemptible VM for better cost/performance
   - Consider e2-small for production

3. **Deployment Fails**
   - Check VM status in GCP Console
   - Verify API keys in .env
   - Check logs with ssh command

## Next Steps

1. Set up custom domain
2. Configure SSL/TLS certificates
3. Set up backup strategy
4. Configure monitoring alerts
5. Add performance monitoring