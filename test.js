#!/usr/bin/env node

// Simple Test Runner for Todo App v0.7
// Quick way to test all v0.7 features

const { spawn } = require('child_process');
const path = require('path');

console.log('🚀 Todo App v0.7 - Quick Test Runner');
console.log('=====================================\n');

// Check if servers are running
async function checkServers() {
  const axios = require('axios');
  
  try {
    await axios.get('http://localhost:5002/api/health');
    console.log('✅ Backend server is running');
    return true;
  } catch (error) {
    console.log('❌ Backend server is not running');
    console.log('   Please start it with: npm run start:backend');
    return false;
  }
}

// Run the comprehensive test suite
async function runTests() {
  console.log('🧪 Running comprehensive test suite...\n');
  
  return new Promise((resolve, reject) => {
    const testProcess = spawn('node', ['tests/run-all-tests.js'], {
      stdio: 'inherit',
      cwd: process.cwd()
    });
    
    testProcess.on('close', (code) => {
      if (code === 0) {
        console.log('\n🎉 All tests passed! v0.7 is ready!');
        resolve();
      } else {
        console.log('\n❌ Some tests failed. Check the output above.');
        reject(new Error('Tests failed'));
      }
    });
    
    testProcess.on('error', (error) => {
      console.error('❌ Failed to run tests:', error.message);
      reject(error);
    });
  });
}

// Main function
async function main() {
  try {
    // Check if servers are running
    const serversRunning = await checkServers();
    
    if (!serversRunning) {
      console.log('\n📋 To start the servers:');
      console.log('   Terminal 1: npm run start:backend');
      console.log('   Terminal 2: npm run start:frontend');
      console.log('\n   Then run: node test.js');
      process.exit(1);
    }
    
    // Run tests
    await runTests();
    
    console.log('\n📋 Manual Testing Checklist:');
    console.log('   ✅ Open http://localhost:3000 in multiple browser tabs');
    console.log('   ✅ Create/edit/delete todos and verify real-time sync');
    console.log('   ✅ Test offline mode by disconnecting internet');
    console.log('   ✅ Check notification preferences in profile');
    console.log('   ✅ Test file uploads and verify thumbnails');
    
  } catch (error) {
    console.error('\n❌ Test runner failed:', error.message);
    process.exit(1);
  }
}

// Run if this file is executed directly
if (require.main === module) {
  main();
}

module.exports = { checkServers, runTests };



