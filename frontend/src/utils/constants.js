// Application constants and configuration

// API Configuration
export const API_CONFIG = {
  BASE_URL: process.env.REACT_APP_API_URL || 'http://localhost:5002/api',
  TIMEOUT: 10000,
  RETRY_ATTEMPTS: 3,
  RETRY_DELAY: 1000,
};

// App Configuration
export const APP_CONFIG = {
  NAME: process.env.REACT_APP_APP_NAME || 'Todo App',
  VERSION: process.env.REACT_APP_VERSION || '0.5.0',
  DESCRIPTION: 'A modern todo application with JWT authentication',
  AUTHOR: 'Todo App Team',
  SUPPORT_EMAIL: 'support@todoapp.com',
};

// Feature Flags
export const FEATURES = {
  REAL_TIME: process.env.REACT_APP_ENABLE_REAL_TIME === 'true',
  FILE_UPLOAD: process.env.REACT_APP_ENABLE_FILE_UPLOAD === 'true',
  NOTIFICATIONS: process.env.REACT_APP_ENABLE_NOTIFICATIONS === 'true',
  ANALYTICS: process.env.REACT_APP_ENABLE_ANALYTICS === 'true',
  DEBUG: process.env.REACT_APP_DEBUG === 'true',
  MOCK_API: process.env.REACT_APP_MOCK_API === 'true',
};

// Todo Configuration
export const TODO_CONFIG = {
  PRIORITIES: [
    { value: 'low', label: 'Low', color: 'green' },
    { value: 'medium', label: 'Medium', color: 'yellow' },
    { value: 'high', label: 'High', color: 'red' },
  ],
  
  CATEGORIES: [
    { value: 'work', label: 'Work', icon: 'briefcase' },
    { value: 'personal', label: 'Personal', icon: 'user' },
    { value: 'shopping', label: 'Shopping', icon: 'shopping-cart' },
    { value: 'health', label: 'Health', icon: 'heart' },
    { value: 'finance', label: 'Finance', icon: 'dollar-sign' },
    { value: 'education', label: 'Education', icon: 'book' },
    { value: 'travel', label: 'Travel', icon: 'map-pin' },
    { value: 'other', label: 'Other', icon: 'more-horizontal' },
  ],
  
  STATUSES: [
    { value: 'pending', label: 'In Progress', color: 'yellow' },
    { value: 'completed', label: 'Completed', color: 'green' },
    { value: 'overdue', label: 'Overdue', color: 'red' },
  ],
  
  SORT_OPTIONS: [
    { value: 'created_at', label: 'Created Date' },
    { value: 'updated_at', label: 'Updated Date' },
    { value: 'due_date', label: 'Due Date' },
    { value: 'title', label: 'Title' },
    { value: 'priority', label: 'Priority' },
    { value: 'category', label: 'Category' },
  ],
  
  SORT_DIRECTIONS: [
    { value: 'asc', label: 'Ascending' },
    { value: 'desc', label: 'Descending' },
  ],
  
  FILTER_OPTIONS: {
    COMPLETION: [
      { value: 'all', label: 'All' },
      { value: 'completed', label: 'Completed' },
      { value: 'pending', label: 'In Progress' },
    ],
    
    DUE_DATE: [
      { value: 'all', label: 'All' },
      { value: 'today', label: 'Today' },
      { value: 'tomorrow', label: 'Tomorrow' },
      { value: 'this_week', label: 'This Week' },
      { value: 'overdue', label: 'Overdue' },
      { value: 'no_date', label: 'No Date' },
    ],
  },
  
  PAGINATION: {
    DEFAULT_PAGE_SIZE: 20,
    PAGE_SIZE_OPTIONS: [10, 20, 50, 100],
    MAX_PAGE_SIZE: 100,
  },
  
  SEARCH: {
    MIN_QUERY_LENGTH: 1,
    MAX_QUERY_LENGTH: 100,
    DEBOUNCE_DELAY: 300,
  },
};

// File Upload Configuration (v0.6+)
export const FILE_CONFIG = {
  MAX_FILE_SIZE: 10 * 1024 * 1024, // 10MB
  ALLOWED_TYPES: [
    'image/jpeg',
    'image/png',
    'image/gif',
    'image/webp',
    'application/pdf',
    'text/plain',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  ],
  
  ALLOWED_EXTENSIONS: [
    '.jpg', '.jpeg', '.png', '.gif', '.webp',
    '.pdf', '.txt', '.doc', '.docx',
  ],
  
  UPLOAD_DIR: 'uploads',
  THUMBNAIL_SIZE: 200,
  COMPRESSION_QUALITY: 0.8,
};

