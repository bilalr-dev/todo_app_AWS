// FileAttachment model for database operations v0.6 - Optimized Architecture
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

  // Static query method for database operations
  static async query(sql, params = []) {
    return await query(sql, params);
  }

  // Get file attachment by ID
  static async findById(id) {
    try {
      const result = await FileAttachment.query(
        'SELECT * FROM file_attachments WHERE id = $1',
        [id]
      );
      
      if (result.rows.length === 0) {
        return null;
      }
      
      return new FileAttachment(result.rows[0]);
    } catch (error) {
      logger.error('Error finding file attachment by ID', { error: error.message, attachmentId: id });
      throw error;
    }
  }

  // Get file attachments by todo ID
  static async findByTodoId(todoId) {
    try {
      const result = await FileAttachment.query(
        'SELECT * FROM file_attachments WHERE todo_id = $1 ORDER BY created_at DESC',
        [todoId]
      );
      
      return result.rows.map(row => new FileAttachment(row));
    } catch (error) {
      logger.error('Error finding file attachments by todo ID', { error: error.message, todoId });
      throw error;
    }
  }

  // Get file attachments by user ID (through todos)
  static async findByUserId(userId, options = {}) {
    try {
      const { limit = 50, offset = 0 } = options;
      
      const result = await FileAttachment.query(
        `SELECT fa.* FROM file_attachments fa
         JOIN todos t ON fa.todo_id = t.id
         WHERE t.user_id = $1
         ORDER BY fa.created_at DESC
         LIMIT $2 OFFSET $3`,
        [userId, limit, offset]
      );
      
      return result.rows.map(row => new FileAttachment(row));
    } catch (error) {
      logger.error('Error finding file attachments by user ID', { error: error.message, userId });
      throw error;
    }
  }

  // Count file attachments by todo ID
  static async countByTodoId(todoId) {
    try {
      const result = await FileAttachment.query(
        'SELECT COUNT(*) as count FROM file_attachments WHERE todo_id = $1',
        [todoId]
      );
      
      return parseInt(result.rows[0].count);
    } catch (error) {
      logger.error('Error counting file attachments by todo ID', { error: error.message, todoId });
      throw error;
    }
  }

  // Get file type from mime type
  getFileType() {
    if (this.mime_type.startsWith('image/')) {
      return 'image';
    } else if (this.mime_type === 'application/pdf') {
      return 'pdf';
    } else if (this.mime_type.startsWith('text/')) {
      return 'text';
    } else if (this.mime_type.includes('word') || this.mime_type.includes('document')) {
      return 'document';
    } else {
      return 'other';
    }
  }

  // Get file size in human readable format
  getFileSizeFormatted() {
    const bytes = this.file_size;
    if (bytes === 0) return '0 Bytes';
    
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  // Check if file has thumbnail
  hasThumbnail() {
    return this.thumbnail_path && this.mime_type.startsWith('image/');
  }
}

module.exports = FileAttachment;