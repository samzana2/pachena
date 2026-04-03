-- Phase 3: Form Configuration Tables

-- Master form configurations
CREATE TABLE public.form_configurations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  form_type text NOT NULL UNIQUE,
  is_active boolean DEFAULT true,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- Individual form fields
CREATE TABLE public.form_fields (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  form_config_id uuid REFERENCES public.form_configurations(id) ON DELETE CASCADE NOT NULL,
  field_key text NOT NULL,
  field_label text NOT NULL,
  field_type text NOT NULL,
  placeholder text,
  is_required boolean DEFAULT false,
  is_visible boolean DEFAULT true,
  display_order integer NOT NULL,
  options jsonb,
  validation_rules jsonb,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- Rating categories configuration
CREATE TABLE public.rating_category_configs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  category_key text NOT NULL UNIQUE,
  category_label text NOT NULL,
  is_active boolean DEFAULT true,
  display_order integer NOT NULL,
  created_at timestamp with time zone DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.form_configurations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.form_fields ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rating_category_configs ENABLE ROW LEVEL SECURITY;

-- Public read policies (forms need to be readable by everyone)
CREATE POLICY "Forms are publicly readable" ON public.form_configurations FOR SELECT USING (true);
CREATE POLICY "Form fields are publicly readable" ON public.form_fields FOR SELECT USING (true);
CREATE POLICY "Rating categories are publicly readable" ON public.rating_category_configs FOR SELECT USING (true);

-- Admin write policies
CREATE POLICY "Admins can manage form configs" ON public.form_configurations FOR ALL USING (is_admin(auth.uid()));
CREATE POLICY "Admins can manage form fields" ON public.form_fields FOR ALL USING (is_admin(auth.uid()));
CREATE POLICY "Admins can manage rating categories" ON public.rating_category_configs FOR ALL USING (is_admin(auth.uid()));

-- Phase 4: Add user_id to company_claim_requests
ALTER TABLE public.company_claim_requests ADD COLUMN IF NOT EXISTS user_id uuid;

-- Triggers for updated_at
CREATE TRIGGER update_form_configurations_updated_at
  BEFORE UPDATE ON public.form_configurations
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_form_fields_updated_at
  BEFORE UPDATE ON public.form_fields
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();