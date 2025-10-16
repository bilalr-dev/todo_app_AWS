// Todo management routes for v0.6 - Optimized Architecture
const express = require('express');
const Todo = require('../models/Todo');
const TodoService = require('../services/TodoService');
const { authenticateToken } = require('../middleware/auth');
const { 
  validateTodoCreation, 
  validateTodoUpdate, 
  validateBulkOperations, 
  validateSearch 
} = require('../middleware/validation');
const { logger } = require('../utils/logger');

const router = express.Router();

// Get all todos for authenticated user
router.get('/', authenticateToken, async (req, res) => {
  try {
    const { 
      status, 
      priority, 
      category, 
      limit = 50, 
      offset = 0, 
      orderBy = 'created_at', 
      orderDirection = 'DESC' 
    } = req.query;

    const options = {
      status,
      priority,
      category,
      limit: parseInt(limit),
      offset: parseInt(offset),
      orderBy,
      orderDirection: orderDirection.toUpperCase()
    };

    const { todos, pagination } = await Todo.findWithAttachments(req.user.id, {
      page: Math.floor(offset / limit) + 1,
      limit,
      sortBy: orderBy,
      sortDirection: orderDirection
    });
    const total = pagination.total;

    logger.info('Todos fetched', { userId: req.user.id, count: todos.length });

    res.json({
      success: true,
      data: {
        todos,
        pagination: {
          total,
          limit: options.limit,
          offset: options.offset,
          hasMore: options.offset + options.limit < total
        }
      },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    logger.error('Error fetching todos', { error: error.message, userId: req.user.id });
    res.status(500).json({
      success: false,
      error: {
        code: 'FETCH_ERROR',
        message: 'Failed to fetch todos'
      },
      timestamp: new Date().toISOString()
    });
  }
});

// Get todo statistics
router.get('/stats', authenticateToken, async (req, res) => {
  try {
    const stats = await TodoService.getStats(req.user.id);

    logger.info('Todo stats fetched', { userId: req.user.id });

    res.json({
      success: true,
      data: { stats },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    logger.error('Error fetching todo stats', { error: error.message, userId: req.user.id });
    res.status(500).json({
      success: false,
      error: {
        code: 'STATS_ERROR',
        message: 'Failed to fetch todo statistics'
      },
      timestamp: new Date().toISOString()
    });
  }
});

// Get specific todo
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const todoId = parseInt(req.params.id);
    
    if (isNaN(todoId)) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_ID',
          message: 'Invalid todo ID'
        },
        timestamp: new Date().toISOString()
      });
    }

    const todo = await Todo.findById(todoId);
    
    if (!todo) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'TODO_NOT_FOUND',
          message: 'Todo not found'
        },
        timestamp: new Date().toISOString()
      });
    }

    // Check if user owns this todo
    if (todo.user_id !== req.user.id) {
      return res.status(403).json({
        success: false,
        error: {
          code: 'ACCESS_DENIED',
          message: 'You do not have permission to access this todo'
        },
        timestamp: new Date().toISOString()
      });
    }

    logger.info('Todo fetched', { todoId, userId: req.user.id });

    res.json({
      success: true,
      data: { todo },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    logger.error('Error fetching todo', { error: error.message, todoId: req.params.id, userId: req.user.id });
    res.status(500).json({
      success: false,
      error: {
        code: 'FETCH_ERROR',
        message: 'Failed to fetch todo'
      },
      timestamp: new Date().toISOString()
    });
  }
});

// Create new todo
router.post('/', authenticateToken, validateTodoCreation, async (req, res) => {
  try {
    const todoData = {
      ...req.body,
      user_id: req.user.id
    };

    const todo = await TodoService.createTodo(todoData);
    
    // Fetch attachments for the created todo
    const attachments = await todo.getAttachments();
    todo.attachments = attachments;

    logger.info('Todo created', { todoId: todo.id, userId: req.user.id });

    res.status(201).json({
      success: true,
      message: 'Todo created successfully',
      data: { todo },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    logger.error('Error creating todo', { error: error.message, userId: req.user.id });
    res.status(500).json({
      success: false,
      error: {
        code: 'CREATE_ERROR',
        message: 'Failed to create todo'
      },
      timestamp: new Date().toISOString()
    });
  }
});

// Update todo
router.put('/:id', authenticateToken, validateTodoUpdate, async (req, res) => {
  try {
    const todoId = parseInt(req.params.id);
    
    if (isNaN(todoId)) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_ID',
          message: 'Invalid todo ID'
        },
        timestamp: new Date().toISOString()
      });
    }

    const todo = await Todo.findById(todoId);
    
    if (!todo) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'TODO_NOT_FOUND',
          message: 'Todo not found'
        },
        timestamp: new Date().toISOString()
      });
    }

    // Check if user owns this todo
    if (todo.user_id !== req.user.id) {
      return res.status(403).json({
        success: false,
        error: {
          code: 'ACCESS_DENIED',
          message: 'You do not have permission to update this todo'
        },
        timestamp: new Date().toISOString()
      });
    }

    const updatedTodo = await TodoService.updateTodo(todoId, req.body);
    
    // Fetch attachments for the updated todo
    const attachments = await updatedTodo.getAttachments();
    updatedTodo.attachments = attachments;

    logger.info('Todo updated', { todoId, userId: req.user.id });

    res.json({
      success: true,
      message: 'Todo updated successfully',
      data: { todo: updatedTodo },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    logger.error('Error updating todo', { error: error.message, todoId: req.params.id, userId: req.user.id });
    res.status(500).json({
      success: false,
      error: {
        code: 'UPDATE_ERROR',
        message: 'Failed to update todo'
      },
      timestamp: new Date().toISOString()
    });
  }
});

