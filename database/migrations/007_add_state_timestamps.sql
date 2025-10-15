-- Add state transition timestamp fields to todos table
-- This migration adds fields to track when todos were moved to specific states

-- Add started_at column to track when todo was first moved to inProgress
ALTER TABLE todos ADD COLUMN IF NOT EXISTS started_at TIMESTAMP WITH TIME ZONE;

-- Add completed_at column to track when todo was first moved to complete
ALTER TABLE todos ADD COLUMN IF NOT EXISTS completed_at TIMESTAMP WITH TIME ZONE;

-- Update existing todos with appropriate timestamps based on current state
-- For completed todos, set completed_at to updated_at (best approximation)
UPDATE todos SET completed_at = updated_at WHERE state = 'complete' AND completed_at IS NULL;

-- For in-progress todos, set started_at to updated_at (best approximation)
UPDATE todos SET started_at = updated_at WHERE state = 'inProgress' AND started_at IS NULL;

-- Create indexes for better performance on state timestamp queries
CREATE INDEX IF NOT EXISTS idx_todos_started_at ON todos(started_at);
CREATE INDEX IF NOT EXISTS idx_todos_completed_at ON todos(completed_at);
