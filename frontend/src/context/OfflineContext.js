// Offline Context for Todo App v0.7
// Manages offline state and data synchronization

import React, { createContext, useContext, useReducer, useEffect, useCallback } from 'react';
import { useOfflineStatus } from '../hooks/useOfflineStatus';
import { useWebSocket } from './WebSocketContext';
import { useAuth } from './AuthProvider';
import { useToast } from './ToastContext';
import offlineStorageService from '../services/OfflineStorageService';
import { todosAPI } from '../services/api';

const OfflineContext = createContext();

export { OfflineContext };

export const useOffline = () => {
  const context = useContext(OfflineContext);
  if (!context) {
    throw new Error('useOffline must be used within an OfflineProvider');
  }
  return context;
};

// Initial state
const initialState = {
  isOffline: false,
  wasOffline: false,
  offlineDuration: 0,
  queuedActions: [],
  queuedActionsCount: 0,
  lastSyncTime: null,
  syncInProgress: false,
  cachedData: {
    todos: [],
    notifications: [],
    preferences: {}
  },
  storageInfo: null
};

// Action types
const OFFLINE_ACTIONS = {
  SET_OFFLINE_STATUS: 'SET_OFFLINE_STATUS',
  SET_QUEUED_ACTIONS: 'SET_QUEUED_ACTIONS',
  ADD_QUEUED_ACTION: 'ADD_QUEUED_ACTION',
  REMOVE_QUEUED_ACTION: 'REMOVE_QUEUED_ACTION',
  CLEAR_QUEUED_ACTIONS: 'CLEAR_QUEUED_ACTIONS',
  SET_LAST_SYNC_TIME: 'SET_LAST_SYNC_TIME',
  SET_SYNC_IN_PROGRESS: 'SET_SYNC_IN_PROGRESS',
  SET_CACHED_DATA: 'SET_CACHED_DATA',
  UPDATE_CACHED_DATA: 'UPDATE_CACHED_DATA',
  SET_STORAGE_INFO: 'SET_STORAGE_INFO'
};

// Reducer
const offlineReducer = (state, action) => {
  switch (action.type) {
    case OFFLINE_ACTIONS.SET_OFFLINE_STATUS:
      return {
        ...state,
        isOffline: action.payload.isOffline,
        wasOffline: action.payload.wasOffline,
        offlineDuration: action.payload.offlineDuration
      };

    case OFFLINE_ACTIONS.SET_QUEUED_ACTIONS:
      return {
        ...state,
        queuedActions: action.payload,
        queuedActionsCount: action.payload.length
      };

    case OFFLINE_ACTIONS.ADD_QUEUED_ACTION:
      return {
        ...state,
        queuedActions: [...state.queuedActions, action.payload],
        queuedActionsCount: state.queuedActionsCount + 1
      };

    case OFFLINE_ACTIONS.REMOVE_QUEUED_ACTION:
      return {
        ...state,
        queuedActions: state.queuedActions.filter(action => action.id !== action.payload),
        queuedActionsCount: Math.max(0, state.queuedActionsCount - 1)
      };

    case OFFLINE_ACTIONS.CLEAR_QUEUED_ACTIONS:
      return {
        ...state,
        queuedActions: [],
        queuedActionsCount: 0
      };

    case OFFLINE_ACTIONS.SET_LAST_SYNC_TIME:
      return {
        ...state,
        lastSyncTime: action.payload
      };

    case OFFLINE_ACTIONS.SET_SYNC_IN_PROGRESS:
      return {
        ...state,
        syncInProgress: action.payload
      };

    case OFFLINE_ACTIONS.SET_CACHED_DATA:
      return {
        ...state,
        cachedData: action.payload
      };

    case OFFLINE_ACTIONS.UPDATE_CACHED_DATA:
      return {
        ...state,
        cachedData: {
          ...state.cachedData,
          ...action.payload
        }
      };

    case OFFLINE_ACTIONS.SET_STORAGE_INFO:
      return {
        ...state,
        storageInfo: action.payload
      };

    default:
      return state;
  }
};

