-- Fix reviews_public view to only show approved reviews (not hidden ones)
CREATE OR REPLACE VIEW public.reviews_public AS
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