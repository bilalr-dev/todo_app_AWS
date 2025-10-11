# Todo Application

A full-stack web application demonstrating modern software engineering practices with incremental development and cloud deployment.

## Architecture

### System Design
- **Frontend**: React SPA with Context API state management
- **Backend**: RESTful API with Express.js and layered architecture
- **Database**: PostgreSQL (development) → AWS RDS MySQL (production)
- **Storage**: Local filesystem (development) → AWS S3 (production)
- **Deployment**: AWS EC2 with Nginx reverse proxy

### Technology Stack
| Layer | Technology | Purpose |
|-------|------------|---------|
| Frontend | React 18, Axios, Tailwind CSS | UI/UX and API communication |
| Backend | Node.js, Express.js, JWT, Socket.io | API server, auth, real-time |
| Database | PostgreSQL (v0.x), MySQL (v1.0) | Data persistence |
| Cache | Redis (v0.8+) | Session storage and caching |
| Storage | Local FS (v0.x), AWS S3 (v1.0) | File attachments |
| Infrastructure | AWS EC2, RDS, S3 | Production hosting |

## Development Strategy

### Version Progression
```
v0.1 → v0.2 → v0.3 → v0.4 → v0.5 → v0.6 → v0.7 → v0.8 → v0.9 → v1.0
```

| Version | Scope | Database | Storage |
|---------|-------|----------|---------|
| v0.1 | Basic server + health check | - | - |
| v0.2 | Database connection + models | PostgreSQL | - |
| v0.3 | JWT authentication | PostgreSQL | - |
| v0.4 | Todo CRUD + complete app | PostgreSQL | Local FS |
| v0.5 | Bug fixes + UX improvements | PostgreSQL | Local FS |
| v0.6 | Advanced features + file uploads | PostgreSQL | Local FS |
| v0.7 | Real-time updates + notifications | PostgreSQL | Local FS |
| v0.8 | Performance optimization + caching | PostgreSQL | Local FS |
| v0.9 | Security hardening + monitoring | PostgreSQL | Local FS |
| v1.0 | AWS migration + production | AWS RDS MySQL | AWS S3 |

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

## Development Setup

### Prerequisites
- Node.js ≥ 16.0.0
- PostgreSQL ≥ 12.0
- npm ≥ 8.0.0

### Local Development
```bash
# 1. Database setup
createdb todo_app

# 2. Backend setup
cd backend
npm install
cp env.example .env
# Configure .env with database credentials
npm run migrate
npm run dev

# 3. Frontend setup
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

## Deployment

### Production Architecture
```
Internet → Nginx → Express.js → PostgreSQL
                ↓
            React SPA (S3)
```

### AWS Resources
- **EC2**: t2.micro instance for API server
- **RDS**: db.t3.micro MySQL instance
- **S3**: Static website hosting for React app
- **IAM**: Roles and policies for secure access

### Deployment Pipeline
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