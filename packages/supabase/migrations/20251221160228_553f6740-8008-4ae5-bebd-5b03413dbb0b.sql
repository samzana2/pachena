-- Create feature flags table
CREATE TABLE public.feature_flags (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  flag_key TEXT NOT NULL UNIQUE,
  flag_label TEXT NOT NULL,
  description TEXT,
  is_enabled BOOLEAN NOT NULL DEFAULT false,
  category TEXT DEFAULT 'general',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.feature_flags ENABLE ROW LEVEL SECURITY;

-- Everyone can read feature flags (needed for UI to check flags)
CREATE POLICY "Feature flags are readable by everyone"
ON public.feature_flags
FOR SELECT
USING (true);

-- Only admins can modify feature flags
CREATE POLICY "Admins can manage feature flags"
ON public.feature_flags
FOR ALL
TO authenticated
USING (public.is_admin(auth.uid()))
WITH CHECK (public.is_admin(auth.uid()));

-- Add trigger for updated_at
CREATE TRIGGER update_feature_flags_updated_at
BEFORE UPDATE ON public.feature_flags
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Insert default employer feature flags
INSERT INTO public.feature_flags (flag_key, flag_label, description, category, is_enabled) VALUES
  ('employer_nav_links', 'Employer Navigation Links', 'Show employer-related links in header navigation (For Employers, Pricing)', 'employer', false),
  ('employer_footer_section', 'Employer Footer Section', 'Show the "For Employers" section in the footer', 'employer', false),
  ('employer_homepage_cta', 'Employer Homepage CTA', 'Show employer call-to-action section on homepage', 'employer', false),
  ('employer_claim_page', 'Claim Company Page', 'Allow access to the company claim page', 'employer', false),
  ('employer_dashboard', 'Employer Dashboard', 'Allow access to the employer dashboard', 'employer', false);