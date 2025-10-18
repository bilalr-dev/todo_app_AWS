// Todo model for database operations v0.6 - Optimized Architecture
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
    this.state = data.state || 'todo'; // Consolidated: todo | inProgress | completed
    this.file_count = data.file_count || 0;
    this.attachments = data.attachments || [];
    this.created_at = data.created_at;
    this.updated_at = data.updated_at;
    this.started_at = data.started_at;
    this.completed_at = data.completed_at;
  }

  // Static query method for database operations
  static async query(sql, params = []) {
    return await query(sql, params);
  }

  // Find todo by ID
  static async findById(id) {
    try {
      const result = await Todo.query(
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
        status, 
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

      if (status) {
        paramCount++;
        whereClause += ` AND state = $${paramCount}`;
        values.push(status);
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

      const result = await Todo.query(
        `SELECT * FROM todos ${whereClause} ORDER BY ${orderBy} ${orderDirection} ${limitClause} ${offsetClause}`,
        values
      );
      
      return result.rows.map(row => new Todo(row));
    } catch (error) {
      logger.error('Error finding todos by user ID', { error: error.message, userId });
      throw error;
    }
  }

  // Search todos
  static async search(userId, searchTerm, options = {}) {
    try {
      const { limit = 50, offset = 0 } = options;
      
      const result = await Todo.query(
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
      const result = await Todo.query(
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
      const { status, priority, category } = options;
      
      let whereClause = 'WHERE user_id = $1';
      const values = [userId];
      let paramCount = 1;

      if (status) {
        paramCount++;
        whereClause += ` AND state = $${paramCount}`;
        values.push(status);
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

      const result = await Todo.query(
        `SELECT COUNT(*) as count FROM todos ${whereClause}`,
        values
      );
      
      return parseInt(result.rows[0].count);
    } catch (error) {
      logger.error('Error counting todos by user ID', { error: error.message, userId });
      throw error;
    }
  }

  // Get todos with file attachments
  static async findWithAttachments(userId, options = {}) {
    try {
      const {
        page = 1,
        limit = 10,
        search = null,
        priority = null,
        category = null,
        status = null,
        sortBy = 'created_at',
        sortDirection = 'DESC'
      } = options;

      const offset = (page - 1) * limit;
      let whereClause = 'WHERE t.user_id = $1';
      let params = [userId];
      let paramCount = 1;

      // Add search filter
      if (search) {
        paramCount++;
        whereClause += ` AND (t.title ILIKE $${paramCount} OR t.description ILIKE $${paramCount})`;
        params.push(`%${search}%`);
      }

      // Add priority filter
      if (priority) {
        paramCount++;
        whereClause += ` AND t.priority = $${paramCount}`;
        params.push(priority);
      }

      // Add category filter
      if (category) {
        paramCount++;
        whereClause += ` AND t.category = $${paramCount}`;
        params.push(category);
      }

      // Add status filter
      if (status) {
        paramCount++;
        whereClause += ` AND t.state = $${paramCount}`;
        params.push(status);
      }

      const result = await Todo.query(
        `SELECT t.*, 
                COALESCE(
                  json_agg(
                    json_build_object(
                      'id', fa.id,
                      'filename', fa.file_name,
                      'original_name', fa.original_name,
                      'file_path', fa.file_path,
                      'file_size', fa.file_size,
                      'mime_type', fa.mime_type,
                      'file_type', fa.file_type,
                      'thumbnail_path', fa.thumbnail_path,
                      'created_at', fa.created_at
                    )
                  ) FILTER (WHERE fa.id IS NOT NULL), 
                  '[]'
                ) as attachments
         FROM todos t
         LEFT JOIN file_attachments fa ON t.id = fa.todo_id
         ${whereClause}
         GROUP BY t.id
         ORDER BY t.${sortBy} ${sortDirection}
         LIMIT $${paramCount + 1} OFFSET $${paramCount + 2}`,
        [...params, limit, offset]
      );

      // Get total count
      const countResult = await Todo.query(
        `SELECT COUNT(DISTINCT t.id) as total
         FROM todos t
         ${whereClause}`,
        params
      );

      const total = parseInt(countResult.rows[0].total);
      const totalPages = Math.ceil(total / limit);

      return {
        todos: result.rows.map(row => new Todo(row)),
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          totalPages,
          hasNext: page < totalPages,
          hasPrev: page > 1
        }
      };
    } catch (error) {
      logger.error('Error finding todos with attachments', { error: error.message, userId });
      throw error;
    }
  }

  // Get file attachments for this todo
  async getAttachments() {
    try {
      const FileAttachment = require('./FileAttachment');
      return await FileAttachment.findByTodoId(this.id);
    } catch (error) {
      logger.error('Error getting attachments for todo', { error: error.message, todoId: this.id });
      throw error;
    }
  }

  // Advanced filtering with multiple criteria
  static async findWithAdvancedFilters(userId, options = {}) {
    try {
      console.log('findWithAdvancedFilters called with userId:', userId, 'options:', options);
      const {
        page = 1,
        limit = 10,
        search = null,
        priority = null,
        category = null,
        status = null,
        startDate = null,
        endDate = null,
        dueStartDate = null,
        dueEndDate = null,
        hasFiles = null,
        sortBy = 'created_at',
        sortDirection = 'DESC'
      } = options;

      const offset = (page - 1) * limit;
      let whereClause = 'WHERE t.user_id = $1';
      let params = [userId];
      let paramCount = 1;

      // Add search filter
      if (search) {
        paramCount++;
        whereClause += ` AND (t.title ILIKE $${paramCount} OR t.description ILIKE $${paramCount})`;
        params.push(`%${search}%`);
      }

      // Add priority filter (can be array)
      if (priority) {
        if (Array.isArray(priority)) {
          paramCount++;
          whereClause += ` AND t.priority = ANY($${paramCount})`;
          params.push(priority);
        } else {
          paramCount++;
          whereClause += ` AND t.priority = $${paramCount}`;
          params.push(priority);
        }
      }

      // Add category filter (can be array)
      if (category) {
        if (Array.isArray(category)) {
          paramCount++;
          whereClause += ` AND t.category = ANY($${paramCount})`;
          params.push(category);
        } else {
          paramCount++;
          whereClause += ` AND t.category = $${paramCount}`;
          params.push(category);
        }
      }

      // Add status filter (map to state)
      if (status && status !== 'all') {
        paramCount++;
        // Map status values to state values
        let stateValue = status;
        if (status === 'pending') stateValue = 'todo';
        if (status === 'completed') stateValue = 'completed';
        if (status === 'in_progress') stateValue = 'inProgress';
        
        whereClause += ` AND t.state = $${paramCount}`;
        params.push(stateValue);
      }

      // Add date range filters
      if (startDate) {
        paramCount++;
        whereClause += ` AND t.created_at >= $${paramCount}`;
        params.push(startDate);
      }

      if (endDate) {
        paramCount++;
        whereClause += ` AND t.created_at <= $${paramCount}`;
        params.push(endDate);
      }

      if (dueStartDate) {
        paramCount++;
        whereClause += ` AND t.due_date >= $${paramCount}`;
        params.push(dueStartDate);
      }

      if (dueEndDate) {
        paramCount++;
        whereClause += ` AND t.due_date <= $${paramCount}`;
        params.push(dueEndDate);
      }

      // Add file filter
      if (hasFiles === 'true') {
        whereClause += ` AND t.file_count > 0`;
      } else if (hasFiles === 'false') {
        whereClause += ` AND t.file_count = 0`;
      }

      // Validate sortBy
      const allowedSortFields = ['created_at', 'updated_at', 'due_date', 'title', 'priority', 'category'];
      const validSortBy = allowedSortFields.includes(sortBy) ? sortBy : 'created_at';
      const validSortDirection = ['ASC', 'DESC'].includes(sortDirection.toUpperCase()) ? sortDirection.toUpperCase() : 'DESC';

      const query = `SELECT t.*, 
                COALESCE(
                  json_agg(
                    json_build_object(
                      'id', fa.id,
                      'filename', fa.file_name,
                      'original_name', fa.original_name,
                      'file_path', fa.file_path,
                      'file_size', fa.file_size,
                      'mime_type', fa.mime_type,
                      'file_type', fa.file_type,
                      'thumbnail_path', fa.thumbnail_path,
                      'created_at', fa.created_at
                    )
                  ) FILTER (WHERE fa.id IS NOT NULL), 
                  '[]'
                ) as attachments
         FROM todos t
         LEFT JOIN file_attachments fa ON t.id = fa.todo_id
         ${whereClause}
         GROUP BY t.id
         ORDER BY t.${validSortBy} ${validSortDirection}
         LIMIT $${paramCount + 1} OFFSET $${paramCount + 2}`;
      
      const result = await Todo.query(query, [...params, limit, offset]);

      // Get total count
      const countResult = await Todo.query(
        `SELECT COUNT(DISTINCT t.id) as total
         FROM todos t
         ${whereClause}`,
        params
      );

      const total = parseInt(countResult.rows[0].total);
      const totalPages = Math.ceil(total / limit);

      return {
        todos: result.rows.map(row => new Todo(row)),
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          totalPages,
          hasNext: page < totalPages,
          hasPrev: page > 1
        }
      };
    } catch (error) {
      logger.error('Error finding todos with advanced filters', { error: error.message, userId });
      throw error;
    }
  }
}

module.exports = Todo;