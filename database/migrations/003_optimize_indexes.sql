-- Migration 003: Optimize database indexes for v0.5
-- This migration adds comprehensive indexes to improve query performance

-- Indexes for users table
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);

-- Indexes for todos table
CREATE INDEX IF NOT EXISTS idx_todos_user_id ON todos(user_id);
CREATE INDEX IF NOT EXISTS idx_todos_completed ON todos(completed);
CREATE INDEX IF NOT EXISTS idx_todos_priority ON todos(priority);
CREATE INDEX IF NOT EXISTS idx_todos_due_date ON todos(due_date);
CREATE INDEX IF NOT EXISTS idx_todos_category ON todos(category);

-- Composite indexes for common queries
CREATE INDEX IF NOT EXISTS idx_todos_user_id_completed ON todos(user_id, completed);
CREATE INDEX IF NOT EXISTS idx_todos_user_id_priority ON todos(user_id, priority);
CREATE INDEX IF NOT EXISTS idx_todos_user_id_due_date ON todos(user_id, due_date);
CREATE INDEX IF NOT EXISTS idx_todos_user_id_category ON todos(user_id, category);

-- Full-text search index for todo search functionality
CREATE INDEX IF NOT EXISTS idx_todos_title_search ON todos USING gin(to_tsvector('english', title));
CREATE INDEX IF NOT EXISTS idx_todos_description_search ON todos USING gin(to_tsvector('english', description));

-- Partial indexes for better performance on filtered queries
CREATE INDEX IF NOT EXISTS idx_todos_pending ON todos(user_id, due_date) WHERE completed = false;
CREATE INDEX IF NOT EXISTS idx_todos_high_priority ON todos(user_id, created_at) WHERE priority = 'high';

-- Add comments for documentation
COMMENT ON INDEX idx_users_email IS 'Fast lookup for user authentication by email';
COMMENT ON INDEX idx_users_username IS 'Fast lookup for user authentication by username';
COMMENT ON INDEX idx_todos_user_id IS 'Fast lookup for todos by user';
COMMENT ON INDEX idx_todos_completed IS 'Fast filtering by completion status';
COMMENT ON INDEX idx_todos_priority IS 'Fast filtering by priority level';
COMMENT ON INDEX idx_todos_due_date IS 'Fast sorting and filtering by due date';
COMMENT ON INDEX idx_todos_category IS 'Fast filtering by category';
COMMENT ON INDEX idx_todos_title_search IS 'Full-text search on todo titles';
COMMENT ON INDEX idx_todos_description_search IS 'Full-text search on todo descriptions';
