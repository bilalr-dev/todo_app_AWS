// Bulk operations routes for v0.6 - Optimized Architecture
const express = require('express');
const { authenticateToken } = require('../middleware/auth');
const TodoService = require('../services/TodoService');
const { logger } = require('../utils/logger');

const router = express.Router();

// Bulk update todos
router.patch('/todos', authenticateToken, async (req, res) => {
  try {
    const { todoIds, updates } = req.body;
    const userId = req.user.id;

    if (!todoIds || !Array.isArray(todoIds) || todoIds.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Todo IDs array is required'
      });
    }

    if (!updates || Object.keys(updates).length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Updates object is required'
      });
    }

    // Validate allowed update fields
    const allowedFields = ['priority', 'category', 'status', 'due_date'];
    const updateFields = Object.keys(updates).filter(field => allowedFields.includes(field));
    
    if (updateFields.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No valid update fields provided'
      });
    }

    // Verify all todos belong to the user and perform bulk update
    const validUpdates = {};
    updateFields.forEach(field => {
      validUpdates[field] = updates[field];
    });

    const result = await TodoService.bulkUpdate(todoIds, validUpdates);

    logger.info(`Bulk update completed: ${result.length} todos updated by user ${userId}`);

    res.json({
      success: true,
      message: `${result.length} todos updated successfully`,
      updatedTodos: result,
      updateFields
    });
  } catch (error) {
    logger.error('Error in bulk update:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating todos',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// Bulk delete todos
router.delete('/todos', authenticateToken, async (req, res) => {
  try {
    const { todoIds } = req.body;
    const userId = req.user.id;

    if (!todoIds || !Array.isArray(todoIds) || todoIds.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Todo IDs array is required'
      });
    }

    // Perform bulk delete
    const deletedCount = await TodoService.bulkDelete(todoIds);

    logger.info(`Bulk delete completed: ${deletedCount} todos deleted by user ${userId}`);

    res.json({
      success: true,
      message: `${deletedCount} todos deleted successfully`,
      deletedCount
    });
  } catch (error) {
    logger.error('Error in bulk delete:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting todos',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// Bulk update todo state (unified route for all states)
router.patch('/todos/state', authenticateToken, async (req, res) => {
  try {
    const { todoIds, state } = req.body;
    const userId = req.user.id;

    // Validate input
    if (!todoIds || !Array.isArray(todoIds) || todoIds.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Todo IDs array is required'
      });
    }

    if (!state || !['pending', 'in_progress', 'completed'].includes(state)) {
      return res.status(400).json({
        success: false,
        message: 'Valid state is required (pending, in_progress, or completed)'
      });
    }

    // Verify all todos belong to the user and check their current state
    const { query } = require('../config/database');
    const verifyResult = await query(
      `SELECT id, status FROM todos WHERE id = ANY($1) AND user_id = $2`,
      [todoIds, userId]
    );

    if (verifyResult.rows.length !== todoIds.length) {
      return res.status(403).json({
        success: false,
        message: 'Some todos do not belong to you or do not exist'
      });
    }

    // Forward-only movement validation
    if (state !== 'completed') {
      const completedTodos = verifyResult.rows.filter(todo => todo.status === 'completed');
      if (completedTodos.length > 0) {
        return res.status(400).json({
          success: false,
          message: `Cannot move completed todos to ${state} - forward-only movement is enforced`,
          completedTodoIds: completedTodos.map(t => t.id)
        });
      }
    }

    // Build the update query based on the target state
    let updateQuery;
    let queryParams;
    let logMessage;
    let responseField;

    switch (state) {
      case 'completed':
        updateQuery = `UPDATE todos 
                      SET status = 'completed', completed_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP
                      WHERE id = ANY($1) AND user_id = $2
                      RETURNING *`;
        queryParams = [todoIds, userId];
        logMessage = `Bulk complete: ${todoIds.length} todos marked as completed by user ${userId}`;
        responseField = 'completedTodos';
        break;

      case 'in_progress':
        updateQuery = `UPDATE todos 
                      SET status = 'in_progress', started_at = CASE WHEN started_at IS NULL THEN CURRENT_TIMESTAMP ELSE started_at END, updated_at = CURRENT_TIMESTAMP
                      WHERE id = ANY($1) AND user_id = $2 AND status != 'completed'
                      RETURNING *`;
        queryParams = [todoIds, userId];
        logMessage = `Bulk in-progress: ${todoIds.length} todos marked as in-progress by user ${userId}`;
        responseField = 'inProgressTodos';
        break;

      case 'pending':
        updateQuery = `UPDATE todos 
                      SET status = 'pending', updated_at = CURRENT_TIMESTAMP
                      WHERE id = ANY($1) AND user_id = $2 AND status != 'completed'
                      RETURNING *`;
        queryParams = [todoIds, userId];
        logMessage = `Bulk pending: ${todoIds.length} todos marked as pending by user ${userId}`;
        responseField = 'pendingTodos';
        break;
    }

    // Execute the update
    const result = await query(updateQuery, queryParams);

    logger.info(logMessage);

    res.json({
      success: true,
      message: `${result.rows.length} todos marked as ${state}`,
      [responseField]: result.rows
    });
  } catch (error) {
    logger.error(`Error in bulk state update to ${req.body.state}:`, error);
    res.status(500).json({
      success: false,
      message: `Error updating todos to ${req.body.state}`,
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// Bulk update priority
router.patch('/todos/priority', authenticateToken, async (req, res) => {
  try {
    const { todoIds, priority } = req.body;
    const userId = req.user.id;

    if (!todoIds || !Array.isArray(todoIds) || todoIds.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Todo IDs array is required'
      });
    }

    if (!priority || !['low', 'medium', 'high'].includes(priority)) {
      return res.status(400).json({
        success: false,
        message: 'Valid priority (low, medium, high) is required'
      });
    }

    // Verify all todos belong to the user
    const { query } = require('../config/database');
    const verifyResult = await query(
      `SELECT id FROM todos WHERE id = ANY($1) AND user_id = $2`,
      [todoIds, userId]
    );

    if (verifyResult.rows.length !== todoIds.length) {
      return res.status(403).json({
        success: false,
        message: 'Some todos do not belong to you or do not exist'
      });
    }

    // Update priority
    const result = await query(
      `UPDATE todos 
       SET priority = $3, updated_at = CURRENT_TIMESTAMP
       WHERE id = ANY($1) AND user_id = $2
       RETURNING *`,
      [todoIds, userId, priority]
    );

    logger.info(`Bulk priority update: ${result.rows.length} todos updated to ${priority} by user ${userId}`);

    res.json({
      success: true,
      message: `${result.rows.length} todos priority updated to ${priority}`,
      updatedTodos: result.rows
    });
  } catch (error) {
    logger.error('Error in bulk priority update:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating todos priority',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// Bulk update category
router.patch('/todos/category', authenticateToken, async (req, res) => {
  try {
    const { todoIds, category } = req.body;
    const userId = req.user.id;

    if (!todoIds || !Array.isArray(todoIds) || todoIds.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Todo IDs array is required'
      });
    }

    if (!category || typeof category !== 'string' || category.trim().length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Valid category is required'
      });
    }

    // Verify all todos belong to the user
    const { query } = require('../config/database');
    const verifyResult = await query(
      `SELECT id FROM todos WHERE id = ANY($1) AND user_id = $2`,
      [todoIds, userId]
    );

    if (verifyResult.rows.length !== todoIds.length) {
      return res.status(403).json({
        success: false,
        message: 'Some todos do not belong to you or do not exist'
      });
    }

    // Update category
    const result = await query(
      `UPDATE todos 
       SET category = $3, updated_at = CURRENT_TIMESTAMP
       WHERE id = ANY($1) AND user_id = $2
       RETURNING *`,
      [todoIds, userId, category.trim()]
    );

    logger.info(`Bulk category update: ${result.rows.length} todos updated to category "${category}" by user ${userId}`);

    res.json({
      success: true,
      message: `${result.rows.length} todos category updated to "${category}"`,
      updatedTodos: result.rows
    });
  } catch (error) {
    logger.error('Error in bulk category update:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating todos category',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

module.exports = router;
