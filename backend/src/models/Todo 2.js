const { pool } = require('../config/database');

class Todo {
  constructor(data) {
    this.id = data.id;
    this.user_id = data.user_id;
    this.title = data.title;
    this.description = data.description;
    this.priority = data.priority;
    this.due_date = data.due_date;
    this.category = data.category;
    this.completed = data.completed;
    this.position = data.position;
    this.created_at = data.created_at;
    this.updated_at = data.updated_at;
  }

  // Create a new todo
  static async create(todoData) {
    const { user_id, title, description, priority, due_date, category } = todoData;
    const [result] = await pool.execute(
      'INSERT INTO todos (user_id, title, description, priority, due_date, category) VALUES (?, ?, ?, ?, ?, ?)',
      [user_id, title, description, priority, due_date, category]
    );
    return result.insertId;
  }

  // Find todos by user ID
  static async findByUserId(userId) {
    const [rows] = await pool.execute(
      'SELECT * FROM todos WHERE user_id = ? ORDER BY position ASC, created_at DESC',
      [userId]
    );
    return rows.map(row => new Todo(row));
  }

  // Find todo by ID
  static async findById(id) {
    const [rows] = await pool.execute(
      'SELECT * FROM todos WHERE id = ?',
      [id]
    );
    return rows.length > 0 ? new Todo(rows[0]) : null;
  }

  // Update todo
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
      `UPDATE todos SET ${fields.join(', ')} WHERE id = ?`,
      values
    );
  }

  // Delete todo
  async delete() {
    await pool.execute('DELETE FROM todos WHERE id = ?', [this.id]);
  }

  // Toggle completion status
  async toggleComplete() {
    this.completed = !this.completed;
    await this.update({ completed: this.completed });
  }
}

module.exports = Todo;
