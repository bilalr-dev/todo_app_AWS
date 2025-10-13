module.exports = {
  // Test environment - use jsdom for frontend tests, node for backend tests
  testEnvironment: 'jsdom',
  
  // Setup files
  setupFilesAfterEnv: ['<rootDir>/tests/setup.js'],
  
  // Projects for different test environments
  projects: [
    {
      displayName: 'frontend',
      testEnvironment: 'jsdom',
      testMatch: [
        '<rootDir>/tests/unit/components/**/*.test.js',
        '<rootDir>/tests/ui/**/*.test.js',
        '<rootDir>/tests/e2e/**/*.test.js'
      ],
      setupFilesAfterEnv: ['<rootDir>/tests/setup-frontend.js'],
    },
    {
      displayName: 'backend',
      testEnvironment: 'node',
      testMatch: [
        '<rootDir>/tests/unit/models/**/*.test.js',
        '<rootDir>/tests/unit/utils/**/*.test.js',
        '<rootDir>/tests/integration/**/*.test.js',
        '<rootDir>/tests/security/**/*.test.js',
        '<rootDir>/tests/performance/**/*.test.js',
        '<rootDir>/tests/smoke/**/*.test.js'
      ],
      setupFilesAfterEnv: ['<rootDir>/tests/setup-backend.js'],
      setupFiles: ['<rootDir>/tests/setup-env.js'],
      globalTeardown: '<rootDir>/tests/teardown-backend.js',
    }
  ],
  
  // Module name mapping for CSS and other assets
  moduleNameMapper: {
    '\\.(css|less|scss|sass)$': 'identity-obj-proxy',
    '\\.(jpg|jpeg|png|gif|eot|otf|webp|svg|ttf|woff|woff2|mp4|webm|wav|mp3|m4a|aac|oga)$': '<rootDir>/tests/__mocks__/fileMock.js'
  },
  
  // Transform files
  transform: {
    '^.+\\.(js|jsx)$': 'babel-jest'
  },
  
  // Test file patterns
  testMatch: [
    '<rootDir>/tests/**/*.test.js',
    '<rootDir>/tests/**/*.test.jsx'
  ],
  
  // Coverage configuration
  collectCoverage: true,
  coverageDirectory: 'testreports/coverage',
  coverageReporters: ['text', 'lcov', 'html'],
  collectCoverageFrom: [
    'frontend/src/**/*.{js,jsx}',
    'backend/src/**/*.js',
    '!**/node_modules/**',
    '!**/tests/**',
    '!**/*.config.js'
  ],
  
  // Test timeout
  testTimeout: 30000,
  
  // Clear mocks between tests
  clearMocks: true,
  
  // Verbose output
  verbose: true,
  
  // Force exit after tests complete
  forceExit: true,
  
  // Detect open handles
  detectOpenHandles: true,
  
  // Reporters
  reporters: [
    'default',
    ['jest-html-reporters', {
      publicPath: './testreports',
      filename: 'test-report.html',
      expand: true
    }]
  ]
};
