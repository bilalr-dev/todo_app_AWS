// Notification routes for Todo App v0.7
// Handles notification management and preferences

const express = require('express');
const { authenticateToken } = require('../middleware/auth');
const NotificationService = require('../services/NotificationService');
const { logger } = require('../utils/logger');

const router = express.Router();

// Helper function to get notification service
const getNotificationService = (req) => {
  const webSocketService = req.app.locals.webSocketService;
  return new NotificationService(webSocketService);
};

// Get user notifications with pagination
router.get('/', authenticateToken, async (req, res) => {
  try {
    const {
      page = 1,
      limit = 20,
      unreadOnly = false,
      type = null
    } = req.query;

    const notificationService = getNotificationService(req);
    const result = await notificationService.getUserNotifications(req.user.id, {
      page: parseInt(page),
      limit: parseInt(limit),
      unreadOnly: unreadOnly === 'true',
      type: type
    });

    res.json({
      success: true,
      notifications: result.notifications,
      pagination: result.pagination
    });
  } catch (error) {
    logger.error('Error fetching notifications:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'FETCH_ERROR',
        message: 'Failed to fetch notifications'
      }
    });
  }
});

// Get unread notification count
router.get('/unread-count', authenticateToken, async (req, res) => {
  try {
    const notificationService = getNotificationService(req);
    const count = await notificationService.getUnreadCount(req.user.id);

    res.json({
      success: true,
      count: count
    });
  } catch (error) {
    logger.error('Error getting unread count:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'COUNT_ERROR',
        message: 'Failed to get unread count'
      }
    });
  }
});

// Mark notification as read
router.put('/:id/read', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const notificationId = parseInt(id);

    if (isNaN(notificationId)) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_ID',
          message: 'Invalid notification ID'
        }
      });
    }

    const notificationService = getNotificationService(req);
    const notification = await notificationService.markAsRead(notificationId, req.user.id);

    res.json({
      success: true,
      message: 'Notification marked as read',
      notification: notification
    });
  } catch (error) {
    logger.error('Error marking notification as read:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'UPDATE_ERROR',
        message: 'Failed to mark notification as read'
      }
    });
  }
});

// Mark all notifications as read
router.put('/read-all', authenticateToken, async (req, res) => {
  try {
    const notificationService = getNotificationService(req);
    const count = await notificationService.markAllAsRead(req.user.id);

    res.json({
      success: true,
      message: `${count} notifications marked as read`,
      count: count
    });
  } catch (error) {
    logger.error('Error marking all notifications as read:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'UPDATE_ERROR',
        message: 'Failed to mark all notifications as read'
      }
    });
  }
});

// Get notification preferences
router.get('/preferences', authenticateToken, async (req, res) => {
  try {
    const { query } = require('../config/database');
    
    const result = await query(
      'SELECT notification_preferences FROM users WHERE id = $1',
      [req.user.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'USER_NOT_FOUND',
          message: 'User not found'
        }
      });
    }

    const preferences = result.rows[0].notification_preferences || {
      email_enabled: true,
      in_app_enabled: true,
      due_date_reminders: true,
      file_upload_notifications: true,
      batch_frequency: 'hourly'
    };

    res.json({
      success: true,
      preferences: preferences
    });
  } catch (error) {
    logger.error('Error fetching notification preferences:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'FETCH_ERROR',
        message: 'Failed to fetch notification preferences'
      }
    });
  }
});

// Update notification preferences
router.put('/preferences', authenticateToken, async (req, res) => {
  try {
    const {
      email_enabled,
      in_app_enabled,
      due_date_reminders,
      file_upload_notifications,
      batch_frequency
    } = req.body;

    const preferences = {
      email_enabled: email_enabled !== undefined ? email_enabled : true,
      in_app_enabled: in_app_enabled !== undefined ? in_app_enabled : true,
      due_date_reminders: due_date_reminders !== undefined ? due_date_reminders : true,
      file_upload_notifications: file_upload_notifications !== undefined ? file_upload_notifications : true,
      batch_frequency: batch_frequency || 'hourly'
    };

    const { query } = require('../config/database');
    
    await query(
      'UPDATE users SET notification_preferences = $1 WHERE id = $2',
      [JSON.stringify(preferences), req.user.id]
    );

    res.json({
      success: true,
      message: 'Notification preferences updated successfully',
      preferences: preferences
    });
  } catch (error) {
    logger.error('Error updating notification preferences:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'UPDATE_ERROR',
        message: 'Failed to update notification preferences'
      }
    });
  }
});

// Send test notification
router.post('/test', authenticateToken, async (req, res) => {
  try {
    const { type = 'system_notification' } = req.body;

    const notificationService = getNotificationService(req);
    const notification = await notificationService.testNotification(req.user.id, type);

    res.json({
      success: true,
      message: 'Test notification sent successfully',
      notification: notification
    });
  } catch (error) {
    logger.error('Error sending test notification:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'SEND_ERROR',
        message: 'Failed to send test notification'
      }
    });
  }
});

// Delete notification
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const notificationId = parseInt(id);

    if (isNaN(notificationId)) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_ID',
          message: 'Invalid notification ID'
        }
      });
    }

    const Notification = require('../models/Notification');
    const notification = await Notification.findById(notificationId, req.user.id);

    if (!notification) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'NOTIFICATION_NOT_FOUND',
          message: 'Notification not found'
        }
      });
    }

    await notification.delete();

    res.json({
      success: true,
      message: 'Notification deleted successfully'
    });
  } catch (error) {
    logger.error('Error deleting notification:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'DELETE_ERROR',
        message: 'Failed to delete notification'
      }
    });
  }
});

// Get notification statistics
router.get('/stats', authenticateToken, async (req, res) => {
  try {
    const { query } = require('../config/database');
    
    const result = await query(`
      SELECT 
        COUNT(*) as total,
        COUNT(CASE WHEN read = false THEN 1 END) as unread,
        COUNT(CASE WHEN created_at >= NOW() - INTERVAL '24 hours' THEN 1 END) as last_24h,
        COUNT(CASE WHEN created_at >= NOW() - INTERVAL '7 days' THEN 1 END) as last_7d
      FROM notifications 
      WHERE user_id = $1
    `, [req.user.id]);

    const stats = result.rows[0];

    res.json({
      success: true,
      stats: {
        total: parseInt(stats.total),
        unread: parseInt(stats.unread),
        last_24h: parseInt(stats.last_24h),
        last_7d: parseInt(stats.last_7d)
      }
    });
  } catch (error) {
    logger.error('Error fetching notification stats:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'STATS_ERROR',
        message: 'Failed to fetch notification statistics'
      }
    });
  }
});

module.exports = router;



