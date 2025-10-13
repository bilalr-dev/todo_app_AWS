/**
 * Shared validation constants for frontend and backend
 * This ensures consistent validation rules across the entire application
 */

// Password validation pattern - Enhanced for stronger security
const PASSWORD_PATTERN = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]).*$/;

// Password validation rules
const PASSWORD_RULES = {
  MIN_LENGTH: 8,
  PATTERN: PASSWORD_PATTERN,
  MESSAGE: 'Password must be at least 8 characters long and contain at least one uppercase letter, one lowercase letter, one number, and one special character',
  REQUIREMENTS: {
    MIN_LENGTH: 8,
    UPPERCASE: true,
    LOWERCASE: true,
    NUMBER: true,
    SPECIAL_CHARS: true, // Require special characters
  }
};

// Username validation pattern - Enhanced to require at least one letter
const USERNAME_PATTERN = /^(?=.*[a-zA-Z])[a-zA-Z0-9_]+$/;

// Username validation rules
const USERNAME_RULES = {
  MIN_LENGTH: 3,
  MAX_LENGTH: 30,
  PATTERN: USERNAME_PATTERN,
  MESSAGE: 'Username must be between 3 and 30 characters, contain at least one letter, and can only contain letters, numbers, and underscores',
  REQUIREMENTS: {
    MIN_LENGTH: 3,
    MAX_LENGTH: 30,
    LETTERS_REQUIRED: true,
    ALLOWED_CHARS: 'letters, numbers, underscores'
  }
};

// Email validation pattern
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Email validation rules
const EMAIL_RULES = {
  PATTERN: EMAIL_PATTERN,
  MESSAGE: 'Please provide a valid email address',
  REQUIREMENTS: {
    FORMAT: 'valid email format'
  }
};

// Todo validation rules
const TODO_RULES = {
  TITLE: {
    MIN_LENGTH: 1,
    MAX_LENGTH: 200,
    MESSAGE: 'Title must be between 1 and 200 characters'
  },
  DESCRIPTION: {
    MAX_LENGTH: 1000,
    MESSAGE: 'Description must be less than 1000 characters'
  },
  PRIORITY: {
    VALUES: ['low', 'medium', 'high'],
    MESSAGE: 'Priority must be low, medium, or high'
  },
  CATEGORY: {
    MAX_LENGTH: 50,
    MESSAGE: 'Category must be less than 50 characters'
  }
};

// Validation helper functions
const validatePassword = (password) => {
  if (!password || typeof password !== 'string') {
    return { valid: false, message: 'Password is required' };
  }
  
  if (password.length < PASSWORD_RULES.MIN_LENGTH) {
    return { valid: false, message: `Password must be at least ${PASSWORD_RULES.MIN_LENGTH} characters long` };
  }
  
  if (!PASSWORD_RULES.PATTERN.test(password)) {
    return { valid: false, message: PASSWORD_RULES.MESSAGE };
  }
  
  return { valid: true };
};

const validateUsername = (username) => {
  if (!username || typeof username !== 'string') {
    return { valid: false, message: 'Username is required' };
  }
  
  if (username.length < USERNAME_RULES.MIN_LENGTH || username.length > USERNAME_RULES.MAX_LENGTH) {
    return { valid: false, message: `Username must be between ${USERNAME_RULES.MIN_LENGTH} and ${USERNAME_RULES.MAX_LENGTH} characters` };
  }
  
  if (!USERNAME_RULES.PATTERN.test(username)) {
    return { valid: false, message: USERNAME_RULES.MESSAGE };
  }
  
  return { valid: true };
};

const validateEmail = (email) => {
  if (!email || typeof email !== 'string') {
    return { valid: false, message: 'Email is required' };
  }
  
  if (!EMAIL_RULES.PATTERN.test(email)) {
    return { valid: false, message: EMAIL_RULES.MESSAGE };
  }
  
  return { valid: true };
};

module.exports = {
  PASSWORD_PATTERN,
  PASSWORD_RULES,
  USERNAME_PATTERN,
  USERNAME_RULES,
  EMAIL_PATTERN,
  EMAIL_RULES,
  TODO_RULES,
  validatePassword,
  validateUsername,
  validateEmail
};
