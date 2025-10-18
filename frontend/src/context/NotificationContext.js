// Notification Context for Todo App v0.7
// Manages in-app notifications and preferences

import React, { createContext, useContext, useReducer, useEffect, useCallback } from 'react';
import { useWebSocket } from './WebSocketContext';
import { useAuth } from './AuthProvider';
import { useToast } from './ToastContext';
import { notificationsAPI } from '../services/api';

const NotificationContext = createContext();

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
};

// Initial state
const initialState = {
  notifications: [],
  unreadCount: 0,
  preferences: {
    email_enabled: true,
    in_app_enabled: true,
    due_date_reminders: true,
    file_upload_notifications: true,
    batch_frequency: 'hourly'
  },
  isLoading: false,
  error: null,
  pagination: {
    currentPage: 1,
    totalPages: 1,
    total: 0,
    hasMore: false
  }
};

// Action types
const NOTIFICATION_ACTIONS = {
  SET_LOADING: 'SET_LOADING',
  SET_ERROR: 'SET_ERROR',
  CLEAR_ERROR: 'CLEAR_ERROR',
  SET_NOTIFICATIONS: 'SET_NOTIFICATIONS',
  ADD_NOTIFICATION: 'ADD_NOTIFICATION',
  UPDATE_NOTIFICATION: 'UPDATE_NOTIFICATION',
  REMOVE_NOTIFICATION: 'REMOVE_NOTIFICATION',
  MARK_AS_READ: 'MARK_AS_READ',
  MARK_ALL_AS_READ: 'MARK_ALL_AS_READ',
  SET_UNREAD_COUNT: 'SET_UNREAD_COUNT',
  SET_PREFERENCES: 'SET_PREFERENCES',
  SET_PAGINATION: 'SET_PAGINATION'
};

// Reducer
const notificationReducer = (state, action) => {
  switch (action.type) {
    case NOTIFICATION_ACTIONS.SET_LOADING:
      return {
        ...state,
        isLoading: action.payload
      };

    case NOTIFICATION_ACTIONS.SET_ERROR:
      return {
        ...state,
        error: action.payload,
        isLoading: false
      };

    case NOTIFICATION_ACTIONS.CLEAR_ERROR:
      return {
        ...state,
        error: null
      };

    case NOTIFICATION_ACTIONS.SET_NOTIFICATIONS:
      return {
        ...state,
        notifications: action.payload.notifications,
        pagination: action.payload.pagination,
        isLoading: false
      };

    case NOTIFICATION_ACTIONS.ADD_NOTIFICATION:
      return {
        ...state,
        notifications: [action.payload, ...state.notifications],
        unreadCount: state.unreadCount + 1
      };

    case NOTIFICATION_ACTIONS.UPDATE_NOTIFICATION:
      return {
        ...state,
        notifications: state.notifications.map(notification =>
          notification.id === action.payload.id
            ? { ...notification, ...action.payload }
            : notification
        )
      };

    case NOTIFICATION_ACTIONS.REMOVE_NOTIFICATION:
      return {
        ...state,
        notifications: state.notifications.filter(
          notification => notification.id !== action.payload
        )
      };

    case NOTIFICATION_ACTIONS.MARK_AS_READ:
      return {
        ...state,
        notifications: state.notifications.map(notification =>
          notification.id === action.payload
            ? { ...notification, read: true }
            : notification
        ),
        unreadCount: Math.max(0, state.unreadCount - 1)
      };

    case NOTIFICATION_ACTIONS.MARK_ALL_AS_READ:
      return {
        ...state,
        notifications: state.notifications.map(notification => ({
          ...notification,
          read: true
        })),
        unreadCount: 0
      };

    case NOTIFICATION_ACTIONS.SET_UNREAD_COUNT:
      return {
        ...state,
        unreadCount: action.payload
      };

    case NOTIFICATION_ACTIONS.SET_PREFERENCES:
      return {
        ...state,
        preferences: action.payload
      };

    case NOTIFICATION_ACTIONS.SET_PAGINATION:
      return {
        ...state,
        pagination: action.payload
      };

    default:
      return state;
  }
};

