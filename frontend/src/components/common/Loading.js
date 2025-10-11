import React from 'react';
import { Loader2 } from 'lucide-react';

const getSizeClasses = (size = 'md') => {
  switch (size) {
    case 'sm':
      return 'h-4 w-4';
    case 'lg':
      return 'h-8 w-8';
    case 'xl':
      return 'h-12 w-12';
    case 'md':
    default:
      return 'h-6 w-6';
  }
};

const Loading = ({ 
  size = 'md', 
  text = 'Loading...', 
  fullScreen = false, 
  className = '' 
}) => {

  const getTextSizeClasses = () => {
    switch (size) {
      case 'sm':
        return 'text-sm';
      case 'lg':
        return 'text-lg';
      case 'xl':
        return 'text-xl';
      case 'md':
      default:
        return 'text-base';
    }
  };

  const content = (
    <div className={`flex flex-col items-center justify-center space-y-2 ${className}`}>
      <Loader2 className={`${getSizeClasses()} animate-spin text-primary`} />
      {text && (
        <p className={`${getTextSizeClasses()} text-muted-foreground font-medium`}>
          {text}
        </p>
      )}
    </div>
  );

  if (fullScreen) {
    return (
      <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center">
        {content}
      </div>
    );
  }

  return content;
};

// Loading spinner variants
export const LoadingSpinner = ({ size = 'md', className = '' }) => (
  <div className={`flex items-center justify-center ${className}`}>
    <Loader2 className={`${getSizeClasses(size)} animate-spin text-primary`} />
  </div>
);

// Loading dots
export const LoadingDots = ({ className = '' }) => (
  <div className={`flex space-x-1 ${className}`}>
    <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
    <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
    <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
  </div>
);

// Loading skeleton
export const LoadingSkeleton = ({ 
  lines = 3, 
  className = '',
  showAvatar = false 
}) => (
  <div className={`animate-pulse space-y-3 ${className}`}>
    {showAvatar && (
      <div className="flex items-center space-x-3">
        <div className="h-10 w-10 bg-muted rounded-full" />
        <div className="space-y-2">
          <div className="h-4 bg-muted rounded w-24" />
          <div className="h-3 bg-muted rounded w-16" />
        </div>
      </div>
    )}
    {Array.from({ length: lines }).map((_, index) => (
      <div key={index} className="space-y-2">
        <div className="h-4 bg-muted rounded w-full" />
        {index === 0 && <div className="h-3 bg-muted rounded w-3/4" />}
      </div>
    ))}
  </div>
);

// Card loading skeleton
export const CardLoadingSkeleton = ({ className = '' }) => (
  <div className={`animate-pulse ${className}`}>
    <div className="bg-card rounded-lg border p-6 space-y-4">
      <div className="flex items-center space-x-3">
        <div className="h-4 w-4 bg-muted rounded" />
        <div className="h-4 bg-muted rounded w-3/4" />
      </div>
      <div className="space-y-2">
        <div className="h-3 bg-muted rounded w-full" />
        <div className="h-3 bg-muted rounded w-2/3" />
      </div>
      <div className="flex justify-between items-center">
        <div className="h-6 bg-muted rounded w-16" />
        <div className="h-8 bg-muted rounded w-20" />
      </div>
    </div>
  </div>
);

// Table loading skeleton
export const TableLoadingSkeleton = ({ 
  rows = 5, 
  columns = 4, 
  className = '' 
}) => (
  <div className={`animate-pulse ${className}`}>
    <div className="space-y-3">
      {Array.from({ length: rows }).map((_, rowIndex) => (
        <div key={rowIndex} className="flex space-x-4">
          {Array.from({ length: columns }).map((_, colIndex) => (
            <div
              key={colIndex}
              className={`h-4 bg-muted rounded ${
                colIndex === 0 ? 'w-8' : 
                colIndex === columns - 1 ? 'w-16' : 'w-24'
              }`}
            />
          ))}
        </div>
      ))}
    </div>
  </div>
);

export { Loading };
export default Loading;
