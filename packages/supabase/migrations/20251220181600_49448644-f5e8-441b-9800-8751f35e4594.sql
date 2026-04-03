-- Add form-level metadata to form_configurations
ALTER TABLE public.form_configurations
ADD COLUMN IF NOT EXISTS title text,
ADD COLUMN IF NOT EXISTS description text,
ADD COLUMN IF NOT EXISTS header_icon text;

-- Create form_sections table
CREATE TABLE IF NOT EXISTS public.form_sections (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  form_config_id uuid NOT NULL REFERENCES public.form_configurations(id) ON DELETE CASCADE,
  section_key text NOT NULL,
  section_title text NOT NULL,
  section_description text,
  section_icon text,
  display_order integer NOT NULL,
  is_visible boolean DEFAULT true,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- Add section_id to form_fields
ALTER TABLE public.form_fields
ADD COLUMN IF NOT EXISTS section_id uuid REFERENCES public.form_sections(id) ON DELETE SET NULL;

-- Enable RLS on form_sections
ALTER TABLE public.form_sections ENABLE ROW LEVEL SECURITY;

-- RLS policies for form_sections
CREATE POLICY "Form sections are publicly readable" 
ON public.form_sections 
FOR SELECT 
USING (true);

CREATE POLICY "Admins can manage form sections" 
ON public.form_sections 
FOR ALL 
USING (is_admin(auth.uid()));

-- Update existing form configurations with default titles
UPDATE public.form_configurations
SET title = CASE 
  WHEN form_type = 'review_form' THEN 'Write Your Anonymous Review'
  WHEN form_type = 'claim_form' THEN 'Claim Your Company'
  ELSE 'Form'
END,
description = CASE 
  WHEN form_type = 'review_form' THEN 'Share your honest experience to help others make informed career decisions.'
  WHEN form_type = 'claim_form' THEN 'Verify your company ownership to manage your profile and respond to reviews.'
  ELSE NULL
END
WHERE title IS NULL;

-- Create default sections for review_form
INSERT INTO public.form_sections (form_config_id, section_key, section_title, section_description, section_icon, display_order)
SELECT 
  fc.id,
  s.section_key,
  s.section_title,
  s.section_description,
  s.section_icon,
  s.display_order
FROM public.form_configurations fc
CROSS JOIN (VALUES
  ('employment_context', 'Employment Context', 'Tell us about your role', 'Briefcase', 1),
  ('compensation', 'Compensation & Benefits', 'How does the company compensate you?', 'DollarSign', 2),
  ('ratings', 'Core Experience Ratings', 'Rate your experience', 'Star', 3),
  ('review_content', 'Your Review', 'Share the details', 'MessageSquare', 4),
  ('recommendation', 'Recommendation', 'Would you recommend this company?', 'ThumbsUp', 5),
  ('private_feedback', 'Private Feedback', 'Optional feedback for the company only', 'Lock', 6)
) AS s(section_key, section_title, section_description, section_icon, display_order)
WHERE fc.form_type = 'review_form'
ON CONFLICT DO NOTHING;

-- Create default sections for claim_form
INSERT INTO public.form_sections (form_config_id, section_key, section_title, section_description, section_icon, display_order)
SELECT 
  fc.id,
  s.section_key,
  s.section_title,
  s.section_description,
  s.section_icon,
  s.display_order
FROM public.form_configurations fc
CROSS JOIN (VALUES
  ('contact_info', 'Contact Information', 'Your professional details', 'User', 1),
  ('company_info', 'Company Information', 'Details about your company', 'Building', 2),
  ('supervisor', 'Supervisor Contact', 'For verification purposes', 'Users', 3),
  ('authorization', 'Authorization', 'Confirm your authority', 'Shield', 4)
) AS s(section_key, section_title, section_description, section_icon, display_order)
WHERE fc.form_type = 'claim_form'
ON CONFLICT DO NOTHING;

-- Link existing fields to sections for review_form
UPDATE public.form_fields ff
SET section_id = fs.id
FROM public.form_sections fs
JOIN public.form_configurations fc ON fc.id = fs.form_config_id
WHERE ff.form_config_id = fc.id
  AND fc.form_type = 'review_form'
  AND (
    (ff.field_key IN ('employment_status', 'role_level', 'department', 'tenure_range') AND fs.section_key = 'employment_context')
    OR (ff.field_key IN ('salary_range', 'market_alignment', 'pay_transparency') AND fs.section_key = 'compensation')
    OR (ff.field_key IN ('title', 'pros', 'cons') AND fs.section_key = 'review_content')
    OR (ff.field_key = 'recommendation' AND fs.section_key = 'recommendation')
    OR (ff.field_key = 'private_feedback' AND fs.section_key = 'private_feedback')
  );

-- Link existing fields to sections for claim_form
UPDATE public.form_fields ff
SET section_id = fs.id
FROM public.form_sections fs
JOIN public.form_configurations fc ON fc.id = fs.form_config_id
WHERE ff.form_config_id = fc.id
  AND fc.form_type = 'claim_form'
  AND (
    (ff.field_key IN ('full_name', 'work_email', 'job_title', 'phone_number') AND fs.section_key = 'contact_info')
    OR (ff.field_key IN ('company_name', 'company_website', 'message') AND fs.section_key = 'company_info')
    OR (ff.field_key IN ('supervisor_name', 'supervisor_email') AND fs.section_key = 'supervisor')
    OR (ff.field_key = 'authorization_confirmed' AND fs.section_key = 'authorization')
  );