-- Add benefits section configuration to form_configurations
ALTER TABLE public.form_configurations 
ADD COLUMN IF NOT EXISTS benefits_section_title TEXT DEFAULT 'Standard Benefits',
ADD COLUMN IF NOT EXISTS benefits_section_description TEXT,
ADD COLUMN IF NOT EXISTS benefits_section_icon TEXT DEFAULT 'Gift',
ADD COLUMN IF NOT EXISTS benefits_section_display_order INTEGER DEFAULT 100,
ADD COLUMN IF NOT EXISTS benefits_section_visible BOOLEAN DEFAULT true;

-- Update existing review_form to have a reasonable display order
UPDATE public.form_configurations 
SET benefits_section_display_order = 3
WHERE form_type = 'review_form';