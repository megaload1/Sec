-- Add registration bonus setting to admin_settings table
INSERT INTO admin_settings (setting_name, setting_value, description) 
VALUES ('registration_bonus', '300', 'Amount credited to new users after registration countdown')
ON CONFLICT (setting_name) DO UPDATE SET 
  setting_value = EXCLUDED.setting_value,
  description = EXCLUDED.description;
