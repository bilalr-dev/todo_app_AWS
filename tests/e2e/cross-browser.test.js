// Cross-browser end-to-end tests
const { chromium, firefox, webkit } = require('playwright');

const browsers = [
  { name: 'Chromium', browser: chromium },
  { name: 'Firefox', browser: firefox },
  { name: 'WebKit', browser: webkit },
];

browsers.forEach(({ name, browser: browserType }) => {
  describe(`${name} Browser Tests`, () => {
    let browser;
    let page;
    let context;

    beforeAll(async () => {
      browser = await browserType.launch({ 
        headless: process.env.CI === 'true',
        slowMo: 50
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
      await page.goto('http://localhost:3000');
    });

    afterEach(async () => {
      await context.close();
    });

    test('login functionality works across browsers', async () => {
      // Click demo account button
      await page.click('text=Try demo account');
      await page.waitForURL('**/dashboard');
      
      // Verify user is logged in
      await expect(page.locator('text=Dashboard')).toBeVisible();
    });

    test('todo creation works across browsers', async () => {
      // Login first
      await page.click('text=Try demo account');
      await page.waitForURL('**/dashboard');

      // Create a new todo
      await page.click('text=Add Todo');
      await page.fill('input[name="title"]', `${name} Test Todo`);
      await page.fill('textarea[name="description"]', `This is a ${name} browser test`);
      await page.click('button[type="submit"]');
      
      // Verify todo appears
      await expect(page.locator(`text=${name} Test Todo`)).toBeVisible();
    });

    test('theme switching works across browsers', async () => {
      // Login first
      await page.click('text=Try demo account');
      await page.waitForURL('**/dashboard');

      // Toggle theme
      await page.click('[data-testid="theme-toggle"]');
      await expect(page.locator('html')).toHaveClass(/dark/);
      
      // Toggle back
      await page.click('[data-testid="theme-toggle"]');
      await expect(page.locator('html')).toHaveClass(/light/);
    });

    test('responsive design works across browsers', async () => {
      // Test mobile viewport
      await page.setViewportSize({ width: 375, height: 667 });
      await expect(page.locator('[data-testid="hamburger-menu"]')).toBeVisible();
      
      // Test desktop viewport
      await page.setViewportSize({ width: 1280, height: 720 });
      await expect(page.locator('[data-testid="sidebar"]')).toBeVisible();
    });

    test('form validation works across browsers', async () => {
      // Try to submit empty form
      await page.click('button[type="submit"]');
      
      // Verify validation errors appear
      await expect(page.locator('text=Email is required')).toBeVisible();
    });
  });
});
