DROP VIEW IF EXISTS public.review_sections_public;
CREATE VIEW public.review_sections_public WITH (security_invoker = on) AS
SELECT
  id,
  company_id,
  section_type,
  section_data,
  created_at,
  redactions
FROM public.review_sections
WHERE moderation_status = 'approved';