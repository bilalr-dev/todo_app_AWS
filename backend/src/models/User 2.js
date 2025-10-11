const { pool } = require('../config/database');

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
    const { username, email, password_hash } = userData;
    const [result] = await pool.execute(
      'INSERT INTO users (username, email, password_hash) VALUES (?, ?, ?)',
      [username, email, password_hash]
    );
    return result.insertId;
  }

  // Find user by email
  static async findByEmail(email) {
    const [rows] = await pool.execute(
      'SELECT * FROM users WHERE email = ?',
      [email]
    );
    return rows.length > 0 ? new User(rows[0]) : null;
  }

  // Find user by username
  static async findByUsername(username) {
    const [rows] = await pool.execute(
      'SELECT * FROM users WHERE username = ?',
      [username]
    );
    return rows.length > 0 ? new User(rows[0]) : null;
  }

  // Find user by ID
  static async findById(id) {
    const [rows] = await pool.execute(
      'SELECT * FROM users WHERE id = ?',
      [id]
    );
    return rows.length > 0 ? new User(rows[0]) : null;
  }

  // Update user
  async update(updateData) {
    const fields = [];
    const values = [];
    
    Object.keys(updateData).forEach(key => {
      if (updateData[key] !== undefined) {
        fields.push(`${key} = ?`);
        values.push(updateData[key]);
      }
    });
    
    if (fields.length === 0) return;
    
    values.push(this.id);
    await pool.execute(
      `UPDATE users SET ${fields.join(', ')} WHERE id = ?`,
      values
    );
  }

  // Delete user
  async delete() {
    await pool.execute('DELETE FROM users WHERE id = ?', [this.id]);
  }
}

module.exports = User;
