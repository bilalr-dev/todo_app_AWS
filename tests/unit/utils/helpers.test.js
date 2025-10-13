// Unit tests for utility helper functions
const {
  formatDate,
  formatDateTime,
  formatRelativeTime,
  getTodayInUserTimezone,
  isToday,
  isTomorrow,
  isOverdue,
  isThisWeek,
  truncateText,
  capitalizeFirst,
  capitalizeWords,
  slugify,
  groupBy,
  sortBy,
  uniqueBy,
  pick,
  omit,
  isEmpty,
  isValidEmail,
  isValidPassword,
  isValidUrl,
  debounce,
  throttle,
  generateId,
  generateRandomString,
  getPriorityColor,
  getStatusColor,
  formatFileSize,
  getFileExtension,
  getErrorMessage,
  buildQueryString,
  parseQueryString,
  cn
} = require('../../../frontend/src/utils/helpers');

describe('Helper Functions', () => {
  // Date formatting tests
  describe('Date Formatting', () => {
    test('formatDate formats date correctly', () => {
      const date = new Date('2023-12-25T10:30:00Z');
      const result = formatDate(date);
      expect(result).toMatch(/Dec 25, 2023/);
    });

    test('formatDate handles invalid date', () => {
      expect(formatDate('invalid')).toBe('Invalid Date');
      expect(formatDate(null)).toBe('');
      expect(formatDate(undefined)).toBe('');
    });

    test('formatDateTime formats date and time correctly', () => {
      const date = new Date('2023-12-25T10:30:00Z');
      const result = formatDateTime(date);
      expect(result).toMatch(/Dec 25, 2023/);
    });

    test('formatRelativeTime shows relative time', () => {
      const now = new Date();
      const result = formatRelativeTime(now);
      expect(result).toBe('Just now');
    });

    test('getTodayInUserTimezone returns today in YYYY-MM-DD format', () => {
      const today = getTodayInUserTimezone();
      expect(today).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    });

    test('isToday correctly identifies today', () => {
      const today = new Date();
      expect(isToday(today)).toBe(true);
      
      const yesterday = new Date(today.getTime() - 24 * 60 * 60 * 1000);
      expect(isToday(yesterday)).toBe(false);
    });

    test('isTomorrow correctly identifies tomorrow', () => {
      const tomorrow = new Date(Date.now() + 24 * 60 * 60 * 1000);
      expect(isTomorrow(tomorrow)).toBe(true);
      
      const today = new Date();
      expect(isTomorrow(today)).toBe(false);
    });

    test('isOverdue correctly identifies overdue dates', () => {
      const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000);
      expect(isOverdue(yesterday)).toBe(true);
      
      const tomorrow = new Date(Date.now() + 24 * 60 * 60 * 1000);
      expect(isOverdue(tomorrow)).toBe(false);
    });
  });

  // Text utilities
  describe('Text Utilities', () => {
    test('truncateText truncates long text', () => {
      const longText = 'This is a very long text that should be truncated';
      const result = truncateText(longText, 20);
      expect(result).toBe('This is a very long ...');
    });

    test('capitalizeFirst capitalizes first letter', () => {
      expect(capitalizeFirst('hello')).toBe('Hello');
      expect(capitalizeFirst('HELLO')).toBe('HELLO');
    });

    test('capitalizeWords capitalizes all words', () => {
      expect(capitalizeWords('hello world')).toBe('Hello World');
      expect(capitalizeWords('hello WORLD')).toBe('Hello World');
    });

    test('slugify creates URL-friendly slugs', () => {
      expect(slugify('Hello World!')).toBe('hello-world');
      expect(slugify('Test & Test')).toBe('test-test');
    });
  });

  // Array utilities
  describe('Array Utilities', () => {
    const testArray = [
      { id: 1, name: 'John', category: 'A' },
      { id: 2, name: 'Jane', category: 'B' },
      { id: 3, name: 'Bob', category: 'A' }
    ];

    test('groupBy groups array by key', () => {
      const result = groupBy(testArray, 'category');
      expect(result.A).toHaveLength(2);
      expect(result.B).toHaveLength(1);
    });

    test('sortBy sorts array by key', () => {
      const result = sortBy(testArray, 'name');
      expect(result[0].name).toBe('Bob');
      expect(result[1].name).toBe('Jane');
      expect(result[2].name).toBe('John');
    });

    test('uniqueBy removes duplicates by key', () => {
      const duplicates = [
        { id: 1, name: 'John' },
        { id: 1, name: 'John' },
        { id: 2, name: 'Jane' }
      ];
      const result = uniqueBy(duplicates, 'id');
      expect(result).toHaveLength(2);
    });
  });

  // Object utilities
  describe('Object Utilities', () => {
    const testObj = { a: 1, b: 2, c: 3 };

    test('pick selects specific keys', () => {
      const result = pick(testObj, ['a', 'c']);
      expect(result).toEqual({ a: 1, c: 3 });
    });

    test('omit excludes specific keys', () => {
      const result = omit(testObj, ['b']);
      expect(result).toEqual({ a: 1, c: 3 });
    });

    test('isEmpty checks if value is empty', () => {
      expect(isEmpty('')).toBe(true);
      expect(isEmpty([])).toBe(true);
      expect(isEmpty({})).toBe(true);
      expect(isEmpty(null)).toBe(true);
      expect(isEmpty('hello')).toBe(false);
      expect(isEmpty([1])).toBe(false);
    });
  });

  // Validation utilities
  describe('Validation Utilities', () => {
    test('isValidEmail validates email addresses', () => {
      expect(isValidEmail('test@example.com')).toBe(true);
      expect(isValidEmail('invalid-email')).toBe(false);
      expect(isValidEmail('')).toBe(false);
    });

    test('isValidPassword validates passwords', () => {
      expect(isValidPassword('Password123')).toBe(true);
      expect(isValidPassword('short')).toBe(false);
      expect(isValidPassword('')).toBe(false);
    });

    test('isValidUrl validates URLs', () => {
      expect(isValidUrl('https://example.com')).toBe(true);
      expect(isValidUrl('http://example.com')).toBe(true);
      expect(isValidUrl('invalid-url')).toBe(false);
    });
  });

  // Utility functions
  describe('Utility Functions', () => {
    test('debounce delays function execution', (done) => {
      let callCount = 0;
      const debouncedFn = debounce(() => {
        callCount++;
      }, 100);

      debouncedFn();
      debouncedFn();
      debouncedFn();

      setTimeout(() => {
        expect(callCount).toBe(1);
        done();
      }, 150);
    });

    test('throttle limits function execution', (done) => {
      let callCount = 0;
      const throttledFn = throttle(() => {
        callCount++;
      }, 100);

      throttledFn();
      throttledFn();
      throttledFn();

      setTimeout(() => {
        expect(callCount).toBe(1);
        done();
      }, 50);
    });

    test('generateId generates unique IDs', () => {
      const id1 = generateId();
      const id2 = generateId();
      expect(id1).not.toBe(id2);
      expect(typeof id1).toBe('string');
    });

    test('generateRandomString generates random strings', () => {
      const str1 = generateRandomString(10);
      const str2 = generateRandomString(10);
      expect(str1).toHaveLength(10);
      expect(str2).toHaveLength(10);
      expect(str1).not.toBe(str2);
    });
  });

  // Color utilities
  describe('Color Utilities', () => {
    test('getPriorityColor returns correct colors', () => {
      expect(getPriorityColor('high')).toContain('text-red-600');
      expect(getPriorityColor('medium')).toContain('text-yellow-600');
      expect(getPriorityColor('low')).toContain('text-green-600');
    });

    test('getStatusColor returns correct colors', () => {
      expect(getStatusColor('completed')).toContain('text-green-600');
      expect(getStatusColor('pending')).toContain('text-yellow-600');
      expect(getStatusColor('overdue')).toContain('text-red-600');
    });
  });

  // File utilities
  describe('File Utilities', () => {
    test('formatFileSize formats file sizes', () => {
      expect(formatFileSize(1024)).toBe('1 KB');
      expect(formatFileSize(1048576)).toBe('1 MB');
      expect(formatFileSize(0)).toBe('0 Bytes');
    });

    test('getFileExtension extracts file extensions', () => {
      expect(getFileExtension('file.txt')).toBe('txt');
      expect(getFileExtension('image.jpg')).toBe('jpg');
      expect(getFileExtension('noextension')).toBe('');
    });
  });

  // Error handling
  describe('Error Handling', () => {
    test('getErrorMessage extracts error messages', () => {
      const error = new Error('Test error');
      expect(getErrorMessage(error)).toBe('Test error');
      
      const objError = { message: 'Object error' };
      expect(getErrorMessage(objError)).toBe('Object error');
      
      expect(getErrorMessage('String error')).toBe('String error');
      expect(getErrorMessage(null)).toBe('An unexpected error occurred');
    });
  });

  // Query string utilities
  describe('Query String Utilities', () => {
    test('buildQueryString builds query strings', () => {
      const params = { name: 'John', age: 30 };
      const result = buildQueryString(params);
      expect(result).toContain('name=John');
      expect(result).toContain('age=30');
    });

    test('parseQueryString parses query strings', () => {
      const queryString = 'name=John&age=30';
      const result = parseQueryString(queryString);
      expect(result.name).toBe('John');
      expect(result.age).toBe('30');
    });
  });

  // CSS utilities
  describe('CSS Utilities', () => {
    test('cn merges Tailwind classes', () => {
      const result = cn('text-red-500', 'text-blue-500');
      expect(result).toBe('text-blue-500');
    });

    test('cn handles conditional classes', () => {
      const result = cn('base-class', { 'conditional-class': true });
      expect(result).toContain('base-class');
      expect(result).toContain('conditional-class');
    });
  });
});