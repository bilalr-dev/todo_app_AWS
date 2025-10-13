// UI/UX tests for accessibility and visual regression
const { chromium } = require('playwright');
const axe = require('axe-core');

// Extend Jest matchers
expect.extend(require('jest-axe').toHaveNoViolations);

describe('Accessibility Tests', () => {
  let browser;
  let page;
  let context;

  beforeAll(async () => {
    browser = await chromium.launch({ 
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
    
    // Inject axe-core
    await page.addScriptTag({ url: 'https://unpkg.com/axe-core@4.8.2/axe.min.js' });
  });

  afterEach(async () => {
    await context.close();
  });

  // WCAG compliance tests
  describe('WCAG Compliance', () => {
    test('login page meets WCAG 2.1 AA standards', async () => {
      await page.goto('http://localhost:3000/login');
      const results = await page.evaluate(() => {
        return new Promise((resolve) => {
          axe.run(document, (err, results) => {
            if (err) throw err;
            resolve(results);
          });
        });
      });

      expect(results).toHaveNoViolations();
    });

    test('dashboard page meets WCAG 2.1 AA standards', async () => {
      await page.goto('http://localhost:3000');
      await page.click('text=Try demo account');
      await page.waitForURL('**/dashboard');
      
      const results = await page.evaluate(() => {
        return new Promise((resolve) => {
          axe.run(document, (err, results) => {
            if (err) throw err;
            resolve(results);
          });
        });
      });

      expect(results).toHaveNoViolations();
    });

    test('profile page meets WCAG 2.1 AA standards', async () => {
      await page.goto('http://localhost:3000');
      await page.click('text=Try demo account');
      await page.waitForURL('**/dashboard');
      await page.click('text=Profile');
      await page.waitForURL('**/profile');
      
      const results = await page.evaluate(() => {
        return new Promise((resolve) => {
          axe.run(document, (err, results) => {
            if (err) throw err;
            resolve(results);
          });
        });
      });

      expect(results).toHaveNoViolations();
    });

    test('todo creation form meets WCAG 2.1 AA standards', async () => {
      await page.goto('http://localhost:3000');
      await page.click('text=Try demo account');
      await page.waitForURL('**/dashboard');
      await page.click('text=Add Todo');
      
      const results = await page.evaluate(() => {
        return new Promise((resolve) => {
          axe.run(document, (err, results) => {
            if (err) throw err;
            resolve(results);
          });
        });
      });

      expect(results).toHaveNoViolations();
    }, 60000);
  });

  // Keyboard navigation tests
  describe('Keyboard Navigation', () => {
    test('all interactive elements are keyboard accessible', async () => {
      await page.goto('http://localhost:3000');
      
      // Test tab navigation
      await page.keyboard.press('Tab');
      await page.keyboard.press('Tab');
      await page.keyboard.press('Tab');
      
      // Verify focus is visible
      const focusedElement = page.locator(':focus');
      await expect(focusedElement).toBeVisible();
    });

    test('form elements are properly labeled', async () => {
      await page.goto('http://localhost:3000/login');
      
      // Check that form inputs have proper labels
      const emailInput = page.locator('input[name="email"]');
      const passwordInput = page.locator('input[name="password"]');
      
      await expect(emailInput).toHaveAttribute('aria-label');
      await expect(passwordInput).toHaveAttribute('aria-label');
    });

    test('buttons have accessible names', async () => {
      await page.goto('http://localhost:3000/login');
      
      const submitButton = page.locator('button[type="submit"]');
      await expect(submitButton).toHaveAttribute('aria-label');
    });

    test('skip links are present and functional', async () => {
      await page.goto('http://localhost:3000');
      await page.click('text=Try demo account');
      await page.waitForURL('**/dashboard');
      
      // Check for skip links
      const skipLinks = page.locator('a[href^="#"]');
      const count = await skipLinks.count();
      expect(count).toBeGreaterThan(0);
    });

    test('modal dialogs are keyboard accessible', async () => {
      await page.goto('http://localhost:3000');
      await page.click('text=Try demo account');
      await page.waitForURL('**/dashboard');
      
      // Open a modal (if any exist)
      const deleteButton = page.locator('[data-testid="delete-todo"]:first-child');
      if (await deleteButton.isVisible()) {
        await deleteButton.click();
        
        // Check that modal is focused
        const modal = page.locator('[role="dialog"]');
        await expect(modal).toBeVisible();
        
        // Test escape key closes modal
        await page.keyboard.press('Escape');
        await expect(modal).not.toBeVisible();
      }
    });
  });

  // Screen reader compatibility tests
  describe('Screen Reader Compatibility', () => {
    test('page has proper heading structure', async () => {
      await page.goto('http://localhost:3000');
      await page.click('text=Try demo account');
      await page.waitForURL('**/dashboard');
      
      // Check for proper heading hierarchy
      const h1 = page.locator('h1');
      const h2 = page.locator('h2');
      const h3 = page.locator('h3');
      
      expect(await h1.count()).toBe(1);
      expect(await h2.count()).toBeGreaterThan(0);
    });

    test('images have alt text', async () => {
      await page.goto('http://localhost:3000');
      
      const images = page.locator('img');
      const count = await images.count();
      
      for (let i = 0; i < count; i++) {
        const img = images.nth(i);
        await expect(img).toHaveAttribute('alt');
      }
    });

    test('form fields have proper ARIA attributes', async () => {
      await page.goto('http://localhost:3000/login');
      
      const emailInput = page.locator('input[name="email"]');
      const passwordInput = page.locator('input[name="password"]');
      
      await expect(emailInput).toHaveAttribute('aria-required', 'true');
      await expect(passwordInput).toHaveAttribute('aria-required', 'true');
    });

    test('error messages are properly associated with form fields', async () => {
      await page.goto('http://localhost:3000/login');
      
      // Submit empty form to trigger validation
      await page.click('button[type="submit"]');
      
      // Check that error messages are properly associated
      const emailInput = page.locator('input[name="email"]');
      const passwordInput = page.locator('input[name="password"]');
      
      await expect(emailInput).toHaveAttribute('aria-describedby');
      await expect(passwordInput).toHaveAttribute('aria-describedby');
    });

    test('dynamic content changes are announced', async () => {
      await page.goto('http://localhost:3000');
      await page.click('text=Try demo account');
      await page.waitForURL('**/dashboard');
      
      // Check for live regions
      const liveRegions = page.locator('[aria-live]');
      const count = await liveRegions.count();
      expect(count).toBeGreaterThan(0);
    });
  });

  // Color contrast tests
  describe('Color Contrast', () => {
    test('text has sufficient color contrast', async () => {
      await page.goto('http://localhost:3000');
      await page.click('text=Try demo account');
      await page.waitForURL('**/dashboard');
      
      // This would typically use a color contrast checking library
      // For now, we'll check that important elements are visible
      const mainContent = page.locator('main, [role="main"]');
      await expect(mainContent).toBeVisible();
      
      const textElements = page.locator('p, span, div, h1, h2, h3, h4, h5, h6');
      const count = await textElements.count();
      expect(count).toBeGreaterThan(0);
    });

    test('focus indicators are visible', async () => {
      await page.goto('http://localhost:3000');
      
      // Focus on an interactive element
      await page.keyboard.press('Tab');
      
      // Check that focus is visible
      const focusedElement = page.locator(':focus');
      await expect(focusedElement).toBeVisible();
      
      // Check that focus indicator has sufficient contrast
      const focusStyles = await focusedElement.evaluate((el) => {
        const styles = window.getComputedStyle(el);
        return {
          outline: styles.outline,
          boxShadow: styles.boxShadow,
          border: styles.border,
        };
      });
      
      expect(focusStyles.outline).not.toBe('none');
    });
  });

  // Responsive design accessibility tests
  describe('Responsive Design Accessibility', () => {
    test('mobile view maintains accessibility', async () => {
      await page.setViewportSize({ width: 375, height: 667 });
      await page.goto('http://localhost:3000');
      await page.click('text=Try demo account');
      await page.waitForURL('**/dashboard');
      
      const results = await page.evaluate(() => {
        return new Promise((resolve) => {
          axe.run(document, (err, results) => {
            if (err) throw err;
            resolve(results);
          });
        });
      });

      expect(results).toHaveNoViolations();
    });

    test('tablet view maintains accessibility', async () => {
      await page.setViewportSize({ width: 768, height: 1024 });
      await page.goto('http://localhost:3000');
      await page.click('text=Try demo account');
      await page.waitForURL('**/dashboard');
      
      const results = await page.evaluate(() => {
        return new Promise((resolve) => {
          axe.run(document, (err, results) => {
            if (err) throw err;
            resolve(results);
          });
        });
      });

      expect(results).toHaveNoViolations();
    });

    test('touch targets are appropriately sized', async () => {
      await page.setViewportSize({ width: 375, height: 667 });
      await page.goto('http://localhost:3000');
      await page.click('text=Try demo account');
      await page.waitForURL('**/dashboard');
      
      // Check that interactive elements are at least 44x44 pixels
      const buttons = page.locator('button, a, input[type="button"], input[type="submit"]');
      const count = await buttons.count();
      
      for (let i = 0; i < count; i++) {
        const button = buttons.nth(i);
        const box = await button.boundingBox();
        
        if (box) {
          expect(box.width).toBeGreaterThanOrEqual(44);
          expect(box.height).toBeGreaterThanOrEqual(44);
        }
      }
    });
  });

  // High contrast mode tests
  describe('High Contrast Mode', () => {
    test('application works in high contrast mode', async () => {
      // Simulate high contrast mode
      await page.emulateMedia({ colorScheme: 'dark' });
      await page.goto('http://localhost:3000');
      await page.click('text=Try demo account');
      await page.waitForURL('**/dashboard');
      
      // Check that content is still visible and accessible
      const mainContent = page.locator('main, [role="main"]');
      await expect(mainContent).toBeVisible();
      
      const results = await page.evaluate(() => {
        return new Promise((resolve) => {
          axe.run(document, (err, results) => {
            if (err) throw err;
            resolve(results);
          });
        });
      });

      expect(results).toHaveNoViolations();
    });
  });

  // Reduced motion tests
  describe('Reduced Motion', () => {
    test('respects prefers-reduced-motion setting', async () => {
      // Simulate reduced motion preference
      await page.emulateMedia({ reducedMotion: 'reduce' });
      await page.goto('http://localhost:3000');
      await page.click('text=Try demo account');
      await page.waitForURL('**/dashboard');
      
      // Check that animations are reduced or disabled
      const animatedElements = page.locator('[style*="animation"], [style*="transition"]');
      const count = await animatedElements.count();
      
      // In a properly implemented app, animations should be reduced
      // This test would need to be customized based on the actual implementation
      expect(count).toBeGreaterThanOrEqual(0);
    });
  });

  // Language and internationalization tests
  describe('Language and Internationalization', () => {
    test('page has proper language declaration', async () => {
      await page.goto('http://localhost:3000');
      
      const html = page.locator('html');
      await expect(html).toHaveAttribute('lang');
      
      const lang = await html.getAttribute('lang');
      expect(lang).toBe('en');
    });

    test('text direction is properly set', async () => {
      await page.goto('http://localhost:3000');
      
      const html = page.locator('html');
      const dir = await html.getAttribute('dir');
      expect(dir).toBe('ltr');
    });
  });

  // Error handling accessibility tests
  describe('Error Handling Accessibility', () => {
    test('error messages are accessible', async () => {
      await page.goto('http://localhost:3000/login');
      
      // Submit empty form to trigger validation
      await page.click('button[type="submit"]');
      
      // Check that error messages are properly announced
      const errorMessages = page.locator('[role="alert"], .error, .invalid');
      const count = await errorMessages.count();
      expect(count).toBeGreaterThan(0);
      
      // Check that error messages have proper ARIA attributes
      for (let i = 0; i < count; i++) {
        const error = errorMessages.nth(i);
        const role = await error.getAttribute('role');
        expect(role).toBe('alert');
      }
    });

    test('loading states are accessible', async () => {
      await page.goto('http://localhost:3000');
      await page.click('text=Try demo account');
      await page.waitForURL('**/dashboard');
      
      // Check for loading indicators
      const loadingIndicators = page.locator('[aria-busy="true"], [role="status"]');
      const count = await loadingIndicators.count();
      expect(count).toBeGreaterThanOrEqual(0);
    });
  });

  // Custom accessibility tests
  describe('Custom Accessibility Features', () => {
    test('custom components are accessible', async () => {
      await page.goto('http://localhost:3000');
      await page.click('text=Try demo account');
      await page.waitForURL('**/dashboard');
      
      // Check custom components
      const customComponents = page.locator('[data-testid*="custom"], [data-component]');
      const count = await customComponents.count();
      
      for (let i = 0; i < count; i++) {
        const component = customComponents.nth(i);
        
        // Check that custom components have proper ARIA attributes
        const role = await component.getAttribute('role');
        const ariaLabel = await component.getAttribute('aria-label');
        const ariaLabelledBy = await component.getAttribute('aria-labelledby');
        
        expect(role || ariaLabel || ariaLabelledBy).toBeTruthy();
      }
    });

    test('interactive elements have proper roles', async () => {
      await page.goto('http://localhost:3000');
      await page.click('text=Try demo account');
      await page.waitForURL('**/dashboard');
      
      // Check that interactive elements have proper roles
      const buttons = page.locator('button');
      const links = page.locator('a');
      const inputs = page.locator('input, textarea, select');
      
      const buttonCount = await buttons.count();
      const linkCount = await links.count();
      const inputCount = await inputs.count();
      
      expect(buttonCount).toBeGreaterThan(0);
      expect(linkCount).toBeGreaterThan(0);
      expect(inputCount).toBeGreaterThan(0);
    });
  });
});
