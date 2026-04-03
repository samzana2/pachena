-- Create platform_settings table for storing configurable platform options
CREATE TABLE public.platform_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  setting_key text NOT NULL UNIQUE,
  setting_value text,
  setting_type text NOT NULL DEFAULT 'string', -- string, boolean, number, json
  description text,
  updated_at timestamp with time zone DEFAULT now(),
  updated_by uuid
);

-- Enable RLS
ALTER TABLE public.platform_settings ENABLE ROW LEVEL SECURITY;

-- Admins can view all settings
CREATE POLICY "Admins can view platform settings"
ON public.platform_settings
FOR SELECT
USING (is_admin(auth.uid()));

-- Admins can manage platform settings
CREATE POLICY "Admins can manage platform settings"
ON public.platform_settings
FOR ALL
USING (is_admin(auth.uid()));

-- Insert default settings
INSERT INTO public.platform_settings (setting_key, setting_value, setting_type, description) VALUES
  ('site_name', 'Pachena', 'string', 'Platform display name'),
  ('support_email', 'support@pachena.com', 'string', 'Support email address'),
  ('min_review_length', '50', 'number', 'Minimum character count for review text'),
  ('review_moderation_mode', 'auto_approve', 'string', 'Review moderation: auto_approve, manual, ai_moderation'),
  ('allow_anonymous_reviews', 'true', 'boolean', 'Allow anonymous review submissions'),
  ('session_timeout_minutes', '60', 'number', 'Auto-logout after inactivity (minutes)');