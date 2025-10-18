// Notification Service for Todo App v0.7
// Handles both in-app and email notifications

const Notification = require('../models/Notification');
const EmailService = require('./EmailService');
const { logger } = require('../utils/logger');

class NotificationService {
  constructor(webSocketService = null) {
    this.webSocketService = webSocketService;
    this.emailService = new EmailService();
    this.batchQueue = new Map(); // For batching notifications
    this.batchInterval = 60000; // 1 minute
    this.maxBatchSize = 5;
    
    // Start batch processing
    this.startBatchProcessing();
  }

  // Create and send notification
  async createNotification(userId, type, data, options = {}) {
    try {
      const {
        sendEmail = false,
        sendInApp = true,
        priority = 'normal',
        batchable = true
      } = options;

      // Create notification in database
      const notification = await Notification.create({
        user_id: userId,
        type: type,
        title: this.getNotificationTitle(type, data),
        message: this.getNotificationMessage(type, data),
        data: data
      });

      // Send in-app notification
      if (sendInApp && this.webSocketService) {
        await this.sendInAppNotification(userId, notification);
      }

      // Send email notification
      if (sendEmail) {
        await this.sendEmailNotification(userId, type, data);
      }

      // Handle batching for non-critical notifications
      if (batchable && priority === 'normal') {
        this.addToBatch(userId, notification);
      }

      logger.info(`Notification created for user ${userId}: ${type}`);
      return notification;
    } catch (error) {
      logger.error('Error creating notification:', error);
      throw error;
    }
  }

  // Send in-app notification via WebSocket
  async sendInAppNotification(userId, notification) {
    try {
      if (this.webSocketService) {
        this.webSocketService.broadcastToUser(userId, 'notification', {
          id: notification.id,
          type: notification.type,
          title: notification.title,
          message: notification.message,
          data: notification.data,
          read: notification.read,
          created_at: notification.created_at
        });
      }
    } catch (error) {
      logger.error('Error sending in-app notification:', error);
    }
  }

  // Send email notification
  async sendEmailNotification(userId, type, data) {
    try {
      // Get user email from database
      const User = require('../models/User');
      const user = await User.findById(userId);
      
      if (!user || !user.email) {
        logger.warn(`No email found for user ${userId}`);
        return;
      }

      const result = await this.emailService.sendNotification(user.email, type, data);
      
      if (result.success) {
        logger.info(`Email notification sent to ${user.email}: ${type}`);
      } else {
        logger.error(`Failed to send email to ${user.email}: ${result.error}`);
      }
    } catch (error) {
      logger.error('Error sending email notification:', error);
    }
  }

  // Get notification title based on type
  getNotificationTitle(type, data) {
    const titles = {
      due_date_reminder: `Due Date Reminder: ${data.todo_title}`,
      todo_created_high_priority: `High Priority Todo: ${data.todo_title}`,
      todo_state_changed: `Todo Status Updated: ${data.todo_title}`,
      todo_due_date_changed: `Due Date Updated: ${data.todo_title}`,
      todo_deleted: `Todo Deleted: ${data.todo_title}`,
      todo_moved: `Todo Moved: ${data.todo_title}`,
      file_uploaded: `File Uploaded: ${data.filename}`,
      file_deleted: `File Deleted: ${data.filename}`,
      bulk_delete: `Bulk Delete Completed`,
      bulk_update: `Bulk Update Completed`,
      bulk_complete: `Bulk Complete Completed`,
      system_notification: data.title || 'System Notification'
    };

    return titles[type] || 'Notification';
  }

  // Get notification message based on type
  getNotificationMessage(type, data) {
    const messages = {
      due_date_reminder: `Your todo "${data.todo_title}" is due soon!`,
      todo_created_high_priority: `You created a high priority todo: "${data.todo_title}"`,
      todo_state_changed: `Todo "${data.todo_title}" moved from ${data.from_state} to ${data.to_state}`,
      todo_due_date_changed: `Due date updated for todo: "${data.todo_title}"`,
      todo_deleted: `Todo "${data.todo_title}" has been deleted`,
      todo_moved: `Todo "${data.todo_title}" moved from ${data.from_state} to ${data.to_state}`,
      file_uploaded: `File "${data.filename}" uploaded successfully (${this.formatFileSize(data.file_size)})`,
      file_deleted: `File "${data.filename}" has been deleted`,
      bulk_delete: `Bulk delete completed: ${data.successful}/${data.total} items processed`,
      bulk_update: `Bulk update completed: ${data.successful}/${data.total} items processed`,
      bulk_complete: `Bulk complete finished: ${data.successful}/${data.total} items processed`,
      system_notification: data.message || 'System notification'
    };

    return messages[type] || 'You have a new notification';
  }

