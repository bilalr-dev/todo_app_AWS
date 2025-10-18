import React, { createContext, useContext, useReducer, useEffect, useCallback, useRef } from 'react';
import { todosAPI } from '../services/api';
import { useAuth } from './AuthProvider';
import { useToast } from './ToastContext';
import { useWebSocket } from './WebSocketContext';
import { useOffline } from './OfflineContext';

// Helper function to calculate stats from todos array
const calculateStats = (todos) => {
  return {
    total: todos.length,
    completed: todos.filter(todo => (todo.status || todo.state) === 'completed').length,
    pending: todos.filter(todo => (todo.status || todo.state) === 'pending' || (todo.status || todo.state) === 'todo').length,
    in_progress: todos.filter(todo => (todo.status || todo.state) === 'in_progress').length,
    high_priority: todos.filter(todo => todo.priority === 'high').length,
    overdue: todos.filter(todo => {
      if (!todo.due_date || (todo.status || todo.state) === 'completed') return false;
      const dueDate = new Date(todo.due_date);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      dueDate.setHours(0, 0, 0, 0);
      return dueDate < today;
    }).length,
  };
};

// Initial state
const initialState = {
  todos: [],
  filteredTodos: [],
  stats: {
    total: 0,
    completed: 0,
    pending: 0,
    in_progress: 0,
    high_priority: 0,
    overdue: 0,
  },
  filters: {
    search: '',
    priority: 'all',
    category: 'all',
    completed: 'all',
    dueDate: 'all',
  },
  sortBy: 'created_at',
  sortDirection: 'desc',
  isLoading: false,
  error: null,
  pagination: {
    currentPage: 1,
    totalPages: 1,
    hasMore: false,
  },
};

// Action types
const TODO_ACTIONS = {
  SET_LOADING: 'SET_LOADING',
  SET_ERROR: 'SET_ERROR',
  CLEAR_ERROR: 'CLEAR_ERROR',
  SET_TODOS: 'SET_TODOS',
  ADD_TODO: 'ADD_TODO',
  UPDATE_TODO: 'UPDATE_TODO',
  DELETE_TODO: 'DELETE_TODO',
  TOGGLE_TODO: 'TOGGLE_TODO',
  BULK_UPDATE: 'BULK_UPDATE',
  BULK_DELETE: 'BULK_DELETE',
  SET_FILTERS: 'SET_FILTERS',
  SET_SORT: 'SET_SORT',
  SET_STATS: 'SET_STATS',
  SET_PAGINATION: 'SET_PAGINATION',
  APPLY_FILTERS: 'APPLY_FILTERS',
  RESET_FILTERS: 'RESET_FILTERS',
  REMOVE_FILE_FROM_TODO: 'REMOVE_FILE_FROM_TODO',
};

