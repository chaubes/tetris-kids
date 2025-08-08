#!/bin/bash

# Production Docker Deployment Script for Tetris Kids Game
# Deploys on port 7301 with production-grade configuration

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
NC='\033[0m' # No Color

# Script configuration
CONTAINER_NAME="tetris-kids-game"
IMAGE_NAME="tetris-kids:latest"
PORT="7301"
HEALTH_URL="http://localhost:${PORT}/health"
APP_URL="http://localhost:${PORT}"

# Function to print colored output
print_header() {
    echo -e "${PURPLE}╔══════════════════════════════════════════════════════════════════╗${NC}"
    echo -e "${PURPLE}║                    TETRIS KIDS DEPLOYMENT                       ║${NC}"
    echo -e "${PURPLE}╚══════════════════════════════════════════════════════════════════╝${NC}"
    echo ""
}

print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

print_step() {
    echo -e "${PURPLE}► $1${NC}"
}

# Function to check if command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Function to check Docker installation and status
check_docker() {
    print_step "Checking Docker installation..."
    
    if ! command_exists docker; then
        print_error "Docker is not installed. Please install Docker first."
        exit 1
    fi
    
    if ! docker info > /dev/null 2>&1; then
        print_error "Docker is not running. Please start Docker first."
        exit 1
    fi
    
    if ! command_exists docker-compose; then
        print_warning "Docker Compose not found. Using 'docker compose' instead."
    fi
    
    print_success "Docker is ready ✓"
}

# Function to cleanup existing deployment
cleanup_existing() {
    print_step "Cleaning up existing deployment..."
    
    if docker ps -a --format 'table {{.Names}}' | grep -q "^${CONTAINER_NAME}$"; then
        print_status "Stopping existing container..."
        docker stop "${CONTAINER_NAME}" || true
        
        print_status "Removing existing container..."
        docker rm "${CONTAINER_NAME}" || true
        
        print_success "Cleanup completed ✓"
    else
        print_status "No existing container found"
    fi
}

# Function to build and deploy
deploy_application() {
    print_step "Building and deploying application..."
    
    # Check if docker-compose command exists
    if command_exists docker-compose; then
        COMPOSE_CMD="docker-compose"
    else
        COMPOSE_CMD="docker compose"
    fi
    
    print_status "Building Docker image..."
    ${COMPOSE_CMD} build
    
    if [ $? -eq 0 ]; then
        print_success "Docker image built successfully ✓"
    else
        print_error "Failed to build Docker image"
        exit 1
    fi
    
    print_status "Starting container..."
    ${COMPOSE_CMD} up -d
    
    if [ $? -eq 0 ]; then
        print_success "Container started successfully ✓"
    else
        print_error "Failed to start container"
        exit 1
    fi
}

# Function to wait for application to be ready
wait_for_application() {
    print_step "Waiting for application to be ready..."
    
    local max_attempts=30
    local attempt=1
    
    while [ $attempt -le $max_attempts ]; do
        if curl -sf "${HEALTH_URL}" > /dev/null 2>&1; then
            print_success "Application is healthy ✓"
            return 0
        fi
        
        print_status "Attempt ${attempt}/${max_attempts}: Waiting for application..."
        sleep 2
        attempt=$((attempt + 1))
    done
    
    print_error "Application failed to become ready within timeout"
    return 1
}

# Function to verify deployment
verify_deployment() {
    print_step "Verifying deployment..."
    
    # Check container status
    if ! docker ps --format 'table {{.Names}}' | grep -q "^${CONTAINER_NAME}$"; then
        print_error "Container is not running"
        return 1
    fi
    
    # Check health endpoint
    if ! curl -sf "${HEALTH_URL}" > /dev/null 2>&1; then
        print_error "Health check failed"
        return 1
    fi
    
    # Check main application
    local http_code=$(curl -s -o /dev/null -w "%{http_code}" "${APP_URL}")
    if [ "$http_code" != "200" ]; then
        print_error "Application not responding correctly (HTTP $http_code)"
        return 1
    fi
    
    print_success "All checks passed ✓"
    return 0
}

# Function to display deployment information
show_deployment_info() {
    echo ""
    echo -e "${GREEN}╔══════════════════════════════════════════════════════════════════╗${NC}"
    echo -e "${GREEN}║                     🎉 DEPLOYMENT SUCCESSFUL! 🎉                 ║${NC}"
    echo -e "${GREEN}╚══════════════════════════════════════════════════════════════════╝${NC}"
    echo ""
    echo -e "${BLUE}🌐 Application URL:${NC} ${APP_URL}"
    echo -e "${BLUE}🏥 Health Check:${NC}   ${HEALTH_URL}"
    echo -e "${BLUE}🐳 Container:${NC}      ${CONTAINER_NAME}"
    echo -e "${BLUE}🏷️  Image:${NC}         ${IMAGE_NAME}"
    echo -e "${BLUE}🔌 Port:${NC}          ${PORT}"
    echo ""
    echo -e "${YELLOW}📋 Management Commands:${NC}"
    echo "   docker logs ${CONTAINER_NAME}                 # View logs"
    echo "   docker stop ${CONTAINER_NAME}                 # Stop application"
    echo "   docker start ${CONTAINER_NAME}                # Start application"
    echo "   docker restart ${CONTAINER_NAME}              # Restart application"
    echo "   docker-compose down                           # Stop and remove"
    echo "   docker-compose up -d                          # Start services"
    echo "   docker-compose logs -f                        # Follow logs"
    echo ""
    
    # Show container details
    print_status "Container Details:"
    docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}\t{{.Image}}" --filter "name=${CONTAINER_NAME}"
    
    echo ""
    print_success "🎮 Tetris Kids is ready to play!"
}

# Function to show logs if deployment fails
show_failure_logs() {
    print_error "Deployment failed. Showing container logs:"
    echo ""
    docker logs "${CONTAINER_NAME}" 2>/dev/null || echo "No logs available"
}

# Main deployment flow
main() {
    print_header
    
    # Pre-flight checks
    check_docker
    
    # Clean up existing deployment
    cleanup_existing
    
    # Deploy application
    deploy_application
    
    # Wait for application to be ready
    if wait_for_application; then
        # Verify deployment
        if verify_deployment; then
            show_deployment_info
        else
            show_failure_logs
            exit 1
        fi
    else
        show_failure_logs
        exit 1
    fi
}

# Run main function
main "$@"