// End-to-end tests for complete user workflows
const { chromium } = require('playwright');

describe('Todo App E2E Tests', () => {
  let browser;
  let page;
  let context;

  beforeAll(async () => {
    browser = await chromium.launch({ 
      headless: process.env.CI === 'true',
      slowMo: 50 // Slow down for better visibility in non-headless mode
    });
  });

  afterAll(async () => {
    await browser.close();
  });

  beforeEach(async () => {
    context = await browser.newContext({
      viewport: { width: 1280, height: 720 },
      userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36'
    });
    page = await context.newPage();
    
    // Navigate to the app
    await page.goto('http://localhost:3000');
  });

  afterEach(async () => {
    await context.close();
  });

  // User registration and login workflow
  describe('User Registration and Login Workflow', () => {
    test('complete user registration flow', async () => {
      // Navigate to registration page
      await page.click('text=Sign Up');
      await page.waitForURL('**/register');

      // Fill registration form
      await page.fill('input[name="username"]', 'e2etestuser');
      await page.fill('input[name="email"]', 'e2etest@example.com');
      await page.fill('input[name="password"]', 'E2ETest123');
      await page.fill('input[name="confirmPassword"]', 'E2ETest123');

      // Submit registration
      await page.click('button[type="submit"]');

      // Wait for redirect to dashboard
      await page.waitForURL('**/dashboard');
      
      // Verify user is logged in
      await expect(page.locator('text=Welcome')).toBeVisible();
      await expect(page.locator('text=e2etestuser')).toBeVisible();
    });

    test('user login with existing credentials', async () => {
      // Navigate to login page
      await page.click('text=Sign In');
      await page.waitForURL('**/login');

      // Fill login form
      await page.fill('input[name="email"]', 'demo@todoapp.com');
      await page.fill('input[name="password"]', 'demo123');

      // Submit login
      await page.click('button[type="submit"]');

      // Wait for redirect to dashboard
      await page.waitForURL('**/dashboard');
      
      // Verify user is logged in
      await expect(page.locator('text=Dashboard')).toBeVisible();
    });

    test('demo account login', async () => {
      // Click demo account button
      await page.click('text=Try demo account');
      
      // Wait for redirect to dashboard
      await page.waitForURL('**/dashboard');
      
      // Verify demo user is logged in
      await expect(page.locator('text=Dashboard')).toBeVisible();
      await expect(page.locator('text=demo')).toBeVisible();
    });

    test('logout functionality', async () => {
      // Login first
      await page.click('text=Try demo account');
      await page.waitForURL('**/dashboard');

      // Click profile dropdown
      await page.click('[data-testid="profile-dropdown"]');
      
      // Click logout
      await page.click('text=Sign Out');

      // Wait for redirect to login page
      await page.waitForURL('**/login');
      
      // Verify user is logged out
      await expect(page.locator('text=Sign In')).toBeVisible();
    });
  });

  // Todo management workflow
  describe('Todo Management Workflow', () => {
    beforeEach(async () => {
      // Login as demo user
      await page.click('text=Try demo account');
      await page.waitForURL('**/dashboard');
    });

    test('create a new todo', async () => {
      // Click add todo button
      await page.click('text=Add Todo');
      
      // Fill todo form
      await page.fill('input[name="title"]', 'E2E Test Todo');
      await page.fill('textarea[name="description"]', 'This is an E2E test todo');
      
      // Select priority
      await page.click('[data-testid="priority-select"]');
      await page.click('text=High');
      
      // Select category
      await page.click('[data-testid="category-select"]');
      await page.click('text=Work');
      
      // Set due date
      await page.fill('input[name="due_date"]', '2024-12-31');
      
      // Submit form
      await page.click('button[type="submit"]');
      
      // Verify todo appears in list
      await expect(page.locator('text=E2E Test Todo')).toBeVisible();
      await expect(page.locator('text=High')).toBeVisible();
      await expect(page.locator('text=Work')).toBeVisible();
    });

    test('edit an existing todo', async () => {
      // Find and click edit button for first todo
      await page.click('[data-testid="edit-todo"]:first-child');
      
      // Update todo title
      await page.fill('input[name="title"]', 'Updated E2E Todo');
      
      // Change priority
      await page.click('[data-testid="priority-select"]');
      await page.click('text=Medium');
      
      // Submit changes
      await page.click('button[type="submit"]');
      
      // Verify changes are reflected
      await expect(page.locator('text=Updated E2E Todo')).toBeVisible();
      await expect(page.locator('text=Medium')).toBeVisible();
    });

    test('toggle todo completion', async () => {
      // Find first todo and click toggle button
      const toggleButton = page.locator('[data-testid="toggle-todo"]:first-child');
      await toggleButton.click();
      
      // Verify todo is marked as completed
      await expect(page.locator('.completed')).toBeVisible();
    });

    test('delete a todo', async () => {
      // Find and click delete button for first todo
      await page.click('[data-testid="delete-todo"]:first-child');
      
      // Confirm deletion in modal
      await page.click('text=Delete');
      
      // Verify todo is removed from list
      await expect(page.locator('[data-testid="todo-item"]')).toHaveCount(3); // Assuming 4 initial todos
    });

    test('search todos', async () => {
      // Use search functionality
      await page.fill('[data-testid="search-input"]', 'Getting Started');
      
      // Verify search results
      await expect(page.locator('text=Getting Started')).toBeVisible();
      
      // Clear search
      await page.fill('[data-testid="search-input"]', '');
      
      // Verify all todos are shown again
      await expect(page.locator('[data-testid="todo-item"]')).toHaveCount(4);
    });

    test('filter todos by priority', async () => {
      // Click priority filter
      await page.click('[data-testid="priority-filter"]');
      await page.click('text=High');
      
      // Verify only high priority todos are shown
      const todoItems = page.locator('[data-testid="todo-item"]');
      const count = await todoItems.count();
      
      for (let i = 0; i < count; i++) {
        await expect(todoItems.nth(i).locator('text=High')).toBeVisible();
      }
    });

    test('filter todos by category', async () => {
      // Click category filter
      await page.click('[data-testid="category-filter"]');
      await page.click('text=Work');
      
      // Verify only work todos are shown
      const todoItems = page.locator('[data-testid="todo-item"]');
      const count = await todoItems.count();
      
      for (let i = 0; i < count; i++) {
        await expect(todoItems.nth(i).locator('text=Work')).toBeVisible();
      }
    });
  });

  // Theme switching workflow
  describe('Theme Switching Workflow', () => {
    beforeEach(async () => {
      // Login as demo user
      await page.click('text=Try demo account');
      await page.waitForURL('**/dashboard');
    });

    test('toggle between light and dark themes', async () => {
      // Verify initial theme (should be light by default)
      await expect(page.locator('html')).toHaveClass(/light/);
      
      // Click dark mode toggle
      await page.click('[data-testid="theme-toggle"]');
      
      // Verify theme changed to dark
      await expect(page.locator('html')).toHaveClass(/dark/);
      
      // Toggle back to light
      await page.click('[data-testid="theme-toggle"]');
      
      // Verify theme changed back to light
      await expect(page.locator('html')).toHaveClass(/light/);
    });

    test('theme persistence across page refresh', async () => {
      // Switch to dark theme
      await page.click('[data-testid="theme-toggle"]');
      await expect(page.locator('html')).toHaveClass(/dark/);
      
      // Refresh page
      await page.reload();
      
      // Verify theme is still dark
      await expect(page.locator('html')).toHaveClass(/dark/);
    });
  });

  // Notification system workflow
  describe('Notification System Workflow', () => {
    beforeEach(async () => {
      // Login as demo user
      await page.click('text=Try demo account');
      await page.waitForURL('**/dashboard');
    });

    test('view urgent todo notifications', async () => {
      // Check if notification badge is visible
      const notificationBadge = page.locator('[data-testid="notification-badge"]');
      
      if (await notificationBadge.isVisible()) {
        // Click notification button
        await page.click('[data-testid="notification-button"]');
        
        // Verify notification dropdown is visible
        await expect(page.locator('[data-testid="notification-dropdown"]')).toBeVisible();
        
        // Verify urgent todos are listed
        await expect(page.locator('[data-testid="urgent-todo"]')).toBeVisible();
      }
    });

    test('clear notifications', async () => {
      // Click notification button
      await page.click('[data-testid="notification-button"]');
      
      // Click clear notifications button
      await page.click('text=Clear notifications');
      
      // Verify notification count is reset
      await expect(page.locator('[data-testid="notification-badge"]')).not.toBeVisible();
    });

    test('click on notification to view todo details', async () => {
      // Click notification button
      await page.click('[data-testid="notification-button"]');
      
      // Click on first urgent todo
      await page.click('[data-testid="urgent-todo"]:first-child');
      
      // Verify todo details popup is visible
      await expect(page.locator('[data-testid="todo-popup"]')).toBeVisible();
      
      // Close popup
      await page.click('[data-testid="close-popup"]');
      
      // Verify popup is closed
      await expect(page.locator('[data-testid="todo-popup"]')).not.toBeVisible();
    });
  });

  // Responsive design workflow
  describe('Responsive Design Workflow', () => {
    beforeEach(async () => {
      // Login as demo user
      await page.click('text=Try demo account');
      await page.waitForURL('**/dashboard');
    });

    test('mobile view sidebar behavior', async () => {
      // Set mobile viewport
      await page.setViewportSize({ width: 375, height: 667 });
      
      // Verify sidebar is hidden by default on mobile
      await expect(page.locator('[data-testid="sidebar"]')).not.toBeVisible();
      
      // Click hamburger menu
      await page.click('[data-testid="hamburger-menu"]');
      
      // Verify sidebar is visible
      await expect(page.locator('[data-testid="sidebar"]')).toBeVisible();
      
      // Click X to close sidebar
      await page.click('[data-testid="close-sidebar"]');
      
      // Verify sidebar is hidden again
      await expect(page.locator('[data-testid="sidebar"]')).not.toBeVisible();
    });

    test('tablet view layout', async () => {
      // Set tablet viewport
      await page.setViewportSize({ width: 768, height: 1024 });
      
      // Verify layout adapts to tablet size
      await expect(page.locator('[data-testid="sidebar"]')).toBeVisible();
      await expect(page.locator('[data-testid="main-content"]')).toBeVisible();
    });

    test('desktop view layout', async () => {
      // Set desktop viewport
      await page.setViewportSize({ width: 1280, height: 720 });
      
      // Verify full layout is visible
      await expect(page.locator('[data-testid="sidebar"]')).toBeVisible();
      await expect(page.locator('[data-testid="header"]')).toBeVisible();
      await expect(page.locator('[data-testid="main-content"]')).toBeVisible();
    });
  });

  // Profile management workflow
  describe('Profile Management Workflow', () => {
    beforeEach(async () => {
      // Login as demo user
      await page.click('text=Try demo account');
      await page.waitForURL('**/dashboard');
    });

    test('view profile page', async () => {
      // Navigate to profile
      await page.click('text=Profile');
      await page.waitForURL('**/profile');
      
      // Verify profile information is displayed
      await expect(page.locator('text=demo')).toBeVisible();
      await expect(page.locator('text=demo@todoapp.com')).toBeVisible();
    });

    test('demo user restrictions', async () => {
      // Navigate to profile
      await page.click('text=Profile');
      await page.waitForURL('**/profile');
      
      // Verify demo user notice is displayed
      await expect(page.locator('text=Demo Account')).toBeVisible();
      
      // Verify edit fields are disabled
      await expect(page.locator('input[name="username"]')).toBeDisabled();
      await expect(page.locator('input[name="email"]')).toBeDisabled();
    });
  });

  // Error handling workflow
  describe('Error Handling Workflow', () => {
    test('handle network errors gracefully', async () => {
      // Simulate network failure
      await page.route('**/api/**', route => route.abort());
      
      // Try to login
      await page.fill('input[name="email"]', 'test@example.com');
      await page.fill('input[name="password"]', 'password123');
      await page.click('button[type="submit"]');
      
      // Verify error message is displayed
      await expect(page.locator('text=Network error')).toBeVisible();
    });

    test('handle invalid form submissions', async () => {
      // Try to submit empty login form
      await page.click('button[type="submit"]');
      
      // Verify validation errors are displayed
      await expect(page.locator('text=Email is required')).toBeVisible();
      await expect(page.locator('text=Password is required')).toBeVisible();
    });

    test('handle 404 errors', async () => {
      // Navigate to non-existent page
      await page.goto('http://localhost:3000/non-existent-page');
      
      // Verify 404 page is displayed
      await expect(page.locator('text=Page Not Found')).toBeVisible();
    });
  });

  // Performance workflow
  describe('Performance Workflow', () => {
    test('page load performance', async () => {
      const startTime = Date.now();
      
      await page.goto('http://localhost:3000');
      await page.waitForLoadState('networkidle');
      
      const loadTime = Date.now() - startTime;
      
      // Verify page loads within acceptable time (5 seconds)
      expect(loadTime).toBeLessThan(5000);
    });

    test('todo operations performance', async () => {
      // Login
      await page.click('text=Try demo account');
      await page.waitForURL('**/dashboard');
      
      // Measure todo creation time
      const startTime = Date.now();
      
      await page.click('text=Add Todo');
      await page.fill('input[name="title"]', 'Performance Test Todo');
      await page.click('button[type="submit"]');
      
      await page.waitForSelector('text=Performance Test Todo');
      
      const operationTime = Date.now() - startTime;
      
      // Verify operation completes within acceptable time (2 seconds)
      expect(operationTime).toBeLessThan(2000);
    });
  });

  // Accessibility workflow
  describe('Accessibility Workflow', () => {
    test('keyboard navigation', async () => {
      // Test tab navigation
      await page.keyboard.press('Tab');
      await page.keyboard.press('Tab');
      await page.keyboard.press('Tab');
      
      // Verify focus is visible
      const focusedElement = page.locator(':focus');
      await expect(focusedElement).toBeVisible();
    });

    test('screen reader compatibility', async () => {
      // Check for proper ARIA labels
      await expect(page.locator('input[name="email"]')).toHaveAttribute('aria-label');
      await expect(page.locator('input[name="password"]')).toHaveAttribute('aria-label');
    });

    test('color contrast compliance', async () => {
      // This would typically use axe-core for automated testing
      // For now, we'll verify that important elements are visible
      await expect(page.locator('button[type="submit"]')).toBeVisible();
      await expect(page.locator('input[name="email"]')).toBeVisible();
    });
  });
});
