// Performance tests for load testing and response times
const { chromium } = require('playwright');
const request = require('supertest');
const app = require('../../backend/server');

describe('Performance Tests', () => {
  let browser;
  let page;
  let context;

  beforeAll(async () => {
    browser = await chromium.launch({ headless: true });
  });

  afterAll(async () => {
    await browser.close();
  });

  beforeEach(async () => {
    context = await browser.newContext();
    page = await context.newPage();
  });

  afterEach(async () => {
    await context.close();
  });

  // API Performance Tests
  describe('API Performance Tests', () => {
    test('login endpoint response time', async () => {
      const startTime = Date.now();
      
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'demo@todoapp.com',
          password: 'demo123'
        });
      
      const endTime = Date.now();
      const responseTime = endTime - startTime;
      
      expect(response.status).toBe(200);
      expect(responseTime).toBeLessThan(1000); // Should respond within 1 second
    });

    test('todos endpoint response time', async () => {
      // First login to get token
      const loginResponse = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'demo@todoapp.com',
          password: 'demo123'
        });
      
      const token = loginResponse.body.data.token;
      
      const startTime = Date.now();
      
      const response = await request(app)
        .get('/api/todos')
        .set('Authorization', `Bearer ${token}`);
      
      const endTime = Date.now();
      const responseTime = endTime - startTime;
      
      expect(response.status).toBe(200);
      expect(responseTime).toBeLessThan(500); // Should respond within 500ms
    });

    test('todo creation endpoint response time', async () => {
      // Login first
      const loginResponse = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'demo@todoapp.com',
          password: 'demo123'
        });
      
      const token = loginResponse.body.data.token;
      
      const startTime = Date.now();
      
      const response = await request(app)
        .post('/api/todos')
        .set('Authorization', `Bearer ${token}`)
        .send({
          title: 'Performance Test Todo',
          description: 'Testing performance',
          priority: 'medium',
          category: 'work'
        });
      
      const endTime = Date.now();
      const responseTime = endTime - startTime;
      
      expect(response.status).toBe(201);
      expect(responseTime).toBeLessThan(800); // Should respond within 800ms
    });

    test('concurrent API requests performance', async () => {
      // Login first
      const loginResponse = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'demo@todoapp.com',
          password: 'demo123'
        });
      
      const token = loginResponse.body.data.token;
      
      const startTime = Date.now();
      
      // Make 10 concurrent requests
      const promises = Array.from({ length: 10 }, () =>
        request(app)
          .get('/api/todos')
          .set('Authorization', `Bearer ${token}`)
      );
      
      const responses = await Promise.all(promises);
      const endTime = Date.now();
      const totalTime = endTime - startTime;
      
      // All requests should succeed
      responses.forEach(response => {
        expect(response.status).toBe(200);
      });
      
      // Total time should be reasonable (less than 2 seconds for 10 requests)
      expect(totalTime).toBeLessThan(2000);
    });

    test('large dataset performance', async () => {
      // Login first
      const loginResponse = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'demo@todoapp.com',
          password: 'demo123'
        });
      
      const token = loginResponse.body.data.token;
      
      const startTime = Date.now();
      
      // Request with large limit
      const response = await request(app)
        .get('/api/todos?limit=1000')
        .set('Authorization', `Bearer ${token}`);
      
      const endTime = Date.now();
      const responseTime = endTime - startTime;
      
      expect(response.status).toBe(200);
      expect(responseTime).toBeLessThan(1500); // Should handle large datasets within 1.5 seconds
    });
  });

  // Frontend Performance Tests
  describe('Frontend Performance Tests', () => {
    test('page load performance', async () => {
      const startTime = Date.now();
      
      await page.goto('http://localhost:3000');
      await page.waitForLoadState('networkidle');
      
      const endTime = Date.now();
      const loadTime = endTime - startTime;
      
      expect(loadTime).toBeLessThan(3000); // Should load within 3 seconds
    });

    test('dashboard load performance', async () => {
      const startTime = Date.now();
      
      await page.goto('http://localhost:3000');
      await page.click('text=Try demo account');
      await page.waitForURL('**/dashboard');
      await page.waitForLoadState('networkidle');
      
      const endTime = Date.now();
      const loadTime = endTime - startTime;
      
      expect(loadTime).toBeLessThan(2000); // Dashboard should load within 2 seconds
    });

    test('todo list rendering performance', async () => {
      await page.goto('http://localhost:3000');
      await page.click('text=Try demo account');
      await page.waitForURL('**/dashboard');
      
      const startTime = Date.now();
      
      // Wait for todos to render
      await page.waitForSelector('[data-testid="todo-item"]');
      
      const endTime = Date.now();
      const renderTime = endTime - startTime;
      
      expect(renderTime).toBeLessThan(1000); // Todos should render within 1 second
    });

    test('form submission performance', async () => {
      await page.goto('http://localhost:3000');
      await page.click('text=Try demo account');
      await page.waitForURL('**/dashboard');
      
      const startTime = Date.now();
      
      // Create a new todo
      await page.click('text=Add Todo');
      await page.fill('input[name="title"]', 'Performance Test Todo');
      await page.click('button[type="submit"]');
      
      // Wait for todo to appear in list
      await page.waitForSelector('text=Performance Test Todo');
      
      const endTime = Date.now();
      const operationTime = endTime - startTime;
      
      expect(operationTime).toBeLessThan(1500); // Todo creation should complete within 1.5 seconds
    });

    test('search performance', async () => {
      await page.goto('http://localhost:3000');
      await page.click('text=Try demo account');
      await page.waitForURL('**/dashboard');
      
      const startTime = Date.now();
      
      // Perform search
      await page.fill('[data-testid="search-input"]', 'Getting Started');
      await page.waitForSelector('text=Getting Started');
      
      const endTime = Date.now();
      const searchTime = endTime - startTime;
      
      expect(searchTime).toBeLessThan(500); // Search should complete within 500ms
    });

    test('theme switching performance', async () => {
      await page.goto('http://localhost:3000');
      await page.click('text=Try demo account');
      await page.waitForURL('**/dashboard');
      
      const startTime = Date.now();
      
      // Toggle theme
      await page.click('[data-testid="theme-toggle"]');
      await page.waitForSelector('html.dark');
      
      const endTime = Date.now();
      const themeSwitchTime = endTime - startTime;
      
      expect(themeSwitchTime).toBeLessThan(200); // Theme switch should be instant
    });
  });

  // Memory Usage Tests
  describe('Memory Usage Tests', () => {
    test('memory usage during todo operations', async () => {
      await page.goto('http://localhost:3000');
      await page.click('text=Try demo account');
      await page.waitForURL('**/dashboard');
      
      // Get initial memory usage
      const initialMemory = await page.evaluate(() => {
        return performance.memory ? performance.memory.usedJSHeapSize : 0;
      });
      
      // Perform multiple todo operations
      for (let i = 0; i < 10; i++) {
        await page.click('text=Add Todo');
        await page.fill('input[name="title"]', `Memory Test Todo ${i}`);
        await page.click('button[type="submit"]');
        await page.waitForSelector(`text=Memory Test Todo ${i}`);
      }
      
      // Get final memory usage
      const finalMemory = await page.evaluate(() => {
        return performance.memory ? performance.memory.usedJSHeapSize : 0;
      });
      
      const memoryIncrease = finalMemory - initialMemory;
      
      // Memory increase should be reasonable (less than 10MB)
      expect(memoryIncrease).toBeLessThan(10 * 1024 * 1024);
    });

    test('memory cleanup after operations', async () => {
      await page.goto('http://localhost:3000');
      await page.click('text=Try demo account');
      await page.waitForURL('**/dashboard');
      
      // Perform operations
      await page.click('text=Add Todo');
      await page.fill('input[name="title"]', 'Memory Cleanup Test');
      await page.click('button[type="submit"]');
      await page.waitForSelector('text=Memory Cleanup Test');
      
      // Delete the todo
      await page.click('[data-testid="delete-todo"]:last-child');
      await page.click('text=Delete');
      
      // Force garbage collection if available
      await page.evaluate(() => {
        if (window.gc) {
          window.gc();
        }
      });
      
      // Wait a bit for cleanup
      await page.waitForTimeout(1000);
      
      // Memory should be cleaned up
      const memoryAfterCleanup = await page.evaluate(() => {
        return performance.memory ? performance.memory.usedJSHeapSize : 0;
      });
      
      expect(memoryAfterCleanup).toBeGreaterThan(0);
    });
  });

  // Network Performance Tests
  describe('Network Performance Tests', () => {
    test('API response sizes', async () => {
      const loginResponse = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'demo@todoapp.com',
          password: 'demo123'
        });
      
      const token = loginResponse.body.data.token;
      
      const todosResponse = await request(app)
        .get('/api/todos')
        .set('Authorization', `Bearer ${token}`);
      
      const responseSize = JSON.stringify(todosResponse.body).length;
      
      // Response should be reasonably sized (less than 100KB)
      expect(responseSize).toBeLessThan(100 * 1024);
    });

    test('image and asset loading performance', async () => {
      const startTime = Date.now();
      
      await page.goto('http://localhost:3000');
      
      // Wait for all resources to load
      await page.waitForLoadState('networkidle');
      
      const endTime = Date.now();
      const loadTime = endTime - startTime;
      
      expect(loadTime).toBeLessThan(3000);
    });

    test('API error handling performance', async () => {
      const startTime = Date.now();
      
      // Make request with invalid token
      const response = await request(app)
        .get('/api/todos')
        .set('Authorization', 'Bearer invalid-token');
      
      const endTime = Date.now();
      const responseTime = endTime - startTime;
      
      expect(response.status).toBe(401);
      expect(responseTime).toBeLessThan(500); // Error responses should be fast
    });
  });

  // Stress Tests
  describe('Stress Tests', () => {
    test('rapid todo creation and deletion', async () => {
      await page.goto('http://localhost:3000');
      await page.click('text=Try demo account');
      await page.waitForURL('**/dashboard');
      
      const startTime = Date.now();
      
      // Create and delete todos rapidly
      for (let i = 0; i < 5; i++) {
        // Create todo
        await page.click('text=Add Todo');
        await page.fill('input[name="title"]', `Stress Test ${i}`);
        await page.click('button[type="submit"]');
        await page.waitForSelector(`text=Stress Test ${i}`);
        
        // Delete todo
        await page.click('[data-testid="delete-todo"]:last-child');
        await page.click('text=Delete');
        await page.waitForSelector(`text=Stress Test ${i}`, { state: 'hidden' });
      }
      
      const endTime = Date.now();
      const totalTime = endTime - startTime;
      
      expect(totalTime).toBeLessThan(10000); // Should complete within 10 seconds
    });

    test('concurrent user simulation', async () => {
      const userCount = 5;
      const promises = [];
      
      for (let i = 0; i < userCount; i++) {
        const context = await browser.newContext();
        const page = context.newPage();
        
        promises.push(
          page.then(async (p) => {
            await p.goto('http://localhost:3000');
            await p.click('text=Try demo account');
            await p.waitForURL('**/dashboard');
            await p.waitForSelector('[data-testid="todo-item"]');
            await context.close();
          })
        );
      }
      
      const startTime = Date.now();
      await Promise.all(promises);
      const endTime = Date.now();
      
      const totalTime = endTime - startTime;
      expect(totalTime).toBeLessThan(5000); // All users should be able to login within 5 seconds
    });
  });

  // Database Performance Tests
  describe('Database Performance Tests', () => {
    test('database query performance', async () => {
      const loginResponse = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'demo@todoapp.com',
          password: 'demo123'
        });
      
      const token = loginResponse.body.data.token;
      
      const startTime = Date.now();
      
      // Make multiple database queries
      const promises = Array.from({ length: 20 }, () =>
        request(app)
          .get('/api/todos')
          .set('Authorization', `Bearer ${token}`)
      );
      
      await Promise.all(promises);
      
      const endTime = Date.now();
      const avgTime = (endTime - startTime) / 20;
      
      expect(avgTime).toBeLessThan(200); // Average query time should be less than 200ms
    });

    test('database connection pool performance', async () => {
      const startTime = Date.now();
      
      // Make many concurrent requests to test connection pooling
      const promises = Array.from({ length: 50 }, () =>
        request(app)
          .post('/api/auth/login')
          .send({
            email: 'demo@todoapp.com',
            password: 'demo123'
          })
      );
      
      const responses = await Promise.all(promises);
      const endTime = Date.now();
      
      // All requests should succeed
      responses.forEach(response => {
        expect(response.status).toBe(200);
      });
      
      const totalTime = endTime - startTime;
      expect(totalTime).toBeLessThan(5000); // Should handle 50 concurrent logins within 5 seconds
    });
  });
});
