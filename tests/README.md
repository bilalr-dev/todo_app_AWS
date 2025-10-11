# Testing Documentation

This directory contains all test files for the Todo App.

## 📁 **Directory Structure**

```
tests/
├── unit/               # Unit tests
├── integration/        # Integration tests
├── smoke/              # Smoke tests
├── edge/               # Edge case tests
├── utils/              # Test utilities
└── README.md           # This file
```

## 🧪 **Testing Strategy**

### **Unit Tests**
- Test individual functions and components
- Mock external dependencies
- Fast execution
- High coverage

### **Integration Tests**
- Test API endpoints
- Test database operations
- Test component interactions
- End-to-end workflows

### **Smoke Tests**
- Critical user flows
- Basic functionality
- Quick validation
- Production readiness

### **Edge Case Tests**
- Boundary conditions
- Error scenarios
- Unusual inputs
- Stress testing

## 🛠️ **Testing Tools**

### **Backend Testing**
- **Jest** - Test framework
- **Supertest** - HTTP assertions
- **pg** - PostgreSQL database testing

### **Frontend Testing**
- **Jest** - Test framework
- **React Testing Library** - Component testing
- **Axios Mock** - API mocking

## 📊 **Coverage Goals**

- **Backend**: 90%+ code coverage
- **Frontend**: 85%+ component coverage
- **Critical Paths**: 100% test coverage

## 🚀 **Running Tests**

```bash
# Run all tests
npm test

# Run backend tests
cd backend && npm test

# Run frontend tests
cd frontend && npm test

# Run with coverage
npm run test:coverage
```

## 📋 **Test Categories**

### **Unit Tests**
- Model functions
- Service methods
- Utility functions
- React components
- Custom hooks

### **Integration Tests**
- API endpoints
- Database operations
- Authentication flow
- File upload process

### **Smoke Tests**
- User registration
- User login
- Todo CRUD operations
- File upload/download

### **Edge Case Tests**
- Invalid inputs
- Network failures
- Database errors
- Large file uploads