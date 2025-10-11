import React, { createContext, useContext, useReducer, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { Toast } from '../components/common/Toast';

// Toast types
const TOAST_TYPES = {
  SUCCESS: 'success',
  ERROR: 'error',
  WARNING: 'warning',
  INFO: 'info',
};

// Initial state
const initialState = {
  toasts: [],
};

// Action types
const TOAST_ACTIONS = {
  ADD_TOAST: 'ADD_TOAST',
  REMOVE_TOAST: 'REMOVE_TOAST',
  CLEAR_ALL: 'CLEAR_ALL',
};

// Reducer
const toastReducer = (state, action) => {
  switch (action.type) {
    case TOAST_ACTIONS.ADD_TOAST:
      return {
        ...state,
        toasts: [...state.toasts, action.payload],
      };
    
    case TOAST_ACTIONS.REMOVE_TOAST:
      return {
        ...state,
        toasts: state.toasts.filter(toast => toast.id !== action.payload),
      };
    
    case TOAST_ACTIONS.CLEAR_ALL:
      return {
        ...state,
        toasts: [],
      };
    
    default:
      return state;
  }
};

// Create context
const ToastContext = createContext();

// Custom hook to use toast context
export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
};

// Toast provider component
export const ToastProvider = ({ children }) => {
  const [state, dispatch] = useReducer(toastReducer, initialState);

  // Add toast function
  const addToast = useCallback((message, type = TOAST_TYPES.INFO, duration = 5000) => {
    const id = Date.now() + Math.random();
    
    const toast = {
      id,
      message,
      type,
      duration,
      timestamp: Date.now(),
    };

    dispatch({
      type: TOAST_ACTIONS.ADD_TOAST,
      payload: toast,
    });

    // Auto remove toast after duration
    if (duration > 0) {
      setTimeout(() => {
        dispatch({
          type: TOAST_ACTIONS.REMOVE_TOAST,
          payload: id,
        });
      }, duration);
    }

    return id;
  }, []);

  // Remove toast function
  const removeToast = useCallback((id) => {
    dispatch({
      type: TOAST_ACTIONS.REMOVE_TOAST,
      payload: id,
    });
  }, []);

  // Clear all toasts function
  const clearAllToasts = useCallback(() => {
    dispatch({ type: TOAST_ACTIONS.CLEAR_ALL });
  }, []);

  // Convenience methods
  const showToast = useCallback((message, type = TOAST_TYPES.INFO, duration = 5000) => {
    return addToast(message, type, duration);
  }, [addToast]);

  const showSuccess = useCallback((message, duration = 5000) => {
    return addToast(message, TOAST_TYPES.SUCCESS, duration);
  }, [addToast]);

  const showError = useCallback((message, duration = 7000) => {
    return addToast(message, TOAST_TYPES.ERROR, duration);
  }, [addToast]);

  const showWarning = useCallback((message, duration = 6000) => {
    return addToast(message, TOAST_TYPES.WARNING, duration);
  }, [addToast]);

  const showInfo = useCallback((message, duration = 5000) => {
    return addToast(message, TOAST_TYPES.INFO, duration);
  }, [addToast]);

  // Context value
  const value = {
    toasts: state.toasts,
    addToast,
    removeToast,
    clearAllToasts,
    showToast,
    showSuccess,
    showError,
    showWarning,
    showInfo,
  };

  return (
    <ToastContext.Provider value={value}>
      {children}
      
      {/* Toast container */}
      {typeof document !== 'undefined' && createPortal(
        <div className="fixed top-4 right-4 z-50 space-y-2">
          {state.toasts.map(toast => (
            <Toast
              key={toast.id}
              toast={toast}
              onRemove={removeToast}
            />
          ))}
        </div>,
        document.body
      )}
    </ToastContext.Provider>
  );
};
