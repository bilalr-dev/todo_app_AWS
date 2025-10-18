#!/bin/bash

# Todo App Startup Script
# This script automatically detects your network IP and starts both frontend and backend

echo "🚀 Starting Todo App..."
echo ""

# Get the project directory
PROJECT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
FRONTEND_DIR="$PROJECT_DIR/frontend"
BACKEND_DIR="$PROJECT_DIR/backend"

# Function to get network IP
get_network_ip() {
    if command -v ifconfig >/dev/null 2>&1; then
        # macOS/Linux
        ifconfig | grep "inet " | grep -v 127.0.0.1 | awk '{print $2}' | head -1
    elif command -v ip >/dev/null 2>&1; then
        # Linux alternative
        ip route get 1 | awk '{print $7}' | head -1
    else
        echo "localhost"
    fi
}

# Get current network IP
NETWORK_IP=$(get_network_ip)

echo "📍 Detected network IP: $NETWORK_IP"
echo ""

# Check if backend is running
if ! curl -s http://localhost:5002/api/health >/dev/null 2>&1; then
    echo "🔧 Starting backend server..."
    cd "$BACKEND_DIR"
    npm run start &
    BACKEND_PID=$!
    echo "Backend PID: $BACKEND_PID"
    
    # Wait for backend to start
    echo "⏳ Waiting for backend to start..."
    for i in {1..30}; do
        if curl -s http://localhost:5002/api/health >/dev/null 2>&1; then
            echo "✅ Backend is ready!"
            break
        fi
        sleep 1
    done
else
    echo "✅ Backend is already running"
fi

echo ""

# Setup frontend environment and start
echo "🔧 Setting up frontend environment..."
cd "$FRONTEND_DIR"
node scripts/setup-env.js

echo ""
echo "🎉 Todo App is ready!"
echo ""
echo "📱 Access URLs:"
echo "   Local:    http://localhost:3001"
echo "   Network:  http://$NETWORK_IP:3001"
echo ""
echo "🔗 Backend API:"
echo "   Local:    http://localhost:5002"
echo "   Network:  http://$NETWORK_IP:5002"
echo ""
echo "💡 Share the network URL with other devices on the same WiFi"
echo ""

# Start frontend
echo "🚀 Starting frontend..."
npm run start:local
