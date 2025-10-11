import React, { useEffect, useState, useCallback } from 'react';
import { X, CheckCircle, AlertCircle, AlertTriangle, Info } from 'lucide-react';

const Toast = ({ toast, onRemove }) => {
  const [isVisible, setIsVisible] = useState(false);
  const [isLeaving, setIsLeaving] = useState(false);

  const handleRemove = useCallback(() => {
    setIsLeaving(true);
    setTimeout(() => {
      onRemove(toast.id);
    }, 300);
  }, [onRemove, toast.id]);

  // Show toast with animation
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(true);
    }, 10);

    return () => clearTimeout(timer);
  }, []);

  // Auto remove toast
  useEffect(() => {
    if (toast.duration > 0) {
      const timer = setTimeout(() => {
        handleRemove();
      }, toast.duration);

      return () => clearTimeout(timer);
    }
  }, [toast.duration, handleRemove]);

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
    const baseStyles = "relative flex items-start space-x-3 p-4 rounded-lg shadow-lg border backdrop-blur-sm transition-all duration-300 ease-in-out transform";
    
    if (isLeaving) {
      return `${baseStyles} opacity-0 scale-95 translate-x-full`;
    }
    
    if (isVisible) {
      return `${baseStyles} opacity-100 scale-100 translate-x-0`;
    }
    
    return `${baseStyles} opacity-0 scale-95 translate-x-full`;
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
    <div className={`${getToastStyles()} ${getToastTypeStyles()} max-w-sm w-full`}>
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
          onClick={handleRemove}
          className="inline-flex items-center justify-center rounded-md p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 dark:hover:text-gray-300 dark:hover:bg-gray-800 transition-colors duration-200"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      {/* Progress bar */}
      {toast.duration > 0 && (
        <div className="absolute bottom-0 left-0 h-1 bg-current opacity-30 rounded-b-lg">
          <div
            className="h-full bg-current opacity-60 transition-all duration-100 ease-linear"
            style={{
              width: '100%',
              animation: `toast-progress ${toast.duration}ms linear forwards`,
            }}
          />
        </div>
      )}
    </div>
  );
};

export { Toast };
export default Toast;
