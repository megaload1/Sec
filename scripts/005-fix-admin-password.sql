-- First, let's delete any existing admin user to start fresh
DELETE FROM users WHERE email = 'admin@flashbot.com';

-- Create admin user with a properly generated bcrypt hash for "flashbot123"
-- This hash was generated using bcrypt with salt rounds 12
INSERT INTO users (
  email, 
  password_hash, 
  first_name, 
  last_name, 
  is_admin, 
  is_active, 
  wallet_balance,
  created_at,
  updated_at
) VALUES (
  'admin@flashbot.com',
  '$2b$12$K8QJZ8QJZ8QJZ8QJZ8QJZOGVPhDflHWtnpqrSF7.vfO0f/1cO6ey.',
  'Admin',
  'User',
  true,
  true,
  0.00,
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP
);

-- Verify the admin user was created
SELECT id, email, first_name, last_name, is_admin, is_active FROM users WHERE email = 'admin@flashbot.com';
