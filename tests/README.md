# Todo App Test Suite

This directory contains a comprehensive test suite for the Todo App, covering all aspects of the application from unit tests to end-to-end tests.

## 📁 Test Structure

```
tests/
├── unit/                    # Unit tests for individual components
│   ├── components/         # React component tests
│   ├── utils/             # Utility function tests
│   └── models/            # Backend model tests
├── integration/           # Integration tests
│   ├── api/              # API endpoint tests
│   └── database/         # Database integration tests
├── e2e/                  # End-to-end tests
│   ├── user-workflows.test.js
│   └── cross-browser.test.js
├── performance/          # Performance and load tests
│   ├── load-testing.test.js
│   ├── artillery-config.yml
│   └── k6-load-test.js
├── security/             # Security tests
│   ├── authentication.test.js
│   ├── authorization.test.js
│   └── data-protection.test.js
├── ui/                   # UI/UX tests
│   ├── accessibility.test.js
│   └── visual-regression.test.js
├── smoke/                # Smoke tests
│   └── basic-functionality.test.js
├── reporters/            # Custom test reporters
│   ├── custom-reporter.js
│   └── html-reporter.js
├── setup/                # Test setup files
│   ├── global-setup.js
│   └── global-teardown.js
├── package.json          # Test dependencies
├── setup.js             # Jest setup
└── README.md            # This file
```

## 🧪 Test Categories

### 1. Unit Tests
- **Purpose**: Test individual components, functions, and modules in isolation
- **Coverage**: React components, utility functions, backend models
- **Tools**: Jest, React Testing Library
- **Location**: `tests/unit/`

### 2. Integration Tests
- **Purpose**: Test interactions between different parts of the system
- **Coverage**: API endpoints, database operations, service integrations
- **Tools**: Jest, Supertest
- **Location**: `tests/integration/`

### 3. End-to-End Tests
- **Purpose**: Test complete user workflows from start to finish
- **Coverage**: User journeys, cross-browser compatibility
- **Tools**: Playwright
- **Location**: `tests/e2e/`

### 4. Performance Tests
- **Purpose**: Test application performance under various loads
- **Coverage**: Load testing, response times, memory usage
- **Tools**: Playwright, Artillery, K6
- **Location**: `tests/performance/`

### 5. Security Tests
- **Purpose**: Test security vulnerabilities and data protection
- **Coverage**: Authentication, authorization, input validation, data exposure
- **Tools**: Jest, Supertest
- **Location**: `tests/security/`

### 6. UI/UX Tests
- **Purpose**: Test accessibility and visual consistency
- **Coverage**: WCAG compliance, visual regression, responsive design
- **Tools**: Playwright, axe-core
- **Location**: `tests/ui/`

### 7. Smoke Tests
- **Purpose**: Verify basic functionality works after deployments
- **Coverage**: Critical paths, essential features
- **Tools**: Playwright, Jest
- **Location**: `tests/smoke/`

## 🚀 Running Tests

### Prerequisites
```bash
# Install test dependencies
cd tests
npm install
```

### Run All Tests
```bash
npm test
```

### Run Specific Test Categories
```bash
# Unit tests only
npm run test:unit

# Integration tests only
npm run test:integration

# End-to-end tests only
npm run test:e2e

# Performance tests only
npm run test:performance

# Security tests only
npm run test:security

# UI/UX tests only
npm run test:ui

# Smoke tests only
npm run test:smoke
```

### Run Tests with Coverage
```bash
npm run test:coverage
```

### Run Tests in Watch Mode
```bash
npm run test:watch
```

### Generate HTML Reports
```bash
npm run test:report
```

## 📊 Test Reports

Test reports are generated in the `../testreports/` directory:

- **`test-report.html`**: Comprehensive HTML report with detailed results
- **`test-summary.html`**: Quick summary of test results
- **`coverage/`**: Code coverage reports
- **`test-results.json`**: Machine-readable test results

## 🔧 Configuration

### Jest Configuration
The test suite uses Jest with the following configuration:
- **Test Environment**: jsdom for frontend tests, node for backend tests
- **Setup Files**: Global setup and teardown for database and environment
- **Coverage**: HTML and LCOV reports
- **Reporters**: Custom HTML reporter for detailed results

### Environment Variables
```bash
# Test environment
NODE_ENV=test

# Test database
TEST_DATABASE_URL=postgresql://localhost:5432/todo_app_test

# JWT secret for testing
JWT_SECRET=test-jwt-secret

# Test port
PORT=5003
```

