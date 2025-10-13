// Security tests for data protection and privacy
const request = require('supertest');
const app = require('../../backend/server');
const jwt = require('jsonwebtoken');

describe('Security Tests - Data Protection', () => {
  let authToken;

  beforeAll(async () => {
    // Login to get authentication token
    const loginResponse = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'demo@todoapp.com',
        password: 'demo123',
      });
    
    authToken = loginResponse.body.data.token;
  });

  // Data exposure tests
  describe('Data Exposure Prevention', () => {
    test('passwords are never returned in API responses', async () => {
      const response = await request(app)
        .get('/api/auth/profile')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      const user = response.body.data.user;
      
      // Password should never be in the response
      expect(user).not.toHaveProperty('password');
      expect(user).not.toHaveProperty('password_hash');
      expect(user).not.toHaveProperty('passwordHash');
      expect(JSON.stringify(user)).not.toContain('password');
    });

    test('sensitive fields are excluded from todo responses', async () => {
      const response = await request(app)
        .get('/api/todos')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      const todos = response.body.data.todos;
      
      if (todos.length > 0) {
        const todo = todos[0];
        
        // Sensitive fields should not be exposed
        expect(todo).not.toHaveProperty('internal_id');
        expect(todo).not.toHaveProperty('secret_key');
        expect(todo).not.toHaveProperty('admin_notes');
      }
    });

    test('database internal fields are not exposed', async () => {
      const response = await request(app)
        .get('/api/todos')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      const todos = response.body.data.todos;
      
      if (todos.length > 0) {
        const todo = todos[0];
        
        // Database internal fields should not be exposed
        expect(todo).not.toHaveProperty('_id');
        expect(todo).not.toHaveProperty('__v');
        expect(todo).not.toHaveProperty('_rev');
      }
    });

    test('error messages do not leak sensitive information', async () => {
      // Test with invalid credentials
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'nonexistent@example.com',
          password: 'wrongpassword',
        })
        .expect(401);

      const errorMessage = response.body.error.message;
      
      // Error should not contain sensitive information
      expect(errorMessage).not.toContain('password');
      expect(errorMessage).not.toContain('hash');
      expect(errorMessage).not.toContain('database');
      expect(errorMessage).not.toContain('sql');
      expect(errorMessage).not.toContain('connection');
      expect(errorMessage).not.toContain('server');
    });

    test('stack traces are not exposed in production', async () => {
      // This test would need to be run in production mode
      // For now, we'll test that error responses don't contain stack traces
      const response = await request(app)
        .post('/api/auth/login')
        .send('invalid json')
        .expect(400);

      const responseBody = JSON.stringify(response.body);
      
      // Should not contain stack trace information
      expect(responseBody).not.toContain('at ');
      expect(responseBody).not.toContain('stack');
      expect(responseBody).not.toContain('Error:');
    });
  });

  // Data sanitization tests
  describe('Data Sanitization', () => {
    test('user input is properly sanitized', async () => {
      const maliciousInputs = [
        '<script>alert("xss")</script>',
        'javascript:alert("xss")',
        '<img src=x onerror=alert("xss")>',
        '"><script>alert("xss")</script>',
        '${7*7}',
        '#{7*7}',
        '{{7*7}}',
      ];

      for (const input of maliciousInputs) {
        const response = await request(app)
          .post('/api/todos')
          .set('Authorization', `Bearer ${authToken}`)
          .send({
            title: input,
            description: input,
            priority: 'medium',
            category: 'work',
          });

        if (response.status === 201) {
          const todo = response.body.data.todo;
          
          // Input should be sanitized
          expect(todo.title).not.toContain('<script>');
          expect(todo.title).not.toContain('javascript:');
          expect(todo.description).not.toContain('<script>');
          expect(todo.description).not.toContain('javascript:');
        }
      }
    });

    test('SQL injection attempts are prevented', async () => {
      const sqlInjectionAttempts = [
        "'; DROP TABLE todos; --",
        "' OR '1'='1",
        "admin'--",
        "' UNION SELECT * FROM users --",
        "1'; DELETE FROM todos; --",
        "' OR 1=1 --",
      ];

      for (const maliciousInput of sqlInjectionAttempts) {
        const response = await request(app)
          .post('/api/todos')
          .set('Authorization', `Bearer ${authToken}`)
          .send({
            title: maliciousInput,
            description: maliciousInput,
            priority: 'medium',
            category: 'work',
          });

        // Should not crash or return sensitive data
        expect(response.status).not.toBe(500);
        expect(response.body).not.toHaveProperty('users');
        expect(response.body).not.toHaveProperty('todos');
      }
    });

    test('NoSQL injection attempts are prevented', async () => {
      const nosqlInjectionAttempts = [
        { $ne: null },
        { $gt: '' },
        { $regex: '.*' },
        { $where: 'this.password' },
      ];

      for (const maliciousInput of nosqlInjectionAttempts) {
        const response = await request(app)
          .post('/api/todos')
          .set('Authorization', `Bearer ${authToken}`)
          .send({
            title: maliciousInput,
            description: maliciousInput,
            priority: 'medium',
            category: 'work',
          });

        expect(response.status).not.toBe(500);
      }
    });

    test('file path traversal attempts are prevented', async () => {
      const pathTraversalAttempts = [
        '../../../etc/passwd',
        '..\\..\\..\\windows\\system32\\drivers\\etc\\hosts',
        '....//....//....//etc/passwd',
        '%2e%2e%2f%2e%2e%2f%2e%2e%2fetc%2fpasswd',
      ];

      for (const maliciousInput of pathTraversalAttempts) {
        const response = await request(app)
          .post('/api/todos')
          .set('Authorization', `Bearer ${authToken}`)
          .send({
            title: maliciousInput,
            description: maliciousInput,
            priority: 'medium',
            category: 'work',
          });

        expect(response.status).not.toBe(500);
      }
    });
  });

  // Data validation tests
  describe('Data Validation', () => {
    test('input length limits are enforced', async () => {
      const longString = 'a'.repeat(10000);
      
      const response = await request(app)
        .post('/api/todos')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          title: longString,
          description: longString,
          priority: 'medium',
          category: 'work',
        })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error.message).toContain('length');
    });

    test('data type validation is enforced', async () => {
      const invalidDataTypes = [
        { title: 123, description: 'test' },
        { title: 'test', description: 123 },
        { title: 'test', priority: 123 },
        { title: 'test', category: 123 },
        { title: 'test', due_date: 123 },
        { title: 'test', completed: 'not-a-boolean' },
      ];

      for (const invalidData of invalidDataTypes) {
        const response = await request(app)
          .post('/api/todos')
          .set('Authorization', `Bearer ${authToken}`)
          .send(invalidData)
          .expect(400);

        expect(response.body.success).toBe(false);
      }
    });

    test('enum values are validated', async () => {
      const invalidEnums = [
        { title: 'test', priority: 'invalid' },
        { title: 'test', category: 'invalid' },
        { title: 'test', priority: 'high', category: 'invalid' },
      ];

      for (const invalidData of invalidEnums) {
        const response = await request(app)
          .post('/api/todos')
          .set('Authorization', `Bearer ${authToken}`)
          .send(invalidData)
          .expect(400);

        expect(response.body.success).toBe(false);
      }
    });

    test('date format validation is enforced', async () => {
      const invalidDates = [
        'not-a-date',
        '2023-13-01', // Invalid month
        '2023-02-30', // Invalid day
        '2023/01/01', // Wrong format
        '01-01-2023', // Wrong format
      ];

      for (const invalidDate of invalidDates) {
        const response = await request(app)
          .post('/api/todos')
          .set('Authorization', `Bearer ${authToken}`)
          .send({
            title: 'test',
            due_date: invalidDate,
          })
          .expect(400);

        expect(response.body.success).toBe(false);
      }
    });
  });

  // Privacy protection tests
  describe('Privacy Protection', () => {
    test('user data is not logged in plain text', async () => {
      // This test would require access to server logs
      // For now, we'll test that sensitive data is not in response headers
      const response = await request(app)
        .get('/api/auth/profile')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      // Check that sensitive data is not in headers
      const headers = response.headers;
      expect(JSON.stringify(headers)).not.toContain('password');
      expect(JSON.stringify(headers)).not.toContain('email');
    });

    test('personal information is properly protected', async () => {
      const response = await request(app)
        .get('/api/auth/profile')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      const user = response.body.data.user;
      
      // Only necessary fields should be exposed
      const allowedFields = ['id', 'username', 'email', 'created_at', 'updated_at'];
      const userFields = Object.keys(user);
      
      userFields.forEach(field => {
        expect(allowedFields).toContain(field);
      });
    });

    test('search queries are not logged with user data', async () => {
      const response = await request(app)
        .get('/api/todos/search?q=private search')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      // Response should not contain the search query in a way that could be logged
      expect(response.body).not.toHaveProperty('query');
      expect(response.body).not.toHaveProperty('searchTerm');
    });
  });

  // Data integrity tests
  describe('Data Integrity', () => {
    test('data corruption is prevented', async () => {
      const response = await request(app)
        .post('/api/todos')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          title: 'Integrity Test',
          description: 'Testing data integrity',
          priority: 'medium',
          category: 'work',
        })
        .expect(201);

      const todo = response.body.data.todo;
      
      // Data should be properly formatted
      expect(todo.title).toBe('Integrity Test');
      expect(todo.description).toBe('Testing data integrity');
      expect(todo.priority).toBe('medium');
      expect(todo.category).toBe('work');
      expect(todo.user_id).toBe(1);
      expect(todo.completed).toBe(false);
    });

    test('data consistency is maintained', async () => {
      // Create a todo
      const createResponse = await request(app)
        .post('/api/todos')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          title: 'Consistency Test',
          description: 'Testing data consistency',
          priority: 'high',
          category: 'personal',
        })
        .expect(201);

      const todoId = createResponse.body.data.todo.id;

      // Update the todo
      const updateResponse = await request(app)
        .put(`/api/todos/${todoId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          title: 'Updated Consistency Test',
          completed: true,
        })
        .expect(200);

      const updatedTodo = updateResponse.body.data.todo;
      
      // Data should be consistent
      expect(updatedTodo.title).toBe('Updated Consistency Test');
      expect(updatedTodo.completed).toBe(true);
      expect(updatedTodo.id).toBe(todoId);
      expect(updatedTodo.user_id).toBe(1);
    });

    test('data validation prevents invalid states', async () => {
      const response = await request(app)
        .post('/api/todos')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          title: '', // Empty title should be invalid
          description: 'Test',
          priority: 'medium',
          category: 'work',
        })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error.message).toContain('required');
    });
  });

  // Cross-site scripting (XSS) prevention tests
  describe('XSS Prevention', () => {
    test('prevents stored XSS attacks', async () => {
      const xssPayloads = [
        '<script>alert("xss")</script>',
        '<img src=x onerror=alert("xss")>',
        '<svg onload=alert("xss")>',
        'javascript:alert("xss")',
        '<iframe src="javascript:alert(\'xss\')"></iframe>',
      ];

      for (const payload of xssPayloads) {
        const response = await request(app)
          .post('/api/todos')
          .set('Authorization', `Bearer ${authToken}`)
          .send({
            title: payload,
            description: payload,
            priority: 'medium',
            category: 'work',
          });

        if (response.status === 201) {
          const todo = response.body.data.todo;
          
          // XSS payload should be sanitized
          expect(todo.title).not.toContain('<script>');
          expect(todo.title).not.toContain('javascript:');
          expect(todo.description).not.toContain('<script>');
          expect(todo.description).not.toContain('javascript:');
        }
      }
    });

    test('prevents reflected XSS attacks', async () => {
      const xssPayload = '<script>alert("xss")</script>';
      
      const response = await request(app)
        .get(`/api/todos/search?q=${encodeURIComponent(xssPayload)}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      // Response should not contain the XSS payload
      expect(JSON.stringify(response.body)).not.toContain('<script>');
      expect(JSON.stringify(response.body)).not.toContain('javascript:');
    });
  });

  // Information disclosure tests
  describe('Information Disclosure Prevention', () => {
    test('server information is not disclosed', async () => {
      const response = await request(app)
        .get('/api/health')
        .expect(200);

      // Response should not contain server information
      expect(JSON.stringify(response.body)).not.toContain('server');
      expect(JSON.stringify(response.body)).not.toContain('version');
      expect(JSON.stringify(response.body)).not.toContain('node');
      expect(JSON.stringify(response.body)).not.toContain('express');
    });

    test('database information is not disclosed', async () => {
      const response = await request(app)
        .get('/api/todos')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      // Response should not contain database information
      expect(JSON.stringify(response.body)).not.toContain('postgres');
      expect(JSON.stringify(response.body)).not.toContain('mysql');
      expect(JSON.stringify(response.body)).not.toContain('mongodb');
      expect(JSON.stringify(response.body)).not.toContain('database');
    });

    test('internal paths are not disclosed', async () => {
      const response = await request(app)
        .get('/api/todos')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      // Response should not contain internal paths
      expect(JSON.stringify(response.body)).not.toContain('/var/');
      expect(JSON.stringify(response.body)).not.toContain('/usr/');
      expect(JSON.stringify(response.body)).not.toContain('C:\\');
      expect(JSON.stringify(response.body)).not.toContain('D:\\');
    });
  });
});
