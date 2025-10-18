// Main server entry point for Todo App v0.7
// Express server with JWT authentication, file uploads, WebSocket support, and protected routes

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const morgan = require('morgan');
const path = require('path');
const http = require('http');
require('dotenv').config();

// Import database, models, and routes
const { testConnection, closePool } = require('./src/config/database');
const { logger, requestLogger, errorLogger } = require('./src/utils/logger');
const authRoutes = require('./src/routes/auth');
const todoRoutes = require('./src/routes/todos');
const fileRoutes = require('./src/routes/files');
const bulkRoutes = require('./src/routes/bulk');
const exportRoutes = require('./src/routes/export');
const advancedRoutes = require('./src/routes/advanced');
const notificationRoutes = require('./src/routes/notifications');

// Import WebSocket service
const WebSocketService = require('./src/services/WebSocketService');

const app = express();
const server = http.createServer(app);
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
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    
    // For development, allow all localhost and local network IPs on any port
    if (process.env.NODE_ENV === 'development') {
      // Allow localhost on any port
      if (origin.match(/^http:\/\/localhost:\d+$/)) {
        return callback(null, true);
      }
      
      // Allow local network IPs on any port (192.168.x.x, 172.x.x.x, 10.x.x.x)
      if (origin.match(/^http:\/\/(192\.168\.\d+\.\d+|172\.\d+\.\d+\.\d+|10\.\d+\.\d+\.\d+):\d+$/)) {
        return callback(null, true);
      }
      
      // Allow 127.0.0.1 on any port
      if (origin.match(/^http:\/\/127\.0\.0\.1:\d+$/)) {
        return callback(null, true);
      }
      
      // Allow any local development origin for file serving
      if (origin.match(/^http:\/\/[^\/]+:\d+$/)) {
        return callback(null, true);
      }
    }
    
    // Allow specific origins from environment - completely dynamic
    const allowedOrigins = [
      process.env.CORS_ORIGIN,
      process.env.FRONTEND_URL
    ].filter(Boolean);
    
    if (allowedOrigins.includes(origin)) {
      return callback(null, true);
    }
    
    callback(new Error('Not allowed by CORS'));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Compression middleware
app.use(compression());

// Logging middleware
app.use(requestLogger);
app.use(morgan('combined'));

// Content type validation middleware (skip for file uploads)
app.use((req, res, next) => {
  // Skip validation for file upload endpoints
  if (req.path.includes('/files/upload') || req.path.includes('/upload')) {
    return next();
  }
  
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
      version: '0.6.0',
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
      version: '0.6.0',
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
    message: 'Todo App API v0.6',
    version: '0.6.0',
    endpoints: {
      health: '/api/health',
      auth: '/api/auth',
      todos: '/api/todos',
      files: '/api/files',
      bulk: '/api/bulk',
      export: '/api/export',
      advanced: '/api/advanced'
    },
    features: [
      'Express.js server with middleware',
      'PostgreSQL database connection',
      'JWT authentication system',
      'User registration and login',
      'Protected Todo CRUD operations',
      'File upload and attachment system',
      'Image processing and thumbnails',
      'Bulk operations for todos',
      'Advanced filtering and search',
      'Export functionality (CSV/JSON)',
      'Password hashing with bcrypt',
      'Token refresh mechanism',
      'Comprehensive input validation',
      'Database migration system',
      'Comprehensive logging',
      'Error handling and validation'
    ]
  });
});

// Static file serving for uploads
const uploadsPath = path.join(__dirname, 'uploads');
console.log('Static files serving from:', uploadsPath);
console.log('Directory exists:', require('fs').existsSync(uploadsPath));

// Use Express static middleware with CORS headers
app.use('/uploads', (req, res, next) => {
  // Set CORS headers for static files
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
  res.header('Cross-Origin-Resource-Policy', 'cross-origin');
  next();
}, express.static(uploadsPath));

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/todos', todoRoutes);
app.use('/api/files', fileRoutes);
app.use('/api/bulk', bulkRoutes);
app.use('/api/export', exportRoutes);
app.use('/api/advanced', advancedRoutes);
app.use('/api/notifications', notificationRoutes);

// 404 handler for API routes only
app.use('/api/*', (req, res) => {
  res.status(404).json({
    success: false,
    error: {
      code: 'NOT_FOUND',
      message: 'API endpoint not found',
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
const HOST = process.env.HOST || '0.0.0.0'; // Listen on all interfaces for network access
server.listen(PORT, HOST, async () => {
  logger.info(`🚀 Server running on ${HOST}:${PORT}`);
  logger.info(`📊 Environment: ${process.env.NODE_ENV || 'development'}`);
  logger.info(`🔗 Health check: http://${HOST}:${PORT}/api/health`);
  logger.info(`🌐 Network access: http://10.68.242.235:${PORT}/api/health`);
  logger.info(`📝 API Documentation: http://${HOST}:${PORT}/`);
  
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

  // Initialize WebSocket service
  try {
    const webSocketService = new WebSocketService(server);
    logger.info('✅ WebSocket service initialized successfully');
    
    // Make WebSocket service available globally
    app.locals.webSocketService = webSocketService;
  } catch (error) {
    logger.error('❌ WebSocket service initialization error:', error.message);
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