// Offline Status Hook for Todo App v0.7
// Monitors network connectivity and provides offline state management

import { useState, useEffect, useCallback, useRef } from 'react';

export const useOfflineStatus = () => {
  const [isOffline, setIsOffline] = useState(!navigator.onLine);
  const [wasOffline, setWasOffline] = useState(false);
  const [offlineDuration, setOfflineDuration] = useState(0);
  const [lastOnlineTime, setLastOnlineTime] = useState(Date.now());
  const [lastOfflineTime, setLastOfflineTime] = useState(null);
  
  const offlineStartTime = useRef(null);
  const intervalRef = useRef(null);

  // Update offline duration
  const updateOfflineDuration = useCallback(() => {
    if (isOffline && offlineStartTime.current) {
      const duration = Date.now() - offlineStartTime.current;
      setOfflineDuration(duration);
    }
  }, [isOffline]);

  // Handle online event
  const handleOnline = useCallback(() => {
    setIsOffline(false);
    setWasOffline(true);
    setLastOnlineTime(Date.now());
    setLastOfflineTime(null);
    
    if (offlineStartTime.current) {
      const duration = Date.now() - offlineStartTime.current;
      setOfflineDuration(duration);
      offlineStartTime.current = null;
    }
    
    // Clear interval
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  // Handle offline event
  const handleOffline = useCallback(() => {
    setIsOffline(true);
    setLastOfflineTime(Date.now());
    offlineStartTime.current = Date.now();
    
    // Start duration tracking
    if (!intervalRef.current) {
      intervalRef.current = setInterval(updateOfflineDuration, 1000);
    }
  }, [updateOfflineDuration]);

  // Format offline duration
  const formatOfflineDuration = useCallback((duration) => {
    const seconds = Math.floor(duration / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    
    if (hours > 0) {
      return `${hours}h ${minutes % 60}m ${seconds % 60}s`;
    } else if (minutes > 0) {
      return `${minutes}m ${seconds % 60}s`;
    } else {
      return `${seconds}s`;
    }
  }, []);

  // Get connection quality indicator
  const getConnectionQuality = useCallback(() => {
    if (isOffline) {
      return {
        status: 'offline',
        quality: 0,
        message: 'No internet connection'
      };
    }

    // Check for slow connection indicators
    if (navigator.connection) {
      const connection = navigator.connection;
      const effectiveType = connection.effectiveType;
      
      switch (effectiveType) {
        case 'slow-2g':
          return {
            status: 'slow',
            quality: 25,
            message: 'Slow connection (2G)'
          };
        case '2g':
          return {
            status: 'slow',
            quality: 50,
            message: 'Slow connection (2G)'
          };
        case '3g':
          return {
            status: 'moderate',
            quality: 75,
            message: 'Moderate connection (3G)'
          };
        case '4g':
          return {
            status: 'good',
            quality: 100,
            message: 'Good connection (4G)'
          };
        default:
          return {
            status: 'unknown',
            quality: 75,
            message: 'Connection status unknown'
          };
      }
    }

    return {
      status: 'online',
      quality: 100,
      message: 'Connected'
    };
  }, [isOffline]);

  // Check if we should show offline warning
  const shouldShowOfflineWarning = useCallback(() => {
    return isOffline || (wasOffline && Date.now() - lastOnlineTime < 5000);
  }, [isOffline, wasOffline, lastOnlineTime]);

  // Reset offline state (for testing)
  const resetOfflineState = useCallback(() => {
    setIsOffline(false);
    setWasOffline(false);
    setOfflineDuration(0);
    setLastOnlineTime(Date.now());
    setLastOfflineTime(null);
    offlineStartTime.current = null;
    
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  // Set up event listeners
  useEffect(() => {
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Initial state check
    if (navigator.onLine) {
      handleOnline();
    } else {
      handleOffline();
    }

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [handleOnline, handleOffline]);

  return {
    isOffline,
    wasOffline,
    offlineDuration,
    lastOnlineTime,
    lastOfflineTime,
    formatOfflineDuration,
    getConnectionQuality,
    shouldShowOfflineWarning,
    resetOfflineState
  };
};

export default useOfflineStatus;



