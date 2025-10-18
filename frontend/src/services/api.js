import axios from 'axios';
import { API_CONFIG } from '../utils/constants';

// API configuration - completely dynamic
const API_BASE_URL = API_CONFIG.BASE_URL;

// Create axios instance
const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    // Check both localStorage and sessionStorage for token
    const token = localStorage.getItem('token') || sessionStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle token refresh
api.interceptors.response.use(
  (response) => {
    return response;
  },
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        // Check both localStorage and sessionStorage for refresh token
        const refreshToken = localStorage.getItem('refreshToken') || sessionStorage.getItem('refreshToken');
        if (refreshToken) {
          const response = await axios.post(`${API_BASE_URL}/auth/refresh`, {
            refreshToken,
          });

          if (response.data.success) {
            const { token, refreshToken: newRefreshToken } = response.data.data;
            
            // Determine which storage to use based on where the original token was stored
            const wasInLocalStorage = localStorage.getItem('refreshToken');
            if (wasInLocalStorage) {
              localStorage.setItem('token', token);
              localStorage.setItem('refreshToken', newRefreshToken);
            } else {
              sessionStorage.setItem('token', token);
              sessionStorage.setItem('refreshToken', newRefreshToken);
            }
            
            // Retry original request with new token
            originalRequest.headers.Authorization = `Bearer ${token}`;
            return api(originalRequest);
          }
        }
      } catch (refreshError) {
        // Refresh failed, but don't clear tokens or redirect here
        // Let the AuthContext handle the error appropriately
      }
    }

    return Promise.reject(error);
  }
);

// API service functions
export const authAPI = {
  // Register user
  register: async (userData) => {
    try {
      const response = await api.post('/auth/register', userData);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // Login user
  login: async (credentials) => {
    try {
      const response = await api.post('/auth/login', credentials);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // Get user profile
  getProfile: async () => {
    try {
      const response = await api.get('/auth/profile');
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // Update user profile
  updateProfile: async (profileData) => {
    try {
      const response = await api.put('/auth/profile', profileData);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // Change password
  changePassword: async (passwordData) => {
    try {
      const response = await api.put('/auth/change-password', passwordData);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // Refresh token
  refreshToken: async (refreshToken) => {
    try {
      const response = await api.post('/auth/refresh', { refreshToken });
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // Logout user
  logout: async () => {
    try {
      const response = await api.post('/auth/logout', {});
      return response.data;
    } catch (error) {
      throw error;
    }
  },
};

export const todosAPI = {
  // Get all todos
  getTodos: async (params = {}) => {
    try {
      const response = await api.get('/todos', { params });
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // Advanced search todos
  advancedSearch: async (params = {}) => {
    try {
      // Convert arrays to comma-separated strings for backend compatibility
      const processedParams = { ...params };
      if (processedParams.priorities && Array.isArray(processedParams.priorities)) {
        processedParams.priorities = processedParams.priorities.join(',');
      }
      if (processedParams.categories && Array.isArray(processedParams.categories)) {
        processedParams.categories = processedParams.categories.join(',');
      }
      
      const response = await api.get('/advanced/search', { params: processedParams });
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // Get specific todo
  getTodo: async (id) => {
    try {
      const response = await api.get(`/todos/${id}`);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // Create todo
  createTodo: async (todoData) => {
    try {
      const response = await api.post('/todos', todoData);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // Update todo
  updateTodo: async (id, todoData) => {
    try {
      const response = await api.put(`/todos/${id}`, todoData);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // Delete todo
  deleteTodo: async (id) => {
    try {
      const response = await api.delete(`/todos/${id}`);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // Toggle todo completion
  toggleTodo: async (id) => {
    try {
      const response = await api.patch(`/todos/${id}/toggle`, {}, {
        headers: {
          'Content-Type': 'application/json'
        }
      });
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // Search todos
  searchTodos: async (query, params = {}) => {
    try {
      const response = await api.post('/todos/search', {
        query,
        ...params,
      });
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // Bulk operations
  bulkUpdate: async (todoIds, updates) => {
    try {
      const response = await api.patch('/bulk/todos', {
        todoIds,
        updates,
      });
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  bulkUpdateState: async (todoIds, state) => {
    try {
      const response = await api.patch('/bulk/todos/state', {
        todoIds,
        state,
      });
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  bulkUpdatePriority: async (todoIds, priority) => {
    try {
      const response = await api.patch('/bulk/todos/priority', {
        todoIds,
        priority,
      });
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  bulkUpdateCategory: async (todoIds, category) => {
    try {
      const response = await api.patch('/bulk/todos/category', {
        todoIds,
        category,
      });
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  bulkDelete: async (todoIds) => {
    try {
      const response = await api.delete('/bulk/todos', {
        data: { todoIds },
      });
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // Get todo statistics
  getStats: async () => {
    try {
      const response = await api.get('/todos/stats');
      return response.data;
    } catch (error) {
      throw error;
    }
  },
};

export const healthAPI = {
  // Health check
  check: async () => {
    try {
      const response = await api.get('/health');
      return response.data;
    } catch (error) {
      throw error;
    }
  },
};

export const notificationsAPI = {
  // Get notifications
  getNotifications: async (params = {}) => {
    try {
      const response = await api.get('/notifications', { params });
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // Get unread count
  getUnreadCount: async () => {
    try {
      const response = await api.get('/notifications/unread-count');
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // Mark notification as read
  markAsRead: async (notificationId) => {
    try {
      const response = await api.put(`/notifications/${notificationId}/read`);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // Mark all notifications as read
  markAllAsRead: async () => {
    try {
      const response = await api.put('/notifications/read-all');
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // Get notification preferences
  getPreferences: async () => {
    try {
      const response = await api.get('/notifications/preferences');
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // Update notification preferences
  updatePreferences: async (preferences) => {
    try {
      const response = await api.put('/notifications/preferences', preferences);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // Send test notification
  sendTestNotification: async (type = 'system_notification') => {
    try {
      const response = await api.post('/notifications/test', { type });
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // Delete notification
  deleteNotification: async (notificationId) => {
    try {
      const response = await api.delete(`/notifications/${notificationId}`);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // Get notification statistics
  getStats: async () => {
    try {
      const response = await api.get('/notifications/stats');
      return response.data;
    } catch (error) {
      throw error;
    }
  },
};

// Export default api instance
export default api;