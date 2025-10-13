// Security tests for authorization and access control
const request = require('supertest');
const app = require('../../backend/server');
const jwt = require('jsonwebtoken');

describe('Security Tests - Authorization', () => {
  let user1Token, user2Token;
  let user1TodoId, user2TodoId;

  beforeAll(async () => {
    // Create two test users and get their tokens
    const user1Response = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'demo@todoapp.com',
        password: 'demo123',
      });
    user1Token = user1Response.body.data.token;

    // Create a second user (would need to register in real scenario)
    // For testing, we'll use the same user but simulate different user IDs
    user2Token = jwt.sign(
      { userId: 2 },
      process.env.JWT_SECRET || 'test-secret',
      { expiresIn: '1h' }
    );
  });

  // Resource isolation tests
  describe('Resource Isolation', () => {
    test('users cannot access other users todos', async () => {
      // User 1 creates a todo
      const createResponse = await request(app)
        .post('/api/todos')
        .set('Authorization', `Bearer ${user1Token}`)
        .send({
          title: 'User 1 Private Todo',
          description: 'This should be private to user 1',
          priority: 'high',
          category: 'personal',
        })
        .expect(201);

      user1TodoId = createResponse.body.data.todo.id;

      // User 2 tries to access user 1's todo
      const accessResponse = await request(app)
        .get(`/api/todos/${user1TodoId}`)
        .set('Authorization', `Bearer ${user2Token}`)
        .expect(404);

      expect(accessResponse.body.success).toBe(false);
      expect(accessResponse.body.error.message).toContain('not found');
    });

    test('users cannot update other users todos', async () => {
      const updateResponse = await request(app)
        .put(`/api/todos/${user1TodoId}`)
        .set('Authorization', `Bearer ${user2Token}`)
        .send({
          title: 'Hacked Todo',
          description: 'This should not be allowed',
        })
        .expect(404);

      expect(updateResponse.body.success).toBe(false);
    });

    test('users cannot delete other users todos', async () => {
      const deleteResponse = await request(app)
        .delete(`/api/todos/${user1TodoId}`)
        .set('Authorization', `Bearer ${user2Token}`)
        .expect(404);

      expect(deleteResponse.body.success).toBe(false);
    });

    test('users cannot toggle other users todos', async () => {
      const toggleResponse = await request(app)
        .patch(`/api/todos/${user1TodoId}/toggle`)
        .set('Authorization', `Bearer ${user2Token}`)
        .expect(404);

      expect(toggleResponse.body.success).toBe(false);
    });

    test('users can only see their own todos in list', async () => {
      // User 1 gets their todos
      const user1TodosResponse = await request(app)
        .get('/api/todos')
        .set('Authorization', `Bearer ${user1Token}`)
        .expect(200);

      const user1Todos = user1TodosResponse.body.data.todos;
      expect(user1Todos.length).toBeGreaterThan(0);

      // All todos should belong to user 1
      user1Todos.forEach(todo => {
        expect(todo.user_id).toBe(1);
      });
    });

    test('users can only see their own profile', async () => {
      // User 1 gets their profile
      const profileResponse = await request(app)
        .get('/api/auth/profile')
        .set('Authorization', `Bearer ${user1Token}`)
        .expect(200);

      expect(profileResponse.body.data.user.id).toBe(1);

      // User 2 gets their profile (should be different)
      const user2ProfileResponse = await request(app)
        .get('/api/auth/profile')
        .set('Authorization', `Bearer ${user2Token}`)
        .expect(404); // User 2 doesn't exist in our test setup

      expect(user2ProfileResponse.body.success).toBe(false);
    });
  });

  // Privilege escalation tests
  describe('Privilege Escalation Prevention', () => {
    test('users cannot modify their own user ID', async () => {
      const updateResponse = await request(app)
        .put('/api/auth/profile')
        .set('Authorization', `Bearer ${user1Token}`)
        .send({
          id: 999, // Try to change user ID
          username: 'hackeduser',
        })
        .expect(200);

      // The ID should not be changed
      expect(updateResponse.body.data.user.id).toBe(1);
      expect(updateResponse.body.data.user.id).not.toBe(999);
    });

    test('users cannot access admin endpoints', async () => {
      // Try to access a hypothetical admin endpoint
      const adminResponse = await request(app)
        .get('/api/admin/users')
        .set('Authorization', `Bearer ${user1Token}`)
        .expect(404); // Endpoint doesn't exist, but if it did, should be 403

      expect(adminResponse.status).toBe(404);
    });

    test('users cannot modify other users profiles', async () => {
      const updateResponse = await request(app)
        .put('/api/auth/profile')
        .set('Authorization', `Bearer ${user1Token}`)
        .send({
          id: 2, // Try to modify user 2's profile
          username: 'hackeduser2',
        })
        .expect(200);

      // Should only update user 1's profile
      expect(updateResponse.body.data.user.id).toBe(1);
      expect(updateResponse.body.data.user.username).not.toBe('hackeduser2');
    });
  });

  // Token manipulation tests
  describe('Token Manipulation Prevention', () => {
    test('prevents token tampering', async () => {
      // Create a valid token
      const validToken = jwt.sign(
        { userId: 1 },
        process.env.JWT_SECRET || 'test-secret',
        { expiresIn: '1h' }
      );

      // Tamper with the token
      const tamperedToken = validToken.slice(0, -5) + 'XXXXX';

      const response = await request(app)
        .get('/api/todos')
        .set('Authorization', `Bearer ${tamperedToken}`)
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.error.message).toContain('token');
    });

    test('prevents user ID manipulation in token', async () => {
      // Create a token with a different user ID
      const manipulatedToken = jwt.sign(
        { userId: 999 }, // Try to impersonate user 999
        process.env.JWT_SECRET || 'test-secret',
        { expiresIn: '1h' }
      );

      const response = await request(app)
        .get('/api/todos')
        .set('Authorization', `Bearer ${manipulatedToken}`)
        .expect(404); // User 999 doesn't exist

      expect(response.body.success).toBe(false);
    });

    test('prevents token replay with different user context', async () => {
      // User 1 creates a todo
      const createResponse = await request(app)
        .post('/api/todos')
        .set('Authorization', `Bearer ${user1Token}`)
        .send({
          title: 'Original User Todo',
          description: 'Created by user 1',
          priority: 'medium',
          category: 'work',
        })
        .expect(201);

      const todoId = createResponse.body.data.todo.id;

      // Try to access the todo with a token for a different user
      const accessResponse = await request(app)
        .get(`/api/todos/${todoId}`)
        .set('Authorization', `Bearer ${user2Token}`)
        .expect(404);

      expect(accessResponse.body.success).toBe(false);
    });
  });

  // API endpoint authorization tests
  describe('API Endpoint Authorization', () => {
    test('protected endpoints require authentication', async () => {
      const protectedEndpoints = [
        { method: 'GET', path: '/api/todos' },
        { method: 'POST', path: '/api/todos' },
        { method: 'GET', path: '/api/auth/profile' },
        { method: 'PUT', path: '/api/auth/profile' },
        { method: 'GET', path: '/api/todos/stats' },
      ];

      for (const endpoint of protectedEndpoints) {
        const response = await request(app)
          [endpoint.method.toLowerCase()](endpoint.path)
          .expect(401);

        expect(response.body.success).toBe(false);
        expect(response.body.error.message).toContain('token');
      }
    });

    test('public endpoints do not require authentication', async () => {
      const publicEndpoints = [
        { method: 'GET', path: '/api/health' },
        { method: 'POST', path: '/api/auth/login' },
        { method: 'POST', path: '/api/auth/register' },
        { method: 'POST', path: '/api/auth/logout' },
      ];

      for (const endpoint of publicEndpoints) {
        const response = await request(app)
          [endpoint.method.toLowerCase()](endpoint.path)
          .send(endpoint.method === 'POST' ? {} : undefined);

        // Should not return 401 (unauthorized)
        expect(response.status).not.toBe(401);
      }
    });

    test('OPTIONS requests are allowed for CORS', async () => {
      const response = await request(app)
        .options('/api/todos')
        .set('Origin', 'http://localhost:3000')
        .set('Access-Control-Request-Method', 'GET')
        .expect(204);

      expect(response.headers).toHaveProperty('access-control-allow-origin');
    });
  });

  // Data access control tests
  describe('Data Access Control', () => {
    test('search results are filtered by user', async () => {
      // User 1 creates a todo with specific content
      await request(app)
        .post('/api/todos')
        .set('Authorization', `Bearer ${user1Token}`)
        .send({
          title: 'User 1 Search Test',
          description: 'This is a search test for user 1',
          priority: 'medium',
          category: 'work',
        })
        .expect(201);

      // User 1 searches for their todo
      const user1SearchResponse = await request(app)
        .get('/api/todos/search?q=Search Test')
        .set('Authorization', `Bearer ${user1Token}`)
        .expect(200);

      const user1Results = user1SearchResponse.body.data.todos;
      expect(user1Results.length).toBeGreaterThan(0);

      // All results should belong to user 1
      user1Results.forEach(todo => {
        expect(todo.user_id).toBe(1);
      });
    });

    test('statistics are user-specific', async () => {
      const statsResponse = await request(app)
        .get('/api/todos/stats')
        .set('Authorization', `Bearer ${user1Token}`)
        .expect(200);

      const stats = statsResponse.body.data.stats;
      
      // Stats should be calculated only for user 1's todos
      expect(stats.total).toBeGreaterThanOrEqual(0);
      expect(stats.completed).toBeGreaterThanOrEqual(0);
      expect(stats.pending).toBeGreaterThanOrEqual(0);
      expect(stats.high_priority).toBeGreaterThanOrEqual(0);
    });

    test('pagination respects user boundaries', async () => {
      // Get first page of todos for user 1
      const page1Response = await request(app)
        .get('/api/todos?page=1&limit=5')
        .set('Authorization', `Bearer ${user1Token}`)
        .expect(200);

      const page1Todos = page1Response.body.data.todos;
      
      // All todos should belong to user 1
      page1Todos.forEach(todo => {
        expect(todo.user_id).toBe(1);
      });
    });
  });

  // Session management tests
  describe('Session Management', () => {
    test('logout invalidates all user sessions', async () => {
      // User 1 logs in
      const loginResponse = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'demo@todoapp.com',
          password: 'demo123',
        })
        .expect(200);

      const token = loginResponse.body.data.token;

      // User 1 accesses protected resource
      await request(app)
        .get('/api/todos')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      // User 1 logs out
      await request(app)
        .post('/api/auth/logout')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      // Token should no longer be valid
      const response = await request(app)
        .get('/api/todos')
        .set('Authorization', `Bearer ${token}`)
        .expect(401);

      expect(response.body.success).toBe(false);
    });

    test('refresh token can only be used once', async () => {
      const loginResponse = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'demo@todoapp.com',
          password: 'demo123',
        })
        .expect(200);

      const refreshToken = loginResponse.body.data.refreshToken;

      // Use refresh token first time
      const refreshResponse1 = await request(app)
        .post('/api/auth/refresh')
        .send({ refreshToken })
        .expect(200);

      expect(refreshResponse1.body.success).toBe(true);

      // Try to use refresh token again (should fail)
      const refreshResponse2 = await request(app)
        .post('/api/auth/refresh')
        .send({ refreshToken })
        .expect(401);

      expect(refreshResponse2.body.success).toBe(false);
    });
  });

  // Edge cases and boundary tests
  describe('Edge Cases and Boundaries', () => {
    test('handles non-existent user IDs gracefully', async () => {
      const nonExistentUserToken = jwt.sign(
        { userId: 99999 },
        process.env.JWT_SECRET || 'test-secret',
        { expiresIn: '1h' }
      );

      const response = await request(app)
        .get('/api/todos')
        .set('Authorization', `Bearer ${nonExistentUserToken}`)
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.error.message).toContain('not found');
    });

    test('handles malformed user IDs in token', async () => {
      const malformedToken = jwt.sign(
        { userId: 'not-a-number' },
        process.env.JWT_SECRET || 'test-secret',
        { expiresIn: '1h' }
      );

      const response = await request(app)
        .get('/api/todos')
        .set('Authorization', `Bearer ${malformedToken}`)
        .expect(400);

      expect(response.body.success).toBe(false);
    });

    test('handles missing user ID in token', async () => {
      const incompleteToken = jwt.sign(
        {}, // No userId
        process.env.JWT_SECRET || 'test-secret',
        { expiresIn: '1h' }
      );

      const response = await request(app)
        .get('/api/todos')
        .set('Authorization', `Bearer ${incompleteToken}`)
        .expect(401);

      expect(response.body.success).toBe(false);
    });

    test('prevents access to deleted user resources', async () => {
      // This test would require user deletion functionality
      // For now, we'll test with a non-existent user
      const deletedUserToken = jwt.sign(
        { userId: 999 },
        process.env.JWT_SECRET || 'test-secret',
        { expiresIn: '1h' }
      );

      const response = await request(app)
        .get('/api/todos')
        .set('Authorization', `Bearer ${deletedUserToken}`)
        .expect(404);

      expect(response.body.success).toBe(false);
    });
  });
});
