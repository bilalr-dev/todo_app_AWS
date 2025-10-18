import React, { useState, useCallback, useRef, useEffect } from 'react';
import { useTodos } from '../context/TodoContext';
import { useAuth } from '../context/AuthProvider';
import { useToast } from '../context/ToastContext';
import { getApiUrl } from '../utils/constants';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/common/Card';
import { Button } from '../components/common/Button';
import { Input } from '../components/common/Input';
import { Badge, PriorityBadge, CategoryBadge } from '../components/common/Badge';
import Tooltip from '../components/common/Tooltip';
import { LoadingSkeleton } from '../components/common/Loading';
import DatePicker from '../components/common/DatePicker';
import ConfirmDialog from '../components/common/ConfirmDialog';
import CustomSelect from '../components/common/CustomSelect';
import FileUpload from '../components/common/FileUpload';
import FileAttachment from '../components/common/FileAttachment';
import AdvancedSearch from '../components/common/AdvancedSearch';
import KanbanBoard from '../components/common/KanbanBoard';
import TodoListItem from '../components/common/TodoListItem';
import RichTextEditor from '../components/common/RichTextEditor';
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
  Flag,
  Tag,
  X,
  Download,
  List,
  Grid
} from 'lucide-react';
import { formatDate, formatRelativeTime, isToday, isTomorrow, isOverdue, getTodayInUserTimezone } from '../utils/helpers';
import { TODO_CONFIG } from '../utils/constants';
import { TODO_COLOR_CLASSES, getDueDateBadgeClass, getDueDateTextClass } from '../utils/colors';
import { exportData } from '../utils/exportUtils';