// Delete todo
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const todoId = parseInt(req.params.id);
    
    if (isNaN(todoId)) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_ID',
          message: 'Invalid todo ID'
        },
        timestamp: new Date().toISOString()
      });
    }

    const todo = await Todo.findById(todoId);
    
    if (!todo) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'TODO_NOT_FOUND',
          message: 'Todo not found'
        },
        timestamp: new Date().toISOString()
      });
    }

    // Check if user owns this todo
    if (todo.user_id !== req.user.id) {
      return res.status(403).json({
        success: false,
        error: {
          code: 'ACCESS_DENIED',
          message: 'You do not have permission to delete this todo'
        },
        timestamp: new Date().toISOString()
      });
    }

    await TodoService.deleteTodo(todoId);

    logger.info('Todo deleted', { todoId, userId: req.user.id });

    res.json({
      success: true,
      message: 'Todo deleted successfully',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    logger.error('Error deleting todo', { error: error.message, todoId: req.params.id, userId: req.user.id });
    res.status(500).json({
      success: false,
      error: {
        code: 'DELETE_ERROR',
        message: 'Failed to delete todo'
      },
      timestamp: new Date().toISOString()
    });
  }
});

// Toggle todo completion
router.patch('/:id/toggle', authenticateToken, async (req, res) => {
  try {
    const todoId = parseInt(req.params.id);
    
    if (isNaN(todoId)) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_ID',
          message: 'Invalid todo ID'
        },
        timestamp: new Date().toISOString()
      });
    }

    const todo = await Todo.findById(todoId);
    
    if (!todo) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'TODO_NOT_FOUND',
          message: 'Todo not found'
        },
        timestamp: new Date().toISOString()
      });
    }

    // Check if user owns this todo
    if (todo.user_id !== req.user.id) {
      return res.status(403).json({
        success: false,
        error: {
          code: 'ACCESS_DENIED',
          message: 'You do not have permission to modify this todo'
        },
        timestamp: new Date().toISOString()
      });
    }

    const updatedTodo = await TodoService.toggleComplete(todoId);

    logger.info('Todo completion toggled', { todoId, userId: req.user.id, status: updatedTodo.status });

    res.json({
      success: true,
      message: 'Todo completion status updated',
      data: { todo: updatedTodo },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    logger.error('Error toggling todo completion', { error: error.message, todoId: req.params.id, userId: req.user.id });
    res.status(500).json({
      success: false,
      error: {
        code: 'TOGGLE_ERROR',
        message: 'Failed to toggle todo completion'
      },
      timestamp: new Date().toISOString()
    });
  }
});

// Search todos
router.post('/search', authenticateToken, validateSearch, async (req, res) => {
  try {
    const { query, limit = 50, offset = 0 } = req.body;

    const todos = await Todo.search(req.user.id, query, { limit, offset });

    logger.info('Todos searched', { userId: req.user.id, query, count: todos.length });

    res.json({
      success: true,
      data: {
        todos,
        query,
        pagination: {
          limit,
          offset,
          hasMore: todos.length === limit
        }
      },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    logger.error('Error searching todos', { error: error.message, userId: req.user.id });
    res.status(500).json({
      success: false,
      error: {
        code: 'SEARCH_ERROR',
        message: 'Failed to search todos'
      },
      timestamp: new Date().toISOString()
    });
  }
});

// Bulk operations
router.post('/bulk', authenticateToken, validateBulkOperations, async (req, res) => {
  try {
    const { todoIds, operation, updateData } = req.body;

    // Verify all todos belong to the user
    const todos = await Promise.all(todoIds.map(id => Todo.findById(id)));
    const invalidTodos = todos.filter(todo => !todo || todo.user_id !== req.user.id);
    
    if (invalidTodos.length > 0) {
      return res.status(403).json({
        success: false,
        error: {
          code: 'ACCESS_DENIED',
          message: 'You do not have permission to modify some of these todos'
        },
        timestamp: new Date().toISOString()
      });
    }

    let result;
    switch (operation) {
      case 'delete':
        result = await TodoService.bulkDelete(todoIds);
        break;
      case 'complete':
        result = await TodoService.bulkUpdate(todoIds, { status: 'completed' });
        break;
      case 'uncomplete':
        result = await TodoService.bulkUpdate(todoIds, { status: 'pending' });
        break;
      case 'update':
        result = await TodoService.bulkUpdate(todoIds, updateData);
        break;
      default:
        return res.status(400).json({
          success: false,
          error: {
            code: 'INVALID_OPERATION',
            message: 'Invalid bulk operation'
          },
          timestamp: new Date().toISOString()
        });
    }

    logger.info('Bulk operation completed', { userId: req.user.id, operation, count: todoIds.length });

    res.json({
      success: true,
      message: `Bulk ${operation} completed successfully`,
      data: {
        operation,
        affectedCount: Array.isArray(result) ? result.length : result,
        todoIds
      },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    logger.error('Error in bulk operation', { error: error.message, userId: req.user.id });
    res.status(500).json({
      success: false,
      error: {
        code: 'BULK_ERROR',
        message: 'Failed to perform bulk operation'
      },
      timestamp: new Date().toISOString()
    });
  }
});

module.exports = router;