// Notification provider component
export const NotificationProvider = ({ children }) => {
  const [state, dispatch] = useReducer(notificationReducer, initialState);
  const { isAuthenticated } = useAuth();
  const { showToast } = useToast();
  const { lastEvent, emitNotificationRead } = useWebSocket();

  // Load notifications when authenticated
  useEffect(() => {
    if (isAuthenticated) {
      loadNotifications();
      loadUnreadCount();
      loadPreferences();
    } else {
      dispatch({ type: NOTIFICATION_ACTIONS.SET_NOTIFICATIONS, payload: { notifications: [], pagination: initialState.pagination } });
    }
  }, [isAuthenticated]);

  // Handle WebSocket notification events
  useEffect(() => {
    if (!lastEvent || !isAuthenticated) return;

    const { type, data } = lastEvent;

    switch (type) {
      case 'notification':
        dispatch({
          type: NOTIFICATION_ACTIONS.ADD_NOTIFICATION,
          payload: data
        });
        
        // Show toast for important notifications
        if (data.type === 'due_date_reminder' || data.type === 'todo_created_high_priority') {
          showToast(data.message, 'info');
        }
        break;

      case 'notification_batch':
        // Handle batched notifications
        data.notifications.forEach(notification => {
          dispatch({
            type: NOTIFICATION_ACTIONS.ADD_NOTIFICATION,
            payload: notification
          });
        });
        break;

      case 'notifications_read':
        dispatch({
          type: NOTIFICATION_ACTIONS.SET_UNREAD_COUNT,
          payload: Math.max(0, state.unreadCount - data.count)
        });
        break;

      default:
        break;
    }
  }, [lastEvent, isAuthenticated, state.unreadCount, showToast]);

  // Load notifications
  const loadNotifications = useCallback(async (page = 1, limit = 20, options = {}) => {
    dispatch({ type: NOTIFICATION_ACTIONS.SET_LOADING, payload: true });
    
    try {
      const response = await notificationsAPI.getNotifications({
        page,
        limit,
        ...options
      });
      
      if (response.success) {
        dispatch({
          type: NOTIFICATION_ACTIONS.SET_NOTIFICATIONS,
          payload: {
            notifications: response.notifications,
            pagination: response.pagination
          }
        });
      } else {
        dispatch({
          type: NOTIFICATION_ACTIONS.SET_ERROR,
          payload: response.error?.message || 'Failed to load notifications'
        });
      }
    } catch (error) {
      dispatch({
        type: NOTIFICATION_ACTIONS.SET_ERROR,
        payload: 'Failed to load notifications'
      });
    }
  }, []);

  // Load unread count
  const loadUnreadCount = useCallback(async () => {
    try {
      const response = await notificationsAPI.getUnreadCount();
      
      if (response.success) {
        dispatch({
          type: NOTIFICATION_ACTIONS.SET_UNREAD_COUNT,
          payload: response.count
        });
      }
    } catch (error) {
      console.error('Failed to load unread count:', error);
    }
  }, []);

  // Load preferences
  const loadPreferences = useCallback(async () => {
    try {
      const response = await notificationsAPI.getPreferences();
      
      if (response.success) {
        dispatch({
          type: NOTIFICATION_ACTIONS.SET_PREFERENCES,
          payload: response.preferences
        });
      }
    } catch (error) {
      console.error('Failed to load preferences:', error);
    }
  }, []);

  // Mark notification as read
  const markAsRead = useCallback(async (notificationId) => {
    try {
      const response = await notificationsAPI.markAsRead(notificationId);
      
      if (response.success) {
        dispatch({
          type: NOTIFICATION_ACTIONS.MARK_AS_READ,
          payload: notificationId
        });
        
        // Emit WebSocket event
        emitNotificationRead(notificationId);
      } else {
        showToast(response.error?.message || 'Failed to mark notification as read', 'error');
      }
    } catch (error) {
      showToast('Failed to mark notification as read', 'error');
    }
  }, [emitNotificationRead, showToast]);

  // Mark all notifications as read
  const markAllAsRead = useCallback(async () => {
    try {
      const response = await notificationsAPI.markAllAsRead();
      
      if (response.success) {
        dispatch({
          type: NOTIFICATION_ACTIONS.MARK_ALL_AS_READ
        });
        showToast(`${response.count} notifications marked as read`, 'success');
      } else {
        showToast(response.error?.message || 'Failed to mark all notifications as read', 'error');
      }
    } catch (error) {
      showToast('Failed to mark all notifications as read', 'error');
    }
  }, [showToast]);

  // Update preferences
  const updatePreferences = useCallback(async (preferences) => {
    try {
      const response = await notificationsAPI.updatePreferences(preferences);
      
      if (response.success) {
        dispatch({
          type: NOTIFICATION_ACTIONS.SET_PREFERENCES,
          payload: response.preferences
        });
        showToast('Notification preferences updated', 'success');
      } else {
        showToast(response.error?.message || 'Failed to update preferences', 'error');
      }
    } catch (error) {
      showToast('Failed to update preferences', 'error');
    }
  }, [showToast]);

  // Delete notification
  const deleteNotification = useCallback(async (notificationId) => {
    try {
      const response = await notificationsAPI.deleteNotification(notificationId);
      
      if (response.success) {
        dispatch({
          type: NOTIFICATION_ACTIONS.REMOVE_NOTIFICATION,
          payload: notificationId
        });
        showToast('Notification deleted', 'success');
      } else {
        showToast(response.error?.message || 'Failed to delete notification', 'error');
      }
    } catch (error) {
      showToast('Failed to delete notification', 'error');
    }
  }, [showToast]);

  // Send test notification
  const sendTestNotification = useCallback(async (type = 'system_notification') => {
    try {
      const response = await notificationsAPI.sendTestNotification(type);
      
      if (response.success) {
        showToast('Test notification sent', 'success');
      } else {
        showToast(response.error?.message || 'Failed to send test notification', 'error');
      }
    } catch (error) {
      showToast('Failed to send test notification', 'error');
    }
  }, [showToast]);

  // Get notification statistics
  const getStats = useCallback(async () => {
    try {
      const response = await notificationsAPI.getStats();
      return response.success ? response.stats : null;
    } catch (error) {
      console.error('Failed to get notification stats:', error);
      return null;
    }
  }, []);

  const value = {
    // State
    notifications: state.notifications,
    unreadCount: state.unreadCount,
    preferences: state.preferences,
    isLoading: state.isLoading,
    error: state.error,
    pagination: state.pagination,

    // Actions
    loadNotifications,
    loadUnreadCount,
    loadPreferences,
    markAsRead,
    markAllAsRead,
    updatePreferences,
    deleteNotification,
    sendTestNotification,
    getStats,

    // Utilities
    clearError: () => dispatch({ type: NOTIFICATION_ACTIONS.CLEAR_ERROR })
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
};

export default NotificationContext;



