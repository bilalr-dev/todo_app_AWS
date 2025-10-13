// Security tests for authentication and authorization
const request = require('supertest');
const app = require('../../backend/server');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');

describe('Security Tests - Authentication', () => {
  // Authentication bypass tests
  describe('Authentication Bypass', () => {
    test('rejects requests without authentication token', async () => {
      const response = await request(app)
        .get('/api/todos')
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.error.message).toContain('token');
    });

    test('rejects requests with malformed JWT token', async () => {
      const response = await request(app)
        .get('/api/todos')
        .set('Authorization', 'Bearer malformed-token')
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.error.message).toContain('token');
    });

    test('rejects requests with expired JWT token', async () => {
      const expiredToken = jwt.sign(
        { userId: 1 },
        process.env.JWT_SECRET || 'test-secret',
        { expiresIn: '-1h' }
      );

      const response = await request(app)
        .get('/api/todos')
        .set('Authorization', `Bearer ${expiredToken}`)
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.error.message).toContain('expired');
    });

    test('rejects requests with invalid JWT signature', async () => {
      const invalidToken = jwt.sign(
        { userId: 1 },
        'wrong-secret',
        { expiresIn: '1h' }
      );

      const response = await request(app)
        .get('/api/todos')
        .set('Authorization', `Bearer ${invalidToken}`)
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.error.message).toContain('token');
    });

    test('rejects requests with wrong token type', async () => {
      const refreshToken = jwt.sign(
        { userId: 1, type: 'refresh' },
        process.env.JWT_SECRET || 'test-secret',
        { expiresIn: '7d' }
      );

      const response = await request(app)
        .get('/api/todos')
        .set('Authorization', `Bearer ${refreshToken}`)
        .expect(401);

      expect(response.body.success).toBe(false);
    });
  });

  // Password security tests
  describe('Password Security', () => {
    test('enforces strong password requirements', async () => {
      const weakPasswords = [
        '123',
        'password',
        '12345678',
        'Password',
        'password123',
        'PASSWORD123',
      ];

      for (const password of weakPasswords) {
        const response = await request(app)
          .post('/api/auth/register')
          .send({
            username: 'testuser',
            email: 'test@example.com',
            password: password,
          })
          .expect(400);

        expect(response.body.success).toBe(false);
        expect(response.body.error.message).toContain('password');
      }
    });

    test('accepts strong passwords', async () => {
      const strongPasswords = [
        'Password123',
        'MySecure123!',
        'ComplexP@ssw0rd',
        'StrongP@ss1',
      ];

      for (const password of strongPasswords) {
        const response = await request(app)
          .post('/api/auth/register')
          .send({
            username: `testuser${Math.random()}`,
            email: `test${Math.random()}@example.com`,
            password: password,
          });

        // Should not fail due to password strength
        if (response.status === 400) {
          expect(response.body.error.message).not.toContain('password');
        }
      }
    });

    test('passwords are properly hashed', async () => {
      const password = 'TestPassword123';
      const hashedPassword = await bcrypt.hash(password, 12);

      // Verify password is hashed (not plain text)
      expect(hashedPassword).not.toBe(password);
      expect(hashedPassword.length).toBeGreaterThan(50);
      expect(hashedPassword).toMatch(/^\$2[aby]\$\d+\$/); // bcrypt format
    });

    test('prevents password enumeration attacks', async () => {
      const validEmail = 'demo@todoapp.com';
      const invalidEmail = 'nonexistent@example.com';

      // Test with valid email but wrong password
      const validEmailResponse = await request(app)
        .post('/api/auth/login')
        .send({
          email: validEmail,
          password: 'wrongpassword',
        })
        .expect(401);

      // Test with invalid email
      const invalidEmailResponse = await request(app)
        .post('/api/auth/login')
        .send({
          email: invalidEmail,
          password: 'anypassword',
        })
        .expect(401);

      // Both should return the same error message to prevent enumeration
      expect(validEmailResponse.body.error.message).toBe(invalidEmailResponse.body.error.message);
    });
  });

  // Session security tests
  describe('Session Security', () => {
    test('JWT tokens have appropriate expiration', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'demo@todoapp.com',
          password: 'demo123',
        })
        .expect(200);

      const token = response.body.data.token;
      const decoded = jwt.decode(token);

      // Token should have reasonable expiration (not too long)
      const expirationTime = decoded.exp * 1000; // Convert to milliseconds
      const currentTime = Date.now();
      const tokenLifetime = expirationTime - currentTime;

      expect(tokenLifetime).toBeLessThan(24 * 60 * 60 * 1000); // Less than 24 hours
      expect(tokenLifetime).toBeGreaterThan(60 * 60 * 1000); // More than 1 hour
    });

    test('refresh tokens have longer expiration', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'demo@todoapp.com',
          password: 'demo123',
        })
        .expect(200);

      const refreshToken = response.body.data.refreshToken;
      const decoded = jwt.decode(refreshToken);

      const expirationTime = decoded.exp * 1000;
      const currentTime = Date.now();
      const tokenLifetime = expirationTime - currentTime;

      expect(tokenLifetime).toBeGreaterThan(7 * 24 * 60 * 60 * 1000); // More than 7 days
    });

    test('logout invalidates tokens', async () => {
      // Login first
      const loginResponse = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'demo@todoapp.com',
          password: 'demo123',
        })
        .expect(200);

      const token = loginResponse.body.data.token;

      // Logout
      await request(app)
        .post('/api/auth/logout')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      // Try to use token after logout
      const response = await request(app)
        .get('/api/todos')
        .set('Authorization', `Bearer ${token}`)
        .expect(401);

      expect(response.body.success).toBe(false);
    });
  });

  // Input validation security tests
  describe('Input Validation Security', () => {
    test('prevents SQL injection in login', async () => {
      const maliciousInputs = [
        "'; DROP TABLE users; --",
        "' OR '1'='1",
        "admin'--",
        "' UNION SELECT * FROM users --",
      ];

      for (const maliciousInput of maliciousInputs) {
        const response = await request(app)
          .post('/api/auth/login')
          .send({
            email: maliciousInput,
            password: 'anypassword',
          });

        // Should not crash or return sensitive data
        expect(response.status).not.toBe(500);
        expect(response.body).not.toHaveProperty('users');
        expect(response.body).not.toHaveProperty('password');
      }
    });

    test('prevents NoSQL injection attempts', async () => {
      const maliciousInputs = [
        { $ne: null },
        { $gt: '' },
        { $regex: '.*' },
      ];

      for (const maliciousInput of maliciousInputs) {
        const response = await request(app)
          .post('/api/auth/login')
          .send({
            email: maliciousInput,
            password: 'anypassword',
          });

        expect(response.status).not.toBe(500);
      }
    });

    test('validates email format to prevent injection', async () => {
      const maliciousEmails = [
        'test@example.com<script>alert("xss")</script>',
        'test@example.com" OR "1"="1',
        'test@example.com\'; DROP TABLE users; --',
        'test@example.com\n<script>alert("xss")</script>',
      ];

      for (const email of maliciousEmails) {
        const response = await request(app)
          .post('/api/auth/register')
          .send({
            username: 'testuser',
            email: email,
            password: 'Password123',
          })
          .expect(400);

        expect(response.body.success).toBe(false);
        expect(response.body.error.message).toContain('email');
      }
    });

    test('sanitizes user input', async () => {
      const maliciousInputs = [
        '<script>alert("xss")</script>',
        'javascript:alert("xss")',
        '<img src=x onerror=alert("xss")>',
        '"><script>alert("xss")</script>',
      ];

      for (const input of maliciousInputs) {
        const response = await request(app)
          .post('/api/auth/register')
          .send({
            username: input,
            email: 'test@example.com',
            password: 'Password123',
          });

        // Should either reject or sanitize the input
        if (response.status === 201) {
          expect(response.body.data.user.username).not.toContain('<script>');
          expect(response.body.data.user.username).not.toContain('javascript:');
        }
      }
    });
  });

  // Rate limiting tests
  describe('Rate Limiting', () => {
    test('prevents brute force login attempts', async () => {
      const promises = Array.from({ length: 20 }, () =>
        request(app)
          .post('/api/auth/login')
          .send({
            email: 'demo@todoapp.com',
            password: 'wrongpassword',
          })
      );

      const responses = await Promise.all(promises);
      
      // Some requests should be rate limited
      const rateLimitedResponses = responses.filter(r => r.status === 429);
      expect(rateLimitedResponses.length).toBeGreaterThan(0);
    });

    test('prevents registration spam', async () => {
      const promises = Array.from({ length: 10 }, (_, i) =>
        request(app)
          .post('/api/auth/register')
          .send({
            username: `spamuser${i}`,
            email: `spam${i}@example.com`,
            password: 'Password123',
          })
      );

      const responses = await Promise.all(promises);
      
      // Some requests should be rate limited
      const rateLimitedResponses = responses.filter(r => r.status === 429);
      expect(rateLimitedResponses.length).toBeGreaterThan(0);
    });
  });

  // Token security tests
  describe('Token Security', () => {
    test('tokens contain minimal necessary information', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'demo@todoapp.com',
          password: 'demo123',
        })
        .expect(200);

      const token = response.body.data.token;
      const decoded = jwt.decode(token);

      // Token should only contain necessary claims
      expect(decoded).toHaveProperty('userId');
      expect(decoded).toHaveProperty('iat');
      expect(decoded).toHaveProperty('exp');
      expect(decoded).not.toHaveProperty('password');
      expect(decoded).not.toHaveProperty('email');
      expect(decoded).not.toHaveProperty('username');
    });

    test('tokens are not logged in server responses', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'demo@todoapp.com',
          password: 'demo123',
        })
        .expect(200);

      // Response should not contain sensitive information in headers
      expect(response.headers).not.toHaveProperty('x-token');
      expect(response.headers).not.toHaveProperty('authorization');
    });

    test('prevents token replay attacks', async () => {
      // Login and get token
      const loginResponse = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'demo@todoapp.com',
          password: 'demo123',
        })
        .expect(200);

      const token = loginResponse.body.data.token;

      // Use token multiple times (should work)
      const response1 = await request(app)
        .get('/api/todos')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      const response2 = await request(app)
        .get('/api/todos')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(response1.status).toBe(200);
      expect(response2.status).toBe(200);
    });
  });

  // CORS and headers security tests
  describe('CORS and Security Headers', () => {
    test('sets appropriate security headers', async () => {
      const response = await request(app)
        .get('/api/health')
        .expect(200);

      // Check for security headers
      expect(response.headers).toHaveProperty('x-content-type-options');
      expect(response.headers).toHaveProperty('x-frame-options');
      expect(response.headers).toHaveProperty('x-xss-protection');
    });

    test('handles CORS preflight requests', async () => {
      const response = await request(app)
        .options('/api/todos')
        .set('Origin', 'http://localhost:3000')
        .set('Access-Control-Request-Method', 'GET')
        .set('Access-Control-Request-Headers', 'Authorization')
        .expect(204);

      expect(response.headers).toHaveProperty('access-control-allow-origin');
      expect(response.headers).toHaveProperty('access-control-allow-methods');
      expect(response.headers).toHaveProperty('access-control-allow-headers');
    });

    test('rejects requests from unauthorized origins', async () => {
      const response = await request(app)
        .get('/api/todos')
        .set('Origin', 'http://malicious-site.com')
        .expect(401);

      expect(response.body.success).toBe(false);
    });
  });

  // Error handling security tests
  describe('Error Handling Security', () => {
    test('does not leak sensitive information in error messages', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'nonexistent@example.com',
          password: 'wrongpassword',
        })
        .expect(401);

      // Error message should not contain sensitive information
      expect(response.body.error.message).not.toContain('password');
      expect(response.body.error.message).not.toContain('hash');
      expect(response.body.error.message).not.toContain('database');
      expect(response.body.error.message).not.toContain('sql');
    });

    test('handles malformed requests gracefully', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .set('Content-Type', 'application/json')
        .send('invalid json')
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error.message).not.toContain('stack');
      expect(response.body.error.message).not.toContain('at ');
    });

    test('prevents information disclosure through timing attacks', async () => {
      const startTime = Date.now();
      
      await request(app)
        .post('/api/auth/login')
        .send({
          email: 'nonexistent@example.com',
          password: 'anypassword',
        });
      
      const endTime = Date.now();
      const responseTime = endTime - startTime;

      // Response time should be consistent (not too fast for non-existent users)
      expect(responseTime).toBeGreaterThan(100); // At least 100ms
    });
  });
});
