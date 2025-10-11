#!/bin/bash

# Todo Application v0.4 - Setup Script
# Repository: https://github.com/bilalr-dev/todo_app_AWS

set -e

echo "🚀 Todo Application v0.4 Setup"
echo "Repository: https://github.com/bilalr-dev/todo_app_AWS"
echo "=================================="

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js (v16 or higher) first."
    exit 1
fi

# Check if PostgreSQL is installed
if ! command -v psql &> /dev/null; then
    echo "❌ PostgreSQL is not installed. Please install PostgreSQL (v12 or higher) first."
    exit 1
fi

echo "✅ Prerequisites check passed"

# Install backend dependencies
echo "📦 Installing backend dependencies..."
cd backend
npm install
echo "✅ Backend dependencies installed"

# Install frontend dependencies
echo "📦 Installing frontend dependencies..."
cd ../frontend
npm install
echo "✅ Frontend dependencies installed"

# Setup environment files
echo "⚙️  Setting up environment files..."
cd ../backend
if [ ! -f .env ]; then
    cp env.example .env
    echo "✅ Backend .env file created from template"
    echo "⚠️  Please edit backend/.env with your database credentials"
else
    echo "✅ Backend .env file already exists"
fi

cd ../frontend
if [ ! -f .env ]; then
    cp env.example .env
    echo "✅ Frontend .env file created from template"
    echo "⚠️  Please edit frontend/.env with your API URL"
else
    echo "✅ Frontend .env file already exists"
fi

echo ""
echo "🎉 Setup completed successfully!"
echo ""
echo "Next steps:"
echo "1. Configure your database credentials in backend/.env"
echo "2. Configure your API URL in frontend/.env"
echo "3. Create and setup your PostgreSQL database:"
echo "   createdb todo_app"
echo "4. Run database migrations:"
echo "   cd database && node migrate.js"
echo "5. Start the backend server:"
echo "   cd backend && npm run dev"
echo "6. Start the frontend (in a new terminal):"
echo "   cd frontend && npm start"
echo ""
echo "Repository: https://github.com/bilalr-dev/todo_app_AWS"
echo "Documentation: See README.md for detailed instructions"