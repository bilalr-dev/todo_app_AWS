// AuthProvider - UI state management for authentication v0.6 - Optimized Architecture
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
      return { ...state, isLoading: true, error: null };

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
      return { ...state, isLoading: action.payload };

    case AUTH_ACTIONS.CLEAR_ERROR:
      return { ...state, error: null };

    case AUTH_ACTIONS.UPDATE_PROFILE:
      return {
        ...state,
        user: { ...state.user, ...action.payload },
      };

    default:
      return state;
  }
};

// Context
const AuthContext = createContext();

// Provider component
export const AuthProvider = ({ children }) => {
  const [state, dispatch] = useReducer(authReducer, initialState);
  const { showToast } = useToast();

  // Service calls - these will be moved to a separate service layer
  const login = useCallback(async (credentials) => {
    dispatch({ type: AUTH_ACTIONS.LOGIN_START });
    try {
      const response = await authAPI.login(credentials);
      const { user, token, refreshToken } = response.data;
      
      // Store tokens based on rememberMe flag
      if (credentials.rememberMe) {
        // Persistent storage - survives browser restart
        localStorage.setItem('token', token);
        localStorage.setItem('refreshToken', refreshToken);
      } else {
        // Session storage - cleared when browser/tab closes
        sessionStorage.setItem('token', token);
        sessionStorage.setItem('refreshToken', refreshToken);
      }
      
      dispatch({
        type: AUTH_ACTIONS.LOGIN_SUCCESS,
        payload: { user, token, refreshToken },
      });
      
      showToast('Login successful!', 'success');
      return { success: true, user };
    } catch (error) {
      dispatch({ type: AUTH_ACTIONS.LOGIN_FAILURE, payload: error.message });
      showToast(error.message || 'Login failed', 'error');
      return { success: false, error: error.message };
    }
  }, [showToast]);

  const register = useCallback(async (userData) => {
    dispatch({ type: AUTH_ACTIONS.REGISTER_START });
    try {
      const response = await authAPI.register(userData);
      const { user, token, refreshToken } = response.data;
      
      // Registration always uses session storage (no rememberMe option)
      sessionStorage.setItem('token', token);
      sessionStorage.setItem('refreshToken', refreshToken);
      
      dispatch({
        type: AUTH_ACTIONS.REGISTER_SUCCESS,
        payload: { user, token, refreshToken },
      });
      
      showToast('Registration successful! Welcome to your dashboard.', 'success');
      return { success: true, user };
    } catch (error) {
      dispatch({ type: AUTH_ACTIONS.REGISTER_FAILURE, payload: error.message });
      showToast(error.message || 'Registration failed', 'error');
      return { success: false, error: error.message };
    }
  }, [showToast]);

  const logout = useCallback(() => {
    // Clear tokens from both localStorage and sessionStorage
    localStorage.removeItem('token');
    localStorage.removeItem('refreshToken');
    sessionStorage.removeItem('token');
    sessionStorage.removeItem('refreshToken');
    
    dispatch({ type: AUTH_ACTIONS.LOGOUT });
    showToast('Logged out successfully', 'success');
  }, [showToast]);

  const updateProfile = useCallback(async (profileData) => {
    try {
      const response = await authAPI.updateProfile(profileData);
      dispatch({ type: AUTH_ACTIONS.UPDATE_PROFILE, payload: response.data.user });
      showToast('Profile updated successfully!', 'success');
      return { success: true, user: response.data.user };
    } catch (error) {
      showToast('Failed to update profile', 'error');
      return { success: false, error: error.message };
    }
  }, [showToast]);

  const changePassword = useCallback(async (passwordData) => {
    try {
      await authAPI.changePassword(passwordData);
      showToast('Password changed successfully!', 'success');
      return { success: true };
    } catch (error) {
      showToast(error.message || 'Failed to change password', 'error');
      return { success: false, error: error.message };
    }
  }, [showToast]);

  const refreshToken = useCallback(async () => {
    try {
      // Check both localStorage and sessionStorage for refresh token
      let storedRefreshToken = localStorage.getItem('refreshToken') || sessionStorage.getItem('refreshToken');
      if (!storedRefreshToken) {
        throw new Error('No refresh token available');
      }

      const response = await authAPI.refreshToken(storedRefreshToken);
      const { token, refreshToken: newRefreshToken } = response.data;
      
      // Determine which storage to use based on where the original token was stored
      const wasInLocalStorage = localStorage.getItem('refreshToken');
      if (wasInLocalStorage) {
        localStorage.setItem('token', token);
        localStorage.setItem('refreshToken', newRefreshToken);
      } else {
        sessionStorage.setItem('token', token);
        sessionStorage.setItem('refreshToken', newRefreshToken);
      }
      
      dispatch({
        type: AUTH_ACTIONS.REFRESH_TOKEN,
        payload: { token, refreshToken: newRefreshToken },
      });
      
      return { success: true, token };
    } catch (error) {
      // If refresh fails, logout user
      logout();
      return { success: false, error: error.message };
    }
  }, [logout]);

  // Clear error function
  const clearError = useCallback(() => {
    dispatch({ type: AUTH_ACTIONS.CLEAR_ERROR });
  }, []);

  // Initialize auth state from localStorage and sessionStorage
  useEffect(() => {
    const initializeAuth = async () => {
      // Check both localStorage and sessionStorage for tokens
      let token = localStorage.getItem('token') || sessionStorage.getItem('token');
      let refreshTokenValue = localStorage.getItem('refreshToken') || sessionStorage.getItem('refreshToken');
      
      if (token && refreshTokenValue) {
        try {
          // Verify token is still valid
          const response = await authAPI.getProfile();
          dispatch({
            type: AUTH_ACTIONS.LOGIN_SUCCESS,
            payload: {
              user: response.data.user,
              token,
              refreshToken: refreshTokenValue,
            },
          });
        } catch (error) {
          // Token is invalid, try to refresh
          const refreshResult = await refreshToken();
          if (!refreshResult.success) {
            // Refresh failed, clear auth state from both storages
            localStorage.removeItem('token');
            localStorage.removeItem('refreshToken');
            sessionStorage.removeItem('token');
            sessionStorage.removeItem('refreshToken');
          }
        }
      }
      
      dispatch({ type: AUTH_ACTIONS.SET_LOADING, payload: false });
    };

    initializeAuth();
  }, [refreshToken]);

  const value = useMemo(() => ({
    // State
    ...state,
    
    // Service calls
    login,
    register,
    logout,
    updateProfile,
    changePassword,
    refreshToken,
    clearError,
    
    // Computed values
    isDemoUser: state.user?.username === 'demo',
  }), [state, login, register, logout, updateProfile, changePassword, refreshToken, clearError]);

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

// Hook
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export default AuthProvider;
