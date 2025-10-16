// TodoProvider - UI state management for todos v0.6 - Optimized Architecture
import React, { createContext, useContext, useReducer, useCallback, useEffect } from 'react';
import { todosAPI } from '../services/api';
import { useAuth } from './AuthProvider';
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
    status: 'all', // Updated to use status instead of completed
    dueDate: 'all',
  },
  sortBy: 'created_at',
  sortDirection: 'desc',
  isLoading: false,
  error: null,
  pagination: {
    currentPage: 1,
    totalPages: 1,
    totalItems: 0,
    itemsPerPage: 10,
  },
  selectedTodos: [],
  viewMode: 'list', // 'list' or 'kanban'
};

// Action types
const TODO_ACTIONS = {
  SET_LOADING: 'SET_LOADING',
  SET_ERROR: 'SET_ERROR',
  SET_TODOS: 'SET_TODOS',
  SET_FILTERED_TODOS: 'SET_FILTERED_TODOS',
  SET_STATS: 'SET_STATS',
  SET_FILTERS: 'SET_FILTERS',
  SET_SORT: 'SET_SORT',
  SET_PAGINATION: 'SET_PAGINATION',
  SET_SELECTED_TODOS: 'SET_SELECTED_TODOS',
  SET_VIEW_MODE: 'SET_VIEW_MODE',
  ADD_TODO: 'ADD_TODO',
  UPDATE_TODO: 'UPDATE_TODO',
  DELETE_TODO: 'DELETE_TODO',
  TOGGLE_TODO: 'TOGGLE_TODO',
  BULK_UPDATE: 'BULK_UPDATE',
  BULK_DELETE: 'BULK_DELETE',
  CLEAR_SELECTED: 'CLEAR_SELECTED',
};

// Reducer
const todoReducer = (state, action) => {
  switch (action.type) {
    case TODO_ACTIONS.SET_LOADING:
      return { ...state, isLoading: action.payload };

    case TODO_ACTIONS.SET_ERROR:
      return { ...state, error: action.payload, isLoading: false };

    case TODO_ACTIONS.SET_TODOS:
      return { ...state, todos: action.payload, isLoading: false };

    case TODO_ACTIONS.SET_FILTERED_TODOS:
      return { ...state, filteredTodos: action.payload };

    case TODO_ACTIONS.SET_STATS:
      return { ...state, stats: action.payload };

    case TODO_ACTIONS.SET_FILTERS:
      return { ...state, filters: { ...state.filters, ...action.payload } };

    case TODO_ACTIONS.SET_SORT:
      return { ...state, sortBy: action.payload.sortBy, sortDirection: action.payload.sortDirection };

    case TODO_ACTIONS.SET_PAGINATION:
      return { ...state, pagination: { ...state.pagination, ...action.payload } };

    case TODO_ACTIONS.SET_SELECTED_TODOS:
      return { ...state, selectedTodos: action.payload };

    case TODO_ACTIONS.SET_VIEW_MODE:
      return { ...state, viewMode: action.payload };

    case TODO_ACTIONS.ADD_TODO:
      return { ...state, todos: [action.payload, ...state.todos] };

    case TODO_ACTIONS.UPDATE_TODO:
      return {
        ...state,
        todos: state.todos.map(todo =>
          todo.id === action.payload.id ? action.payload : todo
        ),
        filteredTodos: state.filteredTodos.map(todo =>
          todo.id === action.payload.id ? action.payload : todo
        ),
      };

    case TODO_ACTIONS.DELETE_TODO:
      return {
        ...state,
        todos: state.todos.filter(todo => todo.id !== action.payload),
        filteredTodos: state.filteredTodos.filter(todo => todo.id !== action.payload),
        selectedTodos: state.selectedTodos.filter(id => id !== action.payload),
      };

    case TODO_ACTIONS.TOGGLE_TODO:
      const toggledTodo = action.payload;
      return {
        ...state,
        todos: state.todos.map(todo =>
          todo.id === toggledTodo.id ? toggledTodo : todo
        ),
        filteredTodos: state.filteredTodos.map(todo =>
          todo.id === toggledTodo.id ? toggledTodo : todo
        ),
      };

    case TODO_ACTIONS.BULK_UPDATE:
      const updatedTodos = action.payload;
      const updatedIds = updatedTodos.map(todo => todo.id);
      return {
        ...state,
        todos: state.todos.map(todo =>
          updatedIds.includes(todo.id) ? updatedTodos.find(t => t.id === todo.id) : todo
        ),
        filteredTodos: state.filteredTodos.map(todo =>
          updatedIds.includes(todo.id) ? updatedTodos.find(t => t.id === todo.id) : todo
        ),
        selectedTodos: [],
      };

    case TODO_ACTIONS.BULK_DELETE:
      const deletedIds = action.payload;
      return {
        ...state,
        todos: state.todos.filter(todo => !deletedIds.includes(todo.id)),
        filteredTodos: state.filteredTodos.filter(todo => !deletedIds.includes(todo.id)),
        selectedTodos: state.selectedTodos.filter(id => !deletedIds.includes(id)),
      };

    case TODO_ACTIONS.CLEAR_SELECTED:
      return { ...state, selectedTodos: [] };

    default:
      return state;
  }
};

