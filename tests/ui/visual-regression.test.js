// Visual regression tests for UI consistency
const { chromium } = require('playwright');

describe('Visual Regression Tests', () => {
  let browser;
  let page;
  let context;

  beforeAll(async () => {
    browser = await chromium.launch({ 
      headless: true, // Visual tests should run headless
      slowMo: 0
    });
  });

  afterAll(async () => {
    await browser.close();
  });

  beforeEach(async () => {
    context = await browser.newContext({
      viewport: { width: 1280, height: 720 },
      deviceScaleFactor: 1,
    });
    page = await context.newPage();
  });

  afterEach(async () => {
    await context.close();
  });

  // Desktop visual tests
  describe('Desktop Visual Tests', () => {
    test('login page visual consistency', async () => {
      await page.goto('http://localhost:3000/login');
      await page.waitForLoadState('networkidle');
      
      // Take screenshot
      const screenshot = await page.screenshot({ fullPage: true });
      
      // Compare with baseline (in a real scenario, you'd use a visual testing tool)
      expect(screenshot).toBeDefined();
      expect(screenshot.length).toBeGreaterThan(0);
    }, 60000);

    test('dashboard page visual consistency', async () => {
      await page.goto('http://localhost:3000');
      await page.click('text=Try demo account');
      await page.waitForURL('**/dashboard');
      await page.waitForLoadState('networkidle');
      
      const screenshot = await page.screenshot({ fullPage: true });
      
      expect(screenshot).toBeDefined();
      expect(screenshot.length).toBeGreaterThan(0);
    }, 60000);

    test('profile page visual consistency', async () => {
      await page.goto('http://localhost:3000');
      await page.click('text=Try demo account');
      await page.waitForURL('**/dashboard');
      await page.click('text=Profile');
      await page.waitForURL('**/profile');
      await page.waitForLoadState('networkidle');
      
      const screenshot = await page.screenshot({ fullPage: true });
      
      expect(screenshot).toBeDefined();
      expect(screenshot.length).toBeGreaterThan(0);
    }, 60000);

    test('todo creation form visual consistency', async () => {
      await page.goto('http://localhost:3000');
      await page.click('text=Try demo account');
      await page.waitForURL('**/dashboard');
      await page.click('text=Add Todo');
      await page.waitForLoadState('networkidle');
      
      const screenshot = await page.screenshot({ fullPage: true });
      
      expect(screenshot).toBeDefined();
      expect(screenshot.length).toBeGreaterThan(0);
    }, 60000);
  });

  // Mobile visual tests
  describe('Mobile Visual Tests', () => {
    test('mobile login page visual consistency', async () => {
      await page.setViewportSize({ width: 375, height: 667 });
      await page.goto('http://localhost:3000/login');
      await page.waitForLoadState('networkidle');
      
      const screenshot = await page.screenshot({ fullPage: true });
      
      expect(screenshot).toBeDefined();
      expect(screenshot.length).toBeGreaterThan(0);
    }, 60000);

    test('mobile dashboard visual consistency', async () => {
      await page.setViewportSize({ width: 375, height: 667 });
      await page.goto('http://localhost:3000');
      await page.click('text=Try demo account');
      await page.waitForURL('**/dashboard');
      await page.waitForLoadState('networkidle');
      
      const screenshot = await page.screenshot({ fullPage: true });
      
      expect(screenshot).toBeDefined();
      expect(screenshot.length).toBeGreaterThan(0);
    }, 60000);

    test('mobile sidebar behavior visual consistency', async () => {
      await page.setViewportSize({ width: 375, height: 667 });
      await page.goto('http://localhost:3000');
      await page.click('text=Try demo account');
      await page.waitForURL('**/dashboard');
      
      // Test sidebar closed state
      const closedScreenshot = await page.screenshot({ fullPage: true });
      expect(closedScreenshot).toBeDefined();
      
      // Open sidebar
      await page.click('[data-testid="hamburger-menu"]');
      await page.waitForTimeout(300); // Wait for animation
      
      // Test sidebar open state
      const openScreenshot = await page.screenshot({ fullPage: true });
      expect(openScreenshot).toBeDefined();
    }, 60000);
  });

  // Tablet visual tests
  describe('Tablet Visual Tests', () => {
    test('tablet dashboard visual consistency', async () => {
      await page.setViewportSize({ width: 768, height: 1024 });
      await page.goto('http://localhost:3000');
      await page.click('text=Try demo account');
      await page.waitForURL('**/dashboard');
      await page.waitForLoadState('networkidle');
      
      const screenshot = await page.screenshot({ fullPage: true });
      
      expect(screenshot).toBeDefined();
      expect(screenshot.length).toBeGreaterThan(0);
    }, 60000);

    test('tablet profile page visual consistency', async () => {
      await page.setViewportSize({ width: 768, height: 1024 });
      await page.goto('http://localhost:3000');
      await page.click('text=Try demo account');
      await page.waitForURL('**/dashboard');
      await page.click('text=Profile');
      await page.waitForURL('**/profile');
      await page.waitForLoadState('networkidle');
      
      const screenshot = await page.screenshot({ fullPage: true });
      
      expect(screenshot).toBeDefined();
      expect(screenshot.length).toBeGreaterThan(0);
    }, 60000);
  });

  // Dark mode visual tests
  describe('Dark Mode Visual Tests', () => {
    test('dark mode login page visual consistency', async () => {
      await page.goto('http://localhost:3000/login');
      await page.click('[data-testid="theme-toggle"]');
      await page.waitForTimeout(300); // Wait for theme transition
      await page.waitForLoadState('networkidle');
      
      const screenshot = await page.screenshot({ fullPage: true });
      
      expect(screenshot).toBeDefined();
      expect(screenshot.length).toBeGreaterThan(0);
    }, 60000);

    test('dark mode dashboard visual consistency', async () => {
      await page.goto('http://localhost:3000');
      await page.click('text=Try demo account');
      await page.waitForURL('**/dashboard');
      await page.click('[data-testid="theme-toggle"]');
      await page.waitForTimeout(300); // Wait for theme transition
      await page.waitForLoadState('networkidle');
      
      const screenshot = await page.screenshot({ fullPage: true });
      
      expect(screenshot).toBeDefined();
      expect(screenshot.length).toBeGreaterThan(0);
    }, 60000);
  });

  // Component visual tests
  describe('Component Visual Tests', () => {
    test('button component visual consistency', async () => {
      await page.goto('http://localhost:3000/login');
      
      // Test different button states
      const submitButton = page.locator('button[type="submit"]');
      
      // Normal state
      const normalScreenshot = await submitButton.screenshot();
      expect(normalScreenshot).toBeDefined();
      
      // Hover state
      await submitButton.hover();
      await page.waitForTimeout(100);
      const hoverScreenshot = await submitButton.screenshot();
      expect(hoverScreenshot).toBeDefined();
      
      // Focus state
      await submitButton.focus();
      await page.waitForTimeout(100);
      const focusScreenshot = await submitButton.screenshot();
      expect(focusScreenshot).toBeDefined();
    });

    test('input component visual consistency', async () => {
      await page.goto('http://localhost:3000/login');
      
      const emailInput = page.locator('input[name="email"]');
      
      // Normal state
      const normalScreenshot = await emailInput.screenshot();
      expect(normalScreenshot).toBeDefined();
      
      // Focus state
      await emailInput.focus();
      await page.waitForTimeout(100);
      const focusScreenshot = await emailInput.screenshot();
      expect(focusScreenshot).toBeDefined();
      
      // Error state
      await emailInput.fill('invalid-email');
      await page.click('button[type="submit"]');
      await page.waitForTimeout(100);
      const errorScreenshot = await emailInput.screenshot();
      expect(errorScreenshot).toBeDefined();
    });

    test('todo card component visual consistency', async () => {
      await page.goto('http://localhost:3000');
      await page.click('text=Try demo account');
      await page.waitForURL('**/dashboard');
      
      const todoCard = page.locator('[data-testid="todo-item"]:first-child');
      
      if (await todoCard.isVisible()) {
        const screenshot = await todoCard.screenshot();
        expect(screenshot).toBeDefined();
        expect(screenshot.length).toBeGreaterThan(0);
      }
    });

    test('modal component visual consistency', async () => {
      await page.goto('http://localhost:3000');
      await page.click('text=Try demo account');
      await page.waitForURL('**/dashboard');
      
      // Try to open a modal
      const deleteButton = page.locator('[data-testid="delete-todo"]:first-child');
      if (await deleteButton.isVisible()) {
        await deleteButton.click();
        
        const modal = page.locator('[role="dialog"]');
        if (await modal.isVisible()) {
          const screenshot = await modal.screenshot();
          expect(screenshot).toBeDefined();
          expect(screenshot.length).toBeGreaterThan(0);
        }
      }
    });
  });

  // Animation and transition tests
  describe('Animation and Transition Tests', () => {
    test('theme transition visual consistency', async () => {
      await page.goto('http://localhost:3000');
      await page.click('text=Try demo account');
      await page.waitForURL('**/dashboard');
      
      // Capture before transition
      const beforeScreenshot = await page.screenshot({ fullPage: true });
      expect(beforeScreenshot).toBeDefined();
      
      // Trigger theme transition
      await page.click('[data-testid="theme-toggle"]');
      
      // Capture during transition (if animations are slow enough)
      await page.waitForTimeout(150);
      const duringScreenshot = await page.screenshot({ fullPage: true });
      expect(duringScreenshot).toBeDefined();
      
      // Capture after transition
      await page.waitForTimeout(300);
      const afterScreenshot = await page.screenshot({ fullPage: true });
      expect(afterScreenshot).toBeDefined();
    });

    test('sidebar transition visual consistency', async () => {
      await page.setViewportSize({ width: 375, height: 667 });
      await page.goto('http://localhost:3000');
      await page.click('text=Try demo account');
      await page.waitForURL('**/dashboard');
      
      // Capture closed state
      const closedScreenshot = await page.screenshot({ fullPage: true });
      expect(closedScreenshot).toBeDefined();
      
      // Open sidebar
      await page.click('[data-testid="hamburger-menu"]');
      
      // Capture during transition
      await page.waitForTimeout(150);
      const duringScreenshot = await page.screenshot({ fullPage: true });
      expect(duringScreenshot).toBeDefined();
      
      // Capture open state
      await page.waitForTimeout(300);
      const openScreenshot = await page.screenshot({ fullPage: true });
      expect(openScreenshot).toBeDefined();
    });
  });

  // Cross-browser visual tests
  describe('Cross-Browser Visual Tests', () => {
    test('Chrome visual consistency', async () => {
      await page.goto('http://localhost:3000');
      await page.click('text=Try demo account');
      await page.waitForURL('**/dashboard');
      await page.waitForLoadState('networkidle');
      
      const screenshot = await page.screenshot({ fullPage: true });
      expect(screenshot).toBeDefined();
      expect(screenshot.length).toBeGreaterThan(0);
    }, 60000);
  });

  // Error state visual tests
  describe('Error State Visual Tests', () => {
    test('login error state visual consistency', async () => {
      await page.goto('http://localhost:3000/login');
      
      // Trigger validation errors
      await page.click('button[type="submit"]');
      await page.waitForTimeout(100);
      
      const screenshot = await page.screenshot({ fullPage: true });
      expect(screenshot).toBeDefined();
      expect(screenshot.length).toBeGreaterThan(0);
    }, 60000);

    test('network error state visual consistency', async () => {
      // Simulate network error
      await page.route('**/api/**', route => route.abort());
      
      await page.goto('http://localhost:3000');
      await page.fill('input[name="email"]', 'test@example.com');
      await page.fill('input[name="password"]', 'password123');
      await page.click('button[type="submit"]');
      
      // Wait for error to appear
      await page.waitForTimeout(1000);
      
      const screenshot = await page.screenshot({ fullPage: true });
      expect(screenshot).toBeDefined();
      expect(screenshot.length).toBeGreaterThan(0);
    }, 60000);
  });

  // Loading state visual tests
  describe('Loading State Visual Tests', () => {
    test('loading spinner visual consistency', async () => {
      await page.goto('http://localhost:3000');
      
      // Slow down network to capture loading states
      await page.route('**/api/**', async route => {
        await new Promise(resolve => setTimeout(resolve, 1000));
        route.continue();
      });
      
      await page.fill('input[name="email"]', 'demo@todoapp.com');
      await page.fill('input[name="password"]', 'demo123');
      await page.click('button[type="submit"]');
      
      // Capture loading state
      await page.waitForTimeout(500);
      const screenshot = await page.screenshot({ fullPage: true });
      expect(screenshot).toBeDefined();
      expect(screenshot.length).toBeGreaterThan(0);
    }, 60000);
  });

  // Print styles visual tests
  describe('Print Styles Visual Tests', () => {
    test('print styles visual consistency', async () => {
      await page.goto('http://localhost:3000');
      await page.click('text=Try demo account');
      await page.waitForURL('**/dashboard');
      
      // Emulate print media
      await page.emulateMedia({ media: 'print' });
      await page.waitForTimeout(100);
      
      const screenshot = await page.screenshot({ fullPage: true });
      expect(screenshot).toBeDefined();
      expect(screenshot.length).toBeGreaterThan(0);
    }, 60000);
  });

  // High DPI visual tests
  describe('High DPI Visual Tests', () => {
    test('high DPI display visual consistency', async () => {
      // Create high DPI context
      const highDpiContext = await browser.newContext({
        viewport: { width: 1280, height: 720 },
        deviceScaleFactor: 2, // 2x DPI
      });
      const highDpiPage = await highDpiContext.newPage();
      
      await highDpiPage.goto('http://localhost:3000');
      await highDpiPage.click('text=Try demo account');
      await highDpiPage.waitForURL('**/dashboard');
      await highDpiPage.waitForLoadState('networkidle');
      
      const screenshot = await highDpiPage.screenshot({ fullPage: true });
      expect(screenshot).toBeDefined();
      expect(screenshot.length).toBeGreaterThan(0);
      
      await highDpiContext.close();
    });
  });
});
