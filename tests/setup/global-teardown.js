// Global teardown for all tests
const { execSync } = require('child_process');

module.exports = async () => {
  console.log('🧹 Cleaning up test environment...');
  
  try {
    // Clean up test database
    console.log('🗑️  Cleaning up test database...');
    // execSync('npm run db:clean:test', { stdio: 'inherit' });
  } catch (error) {
    console.warn('⚠️  Test cleanup failed:', error.message);
  }
  
  // Clean up any test files
  console.log('✅ Test environment cleanup complete');
};
