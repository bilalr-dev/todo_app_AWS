import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthProvider';
import { useTheme } from '../../context/ThemeContext';
import { useTodos } from '../../context/TodoProvider';
import { Button } from '../common/Button';
import {
  Menu,
  X,
  Home,
  User,
  LogOut,
  Sun,
  Moon,
  CheckCircle2,
  Bell,
  Calendar,
  AlertTriangle
} from 'lucide-react';
import { cn, formatDate, isOverdue } from '../../utils/helpers';
import { TODO_CONFIG } from '../../utils/constants';
import { CategoryBadge } from '../common/Badge';

const Layout = () => {
  const [sidebarOpen, setSidebarOpen] = useState(true); // Start with sidebar open
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);
  const [notificationMenuOpen, setNotificationMenuOpen] = useState(false);
  const [selectedTodo, setSelectedTodo] = useState(null);
  const [clearedTodos, setClearedTodos] = useState(() => {
    // Load cleared todos from localStorage on initialization
    try {
      const saved = localStorage.getItem('clearedTodos');
      return saved ? new Set(JSON.parse(saved)) : new Set();
    } catch (error) {
      return new Set();
    }
  }); // Track which todos have been cleared from notifications
  const [seenTodos, setSeenTodos] = useState(() => {
    // Load seen todos from localStorage on initialization
    try {
      const saved = localStorage.getItem('seenTodos');
      return saved ? new Set(JSON.parse(saved)) : new Set();
    } catch (error) {
      return new Set();
    }
  }); // Track which todos have been seen
  const [isMobile, setIsMobile] = useState(false);
  const profileMenuRef = useRef(null);
  const notificationMenuRef = useRef(null);
  const todoPopupRef = useRef(null);
  const prevTodosRef = useRef({ todoIds: new Set(), todosMap: new Map() });
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const { todos } = useTodos();
  
  // Create a hash of todos to force memoization updates
  const todosHash = useMemo(() => {
    if (!Array.isArray(todos)) return '';
    return todos.map(t => `${t.id}-${t.priority}-${t.due_date}-${t.status}`).join('|');
  }, [todos]);
  const location = useLocation();
  const navigate = useNavigate();

  const navigation = [
    { name: 'Dashboard', href: '/dashboard', icon: Home },
    { name: 'Profile', href: '/profile', icon: User },
  ];

  // Filter urgent todos (high priority, due within 5 days) - memoized
  const urgentTodos = useMemo(() => {
    if (!Array.isArray(todos)) return [];
    const filtered = todos.filter(todo => {
      if (!todo.due_date || todo.status === 'completed' || todo.priority !== 'high') return false;
      
      // Handle both date string formats (YYYY-MM-DD and full ISO strings)
      let dueDate;
      if (typeof todo.due_date === 'string' && todo.due_date.includes('T')) {
        // Full ISO string from database
        dueDate = new Date(todo.due_date);
      } else {
        // Date string in YYYY-MM-DD format from DatePicker
        dueDate = new Date(todo.due_date + 'T00:00:00');
      }
      
      // Normalize all dates to start of day in local timezone
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      const fiveDaysFromNow = new Date(today);
      fiveDaysFromNow.setDate(today.getDate() + 5);
      fiveDaysFromNow.setHours(23, 59, 59, 999);
      
      dueDate.setHours(0, 0, 0, 0);
      
      return dueDate <= fiveDaysFromNow;
    });
    
    return filtered;
  }, [todos, todosHash]);

  // Memoized visible urgent todos count
  const visibleUrgentTodosCount = useMemo(() => {
    const count = urgentTodos.filter(todo => !clearedTodos.has(todo.id) && !seenTodos.has(todo.id)).length;
    
    return count;
  }, [urgentTodos, clearedTodos, seenTodos]);

  const handleLogout = async () => {
    setProfileMenuOpen(false);
    // Clear seen and cleared todos state when logging out
    setSeenTodos(new Set());
    setClearedTodos(new Set());
    localStorage.removeItem('seenTodos');
    localStorage.removeItem('clearedTodos');
    await logout();
    navigate('/login');
  };

  // Manual cleanup function for debugging
  const clearNotificationState = () => {
    setSeenTodos(new Set());
    setClearedTodos(new Set());
    localStorage.removeItem('seenTodos');
    localStorage.removeItem('clearedTodos');
  };



  const handleClearNotifications = () => {
    // Mark all urgent todos as cleared (remove from notifications)
    const urgentTodoIds = urgentTodos.map(todo => todo.id);
    setClearedTodos(prev => new Set([...prev, ...urgentTodoIds]));
    setNotificationMenuOpen(false);
  };

  const handleTodoClick = (todo) => {
    setSelectedTodo(todo);
    setNotificationMenuOpen(false);
  };

  const handleCloseTodoPopup = () => {
    if (selectedTodo) {
      // Mark this specific todo as seen
      setSeenTodos(prev => new Set([...prev, selectedTodo.id]));
    }
    setSelectedTodo(null);
  };

  const isActive = (href) => {
    return location.pathname === href;
  };

  // Detect screen size
  useEffect(() => {
    const checkScreenSize = () => {
      setIsMobile(window.innerWidth < 1024); // lg breakpoint
    };

    checkScreenSize();
    window.addEventListener('resize', checkScreenSize);

    return () => {
      window.removeEventListener('resize', checkScreenSize);
    };
  }, []);

  // Close menus when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (profileMenuRef.current && !profileMenuRef.current.contains(event.target)) {
        setProfileMenuOpen(false);
      }
      if (notificationMenuRef.current && !notificationMenuRef.current.contains(event.target)) {
        setNotificationMenuOpen(false);
      }
      if (todoPopupRef.current && !todoPopupRef.current.contains(event.target)) {
        handleCloseTodoPopup();
      }
    };

    if (profileMenuOpen || notificationMenuOpen || selectedTodo) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [profileMenuOpen, notificationMenuOpen, selectedTodo]);

  // Save seen todos to localStorage whenever it changes
  useEffect(() => {
    try {
      localStorage.setItem('seenTodos', JSON.stringify([...seenTodos]));
    } catch (error) {
      // Silently fail if localStorage is not available
    }
  }, [seenTodos]);

  // Save cleared todos to localStorage whenever it changes
  useEffect(() => {
    try {
      localStorage.setItem('clearedTodos', JSON.stringify([...clearedTodos]));
    } catch (error) {
      // Silently fail if localStorage is not available
    }
  }, [clearedTodos]);

  // Clean up seen and cleared todos when todos are deleted (not on initial load)
  useEffect(() => {
    if (!Array.isArray(todos)) return;
    const currentTodoIds = new Set(todos.map(todo => todo.id));
    const prevTodoIds = prevTodosRef.current.todoIds;
    
    // Only clean up if we had todos before and now we have fewer (actual deletion)
    // Don't clean up on initial load (when prevTodoIds is empty)
    if (prevTodoIds.size > 0 && currentTodoIds.size < prevTodoIds.size) {
      // Clean up seen and cleared todos - remove IDs that no longer exist in todos
      setSeenTodos(prev => {
        const newSeenTodos = new Set();
        prev.forEach(id => {
          if (currentTodoIds.has(id)) {
            newSeenTodos.add(id);
          }
        });
        return newSeenTodos;
      });
      
      setClearedTodos(prev => {
        const newClearedTodos = new Set();
        prev.forEach(id => {
          if (currentTodoIds.has(id)) {
            newClearedTodos.add(id);
          }
        });
        return newClearedTodos;
      });
    }
    
    // If todos count is 0 and we had todos before, clear all seen and cleared todos (fresh start)
    if (currentTodoIds.size === 0 && prevTodoIds.size > 0) {
      setSeenTodos(new Set());
      setClearedTodos(new Set());
      // Also clear localStorage
      localStorage.removeItem('seenTodos');
      localStorage.removeItem('clearedTodos');
    }
    
    // Update the ref with current todo IDs
    prevTodosRef.current.todoIds = currentTodoIds;
  }, [todos]);

  // Reset notification state when specific todos are updated (to show only updated todos in notifications)
  useEffect(() => {
    if (!Array.isArray(todos) || todos.length === 0) return;
    
    // Create a map of current todos for comparison
    const currentTodosMap = new Map(todos.map(todo => [todo.id, todo]));
    const prevTodosMap = prevTodosRef.current.todosMap || new Map();
    
    // Find todos that have been updated (not new todos, not deleted todos)
    const updatedTodoIds = new Set();
    
    currentTodosMap.forEach((currentTodo, id) => {
      const prevTodo = prevTodosMap.get(id);
      
      // If this todo existed before and has been modified
      if (prevTodo) {
        const hasChanged = 
          currentTodo.status !== prevTodo.status ||
          currentTodo.priority !== prevTodo.priority ||
          currentTodo.due_date !== prevTodo.due_date ||
          currentTodo.title !== prevTodo.title;
        
        if (hasChanged) {
          updatedTodoIds.add(id);
        }
      }
    });
    
    // If we have updated todos, reset their notification state
    if (updatedTodoIds.size > 0) {
      
      // Remove updated todos from seen and cleared sets
      setSeenTodos(prev => {
        const newSeenTodos = new Set(prev);
        updatedTodoIds.forEach(id => newSeenTodos.delete(id));
        return newSeenTodos;
      });
      
      setClearedTodos(prev => {
        const newClearedTodos = new Set(prev);
        updatedTodoIds.forEach(id => newClearedTodos.delete(id));
        return newClearedTodos;
      });
      
      // Update localStorage
      const currentSeenTodos = Array.from(seenTodos).filter(id => !updatedTodoIds.has(id));
      const currentClearedTodos = Array.from(clearedTodos).filter(id => !updatedTodoIds.has(id));
      
      localStorage.setItem('seenTodos', JSON.stringify(currentSeenTodos));
      localStorage.setItem('clearedTodos', JSON.stringify(currentClearedTodos));
    }
    
    // Update the ref with current todos map
    prevTodosRef.current.todosMap = currentTodosMap;
  }, [todos, seenTodos, clearedTodos]);

  // Clean up cleared/seen todos that are no longer urgent (e.g., completed or due date changed)
  useEffect(() => {
    if (!Array.isArray(todos) || todos.length === 0) return;
    
    // Create a map of current urgent todos for efficient lookup
    const currentUrgentTodosMap = new Map(urgentTodos.map(todo => [todo.id, todo]));
    
    // Remove from cleared todos any todos that are no longer urgent
    setClearedTodos(prev => {
      const newClearedTodos = new Set();
      prev.forEach(id => {
        const currentTodo = currentUrgentTodosMap.get(id);
        if (currentTodo) {
          // Check if this todo is still urgent with the same criteria
          if (currentTodo.status !== 'completed' && 
              currentTodo.priority === 'high' && 
              currentTodo.due_date) {
            
            // Check if due date is still within 5 days
            let dueDate;
            if (typeof currentTodo.due_date === 'string' && currentTodo.due_date.includes('T')) {
              dueDate = new Date(currentTodo.due_date);
            } else {
              dueDate = new Date(currentTodo.due_date + 'T00:00:00');
            }
            
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            
            const fiveDaysFromNow = new Date(today);
            fiveDaysFromNow.setDate(today.getDate() + 5);
            fiveDaysFromNow.setHours(23, 59, 59, 999);
            
            dueDate.setHours(0, 0, 0, 0);
            
            if (dueDate <= fiveDaysFromNow) {
              newClearedTodos.add(id);
            }
          }
        }
      });
      return newClearedTodos;
    });
    
    // Remove from seen todos any todos that are no longer urgent
    setSeenTodos(prev => {
      const newSeenTodos = new Set();
      prev.forEach(id => {
        const currentTodo = currentUrgentTodosMap.get(id);
        if (currentTodo) {
          // Check if this todo is still urgent with the same criteria
          if (currentTodo.status !== 'completed' && 
              currentTodo.priority === 'high' && 
              currentTodo.due_date) {
            
            // Check if due date is still within 5 days
            let dueDate;
            if (typeof currentTodo.due_date === 'string' && currentTodo.due_date.includes('T')) {
              dueDate = new Date(currentTodo.due_date);
            } else {
              dueDate = new Date(currentTodo.due_date + 'T00:00:00');
            }
            
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            
            const fiveDaysFromNow = new Date(today);
            fiveDaysFromNow.setDate(today.getDate() + 5);
            fiveDaysFromNow.setHours(23, 59, 59, 999);
            
            dueDate.setHours(0, 0, 0, 0);
            
            if (dueDate <= fiveDaysFromNow) {
              newSeenTodos.add(id);
            }
          }
        }
      });
      return newSeenTodos;
    });
  }, [urgentTodos, todos]);

  // Handle todo updates - remove from cleared/seen only if they become non-urgent
  useEffect(() => {
    // Only clean up if we have todos loaded (not on initial load when urgentTodos is empty)
    if (urgentTodos.length === 0 && (!Array.isArray(todos) || todos.length === 0)) {
      return; // Don't clean up on initial load
    }
    
    // Check if any cleared or seen todos are no longer urgent
    const urgentTodoIds = new Set(urgentTodos.map(todo => todo.id));
    
    setClearedTodos(prev => {
      const newClearedTodos = new Set();
      prev.forEach(id => {
        // Keep in cleared only if it's still urgent (user cleared it, so it should stay cleared)
        if (urgentTodoIds.has(id)) {
          newClearedTodos.add(id);
        }
      });
      return newClearedTodos;
    });
    
    setSeenTodos(prev => {
      const newSeenTodos = new Set();
      prev.forEach(id => {
        // Keep in seen only if it's still urgent (user saw it, so it should stay seen)
        if (urgentTodoIds.has(id)) {
          newSeenTodos.add(id);
        }
      });
      return newSeenTodos;
    });
  }, [urgentTodos, todos.length]);




  return (
    <div className="min-h-screen bg-background">
      {/* Sidebar backdrop - only on mobile */}
      {sidebarOpen && isMobile && (
        <div
          className="fixed inset-0 bg-black/50 z-40"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div className={cn(
        "w-64 bg-card border-r border-border transition-all duration-300 ease-in-out",
        isMobile 
          ? "fixed inset-y-0 left-0 z-50 transform" + (sidebarOpen ? " translate-x-0" : " -translate-x-full")
          : sidebarOpen 
            ? "fixed inset-y-0 left-0 z-50" 
            : "fixed inset-y-0 left-0 z-50 transform -translate-x-full"
      )}>
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="flex items-center justify-between h-16 px-6 border-b border-border">
            <div className="flex items-center space-x-2">
              <div className="icon-bg">
                <CheckCircle2 className="icon-modern-md text-primary" />
              </div>
              <span className="text-xl font-bold text-foreground">Todo App</span>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setSidebarOpen(false)}
              className="icon-button"
            >
              <X className="icon-modern-md" />
            </Button>
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-4 py-6 space-y-2">
            {navigation.map((item) => {
              const Icon = item.icon;
              return (
                <button
                  key={item.name}
                  onClick={() => {
                    navigate(item.href);
                    // Only close sidebar on mobile devices
                    if (isMobile) {
                      setSidebarOpen(false);
                    }
                  }}
                  className={cn(
                    "w-full flex items-center space-x-3 px-3 py-2 rounded-lg text-left transition-all duration-300 ease-out",
                    isActive(item.href)
                      ? "bg-primary text-primary-foreground shadow-lg"
                      : "text-muted-foreground hover:text-foreground hover:bg-accent hover:shadow-md"
                  )}
                >
                  <Icon className={cn(
                    "icon-modern-md",
                    isActive(item.href) ? "icon-glow" : ""
                  )} />
                  <span className="font-medium">{item.name}</span>
                </button>
              );
            })}
          </nav>
        </div>
      </div>

      {/* Main content area */}
      <div className={cn(
        "relative transition-all duration-300 ease-in-out",
        !isMobile && sidebarOpen ? "ml-64" : "ml-0"
      )}>
        {/* Top bar */}
        <header className={cn(
          "fixed top-0 right-0 z-40 bg-background/80 backdrop-blur-sm border-b border-border transition-all duration-300 ease-in-out",
          !isMobile && sidebarOpen ? "left-64" : "left-0"
        )}>
          <div className="flex items-center justify-between h-16 px-4 sm:px-6 lg:px-8">
            <div className="flex items-center space-x-4">
              {!sidebarOpen && (
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setSidebarOpen(!sidebarOpen)}
                  className="icon-button"
                >
                  <Menu className="icon-modern-md" />
                </Button>
              )}
              
              <div className="hidden sm:block">
                <h1 className="text-xl font-semibold text-foreground">
                  {navigation.find(item => isActive(item.href))?.name || 'Dashboard'}
                </h1>
              </div>
            </div>

            <div className="flex items-center space-x-4">
              {/* Dark mode toggle */}
              <Button 
                variant="ghost" 
                size="icon" 
                onClick={toggleTheme}
                className="icon-button"
              >
                {theme === 'dark' ? (
                  <Sun className="icon-modern-md" />
                ) : (
                  <Moon className="icon-modern-md" />
                )}
              </Button>

              {/* Notifications */}
              <div className="relative" ref={notificationMenuRef}>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="relative icon-button"
                  onClick={() => setNotificationMenuOpen(!notificationMenuOpen)}
                >
                  <Bell className="icon-modern-md" />
                  {visibleUrgentTodosCount > 0 && (
                    <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] bg-red-500 rounded-full text-[8px] font-semibold flex items-center justify-center text-white shadow-sm border-2 border-background">
                      {visibleUrgentTodosCount > 99 ? '+99' : visibleUrgentTodosCount}
                    </span>
                  )}
                </Button>

                {/* Notification dropdown menu */}
                {notificationMenuOpen && (
                  <div className="absolute right-0 mt-2 w-80 bg-card border border-border rounded-lg shadow-lg z-50">
                    <div className="p-4 border-b border-border">
                      <div className="flex items-center justify-between">
                        <h3 className="text-sm font-semibold text-foreground flex items-center">
                          <AlertTriangle className="h-4 w-4 mr-2 text-destructive" />
                          Urgent Todos ({visibleUrgentTodosCount > 99 ? '+99' : visibleUrgentTodosCount})
                        </h3>
                        {visibleUrgentTodosCount > 0 && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={handleClearNotifications}
                            className="text-xs text-muted-foreground hover:text-foreground"
                          >
                            Clear
                          </Button>
                        )}
                      </div>
                    </div>
                    <div className="max-h-64 overflow-y-auto">
                      {visibleUrgentTodosCount === 0 ? (
                        <div className="p-4 text-center text-muted-foreground">
                          <Bell className="h-8 w-8 mx-auto mb-2 opacity-50" />
                          <p className="text-sm">No urgent todos</p>
                        </div>
                      ) : (
                        <div className="p-2">
                          {urgentTodos.filter(todo => !clearedTodos.has(todo.id)).map((todo) => {
                            const isSeen = seenTodos.has(todo.id);
                            return (
                              <div
                                key={todo.id}
                                className="p-3 hover:bg-accent rounded-lg transition-colors cursor-pointer"
                                onClick={() => handleTodoClick(todo)}
                              >
                                <div className="flex items-start space-x-3">
                                  {!isSeen && (
                                    <div className="h-2 w-2 bg-destructive rounded-full mt-2 flex-shrink-0" />
                                  )}
                                  {isSeen && (
                                    <div className="h-2 w-2 mt-2 flex-shrink-0" />
                                  )}
                                  <div className="flex-1 min-w-0">
                                    <p className={`text-sm truncate ${isSeen ? 'text-muted-foreground' : 'font-medium text-foreground'}`}>
                                      {todo.title}
                                    </p>
                                    <div className="flex items-center mt-1 text-xs text-muted-foreground">
                                      <Calendar className="h-3 w-3 mr-1" />
                                      Due: {formatDate(new Date(todo.due_date))}
                                    </div>
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* User menu */}
              <div className="relative" ref={profileMenuRef}>
                <button
                  onClick={() => setProfileMenuOpen(!profileMenuOpen)}
                  className="flex items-center space-x-3 hover:bg-accent rounded-lg p-1 transition-all duration-300 ease-out hover:shadow-md"
                >
                  <div className="hidden sm:block text-right">
                    <p className="text-sm font-medium text-foreground">{user?.username}</p>
                    <p className="text-xs text-muted-foreground">{user?.email}</p>
                  </div>
                  <div className="icon-bg">
                    <User className="icon-modern-sm text-primary" />
                  </div>
                </button>

                {/* Profile dropdown menu */}
                {profileMenuOpen && (
                  <div className="absolute right-0 mt-2 w-48 bg-card border border-border rounded-lg shadow-lg z-50">
                    <div className="py-1">
                      <button
                        onClick={() => {
                          setProfileMenuOpen(false);
                          navigate('/profile');
                        }}
                        className="w-full px-4 py-2 text-left text-sm text-foreground hover:bg-accent flex items-center space-x-2"
                      >
                        <User className="h-4 w-4" />
                        <span>Profile</span>
                      </button>
                      <button
                        onClick={handleLogout}
                        className="w-full px-4 py-2 text-left text-sm text-destructive hover:bg-accent flex items-center space-x-2"
                      >
                        <LogOut className="h-4 w-4" />
                        <span>Sign out</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 pt-16">
          <Outlet />
        </main>
      </div>

      {/* Todo Details Popup */}
      {selectedTodo && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div ref={todoPopupRef} className="bg-card border border-border rounded-lg shadow-lg max-w-md w-full max-h-[80vh] overflow-hidden">
            <div className="p-6 border-b border-border">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-foreground flex items-center">
                  <AlertTriangle className="h-5 w-5 mr-2 text-destructive" />
                  Urgent Todo
                </h3>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={handleCloseTodoPopup}
                >
                  <X className="h-5 w-5" />
                </Button>
              </div>
            </div>
            
            <div className="p-6 space-y-4">
              <div>
                <h4 className="text-sm font-medium text-muted-foreground mb-1">Title</h4>
                <p className="text-foreground font-medium">{selectedTodo.title}</p>
              </div>
              
              {selectedTodo.description && (
                <div>
                  <h4 className="text-sm font-medium text-muted-foreground mb-1">Description</h4>
                  <p className="text-foreground">{selectedTodo.description}</p>
                </div>
              )}
              
              <div>
                <h4 className="text-sm font-medium text-muted-foreground mb-1">Due Date</h4>
                <div className="flex items-center text-foreground">
                  <Calendar className="h-4 w-4 mr-2" />
                  {formatDate(new Date(selectedTodo.due_date))}
                </div>
              </div>
              
              <div>
                <h4 className="text-sm font-medium text-muted-foreground mb-1">Priority</h4>
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                  selectedTodo.priority === 'high' 
                    ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                    : selectedTodo.priority === 'medium'
                    ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
                    : 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                }`}>
                  {selectedTodo.priority.charAt(0).toUpperCase() + selectedTodo.priority.slice(1)}
                </span>
              </div>
              
              {selectedTodo.category && (
                <div>
                  <h4 className="text-sm font-medium text-muted-foreground mb-1">Category</h4>
                  <CategoryBadge category={selectedTodo.category} size="sm" />
                </div>
              )}
            </div>
            
          </div>
        </div>
      )}
    </div>
  );
};

export default Layout;
