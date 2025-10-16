// Simplified bulk operations component for v0.6
import React, { useState } from 'react';
import { 
  CheckSquare, 
  Square, 
  Trash2, 
  CheckCircle, 
  Clock, 
  Flag, 
  Tag,
  X
} from 'lucide-react';
import { TODO_CONFIG } from '../../utils/constants';

const BulkOperations = ({ 
  selectedTodos, 
  onSelectionChange, 
  onBulkAction, 
  todos = [],
  className = '' 
}) => {
  const [actionLoading, setActionLoading] = useState(false);
  const [showPriorityModal, setShowPriorityModal] = useState(false);
  const [showCategoryModal, setShowCategoryModal] = useState(false);

  // Filter out completed todos for selection
  const selectableTodos = todos.filter(todo => todo.status !== 'completed');
  const isAllSelected = selectableTodos.length > 0 && selectedTodos.length === selectableTodos.length;
  const isIndeterminate = selectedTodos.length > 0 && selectedTodos.length < selectableTodos.length;

  const handleSelectAll = () => {
    if (isAllSelected) {
      onSelectionChange([]);
    } else {
      onSelectionChange(selectableTodos.map(todo => todo.id));
    }
  };

  const handleSelectTodo = (todoId) => {
    if (selectedTodos.includes(todoId)) {
      onSelectionChange(selectedTodos.filter(id => id !== todoId));
    } else {
      onSelectionChange([...selectedTodos, todoId]);
    }
  };

  const handleBulkAction = async (action, data = {}) => {
    if (selectedTodos.length === 0) return;

    setActionLoading(true);
    try {
      await onBulkAction(action, { todoIds: selectedTodos, ...data });
      onSelectionChange([]); // Clear selection after action
    } catch (error) {
      // Error handling is done by the bulk action methods
    } finally {
      setActionLoading(false);
    }
  };

  const handlePriorityChange = async (priority) => {
    await handleBulkAction('priority', { priority });
    setShowPriorityModal(false);
  };

  const handleCategoryChange = async (category) => {
    await handleBulkAction('category', { category });
    setShowCategoryModal(false);
  };

  if (todos.length === 0) {
    return null;
  }

  return (
    <div className={`bulk-operations ${className}`}>
      {/* Simplified Selection Header */}
      <div className="flex items-center justify-between p-4 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
        <div className="flex items-center space-x-4">
          <button
            onClick={handleSelectAll}
            className="flex items-center space-x-2 text-sm font-medium text-blue-700 dark:text-blue-300 hover:text-blue-800 dark:hover:text-blue-200 transition-colors"
          >
            {isAllSelected ? (
              <CheckSquare className="w-5 h-5 text-blue-600" />
            ) : isIndeterminate ? (
              <div className="w-5 h-5 border-2 border-blue-600 rounded bg-blue-600 bg-opacity-20" />
            ) : (
              <Square className="w-5 h-5" />
            )}
            <span className="font-semibold">
              {isAllSelected ? 'Deselect All' : 'Select All'}
            </span>
          </button>
          
          {selectedTodos.length > 0 && (
            <div className="flex items-center space-x-2">
              <span className="px-2 py-1 bg-blue-100 dark:bg-blue-800 text-blue-700 dark:text-blue-200 text-sm font-medium rounded-full">
                {selectedTodos.length} selected
              </span>
              <button
                onClick={() => onSelectionChange([])}
                className="p-1 text-blue-500 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-200 transition-colors"
                title="Clear selection"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Simplified Bulk Actions - Only show when todos are selected */}
      {selectedTodos.length > 0 && (
        <div className="mt-4 p-4 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200">
              Bulk Actions
            </h3>
            <span className="text-sm text-gray-500 dark:text-gray-400">
              {selectedTodos.length} todo{selectedTodos.length !== 1 ? 's' : ''} selected
            </span>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
            {/* Complete */}
            <button
              onClick={() => handleBulkAction('complete')}
              disabled={actionLoading}
              className="flex flex-col items-center space-y-2 p-3 rounded-lg border border-green-200 dark:border-green-800 bg-green-50 dark:bg-green-900/20 hover:bg-green-100 dark:hover:bg-green-900/30 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <CheckCircle className="w-6 h-6 text-green-600 dark:text-green-400" />
              <span className="text-sm font-medium text-green-700 dark:text-green-300">Complete</span>
            </button>

            {/* In Progress */}
            <button
              onClick={() => handleBulkAction('in-progress')}
              disabled={actionLoading}
              className="flex flex-col items-center space-y-2 p-3 rounded-lg border border-yellow-200 dark:border-yellow-800 bg-yellow-50 dark:bg-yellow-900/20 hover:bg-yellow-100 dark:hover:bg-yellow-900/30 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Clock className="w-6 h-6 text-yellow-600 dark:text-yellow-400" />
              <span className="text-sm font-medium text-yellow-700 dark:text-yellow-300">In Progress</span>
            </button>

            {/* Priority */}
            <button
              onClick={() => setShowPriorityModal(true)}
              disabled={actionLoading}
              className="flex flex-col items-center space-y-2 p-3 rounded-lg border border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-900/20 hover:bg-blue-100 dark:hover:bg-blue-900/30 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Flag className="w-6 h-6 text-blue-600 dark:text-blue-400" />
              <span className="text-sm font-medium text-blue-700 dark:text-blue-300">Priority</span>
            </button>

            {/* Category */}
            <button
              onClick={() => setShowCategoryModal(true)}
              disabled={actionLoading}
              className="flex flex-col items-center space-y-2 p-3 rounded-lg border border-purple-200 dark:border-purple-800 bg-purple-50 dark:bg-purple-900/20 hover:bg-purple-100 dark:hover:bg-purple-900/30 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Tag className="w-6 h-6 text-purple-600 dark:text-purple-400" />
              <span className="text-sm font-medium text-purple-700 dark:text-purple-300">Category</span>
            </button>

            {/* Delete */}
            <button
              onClick={() => handleBulkAction('delete')}
              disabled={actionLoading}
              className="flex flex-col items-center space-y-2 p-3 rounded-lg border border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/20 hover:bg-red-100 dark:hover:bg-red-900/30 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Trash2 className="w-6 h-6 text-red-600 dark:text-red-400" />
              <span className="text-sm font-medium text-red-700 dark:text-red-300">Delete</span>
            </button>
          </div>

          {/* Loading indicator */}
          {actionLoading && (
            <div className="mt-4 flex items-center justify-center space-x-2 text-sm text-gray-600 dark:text-gray-400">
              <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
              <span>Processing {selectedTodos.length} todo{selectedTodos.length !== 1 ? 's' : ''}...</span>
            </div>
          )}
        </div>
      )}

      {/* Priority Selection Modal */}
      {showPriorityModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-md w-full mx-4">
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
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-md w-full mx-4">
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
    </div>
  );
};

export default BulkOperations;