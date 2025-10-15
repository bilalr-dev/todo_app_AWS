// FileAttachment model for database operations v0.6
const { query } = require('../config/database');
const { logger } = require('../utils/logger');

class FileAttachment {
  constructor(data) {
    this.id = data.id;
    this.todo_id = data.todo_id;
    this.filename = data.filename;
    this.original_name = data.original_name;
    this.file_path = data.file_path;
    this.file_size = data.file_size;
    this.mime_type = data.mime_type;
    this.file_type = data.file_type;
    this.thumbnail_path = data.thumbnail_path;
    this.created_at = data.created_at;
    this.updated_at = data.updated_at;
  }

  // Create a new file attachment
  static async create(attachmentData) {
    try {
      const {
        todo_id,
        filename,
        original_name,
        file_path,
        file_size,
        mime_type,
        file_type,
        thumbnail_path
      } = attachmentData;

      const result = await query(
        `INSERT INTO file_attachments 
         (todo_id, filename, original_name, file_path, file_size, mime_type, file_type, thumbnail_path)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
         RETURNING *`,
        [todo_id, filename, original_name, file_path, file_size, mime_type, file_type, thumbnail_path]
      );

      return new FileAttachment(result.rows[0]);
    } catch (error) {
      logger.error('Error creating file attachment:', error);
      throw error;
    }
  }

  // Get file attachment by ID
  static async findById(id) {
    try {
      const result = await query(
        'SELECT * FROM file_attachments WHERE id = $1',
        [id]
      );

      if (result.rows.length === 0) {
        return null;
      }

      return new FileAttachment(result.rows[0]);
    } catch (error) {
      logger.error('Error finding file attachment by ID:', error);
      throw error;
    }
  }

  // Get all file attachments for a todo
  static async findByTodoId(todoId) {
    try {
      const result = await query(
        'SELECT * FROM file_attachments WHERE todo_id = $1 ORDER BY created_at DESC',
        [todoId]
      );

      return result.rows.map(row => new FileAttachment(row));
    } catch (error) {
      logger.error('Error finding file attachments by todo ID:', error);
      throw error;
    }
  }

  // Get file attachments by type
  static async findByType(fileType) {
    try {
      const result = await query(
        'SELECT * FROM file_attachments WHERE file_type = $1 ORDER BY created_at DESC',
        [fileType]
      );

      return result.rows.map(row => new FileAttachment(row));
    } catch (error) {
      logger.error('Error finding file attachments by type:', error);
      throw error;
    }
  }

  // Get file attachments by user (through todos)
  static async findByUserId(userId) {
    try {
      const result = await query(
        `SELECT fa.* FROM file_attachments fa
         JOIN todos t ON fa.todo_id = t.id
         WHERE t.user_id = $1
         ORDER BY fa.created_at DESC`,
        [userId]
      );

      return result.rows.map(row => new FileAttachment(row));
    } catch (error) {
      logger.error('Error finding file attachments by user ID:', error);
      throw error;
    }
  }

  // Update file attachment
  async update(updateData) {
    try {
      const allowedFields = ['filename', 'original_name', 'file_path', 'file_size', 'mime_type', 'file_type', 'thumbnail_path'];
      const updates = [];
      const values = [];
      let paramCount = 1;

      for (const [key, value] of Object.entries(updateData)) {
        if (allowedFields.includes(key) && value !== undefined) {
          updates.push(`${key} = $${paramCount}`);
          values.push(value);
          paramCount++;
        }
      }

      if (updates.length === 0) {
        return this;
      }

      values.push(this.id);
      const result = await query(
        `UPDATE file_attachments 
         SET ${updates.join(', ')}, updated_at = CURRENT_TIMESTAMP
         WHERE id = $${paramCount}
         RETURNING *`,
        values
      );

      return new FileAttachment(result.rows[0]);
    } catch (error) {
      logger.error('Error updating file attachment:', error);
      throw error;
    }
  }

  // Delete file attachment
  async delete() {
    try {
      await query(
        'DELETE FROM file_attachments WHERE id = $1',
        [this.id]
      );

      return true;
    } catch (error) {
      logger.error('Error deleting file attachment:', error);
      throw error;
    }
  }

  // Get file attachment statistics
  static async getStats(userId) {
    try {
      const result = await query(
        `SELECT 
           COUNT(*) as total_files,
           COUNT(CASE WHEN file_type = 'image' THEN 1 END) as image_files,
           COUNT(CASE WHEN file_type = 'document' THEN 1 END) as document_files,
           COUNT(CASE WHEN file_type = 'text' THEN 1 END) as text_files,
           SUM(file_size) as total_size
         FROM file_attachments fa
         JOIN todos t ON fa.todo_id = t.id
         WHERE t.user_id = $1`,
        [userId]
      );

      const stats = result.rows[0];
      return {
        total_files: parseInt(stats.total_files) || 0,
        image_files: parseInt(stats.image_files) || 0,
        document_files: parseInt(stats.document_files) || 0,
        text_files: parseInt(stats.text_files) || 0,
        total_size: parseInt(stats.total_size) || 0
      };
    } catch (error) {
      logger.error('Error getting file attachment stats:', error);
      throw error;
    }
  }

  // Get file attachments with pagination
  static async findWithPagination(userId, options = {}) {
    try {
      const {
        page = 1,
        limit = 10,
        fileType = null,
        sortBy = 'created_at',
        sortDirection = 'DESC'
      } = options;

      const offset = (page - 1) * limit;
      let whereClause = 'WHERE t.user_id = $1';
      let params = [userId];
      let paramCount = 1;

      if (fileType) {
        paramCount++;
        whereClause += ` AND fa.file_type = $${paramCount}`;
        params.push(fileType);
      }

      const result = await query(
        `SELECT fa.*, t.title as todo_title
         FROM file_attachments fa
         JOIN todos t ON fa.todo_id = t.id
         ${whereClause}
         ORDER BY fa.${sortBy} ${sortDirection}
         LIMIT $${paramCount + 1} OFFSET $${paramCount + 2}`,
        [...params, limit, offset]
      );

      // Get total count
      const countResult = await query(
        `SELECT COUNT(*) as total
         FROM file_attachments fa
         JOIN todos t ON fa.todo_id = t.id
         ${whereClause}`,
        params
      );

      const total = parseInt(countResult.rows[0].total);
      const totalPages = Math.ceil(total / limit);

      return {
        files: result.rows.map(row => new FileAttachment(row)),
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
      logger.error('Error finding file attachments with pagination:', error);
      throw error;
    }
  }

  // Convert to JSON
  toJSON() {
    return {
      id: this.id,
      todo_id: this.todo_id,
      filename: this.filename,
      original_name: this.original_name,
      file_path: this.file_path,
      file_size: this.file_size,
      mime_type: this.mime_type,
      file_type: this.file_type,
      thumbnail_path: this.thumbnail_path,
      created_at: this.created_at,
      updated_at: this.updated_at
    };
  }
}

module.exports = FileAttachment;
