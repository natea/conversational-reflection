#!/bin/bash
# GCP Deployment Script for e2-micro VM (Cost Optimized)
set -e

# Configuration
PROJECT_ID="ginger-voice-app"  # Using existing project
ZONE="us-west1-b"  # Cheapest zone
VM_NAME="ginger-bot-prod"
MACHINE_TYPE="e2-micro"  # Smallest possible (2 vCPU, 1GB RAM)
IMAGE_FAMILY="ubuntu-2004-lts"
IMAGE_PROJECT="ubuntu-os-cloud"
DISK_SIZE="20GB"  # Minimum required
DISK_TYPE="pd-balanced"  # Cheapest persistent disk

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${GREEN}=== Ginger Voice Bot GCP Deployment (e2-micro VM) ===${NC}"
echo -e "${YELLOW}Using smallest possible VM for cost optimization${NC}"
echo ""

# Check if gcloud is installed
if ! command -v gcloud &> /dev/null; then
    echo -e "${RED}Error: gcloud CLI is not installed${NC}"
    echo "Please install Google Cloud SDK first"
    exit 1
fi

# Check if we're authenticated
echo -e "${YELLOW}Checking GCP authentication...${NC}"
if ! gcloud auth list --filter=status:ACTIVE --format="value(account)" | grep -q .; then
    echo -e "${YELLOW}Please authenticate with GCP:${NC}"
    gcloud auth login
fi

# Set project
echo -e "${YELLOW}Setting project to: $PROJECT_ID${NC}"
gcloud config set project $PROJECT_ID

# Check if VM already exists
if gcloud compute instances describe $VM_NAME --zone=$ZONE --format="value(name)" 2>/dev/null | grep -q $VM_NAME; then
    echo -e "${YELLOW}VM $VM_NAME already exists. Stopping and deleting...${NC}"
    gcloud compute instances stop $VM_NAME --zone=$ZONE
    gcloud compute instances delete $VM_NAME --zone=$ZONE --quiet
fi

# Create the VM with minimal resources
echo -e "${GREEN}Creating e2-micro VM...${NC}"
gcloud compute instances create $VM_NAME \
    --zone=$ZONE \
    --machine-type=$MACHINE_TYPE \
    --image-family=$IMAGE_FAMILY \
    --image-project=$IMAGE_PROJECT \
    --boot-disk-size=$DISK_SIZE \
    --boot-disk-type=$DISK_TYPE \
    --network-interface=network-tier=STANDARD \
    --tags=http-server,https-server \
    --preemptible \  # Cheaper option for non-critical workloads
    --no-restart-on-failure \
    --maintenance-policy=TERMINATE

# Wait for VM to be ready
echo -e "${YELLOW}Waiting for VM to be ready...${NC}"
gcloud compute instances wait $VM_NAME --zone=$ZONE --status=RUNNING

# Create firewall rules if they don't exist
echo -e "${YELLOW}Configuring firewall rules...${NC}"
if ! gcloud compute firewall-rules describe allow-http --format="value(name)" 2>/dev/null; then
    gcloud compute firewall-rules create allow-http \
        --allow tcp:80,tcp:443 \
        --source-ranges 0.0.0.0/0 \
        --target-tags http-server,https-server \
        --description "Allow HTTP/HTTPS traffic"
fi

# Copy deployment files to VM
echo -e "${GREEN}Copying application files to VM...${NC}"
gcloud compute scp --recurse deploy/ $VM_NAME:~/app/ --zone=$ZONE

# Copy environment variables
if [ -f "pipecat/.env" ]; then
    echo -e "${YELLOW}Copying environment variables...${NC}"
    gcloud compute scp pipecat/.env $VM_NAME:~/app/.env --zone=$ZONE
else
    echo -e "${RED}Error: .env file not found in pipecat directory${NC}"
    echo "Please create .env file with your API keys"
    exit 1
fi

# Setup script for VM
cat << 'EOF' > /tmp/setup-vm.sh
#!/bin/bash
set -e

# Update system packages
sudo apt-get update
sudo apt-get upgrade -y

# Install Docker and Docker Compose
echo "Installing Docker..."
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh
sudo usermod -aG docker $USER

# Install Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/download/v2.20.0/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose

