// FileService - Business logic for file operations v0.6 - Optimized Architecture
const FileAttachment = require('../models/FileAttachment');
const { query } = require('../config/database');
const { logger } = require('../utils/logger');
const path = require('path');
const fs = require('fs').promises;
const sharp = require('sharp');

class FileService {
  // Upload file and create attachment record
  static async uploadFile(todoId, fileData) {
    try {
      const { filename, originalName, filePath, fileSize, mimeType, fileType, thumbnailPath } = fileData;
      
      logger.debug('FileService.uploadFile called', { 
        todoId, 
        filename, 
        originalName, 
        filePath, 
        mimeType, 
        fileType, 
        thumbnailPath 
      });
      
      const result = await query(
        `INSERT INTO file_attachments (todo_id, file_name, original_name, file_path, file_size, mime_type, file_type, thumbnail_path) 
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8) 
         RETURNING *`,
        [todoId, originalName, originalName, filePath, fileSize, mimeType, fileType, thumbnailPath]
      );
      
      const attachment = new FileAttachment(result.rows[0]);
      
      // Generate thumbnail for images only if not already provided
      if (mimeType.startsWith('image/') && !thumbnailPath) {
        logger.debug('Generating thumbnail because thumbnailPath is null', { 
          attachmentId: attachment.id, 
          mimeType, 
          thumbnailPath 
        });
        await FileService.generateThumbnail(attachment);
      } else {
        logger.debug('Skipping thumbnail generation', { 
          attachmentId: attachment.id, 
          mimeType, 
          thumbnailPath 
        });
      }
      
      logger.info('File uploaded successfully', { 
        attachmentId: attachment.id, 
        todoId, 
        filename: originalName,
        thumbnailPath: attachment.thumbnail_path
      });
      
      return attachment;
    } catch (error) {
      logger.error('Error uploading file', { error: error.message, todoId });
      throw error;
    }
  }

  // Generate thumbnail for image files
  static async generateThumbnail(attachment) {
    try {
      if (!attachment.mime_type.startsWith('image/')) {
        return;
      }

      // Use consistent path based on project root
      const uploadBaseDir = path.join(process.cwd(), 'backend', 'uploads');
      const thumbnailDir = path.join(uploadBaseDir, 'thumbnails');
      await fs.mkdir(thumbnailDir, { recursive: true });

      const thumbnailFilename = `thumb_${attachment.filename}`;
      const thumbnailPath = path.join(thumbnailDir, thumbnailFilename);

      // Construct full path to the source file
      const sourceFilePath = path.join(uploadBaseDir, attachment.file_path);
      
      await sharp(sourceFilePath)
        .resize(200, 200, { fit: 'inside', withoutEnlargement: true })
        .jpeg({ quality: 80 })
        .toFile(thumbnailPath);

      // Store relative path for frontend access
      const relativeThumbnailPath = path.join('thumbnails', thumbnailFilename);
      
      // Update attachment record with thumbnail path
      await query(
        'UPDATE file_attachments SET thumbnail_path = $1 WHERE id = $2',
        [relativeThumbnailPath, attachment.id]
      );

      attachment.thumbnail_path = relativeThumbnailPath;
      
      logger.info('Thumbnail generated', { 
        attachmentId: attachment.id, 
        thumbnailPath 
      });
    } catch (error) {
      logger.error('Error generating thumbnail', { 
        error: error.message, 
        attachmentId: attachment.id 
      });
      // Don't throw error - thumbnail generation failure shouldn't break file upload
    }
  }

  // Delete file and attachment record
  static async deleteFile(attachmentId) {
    try {
      const attachment = await FileAttachment.findById(attachmentId);
      if (!attachment) {
        throw new Error('File attachment not found');
      }

      // Delete physical files
      try {
        const uploadBaseDir = path.join(process.cwd(), 'backend', 'uploads');
        
        if (attachment.file_path) {
          const fullFilePath = path.join(uploadBaseDir, attachment.file_path);
          await fs.unlink(fullFilePath);
        }
        if (attachment.thumbnail_path) {
          const fullThumbnailPath = path.join(uploadBaseDir, attachment.thumbnail_path);
          await fs.unlink(fullThumbnailPath);
        }
      } catch (fileError) {
        logger.warn('Error deleting physical files', { 
          error: fileError.message, 
          attachmentId 
        });
      }

      // Delete database record
      await query('DELETE FROM file_attachments WHERE id = $1', [attachmentId]);
      
      logger.info('File deleted successfully', { 
        attachmentId, 
        todoId: attachment.todo_id 
      });
      
      return true;
    } catch (error) {
      logger.error('Error deleting file', { error: error.message, attachmentId });
      throw error;
    }
  }

  // Get file attachments for a todo
  static async getAttachmentsByTodoId(todoId) {
    try {
      return await FileAttachment.findByTodoId(todoId);
    } catch (error) {
      logger.error('Error getting attachments for todo', { error: error.message, todoId });
      throw error;
    }
  }

  // Validate file type and size
  static validateFile(file) {
    const allowedTypes = [
      'image/jpeg', 'image/png', 'image/gif', 'image/webp',
      'application/pdf', 'text/plain', 'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    ];
    
    const maxSize = 10 * 1024 * 1024; // 10MB
    
    if (!allowedTypes.includes(file.mimetype)) {
      throw new Error('File type not allowed');
    }
    
    if (file.size > maxSize) {
      throw new Error('File size too large (max 10MB)');
    }
    
    return true;
  }

  // Get file statistics for a user
  static async getFileStats(userId) {
    try {
      const result = await query(
        `SELECT 
           COUNT(*) as total_files,
           SUM(file_size) as total_size,
           COUNT(CASE WHEN mime_type LIKE 'image/%' THEN 1 END) as image_count,
           COUNT(CASE WHEN mime_type = 'application/pdf' THEN 1 END) as pdf_count
         FROM file_attachments fa
         JOIN todos t ON fa.todo_id = t.id
         WHERE t.user_id = $1`,
        [userId]
      );
      
      return {
        total_files: parseInt(result.rows[0].total_files) || 0,
        total_size: parseInt(result.rows[0].total_size) || 0,
        image_count: parseInt(result.rows[0].image_count) || 0,
        pdf_count: parseInt(result.rows[0].pdf_count) || 0
      };
    } catch (error) {
      logger.error('Error getting file stats', { error: error.message, userId });
      throw error;
    }
  }
}

module.exports = FileService;
