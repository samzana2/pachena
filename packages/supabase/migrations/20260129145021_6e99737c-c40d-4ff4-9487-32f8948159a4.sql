-- Update reviews_public view to include interview experience, advice, and salary data
-- (while still excluding sensitive fields: verification_token, private_feedback, moderation fields)
DROP VIEW IF EXISTS public.reviews_public;

CREATE VIEW public.reviews_public
WITH (security_invoker=on) AS
SELECT 
  id,
  company_id,
  title,
  pros,
  cons,
  advice,
  rating,
  role_title,
  role_level,
  department,
  tenure_range,
  employment_status,
  employment_type,
  recommend_to_friend,
  ceo_approval,
  helpful_count,
  -- Salary range (categorical, not exact amounts)
  salary_range,
  market_alignment,
  pay_transparency,
  -- Interview experience fields
  did_interview,
  interview_experience_rating,
  interview_count,
  interview_difficulty,
  interview_description,
  interview_tips,
  -- Demographics (for aggregate stats only)
  age_range,
  gender,
  ethnicity,
  education_level,
  created_at,
  updated_at
FROM public.reviews
WHERE moderation_status = 'approved';