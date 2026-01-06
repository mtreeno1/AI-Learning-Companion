#!/bin/bash

# AI Learning Companion - Deployment Script
# This script sets up and deploys the application using Docker

set -e  # Exit on error

echo "🚀 AI Learning Companion - Deployment Script"
echo "=============================================="

# Color codes
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to print colored messages
print_success() {
    echo -e "${GREEN}✓ $1${NC}"
}

print_error() {
    echo -e "${RED}✗ $1${NC}"
}

print_info() {
    echo -e "${YELLOW}ℹ $1${NC}"
}

# Check if Docker is installed
if ! command -v docker &> /dev/null; then
    print_error "Docker is not installed. Please install Docker first."
    exit 1
fi
print_success "Docker is installed"

# Check if Docker Compose is installed
if ! command -v docker-compose &> /dev/null; then
    print_error "Docker Compose is not installed. Please install Docker Compose first."
    exit 1
fi
print_success "Docker Compose is installed"

# Check if .env file exists
if [ ! -f .env ]; then
    print_info ".env file not found. Creating from .env.example..."
    if [ -f .env.example ]; then
        cp .env.example .env
        print_success ".env file created. Please edit it with your configuration."
        print_info "Run 'nano .env' or 'vim .env' to edit the file."
        exit 0
    else
        print_error ".env.example not found. Cannot create .env file."
        exit 1
    fi
fi
print_success ".env file found"

# Ask for deployment mode
echo ""
echo "Select deployment mode:"
echo "1) Development (no Nginx)"
echo "2) Production (with Nginx)"
read -p "Enter choice [1-2]: " choice

case $choice in
    1)
        COMPOSE_PROFILE=""
        print_info "Deploying in Development mode..."
        ;;
    2)
        COMPOSE_PROFILE="--profile production"
        print_info "Deploying in Production mode with Nginx..."
        ;;
    *)
        print_error "Invalid choice. Exiting."
        exit 1
        ;;
esac

# Pull latest changes (if in git repo)
if [ -d .git ]; then
    print_info "Pulling latest changes from git..."
    git pull || print_info "Could not pull from git. Continuing anyway..."
fi

# Create necessary directories
print_info "Creating necessary directories..."
mkdir -p ai-engine/recordings
mkdir -p ai-engine/models
mkdir -p ssl
print_success "Directories created"

# Download YOLO models if not present
print_info "Checking YOLO models..."
if [ ! -f ai-engine/models/yolov8n.pt ]; then
    print_info "Downloading YOLOv8n detection model..."
    wget -q https://github.com/ultralytics/assets/releases/download/v0.0.0/yolov8n.pt -O ai-engine/models/yolov8n.pt
    print_success "Detection model downloaded"
fi

if [ ! -f ai-engine/models/yolov8n-pose.pt ]; then
    print_info "Downloading YOLOv8n pose model..."
    wget -q https://github.com/ultralytics/assets/releases/download/v0.0.0/yolov8n-pose.pt -O ai-engine/models/yolov8n-pose.pt
    print_success "Pose model downloaded"
fi

# Stop existing containers
print_info "Stopping existing containers..."
docker-compose down || true

# Build images
print_info "Building Docker images (this may take a few minutes)..."
docker-compose build

if [ $? -ne 0 ]; then
    print_error "Failed to build Docker images"
    exit 1
fi
print_success "Docker images built successfully"

# Start containers
print_info "Starting containers..."
docker-compose up -d $COMPOSE_PROFILE

if [ $? -ne 0 ]; then
    print_error "Failed to start containers"
    exit 1
fi
print_success "Containers started successfully"

# Wait for services to be ready
print_info "Waiting for services to be ready..."
sleep 10

# Check if containers are running
print_info "Checking container status..."
docker-compose ps

# Test backend health
print_info "Testing backend health..."
max_retries=30
counter=0
while [ $counter -lt $max_retries ]; do
    if curl -f http://localhost:8000/ > /dev/null 2>&1; then
        print_success "Backend is healthy"
        break
    fi
    counter=$((counter + 1))
    if [ $counter -eq $max_retries ]; then
        print_error "Backend health check failed after $max_retries attempts"
        print_info "Check logs with: docker-compose logs backend"
        exit 1
    fi
    sleep 2
done

# Test frontend health
print_info "Testing frontend health..."
max_retries=30
counter=0
while [ $counter -lt $max_retries ]; do
    if curl -f http://localhost:3000/ > /dev/null 2>&1; then
        print_success "Frontend is healthy"
        break
    fi
    counter=$((counter + 1))
    if [ $counter -eq $max_retries ]; then
        print_error "Frontend health check failed after $max_retries attempts"
        print_info "Check logs with: docker-compose logs frontend"
        exit 1
    fi
    sleep 2
done

echo ""
echo "=============================================="
print_success "Deployment completed successfully!"
echo "=============================================="
echo ""
echo "📱 Frontend:  http://localhost:3000"
echo "🔧 Backend:   http://localhost:8000"
echo "📚 API Docs:  http://localhost:8000/docs"
echo ""
echo "Useful commands:"
echo "  docker-compose ps              # Check status"
echo "  docker-compose logs -f         # View all logs"
echo "  docker-compose logs -f backend # View backend logs"
echo "  docker-compose logs -f frontend # View frontend logs"
echo "  docker-compose down            # Stop all containers"
echo "  docker-compose restart         # Restart all containers"
echo ""

# If production mode, show additional info
if [ "$choice" = "2" ]; then
    echo "🔒 Production mode enabled with Nginx"
    echo "   HTTP:  http://localhost"
    echo "   HTTPS: Configure SSL certificates in nginx.conf"
    echo ""
    echo "   To enable HTTPS with Let's Encrypt:"
    echo "   1. Update DOMAIN in .env"
    echo "   2. Run: ./scripts/setup-ssl.sh"
    echo ""
fi
