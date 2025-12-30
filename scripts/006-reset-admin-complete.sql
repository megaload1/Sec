-- Ensure email is unique (drop old admin if exists and recreate)
DELETE FROM users WHERE email = 'admin@flashbot.com';

-- Create fresh admin user with password "flashbot123"
-- Hash generated with bcryptjs: $2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewY5YmMxSUmGEJoe
INSERT INTO users (
  email, 
  password_hash, 
  first_name, 
  last_name, 
  is_admin, 
  is_active, 
  wallet_balance,
  dollar_balance,
  created_at,
  updated_at
) VALUES (
  'admin@flashbot.com',
  '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewY5YmMxSUmGEJoe',
  'Admin',
  'User',
  true,
  true,
  0,
  0,
  NOW(),
  NOW()
);

-- Verify the admin user was created
SELECT id, email, is_admin, is_active, password_hash FROM users WHERE email = 'admin@flashbot.com';
