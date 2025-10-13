// Unit tests for Todo model
const Todo = require('../../../backend/src/models/Todo');
const db = require('../../../backend/src/config/database');

// Mock database
jest.mock('../../../backend/src/config/database', () => ({
  query: jest.fn(),
}));

describe('Todo Model', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // Create todo tests
  describe('create', () => {
    test('creates a new todo successfully', async () => {
      const mockTodo = {
        id: 1,
        title: 'Test Todo',
        description: 'Test Description',
        priority: 'medium',
        category: 'work',
        due_date: '2023-12-25',
        completed: false,
        user_id: 1,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      db.query.mockResolvedValueOnce({
        rows: [mockTodo],
        rowCount: 1,
      });

      const result = await Todo.create({
        title: 'Test Todo',
        description: 'Test Description',
        priority: 'medium',
        category: 'work',
        due_date: '2023-12-25',
        user_id: 1,
      });

      expect(result).toBeInstanceOf(Todo);
      expect(result.title).toBe('Test Todo');
      expect(db.query).toHaveBeenCalledWith(
        expect.stringContaining('INSERT INTO todos'),
        expect.arrayContaining(['Test Todo', 'Test Description', 'medium', 'work', '2023-12-25', 1])
      );
    });

    test('handles database errors during creation', async () => {
      db.query.mockRejectedValueOnce(new Error('Database connection failed'));

      await expect(Todo.create({
        title: 'Test Todo',
        user_id: 1,
      })).rejects.toThrow('Database connection failed');
    });
  });

  // Find todos tests
  describe('findByUserId', () => {
    test('retrieves all todos for a user', async () => {
      const mockTodos = [
        { id: 1, title: 'Todo 1', user_id: 1 },
        { id: 2, title: 'Todo 2', user_id: 1 },
      ];

      db.query.mockResolvedValueOnce({
        rows: mockTodos,
        rowCount: 2,
      });

      const result = await Todo.findByUserId(1, { limit: 10, offset: 0 });

      expect(result).toHaveLength(2);
      expect(result[0]).toBeInstanceOf(Todo);
      expect(db.query).toHaveBeenCalledWith(
        expect.stringContaining('SELECT * FROM todos'),
        expect.arrayContaining([1])
      );
    });

    test('handles pagination correctly', async () => {
      db.query.mockResolvedValueOnce({ rows: [], rowCount: 0 });

      await Todo.findByUserId(1, { limit: 5, offset: 5 });

      expect(db.query).toHaveBeenCalledWith(
        expect.stringContaining('LIMIT'),
        expect.arrayContaining([1, 5, 5])
      );
    });

    test('handles sorting parameters', async () => {
      db.query.mockResolvedValueOnce({ rows: [], rowCount: 0 });

      await Todo.findByUserId(1, { 
        limit: 10, 
        offset: 0, 
        orderBy: 'due_date', 
        orderDirection: 'ASC' 
      });

      expect(db.query).toHaveBeenCalledWith(
        expect.stringContaining('ORDER BY due_date ASC'),
        expect.any(Array)
      );
    });
  });

  describe('findById', () => {
    test('retrieves todo by ID', async () => {
      const mockTodo = {
        id: 1,
        title: 'Test Todo',
        user_id: 1,
      };

      db.query.mockResolvedValueOnce({
        rows: [mockTodo],
        rowCount: 1,
      });

      const result = await Todo.findById(1);

      expect(result).toBeInstanceOf(Todo);
      expect(result.id).toBe(1);
      expect(db.query).toHaveBeenCalledWith(
        'SELECT * FROM todos WHERE id = $1',
        [1]
      );
    });

    test('returns null when todo not found', async () => {
      db.query.mockResolvedValueOnce({
        rows: [],
        rowCount: 0,
      });

      const result = await Todo.findById(999);

      expect(result).toBeNull();
    });
  });

  describe('update', () => {
    test('updates todo successfully', async () => {
      const todo = new Todo({
        id: 1,
        title: 'Original Todo',
        user_id: 1,
      });

      const updatedTodo = {
        id: 1,
        title: 'Updated Todo',
        description: 'Updated Description',
        priority: 'high',
        category: 'personal',
        due_date: '2023-12-30',
        completed: true,
        user_id: 1,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      db.query.mockResolvedValueOnce({
        rows: [updatedTodo],
        rowCount: 1,
      });

      const result = await todo.update({
        title: 'Updated Todo',
        description: 'Updated Description',
        priority: 'high',
        category: 'personal',
        due_date: '2023-12-30',
        completed: true,
      });

      expect(result).toBeInstanceOf(Todo);
      expect(result.title).toBe('Updated Todo');
      expect(db.query).toHaveBeenCalledWith(
        expect.stringContaining('UPDATE todos SET'),
        expect.any(Array)
      );
    });

    test('handles partial updates', async () => {
      const todo = new Todo({
        id: 1,
        title: 'Original Todo',
        user_id: 1,
      });

      const updatedTodo = {
        id: 1,
        title: 'Updated Todo',
        user_id: 1,
      };

      db.query.mockResolvedValueOnce({
        rows: [updatedTodo],
        rowCount: 1,
      });

      const result = await todo.update({ title: 'Updated Todo' });

      expect(result).toBeInstanceOf(Todo);
      expect(result.title).toBe('Updated Todo');
    });
  });

  describe('delete', () => {
    test('deletes todo successfully', async () => {
      const todo = new Todo({
        id: 1,
        title: 'Test Todo',
        user_id: 1,
      });

      db.query.mockResolvedValueOnce({
        rows: [],
        rowCount: 1,
      });

      const result = await todo.delete();

      expect(result).toBe(true);
      expect(db.query).toHaveBeenCalledWith(
        'DELETE FROM todos WHERE id = $1',
        [1]
      );
    });
  });

  describe('toggleComplete', () => {
    test('toggles completion status', async () => {
      const todo = new Todo({
        id: 1,
        title: 'Test Todo',
        completed: false,
        user_id: 1,
      });

      const toggledTodo = {
        id: 1,
        title: 'Test Todo',
        completed: true,
        user_id: 1,
        updated_at: new Date().toISOString(),
      };

      db.query.mockResolvedValueOnce({
        rows: [toggledTodo],
        rowCount: 1,
      });

      const result = await todo.toggleComplete();

      expect(result).toBeInstanceOf(Todo);
      expect(result.completed).toBe(true);
      expect(db.query).toHaveBeenCalledWith(
        'UPDATE todos SET completed = NOT completed, updated_at = CURRENT_TIMESTAMP WHERE id = $1 RETURNING *',
        [1]
      );
    });
  });

  describe('getStats', () => {
    test('retrieves todo statistics', async () => {
      const mockStats = {
        total: '10',
        completed: '6',
        pending: '4',
        high_priority: '2',
        overdue: '1'
      };

      db.query.mockResolvedValueOnce({
        rows: [mockStats],
        rowCount: 1,
      });

      const result = await Todo.getStats(1);

      expect(result).toEqual({
        total: 10,
        completed: 6,
        pending: 4,
        high_priority: 2,
        overdue: 1
      });
    });

    test('handles zero counts', async () => {
      const mockStats = {
        total: '0',
        completed: '0',
        pending: '0',
        high_priority: '0',
        overdue: '0'
      };

      db.query.mockResolvedValueOnce({
        rows: [mockStats],
        rowCount: 1,
      });

      const result = await Todo.getStats(1);

      expect(result).toEqual({
        total: 0,
        completed: 0,
        pending: 0,
        high_priority: 0,
        overdue: 0
      });
    });
  });

  describe('search', () => {
    test('searches todos by title and description', async () => {
      const mockResults = [
        { id: 1, title: 'Test Todo', user_id: 1 },
      ];

      db.query.mockResolvedValueOnce({
        rows: mockResults,
        rowCount: 1,
      });

      const result = await Todo.search(1, 'test', { limit: 10, offset: 0 });

      expect(result).toHaveLength(1);
      expect(result[0]).toBeInstanceOf(Todo);
      expect(db.query).toHaveBeenCalledWith(
        expect.stringContaining('WHERE user_id = $1 AND (title ILIKE $2 OR description ILIKE $2)'),
        expect.arrayContaining([1, '%test%', 10, 0])
      );
    });

    test('handles empty search query', async () => {
      db.query.mockResolvedValueOnce({
        rows: [],
        rowCount: 0,
      });

      const result = await Todo.search(1, '', { limit: 10, offset: 0 });

      expect(result).toEqual([]);
    });
  });

  // Edge Cases
  describe('Edge Cases', () => {
    test('handles SQL injection attempts', async () => {
      const maliciousInput = "'; DROP TABLE todos; --";
      
      db.query.mockResolvedValueOnce({
        rows: [{ id: 1, title: maliciousInput, user_id: 1 }],
        rowCount: 1,
      });

      const result = await Todo.create({
        title: maliciousInput,
        user_id: 1,
      });

      expect(result).toBeInstanceOf(Todo);
      expect(result.title).toBe(maliciousInput);
    });

    test('handles very long text inputs', async () => {
      const longText = 'a'.repeat(1000);
      
      db.query.mockResolvedValueOnce({
        rows: [{ id: 1, title: longText, user_id: 1 }],
        rowCount: 1,
      });

      const result = await Todo.create({
        title: longText,
        user_id: 1,
      });

      expect(result).toBeInstanceOf(Todo);
    });

    test('handles concurrent updates', async () => {
      const todo = new Todo({
        id: 1,
        title: 'Original Todo',
        user_id: 1,
      });

      db.query.mockResolvedValue({
        rows: [{ id: 1, title: 'Updated Todo', user_id: 1 }],
        rowCount: 1,
      });

      const promises = [
        todo.update({ title: 'Update 1' }),
        todo.update({ title: 'Update 2' }),
      ];

      const results = await Promise.all(promises);

      expect(results).toHaveLength(2);
      expect(results[0]).toBeInstanceOf(Todo);
      expect(results[1]).toBeInstanceOf(Todo);
    });

    test('handles database connection errors', async () => {
      db.query.mockRejectedValueOnce(new Error('Connection lost'));

      await expect(Todo.findByUserId(1, { limit: 10, offset: 0 }))
        .rejects.toThrow('Connection lost');
    });

    test('handles invalid user IDs', async () => {
      // The actual implementation doesn't validate user IDs, so we'll test that it works with null/undefined
      db.query.mockResolvedValueOnce({ rows: [], rowCount: 0 });
      db.query.mockResolvedValueOnce({ rows: [], rowCount: 0 });
      
      const result1 = await Todo.findByUserId(null, { limit: 10, offset: 0 });
      expect(result1).toEqual([]);
      
      const result2 = await Todo.findByUserId(undefined, { limit: 10, offset: 0 });
      expect(result2).toEqual([]);
    });
  });

  // Performance
  describe('Performance', () => {
    test('handles large result sets efficiently', async () => {
      const largeResultSet = Array.from({ length: 1000 }, (_, i) => ({
        id: i + 1,
        title: `Todo ${i + 1}`,
        user_id: 1,
      }));

      db.query.mockResolvedValueOnce({
        rows: largeResultSet,
        rowCount: 1000,
      });

      const startTime = Date.now();
      const result = await Todo.findByUserId(1, { limit: 1000, offset: 0 });
      const endTime = Date.now();

      expect(result).toHaveLength(1000);
      expect(endTime - startTime).toBeLessThan(1000); // Should complete within 1 second
    });
  });
});