import React, { useEffect, useState, useCallback, useRef } from 'react';
import { X, CheckCircle, AlertCircle, AlertTriangle, Info } from 'lucide-react';

const Toast = ({ toast, onRemove }) => {
  const [isVisible, setIsVisible] = useState(false);
  const [isLeaving, setIsLeaving] = useState(false);
  const [progress, setProgress] = useState(100);
  const progressRef = useRef(null);
  const intervalRef = useRef(null);
  const startTimeRef = useRef(null);

  const handleRemove = useCallback(() => {
    setIsLeaving(true);
    // Clear any running progress interval
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }
    // Wait for the slide-out animation to complete (500ms + small buffer)
    setTimeout(() => {
      onRemove(toast.id);
    }, 550);
  }, [onRemove, toast.id]);

  // Show toast with animation
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(true);
    }, 10);

    return () => clearTimeout(timer);
  }, [toast.id]);

  // Progress bar animation
  useEffect(() => {
    if (toast.duration > 0 && !isLeaving) {
      const duration = toast.duration;
      startTimeRef.current = Date.now();
      
      // Reset progress to 100% when starting
      setProgress(100);
      
      const updateProgress = () => {
        const elapsed = Date.now() - startTimeRef.current;
        const remaining = Math.max(0, duration - elapsed);
        const progressPercent = (remaining / duration) * 100;
        
        setProgress(progressPercent);
        
        if (remaining <= 0) {
          clearInterval(intervalRef.current);
          handleRemove();
        }
      };
      
      // Update immediately
      updateProgress();
      
      // Then update every 50ms for smooth animation
      intervalRef.current = setInterval(updateProgress, 50);

      return () => {
        if (intervalRef.current) {
          clearInterval(intervalRef.current);
        }
      };
    }
  }, [toast.duration, isLeaving, handleRemove]);

  // Cleanup interval on unmount
  useEffect(() => {
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, []);

  const getToastIcon = () => {
    switch (toast.type) {
      case 'success':
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'error':
        return <AlertCircle className="h-5 w-5 text-red-500" />;
      case 'warning':
        return <AlertTriangle className="h-5 w-5 text-yellow-500" />;
      case 'info':
      default:
        return <Info className="h-5 w-5 text-blue-500" />;
    }
  };

  const getToastStyles = () => {
    const baseStyles = "relative flex items-start space-x-3 p-4 rounded-lg shadow-lg border backdrop-blur-sm transition-all duration-500 ease-in-out transform cursor-pointer";
    
    if (isLeaving) {
      return `${baseStyles} opacity-0 scale-90 translate-x-full translate-y-2`;
    }
    
    if (isVisible) {
      return `${baseStyles} opacity-100 scale-100 translate-x-0 translate-y-0`;
    }
    
    return `${baseStyles} opacity-0 scale-90 translate-x-full translate-y-2`;
  };

  const getToastTypeStyles = () => {
    switch (toast.type) {
      case 'success':
        return 'bg-green-50 border-green-200 dark:bg-green-900/20 dark:border-green-800';
      case 'error':
        return 'bg-red-50 border-red-200 dark:bg-red-900/20 dark:border-red-800';
      case 'warning':
        return 'bg-yellow-50 border-yellow-200 dark:bg-yellow-900/20 dark:border-yellow-800';
      case 'info':
      default:
        return 'bg-blue-50 border-blue-200 dark:bg-blue-900/20 dark:border-blue-800';
    }
  };

  return (
    <div 
      className={`${getToastStyles()} ${getToastTypeStyles()} max-w-sm w-full`}
      onClick={handleRemove}
    >
      {/* Icon */}
      <div className="flex-shrink-0">
        {getToastIcon()}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
          {toast.message}
        </p>
      </div>

      {/* Close button */}
      <div className="flex-shrink-0">
        <button
          onClick={(e) => {
            e.stopPropagation();
            handleRemove();
          }}
          className="inline-flex items-center justify-center rounded-md p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 dark:hover:text-gray-300 dark:hover:bg-gray-800 transition-colors duration-200"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      {/* Progress bar */}
      {toast.duration > 0 && (
        <div className="absolute bottom-0 left-0 right-0 h-1 bg-gray-200 dark:bg-gray-700 rounded-b-lg overflow-hidden">
          <div
            ref={progressRef}
            className="h-full bg-current opacity-70 transition-all duration-100 ease-linear"
            style={{
              width: `${Math.max(0, progress)}%`,
              transform: 'translateX(0)',
            }}
          />
        </div>
      )}
    </div>
  );
};

export { Toast };
export default Toast;
