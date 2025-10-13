// Environment setup for backend tests
process.env.NODE_ENV = 'test';
process.env.PORT = '5002';
process.env.DB_HOST = 'localhost';
process.env.DB_PORT = '5432';
process.env.DB_NAME = 'todo_app';
process.env.DB_USER = 'bilalrahaoui';
process.env.DB_PASSWORD = '';
process.env.JWT_SECRET = 'test-secret-key';
process.env.JWT_EXPIRES_IN = '1h';

// Test user credentials (non-demo user)
process.env.TEST_USER_EMAIL = 'b@gmail.com';
process.env.TEST_USER_USERNAME = 'bilaldev';
process.env.TEST_USER_PASSWORD = 'Password123!';
