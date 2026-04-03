-- Fix security definer view by recreating with SECURITY INVOKER
DROP VIEW IF EXISTS public.reviews_public;
CREATE VIEW public.reviews_public WITH (security_invoker = true) AS
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
FROM public.reviews
WHERE moderation_status = 'approved';