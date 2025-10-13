-- Add theme preference to users table
-- This allows each user to have their own theme preference

-- Add theme_preference column to users table
ALTER TABLE users ADD COLUMN IF NOT EXISTS theme_preference VARCHAR(20) DEFAULT 'light' CHECK (theme_preference IN ('light', 'dark', 'system'));

-- Update existing users to have light theme as default
UPDATE users SET theme_preference = 'light' WHERE theme_preference IS NULL;

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_users_theme_preference ON users(theme_preference);
