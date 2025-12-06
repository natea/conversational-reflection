#!/bin/bash

# Google Cloud Setup Script for Ginger Voice Bot
# This script sets up the GCP environment for deployment

set -e

# Configuration variables
PROJECT_NAME="ginger-voice-bot"
REGION="us-central1"
ZONE="us-central1-a"
VM_NAME="ginger-vm"
MACHINE_TYPE="e2-standard-4"  # 4 vCPUs, 16GB RAM - suitable for AI workloads
IMAGE_FAMILY="ubuntu-2204-lts"
IMAGE_PROJECT="ubuntu-os-cloud"
DISK_SIZE="100GB"  # Larger disk for models and logs
STATIC_IP_NAME="ginger-static-ip"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${GREEN}🚀 Setting up Google Cloud environment for Ginger Voice Bot${NC}"

# Check if gcloud is installed
if ! command -v gcloud &> /dev/null; then
    echo -e "${RED}❌ gcloud CLI is not installed. Please install it first.${NC}"
    echo "Visit: https://cloud.google.com/sdk/docs/install"
    exit 1
fi

# Check if user is logged in
if ! gcloud auth list --filter=status:ACTIVE --format="value(account)" | grep -q .; then
    echo -e "${YELLOW}📋 Please log in to Google Cloud:${NC}"
    gcloud auth login
fi

# Set the project
echo -e "${YELLOW}📋 Setting project to: ${PROJECT_NAME}${NC}"
gcloud config set project $PROJECT_NAME

# Enable required APIs
echo -e "${YELLOW}📋 Enabling required APIs...${NC}"
gcloud services enable compute.googleapis.com
gcloud services enable container.googleapis.com
gcloud services enable cloudbuild.googleapis.com
gcloud services enable dns.googleapis.com

# Create static IP address
echo -e "${YELLOW}📋 Creating static IP address...${NC}"
gcloud compute addresses create $STATIC_IP_NAME --region=$REGION
STATIC_IP=$(gcloud compute addresses describe $STATIC_IP_NAME --region=$REGION --format="get(address)")
echo -e "${GREEN}✅ Static IP created: ${STATIC_IP}${NC}"

# Create firewall rules
echo -e "${YELLOW}📋 Creating firewall rules...${NC}"

# SSH
gcloud compute firewall-rules create allow-ssh --allow tcp:22 --source-ranges 0.0.0.0/0 --description "Allow SSH"

# HTTP
gcloud compute firewall-rules create allow-http --allow tcp:80 --source-ranges 0.0.0.0/0 --description "Allow HTTP"

# HTTPS
gcloud compute firewall-rules create allow-https --allow tcp:443 --source-ranges 0.0.0.0/0 --description "Allow HTTPS"

# WebRTC signaling
gcloud compute firewall-rules create allow-webrtc --allow tcp:7860,udp:10000-20000 --source-ranges 0.0.0.0/0 --description "Allow WebRTC"

# Frontend (Next.js)
gcloud compute firewall-rules create allow-frontend --allow tcp:3000 --source-ranges 0.0.0.0/0 --description "Allow frontend"

echo -e "${GREEN}✅ Firewall rules created${NC}"

# Create the VM instance
echo -e "${YELLOW}📋 Creating VM instance...${NC}"
gcloud compute instances create $VM_NAME \
    --machine-type=$MACHINE_TYPE \
    --image-family=$IMAGE_FAMILY \
    --image-project=$IMAGE_PROJECT \
    --boot-disk-size=$DISK_SIZE \
    --boot-disk-type=pd-ssd \
    --zone=$ZONE \
    --address=$STATIC_IP_NAME \
    --tags=http-server,https-server,webrtc-server

echo -e "${GREEN}✅ VM instance created${NC}"

# Wait for VM to be ready
echo -e "${YELLOW}📋 Waiting for VM to be ready...${NC}"
gcloud compute instances wait $VM_NAME --zone=$ZONE --status=RUNNING --timeout=300

# Show connection info
echo -e "${GREEN}✅ Setup complete!${NC}"
echo
echo "VM Details:"
echo "  Name: $VM_NAME"
echo "  Zone: $ZONE"
echo "  Static IP: $STATIC_IP"
echo
echo "To connect to the VM:"
echo "  gcloud compute ssh $VM_NAME --zone=$ZONE"
echo
echo "Next steps:"
echo "  1. Connect to the VM"
echo "  2. Run the deployment script: curl -sSL https://your-repo/deploy.sh | bash"