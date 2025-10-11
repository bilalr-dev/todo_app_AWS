# Contributing to Todo Application

Thank you for your interest in contributing to the Todo Application! This document provides guidelines and information for contributors.

## 🚀 **Getting Started**

### **Prerequisites**
- Node.js (v16 or higher)
- PostgreSQL (v12 or higher)
- Git
- npm or yarn

### **Development Setup**

1. **Fork and clone the repository**
   ```bash
   git clone https://github.com/bilalr-dev/todo_app_AWS.git
   cd todo_app_AWS
   ```

2. **Install dependencies**
   ```bash
   # Backend
   cd backend
   npm install
   
   # Frontend
   cd ../frontend
   npm install
   ```

3. **Set up the database**
   ```bash
   createdb todo_app
   cd ../database
   node migrate.js
   ```

4. **Configure environment variables**
   ```bash
   # Backend
   cd ../backend
   cp env.example .env
   # Edit .env with your database credentials
   
   # Frontend
   cd ../frontend
   cp env.example .env
   # Edit .env with your API URL
   ```

## 📋 **Development Guidelines**

### **Code Style**
- Use ESLint and Prettier for code formatting
- Follow the existing code style and conventions
- Write meaningful commit messages
- Add comments for complex logic

### **Testing**
- Write tests for new features
- Ensure all tests pass before submitting
- Maintain or improve test coverage

### **Documentation**
- Update documentation for new features
- Add JSDoc comments for functions
- Update README if needed

## 🔄 **Pull Request Process**

1. **Create a feature branch**
   ```bash
   git checkout -b feature/your-feature-name
   ```

2. **Make your changes**
   - Write clean, well-documented code
   - Add tests for new functionality
   - Update documentation as needed

3. **Test your changes**
   ```bash
   # Backend tests
   cd backend
   npm test
   
   # Frontend tests
   cd ../frontend
   npm test
   ```

4. **Commit your changes**
   ```bash
   git add .
   git commit -m "Add: brief description of changes"
   ```

5. **Push to your fork**
   ```bash
   git push origin feature/your-feature-name
   ```

6. **Create a Pull Request**
   - Provide a clear description of changes
   - Reference any related issues
   - Add screenshots for UI changes

## 🐛 **Reporting Issues**

When reporting issues, please include:

- **Description**: Clear description of the issue
- **Steps to reproduce**: Detailed steps to reproduce the bug
- **Expected behavior**: What you expected to happen
- **Actual behavior**: What actually happened
- **Environment**: OS, Node.js version, browser version
- **Screenshots**: If applicable

## ✨ **Feature Requests**

For feature requests, please:

- Check existing issues first
- Provide a clear description of the feature
- Explain the use case and benefits
- Consider implementation complexity

## 📝 **Commit Message Format**

Use the following format for commit messages:

```
type: brief description

Longer description if needed

- Bullet point for changes
- Another bullet point

Closes #issue-number
```

**Types:**
- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation changes
- `style`: Code style changes
- `refactor`: Code refactoring
- `test`: Adding or updating tests
- `chore`: Maintenance tasks

## 🏗️ **Project Structure**

```
todo-app/
├── backend/          # Express.js API server
├── frontend/         # React application
├── database/         # Database migrations
├── scripts/          # Development scripts
├── docs/             # Documentation
└── tests/            # Test files
```

## 🧪 **Testing Guidelines**

### **Backend Testing**
- Unit tests for models and utilities
- Integration tests for API endpoints
- Test authentication and authorization
- Test error handling

### **Frontend Testing**
- Component unit tests
- Integration tests for user flows
- Test responsive design
- Test accessibility

## 🔒 **Security Guidelines**

- Never commit sensitive information (passwords, API keys)
- Use environment variables for configuration
- Validate all user inputs
- Follow security best practices

## 📚 **Resources**

- [React Documentation](https://reactjs.org/docs)
- [Express.js Documentation](https://expressjs.com/)
- [PostgreSQL Documentation](https://www.postgresql.org/docs/)
- [JWT Documentation](https://jwt.io/introduction)

## 🤝 **Code of Conduct**

Please be respectful and constructive in all interactions. We welcome contributors from all backgrounds and experience levels.

## 📞 **Getting Help**

- Create an issue in the [GitHub repository](https://github.com/bilalr-dev/todo_app_AWS/issues)
- Join our community discussions
- Check existing documentation

Thank you for contributing to the Todo Application! 🎉
