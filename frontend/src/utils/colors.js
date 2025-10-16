// Global color constants for todo states
export const TODO_COLORS = {
  // Main color palette
  BLUE: '#3B82F6',        // Blue - for low priority and >5 days
  YELLOW: '#EAB30A',      // Yellow - for medium priority and 3-5 days
  GREEN: '#20C55E',       // Green - for high priority
  RED: '#EF4444',         // Red - for overdue and ≤2 days
  
  // Todo state colors (for card borders/backgrounds)
  TODO: '#3B82F6',        // Blue for "To Do" state
  IN_PROGRESS: '#EAB30A', // Yellow/Orange for "In Progress" state
  COMPLETED: '#20C55E',   // Green for "Completed" state
  OVERDUE: '#EF4444',     // Red for overdue todos
  
  // Light variants for backgrounds
  TODO_LIGHT: '#3B82F6',        // Same as main for consistency
  IN_PROGRESS_LIGHT: '#EAB30A', // Same as main for consistency
  COMPLETED_LIGHT: '#20C55E',   // Same as main for consistency
  OVERDUE_LIGHT: '#EF4444',     // Same as main for consistency
  
  // Dark mode variants
  TODO_DARK: '#60A5FA',        // Lighter blue for dark mode
  IN_PROGRESS_DARK: '#F59E0B', // Lighter yellow for dark mode
  COMPLETED_DARK: '#34D399',   // Lighter green for dark mode
  OVERDUE_DARK: '#F87171',     // Lighter red for dark mode
};

// Tailwind CSS color mappings for easy use
export const TODO_COLOR_CLASSES = {
  // Border colors
  TODO_BORDER: 'border-blue-500 dark:border-blue-400',
  IN_PROGRESS_BORDER: 'border-yellow-500 dark:border-yellow-400',
  COMPLETED_BORDER: 'border-green-500 dark:border-green-400',
  OVERDUE_BORDER: 'border-red-500 dark:border-red-400',
  
  // Background colors
  TODO_BG: 'bg-blue-50/30 dark:bg-blue-900/10',
  IN_PROGRESS_BG: 'bg-yellow-50/30 dark:bg-yellow-900/10',
  COMPLETED_BG: 'bg-green-50/30 dark:bg-green-900/10',
  OVERDUE_BG: 'bg-red-50/30 dark:bg-red-900/10',
  
  // Badge colors
  TODO_BADGE: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300',
  IN_PROGRESS_BADGE: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300 font-bold',
  COMPLETED_BADGE: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300 font-bold',
  OVERDUE_BADGE: 'text-red-600 font-bold bg-red-50 dark:bg-red-900/20',
  
  // Due date badge colors
  TODO_DUE_BADGE: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
  IN_PROGRESS_DUE_BADGE: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400',
  COMPLETED_DUE_BADGE: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
  OVERDUE_DUE_BADGE: 'text-red-600 font-bold bg-red-50 dark:bg-red-900/20 px-2 py-1 rounded-md',
  
  // Priority badge colors (based on priority level)
  LOW_PRIORITY_BADGE: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300',      // Blue for low priority
  MEDIUM_PRIORITY_BADGE: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300', // Yellow for medium priority
  HIGH_PRIORITY_BADGE: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300',      // Green for high priority
  
  // Due date badge colors (based on time remaining) - with background
  URGENT_DUE_BADGE: 'text-red-600 font-bold bg-red-50 dark:bg-red-900/20 px-2 py-1 rounded-md',     // ≤2 days - Red
  WARNING_DUE_BADGE: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400',    // 3-5 days - Yellow
  NORMAL_DUE_BADGE: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',             // >5 days - Blue
  
  // Due date text colors (based on time remaining) - text only, no background
  URGENT_DUE_TEXT: 'text-red-600 font-bold',     // ≤2 days - Red text only
  WARNING_DUE_TEXT: 'text-yellow-600 font-medium',    // 3-5 days - Yellow text only
  NORMAL_DUE_TEXT: 'text-blue-600 font-medium',             // >5 days - Blue text only
};

// Helper functions for color logic
export const getPriorityBadgeClass = (priority) => {
  switch (priority) {
    case 'low':
      return TODO_COLOR_CLASSES.LOW_PRIORITY_BADGE;
    case 'medium':
      return TODO_COLOR_CLASSES.MEDIUM_PRIORITY_BADGE;
    case 'high':
      return TODO_COLOR_CLASSES.HIGH_PRIORITY_BADGE;
    default:
      return TODO_COLOR_CLASSES.LOW_PRIORITY_BADGE;
  }
};

export const getDueDateBadgeClass = (dueDate) => {
  if (!dueDate) return 'text-muted-foreground';
  
  const today = new Date();
  const due = new Date(dueDate);
  const diffTime = due.getTime() - today.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  
  // If overdue (negative days)
  if (diffDays < 0) {
    return TODO_COLOR_CLASSES.URGENT_DUE_BADGE;
  }
  
  // Based on days remaining
  if (diffDays <= 2) {
    return TODO_COLOR_CLASSES.URGENT_DUE_BADGE;      // ≤2 days - Red
  } else if (diffDays <= 5) {
    return TODO_COLOR_CLASSES.WARNING_DUE_BADGE;     // 3-5 days - Yellow
  } else {
    return TODO_COLOR_CLASSES.NORMAL_DUE_BADGE;      // >5 days - Blue
  }
};

export const getDueDateTextClass = (dueDate) => {
  if (!dueDate) return 'text-muted-foreground';
  
  const today = new Date();
  const due = new Date(dueDate);
  const diffTime = due.getTime() - today.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  
  // If overdue (negative days)
  if (diffDays < 0) {
    return TODO_COLOR_CLASSES.URGENT_DUE_TEXT;
  }
  
  // Based on days remaining
  if (diffDays <= 2) {
    return TODO_COLOR_CLASSES.URGENT_DUE_TEXT;      // ≤2 days - Red text only
  } else if (diffDays <= 5) {
    return TODO_COLOR_CLASSES.WARNING_DUE_TEXT;     // 3-5 days - Yellow text only
  } else {
    return TODO_COLOR_CLASSES.NORMAL_DUE_TEXT;      // >5 days - Blue text only
  }
};
