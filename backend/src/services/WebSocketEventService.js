// WebSocket Event Service for Todo App v0.7
// Handles real-time event broadcasting for todos and files

const { logger } = require('../utils/logger');
const Notification = require('../models/Notification');
const UserPresence = require('../models/UserPresence');

class WebSocketEventService {
  constructor(webSocketService) {
    this.ws = webSocketService;
  }

  // Broadcast todo created event
  async broadcastTodoCreated(userId, todo) {
    try {
      const eventData = {
        id: todo.id,
        title: todo.title,
        description: todo.description,
        priority: todo.priority,
        category: todo.category,
        state: todo.state, // Use state field directly from database
        due_date: todo.due_date,
        created_at: todo.created_at,
        user_id: userId,
        _createdWithFiles: todo._createdWithFiles || false // Include the flag
      };

      // Broadcast to user's WebSocket connections
      this.ws.broadcastToUser(userId, 'todo_created', eventData);

      // Create notification for important todos
      if (todo.priority === 'high' || todo.priority === 'urgent') {
        await this.createTodoNotification(userId, 'todo_created_high_priority', {
          todo_id: todo.id,
          title: todo.title,
          priority: todo.priority
        });
      }

      logger.debug(`Broadcasted todo_created event for user ${userId}, todo ${todo.id}`);
    } catch (error) {
      logger.error('Error broadcasting todo created event:', error);
    }
  }

  // Broadcast todo updated event
  async broadcastTodoUpdated(userId, todo, changes = {}) {
    try {
      const eventData = {
        id: todo.id,
        title: todo.title,
        description: todo.description,
        priority: todo.priority,
        category: todo.category,
        state: todo.state, // Use state field directly from database
        due_date: todo.due_date,
        created_at: todo.created_at,
        updated_at: todo.updated_at,
        user_id: userId,
        changes: changes
      };

      // Broadcast to user's WebSocket connections
      this.ws.broadcastToUser(userId, 'todo_updated', eventData);

      // Create notification for state changes
      if (changes.state && changes.state.from !== changes.state.to) {
        await this.createTodoNotification(userId, 'todo_state_changed', {
          todo_id: todo.id,
          title: todo.title,
          from_state: changes.state.from,
          to_state: changes.state.to
        });
      }

      // Create notification for due date changes
      if (changes.due_date) {
        await this.createTodoNotification(userId, 'todo_due_date_changed', {
          todo_id: todo.id,
          title: todo.title,
          new_due_date: changes.due_date.to
        });
      }

      logger.debug(`Broadcasted todo_updated event for user ${userId}, todo ${todo.id}`);
    } catch (error) {
      logger.error('Error broadcasting todo updated event:', error);
    }
  }

  // Broadcast todo deleted event
  async broadcastTodoDeleted(userId, todoId, todoTitle) {
    try {
      const eventData = {
        id: todoId,
        user_id: userId,
        deleted_at: new Date()
      };

      // Broadcast to user's WebSocket connections
      this.ws.broadcastToUser(userId, 'todo_deleted', eventData);

      // Create notification for deleted todo
      await this.createTodoNotification(userId, 'todo_deleted', {
        todo_id: todoId,
        title: todoTitle
      });

      logger.debug(`Broadcasted todo_deleted event for user ${userId}, todo ${todoId}`);
    } catch (error) {
      logger.error('Error broadcasting todo deleted event:', error);
    }
  }

  // Broadcast todo moved event (Kanban)
  async broadcastTodoMoved(userId, todoId, fromState, toState, todoTitle) {
    try {
      const eventData = {
        id: todoId,
        from_state: fromState,
        to_state: toState,
        user_id: userId,
        moved_at: new Date()
      };

      // Broadcast to user's WebSocket connections
      this.ws.broadcastToUser(userId, 'todo_moved', eventData);

      // Create notification for state change
      await this.createTodoNotification(userId, 'todo_moved', {
        todo_id: todoId,
        title: todoTitle,
        from_state: fromState,
        to_state: toState
      });

      logger.debug(`Broadcasted todo_moved event for user ${userId}, todo ${todoId}: ${fromState} → ${toState}`);
    } catch (error) {
      logger.error('Error broadcasting todo moved event:', error);
    }
  }

  // Broadcast file uploaded event
  async broadcastFileUploaded(userId, todoId, fileData) {
    try {
      const eventData = {
        todo_id: todoId,
        file: {
          id: fileData.id,
          filename: fileData.filename,
          original_name: fileData.original_name,
          file_size: fileData.file_size,
          mime_type: fileData.mime_type,
          file_type: fileData.file_type,
          thumbnail_path: fileData.thumbnail_path
        },
        user_id: userId,
        uploaded_at: new Date()
      };

      // Broadcast to user's WebSocket connections
      this.ws.broadcastToUser(userId, 'file_uploaded', eventData);

      // Create notification for file upload
      await this.createFileNotification(userId, 'file_uploaded', {
        todo_id: todoId,
        file_id: fileData.id,
        filename: fileData.original_name,
        file_size: fileData.file_size
      });

      logger.debug(`Broadcasted file_uploaded event for user ${userId}, file ${fileData.id}`);
    } catch (error) {
      logger.error('Error broadcasting file uploaded event:', error);
    }
  }