// Theme Configuration
export const THEME_CONFIG = {
  THEMES: [
    { value: 'light', label: 'Light', icon: 'sun' },
    { value: 'dark', label: 'Dark', icon: 'moon' },
    { value: 'system', label: 'System', icon: 'monitor' },
  ],
  
  COLORS: {
    PRIMARY: 'blue',
    SECONDARY: 'gray',
    SUCCESS: 'green',
    WARNING: 'yellow',
    ERROR: 'red',
    INFO: 'blue',
  },
  
  FONT_SIZES: {
    xs: 'text-xs',
    sm: 'text-sm',
    base: 'text-base',
    lg: 'text-lg',
    xl: 'text-xl',
    '2xl': 'text-2xl',
    '3xl': 'text-3xl',
  },
};

// Language Configuration
export const LANGUAGE_CONFIG = {
  LANGUAGES: [
    { value: 'en', label: 'English', flag: '🇺🇸' },
    { value: 'es', label: 'Español', flag: '🇪🇸' },
    { value: 'fr', label: 'Français', flag: '🇫🇷' },
    { value: 'de', label: 'Deutsch', flag: '🇩🇪' },
    { value: 'it', label: 'Italiano', flag: '🇮🇹' },
    { value: 'pt', label: 'Português', flag: '🇵🇹' },
  ],
  
  DEFAULT_LANGUAGE: 'en',
  FALLBACK_LANGUAGE: 'en',
};

// Notification Configuration (v0.7+)
export const NOTIFICATION_CONFIG = {
  TYPES: [
    { value: 'info', label: 'Information', icon: 'info' },
    { value: 'success', label: 'Success', icon: 'check-circle' },
    { value: 'warning', label: 'Warning', icon: 'alert-triangle' },
    { value: 'error', label: 'Error', icon: 'x-circle' },
  ],
  
  POSITIONS: [
    { value: 'top-right', label: 'Top Right' },
    { value: 'top-left', label: 'Top Left' },
    { value: 'bottom-right', label: 'Bottom Right' },
    { value: 'bottom-left', label: 'Bottom Left' },
    { value: 'top-center', label: 'Top Center' },
    { value: 'bottom-center', label: 'Bottom Center' },
  ],
  
  DURATIONS: {
    SHORT: 3000,
    MEDIUM: 5000,
    LONG: 7000,
    PERSISTENT: 0,
  },
  
  SETTINGS: {
    DEFAULT_DURATION: 5000,
    DEFAULT_POSITION: 'top-right',
    MAX_NOTIFICATIONS: 5,
    STACK_NOTIFICATIONS: true,
  },
};

// Validation Rules
export const VALIDATION_RULES = {
  USERNAME: {
    MIN_LENGTH: 3,
    MAX_LENGTH: 30,
    PATTERN: /^(?=.*[a-zA-Z])[a-zA-Z0-9_]+$/,
    MESSAGE: 'Username must be 3-30 characters long, contain at least one letter, and can only contain letters, numbers, and underscores',
  },
  
  EMAIL: {
    PATTERN: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
    MESSAGE: 'Please enter a valid email address',
  },
  
  PASSWORD: {
    MIN_LENGTH: 8,
    PATTERN: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]).*$/,
    MESSAGE: 'Password must be at least 8 characters long and contain at least one uppercase letter, one lowercase letter, one number, and one special character',
  },
  
  TODO_TITLE: {
    MIN_LENGTH: 1,
    MAX_LENGTH: 200,
    MESSAGE: 'Title must be between 1 and 200 characters',
  },
  
  TODO_DESCRIPTION: {
    MAX_LENGTH: 1000,
    MESSAGE: 'Description cannot exceed 1000 characters',
  },
  
  TODO_CATEGORY: {
    MAX_LENGTH: 50,
    MESSAGE: 'Category cannot exceed 50 characters',
  },
};

// Date Formats
export const DATE_FORMATS = {
  DISPLAY: 'MMM dd, yyyy',
  DISPLAY_WITH_TIME: 'MMM dd, yyyy h:mm a',
  DISPLAY_SHORT: 'MMM dd',
  DISPLAY_LONG: 'EEEE, MMMM dd, yyyy',
  INPUT: 'yyyy-MM-dd',
  INPUT_WITH_TIME: 'yyyy-MM-dd\'T\'HH:mm',
  ISO: 'yyyy-MM-dd\'T\'HH:mm:ss.SSS\'Z\'',
  RELATIVE: 'relative',
};

// Local Storage Keys
export const STORAGE_KEYS = {
  TOKEN: 'token',
  REFRESH_TOKEN: 'refreshToken',
  USER: 'user',
  THEME: 'theme',
  LANGUAGE: 'language',
  PREFERENCES: 'preferences',
  TODOS_FILTERS: 'todosFilters',
  TODOS_SORT: 'todosSort',
  RECENT_SEARCHES: 'recentSearches',
};

