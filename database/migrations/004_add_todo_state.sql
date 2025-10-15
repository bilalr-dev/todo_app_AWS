-- Add state field to todos table for workflow management
-- This migration adds a state field to track todo workflow: todo, inProgress, complete

-- Add state column to todos table
ALTER TABLE todos ADD COLUMN IF NOT EXISTS state VARCHAR(20) DEFAULT 'todo' CHECK (state IN ('todo', 'inProgress', 'complete'));

-- Update existing todos to have appropriate state based on completed field
UPDATE todos SET state = 'complete' WHERE completed = true;
UPDATE todos SET state = 'todo' WHERE completed = false;

-- Create index for better performance on state queries
CREATE INDEX IF NOT EXISTS idx_todos_state ON todos(state);

-- Update the updated_at trigger to include state changes
-- (The existing trigger will handle this automatically)
