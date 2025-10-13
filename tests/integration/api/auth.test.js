// Integration tests for authentication API endpoints
const request = require('supertest');
const app = require('../../../backend/server');
const db = require('../../../backend/src/config/database');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

describe('Authentication API Integration Tests', () => {
  beforeEach(async () => {
    // Clean up any test data
    try {
      await db.query('DELETE FROM users WHERE email LIKE $1', ['test%@example.com']);
    } catch (error) {
      // Ignore cleanup errors
    }
  });

  // Registration tests
  describe('POST /api/auth/register', () => {
    test('registers a new user successfully', async () => {
      const userData = {
        username: 'testuser' + Date.now(),
        email: 'test' + Date.now() + '@example.com',
        password: 'Password123',
      };

      const response = await request(app)
        .post('/api/auth/register')
        .send(userData)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.user).toMatchObject({
        username: userData.username,
        email: userData.email,
      });
      expect(response.body.data.token).toBeDefined();
      expect(response.body.data.user.password_hash).toBeUndefined();
    });

    test('rejects registration with existing email', async () => {
      const userData = {
        username: 'testuser',
        email: 'existing@example.com',
        password: 'Password123',
      };

      // Mock user already exists
      db.query.mockResolvedValueOnce({
        rows: [{ id: 1, email: userData.email }],
        rowCount: 1,
      });

      const response = await request(app)
        .post('/api/auth/register')
        .send(userData)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error.message).toContain('already exists');
    });

    test('validates required fields', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({})
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error.message).toContain('required');
    });

    test('validates email format', async () => {
      const userData = {
        username: 'testuser',
        email: 'invalid-email',
        password: 'Password123',
      };

      const response = await request(app)
        .post('/api/auth/register')
        .send(userData)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error.message).toContain('email');
    });

    test('validates password strength', async () => {
      const userData = {
        username: 'testuser',
        email: 'test@example.com',
        password: 'weak',
      };

      const response = await request(app)
        .post('/api/auth/register')
        .send(userData)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error.message).toContain('password');
    });
  });

  // Login tests
  describe('POST /api/auth/login', () => {
    test('logs in user with valid credentials', async () => {
      const loginData = {
        email: 'demo@todoapp.com',
        password: 'demo123',
      };


      const response = await request(app)
        .post('/api/auth/login')
        .send(loginData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.user).toMatchObject({
        id: 1,
        username: 'demo',
        email: loginData.email,
      });
      expect(response.body.data.token).toBeDefined();
      expect(response.body.data.refreshToken).toBeDefined();
    });

    test('rejects login with invalid email', async () => {
      const loginData = {
        email: 'nonexistent@example.com',
        password: 'Password123',
      };

      // Mock user not found
      db.query.mockResolvedValueOnce({
        rows: [],
        rowCount: 0,
      });

      const response = await request(app)
        .post('/api/auth/login')
        .send(loginData)
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.error.message).toContain('Invalid credentials');
    });

    test('rejects login with invalid password', async () => {
      const loginData = {
        email: 'test@example.com',
        password: 'WrongPassword',
      };

      const hashedPassword = await bcrypt.hash('Password123', 12);
      const mockUser = {
        id: 1,
        username: 'testuser',
        email: loginData.email,
        password_hash: hashedPassword,
      };

      // Mock user lookup
      db.query.mockResolvedValueOnce({
        rows: [mockUser],
        rowCount: 1,
      });

      const response = await request(app)
        .post('/api/auth/login')
        .send(loginData)
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.error.message).toContain('Invalid credentials');
    });

    test('validates required fields', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({})
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error.message).toContain('required');
    });
  });

  // Logout tests
  describe('POST /api/auth/logout', () => {
    test('logs out user with valid token', async () => {
      const token = jwt.sign({ userId: 1 }, process.env.JWT_SECRET || 'test-secret');

      const response = await request(app)
        .post('/api/auth/logout')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toContain('logged out');
    });

    test('handles logout without token', async () => {
      const response = await request(app)
        .post('/api/auth/logout')
        .expect(200);

      expect(response.body.success).toBe(true);
    });

    test('handles logout with invalid token', async () => {
      const response = await request(app)
        .post('/api/auth/logout')
        .set('Authorization', 'Bearer invalid-token')
        .expect(200);

      expect(response.body.success).toBe(true);
    });
  });

  // Profile tests
  describe('GET /api/auth/profile', () => {
    test('retrieves user profile with valid token', async () => {
      const token = jwt.sign({ userId: 1 }, process.env.JWT_SECRET || 'test-secret');
      const mockUser = {
        id: 1,
        username: 'testuser',
        email: 'test@example.com',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      // Mock user lookup
      db.query.mockResolvedValueOnce({
        rows: [mockUser],
        rowCount: 1,
      });

      const response = await request(app)
        .get('/api/auth/profile')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.user).toMatchObject({
        id: 1,
        username: 'testuser',
        email: 'test@example.com',
      });
    });

    test('rejects request without token', async () => {
      const response = await request(app)
        .get('/api/auth/profile')
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.error.message).toContain('token');
    });

    test('rejects request with invalid token', async () => {
      const response = await request(app)
        .get('/api/auth/profile')
        .set('Authorization', 'Bearer invalid-token')
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.error.message).toContain('token');
    });

    test('handles user not found', async () => {
      const token = jwt.sign({ userId: 999 }, process.env.JWT_SECRET || 'test-secret');

      // Mock user not found
      db.query.mockResolvedValueOnce({
        rows: [],
        rowCount: 0,
      });

      const response = await request(app)
        .get('/api/auth/profile')
        .set('Authorization', `Bearer ${token}`)
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.error.message).toContain('not found');
    });
  });

  // Update profile tests
  describe('PUT /api/auth/profile', () => {
    test('updates user profile successfully', async () => {
      const token = jwt.sign({ userId: 1 }, process.env.JWT_SECRET || 'test-secret');
      const updateData = {
        username: 'updateduser',
        email: 'updated@example.com',
      };

      const updatedUser = {
        id: 1,
        username: updateData.username,
        email: updateData.email,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      // Mock user lookup
      db.query.mockResolvedValueOnce({
        rows: [{ id: 1, username: 'olduser', email: 'old@example.com' }],
        rowCount: 1,
      });

      // Mock email uniqueness check
      db.query.mockResolvedValueOnce({
        rows: [],
        rowCount: 0,
      });

      // Mock user update
      db.query.mockResolvedValueOnce({
        rows: [updatedUser],
        rowCount: 1,
      });

      const response = await request(app)
        .put('/api/auth/profile')
        .set('Authorization', `Bearer ${token}`)
        .send(updateData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.user).toMatchObject(updateData);
    });

    test('validates email uniqueness', async () => {
      const token = jwt.sign({ userId: 1 }, process.env.JWT_SECRET || 'test-secret');
      const updateData = {
        email: 'existing@example.com',
      };

      // Mock user lookup
      db.query.mockResolvedValueOnce({
        rows: [{ id: 1, username: 'testuser', email: 'test@example.com' }],
        rowCount: 1,
      });

      // Mock email already exists
      db.query.mockResolvedValueOnce({
        rows: [{ id: 2, email: updateData.email }],
        rowCount: 1,
      });

      const response = await request(app)
        .put('/api/auth/profile')
        .set('Authorization', `Bearer ${token}`)
        .send(updateData)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error.message).toContain('already exists');
    });

    test('validates email format', async () => {
      const token = jwt.sign({ userId: 1 }, process.env.JWT_SECRET || 'test-secret');
      const updateData = {
        email: 'invalid-email',
      };

      const response = await request(app)
        .put('/api/auth/profile')
        .set('Authorization', `Bearer ${token}`)
        .send(updateData)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error.message).toContain('email');
    });
  });

  // Token refresh tests
  describe('POST /api/auth/refresh', () => {
    test('refreshes token successfully', async () => {
      const refreshToken = jwt.sign(
        { userId: 1, type: 'refresh' },
        process.env.JWT_SECRET || 'test-secret',
        { expiresIn: '7d' }
      );

      const mockUser = {
        id: 1,
        username: 'testuser',
        email: 'test@example.com',
      };

      // Mock user lookup
      db.query.mockResolvedValueOnce({
        rows: [mockUser],
        rowCount: 1,
      });

      const response = await request(app)
        .post('/api/auth/refresh')
        .send({ refreshToken })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.token).toBeDefined();
      expect(response.body.data.refreshToken).toBeDefined();
    });

    test('rejects invalid refresh token', async () => {
      const response = await request(app)
        .post('/api/auth/refresh')
        .send({ refreshToken: 'invalid-token' })
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.error.message).toContain('token');
    });

    test('rejects expired refresh token', async () => {
      const expiredToken = jwt.sign(
        { userId: 1, type: 'refresh' },
        process.env.JWT_SECRET || 'test-secret',
        { expiresIn: '-1h' }
      );

      const response = await request(app)
        .post('/api/auth/refresh')
        .send({ refreshToken: expiredToken })
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.error.message).toContain('expired');
    });
  });

  // Edge cases
  describe('Edge Cases', () => {
    test('handles database connection errors', async () => {
      db.query.mockRejectedValueOnce(new Error('Database connection failed'));

      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'test@example.com',
          password: 'Password123',
        })
        .expect(500);

      expect(response.body.success).toBe(false);
      expect(response.body.error.message).toContain('server error');
    });

    test('handles malformed JSON', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .set('Content-Type', 'application/json')
        .send('invalid json')
        .expect(400);

      expect(response.body.success).toBe(false);
    });

    test('handles very long input strings', async () => {
      const longString = 'a'.repeat(10000);
      
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          username: longString,
          email: 'test@example.com',
          password: 'Password123',
        })
        .expect(400);

      expect(response.body.success).toBe(false);
    });

    test('handles concurrent login attempts', async () => {
      const loginData = {
        email: 'test@example.com',
        password: 'Password123',
      };

      const hashedPassword = await bcrypt.hash(loginData.password, 12);
      const mockUser = {
        id: 1,
        username: 'testuser',
        email: loginData.email,
        password_hash: hashedPassword,
      };

      // Mock user lookup
      db.query.mockResolvedValue({
        rows: [mockUser],
        rowCount: 1,
      });

      // Mock last login update
      db.query.mockResolvedValue({
        rows: [],
        rowCount: 1,
      });

      // Make concurrent requests
      const promises = Array.from({ length: 5 }, () =>
        request(app)
          .post('/api/auth/login')
          .send(loginData)
      );

      const responses = await Promise.all(promises);
      
      // All should succeed
      responses.forEach(response => {
        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
      });
    });
  });
});
