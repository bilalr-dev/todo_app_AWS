import React, { createContext, useContext, useEffect, useState } from 'react';
import { useAuth } from './AuthProvider';
import { useWebSocket } from './WebSocketContext';

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
  const { emitEvent, connected, lastEvent } = useWebSocket();
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

  // Listen for theme changes from other tabs
  useEffect(() => {
    const handleStorageChange = (e) => {
      if (e.key === 'theme' && e.newValue && e.newValue !== theme) {
        console.log('Cross-tab sync: Updating theme from storage event:', e.newValue);
        setTheme(e.newValue);
      }
    };

    // Listen for storage events (cross-tab synchronization)
    window.addEventListener('storage', handleStorageChange);

    // Also listen for focus events as a fallback for mobile browsers
    const handleFocus = () => {
      const savedTheme = localStorage.getItem('theme');
      if (savedTheme && savedTheme !== theme) {
        console.log('Cross-tab sync: Updating theme from focus event:', savedTheme);
        setTheme(savedTheme);
      }
    };

    window.addEventListener('focus', handleFocus);

    // Polling mechanism as additional fallback for mobile browsers
    const pollInterval = setInterval(() => {
      const savedTheme = localStorage.getItem('theme');
      if (savedTheme && savedTheme !== theme) {
        console.log('Cross-tab sync: Updating theme from polling:', savedTheme);
        setTheme(savedTheme);
      }
    }, 2000); // Check every 2 seconds to reduce frequency

    // Cleanup
    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('focus', handleFocus);
      clearInterval(pollInterval);
    };
  }, [theme]);

  // Listen for WebSocket theme change events via lastEvent
  useEffect(() => {
    if (!lastEvent || lastEvent.type !== 'theme_changed') return;

    console.log('Cross-tab sync: WebSocket theme change received via lastEvent:', lastEvent.data);
    const { theme: newTheme } = lastEvent.data;
    
    if (newTheme && newTheme !== theme) {
      console.log('Cross-tab sync: Updating theme from WebSocket lastEvent:', newTheme);
      setTheme(newTheme);
    }
  }, [lastEvent, theme]);

  // Toggle theme function
  const toggleTheme = async () => {
    const newTheme = theme === 'light' ? 'dark' : 'light';
    console.log('Cross-tab sync: Toggling theme from', theme, 'to', newTheme);
    setTheme(newTheme);
    
    // Emit theme change via WebSocket for cross-tab sync
    if (connected) {
      console.log('Cross-tab sync: Emitting theme change via WebSocket:', newTheme);
      const emitted = emitEvent('theme_changed', { theme: newTheme });
      console.log('Cross-tab sync: WebSocket emit result:', emitted);
    } else {
      console.log('Cross-tab sync: WebSocket not connected, using localStorage only');
    }
    
    // Save to user account if logged in (without showing notification)
    if (user && !user.is_demo) {
      try {
        await updateProfile({ theme_preference: newTheme }, false);
        console.log('Cross-tab sync: Theme preference saved to user account:', newTheme);
      } catch (error) {
        console.error('Cross-tab sync: Failed to save theme preference:', error);
      }
    }
  };

  // Set specific theme function
  const setThemeMode = async (newTheme) => {
    if (newTheme === 'light' || newTheme === 'dark') {
      console.log('Cross-tab sync: Setting theme mode to:', newTheme);
      setTheme(newTheme);
      
      // Emit theme change via WebSocket for cross-tab sync
      if (connected) {
        console.log('Cross-tab sync: Emitting theme change via WebSocket:', newTheme);
        const emitted = emitEvent('theme_changed', { theme: newTheme });
        console.log('Cross-tab sync: WebSocket emit result:', emitted);
      } else {
        console.log('Cross-tab sync: WebSocket not connected, using localStorage only');
      }
      
      // Save to user account if logged in (without showing notification)
      if (user && !user.is_demo) {
        try {
          await updateProfile({ theme_preference: newTheme }, false);
          console.log('Cross-tab sync: Theme preference saved to user account:', newTheme);
        } catch (error) {
          console.error('Cross-tab sync: Failed to save theme preference:', error);
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
