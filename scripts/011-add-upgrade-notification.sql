-- Add upgrade notification settings to admin_settings table
INSERT INTO admin_settings (setting_name, setting_value)
VALUES 
  ('upgrade_notification_enabled', 'false'),
  ('upgrade_completion_time', '')
ON CONFLICT (setting_name) DO NOTHING;
