# 🌐 Network Access Setup

This Todo App now automatically detects your network IP address, so you can access it from any device on the same network without hardcoding IP addresses.

## 🚀 Quick Start

### Option 1: Use the Startup Script (Recommended)
```bash
./start-app.sh
```

This script will:
- ✅ Automatically detect your current network IP
- ✅ Start the backend server if not running
- ✅ Configure the frontend with the correct IP
- ✅ Start the frontend server
- ✅ Display all access URLs

### Option 2: Manual Setup
```bash
# 1. Start backend (if not running)
cd backend && npm run start

# 2. Setup frontend environment
cd frontend && npm run setup-env

# 3. Start frontend
npm run start:local
```

## 📱 Access URLs

After running the setup, you'll see URLs like:
- **Local**: `http://localhost:3001`
- **Network**: `http://192.168.1.55:3001` (your actual IP)

## 🔧 Available Commands

```bash
# Get your current network IP
cd frontend && npm run get-ip

# Setup environment with current IP
cd frontend && npm run setup-env

# Start with automatic IP detection
cd frontend && npm start

# Start with localhost only
cd frontend && npm run start:local
```

## 🌍 How It Works

1. **IP Detection**: The app automatically detects your network IP using system network interfaces
2. **Dynamic Configuration**: Environment variables are updated with the current IP
3. **Cross-Device Access**: Other devices on the same network can access using the network IP
4. **Automatic Updates**: IP changes are handled automatically when you restart

## 📋 Requirements

- Both devices must be on the same WiFi network
- Backend server must be running on port 5002
- Frontend server runs on port 3001

## 🔒 Security Note

This setup is for development/testing. For production, implement proper authentication and network security measures.

## 🐛 Troubleshooting

If you can't access from another device:
1. Check that both devices are on the same WiFi
2. Verify the backend is running: `curl http://localhost:5002/api/health`
3. Check your firewall settings
4. Try running `./start-app.sh` to see the current IP
