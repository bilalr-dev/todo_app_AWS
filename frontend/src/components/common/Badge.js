import React from 'react';
import { cn } from '../../utils/helpers';
import { getPriorityBadgeClass } from '../../utils/colors';
import { 
  Briefcase, 
  User, 
  ShoppingCart, 
  Heart, 
  DollarSign, 
  Book, 
  MapPin, 
  MoreHorizontal 
} from 'lucide-react';

const Badge = React.forwardRef(({
  children,
  className,
  variant = 'default',
  size = 'md',
  ...props
}, ref) => {
  const baseClasses = 'inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2';
  
  const variants = {
    default: 'border-transparent bg-primary text-primary-foreground hover:bg-primary/80',
    secondary: 'border-transparent bg-secondary text-secondary-foreground hover:bg-secondary/80',
    destructive: 'border-transparent bg-destructive text-destructive-foreground hover:bg-destructive/80',
    outline: 'text-foreground',
    success: 'border-transparent bg-success-100 text-success-800 dark:bg-success-900 dark:text-success-200',
    warning: 'border-transparent bg-warning-100 text-warning-800 dark:bg-warning-900 dark:text-warning-200',
    error: 'border-transparent bg-error-100 text-error-800 dark:bg-error-900 dark:text-error-200',
  };

  const sizes = {
    sm: 'px-2 py-0.5 text-xs',
    md: 'px-2.5 py-0.5 text-xs',
    lg: 'px-3 py-1 text-sm',
  };

  const classes = cn(
    baseClasses,
    variants[variant],
    sizes[size],
    className
  );

  return (
    <div
      ref={ref}
      className={classes}
      {...props}
    >
      {children}
    </div>
  );
});

Badge.displayName = 'Badge';

// Priority badge component
export const PriorityBadge = ({ priority, className, ...props }) => {
  return (
    <Badge
      variant="outline"
      className={cn('font-medium', getPriorityBadgeClass(priority), className)}
      {...props}
    >
      {priority?.charAt(0).toUpperCase() + priority?.slice(1)}
    </Badge>
  );
};

// Status badge component
export const StatusBadge = ({ status, className, ...props }) => {
  const statusVariants = {
    completed: 'success',
    pending: 'warning',
    overdue: 'error',
    cancelled: 'destructive',
  };

  const statusLabels = {
    completed: 'Completed',
    pending: 'In Progress',
    overdue: 'Overdue',
    cancelled: 'Cancelled',
  };

  return (
    <Badge
      variant={statusVariants[status] || 'default'}
      className={cn('font-medium', className)}
      {...props}
    >
      {statusLabels[status] || status}
    </Badge>
  );
};

// Category badge component with icons
export const CategoryBadge = ({ category, className, size = 'sm', ...props }) => {
  const iconMap = {
    work: Briefcase,
    personal: User,
    shopping: ShoppingCart,
    health: Heart,
    finance: DollarSign,
    education: Book,
    travel: MapPin,
    other: MoreHorizontal,
  };

  const IconComponent = iconMap[category];
  
  return (
    <Badge
      variant="secondary"
      size={size}
      className={cn('font-medium', className)}
      {...props}
    >
      {IconComponent && <IconComponent className="w-3 h-3 mr-1" />}
      {category?.charAt(0).toUpperCase() + category?.slice(1)}
    </Badge>
  );
};

export { Badge };
export default Badge;
