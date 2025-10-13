// Todo model for database operations v0.5
const { query } = require('../config/database');
const { logger } = require('../utils/logger');

class Todo {
  constructor(data) {
    this.id = data.id;
    this.user_id = data.user_id;
    this.title = data.title;
    this.description = data.description;
    this.priority = data.priority;
    this.due_date = data.due_date;
    this.category = data.category;
    this.position = data.position;
    this.completed = data.completed;
    this.created_at = data.created_at;
    this.updated_at = data.updated_at;
  }

  // Create a new todo
  static async create(todoData) {
    try {
      const { user_id, title, description, priority, due_date, category } = todoData;
      
      const result = await query(
        `INSERT INTO todos (user_id, title, description, priority, due_date, category) 
         VALUES ($1, $2, $3, $4, $5, $6) 
         RETURNING *`,
        [user_id, title, description, priority || 'medium', due_date, category]
      );
      
      logger.info('Todo created successfully', { todoId: result.rows[0].id, userId: user_id });
      return new Todo(result.rows[0]);
    } catch (error) {
      logger.error('Error creating todo', { error: error.message, userId: todoData.user_id });
      throw error;
    }
  }

  // Find todo by ID
  static async findById(id) {
    try {
      const result = await query(
        'SELECT * FROM todos WHERE id = $1',
        [id]
      );
      
      if (result.rows.length === 0) {
        return null;
      }
      
      return new Todo(result.rows[0]);
    } catch (error) {
      logger.error('Error finding todo by ID', { error: error.message, todoId: id });
      throw error;
    }
  }

  // Find todos by user ID
  static async findByUserId(userId, options = {}) {
    try {
      const { 
        completed, 
        priority, 
        category, 
        limit = 50, 
        offset = 0, 
        orderBy = 'created_at', 
        orderDirection = 'DESC' 
      } = options;

      let whereClause = 'WHERE user_id = $1';
      const values = [userId];
      let paramCount = 1;

      if (completed !== undefined) {
        paramCount++;
        whereClause += ` AND completed = $${paramCount}`;
        values.push(completed);
      }

      if (priority) {
        paramCount++;
        whereClause += ` AND priority = $${paramCount}`;
        values.push(priority);
      }

      if (category) {
        paramCount++;
        whereClause += ` AND category = $${paramCount}`;
        values.push(category);
      }

      paramCount++;
      const limitClause = `LIMIT $${paramCount}`;
      values.push(limit);

      paramCount++;
      const offsetClause = `OFFSET $${paramCount}`;
      values.push(offset);

      const result = await query(
        `SELECT * FROM todos ${whereClause} ORDER BY ${orderBy} ${orderDirection} ${limitClause} ${offsetClause}`,
        values
      );
      
      return result.rows.map(row => new Todo(row));
    } catch (error) {
      logger.error('Error finding todos by user ID', { error: error.message, userId });
      throw error;
    }
  }

  // Update todo
  async update(updateData) {
    try {
      const allowedFields = ['title', 'description', 'priority', 'due_date', 'category', 'completed', 'position'];
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

      values.push(this.id);
      const result = await query(
        `UPDATE todos SET ${updates.join(', ')}, updated_at = CURRENT_TIMESTAMP 
         WHERE id = $${paramCount} 
         RETURNING *`,
        values
      );

      // Update instance properties
      Object.assign(this, result.rows[0]);
      
      logger.info('Todo updated successfully', { todoId: this.id });
      return this;
    } catch (error) {
      logger.error('Error updating todo', { error: error.message, todoId: this.id });
      throw error;
    }
  }

  // Delete todo
  async delete() {
    try {
      await query('DELETE FROM todos WHERE id = $1', [this.id]);
      logger.info('Todo deleted successfully', { todoId: this.id });
      return true;
    } catch (error) {
      logger.error('Error deleting todo', { error: error.message, todoId: this.id });
      throw error;
    }
  }

  // Toggle completion status
  async toggleComplete() {
    try {
      const result = await query(
        'UPDATE todos SET completed = NOT completed, updated_at = CURRENT_TIMESTAMP WHERE id = $1 RETURNING *',
        [this.id]
      );

      this.completed = result.rows[0].completed;
      this.updated_at = result.rows[0].updated_at;
      
      logger.info('Todo completion toggled', { todoId: this.id, completed: this.completed });
      return this;
    } catch (error) {
      logger.error('Error toggling todo completion', { error: error.message, todoId: this.id });
      throw error;
    }
  }

  // Bulk operations
  static async bulkUpdate(todoIds, updateData) {
    try {
      const allowedFields = ['completed', 'priority', 'category'];
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

  // Search todos
  static async search(userId, searchTerm, options = {}) {
    try {
      const { limit = 50, offset = 0 } = options;
      
      const result = await query(
        `SELECT * FROM todos 
         WHERE user_id = $1 AND (title ILIKE $2 OR description ILIKE $2) 
         ORDER BY created_at DESC 
         LIMIT $3 OFFSET $4`,
        [userId, `%${searchTerm}%`, limit, offset]
      );
      
      return result.rows.map(row => new Todo(row));
    } catch (error) {
      logger.error('Error searching todos', { error: error.message, userId, searchTerm });
      throw error;
    }
  }

  // Get todos by due date range
  static async findByDueDateRange(userId, startDate, endDate) {
    try {
      const result = await query(
        `SELECT * FROM todos 
         WHERE user_id = $1 AND due_date BETWEEN $2 AND $3 
         ORDER BY due_date ASC`,
        [userId, startDate, endDate]
      );
      
      return result.rows.map(row => new Todo(row));
    } catch (error) {
      logger.error('Error finding todos by due date range', { error: error.message, userId });
      throw error;
    }
  }

  // Count todos by user
  static async countByUserId(userId, options = {}) {
    try {
      const { completed, priority, category } = options;
      
      let whereClause = 'WHERE user_id = $1';
      const values = [userId];
      let paramCount = 1;

      if (completed !== undefined) {
        paramCount++;
        whereClause += ` AND completed = $${paramCount}`;
        values.push(completed);
      }

      if (priority) {
        paramCount++;
        whereClause += ` AND priority = $${paramCount}`;
        values.push(priority);
      }

      if (category) {
        paramCount++;
        whereClause += ` AND category = $${paramCount}`;
        values.push(category);
      }

      const result = await query(
        `SELECT COUNT(*) as count FROM todos ${whereClause}`,
        values
      );
      
      return parseInt(result.rows[0].count);
    } catch (error) {
      logger.error('Error counting todos by user ID', { error: error.message, userId });
      throw error;
    }
  }

  // Get todo statistics for user
  static async getStats(userId) {
    try {
      const result = await query(
        `SELECT 
           COUNT(*) as total,
           COUNT(CASE WHEN completed = true THEN 1 END) as completed,
           COUNT(CASE WHEN completed = false THEN 1 END) as pending,
           COUNT(CASE WHEN priority = 'high' THEN 1 END) as high_priority,
           COUNT(CASE WHEN due_date < CURRENT_TIMESTAMP AND completed = false THEN 1 END) as overdue
         FROM todos WHERE user_id = $1`,
        [userId]
      );
      
      // Convert string counts to integers
      const stats = result.rows[0];
      return {
        total: parseInt(stats.total),
        completed: parseInt(stats.completed),
        pending: parseInt(stats.pending),
        high_priority: parseInt(stats.high_priority),
        overdue: parseInt(stats.overdue)
      };
    } catch (error) {
      logger.error('Error getting todo stats', { error: error.message, userId });
      throw error;
    }
  }
}

module.exports = Todo;