// Context
const TodoContext = createContext();

// Provider component
export const TodoProvider = ({ children }) => {
  const [state, dispatch] = useReducer(todoReducer, initialState);
  const { user } = useAuth();
  const { showToast } = useToast();

  // Service calls - these will be moved to a separate service layer
  const loadTodos = useCallback(async () => {
    if (!user) return;
    
    dispatch({ type: TODO_ACTIONS.SET_LOADING, payload: true });
    try {
      const response = await todosAPI.getTodos();
      dispatch({ type: TODO_ACTIONS.SET_TODOS, payload: response.data.todos });
      dispatch({ type: TODO_ACTIONS.SET_FILTERED_TODOS, payload: response.data.todos });
    } catch (error) {
      dispatch({ type: TODO_ACTIONS.SET_ERROR, payload: error.message });
      showToast('Failed to load todos', 'error');
    }
  }, [user, showToast]);

  const loadStats = useCallback(async () => {
    if (!user) return;
    
    try {
      const response = await todosAPI.getStats();
      dispatch({ type: TODO_ACTIONS.SET_STATS, payload: response.data.stats });
    } catch (error) {
      // Stats loading failure is not critical, continue without stats
    }
  }, [user]);

  const createTodo = useCallback(async (todoData, showNotification = true, updateLocalState = true) => {
    try {
      const response = await todosAPI.createTodo(todoData);
      
      if (updateLocalState) {
        dispatch({ type: TODO_ACTIONS.ADD_TODO, payload: response.data.todo });
        // Reload stats to ensure badges are updated
        await loadStats();
      }
      
      if (showNotification) {
        showToast('To Do created successfully!', 'success');
      }
      
      return { success: true, todo: response.data.todo };
    } catch (error) {
      if (showNotification) {
        showToast('Failed to create todo', 'error');
      }
      return { success: false, error: error.message };
    }
  }, [showToast, loadStats]);

  const updateTodo = useCallback(async (todoId, updateData, showNotification = true, updateLocalState = true) => {
    try {
      const response = await todosAPI.updateTodo(todoId, updateData);
      
      if (updateLocalState) {
        dispatch({ type: TODO_ACTIONS.UPDATE_TODO, payload: response.data.todo });
        // Reload stats to ensure badges are updated
        await loadStats();
      }
      
      if (showNotification) {
        showToast('To Do updated successfully!', 'success');
      }
      
      return { success: true, todo: response.data.todo };
    } catch (error) {
      if (showNotification) {
        showToast('Failed to update todo', 'error');
      }
      return { success: false, error: error.message };
    }
  }, [showToast, loadStats]);

  const deleteTodo = useCallback(async (todoId, showNotification = true) => {
    try {
      await todosAPI.deleteTodo(todoId);
      dispatch({ type: TODO_ACTIONS.DELETE_TODO, payload: todoId });
      // Reload stats to ensure badges are updated
      await loadStats();
      if (showNotification) {
        showToast('To Do deleted successfully!', 'success');
      }
      return { success: true };
    } catch (error) {
      if (showNotification) {
        showToast('Failed to delete todo', 'error');
      }
      return { success: false, error: error.message };
    }
  }, [showToast, loadStats]);

  const toggleTodo = useCallback(async (todoId) => {
    try {
      const response = await todosAPI.toggleTodo(todoId);
      dispatch({ type: TODO_ACTIONS.TOGGLE_TODO, payload: response.data.todo });
      // Reload stats to ensure badges are updated
      await loadStats();
      showToast('To Do updated successfully!', 'success');
      return { success: true, todo: response.data.todo };
    } catch (error) {
      showToast(error.message || 'Failed to update todo', 'error');
      return { success: false, error: error.message };
    }
  }, [showToast, loadStats]);

  const bulkUpdate = useCallback(async (todoIds, updateData) => {
    try {
      let response;
      
      // Use specific API methods based on the update type
      if (updateData.status) {
        response = await todosAPI.bulkUpdateState(todoIds, updateData.status);
      } else if (updateData.priority) {
        response = await todosAPI.bulkUpdatePriority(todoIds, updateData.priority);
      } else if (updateData.category) {
        response = await todosAPI.bulkUpdateCategory(todoIds, updateData.category);
      } else {
        response = await todosAPI.bulkUpdate(todoIds, updateData);
      }
      
      const updatedTodos = response.updatedTodos || response.completedTodos || response.pendingTodos || response.inProgressTodos || response.todos;
      
      if (!updatedTodos || updatedTodos.length === 0) {
        showToast('No todos were updated', 'warning');
        return { success: false, error: 'No todos were updated' };
      }
      
      dispatch({ type: TODO_ACTIONS.BULK_UPDATE, payload: updatedTodos });
      // Reload stats to ensure badges are updated
      await loadStats();
      showToast(`${updatedTodos?.length || todoIds.length} todos updated successfully!`, 'success');
      return { success: true, updatedTodos };
    } catch (error) {
      showToast('Failed to update todos', 'error');
      return { success: false, error: error.message };
    }
  }, [showToast, loadStats]);

  const bulkDelete = useCallback(async (todoIds) => {
    try {
      const response = await todosAPI.bulkDelete(todoIds);
      dispatch({ type: TODO_ACTIONS.BULK_DELETE, payload: todoIds });
      showToast(`${response.deletedCount || todoIds.length} todos deleted successfully!`, 'success');
      return { success: true };
    } catch (error) {
      showToast('Failed to delete todos', 'error');
      return { success: false, error: error.message };
    }
  }, [showToast]);

  // UI state management functions
  const setFilters = useCallback((filters) => {
    dispatch({ type: TODO_ACTIONS.SET_FILTERS, payload: filters });
  }, []);

  const clearFilters = useCallback(() => {
    dispatch({ 
      type: TODO_ACTIONS.SET_FILTERS, 
      payload: {
        search: '',
        priority: 'all',
        category: 'all',
        status: 'all',
        dueDate: 'all'
      }
    });
  }, []);

  const setSort = useCallback((sortBy, sortDirection) => {
    dispatch({ type: TODO_ACTIONS.SET_SORT, payload: { sortBy, sortDirection } });
  }, []);

  const setPagination = useCallback((pagination) => {
    dispatch({ type: TODO_ACTIONS.SET_PAGINATION, payload: pagination });
  }, []);

  const setSelectedTodos = useCallback((selectedTodos) => {
    dispatch({ type: TODO_ACTIONS.SET_SELECTED_TODOS, payload: selectedTodos });
  }, []);

  const setViewMode = useCallback((viewMode) => {
    dispatch({ type: TODO_ACTIONS.SET_VIEW_MODE, payload: viewMode });
  }, []);

  const clearSelected = useCallback(() => {
    dispatch({ type: TODO_ACTIONS.CLEAR_SELECTED });
  }, []);

  // Search functionality
  const searchTodos = useCallback(async (query, options = {}) => {
    try {
      dispatch({ type: TODO_ACTIONS.SET_LOADING, payload: true });
      const response = await todosAPI.searchTodos(query, options);
      dispatch({ type: TODO_ACTIONS.SET_TODOS, payload: response.data.todos });
      return { success: true, todos: response.data.todos };
    } catch (error) {
      dispatch({ type: TODO_ACTIONS.SET_ERROR, payload: error.message });
      showToast('Search failed', 'error');
      return { success: false, error: error.message };
    }
  }, [showToast]);

  // Advanced search functionality
  const advancedSearch = useCallback(async (filters) => {
    try {
      dispatch({ type: TODO_ACTIONS.SET_LOADING, payload: true });
      
      // Build query parameters
      const params = new URLSearchParams();
      
      if (filters.search) params.append('search', filters.search);
      if (filters.priorities?.length > 0) params.append('priorities', filters.priorities.join(','));
      if (filters.categories?.length > 0) params.append('categories', filters.categories.join(','));
      if (filters.status && filters.status !== 'all') params.append('status', filters.status);
      if (filters.startDate) params.append('startDate', filters.startDate);
      if (filters.endDate) params.append('endDate', filters.endDate);
      if (filters.dueStartDate) params.append('dueStartDate', filters.dueStartDate);
      if (filters.dueEndDate) params.append('dueEndDate', filters.dueEndDate);
      if (filters.hasFiles && filters.hasFiles !== 'all') params.append('hasFiles', filters.hasFiles);
      if (filters.sortBy) params.append('sortBy', filters.sortBy);
      if (filters.sortDirection) params.append('sortDirection', filters.sortDirection);
      
      // Make API request to advanced search endpoint
      const data = await todosAPI.advancedSearch(Object.fromEntries(params));
      dispatch({ type: TODO_ACTIONS.SET_TODOS, payload: data.todos || [] });
      return { success: true, todos: data.todos || [] };
    } catch (error) {
      dispatch({ type: TODO_ACTIONS.SET_ERROR, payload: error.message });
      showToast('Advanced search failed', 'error');
      return { success: false, error: error.message };
    }
  }, [showToast]);

  // Get search suggestions
  const getSearchSuggestions = useCallback(async (query, type = 'all') => {
    try {
      const token = localStorage.getItem('token');
      const apiUrl = process.env.REACT_APP_API_URL || 'http://localhost:5002/api';
      const response = await fetch(`${apiUrl}/advanced/suggestions?q=${encodeURIComponent(query)}&type=${type}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        return { success: true, suggestions: data.suggestions || [] };
      } else {
        throw new Error('Failed to get suggestions');
      }
    } catch (error) {
      return { success: false, error: error.message, suggestions: [] };
    }
  }, []);

  // Apply filters to todos (client-side filtering for basic filters)
  const applyFilters = useCallback((todos, filters) => {
    let filtered = [...todos];

    // Search filter
    if (filters.search) {
      const searchTerm = filters.search.toLowerCase();
      filtered = filtered.filter(todo => 
        todo.title.toLowerCase().includes(searchTerm) ||
        (todo.description && todo.description.toLowerCase().includes(searchTerm)) ||
        (todo.category && todo.category.toLowerCase().includes(searchTerm))
      );
    }

    // Priority filter
    if (filters.priority && filters.priority !== 'all') {
      filtered = filtered.filter(todo => todo.priority === filters.priority);
    }

    // Category filter
    if (filters.category && filters.category !== 'all') {
      filtered = filtered.filter(todo => todo.category === filters.category);
    }

    // Status filter
    if (filters.status && filters.status !== 'all') {
      filtered = filtered.filter(todo => todo.status === filters.status);
    }

    // Due date filter
    if (filters.dueDate && filters.dueDate !== 'all') {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      filtered = filtered.filter(todo => {
        if (!todo.due_date) return false;
        const dueDate = new Date(todo.due_date);
        dueDate.setHours(0, 0, 0, 0);
        
        switch (filters.dueDate) {
          case 'today':
            return dueDate.getTime() === today.getTime();
          case 'tomorrow':
            const tomorrow = new Date(today);
            tomorrow.setDate(tomorrow.getDate() + 1);
            return dueDate.getTime() === tomorrow.getTime();
          case 'overdue':
            return dueDate.getTime() < today.getTime() && todo.status !== 'completed';
          case 'this_week':
            const weekEnd = new Date(today);
            weekEnd.setDate(weekEnd.getDate() + 7);
            return dueDate.getTime() >= today.getTime() && dueDate.getTime() <= weekEnd.getTime();
          default:
            return true;
        }
      });
    }

    return filtered;
  }, []);

  // Update filtered todos when filters or todos change
  useEffect(() => {
    const filtered = applyFilters(state.todos, state.filters);
    dispatch({ type: TODO_ACTIONS.SET_FILTERED_TODOS, payload: filtered });
  }, [state.todos, state.filters, applyFilters]);

  // Load todos and stats when user is authenticated
  useEffect(() => {
    if (user) {
      loadTodos();
      loadStats();
    }
  }, [user, loadTodos, loadStats]);

  const value = {
    // State
    ...state,
    
    // Service calls
    loadTodos,
    loadStats,
    createTodo,
    updateTodo,
    deleteTodo,
    toggleTodo,
    bulkUpdate,
    bulkDelete,
    
    // Search functionality
    searchTodos,
    advancedSearch,
    getSearchSuggestions,
    applyFilters,
    
    // UI state management
    setFilters,
    clearFilters,
    setSort,
    setPagination,
    setSelectedTodos,
    setViewMode,
    clearSelected,
  };

  return (
    <TodoContext.Provider value={value}>
      {children}
    </TodoContext.Provider>
  );
};

// Hook
export const useTodos = () => {
  const context = useContext(TodoContext);
  if (!context) {
    throw new Error('useTodos must be used within a TodoProvider');
  }
  return context;
};

export default TodoProvider;
