-- Create standard_benefits table for the checklist
CREATE TABLE public.standard_benefits (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  benefit_key TEXT NOT NULL UNIQUE,
  benefit_label TEXT NOT NULL,
  display_order INTEGER NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.standard_benefits ENABLE ROW LEVEL SECURITY;

-- Public read access
CREATE POLICY "Standard benefits are publicly readable" 
ON public.standard_benefits 
FOR SELECT 
USING (true);

-- Admin management
CREATE POLICY "Admins can manage standard benefits" 
ON public.standard_benefits 
FOR ALL 
USING (is_admin(auth.uid()));

-- Insert default standard benefits
INSERT INTO public.standard_benefits (benefit_key, benefit_label, display_order) VALUES
  ('health_insurance', 'Health insurance', 1),
  ('pension_retirement', 'Pension / retirement', 2),
  ('paid_time_off', 'Paid time off', 3),
  ('parental_leave', 'Parental leave', 4),
  ('remote_flexible', 'Remote / flexible work', 5),
  ('learning_education', 'Learning / education support', 6),
  ('bonuses_incentives', 'Bonuses / incentives', 7),
  ('equity_profit_sharing', 'Equity / profit sharing', 8),
  ('transport_housing', 'Transport / housing', 9),
  ('none_not_sure', 'None / Not sure', 10);

-- Create table for review standard benefit selections
CREATE TABLE public.review_standard_benefits (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  review_id UUID NOT NULL REFERENCES public.reviews(id) ON DELETE CASCADE,
  standard_benefit_id UUID NOT NULL REFERENCES public.standard_benefits(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(review_id, standard_benefit_id)
);

-- Enable RLS
ALTER TABLE public.review_standard_benefits ENABLE ROW LEVEL SECURITY;

-- Public read
CREATE POLICY "Review standard benefits are publicly readable" 
ON public.review_standard_benefits 
FOR SELECT 
USING (true);

-- Anyone can insert (during review submission)
CREATE POLICY "Anyone can insert review standard benefits" 
ON public.review_standard_benefits 
FOR INSERT 
WITH CHECK (true);

-- Update reviews table: Add new columns for the revised form
ALTER TABLE public.reviews 
  ADD COLUMN IF NOT EXISTS role_level TEXT,
  ADD COLUMN IF NOT EXISTS department TEXT,
  ADD COLUMN IF NOT EXISTS tenure_range TEXT,
  ADD COLUMN IF NOT EXISTS salary_range TEXT,
  ADD COLUMN IF NOT EXISTS market_alignment TEXT,
  ADD COLUMN IF NOT EXISTS pay_transparency TEXT,
  ADD COLUMN IF NOT EXISTS private_feedback TEXT;

-- Update form_fields for review_form with new structure
-- First, delete existing fields for review_form
DELETE FROM public.form_fields 
WHERE form_config_id = 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11';

-- Insert new form fields with proper structure
INSERT INTO public.form_fields (form_config_id, field_key, field_label, field_type, is_required, is_visible, display_order, placeholder, options) VALUES
  -- Section 1: Employment Context
  ('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'employment_status', 'Current or Former', 'select', true, true, 1, NULL, '["Current Employee", "Former Employee"]'),
  ('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'role_level', 'Role Level', 'select', true, true, 2, NULL, '["Entry / Junior", "Mid-level", "Senior / Manager", "Leadership"]'),
  ('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'department', 'Department / Function', 'select', false, true, 3, NULL, '["Engineering", "Product", "Design", "Marketing", "Sales", "Finance", "HR", "Operations", "Customer Support", "Legal", "Other"]'),
  ('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'tenure_range', 'Time at Company', 'select', false, true, 4, NULL, '["Less than 1 year", "1-2 years", "3-5 years", "5+ years"]'),
  
  -- Section 2: Compensation & Benefits
  ('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'salary_range', 'Salary Range', 'select', true, true, 5, NULL, '["Under $10,000", "$10,000-$20,000", "$20,000-$35,000", "$35,000-$50,000", "$50,000-$75,000", "$75,000+", "Prefer not to say"]'),
  ('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'market_alignment', 'Market Alignment', 'select', false, true, 6, NULL, '["Significantly below market", "Slightly below market", "About market average", "Slightly above market", "Significantly above market", "Not sure"]'),
  ('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'pay_transparency', 'Pay Transparency', 'select', false, true, 7, NULL, '["Transparent", "Somewhat transparent", "Not transparent"]'),
  
  -- Section 4: Review Content
  ('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'title', 'Review Headline', 'text', true, true, 8, 'Summarize your experience in one sentence', NULL),
  ('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'pros', 'One thing you love', 'textarea', true, true, 9, 'What do you love most about working here? (max 200 characters)', NULL),
  ('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'cons', 'One thing to improve', 'textarea', true, true, 10, 'What is one thing that could be better? (max 200 characters)', NULL),
  
  -- Section 5: Recommendation
  ('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'recommendation', 'Would you recommend this company?', 'select', true, true, 11, NULL, '["Yes", "Maybe", "No"]'),
  
  -- Section 6: Private Feedback
  ('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'private_feedback', 'Private Feedback to Leadership', 'textarea', false, true, 12, 'What should leadership understand but may not hear directly? (This will not be made public)', NULL);

-- Update rating_category_configs with new structure
-- First, delete existing categories
DELETE FROM public.rating_category_configs;

-- Insert new rating categories
INSERT INTO public.rating_category_configs (category_key, category_label, display_order, is_active) VALUES
  ('compensation_fairness', 'Compensation Fairness', 1, true),
  ('management', 'Management & Leadership', 2, true),
  ('culture', 'Culture & Work Environment', 3, true),
  ('growth', 'Growth & Learning', 4, true),
  ('workLifeBalance', 'Work–Life Balance', 5, true),
  ('overall', 'Overall Experience', 6, true),
  ('ceoApproval', 'CEO Approval', 7, true);