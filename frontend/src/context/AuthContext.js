import React, { createContext, useContext, useReducer, useEffect, useCallback, useMemo } from 'react';
import { authAPI } from '../services/api';
import { useToast } from './ToastContext';

// Initial state
const initialState = {
  user: null,
  token: null,
  refreshToken: null,
  isAuthenticated: false,
  isLoading: true,
  error: null,
};

// Action types
const AUTH_ACTIONS = {
  LOGIN_START: 'LOGIN_START',
  LOGIN_SUCCESS: 'LOGIN_SUCCESS',
  LOGIN_FAILURE: 'LOGIN_FAILURE',
  REGISTER_START: 'REGISTER_START',
  REGISTER_SUCCESS: 'REGISTER_SUCCESS',
  REGISTER_FAILURE: 'REGISTER_FAILURE',
  LOGOUT: 'LOGOUT',
  REFRESH_TOKEN: 'REFRESH_TOKEN',
  SET_LOADING: 'SET_LOADING',
  CLEAR_ERROR: 'CLEAR_ERROR',
  UPDATE_PROFILE: 'UPDATE_PROFILE',
};

// Reducer
const authReducer = (state, action) => {
  switch (action.type) {
    case AUTH_ACTIONS.LOGIN_START:
    case AUTH_ACTIONS.REGISTER_START:
      return {
        ...state,
        isLoading: true,
        error: null,
      };
    
    case AUTH_ACTIONS.LOGIN_SUCCESS:
    case AUTH_ACTIONS.REGISTER_SUCCESS:
      return {
        ...state,
        user: action.payload.user,
        token: action.payload.token,
        refreshToken: action.payload.refreshToken,
        isAuthenticated: true,
        isLoading: false,
        error: null,
      };
    
    case AUTH_ACTIONS.LOGIN_FAILURE:
    case AUTH_ACTIONS.REGISTER_FAILURE:
      return {
        ...state,
        user: null,
        token: null,
        refreshToken: null,
        isAuthenticated: false,
        isLoading: false,
        error: action.payload,
      };
    
    case AUTH_ACTIONS.LOGOUT:
      return {
        ...state,
        user: null,
        token: null,
        refreshToken: null,
        isAuthenticated: false,
        isLoading: false,
        error: null,
      };
    
    case AUTH_ACTIONS.REFRESH_TOKEN:
      return {
        ...state,
        token: action.payload.token,
        refreshToken: action.payload.refreshToken,
      };
    
    case AUTH_ACTIONS.SET_LOADING:
      return {
        ...state,
        isLoading: action.payload,
      };
    
    case AUTH_ACTIONS.CLEAR_ERROR:
      return {
        ...state,
        error: null,
      };
    
    case AUTH_ACTIONS.UPDATE_PROFILE:
      return {
        ...state,
        user: { ...state.user, ...action.payload },
      };
    
    default:
      return state;
  }
};

// Create context
const AuthContext = createContext();

// Custom hook to use auth context
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