// Reducer
const todoReducer = (state, action) => {
  // Safety check
  if (!action || !action.type) {
    console.error('Invalid action:', action);
    return state;
  }
  
  switch (action.type) {
    case TODO_ACTIONS.SET_LOADING:
      return {
        ...state,
        isLoading: action.payload,
      };
    
    case TODO_ACTIONS.SET_ERROR:
      return {
        ...state,
        error: action.payload,
        isLoading: false,
      };
    
    case TODO_ACTIONS.CLEAR_ERROR:
      return {
        ...state,
        error: null,
      };
    
    case TODO_ACTIONS.SET_TODOS:
      return {
        ...state,
        todos: action.payload?.todos || [],
        filteredTodos: action.payload?.todos || [],
        pagination: action.payload?.pagination || state.pagination,
        isLoading: false,
        error: null,
      };
    
    case TODO_ACTIONS.ADD_TODO:
      if (!action.payload) return state;
      const newTodos = [action.payload, ...state.todos];
      
      return {
        ...state,
        todos: newTodos,
        filteredTodos: applyFilters(newTodos, state.filters, state.sortBy, state.sortDirection),
      };
    
    case TODO_ACTIONS.UPDATE_TODO:
      if (!action.payload || !action.payload.id) return state;
      const updatedTodos = state.todos.map(todo => 
        todo.id === action.payload.id ? { ...todo, ...action.payload } : todo
      );
      const newFilteredTodos = applyFilters(updatedTodos, state.filters, state.sortBy, state.sortDirection);
      
      return {
        ...state,
        todos: updatedTodos,
        filteredTodos: newFilteredTodos,
      };
    
    case TODO_ACTIONS.DELETE_TODO:
      if (!action.payload) return state;
      const remainingTodos = state.todos.filter(todo => todo.id !== action.payload);
      
      return {
        ...state,
        todos: remainingTodos,
        filteredTodos: applyFilters(remainingTodos, state.filters, state.sortBy, state.sortDirection),
      };
    
    case TODO_ACTIONS.TOGGLE_TODO:
      const toggledTodos = state.todos.map(todo =>
        todo.id === action.payload.id
          ? { 
              ...todo, 
              completed: action.payload.completed,
              status: action.payload.status || 'pending',
              completed_at: action.payload.completed_at,
              updated_at: action.payload.updated_at
            }
          : todo
      );
      const toggleFilteredTodos = applyFilters(toggledTodos, state.filters, state.sortBy, state.sortDirection);
      
      return {
        ...state,
        todos: toggledTodos,
        filteredTodos: toggleFilteredTodos,
      };
    
    case TODO_ACTIONS.BULK_UPDATE:
      const bulkUpdatedTodos = state.todos.map(todo =>
        action.payload.ids.includes(todo.id)
          ? { ...todo, ...action.payload.data }
          : todo
      );
      return {
        ...state,
        todos: bulkUpdatedTodos,
        filteredTodos: applyFilters(bulkUpdatedTodos, state.filters, state.sortBy, state.sortDirection),
      };
    
    case TODO_ACTIONS.BULK_DELETE:
      const bulkRemainingTodos = state.todos.filter(todo => !action.payload.includes(todo.id));
      return {
        ...state,
        todos: bulkRemainingTodos,
        filteredTodos: applyFilters(bulkRemainingTodos, state.filters, state.sortBy, state.sortDirection),
        stats: {
          ...state.stats,
          total: Math.max(0, state.stats.total - action.payload.length),
        },
      };
    
    case TODO_ACTIONS.SET_FILTERS:
      const newFilters = { ...state.filters, ...action.payload };
      return {
        ...state,
        filters: newFilters,
        filteredTodos: applyFilters(state.todos, newFilters, state.sortBy, state.sortDirection),
      };
    
    case TODO_ACTIONS.SET_SORT:
      return {
        ...state,
        sortBy: action.payload.sortBy,
        sortDirection: action.payload.sortDirection,
        filteredTodos: applyFilters(state.todos, state.filters, action.payload.sortBy, action.payload.sortDirection),
      };
    
    case TODO_ACTIONS.SET_STATS:
      return {
        ...state,
        stats: action.payload,
      };
    
    case TODO_ACTIONS.SET_PAGINATION:
      return {
        ...state,
        pagination: action.payload,
      };
    
    case TODO_ACTIONS.APPLY_FILTERS:
      return {
        ...state,
        filteredTodos: applyFilters(state.todos, state.filters, state.sortBy, state.sortDirection),
      };
    
    case TODO_ACTIONS.RESET_FILTERS:
      return {
        ...state,
        filters: initialState.filters,
        filteredTodos: state.todos,
      };

    case TODO_ACTIONS.REMOVE_FILE_FROM_TODO:
      return {
        ...state,
        todos: state.todos.map(todo => {
          if (todo.id === action.payload.todoId) {
            const filteredAttachments = todo.attachments?.filter(
              attachment => attachment.id !== action.payload.fileId
            ) || [];
            return {
              ...todo,
              attachments: filteredAttachments,
              file_count: Math.max(0, (todo.file_count || 0) - 1)
            };
          }
          return todo;
        }),
        filteredTodos: state.filteredTodos.map(todo => {
          if (todo.id === action.payload.todoId) {
            const filteredAttachments = todo.attachments?.filter(
              attachment => attachment.id !== action.payload.fileId
            ) || [];
            return {
              ...todo,
              attachments: filteredAttachments,
              file_count: Math.max(0, (todo.file_count || 0) - 1)
            };
          }
          return todo;
        })
      };
    
    default:
      return state;
  }
};

