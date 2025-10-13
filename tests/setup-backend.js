// Jest setup file for backend tests (node environment)
import '@testing-library/jest-dom';

// Polyfill for TextEncoder and TextDecoder (Node.js compatibility)
import { TextEncoder, TextDecoder } from 'util';

global.TextEncoder = TextEncoder;
global.TextDecoder = TextDecoder;

// Additional polyfills for Node.js APIs
import { webcrypto } from 'crypto';
global.crypto = webcrypto;

// Polyfill for Buffer if needed
import { Buffer } from 'buffer';
global.Buffer = Buffer;

// Mock console methods to reduce noise in tests
global.console = {
  ...console,
  // Uncomment to ignore a specific log level
  // log: jest.fn(),
  // debug: jest.fn(),
  // info: jest.fn(),
  // warn: jest.fn(),
  // error: jest.fn(),
};

// Mock setImmediate for Node.js compatibility
global.setImmediate = global.setImmediate || ((fn, ...args) => setTimeout(fn, 0, ...args));

// Cleanup after each test
afterEach(() => {
  // Clear all timers
  jest.clearAllTimers();
  
  // Clear all mocks
  jest.clearAllMocks();
  
  // Clear any pending promises
  if (global.gc) {
    global.gc();
  }
});

// Cleanup after all tests in a file
afterAll(() => {
  // Clear any remaining timers
  jest.clearAllTimers();
  
  // Force garbage collection if available
  if (global.gc) {
    global.gc();
  }
});
