# Todo Application v0.3

A full-stack web application demonstrating modern software engineering practices with incremental development and cloud deployment.

## 🚀 Current Version: v0.3 - JWT Authentication System

**v0.3 Features:**
- ✅ Express.js server with health check endpoint
- ✅ Basic middleware setup (CORS, JSON parsing, security headers)
- ✅ Environment configuration
- ✅ Error handling and graceful shutdown
- ✅ Security middleware (Helmet, CORS)
- ✅ Request logging and compression
- ✅ **PostgreSQL database connection with connection pooling**
- ✅ **User and Todo models with full CRUD operations**
- ✅ **Database migration system**
- ✅ **JWT authentication system**
- ✅ **User registration and login endpoints**
- ✅ **Password hashing with bcrypt**
- ✅ **Token refresh mechanism**
- ✅ **Protected Todo CRUD operations**
- ✅ **Comprehensive input validation**
- ✅ **Comprehensive logging with Winston**
- ✅ **Database error handling and validation**

## Architecture

### System Design
- **Frontend**: React SPA with Context API state management (v0.4+)
- **Backend**: RESTful API with Express.js and layered architecture
- **Database**: PostgreSQL (development) → AWS RDS MySQL (production)
- **Storage**: Local filesystem (development) → AWS S3 (production)
- **Deployment**: AWS EC2 with Nginx reverse proxy

### Technology Stack
| Layer | Technology | Purpose |
|-------|------------|---------|
| Frontend | React 18, Axios, Tailwind CSS | UI/UX and API communication (v0.4+) |
| Backend | Node.js, Express.js, JWT, Socket.io | API server, auth, real-time |
| Database | PostgreSQL (v0.x), MySQL (v1.0) | Data persistence (v0.2+) |
| Cache | Redis (v0.8+) | Session storage and caching |
| Storage | Local FS (v0.x), AWS S3 (v1.0) | File attachments (v0.6+) |
| Infrastructure | AWS EC2, RDS, S3 | Production hosting (v1.0) |

## 📋 Development Strategy

### Version Progression
```
v0.1 → v0.2 → v0.3 → v0.4 → v0.5 → v0.6 → v0.7 → v0.8 → v0.9 → v1.0
```

| Version | Scope | Database | Storage | Status |
|---------|-------|----------|---------|---------|
| v0.1 | Basic server + health check | - | - | ✅ COMPLETED |
| v0.2 | Database connection + models | PostgreSQL | - | ✅ COMPLETED |
| **v0.3** | **JWT authentication** | **PostgreSQL** | **-** | **✅ COMPLETED** |
| v0.4 | Todo CRUD + complete app | PostgreSQL | Local FS | 📋 Planned |
| v0.5 | Bug fixes + UX improvements | PostgreSQL | Local FS | 📋 Planned |
| v0.6 | Advanced features + file uploads | PostgreSQL | Local FS | 📋 Planned |
| v0.7 | Real-time updates + notifications | PostgreSQL | Local FS | 📋 Planned |
| v0.8 | Performance optimization + caching | PostgreSQL | Local FS | 📋 Planned |
| v0.9 | Security hardening + monitoring | PostgreSQL | Local FS | 📋 Planned |
| v1.0 | AWS migration + production | AWS RDS MySQL | AWS S3 | 📋 Planned |

### What's Included in v0.3

#### ✅ Completed Features
- **Express.js Server**: Basic HTTP server with proper middleware stack
- **Health Check Endpoint**: `/api/health` with database status monitoring
- **Security Middleware**: Helmet for security headers, CORS configuration
- **Request Processing**: JSON parsing, URL encoding, compression
- **Error Handling**: Global error handler with proper HTTP status codes
- **Logging**: Comprehensive logging with Winston (console + file)
- **Environment Configuration**: Environment variable support
- **Graceful Shutdown**: Proper process termination handling
- **PostgreSQL Database**: Connection with connection pooling
- **User Model**: Full CRUD operations with password hashing
- **Todo Model**: Full CRUD operations with filtering and search
- **Migration System**: Database schema management
- **Database Error Handling**: Comprehensive error handling and logging
- **JWT Authentication**: Token-based authentication system
- **User Registration**: User signup with validation
- **User Login**: Authentication with JWT token generation
- **Password Security**: bcrypt hashing with configurable salt rounds
- **Token Refresh**: Refresh token mechanism for extended sessions
- **Protected Routes**: Authentication middleware for protected endpoints
- **Todo CRUD with Auth**: Full Todo operations with user authentication
- **Input Validation**: Comprehensive validation for all endpoints
- **Profile Management**: User profile CRUD operations

