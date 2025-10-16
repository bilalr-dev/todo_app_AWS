// File attachment routes for v0.6
const express = require('express');
const path = require('path');
const fs = require('fs');
const fsPromises = require('fs').promises;
const { authenticateToken } = require('../middleware/auth');
const { uploadSingle, uploadMultiple } = require('../middleware/upload');
const FileAttachment = require('../models/FileAttachment');
const FileService = require('../services/FileService');
const fileProcessor = require('../utils/fileProcessor');
const { logger } = require('../utils/logger');

const router = express.Router();

// Upload single file to a todo
router.post('/upload/:todoId', authenticateToken, ...uploadSingle('file'), async (req, res) => {
  try {
    const { todoId } = req.params;
    const userId = req.user.id;

    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No file uploaded'
      });
    }

    // Verify todo belongs to user
    const { query } = require('../config/database');
    const todoResult = await query(
      'SELECT id FROM todos WHERE id = $1 AND user_id = $2',
      [todoId, userId]
    );

    if (todoResult.rows.length === 0) {
      // Clean up uploaded file
      await fileProcessor.deleteFile(req.file.path);
      return res.status(404).json({
        success: false,
        message: 'Todo not found'
      });
    }

            // Resolve duplicate filename for this todo
            const resolvedOriginalName = await fileProcessor.resolveDuplicateFilename(todoId, req.file.originalname);

            // Process the uploaded file
            const fileData = await fileProcessor.processFile(req.file);
            
            logger.debug('fileProcessor.processFile result', { 
              filename: fileData.filename,
              filePath: fileData.filePath,
              mimeType: fileData.mimeType,
              fileType: fileData.fileType,
              thumbnailPath: fileData.thumbnailPath
            });

            // Create file attachment record using FileService
            const attachment = await FileService.uploadFile(todoId, {
              filename: fileData.filename,
              originalName: resolvedOriginalName,
              filePath: fileData.filePath,
              fileSize: fileData.fileSize,
              mimeType: fileData.mimeType,
              fileType: fileData.fileType,
              thumbnailPath: fileData.thumbnailPath
            });

    res.status(201).json({
      success: true,
      message: 'File uploaded successfully',
      attachment: {
        id: attachment.id,
        todo_id: attachment.todo_id,
        filename: attachment.filename,
        original_name: attachment.original_name,
        file_path: attachment.file_path,
        file_size: attachment.file_size,
        mime_type: attachment.mime_type,
        file_type: attachment.file_type,
        thumbnail_path: attachment.thumbnail_path,
        created_at: attachment.created_at,
        updated_at: attachment.updated_at
      }
    });
  } catch (error) {
    logger.error('Error uploading file:', error);
    
    // Clean up uploaded file on error
    if (req.file) {
      await fileProcessor.deleteFile(req.file.path);
    }

    res.status(500).json({
      success: false,
      message: 'Error uploading file',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// Upload multiple files to a todo
router.post('/upload-multiple/:todoId', authenticateToken, uploadMultiple('files', 5), async (req, res) => {
  try {
    const { todoId } = req.params;
    const userId = req.user.id;

    if (!req.files || req.files.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No files uploaded'
      });
    }

    // Verify todo belongs to user
    const { query } = require('../config/database');
    const todoResult = await query(
      'SELECT id FROM todos WHERE id = $1 AND user_id = $2',
      [todoId, userId]
    );

    if (todoResult.rows.length === 0) {
      // Clean up uploaded files
      for (const file of req.files) {
        await fileProcessor.deleteFile(file.path);
      }
      return res.status(404).json({
        success: false,
        message: 'Todo not found'
      });
    }

    const attachments = [];
    const errors = [];

    // Process each uploaded file
    for (const file of req.files) {
      try {
        // Resolve duplicate filename for this todo
        const resolvedOriginalName = await fileProcessor.resolveDuplicateFilename(todoId, file.originalname);
        
        const fileData = await fileProcessor.processFile(file);
        
        const attachment = await FileService.uploadFile(todoId, {
          filename: fileData.filename,
          originalName: resolvedOriginalName,
          filePath: fileData.filePath,
          fileSize: fileData.fileSize,
          mimeType: fileData.mimeType,
          fileType: fileData.fileType,
          thumbnailPath: fileData.thumbnailPath
        });

        attachments.push(attachment.toJSON());
      } catch (error) {
        logger.error(`Error processing file ${file.originalname}:`, error);
        errors.push({
          filename: file.originalname,
          error: error.message
        });
        
        // Clean up failed file
        await fileProcessor.deleteFile(file.path);
      }
    }


    res.status(201).json({
      success: true,
      message: `${attachments.length} files uploaded successfully`,
      attachments,
      errors: errors.length > 0 ? errors : undefined
    });
  } catch (error) {
    logger.error('Error uploading multiple files:', error);
    
    // Clean up uploaded files on error
    if (req.files) {
      for (const file of req.files) {
        await fileProcessor.deleteFile(file.path);
      }
    }

    res.status(500).json({
      success: false,
      message: 'Error uploading files',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// Get file attachments for a todo
router.get('/todo/:todoId', authenticateToken, async (req, res) => {
  try {
    const { todoId } = req.params;
    const userId = req.user.id;

    // Verify todo belongs to user
    const { query } = require('../config/database');
    const todoResult = await query(
      'SELECT id FROM todos WHERE id = $1 AND user_id = $2',
      [todoId, userId]
    );

    if (todoResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Todo not found'
      });
    }

    const attachments = await FileAttachment.findByTodoId(todoId);

    res.json({
      success: true,
      attachments: attachments.map(attachment => attachment.toJSON())
    });
  } catch (error) {
    logger.error('Error getting file attachments:', error);
    res.status(500).json({
      success: false,
      message: 'Error getting file attachments',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// Get all file attachments for user
router.get('/user', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const {
      page = 1,
      limit = 10,
      fileType = null,
      sortBy = 'created_at',
      sortDirection = 'DESC'
    } = req.query;

    const result = await FileAttachment.findWithPagination(userId, {
      page: parseInt(page),
      limit: parseInt(limit),
      fileType,
      sortBy,
      sortDirection
    });

    res.json({
      success: true,
      ...result
    });
  } catch (error) {
    logger.error('Error getting user file attachments:', error);
    res.status(500).json({
      success: false,
      message: 'Error getting file attachments',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// Get file attachment by ID
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const attachment = await FileAttachment.findById(id);
    
    if (!attachment) {
      return res.status(404).json({
        success: false,
        message: 'File attachment not found'
      });
    }

    // Verify attachment belongs to user's todo
    const { query } = require('../config/database');
    const result = await query(
      `SELECT fa.id FROM file_attachments fa
       JOIN todos t ON fa.todo_id = t.id
       WHERE fa.id = $1 AND t.user_id = $2`,
      [id, userId]
    );

    if (result.rows.length === 0) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    res.json({
      success: true,
      attachment: attachment.toJSON()
    });
  } catch (error) {
    logger.error('Error getting file attachment:', error);
    res.status(500).json({
      success: false,
      message: 'Error getting file attachment',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// Download file
router.get('/download/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const attachment = await FileAttachment.findById(id);
    
    if (!attachment) {
      return res.status(404).json({
        success: false,
        message: 'File attachment not found'
      });
    }

    // Verify attachment belongs to user's todo
    const { query } = require('../config/database');
    const result = await query(
      `SELECT fa.id FROM file_attachments fa
       JOIN todos t ON fa.todo_id = t.id
       WHERE fa.id = $1 AND t.user_id = $2`,
      [id, userId]
    );

    if (result.rows.length === 0) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    const filePath = path.join(__dirname, '../../uploads', attachment.file_path);
    
    // Check if file exists
    try {
      await fsPromises.access(filePath);
    } catch (error) {
      return res.status(404).json({
        success: false,
        message: 'File not found on disk'
      });
    }

    // Set headers for file download
    res.setHeader('Content-Disposition', `attachment; filename="${attachment.original_name}"`);
    res.setHeader('Content-Type', attachment.mime_type);
    res.setHeader('Content-Length', attachment.file_size);

    // Stream the file
    const fileStream = fs.createReadStream(filePath);
    fileStream.pipe(res);

  } catch (error) {
    logger.error('Error downloading file:', error);
    res.status(500).json({
      success: false,
      message: 'Error downloading file',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// Delete file attachment
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const attachment = await FileAttachment.findById(id);
    
    if (!attachment) {
      return res.status(404).json({
        success: false,
        message: 'File attachment not found'
      });
    }

    // Verify attachment belongs to user's todo
    const { query } = require('../config/database');
    const result = await query(
      `SELECT fa.id FROM file_attachments fa
       JOIN todos t ON fa.todo_id = t.id
       WHERE fa.id = $1 AND t.user_id = $2`,
      [id, userId]
    );

    if (result.rows.length === 0) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    // Delete file using FileService (handles both disk and database deletion)
    await FileService.deleteFile(id);


    res.json({
      success: true,
      message: 'File deleted successfully'
    });
  } catch (error) {
    logger.error('Error deleting file:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting file',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// Get file statistics
router.get('/stats/user', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const stats = await FileAttachment.getStats(userId);

    res.json({
      success: true,
      stats
    });
  } catch (error) {
    logger.error('Error getting file stats:', error);
    res.status(500).json({
      success: false,
      message: 'Error getting file statistics',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

module.exports = router;
