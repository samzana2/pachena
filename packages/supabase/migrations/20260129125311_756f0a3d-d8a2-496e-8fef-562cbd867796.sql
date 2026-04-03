-- Add description column to rating_category_configs
ALTER TABLE public.rating_category_configs 
ADD COLUMN IF NOT EXISTS category_description text;

-- Deactivate all existing categories
UPDATE public.rating_category_configs SET is_active = false;

-- Insert the 8 new rating categories with descriptions
INSERT INTO public.rating_category_configs (category_key, category_label, category_description, display_order, is_active) VALUES
('compensation', 'Compensation & Benefits', 'Are you fairly compensated for your work?', 1, true),
('workLifeBalance', 'Work-Life Balance', 'Can you maintain healthy boundaries between work and personal life?', 2, true),
('careerGrowth', 'Career Growth & Learning', 'Do you have opportunities to grow and develop your skills?', 3, true),
('management', 'Management & Leadership', 'Is the management effective and supportive?', 4, true),
('culture', 'Work Environment & Culture', 'Is the workplace atmosphere positive and respectful?', 5, true),
('businessOutlook', 'Business Outlook', 'Do you believe the company has a positive future?', 6, true),
('fairTreatment', 'Fair Treatment & Equity', 'Are all employees treated fairly and equally?', 7, true),
('overall', 'Overall Experience', 'Would you rate your overall experience positively?', 8, true)
ON CONFLICT (category_key) DO UPDATE SET
  category_label = EXCLUDED.category_label,
  category_description = EXCLUDED.category_description,
  display_order = EXCLUDED.display_order,
  is_active = true;