  // Broadcast file deleted event
  async broadcastFileDeleted(userId, todoId, fileId, fileName) {
    try {
      const eventData = {
        todo_id: todoId,
        file_id: fileId,
        user_id: userId,
        deleted_at: new Date()
      };

      // Broadcast to user's WebSocket connections
      this.ws.broadcastToUser(userId, 'file_deleted', eventData);

      // Create notification for file deletion
      await this.createFileNotification(userId, 'file_deleted', {
        todo_id: todoId,
        file_id: fileId,
        filename: fileName
      });

      logger.debug(`Broadcasted file_deleted event for user ${userId}, file ${fileId}`);
    } catch (error) {
      logger.error('Error broadcasting file deleted event:', error);
    }
  }

  // Broadcast bulk action event
  async broadcastBulkAction(userId, action, results) {
    try {
      const eventData = {
        action: action,
        results: {
          total: results.total,
          successful: results.successful,
          failed: results.failed,
          errors: results.errors
        },
        user_id: userId,
        completed_at: new Date()
      };

      // Broadcast to user's WebSocket connections
      this.ws.broadcastToUser(userId, 'bulk_action', eventData);

      // Create notification for bulk action completion
      await this.createBulkNotification(userId, action, results);

      logger.debug(`Broadcasted bulk_action event for user ${userId}: ${action}`);
    } catch (error) {
      logger.error('Error broadcasting bulk action event:', error);
    }
  }

  // Broadcast user activity event
  async broadcastUserActivity(userId, activity) {
    try {
      const eventData = {
        user_id: userId,
        activity: activity,
        timestamp: new Date()
      };

      // Broadcast to user's WebSocket connections
      this.ws.broadcastToUser(userId, 'user_activity', eventData);

      logger.debug(`Broadcasted user_activity event for user ${userId}: ${activity}`);
    } catch (error) {
      logger.error('Error broadcasting user activity event:', error);
    }
  }

  // Broadcast profile updated event
  async broadcastProfileUpdated(userId, user, changes = {}) {
    try {
      const eventData = {
        user_id: userId,
        user: {
          id: user.id,
          username: user.username,
          email: user.email,
          theme_preference: user.theme_preference,
          updated_at: user.updated_at
        },
        changes: changes,
        timestamp: new Date()
      };

      // Broadcast to user's WebSocket connections
      this.ws.broadcastToUser(userId, 'profile_updated', eventData);

      logger.info(`Broadcasted profile_updated event for user ${userId}`, { eventData });
    } catch (error) {
      logger.error('Error broadcasting profile updated event:', error);
    }
  }

  // Create todo-related notification
  async createTodoNotification(userId, type, data) {
    try {
      const notificationTemplates = {
        todo_created_high_priority: {
          title: 'High Priority Todo Created',
          message: `You created a high priority todo: "${data.title}"`
        },
        todo_state_changed: {
          title: 'Todo State Changed',
          message: `Todo "${data.title}" moved from ${data.from_state} to ${data.to_state}`
        },
        todo_due_date_changed: {
          title: 'Due Date Updated',
          message: `Due date updated for todo: "${data.title}"`
        },
        todo_deleted: {
          title: 'Todo Deleted',
          message: `Todo "${data.title}" has been deleted`
        },
        todo_moved: {
          title: 'Todo Moved',
          message: `Todo "${data.title}" moved from ${data.from_state} to ${data.to_state}`
        }
      };

      const template = notificationTemplates[type];
      if (template) {
        await Notification.create({
          user_id: userId,
          type: type,
          title: template.title,
          message: template.message,
          data: data
        });
      }
    } catch (error) {
      logger.error('Error creating todo notification:', error);
    }
  }

  // Create file-related notification
  async createFileNotification(userId, type, data) {
    try {
      const notificationTemplates = {
        file_uploaded: {
          title: 'File Uploaded',
          message: `File "${data.filename}" uploaded successfully (${this.formatFileSize(data.file_size)})`
        },
        file_deleted: {
          title: 'File Deleted',
          message: `File "${data.filename}" has been deleted`
        }
      };

      const template = notificationTemplates[type];
      if (template) {
        await Notification.create({
          user_id: userId,
          type: type,
          title: template.title,
          message: template.message,
          data: data
        });
      }
    } catch (error) {
      logger.error('Error creating file notification:', error);
    }
  }

  // Create bulk action notification
  async createBulkNotification(userId, action, results) {
    try {
      const actionTemplates = {
        delete: 'Delete',
        complete: 'Complete',
        move: 'Move',
        export: 'Export'
      };

      const actionName = actionTemplates[action] || action;
      const title = `Bulk ${actionName} Completed`;
      const message = `Bulk ${actionName.toLowerCase()} completed: ${results.successful}/${results.total} items processed successfully`;

      await Notification.create({
        user_id: userId,
        type: `bulk_${action}`,
        title: title,
        message: message,
        data: results
      });
    } catch (error) {
      logger.error('Error creating bulk notification:', error);
    }
  }

  // Format file size for display
  formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  // Get WebSocket service instance
  getWebSocketService() {
    return this.ws;
  }
}

module.exports = WebSocketEventService;
