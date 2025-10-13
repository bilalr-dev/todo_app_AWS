// Database configuration and connection management for v0.5
const { Pool } = require('pg');
const { logger } = require('../utils/logger');

// Database connection pool configuration
const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME || 'todo_app',
  user: process.env.DB_USER || process.env.USER || 'bilalrahaoui',
  password: process.env.DB_PASSWORD,
  // Connection pool settings
  max: 20, // Maximum number of clients in the pool
  idleTimeoutMillis: 30000, // Close idle clients after 30 seconds
  connectionTimeoutMillis: 2000, // Return an error after 2 seconds if connection could not be established
  // SSL configuration for production
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

// Test database connection
async function testConnection() {
  const client = await pool.connect();
  try {
    const result = await client.query('SELECT NOW()');
    logger.info('Database connected successfully', { 
      timestamp: result.rows[0].now,
      database: process.env.DB_NAME || 'todo_app'
    });
    return true;
  } catch (error) {
    logger.error('Database connection failed', { error: error.message });
    return false;
  } finally {
    client.release();
  }
}

// Graceful shutdown
async function closePool() {
  try {
    await pool.end();
    logger.info('Database pool closed successfully');
  } catch (error) {
    logger.error('Error closing database pool', { error: error.message });
  }
}

// Handle pool errors
pool.on('error', (err) => {
  logger.error('Unexpected error on idle client', { error: err.message });
});

// Handle process termination
process.on('SIGINT', closePool);
process.on('SIGTERM', closePool);

module.exports = {
  pool,
  testConnection,
  closePool,
  // Helper function to execute queries
  query: async (text, params) => {
    const start = Date.now();
    try {
      const result = await pool.query(text, params);
      const duration = Date.now() - start;
      logger.debug('Query executed', { 
        query: text.substring(0, 100) + '...', 
        duration: `${duration}ms`,
        rows: result.rowCount 
      });
      return result;
    } catch (error) {
      const duration = Date.now() - start;
      logger.error('Query failed', { 
        query: text.substring(0, 100) + '...', 
        duration: `${duration}ms`,
        error: error.message 
      });
      throw error;
    }
  }
};