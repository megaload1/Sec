-- Removed static invalid hash - use the API endpoint instead to generate proper hash
-- The create-admin API endpoint will dynamically generate a valid bcrypt hash
-- This script is kept as fallback only with placeholder hash

-- Delete old admin if exists
DELETE FROM users WHERE email = 'admin@flashbot.com';

-- Placeholder: This hash should be generated via the API endpoint
-- Navigate to /setup-admin and use setup key: setup-flashbot-admin-2024
-- Or use this hash (valid bcrypt for "flashbot123" with 12 rounds):
INSERT INTO users (email, password_hash, first_name, last_name, is_admin, is_active, wallet_balance) 
VALUES ('admin@flashbot.com', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewY5YmMxSUmGEJoe', 'Admin', 'User', true, true, 0.00);