// Helper function to apply filters and sorting
const applyFilters = (todos, filters, sortBy, sortDirection) => {
  let filtered = [...todos];

  // Apply search filter
  if (filters.search) {
    const searchTerm = filters.search.toLowerCase();
    filtered = filtered.filter(todo =>
      todo.title.toLowerCase().includes(searchTerm) ||
      todo.description?.toLowerCase().includes(searchTerm) ||
      todo.category?.toLowerCase().includes(searchTerm)
    );
  }

  // Apply priority filter
  if (filters.priority !== 'all') {
    filtered = filtered.filter(todo => todo.priority === filters.priority);
  }

  // Apply category filter
  if (filters.category !== 'all') {
    filtered = filtered.filter(todo => todo.category === filters.category);
  }

  // Apply completion filter
  if (filters.completed !== 'all') {
    const isCompleted = filters.completed === 'completed';
    filtered = filtered.filter(todo => {
      const todoState = todo.status || todo.state;
      return (todoState === 'completed') === isCompleted;
    });
  }

  // Apply due date filter
  if (filters.dueDate !== 'all') {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    
    filtered = filtered.filter(todo => {
      if (!todo.due_date) return filters.dueDate === 'no_date';
      
      const dueDate = new Date(todo.due_date);
      const dueDateOnly = new Date(dueDate.getFullYear(), dueDate.getMonth(), dueDate.getDate());
      
      switch (filters.dueDate) {
        case 'today':
          return dueDateOnly.getTime() === today.getTime();
        case 'tomorrow':
          const tomorrow = new Date(today);
          tomorrow.setDate(tomorrow.getDate() + 1);
          return dueDateOnly.getTime() === tomorrow.getTime();
        case 'this_week':
          const weekEnd = new Date(today);
          weekEnd.setDate(weekEnd.getDate() + 7);
          return dueDateOnly >= today && dueDateOnly <= weekEnd;
        case 'overdue':
          return dueDateOnly < today;
        case 'no_date':
          return !todo.due_date;
        default:
          return true;
      }
    });
  }

  // Apply sorting
  filtered.sort((a, b) => {
    let aValue = a[sortBy];
    let bValue = b[sortBy];

    // Handle date sorting
    if (sortBy === 'due_date' || sortBy === 'created_at' || sortBy === 'updated_at') {
      aValue = aValue ? new Date(aValue) : new Date(0);
      bValue = bValue ? new Date(bValue) : new Date(0);
    }

    // Handle string sorting
    if (typeof aValue === 'string') {
      aValue = aValue.toLowerCase();
      bValue = bValue.toLowerCase();
    }

    if (sortDirection === 'asc') {
      return aValue > bValue ? 1 : -1;
    } else {
      return aValue < bValue ? 1 : -1;
    }
  });

  return filtered;
};

// Create context
const TodoContext = createContext();

export { TodoContext };

// Custom hook to use todo context
export const useTodos = () => {
  const context = useContext(TodoContext);
  if (!context) {
    throw new Error('useTodos must be used within a TodoProvider');
  }
  return context;
};

