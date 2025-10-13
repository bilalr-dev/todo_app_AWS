// Global setup for all tests
const { execSync } = require('child_process');
const path = require('path');

module.exports = async () => {
  console.log('🚀 Setting up test environment...');
  
  // Set test environment variables
  process.env.NODE_ENV = 'test';
  process.env.DATABASE_URL = process.env.TEST_DATABASE_URL || 'postgresql://localhost:5432/todo_app_test';
  process.env.JWT_SECRET = 'test-jwt-secret';
  process.env.PORT = '5003'; // Different port for testing
  
  // Create test database if it doesn't exist
  try {
    console.log('📊 Setting up test database...');
    // This would typically run database migrations for test environment
    // execSync('npm run db:migrate:test', { stdio: 'inherit' });
  } catch (error) {
    console.warn('⚠️  Test database setup failed:', error.message);
  }
  
  // Start test servers if needed
  console.log('✅ Test environment setup complete');
};
