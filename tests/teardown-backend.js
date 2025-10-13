// Teardown file for backend tests
const { closePool } = require('../backend/src/config/database');

// Global teardown function
async function globalTeardown() {
  console.log('🧹 Cleaning up backend test environment...');
  
  try {
    // Close database connections
    if (typeof closePool === 'function') {
      await closePool();
      console.log('✅ Database connections closed');
    }
  } catch (error) {
    console.error('❌ Error during teardown:', error.message);
  }
  
  // Clear any remaining timers
  if (global.gc) {
    global.gc();
  }
  
  console.log('✅ Backend test cleanup completed');
}

module.exports = globalTeardown;
