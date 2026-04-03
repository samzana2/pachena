-- Fix security definer views by recreating them with security_invoker = true
-- This ensures RLS policies of the underlying tables are respected

DROP VIEW IF EXISTS public.reviews_public;
DROP VIEW IF EXISTS public.salaries_public;

-- Recreate reviews view with security invoker
CREATE VIEW public.reviews_public 
WITH (security_invoker = true) AS
SELECT 
  id,
  company_id,
  title,
  pros,
  cons,
  rating,
  role_title,
  employment_status,
  recommend_to_friend,
  ceo_approval,
  helpful_count,
  created_at,
  updated_at
FROM public.reviews;

-- Recreate salaries view with security invoker
CREATE VIEW public.salaries_public 
WITH (security_invoker = true) AS
SELECT 
  id,
  company_id,
  role_title,
  salary_min,
  salary_max,
  currency,
  created_at
FROM public.salaries;

-- Grant SELECT on views to authenticated and anon roles
GRANT SELECT ON public.reviews_public TO anon, authenticated;
GRANT SELECT ON public.salaries_public TO anon, authenticated;