## 🎯 Test Coverage Goals

- **Statements**: > 90%
- **Branches**: > 85%
- **Functions**: > 90%
- **Lines**: > 90%

## 🐛 Debugging Tests

### Debug Unit Tests
```bash
# Run specific test file
npm test -- Button.test.js

# Run with verbose output
npm test -- --verbose

# Run with debug output
npm test -- --detectOpenHandles
```

### Debug E2E Tests
```bash
# Run in headed mode
HEADLESS=false npm run test:e2e

# Run with slow motion
SLOW_MO=1000 npm run test:e2e

# Run specific test
npm run test:e2e -- --grep "login functionality"
```

### Debug Performance Tests
```bash
# Run with detailed output
npm run test:performance -- --verbose

# Run specific performance test
npm run test:performance -- --testNamePattern="API Performance"
```

## 📝 Writing Tests

### Unit Test Example
```javascript
import { render, screen, fireEvent } from '@testing-library/react';
import Button from '../../../frontend/src/components/common/Button';

describe('Button Component', () => {
  test('renders button with text', () => {
    render(<Button>Click me</Button>);
    expect(screen.getByRole('button', { name: /click me/i })).toBeInTheDocument();
  });

  test('calls onClick handler when clicked', () => {
    const handleClick = jest.fn();
    render(<Button onClick={handleClick}>Click me</Button>);
    
    fireEvent.click(screen.getByRole('button'));
    expect(handleClick).toHaveBeenCalledTimes(1);
  });
});
```

### Integration Test Example
```javascript
const request = require('supertest');
const app = require('../../../backend/server');

describe('Todos API Integration Tests', () => {
  test('creates a new todo successfully', async () => {
    const response = await request(app)
      .post('/api/todos')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        title: 'Test Todo',
        description: 'Test Description',
        priority: 'medium',
        category: 'work',
      })
      .expect(201);

    expect(response.body.success).toBe(true);
    expect(response.body.data.todo.title).toBe('Test Todo');
  });
});
```

### E2E Test Example
```javascript
const { chromium } = require('playwright');

describe('Todo App E2E Tests', () => {
  test('complete user registration flow', async () => {
    await page.goto('http://localhost:3000');
    await page.click('text=Sign Up');
    await page.fill('input[name="username"]', 'testuser');
    await page.fill('input[name="email"]', 'test@example.com');
    await page.fill('input[name="password"]', 'Password123');
    await page.click('button[type="submit"]');
    
    await page.waitForURL('**/dashboard');
    await expect(page.locator('text=Welcome')).toBeVisible();
  });
});
```

## 🔍 Best Practices

### Test Organization
- Group related tests in describe blocks
- Use descriptive test names
- Follow the AAA pattern (Arrange, Act, Assert)
- Keep tests independent and isolated

### Test Data
- Use factories for creating test data
- Clean up test data after each test
- Use realistic but minimal test data
- Avoid hardcoded values when possible

### Assertions
- Use specific assertions
- Test both positive and negative cases
- Verify error messages and edge cases
- Test accessibility and user experience

### Performance
- Mock external dependencies
- Use parallel test execution
- Optimize test setup and teardown
- Monitor test execution time

## 🚨 Common Issues

### Test Failures
1. **Flaky Tests**: Add proper waits and retries
2. **Timeout Issues**: Increase timeout for slow operations
3. **Environment Issues**: Ensure test environment is properly configured
4. **Data Issues**: Clean up test data between tests

### Debugging Tips
1. Use `console.log` for debugging (removed in production)
2. Take screenshots in E2E tests for visual debugging
3. Use browser dev tools for frontend debugging
4. Check network requests in integration tests

## 📚 Resources

- [Jest Documentation](https://jestjs.io/docs/getting-started)
- [React Testing Library](https://testing-library.com/docs/react-testing-library/intro/)
- [Playwright Documentation](https://playwright.dev/docs/intro)
- [Supertest Documentation](https://github.com/visionmedia/supertest)
- [Artillery Documentation](https://artillery.io/docs/)
- [K6 Documentation](https://k6.io/docs/)

## 🤝 Contributing

When adding new tests:
1. Follow the existing test structure
2. Add appropriate test categories
3. Update this README if needed
4. Ensure tests pass in CI/CD pipeline
5. Add test coverage for new features

## 📞 Support

For test-related issues:
1. Check the test logs for error details
2. Verify environment configuration
3. Review test data and setup
4. Consult the documentation above
5. Create an issue with detailed information