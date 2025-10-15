import React, { useState, useCallback, useRef } from 'react';
import { useTodos } from '../context/TodoContext';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/common/Card';
import { Button } from '../components/common/Button';
import { Input } from '../components/common/Input';
import { Badge, PriorityBadge } from '../components/common/Badge';
import { LoadingSkeleton } from '../components/common/Loading';
import DatePicker from '../components/common/DatePicker';
import ConfirmDialog from '../components/common/ConfirmDialog';
import CustomSelect from '../components/common/CustomSelect';
import FileUpload from '../components/common/FileUpload';
import FileAttachment from '../components/common/FileAttachment';
import AdvancedSearch from '../components/common/AdvancedSearch';
import KanbanBoard from '../components/common/KanbanBoard';
import { 
  Plus, 
  Search, 
  Filter, 
  Calendar, 
  Clock, 
  CheckCircle2, 
  Circle,
  Edit,
  Trash2,
  AlertTriangle,
  ClipboardList,
  CheckSquare,
  Square,
  File,
  Flag,
  Tag,
  X,
  Download,
  List,
  Grid
} from 'lucide-react';
import { cn, formatDate, formatRelativeTime, isToday, isTomorrow, isOverdue, getTodayInUserTimezone } from '../utils/helpers';
import { TODO_CONFIG } from '../utils/constants';

