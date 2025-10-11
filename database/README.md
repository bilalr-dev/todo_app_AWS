# Database Documentation

This directory contains database-related files for the Todo App.

## 📁 **Directory Structure**

```
database/
├── migrations/          # Database migration files
├── seeds/              # Database seed data
├── schemas/            # Database schema definitions
└── README.md           # This file
```

## 🗄️ **Database Schema**

The application uses **PostgreSQL** (v0.x) and **AWS RDS MySQL** (v1.0) with the following tables:

### **Users Table**
- `id` - Primary key (AUTO_INCREMENT)
- `username` - Unique username
- `email` - Unique email address
- `password_hash` - Hashed password
- `created_at` - Creation timestamp
- `updated_at` - Last update timestamp

### **Todos Table**
- `id` - Primary key (AUTO_INCREMENT)
- `user_id` - Foreign key to users table
- `title` - Todo title
- `description` - Todo description
- `priority` - Priority level (low, medium, high)
- `due_date` - Due date
- `category` - Todo category
- `completed` - Completion status
- `position` - Display order
- `created_at` - Creation timestamp
- `updated_at` - Last update timestamp

### **File Attachments Table**
- `id` - Primary key (AUTO_INCREMENT)
- `todo_id` - Foreign key to todos table
- `file_name` - Original file name
- `file_size` - File size in bytes
- `file_type` - MIME type
- `s3_key` - AWS S3 object key
- `s3_url` - AWS S3 URL
- `created_at` - Creation timestamp

## 🚀 **Migration Files**

Migration files are numbered sequentially:
- `001_initial_schema.sql` - Initial database schema
- `002_add_indexes.sql` - Performance indexes
- `003_add_constraints.sql` - Additional constraints

## 🌱 **Seed Data**

Seed files contain sample data for development:
- `users.sql` - Sample user accounts
- `todos.sql` - Sample todo items

## 📋 **Usage**

1. **Development (v0.x)**: Use local PostgreSQL instance
2. **Production (v1.0)**: Use AWS RDS MySQL instance
3. **Migrations**: Run in sequence for database updates
4. **Seeds**: Load sample data for testing

## 🔧 **Configuration**

Database connection is configured via environment variables:
- `DB_HOST` - Database host
- `DB_PORT` - Database port (3306)
- `DB_NAME` - Database name (todoapp)
- `DB_USER` - Database username
- `DB_PASSWORD` - Database password
