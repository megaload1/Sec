-- Delete existing admin user
DELETE FROM users WHERE email = 'admin@flashbot.com';

-- Create new admin user with password "flashbot123"
INSERT INTO users (email, password_hash, first_name, last_name, is_admin, is_active, wallet_balance) 
VALUES ('admin@flashbot.com', '$2b$12$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'Admin', 'User', true, true, 0.00);

-- Add Flutterwave API settings to admin_settings
INSERT INTO admin_settings (setting_name, setting_value) VALUES
('flutterwave_secret_key', ''),
('flutterwave_public_key', ''),
('flutterwave_encryption_key', '')
ON CONFLICT (setting_name) DO NOTHING;
