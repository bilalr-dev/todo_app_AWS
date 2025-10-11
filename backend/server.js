// Main server entry point for Todo App v0.2
// Express server with database connection and models

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const morgan = require('morgan');
require('dotenv').config();

// Import database and models
const { testConnection, closePool } = require('./src/config/database');
const { logger, requestLogger, errorLogger } = require('./src/utils/logger');

const app = express();
const PORT = process.env.PORT || 5000;

// Security middleware
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
    },
  },
  crossOriginEmbedderPolicy: false
}));

// CORS configuration
app.use(cors({
  origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Compression middleware
app.use(compression());

// Logging middleware
app.use(requestLogger);
app.use(morgan('combined'));

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Health check endpoint with database status
app.get('/api/health', async (req, res) => {
  try {
    const dbConnected = await testConnection();
    res.status(200).json({ 
      success: true,
      status: 'OK', 
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV || 'development',
      version: '0.2.0',
      uptime: process.uptime(),
      database: {
        connected: dbConnected,
        status: dbConnected ? 'healthy' : 'disconnected'
      }
    });
  } catch (error) {
    res.status(503).json({
      success: false,
      status: 'SERVICE_UNAVAILABLE',
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV || 'development',
      version: '0.2.0',
      uptime: process.uptime(),
      database: {
        connected: false,
        status: 'error',
        error: error.message
      }
    });
  }
});

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'Todo App API v0.2',
    version: '0.2.0',
    endpoints: {
      health: '/api/health'
    },
    features: [
      'Express.js server with middleware',
      'PostgreSQL database connection',
      'User and Todo models with CRUD operations',
      'Database migration system',
      'Comprehensive logging',
      'Error handling and validation'
    ]
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    error: {
      code: 'NOT_FOUND',
      message: 'Endpoint not found',
      path: req.originalUrl
    },
    timestamp: new Date().toISOString()
  });
});

// Global error handler
app.use(errorLogger);
app.use((err, req, res, next) => {
  logger.error('Unhandled error', { 
    error: err.message, 
    stack: err.stack, 
    url: req.url, 
    method: req.method 
  });
  
  res.status(err.status || 500).json({
    success: false,
    error: {
      code: err.code || 'INTERNAL_SERVER_ERROR',
      message: err.message || 'Internal server error',
      ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
    },
    timestamp: new Date().toISOString()
  });
});

// Graceful shutdown handling
process.on('SIGTERM', async () => {
  logger.info('SIGTERM received. Shutting down gracefully...');
  await closePool();
  process.exit(0);
});

process.on('SIGINT', async () => {
  logger.info('SIGINT received. Shutting down gracefully...');
  await closePool();
  process.exit(0);
});

// Start server
const server = app.listen(PORT, async () => {
  logger.info(`🚀 Server running on port ${PORT}`);
  logger.info(`📊 Environment: ${process.env.NODE_ENV || 'development'}`);
  logger.info(`🔗 Health check: http://localhost:${PORT}/api/health`);
  logger.info(`📝 API Documentation: http://localhost:${PORT}/`);
  
  // Test database connection on startup
  try {
    const dbConnected = await testConnection();
    if (dbConnected) {
      logger.info('✅ Database connection established successfully');
    } else {
      logger.warn('⚠️ Database connection failed - server will continue without database');
    }
  } catch (error) {
    logger.error('❌ Database connection error:', error.message);
  }
});

// Handle server errors
server.on('error', (err) => {
  if (err.code === 'EADDRINUSE') {
    console.error(`❌ Port ${PORT} is already in use`);
  } else {
    console.error('❌ Server error:', err);
  }
  process.exit(1);
});

module.exports = app;