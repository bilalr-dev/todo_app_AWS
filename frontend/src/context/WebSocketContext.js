// WebSocket Context for Todo App v0.7
// Real-time communication with Socket.io client

import React, { createContext, useContext, useEffect, useState, useCallback, useRef, useMemo } from 'react';
import { io } from 'socket.io-client';
import { useToast } from './ToastContext';
import { getWebSocketUrl, WEBSOCKET_CONFIG } from '../utils/constants';

const WebSocketContext = createContext();

export { WebSocketContext };

export const useWebSocket = () => {
  const context = useContext(WebSocketContext);
  if (!context) {
    throw new Error('useWebSocket must be used within a WebSocketProvider');
  }
  return context;
};

export const WebSocketProvider = ({ children, user = null, token = null }) => {
  const { showToast } = useToast();
  
  const [socket, setSocket] = useState(null);
  const [connected, setConnected] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState('disconnected');
  const [reconnectAttempts, setReconnectAttempts] = useState(0);
  const [lastEvent, setLastEvent] = useState(null);
  
  const socketRef = useRef(null);
  
  // Debug lastEvent changes
  useEffect(() => {
  }, [lastEvent]);
  const reconnectTimeoutRef = useRef(null);
  const maxReconnectAttempts = WEBSOCKET_CONFIG.RECONNECT_ATTEMPTS;
  const reconnectDelay = WEBSOCKET_CONFIG.RECONNECT_DELAY;

  // Initialize WebSocket connection
  const initializeSocket = useCallback(() => {
    if (!token || !user) {
      return;
    }

    const socketUrl = getWebSocketUrl();
    
    const newSocket = io(socketUrl, {
      auth: {
        token: token
      },
      transports: ['websocket', 'polling'],
      timeout: 20000,
      forceNew: true
    });

    // Connection event handlers
    newSocket.on('connect', () => {
      setConnected(true);
      setConnectionStatus('connected');
      setReconnectAttempts(0);
    });

    newSocket.on('disconnect', (reason) => {
      setConnected(false);
      setConnectionStatus('disconnected');
      
      if (reason === 'io server disconnect') {
        // Server disconnected, try to reconnect
        handleReconnect();
      }
    });

    newSocket.on('connect_error', (error) => {
      console.error('WebSocket connection error:', error);
      setConnectionStatus('error');
      showToast('Connection error. Retrying...', 'warning');
      handleReconnect();
    });

    // Real-time event handlers
    newSocket.on('todo_created', (data) => {
      setLastEvent({ type: 'todo_created', data, timestamp: Date.now() });
    });

    newSocket.on('todo_updated', (data) => {
      setLastEvent({ type: 'todo_updated', data, timestamp: Date.now() });
    });

    newSocket.on('todo_deleted', (data) => {
      setLastEvent({ type: 'todo_deleted', data, timestamp: Date.now() });
    });

    newSocket.on('todo_moved', (data) => {
      setLastEvent({ type: 'todo_moved', data, timestamp: Date.now() });
    });

    newSocket.on('file_uploaded', (data) => {
      setLastEvent({ type: 'file_uploaded', data, timestamp: Date.now() });
    });

    newSocket.on('file_deleted', (data) => {
      setLastEvent({ type: 'file_deleted', data, timestamp: Date.now() });
    });

    newSocket.on('bulk_action', (data) => {
      setLastEvent({ type: 'bulk_action', data, timestamp: Date.now() });
    });

    newSocket.on('notification', (data) => {
      setLastEvent({ type: 'notification', data, timestamp: Date.now() });
    });

    newSocket.on('user_activity', (data) => {
      setLastEvent({ type: 'user_activity', data, timestamp: Date.now() });
    });

    newSocket.on('theme_changed', (data) => {
      setLastEvent({ type: 'theme_changed', data, timestamp: Date.now() });
    });


    // Heartbeat/ping handling
    newSocket.on('ping', (data) => {
      newSocket.emit('pong', { timestamp: Date.now() });
    });

    socketRef.current = newSocket;
    setSocket(newSocket);
  }, [token, user?.id, showToast]); // Only reinitialize if user ID changes, not profile fields

  // Handle reconnection logic
  const handleReconnect = useCallback(() => {
    if (reconnectAttempts >= maxReconnectAttempts) {
      setConnectionStatus('failed');
      showToast('Connection failed. Please refresh the page.', 'error');
      return;
    }

    setReconnectAttempts(prev => prev + 1);
    setConnectionStatus('reconnecting');
    
    const delay = reconnectDelay * Math.pow(2, reconnectAttempts); // Exponential backoff
    
    reconnectTimeoutRef.current = setTimeout(() => {
      initializeSocket();
    }, delay);
  }, [reconnectAttempts, maxReconnectAttempts, reconnectDelay, initializeSocket, showToast]);

  // Manual reconnection
  const reconnect = useCallback(() => {
    if (socketRef.current) {
      socketRef.current.disconnect();
    }
    setReconnectAttempts(0);
    setConnectionStatus('connecting');
    initializeSocket();
  }, [initializeSocket]);

  // Emit events to server
  const emitEvent = useCallback((event, data) => {
    if (socket && connected) {
      socket.emit(event, data);
      return true;
    } else {
      console.warn('Cannot emit event: WebSocket not connected');
      return false;
    }
  }, [socket, connected]);

  // Emit user activity
  const emitUserActivity = useCallback((activity) => {
    emitEvent('user_activity', {
      action: activity,
      timestamp: new Date().toISOString()
    });
  }, [emitEvent]);

  // Emit notification read
  const emitNotificationRead = useCallback((notificationId) => {
    emitEvent('notification_read', {
      notificationId: notificationId
    });
  }, [emitEvent]);

  // Get connection info
  const getConnectionInfo = useCallback(() => {
    return {
      connected,
      connectionStatus,
      reconnectAttempts,
      maxReconnectAttempts,
      socketId: socket?.id,
      lastEvent
    };
  }, [connected, connectionStatus, reconnectAttempts, maxReconnectAttempts, socket, lastEvent]);

  // Initialize connection when user logs in
  useEffect(() => {
    if (user && token) {
      initializeSocket();
    } else {
      // Disconnect when user logs out
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
      }
      setSocket(null);
      setConnected(false);
      setConnectionStatus('disconnected');
      setReconnectAttempts(0);
    }

    // Cleanup on unmount
    return () => {
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
      if (socketRef.current) {
        socketRef.current.disconnect();
      }
    };
  }, [user?.id, token, initializeSocket]); // Only reconnect if user ID or token changes, not profile fields

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
      if (socketRef.current) {
        socketRef.current.disconnect();
      }
    };
  }, []);

  const value = useMemo(() => ({
    socket,
    connected,
    connectionStatus,
    reconnectAttempts,
    lastEvent,
    emitEvent,
    emitUserActivity,
    emitNotificationRead,
    reconnect,
    getConnectionInfo
  }), [socket, connected, connectionStatus, reconnectAttempts, lastEvent]);

  return (
    <WebSocketContext.Provider value={value}>
      {children}
    </WebSocketContext.Provider>
  );
};

export default WebSocketContext;
