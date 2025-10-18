// WebSocketProviderWithAuth - Wrapper that provides auth data to WebSocketProvider
import React from 'react';
import { WebSocketProvider } from './WebSocketContext';
import { useAuth } from './AuthProvider';

export const WebSocketProviderWithAuth = ({ children }) => {
  const { user, token } = useAuth();
  
  return (
    <WebSocketProvider user={user} token={token}>
      {children}
    </WebSocketProvider>
  );
};