#### 🔧 Technical Implementation
- **Database Connection Pool**: 20 max connections with proper timeout handling
- **Model Architecture**: Clean separation with proper error handling
- **Password Security**: bcrypt hashing with configurable salt rounds
- **Query Logging**: Performance monitoring and debugging
- **Connection Management**: Graceful connection handling and cleanup
- **Schema Management**: Automated migration system

### What's Coming in v0.4

#### 📋 Planned Features
- **React Frontend**: Complete user interface with authentication
- **Todo Management UI**: Full CRUD interface for todos
- **Authentication Flow**: Login/register forms with token management
- **Protected Routes**: Middleware for route protection
- **Password Security**: Enhanced password validation and security

#### 🎯 Success Criteria for v0.4
- Complete React frontend with authentication flow
- Todo management interface with full CRUD operations
- Responsive design for mobile and desktop
- Real-time updates and state management
- Error handling and user feedback

### Project Structure
```
todo-app/
├── backend/                 # Express.js API server
│   ├── src/
│   │   ├── config/         # Database and app configuration
│   │   ├── controllers/    # Request handlers
│   │   ├── middleware/     # Authentication and validation
│   │   ├── models/         # Data access layer
│   │   ├── routes/         # API endpoint definitions
│   │   ├── services/       # Business logic layer
│   │   └── utils/          # Helper functions
│   ├── package.json        # Dependencies and scripts
│   └── server.js           # Application entry point
├── frontend/               # React single-page application
│   ├── src/
│   │   ├── components/     # Reusable UI components
│   │   ├── pages/          # Route-level components
│   │   ├── hooks/          # Custom React hooks
│   │   ├── context/        # Global state management
│   │   ├── services/       # API client layer
│   │   ├── utils/          # Helper functions
│   │   └── styles/         # CSS and styling
│   └── package.json        # Dependencies and scripts
├── database/               # Database schema and migrations
│   ├── migrations/         # Version-controlled schema changes
│   ├── schemas/            # Database design documents
│   └── seeds/              # Test data
├── tests/                  # Integration and E2E tests
│   ├── unit/               # Unit tests
│   ├── integration/        # API integration tests
│   ├── smoke/              # Critical path tests
│   └── edge/               # Edge case and error tests
└── scripts/                # Development and deployment automation
```

## API Specification (v0.3)

### Available Endpoints (v0.3)

#### Authentication Endpoints
```http
POST /api/auth/register
Content-Type: application/json

{
  "username": "string (3-30 chars, alphanumeric + underscore)",
  "email": "string (valid email)",
  "password": "string (min 8 chars, 1 uppercase, 1 lowercase, 1 number)"
}

Response:
{
  "success": true,
  "message": "User registered successfully",
  "data": {
    "user": { "id": 1, "username": "testuser", "email": "test@example.com" },
    "token": "jwt_access_token",
    "refreshToken": "jwt_refresh_token"
  }
}
```

```http
POST /api/auth/login
Content-Type: application/json

{
  "email": "string (valid email)",
  "password": "string"
}

Response:
{
  "success": true,
  "message": "Login successful",
  "data": {
    "user": { "id": 1, "username": "testuser", "email": "test@example.com" },
    "token": "jwt_access_token",
    "refreshToken": "jwt_refresh_token"
  }
}
```

```http
GET /api/auth/profile
Authorization: Bearer <jwt_token>

Response:
{
  "success": true,
  "data": {
    "user": { "id": 1, "username": "testuser", "email": "test@example.com" }
  }
}
```

```http
PUT /api/auth/profile
Authorization: Bearer <jwt_token>
Content-Type: application/json

{
  "username": "newusername",
  "email": "newemail@example.com"
}
```

