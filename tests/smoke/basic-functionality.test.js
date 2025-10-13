// Smoke tests for basic functionality verification
const { chromium } = require('playwright');
const request = require('supertest');
const app = require('../../backend/server');

describe('Smoke Tests - Basic Functionality', () => {
  let browser;
  let page;
  let context;

  beforeAll(async () => {
    browser = await chromium.launch({ 
      headless: process.env.CI === 'true',
      slowMo: 100
    });
  });

  afterAll(async () => {
    await browser.close();
  });

  beforeEach(async () => {
    context = await browser.newContext({
      viewport: { width: 1280, height: 720 }
    });
    page = await context.newPage();
  });

  afterEach(async () => {
    await context.close();
  });

  // Critical path smoke tests
  describe('Critical Path Smoke Tests', () => {
    test('application loads without errors', async () => {
      const response = await page.goto('http://localhost:3000');
      expect(response.status()).toBe(200);
      
      // Check for console errors
      const errors = [];
      page.on('console', msg => {
        if (msg.type() === 'error') {
          errors.push(msg.text());
        }
      });
      
      await page.waitForLoadState('networkidle');
      expect(errors).toHaveLength(0);
    });

    test('demo login works', async () => {
      await page.goto('http://localhost:3000');
      await page.click('text=Try demo account');
      await page.waitForURL('**/dashboard');
      
      // Verify user is logged in
      await expect(page.locator('text=Dashboard')).toBeVisible();
      await expect(page.locator('text=demo')).toBeVisible();
    });

    test('dashboard displays todos', async () => {
      await page.goto('http://localhost:3000');
      await page.click('text=Try demo account');
      await page.waitForURL('**/dashboard');
      
      // Verify todos are displayed
      await expect(page.locator('[data-testid="todo-item"]')).toBeVisible();
    });

    test('can create a new todo', async () => {
      await page.goto('http://localhost:3000');
      await page.click('text=Try demo account');
      await page.waitForURL('**/dashboard');
      
      // Create a new todo
      await page.click('text=Add Todo');
      await page.fill('input[name="title"]', 'Smoke Test Todo');
      await page.fill('textarea[name="description"]', 'This is a smoke test todo');
      await page.click('button[type="submit"]');
      
      // Verify todo appears
      await expect(page.locator('text=Smoke Test Todo')).toBeVisible();
    });

    test('can toggle todo completion', async () => {
      await page.goto('http://localhost:3000');
      await page.click('text=Try demo account');
      await page.waitForURL('**/dashboard');
      
      // Toggle first todo
      const toggleButton = page.locator('[data-testid="toggle-todo"]:first-child');
      await toggleButton.click();
      
      // Verify todo is marked as completed
      await expect(page.locator('.completed')).toBeVisible();
    });

    test('can delete a todo', async () => {
      await page.goto('http://localhost:3000');
      await page.click('text=Try demo account');
      await page.waitForURL('**/dashboard');
      
      // Count initial todos
      const initialTodos = await page.locator('[data-testid="todo-item"]').count();
      
      // Delete first todo
      await page.click('[data-testid="delete-todo"]:first-child');
      await page.click('text=Delete');
      
      // Verify todo count decreased
      await page.waitForTimeout(500);
      const finalTodos = await page.locator('[data-testid="todo-item"]').count();
      expect(finalTodos).toBe(initialTodos - 1);
    });

    test('theme toggle works', async () => {
      await page.goto('http://localhost:3000');
      await page.click('text=Try demo account');
      await page.waitForURL('**/dashboard');
      
      // Toggle theme
      await page.click('[data-testid="theme-toggle"]');
      await expect(page.locator('html')).toHaveClass(/dark/);
      
      // Toggle back
      await page.click('[data-testid="theme-toggle"]');
      await expect(page.locator('html')).toHaveClass(/light/);
    });

    test('logout works', async () => {
      await page.goto('http://localhost:3000');
      await page.click('text=Try demo account');
      await page.waitForURL('**/dashboard');
      
      // Logout
      await page.click('[data-testid="profile-dropdown"]');
      await page.click('text=Sign Out');
      
      // Verify redirected to login
      await page.waitForURL('**/login');
      await expect(page.locator('text=Sign In')).toBeVisible();
    });
  });

  // API smoke tests
  describe('API Smoke Tests', () => {
    test('health endpoint responds', async () => {
      const response = await request(app)
        .get('/api/health')
        .expect(200);
      
      expect(response.body.status).toBe('ok');
    });

    test('login endpoint works', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'demo@todoapp.com',
          password: 'demo123',
        })
        .expect(200);
      
      expect(response.body.success).toBe(true);
      expect(response.body.data.token).toBeDefined();
    });

    test('todos endpoint works with authentication', async () => {
      // Login first
      const loginResponse = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'demo@todoapp.com',
          password: 'demo123',
        });
      
      const token = loginResponse.body.data.token;
      
      // Get todos
      const response = await request(app)
        .get('/api/todos')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);
      
      expect(response.body.success).toBe(true);
      expect(response.body.data.todos).toBeDefined();
    });

    test('todo creation endpoint works', async () => {
      // Login first
      const loginResponse = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'demo@todoapp.com',
          password: 'demo123',
        });
      
      const token = loginResponse.body.data.token;
      
      // Create todo
      const response = await request(app)
        .post('/api/todos')
        .set('Authorization', `Bearer ${token}`)
        .send({
          title: 'API Smoke Test Todo',
          description: 'Testing API functionality',
          priority: 'medium',
          category: 'work',
        })
        .expect(201);
      
      expect(response.body.success).toBe(true);
      expect(response.body.data.todo.title).toBe('API Smoke Test Todo');
    });
  });

  // Navigation smoke tests
  describe('Navigation Smoke Tests', () => {
    test('can navigate to dashboard', async () => {
      await page.goto('http://localhost:3000');
      await page.click('text=Try demo account');
      await page.waitForURL('**/dashboard');
      
      await expect(page.locator('text=Dashboard')).toBeVisible();
    });

    test('can navigate to profile', async () => {
      await page.goto('http://localhost:3000');
      await page.click('text=Try demo account');
      await page.waitForURL('**/dashboard');
      
      await page.click('text=Profile');
      await page.waitForURL('**/profile');
      
      await expect(page.locator('text=Profile')).toBeVisible();
    });

    test('can navigate back to dashboard from profile', async () => {
      await page.goto('http://localhost:3000');
      await page.click('text=Try demo account');
      await page.waitForURL('**/dashboard');
      
      await page.click('text=Profile');
      await page.waitForURL('**/profile');
      
      await page.click('text=Dashboard');
      await page.waitForURL('**/dashboard');
      
      await expect(page.locator('text=Dashboard')).toBeVisible();
    });
  });

  // Form smoke tests
  describe('Form Smoke Tests', () => {
    test('login form validation works', async () => {
      await page.goto('http://localhost:3000/login');
      
      // Try to submit empty form
      await page.click('button[type="submit"]');
      
      // Verify validation errors appear
      await expect(page.locator('text=Email is required')).toBeVisible();
      await expect(page.locator('text=Password is required')).toBeVisible();
    });

    test('todo form validation works', async () => {
      await page.goto('http://localhost:3000');
      await page.click('text=Try demo account');
      await page.waitForURL('**/dashboard');
      
      // Open todo form
      await page.click('text=Add Todo');
      
      // Try to submit empty form
      await page.click('button[type="submit"]');
      
      // Verify validation errors appear
      await expect(page.locator('text=Title is required')).toBeVisible();
    });

    test('form submission works with valid data', async () => {
      await page.goto('http://localhost:3000');
      await page.click('text=Try demo account');
      await page.waitForURL('**/dashboard');
      
      // Create todo with valid data
      await page.click('text=Add Todo');
      await page.fill('input[name="title"]', 'Valid Todo');
      await page.fill('textarea[name="description"]', 'Valid description');
      await page.click('button[type="submit"]');
      
      // Verify todo appears
      await expect(page.locator('text=Valid Todo')).toBeVisible();
    });
  });

  // Responsive design smoke tests
  describe('Responsive Design Smoke Tests', () => {
    test('mobile view works', async () => {
      await page.setViewportSize({ width: 375, height: 667 });
      await page.goto('http://localhost:3000');
      await page.click('text=Try demo account');
      await page.waitForURL('**/dashboard');
      
      // Verify mobile layout
      await expect(page.locator('[data-testid="hamburger-menu"]')).toBeVisible();
    });

    test('tablet view works', async () => {
      await page.setViewportSize({ width: 768, height: 1024 });
      await page.goto('http://localhost:3000');
      await page.click('text=Try demo account');
      await page.waitForURL('**/dashboard');
      
      // Verify tablet layout
      await expect(page.locator('[data-testid="sidebar"]')).toBeVisible();
    });

    test('desktop view works', async () => {
      await page.setViewportSize({ width: 1280, height: 720 });
      await page.goto('http://localhost:3000');
      await page.click('text=Try demo account');
      await page.waitForURL('**/dashboard');
      
      // Verify desktop layout
      await expect(page.locator('[data-testid="sidebar"]')).toBeVisible();
      await expect(page.locator('[data-testid="header"]')).toBeVisible();
    });
  });

  // Error handling smoke tests
  describe('Error Handling Smoke Tests', () => {
    test('handles network errors gracefully', async () => {
      // Simulate network error
      await page.route('**/api/**', route => route.abort());
      
      await page.goto('http://localhost:3000');
      await page.fill('input[name="email"]', 'test@example.com');
      await page.fill('input[name="password"]', 'password123');
      await page.click('button[type="submit"]');
      
      // Verify error handling
      await expect(page.locator('text=Network error')).toBeVisible();
    });

    test('handles 404 errors gracefully', async () => {
      await page.goto('http://localhost:3000/non-existent-page');
      
      // Verify 404 page is displayed
      await expect(page.locator('text=Page Not Found')).toBeVisible();
    });

    test('handles invalid form data gracefully', async () => {
      await page.goto('http://localhost:3000/login');
      
      // Submit invalid data
      await page.fill('input[name="email"]', 'invalid-email');
      await page.fill('input[name="password"]', '123');
      await page.click('button[type="submit"]');
      
      // Verify validation errors
      await expect(page.locator('text=Invalid email')).toBeVisible();
      await expect(page.locator('text=Password must be')).toBeVisible();
    });
  });

  // Performance smoke tests
  describe('Performance Smoke Tests', () => {
    test('page loads within acceptable time', async () => {
      const startTime = Date.now();
      
      await page.goto('http://localhost:3000');
      await page.waitForLoadState('networkidle');
      
      const loadTime = Date.now() - startTime;
      expect(loadTime).toBeLessThan(5000); // Should load within 5 seconds
    });

    test('todo operations complete within acceptable time', async () => {
      await page.goto('http://localhost:3000');
      await page.click('text=Try demo account');
      await page.waitForURL('**/dashboard');
      
      const startTime = Date.now();
      
      // Create a todo
      await page.click('text=Add Todo');
      await page.fill('input[name="title"]', 'Performance Test');
      await page.click('button[type="submit"]');
      await page.waitForSelector('text=Performance Test');
      
      const operationTime = Date.now() - startTime;
      expect(operationTime).toBeLessThan(3000); // Should complete within 3 seconds
    });
  });

  // Data persistence smoke tests
  describe('Data Persistence Smoke Tests', () => {
    test('todos persist after page refresh', async () => {
      await page.goto('http://localhost:3000');
      await page.click('text=Try demo account');
      await page.waitForURL('**/dashboard');
      
      // Create a todo
      await page.click('text=Add Todo');
      await page.fill('input[name="title"]', 'Persistence Test');
      await page.click('button[type="submit"]');
      await page.waitForSelector('text=Persistence Test');
      
      // Refresh page
      await page.reload();
      await page.waitForLoadState('networkidle');
      
      // Verify todo still exists
      await expect(page.locator('text=Persistence Test')).toBeVisible();
    });

    test('theme preference persists after page refresh', async () => {
      await page.goto('http://localhost:3000');
      await page.click('text=Try demo account');
      await page.waitForURL('**/dashboard');
      
      // Change theme
      await page.click('[data-testid="theme-toggle"]');
      await expect(page.locator('html')).toHaveClass(/dark/);
      
      // Refresh page
      await page.reload();
      await page.waitForLoadState('networkidle');
      
      // Verify theme is still dark
      await expect(page.locator('html')).toHaveClass(/dark/);
    });
  });

  // Cross-browser smoke tests
  describe('Cross-Browser Smoke Tests', () => {
    test('basic functionality works in Chrome', async () => {
      await page.goto('http://localhost:3000');
      await page.click('text=Try demo account');
      await page.waitForURL('**/dashboard');
      
      await expect(page.locator('text=Dashboard')).toBeVisible();
    });
  });

  // Security smoke tests
  describe('Security Smoke Tests', () => {
    test('protected routes require authentication', async () => {
      await page.goto('http://localhost:3000/dashboard');
      
      // Should redirect to login
      await page.waitForURL('**/login');
      await expect(page.locator('text=Sign In')).toBeVisible();
    });

    test('authentication tokens are properly handled', async () => {
      await page.goto('http://localhost:3000');
      await page.click('text=Try demo account');
      await page.waitForURL('**/dashboard');
      
      // Verify user is authenticated
      await expect(page.locator('text=demo')).toBeVisible();
    });
  });

  // Integration smoke tests
  describe('Integration Smoke Tests', () => {
    test('frontend and backend communicate properly', async () => {
      await page.goto('http://localhost:3000');
      await page.click('text=Try demo account');
      await page.waitForURL('**/dashboard');
      
      // Verify data is loaded from backend
      await expect(page.locator('[data-testid="todo-item"]')).toBeVisible();
    });

    test('real-time updates work', async () => {
      await page.goto('http://localhost:3000');
      await page.click('text=Try demo account');
      await page.waitForURL('**/dashboard');
      
      // Create a todo
      await page.click('text=Add Todo');
      await page.fill('input[name="title"]', 'Real-time Test');
      await page.click('button[type="submit"]');
      
      // Verify todo appears immediately
      await expect(page.locator('text=Real-time Test')).toBeVisible();
    });
  });
});
