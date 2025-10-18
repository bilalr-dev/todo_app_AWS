-- Migration to update demo user
-- This script deletes any existing demo users and creates a new demo user with ID 1

-- First, delete any existing demo users (by email patterns)
DELETE FROM todos WHERE user_id IN (
    SELECT id FROM users WHERE 
    email LIKE '%@demo.com' OR 
    email LIKE '%@example.com' OR 
    username LIKE 'demo%' OR 
    username LIKE 'test%'
);

DELETE FROM notifications WHERE user_id IN (
    SELECT id FROM users WHERE 
    email LIKE '%@demo.com' OR 
    email LIKE '%@example.com' OR 
    username LIKE 'demo%' OR 
    username LIKE 'test%'
);

DELETE FROM user_preferences WHERE user_id IN (
    SELECT id FROM users WHERE 
    email LIKE '%@demo.com' OR 
    email LIKE '%@example.com' OR 
    username LIKE 'demo%' OR 
    username LIKE 'test%'
);

DELETE FROM file_attachments WHERE todo_id IN (
    SELECT t.id FROM todos t 
    JOIN users u ON t.user_id = u.id 
    WHERE u.email LIKE '%@demo.com' OR 
    u.email LIKE '%@example.com' OR 
    u.username LIKE 'demo%' OR 
    u.username LIKE 'test%'
);

DELETE FROM users WHERE 
    email LIKE '%@demo.com' OR 
    email LIKE '%@example.com' OR 
    username LIKE 'demo%' OR 
    username LIKE 'test%';

-- Reset the sequence to ensure ID 1 is available
-- First, check if user ID 1 exists and delete it if it does
DELETE FROM todos WHERE user_id = 1;
DELETE FROM notifications WHERE user_id = 1;
DELETE FROM user_preferences WHERE user_id = 1;
DELETE FROM file_attachments WHERE todo_id IN (
    SELECT id FROM todos WHERE user_id = 1
);
DELETE FROM users WHERE id = 1;

-- Reset the sequence to start from 1
SELECT setval('users_id_seq', 1, false);

-- Create the new demo user with ID 1
INSERT INTO users (id, username, email, password_hash, email_verified, created_at, updated_at) 
VALUES (
    1, 
    'demo', 
    'demo@todoapp.com', 
    '$2a$12$lNvq8WZTmBc8zE8PQPqqv.HdKLqudLC1VQum7YirssfFK.wR694Tm', -- password: 'Demo123!'
    true, 
    CURRENT_TIMESTAMP, 
    CURRENT_TIMESTAMP
);

-- Create user preferences for demo user
INSERT INTO user_preferences (user_id, email_notifications, push_notifications, due_date_reminders, theme, language, timezone)
VALUES (1, false, false, false, 'light', 'en', 'UTC');

-- Create some sample todos for the demo user
INSERT INTO todos (user_id, title, description, priority, due_date, category, completed, created_at, updated_at) VALUES
(1, 'Welcome to TodoApp!', 'This is your first todo. You can edit, complete, or delete it.', 'high', CURRENT_TIMESTAMP + INTERVAL '1 day', 'Getting Started', false, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
(1, 'Explore the features', 'Try creating new todos, setting priorities, and organizing by categories.', 'medium', CURRENT_TIMESTAMP + INTERVAL '3 days', 'Getting Started', false, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
(1, 'Set up your profile', 'Customize your profile and preferences in the Profile section.', 'low', CURRENT_TIMESTAMP + INTERVAL '7 days', 'Personal', false, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
(1, 'Complete a task', 'Mark this todo as completed to see how it works.', 'medium', CURRENT_TIMESTAMP + INTERVAL '2 days', 'Work', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

-- Update the sequence to continue from the next available ID
SELECT setval('users_id_seq', (SELECT MAX(id) FROM users), true);
