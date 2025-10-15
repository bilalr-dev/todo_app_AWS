-- Migration: Add file attachments support for v0.6
-- Description: Adds file attachment functionality to todos

-- Create file_attachments table
CREATE TABLE IF NOT EXISTS file_attachments (
    id SERIAL PRIMARY KEY,
    todo_id INTEGER NOT NULL REFERENCES todos(id) ON DELETE CASCADE,
    filename VARCHAR(255) NOT NULL,
    original_name VARCHAR(255) NOT NULL,
    file_path VARCHAR(500) NOT NULL,
    file_size INTEGER NOT NULL,
    mime_type VARCHAR(100) NOT NULL,
    file_type VARCHAR(50) NOT NULL, -- 'image', 'document', 'text'
    thumbnail_path VARCHAR(500), -- For images
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_file_attachments_todo_id ON file_attachments(todo_id);
CREATE INDEX IF NOT EXISTS idx_file_attachments_file_type ON file_attachments(file_type);
CREATE INDEX IF NOT EXISTS idx_file_attachments_created_at ON file_attachments(created_at);

-- Add file_count column to todos table for quick reference
ALTER TABLE todos ADD COLUMN IF NOT EXISTS file_count INTEGER DEFAULT 0;

-- Create index for file_count
CREATE INDEX IF NOT EXISTS idx_todos_file_count ON todos(file_count);

-- Update the updated_at trigger for file_attachments
CREATE OR REPLACE FUNCTION update_file_attachments_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_file_attachments_updated_at
    BEFORE UPDATE ON file_attachments
    FOR EACH ROW
    EXECUTE FUNCTION update_file_attachments_updated_at();

-- Function to update todo file_count when attachments are added/removed
CREATE OR REPLACE FUNCTION update_todo_file_count()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        UPDATE todos SET file_count = file_count + 1 WHERE id = NEW.todo_id;
        RETURN NEW;
    ELSIF TG_OP = 'DELETE' THEN
        UPDATE todos SET file_count = file_count - 1 WHERE id = OLD.todo_id;
        RETURN OLD;
    END IF;
    RETURN NULL;
END;
$$ language 'plpgsql';

-- Create triggers for file_count updates
CREATE TRIGGER update_todo_file_count_insert
    AFTER INSERT ON file_attachments
    FOR EACH ROW
    EXECUTE FUNCTION update_todo_file_count();

CREATE TRIGGER update_todo_file_count_delete
    AFTER DELETE ON file_attachments
    FOR EACH ROW
    EXECUTE FUNCTION update_todo_file_count();

-- Add comments for documentation
COMMENT ON TABLE file_attachments IS 'Stores file attachments for todos';
COMMENT ON COLUMN file_attachments.todo_id IS 'Reference to the todo this file is attached to';
COMMENT ON COLUMN file_attachments.filename IS 'Generated filename for storage';
COMMENT ON COLUMN file_attachments.original_name IS 'Original filename from user upload';
COMMENT ON COLUMN file_attachments.file_path IS 'Path to the stored file';
COMMENT ON COLUMN file_attachments.file_size IS 'File size in bytes';
COMMENT ON COLUMN file_attachments.mime_type IS 'MIME type of the file';
COMMENT ON COLUMN file_attachments.file_type IS 'Categorized file type (image, document, text)';
COMMENT ON COLUMN file_attachments.thumbnail_path IS 'Path to thumbnail for images';
COMMENT ON COLUMN todos.file_count IS 'Number of files attached to this todo';
