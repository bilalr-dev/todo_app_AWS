// JWT Authentication middleware for v0.5
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { logger } = require('../utils/logger');

// Verify JWT token
const authenticateToken = async (req, res, next) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    if (!token) {
      logger.warn('No token provided', { url: req.url, method: req.method });
      return res.status(401).json({
        success: false,
        error: {
          code: 'NO_TOKEN',
          message: 'Access token required'
        },
        timestamp: new Date().toISOString()
      });
    }

    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Get user from database
    const user = await User.findById(decoded.userId);
    if (!user) {
      logger.warn('User not found for token', { userId: decoded.userId });
      return res.status(401).json({
        success: false,
        error: {
          code: 'INVALID_TOKEN',
          message: 'Invalid or expired token'
        },
        timestamp: new Date().toISOString()
      });
    }

    // Add user to request object
    req.user = user;
    req.userId = user.id;
    
    logger.debug('User authenticated', { userId: user.id, email: user.email });
    next();
  } catch (error) {
    logger.error('Token verification failed', { error: error.message });
    
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({
        success: false,
        error: {
          code: 'INVALID_TOKEN',
          message: 'Invalid token'
        },
        timestamp: new Date().toISOString()
      });
    }
    
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        error: {
          code: 'TOKEN_EXPIRED',
          message: 'Token has expired'
        },
        timestamp: new Date().toISOString()
      });
    }

    return res.status(500).json({
      success: false,
      error: {
        code: 'AUTH_ERROR',
        message: 'Authentication error'
      },
      timestamp: new Date().toISOString()
    });
  }
};

// Optional authentication (doesn't fail if no token)
const optionalAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
      req.user = null;
      req.userId = null;
      return next();
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.userId);
    
    if (user) {
      req.user = user;
      req.userId = user.id;
    } else {
      req.user = null;
      req.userId = null;
    }
    
    next();
  } catch (error) {
    // If token is invalid, just continue without user
    req.user = null;
    req.userId = null;
    next();
  }
};

// Generate JWT token
const generateToken = (userId, rememberMe = false) => {
  // Set different expiration times based on rememberMe
  const expiresIn = rememberMe 
    ? process.env.JWT_REMEMBER_EXPIRE || '30d'  // 30 days for remember me
    : process.env.JWT_EXPIRE || '24h';          // 24 hours for normal login

  return jwt.sign(
    { userId },
    process.env.JWT_SECRET,
    { 
      expiresIn,
      issuer: 'todo-app',
      audience: 'todo-app-users'
    }
  );
};

// Generate refresh token
const generateRefreshToken = (userId, rememberMe = false) => {
  // Set different expiration times based on rememberMe
  const expiresIn = rememberMe 
    ? process.env.JWT_REFRESH_REMEMBER_EXPIRE || '60d'  // 60 days for remember me
    : process.env.JWT_REFRESH_EXPIRE || '7d';           // 7 days for normal login

  return jwt.sign(
    { userId, type: 'refresh' },
    process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET,
    { 
      expiresIn,
      issuer: 'todo-app',
      audience: 'todo-app-users'
    }
  );
};

// Verify refresh token
const verifyRefreshToken = (token) => {
  try {
    const decoded = jwt.verify(token, process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET);
    if (decoded.type !== 'refresh') {
      throw new Error('Invalid token type');
    }
    return decoded;
  } catch (error) {
    throw new Error('Invalid refresh token');
  }
};

// Check if user owns resource
const checkResourceOwnership = (resourceUserId) => {
  return (req, res, next) => {
    if (req.userId !== resourceUserId) {
      logger.warn('Access denied - resource ownership', { 
        userId: req.userId, 
        resourceUserId,
        url: req.url 
      });
      return res.status(403).json({
        success: false,
        error: {
          code: 'ACCESS_DENIED',
          message: 'You do not have permission to access this resource'
        },
        timestamp: new Date().toISOString()
      });
    }
    next();
  };
};

module.exports = {
  authenticateToken,
  optionalAuth,
  generateToken,
  generateRefreshToken,
  verifyRefreshToken,
  checkResourceOwnership
};