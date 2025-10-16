// Authentication routes for v0.5
const express = require('express');
const bcrypt = require('bcryptjs');
const User = require('../models/User');
const { generateToken, generateRefreshToken, verifyRefreshToken, authenticateToken } = require('../middleware/auth');
const { validateUserRegistration, validateUserLogin } = require('../middleware/validation');
const { logger } = require('../utils/logger');

const router = express.Router();

// User registration
router.post('/register', validateUserRegistration, async (req, res) => {
  try {
    const { username, email, password } = req.body;

    // Check if user already exists
    const existingUser = await User.findByEmail(email);
    if (existingUser) {
      logger.warn('Registration attempt with existing email', { email });
      return res.status(409).json({
        success: false,
        error: {
          code: 'USER_EXISTS',
          message: 'User with this email already exists'
        },
        timestamp: new Date().toISOString()
      });
    }

    // Check if username already exists
    const existingUsername = await User.findByUsername(username);
    if (existingUsername) {
      logger.warn('Registration attempt with existing username', { username });
      return res.status(409).json({
        success: false,
        error: {
          code: 'USERNAME_EXISTS',
          message: 'Username already taken'
        },
        timestamp: new Date().toISOString()
      });
    }

    // Create new user
    const user = await User.create({ username, email, password });
    
    // Generate tokens (default to normal expiration for registration)
    const token = generateToken(user.id, false);
    const refreshToken = generateRefreshToken(user.id, false);

    logger.info('User registered successfully', { userId: user.id, email });

    res.status(201).json({
      success: true,
      message: 'User registered successfully',
      data: {
        user: user.toJSON(),
        token,
        refreshToken
      },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    logger.error('Registration error', { error: error.message, email: req.body.email });
    res.status(500).json({
      success: false,
      error: {
        code: 'REGISTRATION_ERROR',
        message: 'Failed to register user'
      },
      timestamp: new Date().toISOString()
    });
  }
});

// User login
router.post('/login', validateUserLogin, async (req, res) => {
  try {
    const { email, password, rememberMe } = req.body;

    // Find user by email
    const user = await User.findByEmail(email);
    if (!user) {
      logger.warn('Login attempt with non-existent email', { email });
      return res.status(401).json({
        success: false,
        error: {
          code: 'INVALID_CREDENTIALS',
          message: 'Invalid email or password'
        },
        timestamp: new Date().toISOString()
      });
    }

    // Verify password
    const isValidPassword = await user.verifyPassword(password);
    if (!isValidPassword) {
      logger.warn('Login attempt with invalid password', { email });
      return res.status(401).json({
        success: false,
        error: {
          code: 'INVALID_CREDENTIALS',
          message: 'Invalid email or password'
        },
        timestamp: new Date().toISOString()
      });
    }

    // Generate tokens with different expiration based on rememberMe
    const token = generateToken(user.id, rememberMe);
    const refreshToken = generateRefreshToken(user.id, rememberMe);

    // Update last login (placeholder for future implementation)
    await user.updateLastLogin();

    logger.info('User logged in successfully', { userId: user.id, email });

    res.json({
      success: true,
      message: 'Login successful',
      data: {
        user: user.toJSON(),
        token,
        refreshToken
      },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    logger.error('Login error', { error: error.message, email: req.body.email });
    res.status(500).json({
      success: false,
      error: {
        code: 'LOGIN_ERROR',
        message: 'Failed to login'
      },
      timestamp: new Date().toISOString()
    });
  }
});

// Get user profile
router.get('/profile', authenticateToken, async (req, res) => {
  try {
    res.json({
      success: true,
      data: {
        user: req.user.toJSON()
      },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    logger.error('Profile fetch error', { error: error.message, userId: req.user.id });
    res.status(500).json({
      success: false,
      error: {
        code: 'PROFILE_ERROR',
        message: 'Failed to fetch profile'
      },
      timestamp: new Date().toISOString()
    });
  }
});

// Update user profile
router.put('/profile', authenticateToken, async (req, res) => {
  try {
    // Check if user is a demo user
    if (req.user.isDemoUser()) {
      logger.warn('Demo user attempted profile update', { userId: req.user.id });
      return res.status(403).json({
        success: false,
        error: {
          code: 'DEMO_USER_RESTRICTION',
          message: 'Profile updates are disabled for demo users'
        },
        timestamp: new Date().toISOString()
      });
    }

    const { username, email, theme_preference } = req.body;
    const updateData = {};

    // Only update provided fields
    if (username) updateData.username = username;
    if (email) updateData.email = email;
    if (theme_preference) updateData.theme_preference = theme_preference;

    if (Object.keys(updateData).length === 0) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'NO_UPDATES',
          message: 'No valid fields to update'
        },
        timestamp: new Date().toISOString()
      });
    }

    // Check if new email already exists
    if (email && email !== req.user.email) {
      const existingUser = await User.findByEmail(email);
      if (existingUser) {
        return res.status(409).json({
          success: false,
          error: {
            code: 'EMAIL_EXISTS',
            message: 'Email already in use'
          },
          timestamp: new Date().toISOString()
        });
      }
    }

    // Check if new username already exists
    if (username && username !== req.user.username) {
      const existingUsername = await User.findByUsername(username);
      if (existingUsername) {
        return res.status(409).json({
          success: false,
          error: {
            code: 'USERNAME_EXISTS',
            message: 'Username already taken'
          },
          timestamp: new Date().toISOString()
        });
      }
    }

    // Update user
    await req.user.update(updateData);

    logger.info('User profile updated', { userId: req.user.id });

    res.json({
      success: true,
      message: 'Profile updated successfully',
      data: {
        user: req.user.toJSON()
      },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    logger.error('Profile update error', { error: error.message, userId: req.user.id });
    res.status(500).json({
      success: false,
      error: {
        code: 'UPDATE_ERROR',
        message: 'Failed to update profile'
      },
      timestamp: new Date().toISOString()
    });
  }
});

// Change password
router.put('/change-password', authenticateToken, async (req, res) => {
  try {
    // Check if user is a demo user
    if (req.user.isDemoUser()) {
      logger.warn('Demo user attempted password change', { userId: req.user.id });
      return res.status(403).json({
        success: false,
        error: {
          code: 'DEMO_USER_RESTRICTION',
          message: 'Password changes are disabled for demo users'
        },
        timestamp: new Date().toISOString()
      });
    }

    const { currentPassword, newPassword } = req.body;

    // Validate required fields
    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'MISSING_FIELDS',
          message: 'Current password and new password are required'
        },
        timestamp: new Date().toISOString()
      });
    }

    // Validate new password strength
    if (newPassword.length < 8) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'WEAK_PASSWORD',
          message: 'New password must be at least 8 characters long'
        },
        timestamp: new Date().toISOString()
      });
    }

    // Check for uppercase letter
    if (!/[A-Z]/.test(newPassword)) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'WEAK_PASSWORD',
          message: 'New password must contain at least one uppercase letter'
        },
        timestamp: new Date().toISOString()
      });
    }

    // Check for lowercase letter
    if (!/[a-z]/.test(newPassword)) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'WEAK_PASSWORD',
          message: 'New password must contain at least one lowercase letter'
        },
        timestamp: new Date().toISOString()
      });
    }

    // Check for number
    if (!/[0-9]/.test(newPassword)) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'WEAK_PASSWORD',
          message: 'New password must contain at least one number'
        },
        timestamp: new Date().toISOString()
      });
    }

    // Verify current password
    const isValidPassword = await req.user.verifyPassword(currentPassword);
    if (!isValidPassword) {
      logger.warn('Invalid current password provided for password change', { userId: req.user.id });
      return res.status(401).json({
        success: false,
        error: {
          code: 'INVALID_CURRENT_PASSWORD',
          message: 'Current password is incorrect'
        },
        timestamp: new Date().toISOString()
      });
    }

    // Check if new password is different from current password
    const isSamePassword = await req.user.verifyPassword(newPassword);
    if (isSamePassword) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'SAME_PASSWORD',
          message: 'New password must be different from current password'
        },
        timestamp: new Date().toISOString()
      });
    }

    // Update password
    await req.user.updatePassword(newPassword);

    logger.info('User password changed successfully', { userId: req.user.id });

    res.json({
      success: true,
      message: 'Password changed successfully',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    logger.error('Password change error', { error: error.message, userId: req.user.id });
    res.status(500).json({
      success: false,
      error: {
        code: 'PASSWORD_CHANGE_ERROR',
        message: 'Failed to change password'
      },
      timestamp: new Date().toISOString()
    });
  }
});