// API Endpoints
export const API_ENDPOINTS = {
  AUTH: {
    REGISTER: '/auth/register',
    LOGIN: '/auth/login',
    PROFILE: '/auth/profile',
    REFRESH: '/auth/refresh',
    LOGOUT: '/auth/logout',
  },
  
  TODOS: {
    LIST: '/todos',
    CREATE: '/todos',
    GET: (id) => `/todos/${id}`,
    UPDATE: (id) => `/todos/${id}`,
    DELETE: (id) => `/todos/${id}`,
    TOGGLE: (id) => `/todos/${id}/toggle`,
    SEARCH: '/todos/search',
    BULK: '/todos/bulk',
    STATS: '/todos/stats',
  },
  
  HEALTH: '/health',
};

// HTTP Status Codes
export const HTTP_STATUS = {
  OK: 200,
  CREATED: 201,
  NO_CONTENT: 204,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  CONFLICT: 409,
  UNPROCESSABLE_ENTITY: 422,
  INTERNAL_SERVER_ERROR: 500,
  SERVICE_UNAVAILABLE: 503,
};

// Error Codes
export const ERROR_CODES = {
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  NO_TOKEN: 'NO_TOKEN',
  INVALID_TOKEN: 'INVALID_TOKEN',
  TOKEN_EXPIRED: 'TOKEN_EXPIRED',
  USER_EXISTS: 'USER_EXISTS',
  USERNAME_EXISTS: 'USERNAME_EXISTS',
  INVALID_CREDENTIALS: 'INVALID_CREDENTIALS',
  TODO_NOT_FOUND: 'TODO_NOT_FOUND',
  ACCESS_DENIED: 'ACCESS_DENIED',
  AUTH_ERROR: 'AUTH_ERROR',
  FETCH_ERROR: 'FETCH_ERROR',
  CREATE_ERROR: 'CREATE_ERROR',
  UPDATE_ERROR: 'UPDATE_ERROR',
  DELETE_ERROR: 'DELETE_ERROR',
  TOGGLE_ERROR: 'TOGGLE_ERROR',
  SEARCH_ERROR: 'SEARCH_ERROR',
  BULK_ERROR: 'BULK_ERROR',
  STATS_ERROR: 'STATS_ERROR',
  PROFILE_ERROR: 'PROFILE_ERROR',
  UPDATE_PROFILE_ERROR: 'UPDATE_PROFILE_ERROR',
  LOGOUT_ERROR: 'LOGOUT_ERROR',
  REFRESH_ERROR: 'REFRESH_ERROR',
  REGISTRATION_ERROR: 'REGISTRATION_ERROR',
  LOGIN_ERROR: 'LOGIN_ERROR',
};

// Animation Durations
export const ANIMATION_DURATION = {
  FAST: 150,
  NORMAL: 300,
  SLOW: 500,
  VERY_SLOW: 1000,
};

// Breakpoints
export const BREAKPOINTS = {
  SM: 640,
  MD: 768,
  LG: 1024,
  XL: 1280,
  '2XL': 1536,
};

// Z-Index Values
export const Z_INDEX = {
  DROPDOWN: 1000,
  STICKY: 1020,
  FIXED: 1030,
  MODAL_BACKDROP: 1040,
  MODAL: 1050,
  POPOVER: 1060,
  TOOLTIP: 1070,
  TOAST: 1080,
};

// Keyboard Shortcuts
export const KEYBOARD_SHORTCUTS = {
  NEW_TODO: 'Ctrl+N',
  SEARCH: 'Ctrl+K',
  TOGGLE_THEME: 'Ctrl+Shift+T',
  SAVE: 'Ctrl+S',
  CANCEL: 'Escape',
  CONFIRM: 'Enter',
  DELETE: 'Delete',
  SELECT_ALL: 'Ctrl+A',
};

// Performance Thresholds
export const PERFORMANCE_THRESHOLDS = {
  API_RESPONSE_TIME: 200, // ms
  UI_RESPONSE_TIME: 100, // ms
  ANIMATION_DURATION: 300, // ms
  DEBOUNCE_DELAY: 300, // ms
  THROTTLE_DELAY: 100, // ms
};

// Accessibility
export const ACCESSIBILITY = {
  FOCUS_VISIBLE: 'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
  SCREEN_READER_ONLY: 'sr-only',
  REDUCED_MOTION: 'motion-reduce:transition-none',
};

// Export all constants as default
const constants = {
  API_CONFIG,
  APP_CONFIG,
  FEATURES,
  TODO_CONFIG,
  FILE_CONFIG,
  THEME_CONFIG,
  LANGUAGE_CONFIG,
  NOTIFICATION_CONFIG,
  VALIDATION_RULES,
  DATE_FORMATS,
  STORAGE_KEYS,
  API_ENDPOINTS,
  HTTP_STATUS,
  ERROR_CODES,
  ANIMATION_DURATION,
  BREAKPOINTS,
  Z_INDEX,
  KEYBOARD_SHORTCUTS,
  PERFORMANCE_THRESHOLDS,
  ACCESSIBILITY,
};

export default constants;