```http
POST /api/auth/refresh
Content-Type: application/json

{
  "refreshToken": "jwt_refresh_token"
}

Response:
{
  "success": true,
  "message": "Token refreshed successfully",
  "data": {
    "token": "new_jwt_access_token",
    "refreshToken": "new_jwt_refresh_token"
  }
}
```

```http
POST /api/auth/logout
Authorization: Bearer <jwt_token>

Response:
{
  "success": true,
  "message": "Logged out successfully"
}
```

#### Todo Endpoints (Protected)
```http
GET /api/todos?completed=true&priority=high&category=work&limit=50&offset=0&orderBy=created_at&orderDirection=DESC
Authorization: Bearer <jwt_token>

Response:
{
  "success": true,
  "data": {
    "todos": [
      {
        "id": 1,
        "title": "Test Todo",
        "description": "This is a test todo",
        "priority": "high",
        "due_date": "2024-01-01T00:00:00.000Z",
        "category": "work",
        "completed": false,
        "created_at": "2024-01-01T00:00:00.000Z",
        "updated_at": "2024-01-01T00:00:00.000Z"
      }
    ],
    "pagination": {
      "total": 1,
      "limit": 50,
      "offset": 0,
      "hasMore": false
    }
  }
}
```

```http
GET /api/todos/:id
Authorization: Bearer <jwt_token>

Response:
{
  "success": true,
  "data": {
    "todo": { /* todo object */ }
  }
}
```

```http
POST /api/todos
Authorization: Bearer <jwt_token>
Content-Type: application/json

{
  "title": "string (1-200 chars)",
  "description": "string (max 1000 chars, optional)",
  "priority": "low|medium|high (optional, default: medium)",
  "due_date": "ISO 8601 date (optional, future dates only)",
  "category": "string (max 50 chars, optional)"
}

Response:
{
  "success": true,
  "message": "Todo created successfully",
  "data": {
    "todo": { /* created todo object */ }
  }
}
```

```http
PUT /api/todos/:id
Authorization: Bearer <jwt_token>
Content-Type: application/json

{
  "title": "string (1-200 chars, optional)",
  "description": "string (max 1000 chars, optional)",
  "priority": "low|medium|high (optional)",
  "due_date": "ISO 8601 date (optional)",
  "category": "string (max 50 chars, optional)",
  "completed": "boolean (optional)"
}

Response:
{
  "success": true,
  "message": "Todo updated successfully",
  "data": {
    "todo": { /* updated todo object */ }
  }
}
```

```http
PATCH /api/todos/:id/toggle
Authorization: Bearer <jwt_token>

Response:
{
  "success": true,
  "message": "Todo completion status updated",
  "data": {
    "todo": { /* updated todo object with toggled completion */ }
  }
}
```

```http
DELETE /api/todos/:id
Authorization: Bearer <jwt_token>

Response:
{
  "success": true,
  "message": "Todo deleted successfully"
}
```

```http
POST /api/todos/search
Authorization: Bearer <jwt_token>
Content-Type: application/json

{
  "query": "string (1-100 chars)",
  "limit": "number (1-100, optional, default: 50)",
  "offset": "number (>=0, optional, default: 0)"
}

Response:
{
  "success": true,
  "data": {
    "todos": [ /* matching todo objects */ ],
    "query": "search query",
    "pagination": {
      "limit": 50,
      "offset": 0,
      "hasMore": false
    }
  }
}
```

```http
POST /api/todos/bulk
Authorization: Bearer <jwt_token>
Content-Type: application/json

{
  "todoIds": [1, 2, 3],
  "operation": "delete|complete|uncomplete|update",
  "updateData": { /* fields to update for 'update' operation */ }
}

Response:
{
  "success": true,
  "message": "Bulk operation completed successfully",
  "data": {
    "operation": "delete",
    "affectedCount": 3,
    "todoIds": [1, 2, 3]
  }
}
```

```http
GET /api/todos/stats
Authorization: Bearer <jwt_token>

Response:
{
  "success": true,
  "data": {
    "stats": {
      "total": 10,
      "completed": 3,
      "pending": 7,
      "high_priority": 2,
      "overdue": 1
    }
  }
}
```

#### Health Check
```http
GET /api/health

Response:
{
  "success": true,
  "status": "OK",
  "timestamp": "2024-01-01T00:00:00.000Z",
  "environment": "development",
  "version": "0.3.0",
  "uptime": 123.456,
  "database": {
    "connected": true,
    "status": "healthy"
  }
}
```