// Auth provider component
export const AuthProvider = ({ children }) => {
  const [state, dispatch] = useReducer(authReducer, initialState);
  const { showToast } = useToast();

  // Check if user is authenticated on app load
  useEffect(() => {
    const checkAuth = async () => {
      const token = localStorage.getItem('token');
      const refreshTokenValue = localStorage.getItem('refreshToken');
      
      
      if (token) {
        try {
          const response = await authAPI.getProfile();
          if (response.success) {
            dispatch({
              type: AUTH_ACTIONS.LOGIN_SUCCESS,
              payload: {
                user: response.data.user,
                token: token,
                refreshToken: refreshTokenValue,
              },
            });
          } else {
            // Token is invalid, clear it
            localStorage.removeItem('token');
            localStorage.removeItem('refreshToken');
            dispatch({ type: AUTH_ACTIONS.SET_LOADING, payload: false });
          }
        } catch (error) {
          // Handle different types of errors
          if (error.response?.status === 401) {
            // Token is invalid or expired, clear it silently
            localStorage.removeItem('token');
            localStorage.removeItem('refreshToken');
            dispatch({ type: AUTH_ACTIONS.SET_LOADING, payload: false });
          } else if (error.response?.status >= 500) {
            // Server error, keep token but set loading to false
            console.error('Server error during auth check:', error);
            dispatch({ type: AUTH_ACTIONS.SET_LOADING, payload: false });
          } else {
            // Other errors (network, etc.)
            console.error('Auth check failed:', error);
            localStorage.removeItem('token');
            localStorage.removeItem('refreshToken');
            dispatch({ type: AUTH_ACTIONS.SET_LOADING, payload: false });
          }
        }
      } else {
        dispatch({ type: AUTH_ACTIONS.SET_LOADING, payload: false });
      }
    };

    checkAuth();
  }, []);

  // Save tokens to localStorage when they change
  useEffect(() => {
    // Only manage localStorage after initial auth check is complete
    if (!state.isLoading) {
      if (state.token) {
        localStorage.setItem('token', state.token);
      } else {
        localStorage.removeItem('token');
      }
      
      if (state.refreshToken) {
        localStorage.setItem('refreshToken', state.refreshToken);
      } else {
        localStorage.removeItem('refreshToken');
      }
    }
  }, [state.token, state.refreshToken, state.isLoading]);

  // Login function
  const login = useCallback(async (credentials) => {
    dispatch({ type: AUTH_ACTIONS.LOGIN_START });
    
    try {
      const response = await authAPI.login(credentials);
      
      if (response.success) {
        dispatch({
          type: AUTH_ACTIONS.LOGIN_SUCCESS,
          payload: response.data,
        });
        
        showToast('Login successful!', 'success');
        return { success: true };
      } else {
        dispatch({
          type: AUTH_ACTIONS.LOGIN_FAILURE,
          payload: response.error?.message || 'Login failed',
        });
        
        showToast(response.error?.message || 'Login failed', 'error');
        return { success: false, error: response.error?.message };
      }
    } catch (error) {
      const errorMessage = error.response?.data?.error?.message || 'Login failed';
      dispatch({
        type: AUTH_ACTIONS.LOGIN_FAILURE,
        payload: errorMessage,
      });
      
      showToast(errorMessage, 'error');
      return { success: false, error: errorMessage };
    }
  }, [showToast]);

  // Register function
  const register = useCallback(async (userData) => {
    dispatch({ type: AUTH_ACTIONS.REGISTER_START });
    
    try {
      const response = await authAPI.register(userData);
      
      if (response.success) {
        dispatch({
          type: AUTH_ACTIONS.REGISTER_SUCCESS,
          payload: response.data,
        });
        
        showToast('Registration successful!', 'success');
        return { success: true };
      } else {
        dispatch({
          type: AUTH_ACTIONS.REGISTER_FAILURE,
          payload: response.error?.message || 'Registration failed',
        });
        
        showToast(response.error?.message || 'Registration failed', 'error');
        return { success: false, error: response.error?.message };
      }
    } catch (error) {
      const errorMessage = error.response?.data?.error?.message || 'Registration failed';
      dispatch({
        type: AUTH_ACTIONS.REGISTER_FAILURE,
        payload: errorMessage,
      });
      
      showToast(errorMessage, 'error');
      return { success: false, error: errorMessage };
    }
  }, [showToast]);

  // Logout function
  const logout = useCallback(async () => {
    try {
      if (state.token) {
        await authAPI.logout();
      }
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      dispatch({ type: AUTH_ACTIONS.LOGOUT });
      showToast('Logged out successfully', 'info');
    }
  }, [state.token, showToast]);

  // Refresh token function
  const refreshToken = useCallback(async () => {
    if (!state.refreshToken) {
      logout();
      return false;
    }

    try {
      const response = await authAPI.refreshToken(state.refreshToken);
      
      if (response.success) {
        dispatch({
          type: AUTH_ACTIONS.REFRESH_TOKEN,
          payload: response.data,
        });
        return true;
      } else {
        logout();
        return false;
      }
    } catch (error) {
      console.error('Token refresh failed:', error);
      logout();
      return false;
    }
  }, [state.refreshToken, logout]);

  // Update profile function
  const updateProfile = useCallback(async (profileData, showNotification = true) => {
    try {
      const response = await authAPI.updateProfile(profileData);
      
      if (response.success) {
        dispatch({
          type: AUTH_ACTIONS.UPDATE_PROFILE,
          payload: response.data.user,
        });
        
        // Only show toast notification if explicitly requested
        if (showNotification) {
          showToast('Profile updated successfully!', 'success');
        }
        return { success: true };
      } else {
        if (showNotification) {
          showToast(response.error?.message || 'Profile update failed', 'error');
        }
        return { success: false, error: response.error?.message };
      }
    } catch (error) {
      const errorMessage = error.response?.data?.error?.message || 'Profile update failed';
      if (showNotification) {
        showToast(errorMessage, 'error');
      }
      return { success: false, error: errorMessage };
    }
  }, [showToast]);

  // Change password function
  const changePassword = useCallback(async (passwordData, showNotification = true) => {
    try {
      const response = await authAPI.changePassword(passwordData);
      
      if (response.success) {
        if (showNotification) {
          showToast('Password changed successfully!', 'success');
        }
        return { success: true };
      } else {
        if (showNotification) {
          showToast(response.error?.message || 'Password change failed', 'error');
        }
        return { success: false, error: response.error?.message };
      }
    } catch (error) {
      const errorMessage = error.response?.data?.error?.message || 'Password change failed';
      if (showNotification) {
        showToast(errorMessage, 'error');
      }
      return { success: false, error: errorMessage };
    }
  }, [showToast]);

  // Clear error function
  const clearError = useCallback(() => {
    dispatch({ type: AUTH_ACTIONS.CLEAR_ERROR });
  }, []);

  // Context value
  const value = useMemo(() => ({
    ...state,
    login,
    register,
    logout,
    refreshToken,
    updateProfile,
    changePassword,
    clearError,
  }), [state, login, register, logout, refreshToken, updateProfile, changePassword, clearError]);

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};