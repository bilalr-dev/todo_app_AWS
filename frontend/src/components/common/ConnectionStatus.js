// Connection Status Component for Todo App v0.7
// Visual indicator for WebSocket connection status

import React from 'react';
import { useWebSocket } from '../../context/WebSocketContext';
import { Wifi, WifiOff, RefreshCw, AlertCircle, CheckCircle } from 'lucide-react';

const ConnectionStatus = ({ className = '' }) => {
  const { connected, connectionStatus, reconnectAttempts, maxReconnectAttempts, reconnect } = useWebSocket();

  const getStatusConfig = () => {
    switch (connectionStatus) {
      case 'connected':
        return {
          icon: CheckCircle,
          text: 'Connected',
          color: 'text-green-500',
          bgColor: 'bg-green-50',
          borderColor: 'border-green-200'
        };
      case 'connecting':
        return {
          icon: RefreshCw,
          text: 'Connecting...',
          color: 'text-blue-500',
          bgColor: 'bg-blue-50',
          borderColor: 'border-blue-200',
          animate: true
        };
      case 'reconnecting':
        return {
          icon: RefreshCw,
          text: `Reconnecting... (${reconnectAttempts}/${maxReconnectAttempts})`,
          color: 'text-yellow-500',
          bgColor: 'bg-yellow-50',
          borderColor: 'border-yellow-200',
          animate: true
        };
      case 'error':
        return {
          icon: AlertCircle,
          text: 'Connection Error',
          color: 'text-red-500',
          bgColor: 'bg-red-50',
          borderColor: 'border-red-200'
        };
      case 'failed':
        return {
          icon: WifiOff,
          text: 'Connection Failed',
          color: 'text-red-500',
          bgColor: 'bg-red-50',
          borderColor: 'border-red-200'
        };
      default:
        return {
          icon: WifiOff,
          text: 'Disconnected',
          color: 'text-gray-500',
          bgColor: 'bg-gray-50',
          borderColor: 'border-gray-200'
        };
    }
  };

  const statusConfig = getStatusConfig();
  const Icon = statusConfig.icon;

  const handleReconnect = () => {
    if (connectionStatus === 'failed' || connectionStatus === 'error') {
      reconnect();
    }
  };

  return (
    <div 
      className={`
        inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium
        border transition-all duration-200
        ${statusConfig.bgColor} ${statusConfig.borderColor} ${statusConfig.color}
        ${className}
        ${(connectionStatus === 'failed' || connectionStatus === 'error') ? 'cursor-pointer hover:opacity-80' : ''}
      `}
      onClick={handleReconnect}
      title={
        connectionStatus === 'failed' || connectionStatus === 'error' 
          ? 'Click to reconnect' 
          : `Connection status: ${statusConfig.text}`
      }
    >
      <Icon 
        className={`w-4 h-4 ${statusConfig.animate ? 'animate-spin' : ''}`}
      />
      <span className="hidden sm:inline">{statusConfig.text}</span>
      
      {/* Show reconnect button for failed connections */}
      {(connectionStatus === 'failed' || connectionStatus === 'error') && (
        <RefreshCw className="w-3 h-3 ml-1" />
      )}
    </div>
  );
};

// Compact version for mobile
export const ConnectionStatusCompact = ({ className = '' }) => {
  const { connected, connectionStatus } = useWebSocket();

  const getStatusColor = () => {
    switch (connectionStatus) {
      case 'connected':
        return 'text-green-500';
      case 'connecting':
      case 'reconnecting':
        return 'text-blue-500';
      case 'error':
      case 'failed':
        return 'text-red-500';
      default:
        return 'text-gray-500';
    }
  };

  const getStatusIcon = () => {
    switch (connectionStatus) {
      case 'connected':
        return <CheckCircle className="w-4 h-4" />;
      case 'connecting':
      case 'reconnecting':
        return <RefreshCw className="w-4 h-4 animate-spin" />;
      case 'error':
      case 'failed':
        return <AlertCircle className="w-4 h-4" />;
      default:
        return <WifiOff className="w-4 h-4" />;
    }
  };

  return (
    <div 
      className={`inline-flex items-center ${getStatusColor()} ${className}`}
      title={`Connection: ${connectionStatus}`}
    >
      {getStatusIcon()}
    </div>
  );
};

export default ConnectionStatus;