### Error Responses
All endpoints return consistent error responses:

```json
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "Human readable error message",
    "details": [] // Additional error details for validation errors
  },
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

### Common Error Codes
- `VALIDATION_ERROR`: Input validation failed
- `NO_TOKEN`: No authentication token provided
- `INVALID_TOKEN`: Invalid or expired token
- `TOKEN_EXPIRED`: Token has expired
- `USER_EXISTS`: User with email already exists
- `USERNAME_EXISTS`: Username already taken
- `INVALID_CREDENTIALS`: Invalid email or password
- `TODO_NOT_FOUND`: Todo not found
- `ACCESS_DENIED`: User doesn't have permission
- `AUTH_ERROR`: Authentication error
- `FETCH_ERROR`: Error fetching data
- `CREATE_ERROR`: Error creating resource
- `UPDATE_ERROR`: Error updating resource
- `DELETE_ERROR`: Error deleting resource

## Legacy API Specification

### Authentication Endpoints
```http
POST /api/auth/register
Content-Type: application/json

{
  "username": "string",
  "email": "string",
  "password": "string"
}
```

```http
POST /api/auth/login
Content-Type: application/json

{
  "email": "string",
  "password": "string"
}
```

### Todo Endpoints
```http
GET /api/todos
Authorization: Bearer <jwt_token>

POST /api/todos
Authorization: Bearer <jwt_token>
Content-Type: application/json

{
  "title": "string",
  "description": "string",
  "priority": "low|medium|high",
  "dueDate": "ISO 8601 date",
  "category": "string"
}

PUT /api/todos/bulk
Authorization: Bearer <jwt_token>
Content-Type: application/json

{
  "action": "delete|complete|update",
  "todoIds": ["id1", "id2", "id3"],
  "data": {}
}

GET /api/todos/export?format=csv|json
Authorization: Bearer <jwt_token>
```

### File Upload Endpoints
```http
POST /api/todos/:id/attachments
Authorization: Bearer <jwt_token>
Content-Type: multipart/form-data

{
  "file": "binary data"
}

DELETE /api/todos/:id/attachments/:attachmentId
Authorization: Bearer <jwt_token>
```

### Notification Endpoints
```http
GET /api/notifications
Authorization: Bearer <jwt_token>

PUT /api/notifications/preferences
Authorization: Bearer <jwt_token>
Content-Type: application/json

{
  "emailNotifications": true,
  "pushNotifications": true,
  "dueDateReminders": true
}
```

## Database Schema

### Users Table
```sql
CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  username VARCHAR(50) UNIQUE NOT NULL,
  email VARCHAR(100) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### Todos Table
