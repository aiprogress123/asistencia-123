#!/bin/bash

# Progress Assistance System - Production Startup Script

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

print_header() {
    echo -e "${BLUE}================================${NC}"
    echo -e "${BLUE} Progress Assistance System${NC}"
    echo -e "${BLUE} Production Startup Script${NC}"
    echo -e "${BLUE}================================${NC}"
}

# Check if Node.js is installed
check_nodejs() {
    if ! command -v node &> /dev/null; then
        print_error "Node.js is not installed. Please install Node.js 16+"
        exit 1
    fi
    
    NODE_VERSION=$(node -v | cut -d'v' -f2)
    print_status "Node.js version: $NODE_VERSION"
    
    # Check if version is >= 16
    if [[ $(echo "$NODE_VERSION" | cut -d'.' -f1) -lt 16 ]]; then
        print_error "Node.js version 16+ required. Current: $NODE_VERSION"
        exit 1
    fi
}

# Check if npm is installed
check_npm() {
    if ! command -v npm &> /dev/null; then
        print_error "npm is not installed. Please install npm"
        exit 1
    fi
    
    NPM_VERSION=$(npm -v)
    print_status "npm version: $NPM_VERSION"
}

# Check if required files exist
check_files() {
    if [[ ! -f "server-simple.js" ]]; then
        print_error "server-simple.js not found in current directory"
        exit 1
    fi
    
    if [[ ! -f "package.json" ]]; then
        print_error "package.json not found in current directory"
        exit 1
    fi
    
    if [[ ! -d "public" ]]; then
        print_error "public directory not found"
        exit 1
    fi
    
    print_status "Required files found"
}

# Check environment file
check_env() {
    if [[ ! -f ".env" ]]; then
        print_warning ".env file not found. Using .env.example"
        if [[ -f ".env.example" ]]; then
            cp .env.example .env
            print_status ".env file created from .env.example"
            print_warning "Please edit .env file with your configuration"
        else
            print_error "Neither .env nor .env.example found"
            exit 1
        fi
    else
        print_status "Environment file found"
    fi
}

# Install dependencies
install_dependencies() {
    print_status "Installing dependencies..."
    if npm install; then
        print_status "Dependencies installed successfully"
    else
        print_error "Failed to install dependencies"
        exit 1
    fi
}

# Create necessary directories
create_directories() {
    print_status "Creating necessary directories..."
    
    mkdir -p uploads
    mkdir -p logs
    mkdir -p backups
    
    print_status "Directories created"
}

# Check if port is available
check_port() {
    local port=${PORT:-3000}
    if lsof -Pi :$port -sTCP:LISTEN -t >/dev/null 2>&1; then
        print_warning "Port $port is already in use"
        print_status "Attempting to kill existing process..."
        pkill -f "node server-simple.js" 2>/dev/null || true
        sleep 2
    else
        print_status "Port $port is available"
    fi
}

# Start the application
start_app() {
    print_status "Starting Progress Assistance System..."
    print_status "Environment: ${NODE_ENV:-development}"
    print_status "Port: ${PORT:-3000}"
    print_status "Database: ${DB_PATH:-./progress.db}"
    
    echo -e "${BLUE}================================${NC}"
    echo -e "${GREEN}Server starting at http://localhost:${PORT:-3000}${NC}"
    echo -e "${GREEN}Press Ctrl+C to stop the server${NC}"
    echo -e "${BLUE}================================${NC}"
    
    # Start the server
    if command -v pm2 &> /dev/null; then
        print_status "Starting with PM2 process manager..."
        pm2 start server-simple.js --name "progress-assistance"
        pm2 logs progress-assistance
    else
        print_status "Starting with Node.js..."
        node server-simple.js
    fi
}

# Cleanup function
cleanup() {
    print_status "Shutting down server..."
    if command -v pm2 &> /dev/null; then
        pm2 stop progress-assistance
    fi
    exit 0
}

# Set up signal handlers
trap cleanup SIGINT
trap cleanup SIGTERM

# Main execution
main() {
    print_header
    
    check_nodejs
    check_npm
    check_files
    check_env
    create_directories
    check_port
    
    install_dependencies
    start_app
}

# Run main function
main "$@"
