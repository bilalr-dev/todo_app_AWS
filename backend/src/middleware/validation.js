// Input validation middleware for v0.5
const { body, validationResult } = require('express-validator');
const { logger } = require('../utils/logger');
const { PASSWORD_PATTERN, USERNAME_PATTERN, EMAIL_PATTERN, TODO_RULES } = require('../utils/validation');

// Validation error handler
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    logger.warn('Validation errors', { 
      errors: errors.array(), 
      url: req.url, 
      method: req.method 
    });
    
    return res.status(400).json({
      success: false,
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Invalid input data',
        details: errors.array()
      },
      timestamp: new Date().toISOString()
    });
  }
  next();
};

// User registration validation
const validateUserRegistration = [
  body('username')
    .isLength({ min: 3, max: 30 })
    .withMessage('Username must be between 3 and 30 characters')
    .matches(USERNAME_PATTERN)
    .withMessage('Username must contain at least one letter and can only contain letters, numbers, and underscores'),
  
  body('email')
    .isEmail()
    .withMessage('Please provide a valid email address')
    .normalizeEmail(),
  
  body('password')
    .isLength({ min: 8 })
    .withMessage('Password must be at least 8 characters long')
    .matches(PASSWORD_PATTERN)
    .withMessage('Password must contain at least one lowercase letter, one uppercase letter, and one number'),
  
  handleValidationErrors
];

// User login validation
const validateUserLogin = [
  body('email')
    .isEmail()
    .withMessage('Please provide a valid email address')
    .normalizeEmail(),
  
  body('password')
    .notEmpty()
    .withMessage('Password is required'),
  
  handleValidationErrors
];

// Todo creation validation
const validateTodoCreation = [
  body('title')
    .isLength({ min: 1, max: 200 })
    .withMessage('Title must be between 1 and 200 characters')
    .trim(),
  
  body('description')
    .optional()
    .isLength({ max: 1000 })
    .withMessage('Description must be less than 1000 characters')
    .trim(),
  
  body('priority')
    .optional()
    .isIn(['low', 'medium', 'high'])
    .withMessage('Priority must be low, medium, or high'),
  
  body('due_date')
    .optional()
    .isISO8601()
    .withMessage('Due date must be a valid ISO 8601 date')
    .custom((value) => {
      if (value) {
        const dueDate = new Date(value);
        const today = new Date();
        today.setHours(0, 0, 0, 0); // Reset time to start of day
        dueDate.setHours(0, 0, 0, 0); // Reset time to start of day
        
        if (dueDate < today) {
          throw new Error('Due date cannot be in the past');
        }
      }
      return true;
    }),
  
  body('state')
    .optional()
    .isIn(['todo', 'inProgress', 'complete'])
    .withMessage('State must be todo, inProgress, or complete'),
  
  body('category')
    .optional()
    .isLength({ max: 50 })
    .withMessage('Category must be less than 50 characters')
    .trim(),
  
  handleValidationErrors
];

// Todo update validation
const validateTodoUpdate = [
  body('title')
    .optional()
    .isLength({ min: 1, max: 200 })
    .withMessage('Title must be between 1 and 200 characters')
    .trim(),
  
  body('description')
    .optional()
    .isLength({ max: 1000 })
    .withMessage('Description must be less than 1000 characters')
    .trim(),
  
  body('priority')
    .optional()
    .isIn(['low', 'medium', 'high'])
    .withMessage('Priority must be low, medium, or high'),
  
  body('due_date')
    .optional()
    .isISO8601()
    .withMessage('Due date must be a valid ISO 8601 date')
    .custom((value) => {
      if (value) {
        const dueDate = new Date(value);
        const today = new Date();
        today.setHours(0, 0, 0, 0); // Reset time to start of day
        dueDate.setHours(0, 0, 0, 0); // Reset time to start of day
        
        if (dueDate < today) {
          throw new Error('Due date cannot be in the past');
        }
      }
      return true;
    }),
  
  body('state')
    .optional()
    .isIn(['todo', 'inProgress', 'complete'])
    .withMessage('State must be todo, inProgress, or complete'),
  
  body('category')
    .optional()
    .isLength({ max: 50 })
    .withMessage('Category must be less than 50 characters')
    .trim(),
  
  body('completed')
    .optional()
    .isBoolean()
    .withMessage('Completed must be a boolean value'),
  
  handleValidationErrors
];

// Bulk operations validation
const validateBulkOperations = [
  body('todoIds')
    .isArray({ min: 1 })
    .withMessage('todoIds must be a non-empty array'),
  
  body('todoIds.*')
    .isInt({ min: 1 })
    .withMessage('Each todo ID must be a positive integer'),
  
  body('operation')
    .isIn(['delete', 'complete', 'uncomplete', 'update'])
    .withMessage('Operation must be delete, complete, uncomplete, or update'),
  
  body('updateData')
    .optional()
    .isObject()
    .withMessage('Update data must be an object'),
  
  handleValidationErrors
];

// Search validation
const validateSearch = [
  body('query')
    .isLength({ min: 1, max: 100 })
    .withMessage('Search query must be between 1 and 100 characters')
    .trim(),
  
  body('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limit must be between 1 and 100'),
  
  body('offset')
    .optional()
    .isInt({ min: 0 })
    .withMessage('Offset must be a non-negative integer'),
  
  handleValidationErrors
];

module.exports = {
  handleValidationErrors,
  validateUserRegistration,
  validateUserLogin,
  validateTodoCreation,
  validateTodoUpdate,
  validateBulkOperations,
  validateSearch
};