# Start Docker service
sudo systemctl start docker
sudo systemctl enable docker

# Configure swap space (e2-micro needs this for stability)
echo "Configuring swap space..."
sudo fallocate -l 2G /swapfile
sudo chmod 600 /swapfile
sudo mkswap /swapfile
sudo swapon /swapfile
echo '/swapfile none swap sw 0 0' | sudo tee -a /etc/fstab

# Configure kernel parameters for low memory
echo "Optimizing kernel for low memory usage..."
echo 'vm.swappiness=10' | sudo tee -a /etc/sysctl.conf
echo 'vm.vfs_cache_pressure=50' | sudo tee -a /etc/sysctl.conf
sudo sysctl -p

# Create startup script for automatic deployment
cat << 'EOL' > /home/$USER/start-app.sh
#!/bin/bash
cd /home/$USER/app

# Pull latest changes
git pull origin main 2>/dev/null || echo "Not a git repo, continuing..."

# Build and start containers
docker-compose down
docker-compose build --no-cache
docker-compose up -d

# Wait for services to start
sleep 30

# Log container status
echo "=== Container Status ===" > /var/log/deploy.log
docker-compose ps >> /var/log/deploy.log
echo "=== Container Logs ===" >> /var/log/deploy.log
docker-compose logs --tail=50 >> /var/log/deploy.log

echo "Application deployed at $(date)" >> /var/log/deploy.log
EOL

chmod +x /home/$USER/start-app.sh

# Create cron job for auto-restart on failure
cat << 'EOL' > /tmp/crontab
# Check if application is running every 5 minutes
*/5 * * * * /home/$USER/check-app.sh
# Restart app daily at 2 AM
0 2 * * * /home/$USER/start-app.sh
EOL

# Create health check script
cat << 'EOL' > /home/$USER/check-app.sh
#!/bin/bash
cd /home/$USER/app

# Check if nginx is responding
if ! curl -f http://localhost/health > /dev/null 2>&1; then
    echo "$(date): Health check failed, restarting..." >> /var/log/health-check.log
    /home/$USER/start-app.sh
fi
EOL

chmod +x /home/$USER/check-app.sh

crontab /tmp/crontab

echo "VM setup complete!"
EOF

# Copy and execute setup script
echo -e "${GREEN}Setting up VM...${NC}"
gcloud compute scp /tmp/setup-vm.sh $VM_NAME:~/setup-vm.sh --zone=$ZONE
gcloud compute ssh $VM_NAME --zone=$ZONE --command="chmod +x setup-vm.sh && ./setup-vm.sh"

# Deploy the application
echo -e "${GREEN}Deploying application...${NC}"
gcloud compute ssh $VM_NAME --zone=$ZONE --command="cd ~/app && ./start-app.sh"

# Get the external IP
EXTERNAL_IP=$(gcloud compute instances describe $VM_NAME --zone=$ZONE --format="value(networkInterfaces[0].accessConfigs[0].natIP)")

echo ""
echo -e "${GREEN}=== Deployment Complete! ===${NC}"
echo -e "${YELLOW}Application is running at: http://$EXTERNAL_IP${NC}"
echo ""
echo -e "${GREEN}VM Configuration:${NC}"
echo "  - Type: e2-micro (2 vCPU, 1GB RAM)"
echo "  - Disk: 20GB"
echo "  - Zone: $ZONE"
echo "  - Preemptible: Yes (25% cheaper)"
echo ""
echo -e "${GREEN}Estimated Monthly Cost: ~$5-7${NC}"
echo ""
echo -e "${YELLOW}Commands:${NC}"
echo "  - SSH: gcloud compute ssh $VM_NAME --zone=$ZONE"
echo "  - View logs: gcloud compute ssh $VM_NAME --zone=$ZONE --command='docker-compose logs -f'"
echo "  - Stop VM: gcloud compute instances stop $VM_NAME --zone=$ZONE"
echo "  - Delete VM: gcloud compute instances delete $VM_NAME --zone=$ZONE"
echo ""
echo -e "${GREEN}Note: This is a preemptible VM. It may be terminated by GCP with 30s notice.${NC}"
echo "      For production use, remove the --preemptible flag from the create command."