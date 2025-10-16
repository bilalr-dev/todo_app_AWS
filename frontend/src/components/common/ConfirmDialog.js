import React, { useState, useEffect } from 'react';
import { Button } from './Button';
import { Card, CardContent, CardHeader, CardTitle } from './Card';
import { AlertTriangle, X } from 'lucide-react';
import { cn } from '../../utils/helpers';

const ConfirmDialog = ({ 
  isOpen, 
  onClose, 
  onConfirm, 
  title = "Confirm Action", 
  message = "Are you sure you want to proceed?", 
  confirmText = "Confirm", 
  cancelText = "Cancel",
  variant = "destructive" // "destructive", "warning", "info"
}) => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setIsVisible(true);
    } else {
      setIsVisible(false);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  const getVariantStyles = () => {
    switch (variant) {
      case 'destructive':
        return {
          icon: <AlertTriangle className="icon-modern-lg text-destructive" />,
          iconBg: "bg-destructive/10",
          confirmButton: "bg-destructive hover:bg-destructive/90 text-destructive-foreground"
        };
      case 'warning':
        return {
          icon: <AlertTriangle className="icon-modern-lg text-yellow-600" />,
          iconBg: "bg-yellow-100 dark:bg-yellow-900/20",
          confirmButton: "bg-yellow-600 hover:bg-yellow-700 text-white"
        };
      case 'info':
        return {
          icon: <AlertTriangle className="icon-modern-lg text-blue-600" />,
          iconBg: "bg-blue-100 dark:bg-blue-900/20",
          confirmButton: "bg-blue-600 hover:bg-blue-700 text-white"
        };
      default:
        return {
          icon: <AlertTriangle className="icon-modern-lg text-destructive" />,
          iconBg: "bg-destructive/10",
          confirmButton: "bg-destructive hover:bg-destructive/90 text-destructive-foreground"
        };
    }
  };

  const styles = getVariantStyles();

  return (
    <div 
      className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
      onClick={handleBackdropClick}
    >
      <Card 
        className={cn(
          "w-full max-w-md mx-4 transform transition-all duration-200 ease-out",
          isVisible ? "scale-100 opacity-100" : "scale-95 opacity-0"
        )}
        onClick={(e) => e.stopPropagation()}
      >
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className={cn("h-10 w-10 rounded-full flex items-center justify-center", styles.iconBg)}>
                {styles.icon}
              </div>
              <CardTitle className="text-lg font-semibold text-foreground">
                {title}
              </CardTitle>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={(e) => {
                e.stopPropagation();
                onClose();
              }}
              className="h-8 w-8 icon-button"
            >
              <X className="icon-modern-sm" />
            </Button>
          </div>
        </CardHeader>
        
        <CardContent className="pt-0">
          <p className="text-muted-foreground mb-6 leading-relaxed">
            {message}
          </p>
          
          <div className="flex justify-end space-x-3">
            <Button
              variant="outline"
              onClick={(e) => {
                e.stopPropagation();
                onClose();
              }}
              className="px-6"
            >
              {cancelText}
            </Button>
            <Button
              onClick={(e) => {
                e.stopPropagation();
                onConfirm();
              }}
              className={cn("px-6", styles.confirmButton)}
            >
              {confirmText}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ConfirmDialog;
