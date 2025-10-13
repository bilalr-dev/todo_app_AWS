// Integration tests for todos API endpoints
const request = require('supertest');
const app = require('../../../backend/server');
const db = require('../../../backend/src/config/database');
const jwt = require('jsonwebtoken');

// Mock database
jest.mock('../../../backend/src/config/database', () => ({
  query: jest.fn(),
}));

describe('Todos API Integration Tests', () => {
  let authToken;
  let userId = 1;

  beforeEach(() => {
    jest.clearAllMocks();
    authToken = jwt.sign({ userId }, process.env.JWT_SECRET || 'test-secret');
  });

  // Get todos tests
  describe('GET /api/todos', () => {
    test('retrieves todos for authenticated user', async () => {
      const mockTodos = [
        {
          id: 1,
          title: 'Test Todo 1',
          description: 'Description 1',
          priority: 'high',
          category: 'work',
          due_date: '2023-12-25',
          completed: false,
          user_id: userId,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
        {
          id: 2,
          title: 'Test Todo 2',
          description: 'Description 2',
          priority: 'medium',
          category: 'personal',
          due_date: '2023-12-30',
          completed: true,
          user_id: userId,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
      ];

      db.query.mockResolvedValueOnce({
        rows: mockTodos,
        rowCount: 2,
      });

      const response = await request(app)
        .get('/api/todos')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.todos).toHaveLength(2);
      expect(response.body.data.todos[0]).toMatchObject({
        id: 1,
        title: 'Test Todo 1',
        priority: 'high',
        category: 'work',
      });
    });

    test('handles pagination parameters', async () => {
      db.query.mockResolvedValueOnce({
        rows: [],
        rowCount: 0,
      });

      const response = await request(app)
        .get('/api/todos?page=2&limit=5')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(db.query).toHaveBeenCalledWith(
        expect.stringContaining('LIMIT'),
        expect.arrayContaining([userId, 5, 5]) // offset = (page - 1) * limit
      );
    });

    test('handles sorting parameters', async () => {
      db.query.mockResolvedValueOnce({
        rows: [],
        rowCount: 0,
      });

      const response = await request(app)
        .get('/api/todos?sortBy=due_date&sortDirection=ASC')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(db.query).toHaveBeenCalledWith(
        expect.stringContaining('ORDER BY due_date ASC'),
        expect.any(Array)
      );
    });

    test('rejects request without authentication', async () => {
      const response = await request(app)
        .get('/api/todos')
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.error.message).toContain('token');
    });

    test('handles empty todo list', async () => {
      db.query.mockResolvedValueOnce({
        rows: [],
        rowCount: 0,
      });

      const response = await request(app)
        .get('/api/todos')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.todos).toHaveLength(0);
    });
  });

  // Create todo tests
  describe('POST /api/todos', () => {
    test('creates a new todo successfully', async () => {
      const todoData = {
        title: 'New Todo',
        description: 'New Description',
        priority: 'high',
        category: 'work',
        due_date: '2023-12-25',
      };

      const createdTodo = {
        id: 1,
        ...todoData,
        completed: false,
        user_id: userId,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      db.query.mockResolvedValueOnce({
        rows: [createdTodo],
        rowCount: 1,
      });

      const response = await request(app)
        .post('/api/todos')
        .set('Authorization', `Bearer ${authToken}`)
        .send(todoData)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.todo).toMatchObject(todoData);
      expect(response.body.data.todo.user_id).toBe(userId);
    });

    test('validates required fields', async () => {
      const response = await request(app)
        .post('/api/todos')
        .set('Authorization', `Bearer ${authToken}`)
        .send({})
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error.message).toContain('required');
    });

    test('validates priority values', async () => {
      const todoData = {
        title: 'Test Todo',
        priority: 'invalid',
      };

      const response = await request(app)
        .post('/api/todos')
        .set('Authorization', `Bearer ${authToken}`)
        .send(todoData)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error.message).toContain('priority');
    });

    test('validates date format', async () => {
      const todoData = {
        title: 'Test Todo',
        due_date: 'invalid-date',
      };

      const response = await request(app)
        .post('/api/todos')
        .set('Authorization', `Bearer ${authToken}`)
        .send(todoData)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error.message).toContain('date');
    });

    test('rejects request without authentication', async () => {
      const response = await request(app)
        .post('/api/todos')
        .send({ title: 'Test Todo' })
        .expect(401);

      expect(response.body.success).toBe(false);
    });
  });

  // Get todo by ID tests
  describe('GET /api/todos/:id', () => {
    test('retrieves specific todo', async () => {
      const mockTodo = {
        id: 1,
        title: 'Test Todo',
        description: 'Test Description',
        priority: 'high',
        category: 'work',
        due_date: '2023-12-25',
        completed: false,
        user_id: userId,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      db.query.mockResolvedValueOnce({
        rows: [mockTodo],
        rowCount: 1,
      });

      const response = await request(app)
        .get('/api/todos/1')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.todo).toMatchObject(mockTodo);
    });

    test('returns 404 for non-existent todo', async () => {
      db.query.mockResolvedValueOnce({
        rows: [],
        rowCount: 0,
      });

      const response = await request(app)
        .get('/api/todos/999')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.error.message).toContain('not found');
    });

    test('prevents access to other users todos', async () => {
      const otherUserToken = jwt.sign({ userId: 2 }, process.env.JWT_SECRET || 'test-secret');

      db.query.mockResolvedValueOnce({
        rows: [],
        rowCount: 0,
      });

      const response = await request(app)
        .get('/api/todos/1')
        .set('Authorization', `Bearer ${otherUserToken}`)
        .expect(404);

      expect(response.body.success).toBe(false);
    });

    test('validates todo ID format', async () => {
      const response = await request(app)
        .get('/api/todos/invalid-id')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error.message).toContain('ID');
    });
  });

  // Update todo tests
  describe('PUT /api/todos/:id', () => {
    test('updates todo successfully', async () => {
      const updateData = {
        title: 'Updated Todo',
        description: 'Updated Description',
        priority: 'low',
        category: 'personal',
        due_date: '2023-12-30',
        completed: true,
      };

      const updatedTodo = {
        id: 1,
        ...updateData,
        user_id: userId,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      db.query.mockResolvedValueOnce({
        rows: [updatedTodo],
        rowCount: 1,
      });

      const response = await request(app)
        .put('/api/todos/1')
        .set('Authorization', `Bearer ${authToken}`)
        .send(updateData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.todo).toMatchObject(updateData);
    });

    test('handles partial updates', async () => {
      const updateData = { title: 'Updated Title Only' };
      const updatedTodo = {
        id: 1,
        title: 'Updated Title Only',
        description: 'Original Description',
        priority: 'medium',
        category: 'work',
        due_date: '2023-12-25',
        completed: false,
        user_id: userId,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      db.query.mockResolvedValueOnce({
        rows: [updatedTodo],
        rowCount: 1,
      });

      const response = await request(app)
        .put('/api/todos/1')
        .set('Authorization', `Bearer ${authToken}`)
        .send(updateData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.todo.title).toBe('Updated Title Only');
    });

    test('returns 404 for non-existent todo', async () => {
      db.query.mockResolvedValueOnce({
        rows: [],
        rowCount: 0,
      });

      const response = await request(app)
        .put('/api/todos/999')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ title: 'Updated' })
        .expect(404);

      expect(response.body.success).toBe(false);
    });

    test('validates update data', async () => {
      const response = await request(app)
        .put('/api/todos/1')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ priority: 'invalid' })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error.message).toContain('priority');
    });
  });

  // Delete todo tests
  describe('DELETE /api/todos/:id', () => {
    test('deletes todo successfully', async () => {
      db.query.mockResolvedValueOnce({
        rows: [],
        rowCount: 1,
      });

      const response = await request(app)
        .delete('/api/todos/1')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toContain('deleted');
    });

    test('returns 404 for non-existent todo', async () => {
      db.query.mockResolvedValueOnce({
        rows: [],
        rowCount: 0,
      });

      const response = await request(app)
        .delete('/api/todos/999')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(404);

      expect(response.body.success).toBe(false);
    });

    test('prevents deletion of other users todos', async () => {
      const otherUserToken = jwt.sign({ userId: 2 }, process.env.JWT_SECRET || 'test-secret');

      db.query.mockResolvedValueOnce({
        rows: [],
        rowCount: 0,
      });

      const response = await request(app)
        .delete('/api/todos/1')
        .set('Authorization', `Bearer ${otherUserToken}`)
        .expect(404);

      expect(response.body.success).toBe(false);
    });
  });

  // Toggle complete tests
  describe('PATCH /api/todos/:id/toggle', () => {
    test('toggles completion status', async () => {
      const toggledTodo = {
        id: 1,
        title: 'Test Todo',
        completed: true,
        user_id: userId,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      db.query.mockResolvedValueOnce({
        rows: [toggledTodo],
        rowCount: 1,
      });

      const response = await request(app)
        .patch('/api/todos/1/toggle')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.todo.completed).toBe(true);
    });

    test('returns 404 for non-existent todo', async () => {
      db.query.mockResolvedValueOnce({
        rows: [],
        rowCount: 0,
      });

      const response = await request(app)
        .patch('/api/todos/999/toggle')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(404);

      expect(response.body.success).toBe(false);
    });
  });

  // Get stats tests
  describe('GET /api/todos/stats', () => {
    test('retrieves todo statistics', async () => {
      const mockStats = {
        total: '10',
        completed: '6',
        pending: '4',
        high_priority: '2',
      };

      db.query.mockResolvedValueOnce({
        rows: [mockStats],
        rowCount: 1,
      });

      const response = await request(app)
        .get('/api/todos/stats')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.stats).toEqual({
        total: 10,
        completed: 6,
        pending: 4,
        high_priority: 2,
      });
    });

    test('handles zero statistics', async () => {
      const mockStats = {
        total: '0',
        completed: '0',
        pending: '0',
        high_priority: '0',
      };

      db.query.mockResolvedValueOnce({
        rows: [mockStats],
        rowCount: 1,
      });

      const response = await request(app)
        .get('/api/todos/stats')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.stats).toEqual({
        total: 0,
        completed: 0,
        pending: 0,
        high_priority: 0,
      });
    });
  });

  // Search tests
  describe('GET /api/todos/search', () => {
    test('searches todos by query', async () => {
      const mockResults = [
        {
          id: 1,
          title: 'Test Todo',
          description: 'Test Description',
          priority: 'high',
          category: 'work',
          due_date: '2023-12-25',
          completed: false,
          user_id: userId,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
      ];

      db.query.mockResolvedValueOnce({
        rows: mockResults,
        rowCount: 1,
      });

      const response = await request(app)
        .get('/api/todos/search?q=test')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.todos).toHaveLength(1);
      expect(response.body.data.todos[0].title).toContain('Test');
    });

    test('handles empty search query', async () => {
      db.query.mockResolvedValueOnce({
        rows: [],
        rowCount: 0,
      });

      const response = await request(app)
        .get('/api/todos/search?q=')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.todos).toHaveLength(0);
    });

    test('handles search with special characters', async () => {
      db.query.mockResolvedValueOnce({
        rows: [],
        rowCount: 0,
      });

      const response = await request(app)
        .get('/api/todos/search?q=%20%21%40%23')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
    });
  });

  // Edge cases
  describe('Edge Cases', () => {
    test('handles database connection errors', async () => {
      db.query.mockRejectedValueOnce(new Error('Database connection failed'));

      const response = await request(app)
        .get('/api/todos')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(500);

      expect(response.body.success).toBe(false);
      expect(response.body.error.message).toContain('server error');
    });

    test('handles malformed JSON in request body', async () => {
      const response = await request(app)
        .post('/api/todos')
        .set('Authorization', `Bearer ${authToken}`)
        .set('Content-Type', 'application/json')
        .send('invalid json')
        .expect(400);

      expect(response.body.success).toBe(false);
    });

    test('handles very long text inputs', async () => {
      const longText = 'a'.repeat(10000);
      
      const response = await request(app)
        .post('/api/todos')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          title: longText,
          description: longText,
        })
        .expect(400);

      expect(response.body.success).toBe(false);
    });

    test('handles concurrent requests', async () => {
      const todoData = {
        title: 'Concurrent Todo',
        description: 'Test concurrent creation',
      };

      const createdTodo = {
        id: 1,
        ...todoData,
        priority: 'medium',
        category: 'work',
        due_date: null,
        completed: false,
        user_id: userId,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      db.query.mockResolvedValue({
        rows: [createdTodo],
        rowCount: 1,
      });

      // Make concurrent requests
      const promises = Array.from({ length: 3 }, () =>
        request(app)
          .post('/api/todos')
          .set('Authorization', `Bearer ${authToken}`)
          .send(todoData)
      );

      const responses = await Promise.all(promises);
      
      // All should succeed
      responses.forEach(response => {
        expect(response.status).toBe(201);
        expect(response.body.success).toBe(true);
      });
    });

    test('handles invalid date formats gracefully', async () => {
      const response = await request(app)
        .post('/api/todos')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          title: 'Test Todo',
          due_date: 'not-a-date',
        })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error.message).toContain('date');
    });
  });
});