// Offline provider component
export const OfflineProvider = ({ children }) => {
  const [state, dispatch] = useReducer(offlineReducer, initialState);
  const { isAuthenticated } = useAuth();
  const { showToast } = useToast();
  const { connected } = useWebSocket();
  
  const {
    isOffline,
    wasOffline,
    offlineDuration,
    formatOfflineDuration,
    shouldShowOfflineWarning
  } = useOfflineStatus();

  // Update offline status
  useEffect(() => {
    dispatch({
      type: OFFLINE_ACTIONS.SET_OFFLINE_STATUS,
      payload: {
        isOffline,
        wasOffline,
        offlineDuration
      }
    });
  }, [isOffline, wasOffline, offlineDuration]);

  // Load cached data when offline
  useEffect(() => {
    if (isOffline && isAuthenticated) {
      loadCachedData();
    }
  }, [isOffline, isAuthenticated]);

  // Sync when coming back online
  useEffect(() => {
    if (!isOffline && wasOffline && isAuthenticated && connected) {
      syncQueuedActions();
    }
  }, [isOffline, wasOffline, isAuthenticated, connected]);

  // Load cached data
  const loadCachedData = useCallback(() => {
    try {
      const cachedData = {
        todos: offlineStorageService.loadTodos(),
        notifications: offlineStorageService.loadNotifications(),
        preferences: offlineStorageService.loadUserPreferences()
      };
      
      dispatch({
        type: OFFLINE_ACTIONS.SET_CACHED_DATA,
        payload: cachedData
      });
    } catch (error) {
      console.error('Failed to load cached data:', error);
    }
  }, []);

  // Save data to cache
  const saveToCache = useCallback((key, data) => {
    try {
      switch (key) {
        case 'todos':
          offlineStorageService.saveTodos(data);
          break;
        case 'notifications':
          offlineStorageService.saveNotifications(data);
          break;
        case 'preferences':
          offlineStorageService.saveUserPreferences(data);
          break;
        default:
          console.warn(`Unknown cache key: ${key}`);
          return false;
      }
      
      dispatch({
        type: OFFLINE_ACTIONS.UPDATE_CACHED_DATA,
        payload: { [key]: data }
      });
      
      return true;
    } catch (error) {
      console.error(`Failed to save ${key} to cache:`, error);
      return false;
    }
  }, []);

  // Queue action for offline sync
  const queueAction = useCallback((action) => {
    try {
      const actionId = offlineStorageService.queueAction(action);
      
      if (actionId) {
        dispatch({
          type: OFFLINE_ACTIONS.ADD_QUEUED_ACTION,
          payload: { id: actionId, ...action }
        });
        
        if (isOffline) {
          showToast('Action queued for when you\'re back online', 'info');
        }
        
        return actionId;
      }
      
      return null;
    } catch (error) {
      console.error('Failed to queue action:', error);
      return null;
    }
  }, [isOffline, showToast]);

  // Sync queued actions
  const syncQueuedActions = useCallback(async () => {
    if (state.syncInProgress) return;
    
    dispatch({ type: OFFLINE_ACTIONS.SET_SYNC_IN_PROGRESS, payload: true });
    
    try {
      const queuedActions = offlineStorageService.getActionQueue();
      let syncedCount = 0;
      let failedCount = 0;
      
      for (const queuedAction of queuedActions) {
        try {
          await processQueuedAction(queuedAction);
          offlineStorageService.removeQueuedAction(queuedAction.id);
          dispatch({
            type: OFFLINE_ACTIONS.REMOVE_QUEUED_ACTION,
            payload: queuedAction.id
          });
          syncedCount++;
        } catch (error) {
          console.error('Failed to sync action:', error);
          failedCount++;
          
          // Increment retry count
          queuedAction.retryCount++;
          if (queuedAction.retryCount >= queuedAction.maxRetries) {
            offlineStorageService.removeQueuedAction(queuedAction.id);
            dispatch({
              type: OFFLINE_ACTIONS.REMOVE_QUEUED_ACTION,
              payload: queuedAction.id
            });
          }
        }
      }
      
      if (syncedCount > 0) {
        showToast(`Synced ${syncedCount} offline actions`, 'success');
        dispatch({
          type: OFFLINE_ACTIONS.SET_LAST_SYNC_TIME,
          payload: Date.now()
        });
      }
      
      if (failedCount > 0) {
        showToast(`${failedCount} actions failed to sync`, 'warning');
      }
      
    } catch (error) {
      console.error('Failed to sync queued actions:', error);
      showToast('Failed to sync offline actions', 'error');
    } finally {
      dispatch({ type: OFFLINE_ACTIONS.SET_SYNC_IN_PROGRESS, payload: false });
    }
  }, [state.syncInProgress, showToast]);

  // Process individual queued action
  const processQueuedAction = useCallback(async (queuedAction) => {
    const { action } = queuedAction;
    
    switch (action.type) {
      case 'CREATE_TODO':
        await todosAPI.createTodo(action.data);
        break;
      case 'UPDATE_TODO':
        await todosAPI.updateTodo(action.todoId, action.data);
        break;
      case 'DELETE_TODO':
        await todosAPI.deleteTodo(action.todoId);
        break;
      default:
        console.warn(`Unknown action type: ${action.type}`);
    }
  }, []);

  // Get cached data
  const getCachedData = useCallback((key) => {
    return state.cachedData[key] || null;
  }, [state.cachedData]);

  // Check if data is available offline
  const isDataAvailableOffline = useCallback((key) => {
    return state.cachedData[key] && state.cachedData[key].length > 0;
  }, [state.cachedData]);

  // Get storage information
  const getStorageInfo = useCallback(() => {
    const info = offlineStorageService.getStorageInfo();
    dispatch({
      type: OFFLINE_ACTIONS.SET_STORAGE_INFO,
      payload: info
    });
    return info;
  }, []);

  // Clear offline data
  const clearOfflineData = useCallback(() => {
    try {
      offlineStorageService.clearAllOfflineData();
      dispatch({
        type: OFFLINE_ACTIONS.SET_CACHED_DATA,
        payload: { todos: [], notifications: [], preferences: {} }
      });
      dispatch({
        type: OFFLINE_ACTIONS.CLEAR_QUEUED_ACTIONS
      });
      showToast('Offline data cleared', 'success');
      return true;
    } catch (error) {
      console.error('Failed to clear offline data:', error);
      showToast('Failed to clear offline data', 'error');
      return false;
    }
  }, [showToast]);

  // Load queued actions on mount
  useEffect(() => {
    if (isAuthenticated) {
      const queuedActions = offlineStorageService.getActionQueue();
      dispatch({
        type: OFFLINE_ACTIONS.SET_QUEUED_ACTIONS,
        payload: queuedActions
      });
      
      // Load storage info
      getStorageInfo();
    }
  }, [isAuthenticated, getStorageInfo]);

  const value = {
    // State
    isOffline,
    wasOffline,
    offlineDuration,
    queuedActions: state.queuedActions,
    queuedActionsCount: state.queuedActionsCount,
    lastSyncTime: state.lastSyncTime,
    syncInProgress: state.syncInProgress,
    cachedData: state.cachedData,
    storageInfo: state.storageInfo,
    
    // Actions
    saveToCache,
    queueAction,
    syncQueuedActions,
    getCachedData,
    isDataAvailableOffline,
    getStorageInfo,
    clearOfflineData,
    
    // Utilities
    formatOfflineDuration,
    shouldShowOfflineWarning
  };

  return (
    <OfflineContext.Provider value={value}>
      {children}
    </OfflineContext.Provider>
  );
};

export default OfflineContext;
