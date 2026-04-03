-- Recreate reviews_public view with timestamp fuzzing and demographic suppression
CREATE OR REPLACE VIEW public.reviews_public AS
SELECT
  r.id,
  r.company_id,
  r.title,
  r.pros,
  r.cons,
  r.advice,
  r.rating,
  -- Demographic fields: suppress when company has fewer than 5 approved reviews
  CASE WHEN (
    SELECT count(*) FROM reviews r2
    WHERE r2.company_id = r.company_id
    AND r2.moderation_status = 'approved'
  ) >= 5 THEN r.role_title ELSE NULL END AS role_title,
  CASE WHEN (
    SELECT count(*) FROM reviews r2
    WHERE r2.company_id = r.company_id
    AND r2.moderation_status = 'approved'
  ) >= 5 THEN r.role_level ELSE NULL END AS role_level,
  CASE WHEN (
    SELECT count(*) FROM reviews r2
    WHERE r2.company_id = r.company_id
    AND r2.moderation_status = 'approved'
  ) >= 5 THEN r.department ELSE NULL END AS department,
  CASE WHEN (
    SELECT count(*) FROM reviews r2
    WHERE r2.company_id = r.company_id
    AND r2.moderation_status = 'approved'
  ) >= 5 THEN r.tenure_range ELSE NULL END AS tenure_range,
  r.employment_status,
  r.employment_type,
  r.recommend_to_friend,
  r.ceo_approval,
  r.helpful_count,
  r.salary_range,
  r.market_alignment,
  r.pay_transparency,
  r.did_interview,
  r.interview_experience_rating,
  r.interview_count,
  r.interview_difficulty,
  r.interview_description,
  r.interview_tips,
  CASE WHEN (
    SELECT count(*) FROM reviews r2
    WHERE r2.company_id = r.company_id
    AND r2.moderation_status = 'approved'
  ) >= 5 THEN r.age_range ELSE NULL END AS age_range,
  CASE WHEN (
    SELECT count(*) FROM reviews r2
    WHERE r2.company_id = r.company_id
    AND r2.moderation_status = 'approved'
  ) >= 5 THEN r.gender ELSE NULL END AS gender,
  CASE WHEN (
    SELECT count(*) FROM reviews r2
    WHERE r2.company_id = r.company_id
    AND r2.moderation_status = 'approved'
  ) >= 5 THEN r.ethnicity ELSE NULL END AS ethnicity,
  CASE WHEN (
    SELECT count(*) FROM reviews r2
    WHERE r2.company_id = r.company_id
    AND r2.moderation_status = 'approved'
  ) >= 5 THEN r.education_level ELSE NULL END AS education_level,
  -- Fuzz created_at by +/- up to 36 hours deterministically based on review ID
  r.created_at + (interval '1 second' * (abs(('x' || left(md5(r.id::text), 8))::bit(32)::int) % 259200 - 129600)) AS created_at,
  r.updated_at,
  r.base_salary_amount,
  r.base_salary_currency,
  r.is_net_salary,
  r.allowances_amount,
  r.allowances_currency,
  r.bonus_amount,
  r.bonus_currency,
  r.hidden_fields
FROM reviews r
WHERE r.moderation_status = 'approved';

-- Add demographic_suppression_threshold platform setting
INSERT INTO public.platform_settings (setting_key, setting_value, setting_type, description)
VALUES (
  'demographic_suppression_threshold',
  '5',
  'number',
  'Minimum number of approved reviews before demographic data is shown publicly for a company. Protects anonymity in small teams.'
)
ON CONFLICT (setting_key) DO NOTHING;