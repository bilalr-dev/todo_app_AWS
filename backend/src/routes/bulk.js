// Bulk operations routes for v0.6
const express = require('express');
const { authenticateToken } = require('../middleware/auth');
const Todo = require('../models/Todo');
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
    const allowedFields = ['priority', 'category', 'completed', 'due_date', 'state'];
    const updateFields = Object.keys(updates).filter(field => allowedFields.includes(field));
    
    if (updateFields.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No valid update fields provided'
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

    // Build update query
    const setClause = updateFields.map((field, index) => `${field} = $${index + 3}`).join(', ');
    const params = [todoIds, userId, ...updateFields.map(field => updates[field])];

    const result = await query(
      `UPDATE todos 
       SET ${setClause}, updated_at = CURRENT_TIMESTAMP
       WHERE id = ANY($1) AND user_id = $2
       RETURNING id, title, ${updateFields.join(', ')}, updated_at`,
      params
    );

    logger.info(`Bulk update completed: ${result.rows.length} todos updated by user ${userId}`);

    res.json({
      success: true,
      message: `${result.rows.length} todos updated successfully`,
      updatedTodos: result.rows,
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

    // Verify all todos belong to the user
    const { query } = require('../config/database');
    const verifyResult = await query(
      `SELECT id, title FROM todos WHERE id = ANY($1) AND user_id = $2`,
      [todoIds, userId]
    );

    if (verifyResult.rows.length !== todoIds.length) {
      return res.status(403).json({
        success: false,
        message: 'Some todos do not belong to you or do not exist'
      });
    }

    // Delete todos (cascade will handle file attachments)
    const result = await query(
      `DELETE FROM todos WHERE id = ANY($1) AND user_id = $2
       RETURNING id, title`,
      [todoIds, userId]
    );

    logger.info(`Bulk delete completed: ${result.rows.length} todos deleted by user ${userId}`);

    res.json({
      success: true,
      message: `${result.rows.length} todos deleted successfully`,
      deletedTodos: result.rows
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

// Bulk mark as completed
router.patch('/todos/complete', authenticateToken, async (req, res) => {
  try {
    const { todoIds } = req.body;
    const userId = req.user.id;

    if (!todoIds || !Array.isArray(todoIds) || todoIds.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Todo IDs array is required'
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

          // Mark todos as completed
          const result = await query(
            `UPDATE todos 
             SET completed = true, state = 'complete', updated_at = CURRENT_TIMESTAMP
             WHERE id = ANY($1) AND user_id = $2
             RETURNING id, title, completed, state, updated_at`,
            [todoIds, userId]
          );

    logger.info(`Bulk complete: ${result.rows.length} todos marked as completed by user ${userId}`);

    res.json({
      success: true,
      message: `${result.rows.length} todos marked as completed`,
      completedTodos: result.rows
    });
  } catch (error) {
    logger.error('Error in bulk complete:', error);
    res.status(500).json({
      success: false,
      message: 'Error completing todos',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// Bulk mark as pending
router.patch('/todos/pending', authenticateToken, async (req, res) => {
  try {
    const { todoIds } = req.body;
    const userId = req.user.id;

    if (!todoIds || !Array.isArray(todoIds) || todoIds.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Todo IDs array is required'
      });
    }

    // Verify all todos belong to the user and check their current state
    const { query } = require('../config/database');
    const verifyResult = await query(
      `SELECT id, completed, state FROM todos WHERE id = ANY($1) AND user_id = $2`,
      [todoIds, userId]
    );

    if (verifyResult.rows.length !== todoIds.length) {
      return res.status(403).json({
        success: false,
        message: 'Some todos do not belong to you or do not exist'
      });
    }

    // Check if any todos are already completed (forward-only rule)
    const completedTodos = verifyResult.rows.filter(todo => todo.completed || todo.state === 'complete');
    if (completedTodos.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Cannot move completed todos to in-progress - forward-only movement is enforced',
        completedTodoIds: completedTodos.map(t => t.id)
      });
    }

    // Mark todos as pending (in-progress) - only non-completed todos
    const result = await query(
      `UPDATE todos 
       SET completed = false, state = 'inProgress', updated_at = CURRENT_TIMESTAMP
       WHERE id = ANY($1) AND user_id = $2 AND (completed = false OR state != 'complete')
       RETURNING id, title, completed, state, updated_at`,
      [todoIds, userId]
    );

    logger.info(`Bulk pending: ${result.rows.length} todos marked as pending by user ${userId}`);

    res.json({
      success: true,
      message: `${result.rows.length} todos marked as pending`,
      pendingTodos: result.rows
    });
  } catch (error) {
    logger.error('Error in bulk pending:', error);
    res.status(500).json({
      success: false,
      message: 'Error marking todos as pending',
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
       RETURNING id, title, priority, updated_at`,
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
       RETURNING id, title, category, updated_at`,
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
