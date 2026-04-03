-- Change default moderation_status to 'pending' so reviews require approval
ALTER TABLE public.reviews ALTER COLUMN moderation_status SET DEFAULT 'pending';

-- Recreate the reviews_public view to only show approved reviews
DROP VIEW IF EXISTS public.reviews_public;
CREATE VIEW public.reviews_public AS
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