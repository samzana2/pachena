-- Add columns to form_fields table for "Other" text option support
ALTER TABLE public.form_fields 
ADD COLUMN IF NOT EXISTS allow_other_text boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS other_text_placeholder text DEFAULT NULL;