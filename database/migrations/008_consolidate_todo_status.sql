-- Migration: Consolidate completed + state into single status field
-- This migration consolidates the completed boolean and state string into a single status field
-- Status values: 'pending', 'in_progress', 'completed'

BEGIN;

-- Add the new status column
ALTER TABLE todos ADD COLUMN status VARCHAR(20) DEFAULT 'pending';

-- Update existing todos to set status based on current completed and state values
UPDATE todos SET status = CASE 
    WHEN completed = true THEN 'completed'
    WHEN state = 'inProgress' THEN 'in_progress'
    ELSE 'pending'
END;

-- Make status NOT NULL after setting values
ALTER TABLE todos ALTER COLUMN status SET NOT NULL;

-- Drop the old columns
ALTER TABLE todos DROP COLUMN completed;
ALTER TABLE todos DROP COLUMN state;

-- Add index on status for better query performance
CREATE INDEX idx_todos_status ON todos(status);

-- Add check constraint to ensure valid status values
ALTER TABLE todos ADD CONSTRAINT chk_todos_status 
    CHECK (status IN ('pending', 'in_progress', 'completed'));

COMMIT;





