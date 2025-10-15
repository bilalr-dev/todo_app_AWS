// Export functionality routes for v0.6
const express = require('express');
const { authenticateToken } = require('../middleware/auth');
const Todo = require('../models/Todo');
const { logger } = require('../utils/logger');

const router = express.Router();

// Export todos as JSON
router.get('/todos/json', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const {
      search = null,
      priority = null,
      category = null,
      status = null,
      startDate = null,
      endDate = null,
      includeAttachments = false
    } = req.query;

    // Build filter options
    const options = {
      search,
      priority,
      category,
      status,
      startDate,
      endDate,
      limit: 10000 // Large limit for export
    };

    let todos;
    if (includeAttachments === 'true') {
      todos = await Todo.findWithAttachments(userId, options);
    } else {
      todos = await Todo.findByUserId(userId, options);
    }

    // Prepare export data
    const exportData = {
      exportInfo: {
        exportedAt: new Date().toISOString(),
        exportedBy: req.user.username,
        totalTodos: todos.todos.length,
        filters: {
          search,
          priority,
          category,
          status,
          startDate,
          endDate
        }
      },
      todos: todos.todos.map(todo => ({
        id: todo.id,
        title: todo.title,
        description: todo.description,
        priority: todo.priority,
        category: todo.category,
        due_date: todo.due_date,
        completed: todo.completed,
        file_count: todo.file_count || 0,
        created_at: todo.created_at,
        updated_at: todo.updated_at,
        ...(includeAttachments === 'true' && { attachments: todo.attachments })
      }))
    };

    // Set headers for file download
    const filename = `todos_export_${new Date().toISOString().split('T')[0]}.json`;
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);

    logger.info(`JSON export completed: ${todos.todos.length} todos exported by user ${userId}`);

    res.json(exportData);
  } catch (error) {
    logger.error('Error exporting todos as JSON:', error);
    res.status(500).json({
      success: false,
      message: 'Error exporting todos',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// Export todos as CSV
router.get('/todos/csv', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const {
      search = null,
      priority = null,
      category = null,
      status = null,
      startDate = null,
      endDate = null,
      includeAttachments = false
    } = req.query;

    // Build filter options
    const options = {
      search,
      priority,
      category,
      status,
      startDate,
      endDate,
      limit: 10000 // Large limit for export
    };

    let todos;
    if (includeAttachments === 'true') {
      todos = await Todo.findWithAttachments(userId, options);
    } else {
      todos = await Todo.findByUserId(userId, options);
    }

    // CSV headers
    const headers = [
      'ID',
      'Title',
      'Description',
      'Priority',
      'Category',
      'Due Date',
      'Completed',
      'File Count',
      'Created At',
      'Updated At'
    ];

    if (includeAttachments === 'true') {
      headers.push('Attachments');
    }

    // Convert todos to CSV rows
    const csvRows = todos.todos.map(todo => {
      const row = [
        todo.id,
        `"${(todo.title || '').replace(/"/g, '""')}"`,
        `"${(todo.description || '').replace(/"/g, '""')}"`,
        todo.priority || '',
        todo.category || '',
        todo.due_date || '',
        todo.completed ? 'Yes' : 'No',
        todo.file_count || 0,
        todo.created_at || '',
        todo.updated_at || ''
      ];

      if (includeAttachments === 'true') {
        const attachments = todo.attachments || [];
        const attachmentNames = attachments.map(att => att.original_name).join('; ');
        row.push(`"${attachmentNames.replace(/"/g, '""')}"`);
      }

      return row.join(',');
    });

    // Combine headers and rows
    const csvContent = [headers.join(','), ...csvRows].join('\n');

    // Set headers for file download
    const filename = `todos_export_${new Date().toISOString().split('T')[0]}.csv`;
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);

    logger.info(`CSV export completed: ${todos.todos.length} todos exported by user ${userId}`);

    res.send(csvContent);
  } catch (error) {
    logger.error('Error exporting todos as CSV:', error);
    res.status(500).json({
      success: false,
      message: 'Error exporting todos',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// Export file attachments as JSON
router.get('/files/json', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const { fileType = null } = req.query;

    const FileAttachment = require('../models/FileAttachment');
    const result = await FileAttachment.findWithPagination(userId, {
      page: 1,
      limit: 10000, // Large limit for export
      fileType
    });

    // Prepare export data
    const exportData = {
      exportInfo: {
        exportedAt: new Date().toISOString(),
        exportedBy: req.user.username,
        totalFiles: result.files.length,
        filters: { fileType }
      },
      files: result.files.map(file => ({
        id: file.id,
        todo_id: file.todo_id,
        filename: file.filename,
        original_name: file.original_name,
        file_size: file.file_size,
        mime_type: file.mime_type,
        file_type: file.file_type,
        created_at: file.created_at,
        updated_at: file.updated_at
      }))
    };

    // Set headers for file download
    const filename = `files_export_${new Date().toISOString().split('T')[0]}.json`;
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);

    logger.info(`Files JSON export completed: ${result.files.length} files exported by user ${userId}`);

    res.json(exportData);
  } catch (error) {
    logger.error('Error exporting files as JSON:', error);
    res.status(500).json({
      success: false,
      message: 'Error exporting files',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// Export file attachments as CSV
router.get('/files/csv', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const { fileType = null } = req.query;

    const FileAttachment = require('../models/FileAttachment');
    const result = await FileAttachment.findWithPagination(userId, {
      page: 1,
      limit: 10000, // Large limit for export
      fileType
    });

    // CSV headers
    const headers = [
      'ID',
      'Todo ID',
      'Filename',
      'Original Name',
      'File Size (bytes)',
      'MIME Type',
      'File Type',
      'Created At',
      'Updated At'
    ];

    // Convert files to CSV rows
    const csvRows = result.files.map(file => [
      file.id,
      file.todo_id,
      `"${(file.filename || '').replace(/"/g, '""')}"`,
      `"${(file.original_name || '').replace(/"/g, '""')}"`,
      file.file_size || 0,
      file.mime_type || '',
      file.file_type || '',
      file.created_at || '',
      file.updated_at || ''
    ].join(','));

    // Combine headers and rows
    const csvContent = [headers.join(','), ...csvRows].join('\n');

    // Set headers for file download
    const filename = `files_export_${new Date().toISOString().split('T')[0]}.csv`;
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);

    logger.info(`Files CSV export completed: ${result.files.length} files exported by user ${userId}`);

    res.send(csvContent);
  } catch (error) {
    logger.error('Error exporting files as CSV:', error);
    res.status(500).json({
      success: false,
      message: 'Error exporting files',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// Get export statistics
router.get('/stats', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;

    // Get todo statistics
    const todoStats = await Todo.getStats(userId);

    // Get file statistics
    const FileAttachment = require('../models/FileAttachment');
    const fileStats = await FileAttachment.getStats(userId);

    res.json({
      success: true,
      stats: {
        todos: todoStats,
        files: fileStats,
        exportInfo: {
          lastExport: null, // Could be stored in database
          availableFormats: ['json', 'csv'],
          maxRecords: 10000
        }
      }
    });
  } catch (error) {
    logger.error('Error getting export stats:', error);
    res.status(500).json({
      success: false,
      message: 'Error getting export statistics',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

module.exports = router;