const Dashboard = () => {
  const {
    todos,
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
    bulkOperation,
    searchTodos,
    advancedSearch,
    getSearchSuggestions,
    refreshStats,
  } = useTodos();
  
  // Debug logging
  
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
  const [clearAdvancedSearchTrigger, setClearAdvancedSearchTrigger] = useState(0);
  const [viewMode, setViewMode] = useState(() => {
    // Initialize from localStorage or default to 'list'
    return localStorage.getItem('viewMode') || 'list';
  }); // 'list' or 'kanban'

  // Cross-tab sync for view mode
  useEffect(() => {
    // Save to localStorage when viewMode changes
    localStorage.setItem('viewMode', viewMode);
  }, [viewMode]);

  // Listen for view mode changes from other tabs
  useEffect(() => {
    const handleStorageChange = (e) => {
      if (e.key === 'viewMode' && e.newValue && e.newValue !== viewMode) {
        setViewMode(e.newValue);
      }
    };

    // Listen for storage events (cross-tab synchronization)
    window.addEventListener('storage', handleStorageChange);

    // Also listen for focus events as a fallback for mobile browsers
    const handleFocus = () => {
      const savedViewMode = localStorage.getItem('viewMode');
      if (savedViewMode && savedViewMode !== viewMode) {
        setViewMode(savedViewMode);
      }
    };

    window.addEventListener('focus', handleFocus);

    // Polling mechanism as additional fallback for mobile browsers
    const pollInterval = setInterval(() => {
      const savedViewMode = localStorage.getItem('viewMode');
      if (savedViewMode && savedViewMode !== viewMode) {
        setViewMode(savedViewMode);
      }
    }, 2000); // Check every 2 seconds

    // Cleanup
    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('focus', handleFocus);
      clearInterval(pollInterval);
    };
  }, [viewMode]);

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
  const [createdTodoId, setCreatedTodoId] = useState(null);
  const [isCreatingWithFiles, setIsCreatingWithFiles] = useState(false);
  const [isUserCancelling, setIsUserCancelling] = useState(false);
  const [pendingTodoWithFiles, setPendingTodoWithFiles] = useState(null);
  
  // File upload refs and state
  const fileUploadRef = useRef(null);
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [isUploading, setIsUploading] = useState(false);
  const [deletingFiles, setDeletingFiles] = useState(new Set());
  const [pendingFileDeletions, setPendingFileDeletions] = useState(new Set());

  // Sync viewingTodo with latest todos data
  useEffect(() => {
    if (viewingTodo && todos.length > 0) {
      const updatedTodo = todos.find(t => t.id === viewingTodo.id);
      if (updatedTodo && JSON.stringify(updatedTodo) !== JSON.stringify(viewingTodo)) {
        // Only update if the change is significant (not just file count changes)
        const significantChanges = ['title', 'description', 'status', 'priority', 'category', 'due_date'];
        const hasSignificantChanges = significantChanges.some(field => 
          updatedTodo[field] !== viewingTodo[field]
        );
        
        if (hasSignificantChanges) {
          setViewingTodo(updatedTodo);
        }
      }
    }
  }, [todos, viewingTodo]);

  // Handle filter search changes (dashboard search)
  const handleFilterChange = (key, value) => {
    setFilters({ ...filters, [key]: value });
  };

  // Debounced search function
  const [searchTimeout, setSearchTimeout] = useState(null);
  const handleSearchChange = useCallback((value) => {
    // Clear existing timeout
    if (searchTimeout) {
      clearTimeout(searchTimeout);
    }

    // Update the filter immediately for UI responsiveness
    setFilters({ ...filters, search: value });

    // If search is empty, load all todos
    if (!value.trim()) {
      loadTodos();
      return;
    }

    // Debounce the actual search
    const timeout = setTimeout(() => {
      searchTodos(value);
    }, 300); // 300ms delay

    setSearchTimeout(timeout);
  }, [filters, searchTodos, loadTodos, searchTimeout]);


  // Helper function to get status badge info
  const getStatusBadgeInfo = (status) => {
    switch (status) {
      case 'todo':
      case 'pending': // Backward compatibility
        return { label: 'To Do', variant: 'secondary', className: TODO_COLOR_CLASSES.TODO_BADGE };
      case 'inProgress':
      case 'in_progress': // Backward compatibility
        return { label: 'In Progress', variant: 'warning', className: TODO_COLOR_CLASSES.IN_PROGRESS_BADGE };
      case 'complete':
      case 'completed': // Backward compatibility
        return { label: 'Completed', variant: 'success', className: TODO_COLOR_CLASSES.COMPLETED_BADGE };
      default:
        return { label: 'To Do', variant: 'secondary', className: TODO_COLOR_CLASSES.TODO_BADGE };
    }
  };

  // Helper function to get action time info
  const getActionTimeInfo = (todo) => {
    const { status, state, created_at, updated_at, started_at, completed_at } = todo;
    
    // For completed todos, show when they were completed (completed_at or updated_at as fallback)
    if ((status || state) === 'complete' || (status || state) === 'completed') {
      return {
        label: 'Completed at:',
        time: completed_at || updated_at
      };
    }
    
    // For in-progress todos, show when they were moved to in-progress (started_at or updated_at as fallback)
    if ((status || state) === 'inProgress' || (status || state) === 'in_progress') {
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
      let hasFiles = selectedFiles.length > 0 && fileUploadRef.current;
      
      // If we have files but no ref, wait a bit and try again
      if (selectedFiles.length > 0 && !fileUploadRef.current) {
        await new Promise(resolve => setTimeout(resolve, 100));
        if (fileUploadRef.current) {
          hasFiles = true; // Update hasFiles after ref becomes available
        }
      }
      
      // Create the todo first (suppress notification and local state update if files will be uploaded)
      // Add a flag to indicate if this todo is being created with files
      const todoDataWithFlag = { ...todoData, _createdWithFiles: hasFiles };
      const result = await createTodo(todoDataWithFlag, true, true); // Always suppress notifications and local state updates
      if (result.success) {
        // Set the created todo ID for file upload
        setCreatedTodoId(result.data.todo.id);
        
        if (hasFiles) {
          // Store the todo data to add to list after file upload
          setPendingTodoWithFiles(result.data.todo);
          
          // Note: We'll let the WebSocket event add the todo, but we'll track it as pending
          // The todo will be temporarily hidden from the UI until upload completes
          
          // FLOW 1: Files to upload - upload them to the created todo
          setIsUploading(true);
          setIsCreatingWithFiles(true);
          
          try {
            // Wait a moment for the state to update and FileUpload to re-render with the new todoId
            await new Promise(resolve => setTimeout(resolve, 100));
            
            // Upload files to the newly created todo
            // Pass the todoId directly to the upload function
            await fileUploadRef.current.uploadFiles(result.data.todo.id);
            
            // Show success notification after upload is complete
            showToast('To Do created successfully!', 'success');
            
            // Clear the pending todo since it's now visible in the list
            setPendingTodoWithFiles(null);
            
            // Clear form and close modal (only after file upload is complete)
            setNewTodo({
              title: '',
              description: '',
              priority: 'low',
              category: '',
              due_date: getTodayInUserTimezone(),
              state: 'todo',
            });
            setSelectedFiles([]);
            setCreatedTodoId(null);
            setIsCreatingWithFiles(false);
            if (fileUploadRef.current) {
              fileUploadRef.current.clearFiles();
            }
            setShowNewTodo(false);
            
            // Refresh the dashboard to show the new todo with files
            await loadTodos();
            
            // Refresh statistics after file upload is complete
            refreshStats();
          } catch (uploadError) {
            // Check if it's a cancellation (expected) or actual error
            if (uploadError.message === 'Upload cancelled') {
              // Don't reload todos for cancellation - keep existing state
              showToast('Upload cancelled', 'warning');
              // Refresh statistics even if upload was cancelled
              refreshStats();
            } else if (uploadError.message === 'Upload cancelled silently') {
              // Silent cancellation - don't show toast, don't reload todos
              // This is handled by the user cancellation logic
              // Refresh statistics even if upload was cancelled
              refreshStats();
            } else {
              // Upload failed, but todo was created - show error
              showToast('File upload failed, but todo was created', 'error');
              // Refresh statistics even if upload failed
              refreshStats();
            }
          } finally {
            setIsUploading(false);
            setIsCreatingWithFiles(false);
            setIsUserCancelling(false); // Reset the flag
            // Don't close the form here - it will be closed after successful upload
          }
        } else {
          // FLOW 2: No files to upload, clear form and close modal immediately
          showToast('To Do created successfully!', 'success');
        setNewTodo({
          title: '',
          description: '',
            priority: 'low',
          category: '',
            due_date: getTodayInUserTimezone(),
            state: 'todo',
        });
        setSelectedFiles([]);
          setCreatedTodoId(null);
        if (fileUploadRef.current) {
          fileUploadRef.current.clearFiles();
        }
        setShowNewTodo(false);
        
          // Refresh statistics after todo creation (no files)
          refreshStats();
        }
      }
    } catch (error) {
      showToast('Failed to create todo', 'error');
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

  const handleCancelTodo = async () => {
    // Set flag to indicate user-initiated cancellation
    setIsUserCancelling(true);
    
    // Cancel any pending uploads first
    if (fileUploadRef.current) {
      fileUploadRef.current.cancelUploads();
    }
    
    // Handle cancellation based on whether we're creating or editing
    if (editingTodo) {
      // Edit mode cancellation - restore original todo state
      showToast('Todo update cancelled', 'warning');
      
      // Restore the original todo state by reloading from the todos list
      const originalTodo = todos.find(t => t.id === editingTodo.id);
      if (originalTodo) {
        setEditingTodo(originalTodo);
        // Also update viewingTodo if it's the same todo
        if (viewingTodo && viewingTodo.id === editingTodo.id) {
          setViewingTodo(originalTodo);
        }
      }
      
      // Clear pending file deletions
      setPendingFileDeletions(new Set());
    } else {
      // Create mode cancellation
      if (isCreatingWithFiles && createdTodoId) {
        try {
          await deleteTodo(createdTodoId, false); // Suppress the delete notification
          showToast('Todo creation cancelled', 'warning');
        } catch (error) {
          showToast('Todo was created but upload was cancelled', 'warning');
        }
      }
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
    setCreatedTodoId(null);
    setIsCreatingWithFiles(false);
    setIsUserCancelling(false);
    setIsUploading(false);
    setPendingFileDeletions(new Set());
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
    setPendingFileDeletions(new Set()); // Clear any pending deletions when starting edit
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
    
    if (!editingTodo.title.trim()) return;
    
    try {
      // Prepare update data - exclude due_date if it's in the past
      const updateData = { ...editingTodo };
      
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
      
      // Update the todo (always update local state, but suppress notification if files will be uploaded)
      const result = await updateTodo(editingTodo.id, updateData, !hasFiles, true);
      if (result.success) {
        // Delete any pending files that were marked for deletion during edit
        if (pendingFileDeletions.size > 0) {
          const token = localStorage.getItem('token') || sessionStorage.getItem('token');
          // Delete all pending files
          const deletePromises = Array.from(pendingFileDeletions).map(async (fileId) => {
            try {
              const response = await fetch(getApiUrl(`/files/${fileId}`), {
                method: 'DELETE',
                headers: {
                  'Authorization': `Bearer ${token}`
                }
              });
              if (!response.ok) {
                throw new Error(`Failed to delete file ${fileId}`);
              }
            } catch (error) {
              // Continue with other deletions even if one fails
            }
          });
          
          await Promise.all(deletePromises);
          
          // Clear pending deletions
          setPendingFileDeletions(new Set());
        }
        
        // If there are selected files, upload them silently
        if (hasFiles) {
          setIsUploading(true);
          try {
            await fileUploadRef.current.uploadFiles();
            // No toast notification for file uploads
          } catch (uploadError) {
            // Check if it's a cancellation (expected) or actual error
            if (uploadError.message === 'Upload cancelled') {
              // For cancellation, don't close the form - let user continue editing
              setIsUploading(false);
              return; // Exit early, don't close the form
            } else if (uploadError.message === 'Upload cancelled silently') {
              // Silent cancellation - don't show toast, don't close form
              setIsUploading(false);
              return; // Exit early, don't close the form
            } else {
              // Don't reload todos to prevent file attachments from disappearing
              setIsUploading(false);
              // Refresh statistics even if upload failed
              refreshStats();
            }
          }
          // Only set uploading to false if we didn't return early
          setIsUploading(false);
        } else {
          // No files to upload, refresh statistics immediately
          refreshStats();
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
        setPendingFileDeletions(new Set());
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
      return { text: 'Overdue', className: getDueDateTextClass(dueDate) };
    }
    
    if (isToday(dueDate)) {
      return { text: 'Due today', className: getDueDateTextClass(dueDate) };
    }
    
    if (isTomorrow(dueDate)) {
      return { text: 'Due tomorrow', className: getDueDateTextClass(dueDate) };
    }
    
    return { text: formatDate(dueDate), className: getDueDateTextClass(dueDate) };
  };

  // For details card - uses full badge styling with background
  const getDueDateBadgeInfo = (dueDate, todoStatus = null) => {
    if (!dueDate) return { text: 'No due date', className: 'text-muted-foreground' };
    
    // For completed todos, always show the actual date in DD/MM/YYYY format
    if (todoStatus === 'complete' || todoStatus === 'completed') {
      return { 
        text: formatDate(dueDate), 
        className: 'text-gray-700 dark:text-gray-300'
      };
    }
    
    if (isOverdue(dueDate)) {
      return { text: 'Overdue', className: getDueDateBadgeClass(dueDate) };
    }
    
    if (isToday(dueDate)) {
      return { text: 'Due today', className: getDueDateBadgeClass(dueDate) };
    }
    
    if (isTomorrow(dueDate)) {
      return { text: 'Due tomorrow', className: getDueDateBadgeClass(dueDate) };
    }
    
    return { text: formatDate(dueDate), className: getDueDateBadgeClass(dueDate) };
  };

  // Handle individual todo selection for bulk operations
  const handleSelectTodo = (todoId) => {
    // Find the todo to check if it's completed
    const todo = filteredTodos.find(t => t.id === todoId);
    
    // Don't allow selection of completed todos
    if (todo && (todo.status || todo.state) === 'completed') {
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
    const selectableTodos = filteredTodos.filter(todo => todo.status !== 'completed');
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

      // Determine current column based on todo status (consistent with Kanban filtering)
      let currentColumn = 'todo';
      const currentStatus = todo.status || todo.state;
      if (currentStatus === 'pending' || currentStatus === 'todo') {
        currentColumn = 'todo';
      } else if (currentStatus === 'in_progress') {
        currentColumn = 'in-progress';
      } else if (currentStatus === 'completed') {
        currentColumn = 'complete';
      } else {
        // Fallback for existing todos without status field
        currentColumn = 'todo';
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
        updateData = { state: 'complete' };
      } else if (targetColumn === 'in-progress') {
        updateData = { state: 'inProgress' };
      } else if (targetColumn === 'todo') {
        updateData = { state: 'todo' };
      }

      await updateTodo(todoId, updateData, true); // Keep the default "To Do updated successfully!" notification
      // Refresh statistics after Kanban move
      refreshStats();
      // Removed the duplicate "Todo moved to [column]" notification
    } catch (error) {
      showToast('Failed to move todo', 'error');
    }
  };

  // Export todos functionality - exports selected todos or all todos if none selected
  const handleExportTodos = () => {
    const result = exportData({
      todos: filteredTodos,
      user: user,
      exportType: 'todos',
      selectedTodos: selectedTodos
    });

    if (result.success) {
      showToast(result.message, 'success');
    } else {
      showToast(result.message, 'error');
    }
  };

  // Bulk operations handlers
  const handleBulkAction = async (action, data) => {
    try {
      // Filter out completed todos from the selection
      const validTodoIds = selectedTodos.filter(todoId => {
        const todo = filteredTodos.find(t => t.id === todoId);
        return todo && todo.status !== 'completed';
      });

      if (validTodoIds.length === 0) {
        showToast('No valid todos selected for this action', 'warning');
        return;
      }

      if (validTodoIds.length !== selectedTodos.length) {
        showToast(`Filtered out ${selectedTodos.length - validTodoIds.length} completed todos from selection`, 'info');
        setSelectedTodos(validTodoIds);
      }

      let result;

      switch (action) {
        case 'complete':
          result = await bulkOperation('complete', validTodoIds);
          break;
        case 'in-progress':
          result = await bulkOperation('in-progress', validTodoIds);
          break;
        case 'delete':
          result = await bulkOperation('delete', validTodoIds);
          break;
        case 'priority':
          result = await bulkOperation('priority', validTodoIds, { priority: data.priority });
          break;
        case 'category':
          result = await bulkOperation('category', validTodoIds, { category: data.category });
          break;
        case 'export':
          // Handle export separately
          handleExportSelected();
          return;
        default:
          throw new Error(`Unknown bulk action: ${action}`);
      }
      
      // Clear selection after successful bulk action
      setSelectedTodos([]);
      
      // Note: Success/error messages are handled by TodoProvider methods
    } catch (error) {
      // Note: Error messages are handled by TodoProvider methods
    }
  };

  const handleExportSelected = async () => {
    try {
      const token = localStorage.getItem('token') || sessionStorage.getItem('token');
      const response = await fetch(getApiUrl('/export/todos/json'), {
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

    // If we're in edit mode, just mark the file for deletion without actually deleting it
    if (editingTodo) {
      setPendingFileDeletions(prev => new Set(prev).add(fileId));
      
      // Update the editing todo by removing the attachment from the UI
      setEditingTodo(prev => ({
        ...prev,
        attachments: (prev.attachments || []).filter(att => att.id !== fileId),
        file_count: Math.max(0, (prev.file_count || 0) - 1)
      }));
      
      // Update the viewing todo by removing the attachment from the UI
      if (viewingTodo && viewingTodo.id === editingTodo.id) {
        setViewingTodo(prev => ({
          ...prev,
          attachments: (prev.attachments || []).filter(att => att.id !== fileId),
          file_count: Math.max(0, (prev.file_count || 0) - 1)
        }));
      }
      
      return; // Exit early for edit mode
    }

    // For non-edit mode (view mode, create mode), delete immediately
    try {
      // Add file to deleting set
      setDeletingFiles(prev => new Set(prev).add(fileId));
      
      // Make the DELETE request to the backend
      const token = localStorage.getItem('token') || sessionStorage.getItem('token');
      const response = await fetch(getApiUrl(`/files/${fileId}`), {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        throw new Error('Delete failed');
      }

      // Update the viewing todo by removing the deleted attachment
      if (viewingTodo) {
        setViewingTodo(prev => ({
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
  }, [editingTodo, viewingTodo, deletingFiles, loadTodos]);

  // Advanced search handlers
  const handleAdvancedSearch = useCallback(async (filters) => {
    try {
      setIsAdvancedSearching(true);
      setAdvancedFilters(filters);
      await advancedSearch(filters);
    } catch (error) {
      showToast('Error performing advanced search', 'error');
    } finally {
      setIsAdvancedSearching(false);
    }
  }, [advancedSearch, showToast]);

  const handleAdvancedFilterChange = useCallback((filters) => {
    setAdvancedFilters(filters);
    // Only trigger search if filters are not empty (prevent search on page load)
    const hasFilters = Object.values(filters).some(value => 
      value !== null && value !== undefined && value !== '' && 
      (Array.isArray(value) ? value.length > 0 : true)
    );
    if (hasFilters) {
    handleAdvancedSearch(filters);
    }
  }, [handleAdvancedSearch]);

  const clearAdvancedSearch = useCallback(() => {
    setAdvancedFilters({});
    setClearAdvancedSearchTrigger(prev => prev + 1);
    // Reload all todos
    loadTodos();
  }, [loadTodos]);

  return (
    <div className="p-4 sm:p-6 overflow-x-hidden">
      <div className="max-w-none mx-0 sm:mx-[36px]">
        {/* Header */}
        <div className="mb-6 sm:mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold text-foreground mb-2">
            Welcome back, {user?.username}!
          </h1>
          <p className="text-sm sm:text-base text-muted-foreground">
            Here's what you need to focus on today
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3 sm:gap-4 md:gap-6 mb-6 sm:mb-8">
          {/* To Do */}
          <Card className="stats-card-glass transition-all duration-300">
            <CardContent className="p-3 sm:p-4 md:p-6">
              <div className="flex items-center justify-between">
                <div className="min-w-0 flex-1">
                  <p className="text-xs sm:text-sm font-medium text-muted-foreground truncate">To Do</p>
                  <p className="text-lg sm:text-xl md:text-2xl font-bold text-warning-600">{Number(stats?.pending || 0)}</p>
                </div>
                <div className="w-8 h-8 sm:w-10 sm:h-10 md:w-12 md:h-12 bg-yellow-100 dark:bg-yellow-900/30 rounded-lg flex items-center justify-center flex-shrink-0">
                  <List className="w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6 text-yellow-600 dark:text-yellow-300" />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* In Progress */}
          <Card className="stats-card-glass transition-all duration-300">
            <CardContent className="p-3 sm:p-4 md:p-6">
              <div className="flex items-center justify-between">
                <div className="min-w-0 flex-1">
                  <p className="text-xs sm:text-sm font-medium text-muted-foreground truncate">In Progress</p>
                  <p className="text-lg sm:text-xl md:text-2xl font-bold text-purple-600">{Number(stats?.in_progress || 0)}</p>
                </div>
                <div className="w-8 h-8 sm:w-10 sm:h-10 md:w-12 md:h-12 bg-purple-100 dark:bg-purple-900/30 rounded-lg flex items-center justify-center flex-shrink-0">
                  <Clock className="w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6 text-purple-600 dark:text-purple-300" />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Completed */}
          <Card className="stats-card-glass transition-all duration-300">
            <CardContent className="p-3 sm:p-4 md:p-6">
              <div className="flex items-center justify-between">
                <div className="min-w-0 flex-1">
                  <p className="text-xs sm:text-sm font-medium text-muted-foreground truncate">Completed</p>
                  <p className="text-lg sm:text-xl md:text-2xl font-bold text-green-600">{Number(stats?.completed || 0)}</p>
                </div>
                <div className="w-8 h-8 sm:w-10 sm:h-10 md:w-12 md:h-12 bg-green-100 dark:bg-green-900/30 rounded-lg flex items-center justify-center flex-shrink-0">
                  <CheckCircle2 className="w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6 text-green-600 dark:text-green-300" />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* High Priority */}
          <Card className="stats-card-glass transition-all duration-300">
            <CardContent className="p-3 sm:p-4 md:p-6">
              <div className="flex items-center justify-between">
                <div className="min-w-0 flex-1">
                  <p className="text-xs sm:text-sm font-medium text-muted-foreground truncate">High Priority</p>
                  <p className="text-lg sm:text-xl md:text-2xl font-bold text-error-600">{Number(stats?.high_priority || 0)}</p>
                </div>
                <div className="w-8 h-8 sm:w-10 sm:h-10 md:w-12 md:h-12 bg-red-100 dark:bg-red-900/30 rounded-lg flex items-center justify-center flex-shrink-0">
                  <AlertTriangle className="w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6 text-red-600 dark:text-red-300" />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Total */}
          <Card className="stats-card-glass transition-all duration-300">
            <CardContent className="p-3 sm:p-4 md:p-6">
              <div className="flex items-center justify-between">
                <div className="min-w-0 flex-1">
                  <p className="text-xs sm:text-sm font-medium text-muted-foreground truncate">Total</p>
                  <p className="text-lg sm:text-xl md:text-2xl font-bold text-indigo-600">{Number(stats?.total || 0)}</p>
                </div>
                <div className="w-8 h-8 sm:w-10 sm:h-10 md:w-12 md:h-12 bg-indigo-100 dark:bg-indigo-900/30 rounded-lg flex items-center justify-center flex-shrink-0">
                  <ClipboardList className="w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6 text-indigo-600 dark:text-indigo-300" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Controls */}
        {/* Basic Search - Hidden when Advanced Search is active */}
        {!showAdvancedSearch && (
          <div className="flex flex-col gap-3 sm:gap-4 mb-4 sm:mb-6">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search to dos..."
                  value={filters.search}
                  onChange={(e) => handleSearchChange(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
          
          {/* Quick Actions Row */}
          <div className="flex flex-wrap gap-2">
            <Button
              variant="outline"
              onClick={() => setShowAdvancedSearch(!showAdvancedSearch)}
              className={`flex items-center gap-1 sm:gap-2 px-2 sm:px-3 py-1.5 text-xs sm:text-sm transition-all duration-300 ease-out ${
                Object.keys(advancedFilters).length > 0 
                  ? 'border-blue-500 text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20 shadow-md' 
                  : showAdvancedSearch
                  ? 'border-emerald-500 text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/20 shadow-md'
                  : 'hover:border-gray-400 dark:hover:border-gray-500 hover:shadow-sm'
              }`}
            >
              <Search className={`h-3 w-3 sm:h-4 sm:w-4 transition-all duration-300 ease-out ${
                showAdvancedSearch ? 'rotate-180 scale-110' : 'rotate-0 scale-100'
              }`} />
              <span className="hidden sm:inline">Advanced</span>
              <span className="sm:hidden">Adv</span>
              {Object.keys(advancedFilters).length > 0 && (
                <span className="ml-1 px-1 sm:px-1.5 py-0.5 text-xs bg-blue-100 text-blue-600 dark:bg-blue-900 dark:text-blue-300 rounded-full">
                  Active
                </span>
              )}
            </Button>
            
            <Button
              variant="outline"
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center gap-1 sm:gap-2 px-2 sm:px-3 py-1.5 text-xs sm:text-sm"
            >
              <Filter className="h-3 w-3 sm:h-4 sm:w-4" />
              <span className="hidden sm:inline">Filters</span>
              <span className="sm:hidden">Filter</span>
            </Button>
          </div>
        </div>
        )}


        {/* Filters Panel */}
        {showFilters && (
          <Card className="mb-6">
            <CardContent className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <CustomSelect
                  label="Priority"
                    value={filters.priority}
                  onChange={(value) => handleFilterChange('priority', value)}
                  options={[
                    { value: 'all', label: 'All Priorities' },
                    ...TODO_CONFIG.PRIORITIES
                  ]}
                  placeholder="Select Priority"
                />
                
                <CustomSelect
                  label="Category"
                    value={filters.category}
                  onChange={(value) => handleFilterChange('category', value)}
                  options={[
                    { value: 'all', label: 'All Categories' },
                    ...TODO_CONFIG.CATEGORIES
                  ]}
                  placeholder="Select Category"
                />
                
                <CustomSelect
                  label="Status"
                  value={filters.status}
                  onChange={(value) => handleFilterChange('status', value)}
                  options={[
                    { value: 'all', label: 'All Status' },
                    { value: 'pending', label: 'To Do' },
                    { value: 'in_progress', label: 'In Progress' },
                    { value: 'completed', label: 'Completed' }
                  ]}
                  placeholder="Select Status"
                />
                
                <CustomSelect
                  label="Due Date"
                    value={filters.dueDate}
                  onChange={(value) => handleFilterChange('dueDate', value)}
                  options={[
                    { value: 'all', label: 'All Dates' },
                    { value: 'today', label: 'Today' },
                    { value: 'tomorrow', label: 'Tomorrow' },
                    { value: 'this_week', label: 'This Week' },
                    { value: 'overdue', label: 'Overdue' }
                  ]}
                  placeholder="Select Date"
                />
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
                    : 'border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/20 hover:bg-slate-100 dark:hover:bg-slate-900/30 text-slate-600 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300'
                }`}
              >
                <CheckSquare className="w-4 h-4" />
                <span className="font-medium">
                  {(() => {
                    const selectableTodos = filteredTodos.filter(todo => todo.status !== 'completed');
                    return selectableTodos.length > 0 && selectedTodos.length === selectableTodos.length ? 'Deselect All' : 'Select All';
                  })()}
                </span>
              </button>

              {/* In Progress */}
              <button
                onClick={() => handleBulkAction('in-progress')}
                disabled={selectedTodos.length === 0}
                className={`flex items-center space-x-2 px-3 py-1.5 rounded-lg border transition-colors text-sm ${
                  selectedTodos.length === 0
                    ? 'border-gray-200 dark:border-gray-700 bg-gray-100 dark:bg-gray-800 text-gray-400 dark:text-gray-600 cursor-not-allowed'
                    : 'border-orange-200 dark:border-orange-800 bg-orange-50 dark:bg-orange-900/20 hover:bg-orange-100 dark:hover:bg-orange-900/30 text-orange-600 dark:text-orange-400 hover:text-orange-700 dark:hover:text-orange-300'
                }`}
              >
                <Clock className="w-4 h-4" />
                <span className="font-medium">In Progress</span>
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

              {/* Priority */}
              <button
                onClick={() => setShowPriorityModal(true)}
                disabled={selectedTodos.length === 0}
                className={`flex items-center space-x-2 px-3 py-1.5 rounded-lg border transition-colors text-sm ${
                  selectedTodos.length === 0
                    ? 'border-gray-200 dark:border-gray-700 bg-gray-100 dark:bg-gray-800 text-gray-400 dark:text-gray-600 cursor-not-allowed'
                    : 'border-yellow-200 dark:border-yellow-800 bg-yellow-50 dark:bg-yellow-900/20 hover:bg-yellow-100 dark:hover:bg-yellow-900/30 text-yellow-600 dark:text-yellow-400 hover:text-yellow-700 dark:hover:text-yellow-300'
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

        {/* Action Buttons Row - Below Bulk Actions, Right Aligned */}
        <div className="flex flex-wrap gap-2 justify-end mb-4 sm:mb-6">
          <Button
            onClick={() => setShowNewTodo(true)}
            className="flex items-center gap-1 sm:gap-2 px-2 sm:px-3 py-1.5 text-xs sm:text-sm"
          >
            <Plus className="h-3 w-3 sm:h-4 sm:w-4" />
            <span className="hidden sm:inline">New To Do</span>
            <span className="sm:hidden">New</span>
          </Button>
          
          {/* View Mode Toggle - Icon Only */}
          <div className="flex items-center gap-1">
            <button
              onClick={() => {
                setViewMode('list');
              }}
              title="List mode"
                className={`flex items-center justify-center w-8 h-8 sm:w-10 sm:h-10 rounded-md text-sm transition-colors ${
                viewMode === 'list'
                  ? 'bg-blue-500 text-white'
                    : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
              }`}
            >
                <List className="w-3 h-3 sm:w-4 sm:h-4" />
            </button>
            
            <button
              onClick={() => {
                setViewMode('kanban');
              }}
              title="Kanban Mode"
                className={`flex items-center justify-center w-8 h-8 sm:w-10 sm:h-10 rounded-md text-sm transition-colors ${
                viewMode === 'kanban'
                  ? 'bg-blue-500 text-white'
                    : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
              }`}
            >
                <Grid className="w-3 h-3 sm:w-4 sm:h-4" />
            </button>
          </div>
        </div>

        {/* Advanced Search Panel */}
        <div className={`mb-6 transition-all duration-500 ease-out ${
          showAdvancedSearch 
            ? 'max-h-[1000px] opacity-100 translate-y-0 overflow-visible' 
            : 'max-h-0 opacity-0 -translate-y-4 overflow-hidden'
        }`}>
          <Card className="border-0 shadow-xl bg-gradient-to-br from-white to-gray-50 dark:from-gray-800 dark:to-gray-900 transform transition-all duration-500 ease-out ${
            showAdvancedSearch 
              ? 'scale-100 translate-y-0' 
              : 'scale-95 translate-y-2'
          }">
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
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setShowAdvancedSearch(false)}
                      className="bg-white/10 border-white/20 text-white hover:bg-white/20 hover:border-white/30 backdrop-blur-sm"
                      title="Close Advanced Search"
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </div>
              <div className="p-6">
                <AdvancedSearch
                  onSearch={handleAdvancedSearch}
                  onFilterChange={handleAdvancedFilterChange}
                  clearTrigger={clearAdvancedSearchTrigger}
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
        </div>


        {/* New Todo Modal */}
        {showNewTodo && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50" onClick={handleCancelTodo}>
            <Card className="w-full max-w-xl max-h-[85vh] overflow-y-auto overflow-x-visible" onClick={(e) => e.stopPropagation()}>
              <CardHeader>
                <CardTitle>{editingTodo ? 'Edit Todo' : 'New Todo'}</CardTitle>
                <CardDescription>
                  {editingTodo ? 'Update your todo details' : 'Add a new todo to your list'}
                </CardDescription>
              </CardHeader>
              
              <CardContent>
                <div className="max-h-[70vh] overflow-y-auto overflow-x-visible pr-2 scrollbar-thin">
                  <form onSubmit={editingTodo ? handleUpdateTodo : handleCreateTodo} className="space-y-4 relative">
                    <div>
                    <Input
                      label={
                        <span>
                          Title <span className="text-red-500">*</span>
                        </span>
                      }
                      placeholder="What needs to be done?"
                      value={editingTodo ? editingTodo.title : newTodo.title}
                      onChange={(e) => {
                        if (editingTodo) {
                          setEditingTodo({ ...editingTodo, title: e.target.value });
                        } else {
                          setNewTodo({ ...newTodo, title: e.target.value });
                        }
                      }}
                        maxLength={75}
                      required
                    />
                      <div className={`text-xs mt-1 text-right ${
                        (editingTodo ? editingTodo.title : newTodo.title).length > 70 ? 'text-red-500' : 
                        (editingTodo ? editingTodo.title : newTodo.title).length > 60 ? 'text-yellow-500' : 
                        'text-gray-500'
                      }`}>
                        {(editingTodo ? editingTodo.title : newTodo.title).length}/75
                      </div>
                    </div>
                    
                    <div>
                      <label className="text-sm font-medium mb-2 block">Description</label>
                      <RichTextEditor
                        placeholder="Add details..."
                        value={editingTodo ? editingTodo.description : newTodo.description}
                        onChange={(value) => {
                          if (editingTodo) {
                            setEditingTodo({ ...editingTodo, description: value });
                          } else {
                            setNewTodo({ ...newTodo, description: value });
                          }
                        }}
                        height="120px"
                      />
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <CustomSelect
                        label={
                          <span>
                            Priority <span className="text-red-500">*</span>
                          </span>
                        }
                        value={editingTodo ? editingTodo.priority : newTodo.priority}
                        onChange={(value) => {
                          if (editingTodo) {
                            setEditingTodo({ ...editingTodo, priority: value });
                          } else {
                            setNewTodo({ ...newTodo, priority: value });
                          }
                        }}
                        options={TODO_CONFIG.PRIORITIES}
                        placeholder="Select priority"
                      />
                      
                      <CustomSelect
                        label="Category"
                        value={editingTodo ? editingTodo.category : newTodo.category}
                        onChange={(value) => {
                          if (editingTodo) {
                            setEditingTodo({ ...editingTodo, category: value });
                          } else {
                            setNewTodo({ ...newTodo, category: value });
                          }
                        }}
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
                        value={editingTodo ? editingTodo.due_date : newTodo.due_date}
                        onChange={(date) => {
                          if (editingTodo) {
                            setEditingTodo({ ...editingTodo, due_date: date });
                          } else {
                            setNewTodo({ ...newTodo, due_date: date });
                          }
                        }}
                        placeholder="Select due date"
                        minDate={getTodayInUserTimezone()}
                      />
                    </div>
                    
                    {/* File Upload Section */}
                    <div>
                      <label className="text-sm font-medium mb-2 block">Attachments</label>
                      <FileUpload
                        ref={fileUploadRef}
                        todoId={editingTodo?.id || createdTodoId}
                        onFilesChange={handleFilesChange}
                        onDelete={handleFileDelete}
                        multiple={true}
                        maxFiles={5}
                        className="mb-4"
                        existingAttachments={editingTodo?.attachments || []}
                        deletingFiles={deletingFiles}
                        suppressCancellationError={isUserCancelling}
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
                  onClick={() => handleSearchChange('')}
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
              key={`kanban-${filteredTodos.length}-${filteredTodos.map(t => `${t.id}-${t.status || t.state}`).join(',')}`}
              todos={filteredTodos.filter(todo => 
                !pendingTodoWithFiles || todo.id !== pendingTodoWithFiles.id
              )}
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
          ) : (() => {
            // Filter out the pending todo with files from the display
            const displayTodos = filteredTodos.filter(todo => 
              !pendingTodoWithFiles || todo.id !== pendingTodoWithFiles.id
            );
            return displayTodos.length === 0;
          })() ? (
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
                            : filters.priority !== 'all' || filters.category !== 'all' || filters.status !== 'all' || filters.dueDate !== 'all'
                              ? 'Try adjusting your filters to see more todos'
                              : 'Get started by creating your first todo'
                          }
                        </p>
                        {!filters.search && filters.priority === 'all' && filters.category === 'all' && filters.status === 'all' && filters.dueDate === 'all' && (
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
              {filteredTodos.filter(todo => 
                !pendingTodoWithFiles || todo.id !== pendingTodoWithFiles.id
              ).map((todo) => {
                // Debug logging for todo 244
                if (todo.id === 244) {
                }
                return (
                <TodoListItem
                  key={todo.id}
                  todo={todo}
                  selectedTodos={selectedTodos}
                  deletingFiles={deletingFiles}
                  onSelectTodo={handleSelectTodo}
                  onToggleComplete={handleToggleTodo}
                  onEdit={handleEditTodo}
                  onDelete={handleDeleteTodo}
                  onViewTodo={handleViewTodo}
                  onFileDelete={handleFileDelete}
                  getDueDateInfo={getDueDateInfo}
                  getStatusBadgeInfo={getStatusBadgeInfo}
                  getActionTimeInfo={getActionTimeInfo}
                                  />
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
        title="Delete To Do"
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
              {TODO_CONFIG.CATEGORIES.map(category => (
                <button
                  key={category.value}
                  onClick={() => handleCategoryChange(category.value)}
                  className="w-full text-left px-4 py-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                >
                  {category.label}
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
          <Card className="w-full max-w-3xl max-h-[95vh] overflow-y-auto overflow-x-visible" onClick={(e) => e.stopPropagation()}>
            <CardHeader className="border-b border-gray-200 dark:border-gray-700 py-2.5 px-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-1.5">
                    <PriorityBadge priority={viewingTodo.priority} size="sm" />
                    <Badge 
                      variant="outline" 
                      size="sm"
                      className={getStatusBadgeInfo(viewingTodo.status || viewingTodo.state).className}
                    >
                      {getStatusBadgeInfo(viewingTodo.status || viewingTodo.state).label}
                    </Badge>
                    {viewingTodo.category && (
                      <CategoryBadge category={viewingTodo.category} size="sm" />
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
            
            <CardContent className="p-6 overflow-y-auto overflow-x-visible max-h-[calc(90vh-120px)]">
              <div className="space-y-6">
                <div>
                  <h2 className="text-2xl font-bold text-foreground mb-2">
                    {viewingTodo.title}
                  </h2>
                  {viewingTodo.description && (
                    <div 
                      className="text-muted-foreground leading-relaxed prose prose-sm max-w-none"
                      dangerouslySetInnerHTML={{ __html: viewingTodo.description }}
                    />
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div>
                      <h3 className="text-sm font-medium text-muted-foreground mb-2">Due Date</h3>
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-muted-foreground" />
                        <span className={getDueDateBadgeInfo(viewingTodo.due_date, viewingTodo.status || viewingTodo.state).className}>
                          {viewingTodo.due_date ? getDueDateBadgeInfo(viewingTodo.due_date, viewingTodo.status || viewingTodo.state).text : 'No due date'}
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
