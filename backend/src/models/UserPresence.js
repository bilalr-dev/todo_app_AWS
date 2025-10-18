// User Presence Model for Todo App v0.7
// Tracks user WebSocket connection status

const { pool } = require('../config/database');
const { logger } = require('../utils/logger');

class UserPresence {
  constructor(data) {
    this.id = data.id;
    this.user_id = data.user_id;
    this.socket_id = data.socket_id;
    this.last_seen = data.last_seen;
    this.is_online = data.is_online;
    this.created_at = data.created_at;
  }

  // Create or update user presence
  static async upsert(userId, socketId, isOnline = true) {
    const client = await pool.connect();
    try {
      const query = `
        INSERT INTO user_presence (user_id, socket_id, is_online, last_seen)
        VALUES ($1, $2, $3, CURRENT_TIMESTAMP)
        ON CONFLICT (user_id, socket_id) 
        DO UPDATE SET 
          is_online = $3,
          last_seen = CURRENT_TIMESTAMP
        RETURNING *
      `;
      
      const result = await client.query(query, [userId, socketId, isOnline]);
      
      logger.debug(`Updated presence for user ${userId}: ${isOnline ? 'online' : 'offline'}`);
      return new UserPresence(result.rows[0]);
    } catch (error) {
      logger.error('Error updating user presence:', error);
      throw error;
    } finally {
      client.release();
    }
  }

  // Get user presence by user ID
  static async findByUserId(userId) {
    const client = await pool.connect();
    try {
      const query = `
        SELECT * FROM user_presence 
        WHERE user_id = $1 
        ORDER BY last_seen DESC
      `;
      
      const result = await client.query(query, [userId]);
      
      return result.rows.map(row => new UserPresence(row));
    } catch (error) {
      logger.error('Error fetching user presence:', error);
      throw error;
    } finally {
      client.release();
    }
  }

  // Get all online users
  static async getOnlineUsers() {
    const client = await pool.connect();
    try {
      const query = `
        SELECT DISTINCT u.id, u.username, u.email, up.last_seen
        FROM users u
        INNER JOIN user_presence up ON u.id = up.user_id
        WHERE up.is_online = true
        ORDER BY up.last_seen DESC
      `;
      
      const result = await client.query(query);
      return result.rows;
    } catch (error) {
      logger.error('Error fetching online users:', error);
      throw error;
    } finally {
      client.release();
    }
  }

  // Check if user is online
  static async isUserOnline(userId) {
    const client = await pool.connect();
    try {
      const query = `
        SELECT COUNT(*) FROM user_presence 
        WHERE user_id = $1 AND is_online = true
      `;
      
      const result = await client.query(query, [userId]);
      return parseInt(result.rows[0].count) > 0;
    } catch (error) {
      logger.error('Error checking user online status:', error);
      throw error;
    } finally {
      client.release();
    }
  }

  // Mark user as offline
  static async markOffline(userId, socketId = null) {
    const client = await pool.connect();
    try {
      let query, values;
      
      if (socketId) {
        // Mark specific socket as offline
        query = `
          UPDATE user_presence 
          SET is_online = false, last_seen = CURRENT_TIMESTAMP
          WHERE user_id = $1 AND socket_id = $2
          RETURNING *
        `;
        values = [userId, socketId];
      } else {
        // Mark all sockets for user as offline
        query = `
          UPDATE user_presence 
          SET is_online = false, last_seen = CURRENT_TIMESTAMP
          WHERE user_id = $1
          RETURNING *
        `;
        values = [userId];
      }
      
      const result = await client.query(query, values);
      
      logger.debug(`Marked user ${userId} as offline`);
      return result.rows.map(row => new UserPresence(row));
    } catch (error) {
      logger.error('Error marking user as offline:', error);
      throw error;
    } finally {
      client.release();
    }
  }

  // Clean up old presence records
  static async cleanupOldPresence(hoursOld = 24) {
    const client = await pool.connect();
    try {
      const query = `
        DELETE FROM user_presence 
        WHERE last_seen < CURRENT_TIMESTAMP - INTERVAL '${hoursOld} hours'
        RETURNING COUNT(*)
      `;
      
      const result = await client.query(query);
      const count = parseInt(result.rows[0].count);

      logger.info(`Cleaned up ${count} old presence records (older than ${hoursOld} hours)`);
      return count;
    } catch (error) {
      logger.error('Error cleaning up old presence records:', error);
      throw error;
    } finally {
      client.release();
    }
  }

  // Get user presence statistics
  static async getPresenceStats() {
    const client = await pool.connect();
    try {
      const query = `
        SELECT 
          COUNT(DISTINCT user_id) as total_users,
          COUNT(DISTINCT CASE WHEN is_online = true THEN user_id END) as online_users,
          COUNT(DISTINCT CASE WHEN is_online = false THEN user_id END) as offline_users,
          COUNT(*) as total_connections
        FROM user_presence
      `;
      
      const result = await client.query(query);
      return result.rows[0];
    } catch (error) {
      logger.error('Error getting presence statistics:', error);
      throw error;
    } finally {
      client.release();
    }
  }

  // Delete presence record
  static async delete(userId, socketId) {
    const client = await pool.connect();
    try {
      const query = `
        DELETE FROM user_presence 
        WHERE user_id = $1 AND socket_id = $2
        RETURNING *
      `;
      
      const result = await client.query(query, [userId, socketId]);
      
      if (result.rows.length === 0) {
        return null;
      }

      logger.debug(`Deleted presence record for user ${userId}, socket ${socketId}`);
      return new UserPresence(result.rows[0]);
    } catch (error) {
      logger.error('Error deleting presence record:', error);
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
      socket_id: this.socket_id,
      last_seen: this.last_seen,
      is_online: this.is_online,
      created_at: this.created_at
    };
  }
}

module.exports = UserPresence;



