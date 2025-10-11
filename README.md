# Todo Application v0.1

A full-stack web application demonstrating modern software engineering practices with incremental development and cloud deployment.

## 🚀 Current Version: v0.1 - Basic Server Infrastructure

**v0.1 Features:**
- ✅ Express.js server with health check endpoint
- ✅ Basic middleware setup (CORS, JSON parsing, security headers)
- ✅ Environment configuration
- ✅ Error handling and graceful shutdown
- ✅ Security middleware (Helmet, CORS)
- ✅ Request logging and compression

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
| **v0.1** | **Basic server + health check** | **-** | **-** | **✅ COMPLETED** |
| v0.2 | Database connection + models | PostgreSQL | - | 🔄 Next |
| v0.3 | JWT authentication | PostgreSQL | - | 📋 Planned |
| v0.4 | Todo CRUD + complete app | PostgreSQL | Local FS | 📋 Planned |
| v0.5 | Bug fixes + UX improvements | PostgreSQL | Local FS | 📋 Planned |
| v0.6 | Advanced features + file uploads | PostgreSQL | Local FS | 📋 Planned |
| v0.7 | Real-time updates + notifications | PostgreSQL | Local FS | 📋 Planned |
| v0.8 | Performance optimization + caching | PostgreSQL | Local FS | 📋 Planned |
| v0.9 | Security hardening + monitoring | PostgreSQL | Local FS | 📋 Planned |
| v1.0 | AWS migration + production | AWS RDS MySQL | AWS S3 | 📋 Planned |

### What's Included in v0.1

#### ✅ Completed Features
- **Express.js Server**: Basic HTTP server with proper middleware stack
- **Health Check Endpoint**: `/api/health` for monitoring server status
- **Security Middleware**: Helmet for security headers, CORS configuration
- **Request Processing**: JSON parsing, URL encoding, compression
- **Error Handling**: Global error handler with proper HTTP status codes
- **Logging**: Request logging with Morgan
- **Environment Configuration**: Environment variable support
- **Graceful Shutdown**: Proper process termination handling

#### 🔧 Technical Implementation
- **Dependencies**: All required packages installed and configured
- **Code Quality**: ESLint configuration for code standards
- **Error Responses**: Standardized JSON error response format
- **Security**: Basic security headers and CORS protection
- **Performance**: Response compression and request logging

### What's Coming in v0.2

#### 📋 Planned Features
- **Database Connection**: PostgreSQL connection with connection pooling
- **Database Models**: User and Todo models with CRUD operations
- **Migration System**: Database schema management
- **Model Validation**: Input validation for database operations
- **Database Error Handling**: Proper error handling for database operations

#### 🎯 Success Criteria for v0.2
- Database connection established successfully
- User and Todo models support full CRUD operations
- Database queries execute without errors
- Connection pool manages connections efficiently
- Migration system functional

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

## API Specification

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

## 🛠️ v0.1 Setup & Installation

### Prerequisites
- Node.js ≥ 16.0.0
- npm ≥ 8.0.0

### Quick Start (v0.1)

#### 1. Clone and Setup
```bash
# Clone the repository
git clone <repository-url>
cd todo_app_AWS/groupproject

# Navigate to backend
cd backend
```

#### 2. Install Dependencies
```bash
# Install all required packages
npm install
```

#### 3. Environment Configuration
```bash
# Copy environment template
cp env.example .env

# Edit .env file with your configuration
nano .env
```

**Required .env variables for v0.1:**
```bash
# Environment Configuration
NODE_ENV=development
PORT=5000

# CORS Configuration
CORS_ORIGIN=http://localhost:3000

# Logging Configuration
LOG_LEVEL=info
```

#### 4. Start the Server
```bash
# Development mode with auto-restart
npm run dev

# Or production mode
npm start
```

#### 5. Verify Installation
```bash
# Test health endpoint
curl http://localhost:5000/api/health

# Expected response:
{
  "success": true,
  "status": "OK",
  "timestamp": "2024-01-01T00:00:00.000Z",
  "environment": "development",
  "version": "0.1.0",
  "uptime": 123.456
}
```

### Available Endpoints (v0.1)

| Method | Endpoint | Description | Response |
|--------|----------|-------------|----------|
| GET | `/` | API information | API details and available endpoints |
| GET | `/api/health` | Health check | Server status and uptime |

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

### Prerequisites (v0.2+)
- Node.js ≥ 16.0.0
- PostgreSQL ≥ 12.0 (v0.2+)
- npm ≥ 8.0.0

### Local Development (v0.2+)
```bash
# 1. Database setup (v0.2+)
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

### v0.1 Local Deployment

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
# Dockerfile for v0.1
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