// Offline Indicator Component for Todo App v0.7
// Shows offline status and queued actions

import React, { useState } from 'react';
import { useOffline } from '../../context/OfflineContext';
import { Wifi, WifiOff, Clock, AlertTriangle, CheckCircle, RefreshCw, Trash2 } from 'lucide-react';
import { Button } from './Button';

const OfflineIndicator = ({ className = '' }) => {
  const {
    isOffline,
    wasOffline,
    offlineDuration,
    queuedActionsCount,
    lastSyncTime,
    syncInProgress,
    formatOfflineDuration,
    shouldShowOfflineWarning,
    syncQueuedActions,
    clearOfflineData
  } = useOffline();

  const [showDetails, setShowDetails] = useState(false);

  const getStatusConfig = () => {
    if (isOffline) {
      return {
        icon: WifiOff,
        text: 'Offline',
        color: 'text-red-500',
        bgColor: 'bg-red-50',
        borderColor: 'border-red-200',
        description: `Offline for ${formatOfflineDuration(offlineDuration)}`
      };
    }

    if (wasOffline && shouldShowOfflineWarning()) {
      return {
        icon: CheckCircle,
        text: 'Back Online',
        color: 'text-green-500',
        bgColor: 'bg-green-50',
        borderColor: 'border-green-200',
        description: 'Connection restored'
      };
    }

    if (queuedActionsCount > 0) {
      return {
        icon: Clock,
        text: `${queuedActionsCount} Pending`,
        color: 'text-yellow-500',
        bgColor: 'bg-yellow-50',
        borderColor: 'border-yellow-200',
        description: 'Actions queued for sync'
      };
    }

    return null;
  };

  const statusConfig = getStatusConfig();

  if (!statusConfig) return null;

  const Icon = statusConfig.icon;

  const handleSync = () => {
    if (!syncInProgress) {
      syncQueuedActions();
    }
  };

  const handleClearData = () => {
    if (window.confirm('Are you sure you want to clear all offline data? This action cannot be undone.')) {
      clearOfflineData();
    }
  };

  return (
    <div className={`relative ${className}`}>
      {/* Main indicator */}
      <div 
        className={`
          inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium
          border transition-all duration-200 cursor-pointer
          ${statusConfig.bgColor} ${statusConfig.borderColor} ${statusConfig.color}
          hover:opacity-80
        `}
        onClick={() => setShowDetails(!showDetails)}
        title="Click for details"
      >
        <Icon className="w-4 h-4" />
        <span className="hidden sm:inline">{statusConfig.text}</span>
        
        {/* Sync indicator */}
        {syncInProgress && (
          <RefreshCw className="w-3 h-3 animate-spin" />
        )}
      </div>

      {/* Details panel */}
      {showDetails && (
        <div className="absolute top-full right-0 mt-2 w-80 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg z-50">
          <div className="p-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold text-gray-900 dark:text-white">
                Offline Status
              </h3>
              <button
                onClick={() => setShowDetails(false)}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              >
                ×
              </button>
            </div>

            {/* Status info */}
            <div className="space-y-2 mb-4">
              <div className="flex items-center gap-2">
                <Icon className="w-4 h-4" />
                <span className="text-sm text-gray-700 dark:text-gray-300">
                  {statusConfig.description}
                </span>
              </div>

              {lastSyncTime && (
                <div className="text-xs text-gray-500 dark:text-gray-400">
                  Last sync: {new Date(lastSyncTime).toLocaleString()}
                </div>
              )}
            </div>

            {/* Queued actions */}
            {queuedActionsCount > 0 && (
              <div className="mb-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Queued Actions ({queuedActionsCount})
                  </span>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={handleSync}
                    disabled={syncInProgress || isOffline}
                    className="text-xs"
                  >
                    {syncInProgress ? (
                      <>
                        <RefreshCw className="w-3 h-3 animate-spin mr-1" />
                        Syncing...
                      </>
                    ) : (
                      <>
                        <CheckCircle className="w-3 h-3 mr-1" />
                        Sync Now
                      </>
                    )}
                  </Button>
                </div>
                
                {isOffline && (
                  <div className="text-xs text-gray-500 dark:text-gray-400 mb-2">
                    Actions will sync automatically when you're back online
                  </div>
                )}
              </div>
            )}

            {/* Offline mode info */}
            {isOffline && (
              <div className="mb-4 p-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
                <div className="flex items-start gap-2">
                  <AlertTriangle className="w-4 h-4 text-yellow-600 dark:text-yellow-400 mt-0.5" />
                  <div className="text-xs text-yellow-800 dark:text-yellow-200">
                    <div className="font-medium mb-1">Offline Mode</div>
                    <div>You can view cached data and queue actions for later sync.</div>
                  </div>
                </div>
              </div>
            )}

            {/* Actions */}
            <div className="flex gap-2">
              <Button
                size="sm"
                variant="outline"
                onClick={handleClearData}
                className="text-xs text-red-600 hover:text-red-700"
              >
                <Trash2 className="w-3 h-3 mr-1" />
                Clear Data
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// Compact version for mobile
export const OfflineIndicatorCompact = ({ className = '' }) => {
  const { isOffline, queuedActionsCount, syncInProgress } = useOffline();

  const getStatusColor = () => {
    if (isOffline) return 'text-red-500';
    if (queuedActionsCount > 0) return 'text-yellow-500';
    return 'text-green-500';
  };

  const getStatusIcon = () => {
    if (isOffline) return <WifiOff className="w-4 h-4" />;
    if (queuedActionsCount > 0) return <Clock className="w-4 h-4" />;
    return <Wifi className="w-4 h-4" />;
  };

  return (
    <div 
      className={`inline-flex items-center ${getStatusColor()} ${className}`}
      title={
        isOffline 
          ? 'Offline' 
          : queuedActionsCount > 0 
            ? `${queuedActionsCount} actions queued` 
            : 'Online'
      }
    >
      {getStatusIcon()}
      {syncInProgress && (
        <RefreshCw className="w-3 h-3 ml-1 animate-spin" />
      )}
    </div>
  );
};

export default OfflineIndicator;