const Dashboard = () => {
  const {
    filteredTodos,
    stats,
    filters,
    isLoading,
    createTodo,
    updateTodo,
    deleteTodo,
    toggleTodo,
    setFilters,
    clearFilters,
    loadTodos,
    setTodos,
    updateBulkState,
  } = useTodos();
  
  const { user } = useAuth();
  const { showToast } = useToast();
  
  const [showFilters, setShowFilters] = useState(false);
  const [showNewTodo, setShowNewTodo] = useState(false);
  const [selectedTodos, setSelectedTodos] = useState([]);
  const [showPriorityModal, setShowPriorityModal] = useState(false);
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [showAdvancedSearch, setShowAdvancedSearch] = useState(false);
  const [advancedFilters, setAdvancedFilters] = useState({});
  const [isAdvancedSearching, setIsAdvancedSearching] = useState(false);
  const [viewMode, setViewMode] = useState('list'); // 'list' or 'kanban'
  const [newTodo, setNewTodo] = useState({
    title: '',
    description: '',
    priority: 'low', // Default priority changed to low
    category: '',
    due_date: getTodayInUserTimezone(), // Default to today's date (mandatory)
    state: 'todo', // Default state for new todos
  });
  const [editingTodo, setEditingTodo] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState({ isOpen: false, todo: null });
  const [viewingTodo, setViewingTodo] = useState(null);
  
  // File upload refs and state
  const fileUploadRef = useRef(null);
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [isUploading, setIsUploading] = useState(false);
  const [deletingFiles, setDeletingFiles] = useState(new Set());


  // Handle filter search changes (dashboard search)
  const handleFilterChange = (key, value) => {
    setFilters({ ...filters, [key]: value });
  };


  // Helper function to get state badge info
  const getStateBadgeInfo = (state) => {
    switch (state) {
      case 'todo':
        return { label: 'Todo', variant: 'secondary', className: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300' };
      case 'inProgress':
        return { label: 'In Progress', variant: 'warning', className: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300' };
      case 'complete':
        return { label: 'Complete', variant: 'success', className: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300' };
      default:
        return { label: 'Todo', variant: 'secondary', className: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300' };
    }
  };

  // Helper function to get action time info
  const getActionTimeInfo = (todo) => {
    const { state, created_at, updated_at, completed, started_at, completed_at } = todo;
    
    // For completed todos, show when they were completed (completed_at or updated_at as fallback)
    if (state === 'complete' || completed) {
      return {
        label: 'Completed at:',
        time: completed_at || updated_at
      };
    }
    
    // For in-progress todos, show when they were moved to in-progress (started_at or updated_at as fallback)
    if (state === 'inProgress') {
      return {
        label: 'Started at:',
        time: started_at || updated_at
      };
    }
    
    // For todo state, show when they were created
    return {
      label: 'Created at:',
      time: created_at
    };
  };

  const handleCreateTodo = async (e) => {
    e.preventDefault();
    
    if (!newTodo.title.trim()) return;
    
    try {
      // Prepare todo data - exclude empty due_date
      const todoData = { ...newTodo };
      if (!todoData.due_date || todoData.due_date === '' || todoData.due_date === undefined) {
        delete todoData.due_date;
      }
      
      
      // Check if there are files to upload
      const hasFiles = selectedFiles.length > 0 && fileUploadRef.current;
      
      // First create the todo (suppress notification and local state update if files will be uploaded)
      const result = await createTodo(todoData, !hasFiles, !hasFiles);
      if (result.success) {
        // If there are selected files, upload them
        if (hasFiles) {
          setIsUploading(true);
          try {
            await fileUploadRef.current.uploadFiles();
            // Show success notification after upload is complete
            showToast('Todo created successfully!', 'success');
          } catch (uploadError) {
            // Check if it's a cancellation (expected) or actual error
            if (uploadError.message === 'Upload cancelled') {
              // Don't reload todos for cancellation - keep existing state
            } else {
              // Don't reload todos to prevent file attachments from disappearing
            }
          } finally {
            setIsUploading(false);
          }
        }
        
        // Clear form and close modal
        setNewTodo({
          title: '',
          description: '',
          priority: 'low', // Default priority changed to low
          category: '',
          due_date: getTodayInUserTimezone(), // Default to today's date (mandatory)
    state: 'todo', // Default state for new todos
        });
        setSelectedFiles([]);
        if (fileUploadRef.current) {
          fileUploadRef.current.clearFiles();
        }
        setShowNewTodo(false);
        
        // Refresh the dashboard to show the new file
        await loadTodos();
      }
    } catch (error) {
      // Error creating todo
    }
  };

  const handleToggleTodo = async (id) => {
    await toggleTodo(id);
  };

  const handleToggleComplete = async (id) => {
    await toggleTodo(id);
  };

  const handleFileClick = (file) => {
    // Handle file click - this could open a preview modal or download the file
  };

  const handleDeleteTodo = (todo) => {
    setDeleteConfirm({ isOpen: true, todo });
  };

  const handleConfirmDelete = async () => {
    if (deleteConfirm.todo) {
      await deleteTodo(deleteConfirm.todo.id);
      setDeleteConfirm({ isOpen: false, todo: null });
    }
  };

  const handleCancelDelete = () => {
    setDeleteConfirm({ isOpen: false, todo: null });
  };

  const handleCancelTodo = () => {
    // Cancel any pending uploads first
    if (fileUploadRef.current) {
      fileUploadRef.current.cancelUploads();
    }
    
    setEditingTodo(null);
    setNewTodo({
      title: '',
      description: '',
      priority: 'low',
      category: '',
      due_date: getTodayInUserTimezone(),
    });
    setSelectedFiles([]);
    setIsUploading(false);
    if (fileUploadRef.current) {
      fileUploadRef.current.clearFiles();
    }
    setShowNewTodo(false);
  };

  const handleEditTodo = (todo) => {
    setEditingTodo(todo);
    setNewTodo({
      title: todo.title,
      description: todo.description || '',
      priority: todo.priority,
      category: todo.category || '',
      due_date: todo.due_date || getTodayInUserTimezone(),
      state: todo.state || 'todo',
    });
    setShowNewTodo(true);
  };

  const handleViewTodo = (todo) => {
    setViewingTodo(todo);
  };

  const handleCloseViewTodo = () => {
    setViewingTodo(null);
  };

  const handleUpdateTodo = async (e) => {
    e.preventDefault();
    
    if (!newTodo.title.trim()) return;
    
    try {
      // Prepare update data - exclude due_date if it's in the past
      const updateData = { ...newTodo };
      
      // Check if due_date is in the past and exclude it from update
      if (updateData.due_date) {
        const dueDate = new Date(updateData.due_date);
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        dueDate.setHours(0, 0, 0, 0);
        
        if (dueDate < today) {
          // Don't update due_date if it's in the past
          delete updateData.due_date;
        }
      }
      
      // Check if there are files to upload
      const hasFiles = selectedFiles.length > 0 && fileUploadRef.current;
      
      // First update the todo (suppress notification and local state update if files will be uploaded)
      const result = await updateTodo(editingTodo.id, updateData, !hasFiles, !hasFiles);
      if (result.success) {
        // If there are selected files, upload them and wait for completion
        if (hasFiles) {
          setIsUploading(true);
          try {
            await fileUploadRef.current.uploadFiles();
            // Show success notification after upload is complete
            showToast('Todo updated successfully!', 'success');
          } catch (uploadError) {
            // Check if it's a cancellation (expected) or actual error
            if (uploadError.message === 'Upload cancelled') {
              // Don't reload todos for cancellation - keep existing attachments
            } else {
              // Don't reload todos to prevent file attachments from disappearing
            }
          } finally {
            setIsUploading(false);
          }
        }
        
        // Only clear form and close modal after all operations are complete
        setEditingTodo(null);
        setNewTodo({
          title: '',
          description: '',
          priority: 'low', // Default priority changed to low
          category: '',
          due_date: getTodayInUserTimezone(), // Default to today's date (mandatory)
    state: 'todo', // Default state for new todos
        });
        setSelectedFiles([]);
        if (fileUploadRef.current) {
          fileUploadRef.current.clearFiles();
        }
        setShowNewTodo(false);
        
        // Refresh the dashboard to show the new file
        await loadTodos();
      }
    } catch (error) {
      // Error updating todo
    }
  };

  const getDueDateInfo = (dueDate) => {
    if (!dueDate) return { text: 'No due date', className: 'text-muted-foreground' };
    
    if (isOverdue(dueDate)) {
      return { text: 'Overdue', className: 'text-red-600 font-medium' };
    }
    
    if (isToday(dueDate)) {
      return { text: 'Due today', className: 'text-orange-600 font-medium' };
    }
    
    if (isTomorrow(dueDate)) {
      return { text: 'Due tomorrow', className: 'text-blue-600 font-medium' };
    }
    
    return { text: formatDate(dueDate), className: 'text-muted-foreground' };
  };

  // Handle individual todo selection for bulk operations
  const handleSelectTodo = (todoId) => {
    // Find the todo to check if it's completed
    const todo = filteredTodos.find(t => t.id === todoId);
    
    // Don't allow selection of completed todos
    if (todo && (todo.completed || todo.state === 'complete')) {
      showToast('Cannot select completed todos for bulk operations', 'warning');
      return;
    }
    
    if (selectedTodos.includes(todoId)) {
      setSelectedTodos(selectedTodos.filter(id => id !== todoId));
    } else {
      setSelectedTodos([...selectedTodos, todoId]);
    }
  };

  const handleSelectAll = () => {
    // Filter out completed todos for selection
    const selectableTodos = filteredTodos.filter(todo => !todo.completed && todo.state !== 'complete');
    const selectableTodoIds = selectableTodos.map(todo => todo.id);
    
    if (selectedTodos.length === selectableTodoIds.length) {
      // Deselect all
      setSelectedTodos([]);
    } else {
      // Select all selectable todos
      setSelectedTodos(selectableTodoIds);
    }
  };

  // Handle priority change for bulk operations
  const handlePriorityChange = async (priority) => {
    await handleBulkAction('priority', { priority });
    setShowPriorityModal(false);
  };

  // Handle category change for bulk operations
  const handleCategoryChange = async (category) => {
    await handleBulkAction('category', { category });
    setShowCategoryModal(false);
  };

  // Move todo between columns (for Kanban board)
  const handleMoveTodo = async (todoId, targetColumn) => {
    try {
      const todo = filteredTodos.find(t => t.id === todoId);
      if (!todo) {
        return;
      }

      // Determine current column based on todo state
      let currentColumn = 'todo';
      if (todo.state === 'todo') {
        currentColumn = 'todo';
      } else if (todo.state === 'inProgress') {
        currentColumn = 'in-progress';
      } else if (todo.state === 'complete') {
        currentColumn = 'complete';
      } else {
        // Fallback for existing todos without state field
        currentColumn = todo.completed ? 'complete' : 'todo';
      }

      // Enforce forward-only movement: Todo → In Progress → Complete
      const canMove = (
        (currentColumn === 'todo' && (targetColumn === 'in-progress' || targetColumn === 'complete')) ||
        (currentColumn === 'in-progress' && targetColumn === 'complete')
      );

      if (!canMove) {
        showToast('Cannot move todo backward - forward-only movement is enforced', 'warning');
        return;
      }

      let updateData = {};
      
      if (targetColumn === 'complete') {
        updateData = { completed: true, state: 'complete' };
      } else if (targetColumn === 'in-progress') {
        updateData = { completed: false, state: 'inProgress' };
      } else if (targetColumn === 'todo') {
        updateData = { completed: false, state: 'todo' };
      }

      await updateTodo(todoId, updateData, true); // Keep the default "Todo updated successfully!" notification
      // Removed the duplicate "Todo moved to [column]" notification
    } catch (error) {
      console.error('Error moving todo:', error);
      showToast('Failed to move todo', 'error');
    }
  };

  // Export todos functionality - exports selected todos or all todos if none selected
  const handleExportTodos = () => {
    try {
      let todosToExport;
      let exportType;
      
      if (selectedTodos.length > 0) {
        // Export only selected todos
        todosToExport = filteredTodos.filter(todo => selectedTodos.includes(todo.id));
        exportType = 'selected';
      } else {
        // Export all todos (including completed ones) when none are selected
        todosToExport = filteredTodos;
        exportType = 'all';
      }

      if (todosToExport.length === 0) {
        showToast('No todos to export', 'warning');
        return;
      }

      // Create export data with metadata
      const exportData = {
        exportInfo: {
          exportedAt: new Date().toISOString(),
          exportedBy: user?.username || 'Unknown User',
          totalTodos: todosToExport.length,
          exportType: exportType,
          version: '1.0'
        },
        todos: todosToExport.map(todo => ({
          id: todo.id,
          title: todo.title,
          description: todo.description,
          priority: todo.priority,
          category: todo.category,
          completed: todo.completed,
          due_date: todo.due_date,
          created_at: todo.created_at,
          updated_at: todo.updated_at,
          attachments: todo.attachments || [],
          file_count: todo.file_count || 0
        }))
      };

      // Create and download the file
      const dataStr = JSON.stringify(exportData, null, 2);
      const dataBlob = new Blob([dataStr], { type: 'application/json' });
      const url = URL.createObjectURL(dataBlob);
      
      const link = document.createElement('a');
      link.href = url;
      link.download = `todos_export_${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      showToast(`Successfully exported ${todosToExport.length} selected todo${todosToExport.length !== 1 ? 's' : ''}`, 'success');
    } catch (error) {
      console.error('Export error:', error);
      showToast('Failed to export todos', 'error');
    }
  };

  // Bulk operations handlers
  const handleBulkAction = async (action, data) => {
    try {
      // Filter out completed todos from the selection
      const validTodoIds = selectedTodos.filter(todoId => {
        const todo = filteredTodos.find(t => t.id === todoId);
        return todo && !todo.completed && todo.state !== 'complete';
      });

      if (validTodoIds.length === 0) {
        showToast('No valid todos selected for this action', 'warning');
        return;
      }

      if (validTodoIds.length !== selectedTodos.length) {
        showToast(`Filtered out ${selectedTodos.length - validTodoIds.length} completed todos from selection`, 'info');
        setSelectedTodos(validTodoIds);
      }

      const token = localStorage.getItem('token');
      const apiUrl = process.env.REACT_APP_API_URL || 'http://localhost:5002/api';
      let endpoint = '';
      let method = 'PATCH';
      let requestBody = { todoIds: validTodoIds, ...data };

      switch (action) {
        case 'complete':
          endpoint = `${apiUrl}/bulk/todos/complete`;
          requestBody = { todoIds: validTodoIds };
          break;
        case 'in-progress':
          // Set state to inProgress for todos moved to in-progress
          endpoint = `${apiUrl}/bulk/todos/pending`;
          requestBody = { todoIds: validTodoIds };
          break;
        case 'delete':
          endpoint = `${apiUrl}/bulk/todos`;
          method = 'DELETE';
          requestBody = { todoIds: validTodoIds };
          break;
        case 'priority':
          endpoint = `${apiUrl}/bulk/todos/priority`;
          requestBody = { todoIds: validTodoIds, priority: data.priority };
          break;
        case 'category':
          endpoint = `${apiUrl}/bulk/todos/category`;
          requestBody = { todoIds: validTodoIds, category: data.category };
          break;
        case 'export':
          // Handle export separately
          handleExportSelected();
          return;
        default:
          endpoint = `${apiUrl}/bulk/todos`;
      }

      const response = await fetch(endpoint, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(requestBody)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Bulk action failed');
      }

      const result = await response.json();
      
      // Use the updateBulkState function to properly update both todos and filteredTodos
      updateBulkState(action, validTodoIds, data);
      
      // Clear selection after successful bulk action
      setSelectedTodos([]);
      
      // Show success message
      showToast(result.message || `${action.charAt(0).toUpperCase() + action.slice(1)} action completed successfully for ${validTodoIds.length} todo${validTodoIds.length !== 1 ? 's' : ''}`, 'success');
    } catch (error) {
      console.error('Bulk action error:', error);
      showToast(error.message || `Failed to ${action} todos`, 'error');
    }
  };

  const handleExportSelected = async () => {
    try {
      const token = localStorage.getItem('token');
      const apiUrl = process.env.REACT_APP_API_URL || 'http://localhost:5002';
      const response = await fetch(`${apiUrl}/api/export/todos/json`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        throw new Error('Export failed');
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `selected_todos_export_${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      // Export error
    }
  };

  // File upload handlers
  const handleFilesChange = useCallback((files) => {
    setSelectedFiles(files);
  }, []);

  const handleFileDelete = useCallback(async (fileId) => {
    // Prevent multiple simultaneous deletions of the same file
    if (deletingFiles.has(fileId)) {
      return;
    }

    try {
      // Add file to deleting set
      setDeletingFiles(prev => new Set(prev).add(fileId));
      
      // Make the DELETE request to the backend
      const token = localStorage.getItem('token');
      const apiUrl = process.env.REACT_APP_API_URL || 'http://localhost:5002/api';
      const response = await fetch(`${apiUrl}/files/${fileId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        throw new Error('Delete failed');
      }

      // Update the editing todo by removing the deleted attachment
      if (editingTodo) {
        setEditingTodo(prev => ({
          ...prev,
          attachments: (prev.attachments || []).filter(att => att.id !== fileId),
          file_count: Math.max(0, (prev.file_count || 0) - 1)
        }));
      }
      
      // Refresh the dashboard todo list to show the updated file count
      await loadTodos();
    } catch (error) {
      throw error; // Re-throw to let the FileAttachment component handle the error
    } finally {
      // Remove file from deleting set
      setDeletingFiles(prev => {
        const newSet = new Set(prev);
        newSet.delete(fileId);
        return newSet;
      });
    }
  }, [editingTodo, deletingFiles, loadTodos]);

  // Advanced search handlers
  const handleAdvancedSearch = useCallback(async (filters) => {
    try {
      setIsAdvancedSearching(true);
      setAdvancedFilters(filters);
      
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
      
      // Make API request
      const token = localStorage.getItem('token');
      const apiUrl = process.env.REACT_APP_API_URL || 'http://localhost:5002/api';
      const response = await fetch(`${apiUrl}/advanced/search?${params.toString()}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        // Update todos with advanced search results
        setTodos(data.todos || []);
      } else {
        throw new Error('Advanced search failed');
      }
    } catch (error) {
      showToast('Error performing advanced search', 'error');
    } finally {
      setIsAdvancedSearching(false);
    }
  }, [setTodos, showToast]);

  const handleAdvancedFilterChange = useCallback((filters) => {
    setAdvancedFilters(filters);
    // Trigger search when filters change
    handleAdvancedSearch(filters);
  }, [handleAdvancedSearch]);

  const clearAdvancedSearch = useCallback(() => {
    setAdvancedFilters({});
    setShowAdvancedSearch(false);
    // Reload all todos
    loadTodos();
  }, [loadTodos]);

  return (
    <div className="p-6">
      <div className="container mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">
            Welcome back, {user?.username}!
          </h1>
          <p className="text-muted-foreground">
            Here's what you need to focus on today
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card className="stats-card-glass transition-all duration-300">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Total Todos</p>
                  <p className="text-2xl font-bold text-foreground">{Number(stats.total)}</p>
                </div>
                <div className="icon-bg bg-purple-100 dark:bg-purple-900/30">
                  <ClipboardList className="icon-modern-lg text-purple-600 dark:text-purple-300" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="stats-card-glass transition-all duration-300">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Completed</p>
                  <p className="text-2xl font-bold text-success-600">{Number(stats.completed)}</p>
                </div>
                <div className="icon-bg bg-green-100 dark:bg-green-900/30">
                  <CheckCircle2 className="icon-modern-lg text-green-600 dark:text-green-300" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="stats-card-glass transition-all duration-300">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">In Progress</p>
                  <p className="text-2xl font-bold text-warning-600">{Number(stats.pending)}</p>
                </div>
                <div className="icon-bg bg-yellow-100 dark:bg-yellow-900/30">
                  <Circle className="icon-modern-lg text-yellow-600 dark:text-yellow-300" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="stats-card-glass transition-all duration-300">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">High Priority</p>
                  <p className="text-2xl font-bold text-error-600">{Number(stats.high_priority)}</p>
                </div>
                <div className="icon-bg bg-red-100 dark:bg-red-900/30">
                  <AlertTriangle className="icon-modern-lg text-red-600 dark:text-red-300" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Controls */}
        {/* Basic Search - Hidden when Advanced Search is active */}
        {!showAdvancedSearch && (
          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search todos..."
                  value={filters.search}
                  onChange={(e) => handleFilterChange('search', e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
          
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => setShowAdvancedSearch(!showAdvancedSearch)}
              className={`flex items-center gap-2 px-3 py-1.5 text-sm ${
                Object.keys(advancedFilters).length > 0 
                  ? 'border-blue-500 text-blue-600 dark:text-blue-400' 
                  : ''
              }`}
            >
              <Search className="h-4 w-4" />
              Advanced
              {Object.keys(advancedFilters).length > 0 && (
                <span className="ml-1 px-1.5 py-0.5 text-xs bg-blue-100 text-blue-600 dark:bg-blue-900 dark:text-blue-300 rounded-full">
                  Active
                </span>
              )}
            </Button>
            
            
            <Button
              variant="outline"
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center gap-2 px-3 py-1.5 text-sm"
            >
              <Filter className="h-4 w-4" />
              Filters
            </Button>
            
            <Button
              onClick={() => setShowNewTodo(true)}
              className="flex items-center gap-2 px-3 py-1.5 text-sm"
            >
              <Plus className="h-4 w-4" />
              New Todo
            </Button>
            
            {/* View Mode Toggle - Icon Only */}
            <div className="flex items-center gap-1">
              <button
                onClick={() => setViewMode('list')}
                className={`flex items-center justify-center w-10 h-10 rounded-md text-sm transition-colors ${
                  viewMode === 'list'
                    ? 'bg-blue-500 text-white'
                    : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
                }`}
                title="List View"
              >
                <List className="w-5 h-5" />
              </button>
              
              <button
                onClick={() => setViewMode('kanban')}
                className={`flex items-center justify-center w-10 h-10 rounded-md text-sm transition-colors ${
                  viewMode === 'kanban'
                    ? 'bg-blue-500 text-white'
                    : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
                }`}
                title="Kanban View"
              >
                <Grid className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
        )}

        {/* Filters Panel */}
        {showFilters && (
          <Card className="mb-6">
            <CardContent className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div>
                  <label className="text-sm font-medium mb-2 block">Priority</label>
                  <select
                    value={filters.priority}
                    onChange={(e) => handleFilterChange('priority', e.target.value)}
                    className="w-full p-2 border border-input rounded-md bg-background"
                  >
                    <option value="all">All Priorities</option>
                    {TODO_CONFIG.PRIORITIES.map(priority => (
                      <option key={priority.value} value={priority.value}>
                        {priority.label}
                      </option>
                    ))}
                  </select>
                </div>
                
                <div>
                  <label className="text-sm font-medium mb-2 block">Category</label>
                  <select
                    value={filters.category}
                    onChange={(e) => handleFilterChange('category', e.target.value)}
                    className="w-full p-2 border border-input rounded-md bg-background"
                  >
                    <option value="all">All Categories</option>
                    {TODO_CONFIG.CATEGORIES.map(category => (
                      <option key={category.value} value={category.value}>
                        {category.label}
                      </option>
                    ))}
                  </select>
                </div>
                
                <div>
                  <label className="text-sm font-medium mb-2 block">Status</label>
                  <select
                    value={filters.completed}
                    onChange={(e) => handleFilterChange('completed', e.target.value)}
                    className="w-full p-2 border border-input rounded-md bg-background"
                  >
                    <option value="all">All Status</option>
                    <option value="pending">In Progress</option>
                    <option value="completed">Completed</option>
                  </select>
                </div>
                
                <div>
                  <label className="text-sm font-medium mb-2 block">Due Date</label>
                  <select
                    value={filters.dueDate}
                    onChange={(e) => handleFilterChange('dueDate', e.target.value)}
                    className="w-full p-2 border border-input rounded-md bg-background"
                  >
                    <option value="all">All Dates</option>
                    <option value="today">Today</option>
                    <option value="tomorrow">Tomorrow</option>
                    <option value="this_week">This Week</option>
                    <option value="overdue">Overdue</option>
                    <option value="no_date">No Date</option>
                  </select>
                </div>
              </div>
              
              <div className="flex justify-end mt-4">
                <Button variant="outline" onClick={clearFilters}>
                  Clear Filters
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Bulk Actions - Always visible */}
        <Card className="mb-6 border-0 shadow-lg bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-900">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-3">
                <div className="flex items-center space-x-2">
                  <CheckSquare className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                    <span className="text-lg font-semibold text-gray-700 dark:text-gray-300">
                      {selectedTodos.length > 0 
                        ? `${selectedTodos.length} todo${selectedTodos.length !== 1 ? 's' : ''} selected`
                        : 'Quick Actions'
                      }
                    </span>
                </div>
              </div>
              
              {selectedTodos.length > 0 && (
                <button
                  onClick={() => setSelectedTodos([])}
                  className="p-1 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-colors"
                  title="Clear selection"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
            
            <div className="flex flex-wrap gap-3">
              {/* Select All/Deselect All - Always visible and closer to other actions */}
              <button
                onClick={handleSelectAll}
                disabled={filteredTodos.length === 0}
                className={`flex items-center space-x-2 px-3 py-1.5 rounded-lg border transition-colors text-sm ${
                  filteredTodos.length === 0
                    ? 'border-gray-200 dark:border-gray-700 bg-gray-100 dark:bg-gray-800 text-gray-400 dark:text-gray-600 cursor-not-allowed'
                    : 'border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-900/20 hover:bg-blue-100 dark:hover:bg-blue-900/30 text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300'
                }`}
              >
                <CheckSquare className="w-4 h-4" />
                <span className="font-medium">
                  {(() => {
                    const selectableTodos = filteredTodos.filter(todo => !todo.completed && todo.state !== 'complete');
                    return selectableTodos.length > 0 && selectedTodos.length === selectableTodos.length ? 'Deselect All' : 'Select All';
                  })()}
                </span>
              </button>

              {/* Complete */}
              <button
                onClick={() => handleBulkAction('complete')}
                disabled={selectedTodos.length === 0}
                className={`flex items-center space-x-2 px-3 py-1.5 rounded-lg border transition-colors text-sm ${
                  selectedTodos.length === 0
                    ? 'border-gray-200 dark:border-gray-700 bg-gray-100 dark:bg-gray-800 text-gray-400 dark:text-gray-600 cursor-not-allowed'
                    : 'border-green-200 dark:border-green-800 bg-green-50 dark:bg-green-900/20 hover:bg-green-100 dark:hover:bg-green-900/30 text-green-600 dark:text-green-400 hover:text-green-700 dark:hover:text-green-300'
                }`}
              >
                <CheckCircle2 className="w-4 h-4" />
                <span className="font-medium">Complete</span>
              </button>

              {/* In Progress */}
              <button
                onClick={() => handleBulkAction('in-progress')}
                disabled={selectedTodos.length === 0}
                className={`flex items-center space-x-2 px-3 py-1.5 rounded-lg border transition-colors text-sm ${
                  selectedTodos.length === 0
                    ? 'border-gray-200 dark:border-gray-700 bg-gray-100 dark:bg-gray-800 text-gray-400 dark:text-gray-600 cursor-not-allowed'
                    : 'border-yellow-200 dark:border-yellow-800 bg-yellow-50 dark:bg-yellow-900/20 hover:bg-yellow-100 dark:hover:bg-yellow-900/30 text-yellow-600 dark:text-yellow-400 hover:text-yellow-700 dark:hover:text-yellow-300'
                }`}
              >
                <Clock className="w-4 h-4" />
                <span className="font-medium">In Progress</span>
              </button>

              {/* Priority */}
              <button
                onClick={() => setShowPriorityModal(true)}
                disabled={selectedTodos.length === 0}
                className={`flex items-center space-x-2 px-3 py-1.5 rounded-lg border transition-colors text-sm ${
                  selectedTodos.length === 0
                    ? 'border-gray-200 dark:border-gray-700 bg-gray-100 dark:bg-gray-800 text-gray-400 dark:text-gray-600 cursor-not-allowed'
                    : 'border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-900/20 hover:bg-blue-100 dark:hover:bg-blue-900/30 text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300'
                }`}
              >
                <Flag className="w-4 h-4" />
                <span className="font-medium">Priority</span>
              </button>

              {/* Category */}
              <button
                onClick={() => setShowCategoryModal(true)}
                disabled={selectedTodos.length === 0}
                className={`flex items-center space-x-2 px-3 py-1.5 rounded-lg border transition-colors text-sm ${
                  selectedTodos.length === 0
                    ? 'border-gray-200 dark:border-gray-700 bg-gray-100 dark:bg-gray-800 text-gray-400 dark:text-gray-600 cursor-not-allowed'
                    : 'border-purple-200 dark:border-purple-800 bg-purple-50 dark:bg-purple-900/20 hover:bg-purple-100 dark:hover:bg-purple-900/30 text-purple-600 dark:text-purple-400 hover:text-purple-700 dark:hover:text-purple-300'
                }`}
              >
                <Tag className="w-4 h-4" />
                <span className="font-medium">Category</span>
              </button>

              {/* Delete */}
              <button
                onClick={() => handleBulkAction('delete')}
                disabled={selectedTodos.length === 0}
                className={`flex items-center space-x-2 px-3 py-1.5 rounded-lg border transition-colors text-sm ${
                  selectedTodos.length === 0
                    ? 'border-gray-200 dark:border-gray-700 bg-gray-100 dark:bg-gray-800 text-gray-400 dark:text-gray-600 cursor-not-allowed'
                    : 'border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/20 hover:bg-red-100 dark:hover:bg-red-900/30 text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300'
                }`}
              >
                <Trash2 className="w-4 h-4" />
                <span className="font-medium">Delete</span>
              </button>

              {/* Export */}
              <button
                onClick={handleExportTodos}
                disabled={filteredTodos.length === 0}
                className={`flex items-center space-x-2 px-3 py-1.5 rounded-lg border transition-colors text-sm ${
                  filteredTodos.length === 0
                    ? 'border-gray-200 dark:border-gray-700 bg-gray-100 dark:bg-gray-800 text-gray-400 dark:text-gray-600 cursor-not-allowed'
                    : 'border-indigo-200 dark:border-indigo-800 bg-indigo-50 dark:bg-indigo-900/20 hover:bg-indigo-100 dark:hover:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300'
                }`}
                title={
                  selectedTodos.length > 0 
                    ? `Export ${selectedTodos.length} selected todos` 
                    : `Export all ${filteredTodos.length} todos (including completed)`
                }
              >
                <Download className="w-4 h-4" />
                <span className="font-medium">
                  {selectedTodos.length > 0 
                    ? `Export (${selectedTodos.length})` 
                    : `Export All (${filteredTodos.length})`
                  }
                </span>
              </button>
            </div>
          </CardContent>
        </Card>

        {/* Advanced Search Panel */}
        {showAdvancedSearch && (
          <Card className="mb-6 border-0 shadow-xl bg-gradient-to-br from-white to-gray-50 dark:from-gray-800 dark:to-gray-900">
            <CardContent className="p-0">
              <div className="bg-gradient-to-r from-emerald-500 to-teal-600 p-6 rounded-t-lg">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="p-2 bg-white/20 rounded-lg backdrop-blur-sm">
                      <Search className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-white">Advanced Search</h3>
                      <p className="text-emerald-100 text-sm">Find todos with precision</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    {isAdvancedSearching && (
                      <div className="flex items-center gap-2 px-3 py-1.5 bg-white/20 rounded-lg backdrop-blur-sm">
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                        <span className="text-white text-sm font-medium">Searching...</span>
                      </div>
                    )}
                    {Object.keys(advancedFilters).length > 0 && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={clearAdvancedSearch}
                        className="bg-white/10 border-white/20 text-white hover:bg-white/20 hover:border-white/30 backdrop-blur-sm"
                      >
                        Clear Search
                      </Button>
                    )}
                  </div>
                </div>
              </div>
              <div className="p-6">
                <AdvancedSearch
                  onSearch={handleAdvancedSearch}
                  onFilterChange={handleAdvancedFilterChange}
                  filterOptions={{
                    priorities: ['low', 'medium', 'high'],
                    categories: TODO_CONFIG.CATEGORIES.map(c => c.value),
                    sortOptions: [
                      { value: 'created_at', label: 'Created Date' },
                      { value: 'updated_at', label: 'Updated Date' },
                      { value: 'due_date', label: 'Due Date' },
                      { value: 'title', label: 'Title' },
                      { value: 'priority', label: 'Priority' },
                      { value: 'category', label: 'Category' }
                    ]
                  }}
                />
              </div>
            </CardContent>
          </Card>
        )}


        {/* New Todo Modal */}
        {showNewTodo && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50" onClick={handleCancelTodo}>
            <Card className="w-full max-w-md" onClick={(e) => e.stopPropagation()}>
              <CardHeader>
                <CardTitle>{editingTodo ? 'Edit Todo' : 'New Todo'}</CardTitle>
                <CardDescription>
                  {editingTodo ? 'Update your todo details' : 'Add a new todo to your list'}
                </CardDescription>
              </CardHeader>
              
              <CardContent>
                <div className="max-h-[70vh] overflow-y-auto pr-2 scrollbar-thin">
                  <form onSubmit={editingTodo ? handleUpdateTodo : handleCreateTodo} className="space-y-4">
                    <Input
                      label={
                        <span>
                          Title <span className="text-red-500">*</span>
                        </span>
                      }
                      placeholder="What needs to be done?"
                      value={newTodo.title}
                      onChange={(e) => setNewTodo({ ...newTodo, title: e.target.value })}
                      required
                    />
                    
                    <div>
                      <label className="text-sm font-medium mb-2 block">Description</label>
                      <textarea
                        placeholder="Add details..."
                        value={newTodo.description}
                        onChange={(e) => setNewTodo({ ...newTodo, description: e.target.value })}
                        className="w-full p-2 border border-input rounded-md bg-background min-h-[80px] resize-none"
                      />
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <CustomSelect
                        label={
                          <span>
                            Priority <span className="text-red-500">*</span>
                          </span>
                        }
                        value={newTodo.priority}
                        onChange={(value) => setNewTodo({ ...newTodo, priority: value })}
                        options={TODO_CONFIG.PRIORITIES}
                        placeholder="Select priority"
                      />
                      
                      <CustomSelect
                        label="Category"
                        value={newTodo.category}
                        onChange={(value) => setNewTodo({ ...newTodo, category: value })}
                        options={[
                          { value: '', label: 'Select category' },
                          ...TODO_CONFIG.CATEGORIES
                        ]}
                        placeholder="Select category"
                      />
                    </div>
                    
                    <div>
                      <label className="text-sm font-medium mb-2 block">
                        Due Date <span className="text-red-500">*</span>
                      </label>
                      <DatePicker
                        value={newTodo.due_date}
                        onChange={(date) => setNewTodo({ ...newTodo, due_date: date })}
                        placeholder="Select due date"
                        minDate={getTodayInUserTimezone()}
                      />
                    </div>
                    
                    {/* File Upload Section */}
                    <div>
                      <label className="text-sm font-medium mb-2 block">Attachments</label>
                      <FileUpload
                        ref={fileUploadRef}
                        todoId={editingTodo?.id}
                        onFilesChange={handleFilesChange}
                        onDelete={handleFileDelete}
                        multiple={true}
                        maxFiles={5}
                        className="mb-4"
                        existingAttachments={editingTodo?.attachments || []}
                        deletingFiles={deletingFiles}
                      />
                    </div>
                    
                    <div className="flex justify-end gap-2 pt-4 border-t border-gray-200 dark:border-gray-700">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={handleCancelTodo}
                        disabled={isUploading}
                      >
                        Cancel
                      </Button>
                      <Button type="submit" disabled={isUploading}>
                        {editingTodo ? 'Update' : 'Create'} Todo
                      </Button>
                    </div>
                  </form>
                </div>
              </CardContent>
            </Card>
          </div>
        )}


        {/* Search Indicator */}
        {filters.search && (
          <Card className="mb-4">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Search className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">
                    Search: <span className="font-medium text-foreground">"{filters.search}"</span>
                  </span>
                  <Badge variant="secondary" className="text-xs">
                    {filteredTodos.length} result{filteredTodos.length !== 1 ? 's' : ''}
                  </Badge>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleFilterChange('search', '')}
                  className="text-muted-foreground hover:text-foreground"
                >
                  Clear search
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Todos List */}
        <div className="space-y-4">
          {isLoading ? (
            <div className="space-y-4">
              {Array.from({ length: 3 }).map((_, i) => (
                <LoadingSkeleton key={i} lines={2} className="h-20" />
              ))}
            </div>
          ) : viewMode === 'kanban' ? (
            <div 
              key="kanban-view"
              className="animate-in fade-in-0 slide-in-from-bottom-4 duration-300"
            >
              <KanbanBoard
                key={`kanban-${filteredTodos.length}-${filteredTodos.map(t => `${t.id}-${t.state}`).join(',')}`}
                todos={filteredTodos}
                onEdit={handleEditTodo}
                onDelete={handleDeleteTodo}
                onToggleComplete={handleToggleComplete}
                onFileClick={handleFileClick}
                onMoveTodo={handleMoveTodo}
                onViewTodo={handleViewTodo}
                selectedTodos={selectedTodos}
                onSelectTodo={handleSelectTodo}
              />
            </div>
          ) : filteredTodos.length === 0 ? (
            <Card>
              <CardContent className="p-12 text-center">
                <div className="mx-auto h-12 w-12 bg-muted rounded-lg flex items-center justify-center mb-4">
                  <CheckCircle2 className="h-6 w-6 text-muted-foreground" />
                </div>
                        <h3 className="text-lg font-semibold text-foreground mb-2">
                          {filters.search ? 'No search results found' : 'No todos found'}
                        </h3>
                        <p className="text-muted-foreground mb-4">
                          {filters.search
                            ? `No todos match your search for "${filters.search}". Try a different search term.`
                            : filters.priority !== 'all' || filters.category !== 'all' || filters.completed !== 'all' || filters.dueDate !== 'all'
                              ? 'Try adjusting your filters to see more todos'
                              : 'Get started by creating your first todo'
                          }
                        </p>
                        {!filters.search && filters.priority === 'all' && filters.category === 'all' && filters.completed === 'all' && filters.dueDate === 'all' && (
                          <Button onClick={() => setShowNewTodo(true)}>
                            <Plus className="icon-modern-sm mr-2" />
                            Create Todo
                          </Button>
                        )}
              </CardContent>
            </Card>
          ) : (
            <div 
              key="list-view"
              className="space-y-4 animate-in fade-in-0 slide-in-from-bottom-4 duration-300"
            >
              {filteredTodos.map((todo) => {
                const dueDateInfo = getDueDateInfo(todo.due_date);
                
                return (
                <Card key={todo.id} className={`hover:shadow-lg transition-all duration-200 group cursor-pointer ${
                  selectedTodos.includes(todo.id) ? 'ring-2 ring-blue-500 bg-blue-50 dark:bg-blue-900/10' : ''
                }`} onClick={() => handleViewTodo(todo)}>
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between">
                      <div className="flex items-start space-x-3 flex-1">
                        {/* Bulk selection checkbox */}
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleSelectTodo(todo.id);
                          }}
                          disabled={todo.completed || todo.state === 'complete'}
                          className={cn(
                            "mt-1 p-1 rounded transition-colors",
                            (todo.completed || todo.state === 'complete')
                              ? "cursor-not-allowed opacity-50"
                              : "hover:bg-gray-100 dark:hover:bg-gray-700"
                          )}
                          title={
                            (todo.completed || todo.state === 'complete')
                              ? "Cannot select completed todos"
                              : "Select for bulk actions"
                          }
                        >
                          {selectedTodos.includes(todo.id) ? (
                            <CheckSquare className="w-5 h-5 text-blue-600" />
                          ) : (
                            <Square className={cn(
                              "w-5 h-5",
                              (todo.completed || todo.state === 'complete')
                                ? "text-gray-300"
                                : "text-gray-400"
                            )} />
                          )}
                        </button>
                        
                        {/* Todo completion toggle */}
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            if (!todo.completed) handleToggleTodo(todo.id);
                          }}
                          disabled={todo.completed}
                          className={cn(
                            "mt-1 icon-button transition-all duration-200",
                            todo.completed 
                              ? "cursor-not-allowed opacity-60" 
                              : "hover:scale-110"
                          )}
                          title={todo.completed ? "Cannot unmark completed todo" : "Mark as complete"}
                        >
                          {todo.completed ? (
                            <CheckCircle2 className="icon-modern-md text-success-600" />
                          ) : (
                            <Circle className="icon-modern-md text-muted-foreground hover:text-foreground" />
                          )}
                        </button>
                        
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-2">
                            <h3 className={cn(
                              "text-lg font-medium",
                              todo.completed && "line-through text-muted-foreground"
                            )}>
                              {todo.title}
                            </h3>
                            <PriorityBadge priority={todo.priority} size="sm" />
                            <Badge 
                              variant="outline" 
                              size="sm"
                              className={getStateBadgeInfo(todo.state).className}
                            >
                              {getStateBadgeInfo(todo.state).label}
                            </Badge>
                            {todo.category && (
                              <Badge variant="outline" size="sm">
                                {TODO_CONFIG.CATEGORIES.find(c => c.value === todo.category)?.label || todo.category}
                              </Badge>
                            )}
                          </div>
                          
                          {todo.description && (
                            <p className="text-muted-foreground text-sm mb-3 line-clamp-2">
                              {todo.description}
                            </p>
                          )}
                          
                          <div className="flex items-center gap-4 text-sm text-muted-foreground">
                            {todo.due_date && (
                              <div className="flex items-center gap-1">
                                <Calendar className="h-4 w-4" />
                                <span className={dueDateInfo.className}>
                                  {dueDateInfo.text}
                                </span>
                              </div>
                            )}
                            
                            <div className="flex items-center gap-1">
                              <Clock className="h-4 w-4" />
                              <span>
                                {getActionTimeInfo(todo).label} {formatRelativeTime(getActionTimeInfo(todo).time)}
                              </span>
                            </div>
                            
                            {todo.file_count > 0 && (
                              <div className="flex items-center gap-1">
                                <File className="h-4 w-4" />
                                <span>
                                  {todo.file_count} file{todo.file_count > 1 ? 's' : ''}
                                </span>
                              </div>
                            )}
                          </div>
                          
                          {/* File Attachments Preview */}
                          {todo.attachments && todo.attachments.length > 0 && (
                            <div className="mt-3 space-y-2">
                              <p className="text-xs font-medium text-gray-600 dark:text-gray-400">
                                Attachments:
                              </p>
                              <div className="flex flex-wrap gap-2">
                                {todo.attachments.slice(0, 3).map((attachment) => (
                                  <FileAttachment
                                    key={attachment.id}
                                    attachment={attachment}
                                    onDelete={handleFileDelete}
                                    size="small"
                                    showActions={true}
                                    isDeleting={deletingFiles.has(attachment.id)}
                                  />
                                ))}
                                {todo.attachments.length > 3 && (
                                  <div className="px-2 py-1 bg-gray-100 dark:bg-gray-700 rounded text-xs text-gray-600 dark:text-gray-400">
                                    +{todo.attachments.length - 3} more
                                  </div>
                                )}
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleEditTodo(todo);
                          }}
                        >
                          <Edit className="icon-modern-sm" />
                        </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleDeleteTodo(todo);
                                }}
                                className="text-destructive hover:text-destructive"
                              >
                                <Trash2 className="icon-modern-sm" />
                              </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
            </div>
          )}
        </div>
      </div>

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        isOpen={deleteConfirm.isOpen}
        onClose={handleCancelDelete}
        onConfirm={handleConfirmDelete}
        title="Delete Todo"
        message={`Are you sure you want to delete "${deleteConfirm.todo?.title}"? This action cannot be undone.`}
        confirmText="Delete"
        cancelText="Cancel"
        variant="destructive"
      />

      {/* Priority Selection Modal */}
      {showPriorityModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" onClick={() => setShowPriorityModal(false)}>
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-md w-full mx-4" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-4">
              Set Priority for {selectedTodos.length} todo{selectedTodos.length !== 1 ? 's' : ''}
            </h3>
            <div className="space-y-2">
              {['low', 'medium', 'high'].map(priority => (
                <button
                  key={priority}
                  onClick={() => handlePriorityChange(priority)}
                  className="w-full text-left px-4 py-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors capitalize"
                >
                  {priority} Priority
                </button>
              ))}
            </div>
            <button
              onClick={() => setShowPriorityModal(false)}
              className="mt-4 w-full px-4 py-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Category Selection Modal */}
      {showCategoryModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" onClick={() => setShowCategoryModal(false)}>
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-md w-full mx-4" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-4">
              Set Category for {selectedTodos.length} todo{selectedTodos.length !== 1 ? 's' : ''}
            </h3>
            <div className="space-y-2">
              {['work', 'personal', 'shopping', 'health', 'finance', 'education', 'travel', 'other'].map(category => (
                <button
                  key={category}
                  onClick={() => handleCategoryChange(category)}
                  className="w-full text-left px-4 py-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors capitalize"
                >
                  {category}
                </button>
              ))}
            </div>
            <button
              onClick={() => setShowCategoryModal(false)}
              className="mt-4 w-full px-4 py-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Todo Detail Modal */}
      {viewingTodo && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50" onClick={handleCloseViewTodo}>
          <Card className="w-full max-w-2xl max-h-[90vh] overflow-hidden" onClick={(e) => e.stopPropagation()}>
            <CardHeader className="border-b border-gray-200 dark:border-gray-700">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-2">
                    <PriorityBadge priority={viewingTodo.priority} size="sm" />
                    <Badge 
                      variant="outline" 
                      size="sm"
                      className={getStateBadgeInfo(viewingTodo.state).className}
                    >
                      {getStateBadgeInfo(viewingTodo.state).label}
                    </Badge>
                    {viewingTodo.category && (
                      <Badge variant="outline" size="sm">
                        {TODO_CONFIG.CATEGORIES.find(c => c.value === viewingTodo.category)?.label || viewingTodo.category}
                      </Badge>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      handleCloseViewTodo();
                      handleEditTodo(viewingTodo);
                    }}
                  >
                    <Edit className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      handleCloseViewTodo();
                      handleDeleteTodo(viewingTodo);
                    }}
                    className="text-destructive hover:text-destructive"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleCloseViewTodo}
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            
            <CardContent className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
              <div className="space-y-6">
                <div>
                  <h2 className="text-2xl font-bold text-foreground mb-2">
                    {viewingTodo.title}
                  </h2>
                  {viewingTodo.description && (
                    <p className="text-muted-foreground leading-relaxed">
                      {viewingTodo.description}
                    </p>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div>
                      <h3 className="text-sm font-medium text-muted-foreground mb-2">Due Date</h3>
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-muted-foreground" />
                        <span className={getDueDateInfo(viewingTodo.due_date).className}>
                          {viewingTodo.due_date ? getDueDateInfo(viewingTodo.due_date).text : 'No due date'}
                        </span>
                      </div>
                    </div>

                    <div>
                      <h3 className="text-sm font-medium text-muted-foreground mb-2">Status</h3>
                      <div className="flex items-center gap-2">
                        <Clock className="w-4 h-4 text-muted-foreground" />
                        <span>
                          {getActionTimeInfo(viewingTodo).label} {formatRelativeTime(getActionTimeInfo(viewingTodo).time)}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <h3 className="text-sm font-medium text-muted-foreground mb-2">Created</h3>
                      <div className="flex items-center gap-2">
                        <Clock className="w-4 h-4 text-muted-foreground" />
                        <span>{formatRelativeTime(viewingTodo.created_at)}</span>
                      </div>
                    </div>

                    <div>
                      <h3 className="text-sm font-medium text-muted-foreground mb-2">Last Updated</h3>
                      <div className="flex items-center gap-2">
                        <Clock className="w-4 h-4 text-muted-foreground" />
                        <span>{formatRelativeTime(viewingTodo.updated_at)}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* File Attachments */}
                {viewingTodo.attachments && viewingTodo.attachments.length > 0 && (
                  <div>
                    <h3 className="text-sm font-medium text-muted-foreground mb-3">Attachments ({viewingTodo.attachments.length})</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {viewingTodo.attachments.map((attachment) => (
                        <FileAttachment
                          key={attachment.id}
                          attachment={attachment}
                          onDelete={handleFileDelete}
                          size="medium"
                          showActions={true}
                          isDeleting={deletingFiles.has(attachment.id)}
                        />
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
