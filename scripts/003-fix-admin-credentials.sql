-- Update admin user with correct password hash for "admin123"
UPDATE users 
SET password_hash = '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMeshLmhLGOpbse8QUXshNubhW'
WHERE email = 'admin@flashbot.com' AND is_admin = true;

-- If admin doesn't exist, create it
INSERT INTO users (email, password_hash, first_name, last_name, is_admin, is_active, wallet_balance) 
VALUES ('admin@flashbot.com', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMeshLmhLGOpbse8QUXshNubhW', 'Admin', 'User', true, true, 0.00)
ON CONFLICT (email) DO UPDATE SET
password_hash = '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMeshLmhLGOpbse8QUXshNubhW',
is_admin = true,
is_active = true;
