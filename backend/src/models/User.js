// User model for database operations v0.4
const bcrypt = require('bcryptjs');
const { query } = require('../config/database');
const { logger } = require('../utils/logger');

class User {
  constructor(data) {
    this.id = data.id;
    this.username = data.username;
    this.email = data.email;
    this.password_hash = data.password_hash;
    this.created_at = data.created_at;
    this.updated_at = data.updated_at;
  }

  // Create a new user
  static async create(userData) {
    try {
      const { username, email, password } = userData;
      
      // Hash password
      const saltRounds = parseInt(process.env.BCRYPT_ROUNDS) || 12;
      const password_hash = await bcrypt.hash(password, saltRounds);
      
      const result = await query(
        `INSERT INTO users (username, email, password_hash) 
         VALUES ($1, $2, $3) 
         RETURNING id, username, email, created_at, updated_at`,
        [username, email, password_hash]
      );
      
      logger.info('User created successfully', { userId: result.rows[0].id, email });
      return new User(result.rows[0]);
    } catch (error) {
      logger.error('Error creating user', { error: error.message, email: userData.email });
      throw error;
    }
  }

  // Find user by ID
  static async findById(id) {
    try {
      const result = await query(
        'SELECT * FROM users WHERE id = $1',
        [id]
      );
      
      if (result.rows.length === 0) {
        return null;
      }
      
      return new User(result.rows[0]);
    } catch (error) {
      logger.error('Error finding user by ID', { error: error.message, userId: id });
      throw error;
    }
  }

  // Find user by email
  static async findByEmail(email) {
    try {
      const result = await query(
        'SELECT * FROM users WHERE email = $1',
        [email]
      );
      
      if (result.rows.length === 0) {
        return null;
      }
      
      return new User(result.rows[0]);
    } catch (error) {
      logger.error('Error finding user by email', { error: error.message, email });
      throw error;
    }
  }

  // Find user by username
  static async findByUsername(username) {
    try {
      const result = await query(
        'SELECT * FROM users WHERE username = $1',
        [username]
      );
      
      if (result.rows.length === 0) {
        return null;
      }
      
      return new User(result.rows[0]);
    } catch (error) {
      logger.error('Error finding user by username', { error: error.message, username });
      throw error;
    }
  }

  // Update user
  async update(updateData) {
    try {
      const allowedFields = ['username', 'email'];
      const updates = [];
      const values = [];
      let paramCount = 1;

      for (const [key, value] of Object.entries(updateData)) {
        if (allowedFields.includes(key)) {
          updates.push(`${key} = $${paramCount}`);
          values.push(value);
          paramCount++;
        }
      }

      if (updates.length === 0) {
        throw new Error('No valid fields to update');
      }

      values.push(this.id);
      const result = await query(
        `UPDATE users SET ${updates.join(', ')}, updated_at = CURRENT_TIMESTAMP 
         WHERE id = $${paramCount} 
         RETURNING *`,
        values
      );

      // Update instance properties
      Object.assign(this, result.rows[0]);
      
      logger.info('User updated successfully', { userId: this.id });
      return this;
    } catch (error) {
      logger.error('Error updating user', { error: error.message, userId: this.id });
      throw error;
    }
  }

  // Delete user
  async delete() {
    try {
      await query('DELETE FROM users WHERE id = $1', [this.id]);
      logger.info('User deleted successfully', { userId: this.id });
      return true;
    } catch (error) {
      logger.error('Error deleting user', { error: error.message, userId: this.id });
      throw error;
    }
  }

  // Verify password
  async verifyPassword(password) {
    try {
      return await bcrypt.compare(password, this.password_hash);
    } catch (error) {
      logger.error('Error verifying password', { error: error.message, userId: this.id });
      throw error;
    }
  }

  // Update last login (placeholder for future implementation)
  async updateLastLogin() {
    try {
      // This will be implemented when we add last_login column in future versions
      logger.info('Last login update requested', { userId: this.id });
    } catch (error) {
      logger.error('Error updating last login', { error: error.message, userId: this.id });
      throw error;
    }
  }

  // Get user without sensitive data
  toJSON() {
    const { password_hash, ...userWithoutPassword } = this;
    return userWithoutPassword;
  }

  // Get all users (admin function)
  static async findAll(limit = 50, offset = 0) {
    try {
      const result = await query(
        'SELECT id, username, email, created_at, updated_at FROM users ORDER BY created_at DESC LIMIT $1 OFFSET $2',
        [limit, offset]
      );
      
      return result.rows.map(row => new User(row));
    } catch (error) {
      logger.error('Error finding all users', { error: error.message });
      throw error;
    }
  }

  // Count total users
  static async count() {
    try {
      const result = await query('SELECT COUNT(*) as count FROM users');
      return parseInt(result.rows[0].count);
    } catch (error) {
      logger.error('Error counting users', { error: error.message });
      throw error;
    }
  }
}

module.exports = User;