```sql
CREATE TABLE todos (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  priority VARCHAR(10) CHECK (priority IN ('low', 'medium', 'high')) DEFAULT 'medium',
  due_date TIMESTAMP,
  category VARCHAR(50),
  completed BOOLEAN DEFAULT FALSE,
  position INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### File Attachments Table
```sql
CREATE TABLE file_attachments (
  id SERIAL PRIMARY KEY,
  todo_id INTEGER NOT NULL REFERENCES todos(id) ON DELETE CASCADE,
  file_name VARCHAR(255) NOT NULL,
  file_size INTEGER NOT NULL,
  file_type VARCHAR(100) NOT NULL,
  file_path VARCHAR(500) NOT NULL,
  thumbnail_path VARCHAR(500),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### Notifications Table
```sql
CREATE TABLE notifications (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  type VARCHAR(50) NOT NULL,
  title VARCHAR(255) NOT NULL,
  message TEXT NOT NULL,
  read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### User Preferences Table
```sql
CREATE TABLE user_preferences (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  email_notifications BOOLEAN DEFAULT TRUE,
  push_notifications BOOLEAN DEFAULT TRUE,
  due_date_reminders BOOLEAN DEFAULT TRUE,
  theme VARCHAR(20) DEFAULT 'light',
  language VARCHAR(10) DEFAULT 'en',
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

## 🛠️ v0.3 Setup & Installation

### Prerequisites
- Node.js ≥ 16.0.0
- npm ≥ 8.0.0
- PostgreSQL ≥ 12.0

### Quick Start (v0.3)

#### 1. Clone and Setup
```bash
# Clone the repository
git clone <repository-url>
cd todo_app_AWS/groupproject

# Navigate to backend
cd backend
```

#### 2. Database Setup
```bash
# Install PostgreSQL (if not already installed)
# macOS with Homebrew:
brew install postgresql@14
brew services start postgresql@14

# Create database
createdb todo_app
```

#### 3. Install Dependencies
```bash
# Install all required packages
npm install
```

#### 4. Environment Configuration
```bash
# Copy environment template
cp env.example .env

# Edit .env file with your configuration
nano .env
```

**Required .env variables for v0.3:**
```bash
# Environment Configuration
NODE_ENV=development
PORT=5000

# Database Configuration
DB_HOST=localhost
DB_PORT=5432
DB_NAME=todo_app
DB_USER=your_username
DB_PASSWORD=your_password

# CORS Configuration
CORS_ORIGIN=http://localhost:3000

# Logging Configuration
LOG_LEVEL=info

# Security Configuration
BCRYPT_ROUNDS=12

# JWT Configuration (v0.3+)
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
JWT_EXPIRE=24h
JWT_REFRESH_SECRET=your-refresh-secret-key
JWT_REFRESH_EXPIRE=7d
```

#### 5. Run Database Migrations
```bash
# Run database migrations to create tables
node ../database/migrate.js
```

#### 6. Start the Server
```bash
# Development mode with auto-restart
npm run dev

# Or production mode
npm start
```

#### 7. Verify Installation
```bash
# Test health endpoint with database status
curl http://localhost:5000/api/health

# Expected response:
{
  "success": true,
  "status": "OK",
  "timestamp": "2024-01-01T00:00:00.000Z",
  "environment": "development",
  "version": "0.3.0",
  "uptime": 123.456,
  "database": {
    "connected": true,
    "status": "healthy"
  }
}
```

### Available Endpoints (v0.3)

| Method | Endpoint | Description | Response |
|--------|----------|-------------|----------|
| GET | `/` | API information | API details and available endpoints |
| GET | `/api/health` | Health check | Server status, uptime, and database status |
| POST | `/api/auth/register` | User registration | User data and JWT tokens |
| POST | `/api/auth/login` | User login | User data and JWT tokens |
| GET | `/api/auth/profile` | Get user profile | User profile data |
| PUT | `/api/auth/profile` | Update user profile | Updated user profile |
| POST | `/api/auth/refresh` | Refresh JWT token | New JWT tokens |
| POST | `/api/auth/logout` | User logout | Success message |
| GET | `/api/todos` | Get user todos | List of todos with pagination |
| POST | `/api/todos` | Create todo | Created todo data |
| GET | `/api/todos/:id` | Get specific todo | Todo data |
| PUT | `/api/todos/:id` | Update todo | Updated todo data |
| PATCH | `/api/todos/:id/toggle` | Toggle todo completion | Updated todo data |
| DELETE | `/api/todos/:id` | Delete todo | Success message |
| POST | `/api/todos/search` | Search todos | Matching todos |
| POST | `/api/todos/bulk` | Bulk operations | Operation results |
| GET | `/api/todos/stats` | Get todo statistics | Statistics data |

### Development Commands

```bash
# Start development server with auto-restart
npm run dev

# Start production server
npm start

# Run linting
npm run lint

# Fix linting issues
npm run lint:fix

# Run tests (when implemented)
npm test
```

### Troubleshooting

#### Port Already in Use
```bash
# If port 5000 is already in use, set a different port
PORT=5001 npm start
```

#### Permission Issues
```bash
# On Unix systems, you might need to use sudo for port 80/443
sudo PORT=80 npm start
```

#### Environment Variables Not Loading
```bash
# Ensure .env file is in the backend directory
ls -la backend/.env

# Check if dotenv is properly configured
node -e "require('dotenv').config(); console.log(process.env.PORT)"
```

## Future Development Setup

### Prerequisites (v0.3+)
- Node.js ≥ 16.0.0
- PostgreSQL ≥ 12.0 (v0.3+)
- npm ≥ 8.0.0

### Local Development (v0.3+)
```bash
# 1. Database setup (v0.3+)
createdb todo_app

# 2. Backend setup
cd backend
npm install
cp env.example .env
# Configure .env with database credentials
npm run migrate
npm run dev

# 3. Frontend setup (v0.4+)
cd frontend
npm install
cp env.example .env
npm start
```

### Environment Configuration
```bash
# Backend (.env)
PORT=5000
NODE_ENV=development
DB_HOST=localhost
DB_PORT=5432
DB_NAME=todo_app
DB_USER=postgres
DB_PASSWORD=your_password
JWT_SECRET=your_jwt_secret
JWT_EXPIRES_IN=24h

# Frontend (.env)
REACT_APP_API_URL=http://localhost:5000/api
```

## Testing Strategy

### Test Pyramid
```
    /\
   /  \     E2E Tests (Cypress)
  /____\    
 /      \   Integration Tests (Supertest)
/________\  
/          \ Unit Tests (Jest)
/__________\
```

### Coverage Targets
- **Unit Tests**: 90%+ code coverage
- **Integration Tests**: All API endpoints
- **E2E Tests**: Critical user journeys
- **Smoke Tests**: Health checks and basic functionality

### Test Commands
```bash
# Backend tests
cd backend && npm test

# Frontend tests
cd frontend && npm test

# Integration tests
npm run test:integration

# E2E tests
npm run test:e2e
```

## 🚀 Deployment

### v0.3 Local Deployment

#### Development Deployment
```bash
# 1. Install dependencies
cd backend
npm install

# 2. Configure environment
cp env.example .env
# Edit .env with your settings

# 3. Start server
npm run dev
```

#### Production-like Deployment
```bash
# 1. Install production dependencies only
npm ci --only=production

# 2. Set production environment
export NODE_ENV=production
export PORT=5000

# 3. Start server
npm start
```

#### Using PM2 (Process Manager)
```bash
# Install PM2 globally
npm install -g pm2

# Start with PM2
pm2 start server.js --name "todo-app-v0.1"

# Monitor
pm2 monit

# Stop
pm2 stop todo-app-v0.1
```

#### Docker Deployment (Optional)
```dockerfile
# Dockerfile for v0.3
FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --only=production

COPY . .

EXPOSE 5000

CMD ["npm", "start"]
```

```bash
# Build and run Docker container
docker build -t todo-app-v0.1 .
docker run -p 5000:5000 --env-file .env todo-app-v0.1
```

### Future Production Architecture (v1.0+)
```
Internet → Nginx → Express.js → PostgreSQL
                ↓
            React SPA (S3)
```

### Future AWS Resources (v1.0+)
- **EC2**: t2.micro instance for API server
- **RDS**: db.t3.micro MySQL instance
- **S3**: Static website hosting for React app
- **IAM**: Roles and policies for secure access

### Future Deployment Pipeline (v1.0+)
```bash
# 1. Build and test
npm run build
npm run test

# 2. Deploy backend
./scripts/deploy-backend.sh

# 3. Deploy frontend
./scripts/deploy-frontend.sh
```

## Security

### Authentication
- JWT tokens with 24-hour expiration
- Password hashing with bcrypt (12 rounds)
- Protected routes with middleware

### Data Protection
- Input validation and sanitization
- SQL injection prevention with parameterized queries
- CORS configuration for production
- Rate limiting on API endpoints

### Infrastructure Security
- HTTPS enforcement
- Security headers via Nginx
- Environment variable protection
- Database connection encryption

## Performance

### Backend Optimization
- Connection pooling for database
- Response compression
- Caching strategies
- Query optimization

### Frontend Optimization
- Code splitting and lazy loading
- Bundle size optimization
- Image optimization
- CDN for static assets

### Monitoring
- Application performance monitoring
- Database query performance
- Error tracking and logging
- Uptime monitoring

## Contributing

### Development Workflow
1. Create feature branch from `main`
2. Implement changes with tests
3. Run test suite and linting
4. Submit pull request for review
5. Merge after approval

### Code Standards
- ESLint configuration for JavaScript
- Prettier for code formatting
- Conventional commits for version control
- Comprehensive test coverage

## License

MIT License - see [LICENSE](LICENSE) file for details.