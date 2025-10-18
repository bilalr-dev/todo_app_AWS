// TodoService - Business logic for todo operations v0.6 - Optimized Architecture
const Todo = require('../models/Todo');
const { query } = require('../config/database');
const { logger } = require('../utils/logger');

class TodoService {
  // Create a new todo
  static async createTodo(todoData) {
    try {
      const { user_id, title, description, priority, due_date, category, state, _createdWithFiles } = todoData;
      
      const result = await query(
        `INSERT INTO todos (user_id, title, description, priority, due_date, category, state) 
         VALUES ($1, $2, $3, $4, $5, $6, $7) 
         RETURNING *`,
        [user_id, title, description, priority || 'medium', due_date, category, state || 'todo']
      );
      
      // Create todo object and add the flag
      const todo = new Todo(result.rows[0]);
      if (_createdWithFiles) {
        todo._createdWithFiles = true;
      }
      
      logger.info('Todo created successfully', { todoId: result.rows[0].id, userId: user_id });
      return todo;
    } catch (error) {
      logger.error('Error creating todo', { error: error.message, userId: todoData.user_id });
      throw error;
    }
  }

  // Update todo with forward-only workflow validation
  static async updateTodo(todoId, updateData) {
    try {
      const todo = await Todo.findById(todoId);
      if (!todo) {
        throw new Error('Todo not found');
      }

      const allowedFields = ['title', 'description', 'priority', 'due_date', 'category', 'position', 'state'];
      const updates = [];
      const values = [];
      let paramCount = 1;

      // Handle status field updates
      if (updateData.state !== undefined) {
        const currentStatus = todo.state;
        const newStatus = updateData.state;
        
        // Define allowed status transitions (forward-only)
        const allowedTransitions = {
          'todo': ['inProgress', 'complete'],
          'pending': ['in_progress', 'completed'], // Backward compatibility
          'inProgress': ['complete'],
          'in_progress': ['completed'], // Backward compatibility
          'complete': [], // No transitions allowed from completed
          'completed': [] // Backward compatibility
        };
        
        // Allow keeping the same status (for updates that don't change status)
        if (currentStatus !== newStatus && !allowedTransitions[currentStatus]?.includes(newStatus)) {
          throw new Error(`Cannot move todo from ${currentStatus} to ${newStatus} - forward-only movement is enforced`);
        }
        
        // Handle status transition timestamps
        if (currentStatus !== newStatus) {
          if ((newStatus === 'inProgress' || newStatus === 'in_progress') && !todo.started_at) {
            // First time moving to in_progress - set started_at
            updates.push('started_at = CURRENT_TIMESTAMP');
          } else if ((newStatus === 'complete' || newStatus === 'completed') && !todo.completed_at) {
            // First time moving to completed - set completed_at
            updates.push('completed_at = CURRENT_TIMESTAMP');
          }
        }
      }

      for (const [key, value] of Object.entries(updateData)) {
        if (allowedFields.includes(key)) {
          updates.push(`${key} = $${paramCount}`);
          values.push(value);
          paramCount++;
        }
      }

      if (updates.length === 0) {
        throw new Error('No valid fields to update');
      }

      values.push(todoId);
      const result = await query(
        `UPDATE todos SET ${updates.join(', ')}, updated_at = CURRENT_TIMESTAMP 
         WHERE id = $${paramCount} 
         RETURNING *`,
        values
      );

      logger.info('Todo updated successfully', { todoId });
      return new Todo(result.rows[0]);
    } catch (error) {
      logger.error('Error updating todo', { error: error.message, todoId });
      throw error;
    }
  }

  // Delete todo
  static async deleteTodo(todoId) {
    try {
      await query('DELETE FROM todos WHERE id = $1', [todoId]);
      logger.info('Todo deleted successfully', { todoId });
      return true;
    } catch (error) {
      logger.error('Error deleting todo', { error: error.message, todoId });
      throw error;
    }
  }

  // Toggle completion status (forward-only: can only mark as completed, cannot unmark)
  static async toggleComplete(todoId) {
    try {
      // Get current status to determine if toggle is allowed
      const currentResult = await Todo.query(
        'SELECT state FROM todos WHERE id = $1',
        [todoId]
      );
      
      if (currentResult.rows.length === 0) {
        throw new Error('Todo not found');
      }
      
      const currentStatus = currentResult.rows[0].state;
      
      // Only allow marking as completed, not unmarking
      if (currentStatus === 'complete' || currentStatus === 'completed') {
        throw new Error('Cannot unmark completed todo - forward-only movement is enforced');
      }
      
      // Mark as completed
      const result = await query(
        'UPDATE todos SET state = $2, completed_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP WHERE id = $1 RETURNING *',
        [todoId, 'complete']
      );

      logger.info('Todo marked as completed', { 
        todoId, 
        state: result.rows[0].state,
        previousStatus: currentStatus 
      });
      return new Todo(result.rows[0]);
    } catch (error) {
      logger.error('Error toggling todo completion', { error: error.message, todoId });
      throw error;
    }
  }

