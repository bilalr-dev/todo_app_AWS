import React, { createContext, useContext, useReducer, useEffect, useCallback } from 'react';
import { todosAPI } from '../services/api';
import { useAuth } from './AuthContext';
import { useToast } from './ToastContext';

// Initial state
const initialState = {
  todos: [],
  filteredTodos: [],
  stats: {
    total: 0,
    completed: 0,
    pending: 0,
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
};

// Reducer
const todoReducer = (state, action) => {
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
        todos: action.payload.todos,
        filteredTodos: action.payload.todos,
        pagination: action.payload.pagination || state.pagination,
        isLoading: false,
        error: null,
      };
    
    case TODO_ACTIONS.ADD_TODO:
      const newTodos = [action.payload, ...state.todos];
      return {
        ...state,
        todos: newTodos,
        filteredTodos: applyFilters(newTodos, state.filters, state.sortBy, state.sortDirection),
        stats: {
          ...state.stats,
          total: state.stats.total + 1,
          pending: state.stats.pending + 1,
        },
      };
    
    case TODO_ACTIONS.UPDATE_TODO:
      const updatedTodos = state.todos.map(todo =>
        todo.id === action.payload.id ? action.payload : todo
      );
      const newFilteredTodos = applyFilters(updatedTodos, state.filters, state.sortBy, state.sortDirection);
      
      // Recalculate stats based on updated todos
      const newStats = {
        total: updatedTodos.length,
        completed: updatedTodos.filter(todo => todo.completed || todo.state === 'complete').length,
        pending: updatedTodos.filter(todo => todo.state === 'inProgress').length,
        high_priority: updatedTodos.filter(todo => todo.priority === 'high').length,
        overdue: updatedTodos.filter(todo => {
          if (!todo.due_date || todo.completed || todo.state === 'complete') return false;
          const dueDate = new Date(todo.due_date);
          const today = new Date();
          today.setHours(0, 0, 0, 0);
          dueDate.setHours(0, 0, 0, 0);
          return dueDate < today;
        }).length,
      };
      
      return {
        ...state,
        todos: updatedTodos,
        filteredTodos: newFilteredTodos,
        stats: newStats,
      };
    
    case TODO_ACTIONS.DELETE_TODO:
      const remainingTodos = state.todos.filter(todo => todo.id !== action.payload);
      return {
        ...state,
        todos: remainingTodos,
        filteredTodos: applyFilters(remainingTodos, state.filters, state.sortBy, state.sortDirection),
        stats: {
          ...state.stats,
          total: Math.max(0, state.stats.total - 1),
        },
      };
    
    case TODO_ACTIONS.TOGGLE_TODO:
      const toggledTodos = state.todos.map(todo =>
        todo.id === action.payload.id
          ? { 
              ...todo, 
              completed: action.payload.completed,
              state: action.payload.state || (action.payload.completed ? 'complete' : 'inProgress')
            }
          : todo
      );
      
      // Recalculate stats based on updated todos
      const toggleStats = {
        total: toggledTodos.length,
        completed: toggledTodos.filter(todo => todo.completed || todo.state === 'complete').length,
        pending: toggledTodos.filter(todo => todo.state === 'inProgress').length,
        high_priority: toggledTodos.filter(todo => todo.priority === 'high').length,
        overdue: toggledTodos.filter(todo => {
          if (!todo.due_date || todo.completed || todo.state === 'complete') return false;
          const dueDate = new Date(todo.due_date);
          const today = new Date();
          today.setHours(0, 0, 0, 0);
          dueDate.setHours(0, 0, 0, 0);
          return dueDate < today;
        }).length,
      };
      
      return {
        ...state,
        todos: toggledTodos,
        filteredTodos: applyFilters(toggledTodos, state.filters, state.sortBy, state.sortDirection),
        stats: toggleStats,
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
    filtered = filtered.filter(todo => todo.completed === isCompleted);
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
  const [state, dispatch] = useReducer(todoReducer, initialState);
  const { isAuthenticated } = useAuth();
  const { showToast } = useToast();

  // Load todos when authenticated
  useEffect(() => {
    if (isAuthenticated) {
      loadTodos();
      loadStats();
    } else {
      dispatch({ type: TODO_ACTIONS.SET_TODOS, payload: { todos: [] } });
    }
  }, [isAuthenticated]);

  // Load todos function
  const loadTodos = useCallback(async (page = 1, limit = 50) => {
    dispatch({ type: TODO_ACTIONS.SET_LOADING, payload: true });
    
    try {
      const response = await todosAPI.getTodos({
        page,
        limit,
        sortBy: state.sortBy,
        sortDirection: state.sortDirection,
      });
      
      if (response.success) {
        dispatch({
          type: TODO_ACTIONS.SET_TODOS,
          payload: {
            todos: response.data.todos,
            pagination: {
              currentPage: page,
              totalPages: Math.ceil(response.data.pagination.total / limit),
              hasMore: response.data.pagination.hasMore,
            },
          },
        });
      } else {
        dispatch({
          type: TODO_ACTIONS.SET_ERROR,
          payload: response.error?.message || 'Failed to load todos',
        });
        showToast(response.error?.message || 'Failed to load todos', 'error');
      }
    } catch (error) {
      const errorMessage = error.response?.data?.error?.message || 'Failed to load todos';
      dispatch({
        type: TODO_ACTIONS.SET_ERROR,
        payload: errorMessage,
      });
      showToast(errorMessage, 'error');
    }
  }, [state.sortBy, state.sortDirection, dispatch, showToast]);

  // Load stats function
  const loadStats = useCallback(async () => {
    try {
      const response = await todosAPI.getStats();
      
      if (response.success) {
        dispatch({
          type: TODO_ACTIONS.SET_STATS,
          payload: response.data.stats,
        });
      }
    } catch (error) {
      console.error('Failed to load stats:', error);
    }
  }, [dispatch]);

  // Create todo function
  const createTodo = async (todoData, showNotification = true, updateLocalState = true) => {
    try {
      const response = await todosAPI.createTodo(todoData);
      
      if (response.success) {
        if (updateLocalState) {
          dispatch({
            type: TODO_ACTIONS.ADD_TODO,
            payload: response.data.todo,
          });
        }
        
        if (showNotification) {
          showToast('Todo created successfully!', 'success');
        }
        return { success: true };
      } else {
        showToast(response.error?.message || 'Failed to create todo', 'error');
        return { success: false, error: response.error?.message };
      }
    } catch (error) {
      const errorMessage = error.response?.data?.error?.message || 'Failed to create todo';
      showToast(errorMessage, 'error');
      return { success: false, error: errorMessage };
    }
  };

  // Update todo function
  const updateTodo = async (id, todoData, showNotification = true, updateLocalState = true) => {
    try {
      const response = await todosAPI.updateTodo(id, todoData);
      if (response.success) {
        if (updateLocalState) {
          dispatch({
            type: TODO_ACTIONS.UPDATE_TODO,
            payload: response.data.todo,
          });
        }
        
        if (showNotification) {
          showToast('Todo updated successfully!', 'success');
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
  };

  // Delete todo function
  const deleteTodo = async (id) => {
    try {
      const response = await todosAPI.deleteTodo(id);
      
      if (response.success) {
        dispatch({
          type: TODO_ACTIONS.DELETE_TODO,
          payload: id,
        });
        
        showToast('Todo deleted successfully!', 'success');
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
  };

  // Toggle todo completion function (forward-only: can only mark as complete)
  const toggleTodo = async (id) => {
    try {
      const response = await todosAPI.toggleTodo(id);
      
      if (response.success) {
        
        dispatch({
          type: TODO_ACTIONS.TOGGLE_TODO,
          payload: {
            id,
            completed: response.data.todo.completed,
            state: response.data.todo.state,
          },
        });
        
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
  };

  // Bulk operations function (with API call)
  const bulkOperation = async (operation, todoIds, data = {}) => {
    try {
      const response = await todosAPI.bulkOperation(operation, todoIds, data);
      
      if (response.success) {
        if (operation === 'delete') {
          dispatch({
            type: TODO_ACTIONS.BULK_DELETE,
            payload: todoIds,
          });
        } else {
          let updateData = {};
          
          if (operation === 'complete') {
            updateData = { completed: true, state: 'complete' };
          } else if (operation === 'in-progress') {
            // Set state to inProgress for todos moved to in-progress
            updateData = { completed: false, state: 'inProgress' };
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
  };

  // Bulk operations state update only (no API call)
  const updateBulkState = (operation, todoIds, data = {}) => {
    if (operation === 'delete') {
      dispatch({
        type: TODO_ACTIONS.BULK_DELETE,
        payload: todoIds,
      });
    } else {
      let updateData = {};
      
      if (operation === 'complete') {
        updateData = { completed: true, state: 'complete' };
      } else if (operation === 'in-progress') {
        // Set state to inProgress for todos moved to in-progress
        updateData = { completed: false, state: 'inProgress' };
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
  };

  // Search todos function
  const searchTodos = async (query) => {
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
  };

  // Set filters function
  const setFilters = (filters) => {
    dispatch({
      type: TODO_ACTIONS.SET_FILTERS,
      payload: filters,
    });
  };

  // Set sort function
  const setSort = (sortBy, sortDirection) => {
    dispatch({
      type: TODO_ACTIONS.SET_SORT,
      payload: { sortBy, sortDirection },
    });
  };

  // Clear filters function
  const clearFilters = () => {
    dispatch({ type: TODO_ACTIONS.RESET_FILTERS });
  };

  // Clear error function
  const clearError = () => {
    dispatch({ type: TODO_ACTIONS.CLEAR_ERROR });
  };

  // Set todos directly (for advanced search results)
  const setTodos = useCallback((todos) => {
    dispatch({ 
      type: TODO_ACTIONS.SET_TODOS, 
      payload: { todos: Array.isArray(todos) ? todos : [], pagination: state.pagination } 
    });
  }, [state.pagination]);

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
    setFilters,
    setSort,
    clearFilters,
    clearError,
    setTodos,
  };

  return (
    <TodoContext.Provider value={value}>
      {children}
    </TodoContext.Provider>
  );
};
