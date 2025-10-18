// Notification Model for Todo App v0.7
// Handles notification data and database operations

const { pool } = require('../config/database');
const { logger } = require('../utils/logger');

class Notification {
  constructor(data) {
    this.id = data.id;
    this.user_id = data.user_id;
    this.type = data.type;
    this.title = data.title;
    this.message = data.message;
    this.data = data.data;
    this.read = data.read || false;
    this.created_at = data.created_at;
    this.updated_at = data.updated_at;
  }

  // Create a new notification
  static async create(notificationData) {
    const client = await pool.connect();
    try {
      const { user_id, type, title, message, data } = notificationData;
      
      const query = `
        INSERT INTO notifications (user_id, type, title, message, data)
        VALUES ($1, $2, $3, $4, $5)
        RETURNING *
      `;
      
      const values = [user_id, type, title, message, JSON.stringify(data || {})];
      const result = await client.query(query, values);
      
      logger.debug(`Created notification for user ${user_id}: ${type}`);
      return new Notification(result.rows[0]);
    } catch (error) {
      logger.error('Error creating notification:', error);
      throw error;
    } finally {
      client.release();
    }
  }

  // Get notifications for a user with pagination
  static async findByUserId(userId, options = {}) {
    const client = await pool.connect();
    try {
      const { 
        page = 1, 
        limit = 20, 
        unreadOnly = false,
        type = null 
      } = options;
      
      const offset = (page - 1) * limit;
      let whereClause = 'WHERE user_id = $1';
      const values = [userId];
      let paramCount = 1;

      if (unreadOnly) {
        paramCount++;
        whereClause += ` AND read = $${paramCount}`;
        values.push(false);
      }

      if (type) {
        paramCount++;
        whereClause += ` AND type = $${paramCount}`;
        values.push(type);
      }

      // Get notifications
      const query = `
        SELECT * FROM notifications 
        ${whereClause}
        ORDER BY created_at DESC
        LIMIT $${paramCount + 1} OFFSET $${paramCount + 2}
      `;
      
      values.push(limit, offset);
      const result = await client.query(query, values);

      // Get total count
      const countQuery = `
        SELECT COUNT(*) FROM notifications 
        ${whereClause}
      `;
      const countResult = await client.query(countQuery, values.slice(0, -2));
      const total = parseInt(countResult.rows[0].count);

      const notifications = result.rows.map(row => new Notification(row));

      return {
        notifications,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit)
        }
      };
    } catch (error) {
      logger.error('Error fetching notifications:', error);
      throw error;
    } finally {
      client.release();
    }
  }

  // Mark notification as read
  static async markAsRead(notificationId, userId) {
    const client = await pool.connect();
    try {
      const query = `
        UPDATE notifications 
        SET read = true, updated_at = CURRENT_TIMESTAMP
        WHERE id = $1 AND user_id = $2
        RETURNING *
      `;
      
      const result = await client.query(query, [notificationId, userId]);
      
      if (result.rows.length === 0) {
        throw new Error('Notification not found or access denied');
      }

      logger.debug(`Marked notification ${notificationId} as read for user ${userId}`);
      return new Notification(result.rows[0]);
    } catch (error) {
      logger.error('Error marking notification as read:', error);
      throw error;
    } finally {
      client.release();
    }
  }

  // Mark all notifications as read for a user
  static async markAllAsRead(userId) {
    const client = await pool.connect();
    try {
      const query = `
        UPDATE notifications 
        SET read = true, updated_at = CURRENT_TIMESTAMP
        WHERE user_id = $1 AND read = false
        RETURNING COUNT(*)
      `;
      
      const result = await client.query(query, [userId]);
      const count = parseInt(result.rows[0].count);

      logger.debug(`Marked ${count} notifications as read for user ${userId}`);
      return count;
    } catch (error) {
      logger.error('Error marking all notifications as read:', error);
      throw error;
    } finally {
      client.release();
    }
  }

  // Get unread notification count for a user
  static async getUnreadCount(userId) {
    const client = await pool.connect();
    try {
      const query = `
        SELECT COUNT(*) FROM notifications 
        WHERE user_id = $1 AND read = false
      `;
      
      const result = await client.query(query, [userId]);
      return parseInt(result.rows[0].count);
    } catch (error) {
      logger.error('Error getting unread notification count:', error);
      throw error;
    } finally {
      client.release();
    }
  }

  // Delete old notifications (cleanup)
  static async deleteOldNotifications(daysOld = 30) {
    const client = await pool.connect();
    try {
      const query = `
        DELETE FROM notifications 
        WHERE created_at < CURRENT_TIMESTAMP - INTERVAL '${daysOld} days'
        RETURNING COUNT(*)
      `;
      
      const result = await client.query(query);
      const count = parseInt(result.rows[0].count);

      logger.info(`Deleted ${count} old notifications (older than ${daysOld} days)`);
      return count;
    } catch (error) {
      logger.error('Error deleting old notifications:', error);
      throw error;
    } finally {
      client.release();
    }
  }

  // Get notification by ID
  static async findById(notificationId, userId) {
    const client = await pool.connect();
    try {
      const query = `
        SELECT * FROM notifications 
        WHERE id = $1 AND user_id = $2
      `;
      
      const result = await client.query(query, [notificationId, userId]);
      
      if (result.rows.length === 0) {
        return null;
      }

      return new Notification(result.rows[0]);
    } catch (error) {
      logger.error('Error finding notification by ID:', error);
      throw error;
    } finally {
      client.release();
    }
  }

  // Update notification
  async update(updateData) {
    const client = await pool.connect();
    try {
      const allowedFields = ['title', 'message', 'data', 'read'];
      const updates = [];
      const values = [];
      let paramCount = 0;

      for (const [key, value] of Object.entries(updateData)) {
        if (allowedFields.includes(key)) {
          paramCount++;
          updates.push(`${key} = $${paramCount}`);
          values.push(key === 'data' ? JSON.stringify(value) : value);
        }
      }

      if (updates.length === 0) {
        throw new Error('No valid fields to update');
      }

      paramCount++;
      updates.push(`updated_at = $${paramCount}`);
      values.push(new Date());

      paramCount++;
      values.push(this.id);
      paramCount++;
      values.push(this.user_id);

      const query = `
        UPDATE notifications 
        SET ${updates.join(', ')}
        WHERE id = $${paramCount - 1} AND user_id = $${paramCount}
        RETURNING *
      `;

      const result = await client.query(query, values);
      
      if (result.rows.length === 0) {
        throw new Error('Notification not found or access denied');
      }

      // Update current instance
      Object.assign(this, result.rows[0]);
      
      logger.debug(`Updated notification ${this.id}`);
      return this;
    } catch (error) {
      logger.error('Error updating notification:', error);
      throw error;
    } finally {
      client.release();
    }
  }

  // Delete notification
  async delete() {
    const client = await pool.connect();
    try {
      const query = `
        DELETE FROM notifications 
        WHERE id = $1 AND user_id = $2
        RETURNING *
      `;
      
      const result = await client.query(query, [this.id, this.user_id]);
      
      if (result.rows.length === 0) {
        throw new Error('Notification not found or access denied');
      }

      logger.debug(`Deleted notification ${this.id}`);
      return true;
    } catch (error) {
      logger.error('Error deleting notification:', error);
      throw error;
    } finally {
      client.release();
    }
  }

  // Convert to JSON
  toJSON() {
    return {
      id: this.id,
      user_id: this.user_id,
      type: this.type,
      title: this.title,
      message: this.message,
      data: this.data,
      read: this.read,
      created_at: this.created_at,
      updated_at: this.updated_at
    };
  }
}

module.exports = Notification;