// Refresh token
router.post('/refresh', async (req, res) => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'NO_REFRESH_TOKEN',
          message: 'Refresh token required'
        },
        timestamp: new Date().toISOString()
      });
    }

    // Verify refresh token
    const decoded = verifyRefreshToken(refreshToken);
    
    // Get user
    const user = await User.findById(decoded.userId);
    if (!user) {
      return res.status(401).json({
        success: false,
        error: {
          code: 'INVALID_REFRESH_TOKEN',
          message: 'Invalid refresh token'
        },
        timestamp: new Date().toISOString()
      });
    }

    // Generate new tokens (maintain same expiration as original)
    const newToken = generateToken(user.id, false);
    const newRefreshToken = generateRefreshToken(user.id, false);

    logger.info('Token refreshed', { userId: user.id });

    res.json({
      success: true,
      message: 'Token refreshed successfully',
      data: {
        token: newToken,
        refreshToken: newRefreshToken
      },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    logger.error('Token refresh error', { error: error.message });
    res.status(401).json({
      success: false,
      error: {
        code: 'REFRESH_ERROR',
        message: 'Failed to refresh token'
      },
      timestamp: new Date().toISOString()
    });
  }
});

// Logout (client-side token removal) - Allow logout even with invalid/expired tokens
router.post('/logout', async (req, res) => {
  try {
    // Try to authenticate, but don't fail if token is invalid
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    
    if (token) {
      try {
        const jwt = require('jsonwebtoken');
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        logger.info('User logged out', { userId: decoded.userId });
      } catch (tokenError) {
        // Token is invalid/expired, but that's okay for logout
        logger.info('User logged out with invalid token');
      }
    } else {
      logger.info('User logged out without token');
    }
    
    res.json({
      success: true,
      message: 'Logged out successfully',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    logger.error('Logout error', { error: error.message });
    res.status(500).json({
      success: false,
      error: {
        code: 'LOGOUT_ERROR',
        message: 'Failed to logout'
      },
      timestamp: new Date().toISOString()
    });
  }
});

module.exports = router;