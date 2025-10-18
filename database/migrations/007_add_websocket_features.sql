-- Migration 007: Add WebSocket Features (v0.7)
-- Add notifications and user_presence tables for real-time features

-- Create notifications table
CREATE TABLE IF NOT EXISTS notifications (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  type VARCHAR(50) NOT NULL,
  title VARCHAR(255) NOT NULL,
  message TEXT NOT NULL,
  data JSONB,
  read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create user_presence table
CREATE TABLE IF NOT EXISTS user_presence (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  socket_id VARCHAR(255) NOT NULL,
  last_seen TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  is_online BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Add notification preferences to users table
ALTER TABLE users ADD COLUMN IF NOT EXISTS notification_preferences JSONB DEFAULT '{
  "email_enabled": true,
  "in_app_enabled": true,
  "due_date_reminders": true,
  "file_upload_notifications": true,
  "batch_frequency": "hourly"
}';

-- Create indexes for notifications table
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_read ON notifications(read);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON notifications(created_at);
CREATE INDEX IF NOT EXISTS idx_notifications_type ON notifications(type);

-- Create indexes for user_presence table
CREATE INDEX IF NOT EXISTS idx_user_presence_user_id ON user_presence(user_id);
CREATE INDEX IF NOT EXISTS idx_user_presence_socket_id ON user_presence(socket_id);
CREATE INDEX IF NOT EXISTS idx_user_presence_online ON user_presence(is_online);
CREATE INDEX IF NOT EXISTS idx_user_presence_last_seen ON user_presence(last_seen);

-- Create GIN index for notification preferences
CREATE INDEX IF NOT EXISTS idx_users_notification_prefs ON users USING GIN(notification_preferences);

-- Add comments for documentation
COMMENT ON TABLE notifications IS 'Stores user notifications for real-time features';
COMMENT ON TABLE user_presence IS 'Tracks user WebSocket connection status';
COMMENT ON COLUMN notifications.type IS 'Notification type: due_date, file_upload, system, etc.';
COMMENT ON COLUMN notifications.data IS 'Additional notification data in JSON format';
COMMENT ON COLUMN user_presence.socket_id IS 'Unique Socket.io connection identifier';
COMMENT ON COLUMN users.notification_preferences IS 'User notification preferences in JSON format';