// Todo provider component
export const TodoProvider = ({ children }) => {
  try {
  const [state, dispatch] = useReducer(todoReducer, initialState);
  const { isAuthenticated } = useAuth();
  const { showToast } = useToast();
    const { lastEvent, emitUserActivity } = useWebSocket();
    const { isOffline, saveToCache, queueAction, getCachedData } = useOffline();
    
    // Use ref to track latest todos for WebSocket event handling
    const todosRef = useRef(state.todos);
    todosRef.current = state.todos;

  // Load todos function
  const loadTodos = useCallback(async (page = 1, limit = 50) => {
    dispatch({ type: TODO_ACTIONS.SET_LOADING, payload: true });
    
    try {
      // If offline, try to load from cache
      if (isOffline) {
        const cachedData = getCachedData('todos');
        if (cachedData) {
          dispatch({ type: TODO_ACTIONS.SET_TODOS, payload: cachedData });
          return;
        }
      }

      const response = await todosAPI.getTodos({ page, limit });
      if (response.success) {
        dispatch({ type: TODO_ACTIONS.SET_TODOS, payload: response.data });
        
        // Cache the data for offline use
        if (isOffline) {
          saveToCache('todos', response.data);
        }
      } else {
        dispatch({ type: TODO_ACTIONS.SET_ERROR, payload: response.error?.message || 'Failed to load todos' });
      }
    } catch (error) {
      dispatch({ type: TODO_ACTIONS.SET_ERROR, payload: error.message });
    } finally {
      dispatch({ type: TODO_ACTIONS.SET_LOADING, payload: false });
    }
  }, [isOffline, getCachedData, saveToCache]);

  // Load stats function
  const loadStats = useCallback(async () => {
    try {
      const response = await todosAPI.getStats();
      if (response.success) {
        dispatch({ type: TODO_ACTIONS.SET_STATS, payload: response.data.stats });
      }
    } catch (error) {
      console.error('Error loading stats:', error);
    }
  }, [todosAPI]);

  // Refresh statistics function - can be called from components
  const refreshStats = useCallback(() => {
    loadStats();
  }, [loadStats]);

  // Load todos when authenticated
  useEffect(() => {
    if (isAuthenticated) {
      loadTodos();
      loadStats();
    } else {
      dispatch({ type: TODO_ACTIONS.SET_TODOS, payload: { todos: [] } });
    }
  }, [isAuthenticated, loadTodos, loadStats]);

  // Handle WebSocket events for real-time updates
  useEffect(() => {
    if (!lastEvent || !isAuthenticated) return;

    const handleWebSocketEvent = async () => {
      const { type, data } = lastEvent;

    switch (type) {
      case 'todo_created':
        // Only add if the todo doesn't already exist (prevent duplicates)
        const existingTodo = todosRef.current.find(todo => todo.id === data.id);
        if (!existingTodo) {
          // Check if this todo is being created with files by looking for a flag
          // If the todo has file_count > 0 or attachments, it might be created with files
          // In that case, we'll let the Dashboard handle the addition after file upload
          const hasFiles = data.file_count > 0 || (data.attachments && data.attachments.length > 0);
          
          // Check if this todo is being created with files by looking for a special flag
          // The Dashboard will set this flag when creating todos with files
          const isCreatedWithFiles = data._createdWithFiles === true;
          
          if (!hasFiles && !isCreatedWithFiles) {
            dispatch({
              type: TODO_ACTIONS.ADD_TODO,
              payload: data
            });
            
            // Refresh statistics for cross-tab sync
            loadStats();
            
            // Don't show success toast here - Dashboard will handle it
          } else if (isCreatedWithFiles) {
            // For todos created with files, DO NOT add them to the list yet
            // The Dashboard will handle adding them after file upload completes
            // This prevents cross-tab sync from showing incomplete todos
          }
          // If hasFiles is true or isCreatedWithFiles is true, we'll let the Dashboard handle the addition after file upload
        }
        break;

      case 'todo_updated':
        // Only update if the todo exists and has actually changed
        const existingUpdatedTodo = todosRef.current.find(todo => todo.id === data.id);
        if (existingUpdatedTodo) {
        dispatch({
            type: TODO_ACTIONS.UPDATE_TODO,
            payload: data
          });
          
          // Refresh statistics for cross-tab sync
          loadStats();
        }
        break;

      case 'todo_deleted':
        // Only delete if the todo exists
        const existingDeletedTodo = todosRef.current.find(todo => todo.id === data.id);
        if (existingDeletedTodo) {
        dispatch({
            type: TODO_ACTIONS.DELETE_TODO,
            payload: data.id
          });
          
          // Refresh statistics for cross-tab sync
          loadStats();
        }
        break;

      case 'todo_moved':
        // Only move if the todo exists
        const existingMovedTodo = todosRef.current.find(todo => todo.id === data.id);
        if (existingMovedTodo) {
      dispatch({
            type: TODO_ACTIONS.UPDATE_TODO,
            payload: { 
              id: data.id, 
              state: data.to_state,
              updated_at: data.moved_at
            }
          });
          
          // Refresh statistics for cross-tab sync
          loadStats();
        }
        break;

      case 'file_uploaded':
        // Update todo with new file attachment
        const existingFileUploadTodo = todosRef.current.find(todo => todo.id === data.todo_id);
        if (existingFileUploadTodo) {
          // Add the new file to existing attachments instead of replacing them
          const currentAttachments = existingFileUploadTodo.attachments || [];
          const updatedAttachments = [...currentAttachments, data.file];
          dispatch({
            type: TODO_ACTIONS.UPDATE_TODO,
            payload: { 
              id: data.todo_id,
              attachments: updatedAttachments,
              file_count: updatedAttachments.length
            }
          });
          
          // Refresh statistics for cross-tab sync
          loadStats();
        } else {
          // Todo doesn't exist yet (was created with files and deferred)
          // We need to fetch the complete todo data and add it to the list
          try {
            const response = await todosAPI.get(`/${data.todo_id}`);
            if (response.data.success) {
        dispatch({
                type: TODO_ACTIONS.ADD_TODO,
                payload: response.data.data
        });
              
              // Refresh statistics for cross-tab sync
              loadStats();
      }
    } catch (error) {
            console.error('TodoContext: Error fetching todo after file upload:', error);
          }
        }
        break;

      case 'file_deleted':
        // Remove file from todo attachments
        const existingFileDeleteTodo = todosRef.current.find(todo => todo.id === data.todo_id);
        if (existingFileDeleteTodo) {
          dispatch({
            type: TODO_ACTIONS.REMOVE_FILE_FROM_TODO,
            payload: { 
              todoId: data.todo_id,
              fileId: data.file_id
            }
          });
          
          // Refresh statistics for cross-tab sync
          loadStats();
        }
        break;

      case 'bulk_action':
        // Refresh todos after bulk operations
        if (data.action === 'delete' || data.action === 'update') {
          loadTodos();
          // Refresh statistics for cross-tab sync
          loadStats();
        }
        break;

      default:
        break;
    }
    };

    handleWebSocketEvent();
  }, [lastEvent, isAuthenticated, loadStats, loadTodos]);

  // Create todo function
  const createTodo = useCallback(async (todoData, showNotification = true, updateLocalState = true) => {
    try {
      // If offline, queue the action
      if (isOffline) {
        const actionId = queueAction({
          type: 'CREATE_TODO',
          data: todoData
        });
        
        if (actionId) {
          // Create optimistic todo for immediate UI feedback
          const optimisticTodo = {
            id: `temp_${Date.now()}`,
            ...todoData,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
            _isOptimistic: true
          };
          
        if (updateLocalState) {
          dispatch({
            type: TODO_ACTIONS.ADD_TODO,
              payload: optimisticTodo,
          });
        }
        
        if (showNotification) {
            showToast('Todo queued for sync when online', 'info');
          }
          
          return { success: true, isQueued: true, actionId };
        } else {
          showToast('Failed to queue todo for offline sync', 'error');
          return { success: false, error: 'Failed to queue action' };
        }
      }

      const response = await todosAPI.createTodo(todoData);
      
      if (response.success) {
        // Don't add locally - let WebSocket event handle it to prevent duplicates
        // The WebSocket event will add the todo to the state
        
        // Don't show success toast here - let WebSocket event handle it
        // if (showNotification) {
        //   showToast('To Do created successfully!', 'success');
        // }
        
        // Emit user activity
        emitUserActivity('todo_created');
        
        // Don't refresh statistics here - wait for file upload completion if files are being uploaded
        // Statistics will be updated by the Dashboard after file upload is complete
        
        return { success: true, data: response.data };
      } else {
        showToast(response.error?.message || 'Failed to create todo', 'error');
        return { success: false, error: response.error?.message };
      }
    } catch (error) {
      
      // If network error, try to queue the action
      if (error.code === 'NETWORK_ERROR' || error.message.includes('Network Error')) {
        const actionId = queueAction({
          type: 'CREATE_TODO',
          data: todoData
        });
        
        if (actionId) {
          showToast('Network error - todo queued for sync', 'warning');
          return { success: true, isQueued: true, actionId };
        }
      }
      
      const errorMessage = error.response?.data?.error?.message || 'Failed to create todo';
      showToast(errorMessage, 'error');
      return { success: false, error: errorMessage };
    }
  }, [dispatch, showToast, emitUserActivity, isOffline, queueAction]);

  // Update todo function
  const updateTodo = useCallback(async (id, todoData, showNotification = true, updateLocalState = true) => {
    try {
      const response = await todosAPI.updateTodo(id, todoData);
      if (response.success) {
        if (updateLocalState) {
          dispatch({
            type: TODO_ACTIONS.UPDATE_TODO,
            payload: response.data.todo,
          });
          // Don't refresh statistics here - wait for file upload completion if files are being uploaded
          // Statistics will be updated by the Dashboard after file upload is complete
        }
        
        if (showNotification) {
          showToast('To Do updated successfully!', 'success');
        }
        return { success: true };
      } else {
        showToast(response.error?.message || 'Failed to update todo', 'error');
        return { success: false, error: response.error?.message };
      }
    } catch (error) {
      const errorMessage = error.response?.data?.error?.message || 'Failed to update todo';
      showToast(errorMessage, 'error');
      return { success: false, error: errorMessage };
    }
  }, [dispatch, showToast, emitUserActivity, isOffline, queueAction]);

  // Delete todo function
  const deleteTodo = useCallback(async (id) => {
    try {
      const response = await todosAPI.deleteTodo(id);
      
      if (response.success) {
        dispatch({
          type: TODO_ACTIONS.DELETE_TODO,
          payload: id,
        });
        
        // Refresh statistics after deleting todo
        loadStats();
        
        showToast('To Do deleted successfully!', 'success');
        return { success: true };
      } else {
        showToast(response.error?.message || 'Failed to delete todo', 'error');
        return { success: false, error: response.error?.message };
      }
    } catch (error) {
      const errorMessage = error.response?.data?.error?.message || 'Failed to delete todo';
      showToast(errorMessage, 'error');
      return { success: false, error: errorMessage };
    }
  }, [dispatch, showToast, emitUserActivity, isOffline, queueAction]);

  // Toggle todo completion function (forward-only: can only mark as complete)
  const toggleTodo = useCallback(async (id) => {
    try {
      const response = await todosAPI.toggleTodo(id);
      
      if (response.success) {
        const payload = {
            id,
            completed: response.data.todo.completed,
          status: response.data.todo.status || response.data.todo.state,
          state: response.data.todo.state,
          completed_at: response.data.todo.completed_at,
          updated_at: response.data.todo.updated_at,
        };
        
        dispatch({
          type: TODO_ACTIONS.TOGGLE_TODO,
          payload,
        });
        
        // Refresh statistics after toggling todo
        loadStats();
        
        showToast('Todo completed!', 'success');
        return { success: true };
      } else {
        showToast(response.error?.message || 'Failed to toggle todo', 'error');
        return { success: false, error: response.error?.message };
      }
    } catch (error) {
      const errorMessage = error.response?.data?.error?.message || 'Failed to toggle todo';
      showToast(errorMessage, 'error');
      return { success: false, error: errorMessage };
    }
  }, [dispatch, showToast, emitUserActivity, isOffline, queueAction]);

  // Bulk operations function (with API call)
  const bulkOperation = useCallback(async (operation, todoIds, data = {}) => {
    try {
      let response;
      
      switch (operation) {
        case 'complete':
          response = await todosAPI.bulkUpdateState(todoIds, 'completed');
          break;
        case 'in-progress':
          response = await todosAPI.bulkUpdateState(todoIds, 'in_progress');
          break;
        case 'delete':
          response = await todosAPI.bulkDelete(todoIds);
          break;
        case 'priority':
          response = await todosAPI.bulkUpdatePriority(todoIds, data.priority);
          break;
        case 'category':
          response = await todosAPI.bulkUpdateCategory(todoIds, data.category);
          break;
        default:
          throw new Error(`Unknown bulk operation: ${operation}`);
      }
      
      if (response.success) {
        if (operation === 'delete') {
          dispatch({
            type: TODO_ACTIONS.BULK_DELETE,
            payload: todoIds,
          });
        } else {
          // Use the actual response data to update the local state
          // This ensures we have the correct state values from the backend
          if (response.completedTodos && response.completedTodos.length > 0) {
            // Update todos that were completed
            response.completedTodos.forEach(todo => {
              dispatch({
                type: TODO_ACTIONS.UPDATE_TODO,
                payload: todo
              });
            });
          }
          
          if (response.inProgressTodos && response.inProgressTodos.length > 0) {
            // Update todos that were moved to in-progress
            response.inProgressTodos.forEach(todo => {
              dispatch({
                type: TODO_ACTIONS.UPDATE_TODO,
                payload: todo
              });
            });
          }
          
          if (response.pendingTodos && response.pendingTodos.length > 0) {
            // Update todos that were moved to pending
            response.pendingTodos.forEach(todo => {
          dispatch({
                type: TODO_ACTIONS.UPDATE_TODO,
                payload: todo
              });
            });
          }
          
          if (response.updatedTodos && response.updatedTodos.length > 0) {
            // Update todos that were updated (priority, category, etc.)
            response.updatedTodos.forEach(todo => {
          dispatch({
                type: TODO_ACTIONS.UPDATE_TODO,
                payload: todo
              });
            });
          }
        }
        
        // Refresh statistics after bulk operation
        loadStats();
        
        showToast(`Bulk ${operation} completed successfully!`, 'success');
        return { success: true };
      } else {
        showToast(response.error?.message || `Failed to ${operation} todos`, 'error');
        return { success: false, error: response.error?.message };
      }
    } catch (error) {
      const errorMessage = error.response?.data?.error?.message || `Failed to ${operation} todos`;
      showToast(errorMessage, 'error');
      return { success: false, error: errorMessage };
    }
  }, [dispatch, showToast, emitUserActivity, isOffline, queueAction, loadStats]);

  // Bulk operations state update only (no API call)
  const updateBulkState = useCallback((operation, todoIds, data = {}) => {
    if (operation === 'delete') {
      dispatch({
        type: TODO_ACTIONS.BULK_DELETE,
        payload: todoIds,
      });
    } else {
      let updateData = {};
      
      if (operation === 'complete') {
        updateData = { status: 'completed' };
      } else if (operation === 'in-progress') {
        // Set status to in_progress for todos moved to in-progress
        updateData = { status: 'in_progress' };
      } else if (operation === 'priority') {
        updateData = { priority: data.priority };
      } else if (operation === 'category') {
        updateData = { category: data.category };
      } else if (operation === 'update') {
        updateData = data;
      }
      
      dispatch({
        type: TODO_ACTIONS.BULK_UPDATE,
        payload: {
          ids: todoIds,
          data: updateData,
        },
      });
    }
  }, [dispatch]);

  // Search todos function
  const searchTodos = useCallback(async (query) => {
    try {
      const response = await todosAPI.searchTodos(query);
      
      if (response.success) {
        dispatch({
          type: TODO_ACTIONS.SET_TODOS,
          payload: {
            todos: response.data.todos,
            pagination: response.data.pagination,
          },
        });
        return { success: true };
      } else {
        showToast(response.error?.message || 'Search failed', 'error');
        return { success: false, error: response.error?.message };
      }
    } catch (error) {
      const errorMessage = error.response?.data?.error?.message || 'Search failed';
      showToast(errorMessage, 'error');
      return { success: false, error: errorMessage };
    }
  }, [dispatch, showToast]);

  // Set filters function
  const setFilters = useCallback((filters) => {
    dispatch({
      type: TODO_ACTIONS.SET_FILTERS,
      payload: filters,
    });
  }, [dispatch]);

  // Set sort function
  const setSort = useCallback((sortBy, sortDirection) => {
    dispatch({
      type: TODO_ACTIONS.SET_SORT,
      payload: { sortBy, sortDirection },
    });
  }, [dispatch]);

  // Clear filters function
  const clearFilters = useCallback(() => {
    dispatch({ type: TODO_ACTIONS.RESET_FILTERS });
  }, [dispatch]);

  // Clear error function
  const clearError = useCallback(() => {
    dispatch({ type: TODO_ACTIONS.CLEAR_ERROR });
  }, [dispatch]);

  // Set todos directly (for advanced search results)
  const setTodos = useCallback((todos) => {
    dispatch({ 
      type: TODO_ACTIONS.SET_TODOS, 
      payload: { todos: Array.isArray(todos) ? todos : [], pagination: state.pagination } 
    });
  }, [state.pagination]);

  // Advanced search function
  const advancedSearch = useCallback(async (filters) => {
    dispatch({ type: TODO_ACTIONS.SET_LOADING, payload: true });
    
    try {
      const response = await todosAPI.advancedSearch(filters);
      if (response.success) {
        dispatch({ type: TODO_ACTIONS.SET_TODOS, payload: { todos: response.todos, pagination: response.pagination } });
      } else {
        dispatch({ type: TODO_ACTIONS.SET_ERROR, payload: response.error?.message || 'Advanced search failed' });
      }
    } catch (error) {
      dispatch({ type: TODO_ACTIONS.SET_ERROR, payload: error.message });
    } finally {
      dispatch({ type: TODO_ACTIONS.SET_LOADING, payload: false });
    }
  }, []);

  // Context value
  const value = {
    ...state,
    loadTodos,
    loadStats,
    createTodo,
    updateTodo,
    deleteTodo,
    toggleTodo,
    bulkOperation,
    updateBulkState,
    searchTodos,
    advancedSearch,
    setFilters,
    setSort,
    clearFilters,
    clearError,
    setTodos,
    refreshStats,
  };

  return (
    <TodoContext.Provider value={value}>
      {children}
    </TodoContext.Provider>
  );
  } catch (error) {
    console.error('TodoProvider: Error during initialization:', error);
    throw error;
  }
};
