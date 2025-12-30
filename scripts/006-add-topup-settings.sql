-- Add new admin settings for topup configuration
INSERT INTO admin_settings (setting_name, setting_value) VALUES
('topup_payment_amount', '10000'),
('topup_credit_amount', '9500')
ON CONFLICT (setting_name) DO NOTHING;

-- Update existing topup_amount to be payment amount
UPDATE admin_settings 
SET setting_name = 'topup_payment_amount' 
WHERE setting_name = 'topup_amount';
