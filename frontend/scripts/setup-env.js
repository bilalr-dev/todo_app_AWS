#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Get the current network IP
function getNetworkIP() {
  try {
    const result = execSync('node scripts/get-network-ip.js', { encoding: 'utf8' });
    return result.trim();
  } catch (error) {
    console.warn('Could not detect network IP, using localhost');
    return 'localhost';
  }
}

const networkIP = getNetworkIP();
const envPath = path.join(__dirname, '..', '.env');

// Read current .env file
let envContent = '';
if (fs.existsSync(envPath)) {
  envContent = fs.readFileSync(envPath, 'utf8');
}

// Update the environment variables with current IP - completely dynamic
const updatedContent = envContent
  .replace(/REACT_APP_API_URL=http:\/\/[^\/]+:\d+\/api/g, `REACT_APP_API_URL=http://${networkIP}:5002/api`)
  .replace(/REACT_APP_SOCKET_URL=http:\/\/[^\/]+:\d+/g, `REACT_APP_SOCKET_URL=http://${networkIP}:5002`)
  .replace(/REACT_APP_WEBSOCKET_URL=ws:\/\/[^\/]+:\d+/g, `REACT_APP_WEBSOCKET_URL=ws://${networkIP}:5002`);

// Write updated .env file
fs.writeFileSync(envPath, updatedContent);

console.log(`✅ Environment configured for IP: ${networkIP}`);
console.log(`📱 Access your app at: http://${networkIP}:3001`);
console.log(`🔗 Backend API: http://${networkIP}:5002`);
