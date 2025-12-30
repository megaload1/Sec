-- Ensure topup settings exist with proper values
INSERT INTO admin_settings (setting_name, setting_value) VALUES
('topup_payment_amount', '10000'),
('topup_credit_amount', '9500')
ON CONFLICT (setting_name) DO UPDATE SET
setting_value = EXCLUDED.setting_value,
updated_at = CURRENT_TIMESTAMP;

-- Verify the settings were created/updated
SELECT setting_name, setting_value, updated_at 
FROM admin_settings 
WHERE setting_name IN ('topup_payment_amount', 'topup_credit_amount');
