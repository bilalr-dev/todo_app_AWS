#!/bin/bash

# Todo App Setup Script
# This script sets up the development environment

echo "🚀 Setting up Todo App development environment..."

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js v16 or higher."
    exit 1
fi

# Check if npm is installed
if ! command -v npm &> /dev/null; then
    echo "❌ npm is not installed. Please install npm."
    exit 1
fi

echo "✅ Node.js and npm are installed"

# Install backend dependencies
echo "📦 Installing backend dependencies..."
cd backend
npm install
cd ..

# Install frontend dependencies
echo "📦 Installing frontend dependencies..."
cd frontend
npm install
cd ..

echo "✅ Setup complete!"
echo ""
echo "Next steps:"
echo "1. Copy env.example files to .env in both backend and frontend"
echo "2. Configure your database connection"
echo "3. Set up AWS credentials"
echo "4. Run 'npm start' in both backend and frontend directories"
