-- Add allowed_email_domains column to companies table
ALTER TABLE public.companies 
ADD COLUMN allowed_email_domains text[] DEFAULT '{}';

COMMENT ON COLUMN public.companies.allowed_email_domains IS 
  'Additional email domains that are valid for employee verification (beyond the website domain)';