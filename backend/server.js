// Main server entry point for Todo App v0.5
// Express server with JWT authentication and protected routes

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const morgan = require('morgan');
require('dotenv').config();

// Import database, models, and routes
const { testConnection, closePool } = require('./src/config/database');
const { logger, requestLogger, errorLogger } = require('./src/utils/logger');
const authRoutes = require('./src/routes/auth');
const todoRoutes = require('./src/routes/todos');

const app = express();
const PORT = process.env.PORT || 5002;

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
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Compression middleware
app.use(compression());

// Logging middleware
app.use(requestLogger);
app.use(morgan('combined'));

// Content type validation middleware
app.use((req, res, next) => {
  if (req.method !== 'GET' && req.method !== 'DELETE' && req.get('Content-Type') !== 'application/json') {
    return res.status(400).json({
      success: false,
      error: {
        code: 'INVALID_CONTENT_TYPE',
        message: 'Content-Type must be application/json'
      },
      timestamp: new Date().toISOString()
    });
  }
  next();
});

// Body parsing middleware with enhanced error handling
app.use(express.json({ 
  limit: '10mb',
  verify: (req, res, buf) => {
    if (buf.length === 0) return; // Skip parsing for empty bodies
    try {
      JSON.parse(buf);
    } catch (e) {
      throw new Error('Invalid JSON format');
    }
  }
}));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// JSON parsing error handler
app.use((error, req, res, next) => {
  if (error instanceof SyntaxError && error.status === 400 && 'body' in error) {
    return res.status(400).json({
      success: false,
      error: {
        code: 'INVALID_JSON',
        message: 'Invalid JSON format'
      },
      timestamp: new Date().toISOString()
    });
  }
  if (error.message && error.message.includes('JSON')) {
    return res.status(400).json({
      success: false,
      error: {
        code: 'INVALID_JSON',
        message: 'Invalid JSON format'
      },
      timestamp: new Date().toISOString()
    });
  }
  next(error);
});

// Health check endpoint with database status
app.get('/api/health', async (req, res) => {
  try {
    const dbConnected = await testConnection();
    res.status(200).json({ 
      success: true,
      status: 'OK', 
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV || 'development',
      version: '0.4.0',
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
      version: '0.4.0',
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
    message: 'Todo App API v0.5',
    version: '0.5.0',
    endpoints: {
      health: '/api/health',
      auth: '/api/auth',
      todos: '/api/todos'
    },
    features: [
      'Express.js server with middleware',
      'PostgreSQL database connection',
      'JWT authentication system',
      'User registration and login',
      'Protected Todo CRUD operations',
      'Password hashing with bcrypt',
      'Token refresh mechanism',
      'Comprehensive input validation',
      'Database migration system',
      'Comprehensive logging',
      'Error handling and validation'
    ]
  });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/todos', todoRoutes);

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
  // Don't exit during tests
  if (process.env.NODE_ENV !== 'test') {
    process.exit(1);
  }
});

module.exports = app;