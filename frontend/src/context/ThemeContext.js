import React, { createContext, useContext, useEffect, useState } from 'react';
import { useAuth } from './AuthContext';

// Theme context
const ThemeContext = createContext();

// Custom hook to use theme context
export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};

// Theme provider component
export const ThemeProvider = ({ children }) => {
  const { user, updateProfile } = useAuth();
  const [theme, setTheme] = useState(() => {
    // Check localStorage first, then default to light
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme) {
      return savedTheme;
    }
    
    // Default to light theme for better visibility
    return 'light';
  });

  // Load user theme preference when user logs in
  useEffect(() => {
    if (user && user.theme_preference) {
      setTheme(user.theme_preference);
    }
  }, [user]);

  // Apply theme to document
  useEffect(() => {
    const root = document.documentElement;
    
    if (theme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
    
    // Save theme to localStorage
    localStorage.setItem('theme', theme);
  }, [theme]);

  // Toggle theme function
  const toggleTheme = async () => {
    const newTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(newTheme);
    
    // Save to user account if logged in (without showing notification)
    if (user && !user.is_demo) {
      try {
        await updateProfile({ theme_preference: newTheme }, false);
      } catch (error) {
        console.error('Failed to save theme preference:', error);
      }
    }
  };

  // Set specific theme function
  const setThemeMode = async (newTheme) => {
    if (newTheme === 'light' || newTheme === 'dark') {
      setTheme(newTheme);
      
      // Save to user account if logged in (without showing notification)
      if (user && !user.is_demo) {
        try {
          await updateProfile({ theme_preference: newTheme }, false);
        } catch (error) {
          console.error('Failed to save theme preference:', error);
        }
      }
    }
  };

  // Context value
  const value = {
    theme,
    toggleTheme,
    setThemeMode,
    isDark: theme === 'dark',
    isLight: theme === 'light',
  };

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
};
