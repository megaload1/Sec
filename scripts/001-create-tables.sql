-- Create users table
CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  first_name VARCHAR(100) NOT NULL,
  last_name VARCHAR(100) NOT NULL,
  wallet_balance DECIMAL(10,2) DEFAULT 0.00,
  is_active BOOLEAN DEFAULT false,
  is_admin BOOLEAN DEFAULT false,
  registration_countdown_end TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create transactions table
CREATE TABLE IF NOT EXISTS transactions (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id),
  type VARCHAR(50) NOT NULL, -- 'credit', 'debit', 'transfer', 'activation', 'topup'
  amount DECIMAL(10,2) NOT NULL,
  recipient_account_number VARCHAR(10),
  recipient_account_name VARCHAR(255),
  recipient_bank_name VARCHAR(255),
  status VARCHAR(20) DEFAULT 'pending', -- 'pending', 'completed', 'failed', 'reverted'
  description TEXT,
  reference VARCHAR(100) UNIQUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create admin_settings table
CREATE TABLE IF NOT EXISTS admin_settings (
  id SERIAL PRIMARY KEY,
  setting_name VARCHAR(100) UNIQUE NOT NULL,
  setting_value TEXT NOT NULL,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Insert default admin settings
INSERT INTO admin_settings (setting_name, setting_value) VALUES
('registration_bonus', '300'),
('countdown_minutes', '5'),
('activation_fee', '1000'),
('topup_amount', '10000')
ON CONFLICT (setting_name) DO NOTHING;

-- Create default admin user
INSERT INTO users (email, password_hash, first_name, last_name, is_admin, is_active) VALUES
('admin@flashbot.com', '$2b$10$rQZ1vQZ1vQZ1vQZ1vQZ1vO1vQZ1vQZ1vQZ1vQZ1vQZ1vQZ1vQZ1vQ', 'Admin', 'User', true, true)
ON CONFLICT (email) DO NOTHING;