  // Update todo status with validation
  static async updateStatus(todoId, newStatus) {
    try {
      const todo = await Todo.findById(todoId);
      if (!todo) {
        throw new Error('Todo not found');
      }

      const currentStatus = todo.state;
      
      // Define allowed status transitions (forward-only)
      const allowedTransitions = {
        'pending': ['in_progress', 'completed'],
        'in_progress': ['completed'],
        'completed': [] // No transitions allowed from completed
      };
      
      if (!allowedTransitions[currentStatus]?.includes(newStatus)) {
        throw new Error(`Cannot move todo from ${currentStatus} to ${newStatus} - forward-only movement is enforced`);
      }
      
      const updates = ['state = $2'];
      const values = [newStatus];
      let paramCount = 2;
      
      // Handle status transition timestamps
      if (newStatus === 'in_progress' && !todo.started_at) {
        updates.push('started_at = CURRENT_TIMESTAMP');
      } else if (newStatus === 'completed' && !todo.completed_at) {
        updates.push('completed_at = CURRENT_TIMESTAMP');
      }

      const result = await query(
        `UPDATE todos SET ${updates.join(', ')}, updated_at = CURRENT_TIMESTAMP 
         WHERE id = $1 
         RETURNING *`,
        [todoId, ...values]
      );

      logger.info('Todo status updated', { todoId, from: currentStatus, to: newStatus });
      return new Todo(result.rows[0]);
    } catch (error) {
      logger.error('Error updating todo status', { error: error.message, todoId });
      throw error;
    }
  }

  // Bulk operations
  static async bulkUpdate(todoIds, updateData) {
    try {
      const allowedFields = ['priority', 'category', 'state'];
      const updates = [];
      const values = [];
      let paramCount = 1;

      for (const [key, value] of Object.entries(updateData)) {
        if (allowedFields.includes(key)) {
          updates.push(`${key} = $${paramCount}`);
          values.push(value);
          paramCount++;
        }
      }

      if (updates.length === 0) {
        throw new Error('No valid fields to update');
      }

      // Add todo IDs to values
      const placeholders = todoIds.map((_, index) => `$${paramCount + index}`).join(',');
      values.push(...todoIds);

      const result = await query(
        `UPDATE todos SET ${updates.join(', ')}, updated_at = CURRENT_TIMESTAMP 
         WHERE id IN (${placeholders}) 
         RETURNING *`,
        values
      );
      
      logger.info('Bulk todo update completed', { count: result.rows.length });
      return result.rows.map(row => new Todo(row));
    } catch (error) {
      logger.error('Error in bulk todo update', { error: error.message });
      throw error;
    }
  }

  static async bulkDelete(todoIds) {
    try {
      const placeholders = todoIds.map((_, index) => `$${index + 1}`).join(',');
      const result = await query(
        `DELETE FROM todos WHERE id IN (${placeholders})`,
        todoIds
      );
      
      logger.info('Bulk todo deletion completed', { count: result.rowCount });
      return result.rowCount;
    } catch (error) {
      logger.error('Error in bulk todo deletion', { error: error.message });
      throw error;
    }
  }

  // Get todo statistics for user
  static async getStats(userId) {
    try {
      const result = await query(
        `SELECT 
           COUNT(*) as total,
           COUNT(CASE WHEN state = 'todo' THEN 1 END) as pending,
           COUNT(CASE WHEN state = 'inProgress' THEN 1 END) as in_progress,
           COUNT(CASE WHEN state = 'complete' THEN 1 END) as completed,
           COUNT(CASE WHEN priority = 'high' THEN 1 END) as high_priority,
           COUNT(CASE WHEN due_date < CURRENT_TIMESTAMP AND state != 'complete' THEN 1 END) as overdue
         FROM todos WHERE user_id = $1`,
        [userId]
      );
      
      // Convert string counts to integers
      const stats = result.rows[0];
      return {
        total: parseInt(stats.total),
        pending: parseInt(stats.pending),
        in_progress: parseInt(stats.in_progress),
        completed: parseInt(stats.completed),
        high_priority: parseInt(stats.high_priority),
        overdue: parseInt(stats.overdue)
      };
    } catch (error) {
      logger.error('Error getting todo stats', { error: error.message, userId });
      throw error;
    }
  }
}

module.exports = TodoService;