  // Add notification to batch queue
  addToBatch(userId, notification) {
    if (!this.batchQueue.has(userId)) {
      this.batchQueue.set(userId, []);
    }

    const userBatch = this.batchQueue.get(userId);
    userBatch.push(notification);

    // If batch is full, process immediately
    if (userBatch.length >= this.maxBatchSize) {
      this.processBatch(userId);
    }
  }

  // Process batched notifications
  processBatch(userId) {
    const userBatch = this.batchQueue.get(userId);
    if (!userBatch || userBatch.length === 0) return;

    // Send batch notification
    if (this.webSocketService) {
      this.webSocketService.broadcastToUser(userId, 'notification_batch', {
        count: userBatch.length,
        notifications: userBatch,
        timestamp: new Date()
      });
    }

    // Clear the batch
    this.batchQueue.set(userId, []);
  }

  // Start batch processing timer
  startBatchProcessing() {
    setInterval(() => {
      for (const userId of this.batchQueue.keys()) {
        const userBatch = this.batchQueue.get(userId);
        if (userBatch && userBatch.length > 0) {
          this.processBatch(userId);
        }
      }
    }, this.batchInterval);
  }

  // Get user notifications
  async getUserNotifications(userId, options = {}) {
    try {
      return await Notification.findByUserId(userId, options);
    } catch (error) {
      logger.error('Error fetching user notifications:', error);
      throw error;
    }
  }

  // Mark notification as read
  async markAsRead(notificationId, userId) {
    try {
      return await Notification.markAsRead(notificationId, userId);
    } catch (error) {
      logger.error('Error marking notification as read:', error);
      throw error;
    }
  }

  // Mark all notifications as read
  async markAllAsRead(userId) {
    try {
      const count = await Notification.markAllAsRead(userId);
      
      // Notify via WebSocket
      if (this.webSocketService) {
        this.webSocketService.broadcastToUser(userId, 'notifications_read', {
          count: count,
          timestamp: new Date()
        });
      }

      return count;
    } catch (error) {
      logger.error('Error marking all notifications as read:', error);
      throw error;
    }
  }

  // Get unread count
  async getUnreadCount(userId) {
    try {
      return await Notification.getUnreadCount(userId);
    } catch (error) {
      logger.error('Error getting unread count:', error);
      throw error;
    }
  }

  // Send due date reminders
  async sendDueDateReminders() {
    try {
      const { query } = require('../config/database');
      
      // Get todos due in the next 24 hours
      const result = await query(`
        SELECT t.id, t.title, t.description, t.due_date, t.priority, t.category, t.user_id, u.email
        FROM todos t
        JOIN users u ON t.user_id = u.id
        WHERE t.due_date IS NOT NULL 
        AND t.due_date <= NOW() + INTERVAL '24 hours'
        AND t.due_date > NOW()
        AND t.state != 'completed'
        AND u.notification_preferences->>'due_date_reminders' = 'true'
      `);

      for (const todo of result.rows) {
        await this.createNotification(todo.user_id, 'due_date_reminder', {
          todo_id: todo.id,
          todo_title: todo.title,
          description: todo.description,
          due_date: todo.due_date,
          priority: todo.priority,
          category: todo.category
        }, {
          sendEmail: true,
          sendInApp: true,
          priority: todo.priority === 'high' || todo.priority === 'urgent' ? 'high' : 'normal'
        });
      }

      logger.info(`Sent ${result.rows.length} due date reminders`);
    } catch (error) {
      logger.error('Error sending due date reminders:', error);
    }
  }

  // Clean up old notifications
  async cleanupOldNotifications(daysOld = 30) {
    try {
      const count = await Notification.deleteOldNotifications(daysOld);
      logger.info(`Cleaned up ${count} old notifications`);
      return count;
    } catch (error) {
      logger.error('Error cleaning up old notifications:', error);
      throw error;
    }
  }

  // Test notification system
  async testNotification(userId, type = 'system_notification') {
    try {
      const testData = {
        title: 'Test Notification',
        message: 'This is a test notification to verify the system is working correctly.',
        timestamp: new Date().toISOString()
      };

      return await this.createNotification(userId, type, testData, {
        sendEmail: true,
        sendInApp: true,
        priority: 'normal'
      });
    } catch (error) {
      logger.error('Error sending test notification:', error);
      throw error;
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

  // Get service status
  getStatus() {
    return {
      emailService: this.emailService.getStatus(),
      webSocketService: this.webSocketService ? 'connected' : 'disconnected',
      batchQueue: this.batchQueue.size,
      batchInterval: this.batchInterval,
      maxBatchSize: this.maxBatchSize
    };
  }
}

module.exports = NotificationService;


