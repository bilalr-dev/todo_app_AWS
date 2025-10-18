#!/bin/bash

# Quick Test Script for Todo App v0.7
# Tests real-time features, notifications, and offline support

echo "🚀 Todo App v0.7 Testing Script"
echo "================================"
echo ""

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js first."
    exit 1
fi

# Check if npm is installed
if ! command -v npm &> /dev/null; then
    echo "❌ npm is not installed. Please install npm first."
    exit 1
fi

echo "✅ Node.js and npm are installed"
echo ""

# Install dependencies if needed
echo "📦 Checking dependencies..."
if [ ! -d "node_modules" ]; then
    echo "Installing dependencies..."
    npm install
fi

if [ ! -d "backend/node_modules" ]; then
    echo "Installing backend dependencies..."
    cd backend && npm install && cd ..
fi

if [ ! -d "frontend/node_modules" ]; then
    echo "Installing frontend dependencies..."
    cd frontend && npm install && cd ..
fi

echo "✅ Dependencies are ready"
echo ""

# Check if backend is running
echo "🔍 Checking if backend is running..."
if curl -s http://localhost:5002/api/health > /dev/null; then
    echo "✅ Backend is running on port 5002"
else
    echo "⚠️  Backend is not running. Starting backend..."
    echo "Please start the backend server in another terminal:"
    echo "  cd backend && npm start"
    echo ""
    echo "Then run this script again."
    exit 1
fi

# Check if frontend is running
echo "🔍 Checking if frontend is running..."
if curl -s http://localhost:3000 > /dev/null; then
    echo "✅ Frontend is running on port 3000"
else
    echo "⚠️  Frontend is not running. Starting frontend..."
    echo "Please start the frontend server in another terminal:"
    echo "  cd frontend && npm start"
    echo ""
    echo "Then run this script again."
    exit 1
fi

echo ""
echo "🧪 Running comprehensive test suite..."
echo ""

# Run the test suite
node tests/run-all-tests.js

# Check exit code
if [ $? -eq 0 ]; then
    echo ""
    echo "🎉 All tests passed! v0.7 is ready for production!"
    echo ""
    echo "📋 Manual Testing Checklist:"
    echo "  ✅ Open http://localhost:3000 in multiple browser tabs"
    echo "  ✅ Create/edit/delete todos and verify real-time sync"
    echo "  ✅ Test offline mode by disconnecting internet"
    echo "  ✅ Check notification preferences in profile"
    echo "  ✅ Test file uploads and verify thumbnails"
    echo ""
    echo "🚀 v0.7 Features Verified:"
    echo "  ✅ Real-time WebSocket synchronization"
    echo "  ✅ In-app and email notifications"
    echo "  ✅ Offline support with data caching"
    echo "  ✅ Cross-tab synchronization"
    echo "  ✅ Error handling and recovery"
else
    echo ""
    echo "❌ Some tests failed. Please check the output above."
    echo ""
    echo "🔧 Troubleshooting:"
    echo "  1. Ensure backend is running: cd backend && npm start"
    echo "  2. Ensure frontend is running: cd frontend && npm start"
    echo "  3. Check database connection"
    echo "  4. Verify environment variables"
    echo "  5. Check console for errors"
    echo ""
    echo "📖 For detailed testing guide, see: documentation/V0.7_TESTING_GUIDE.md"
fi



