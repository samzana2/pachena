
-- Fix: Make the view use SECURITY INVOKER (Postgres 15+ default)
-- This ensures RLS policies of the underlying table are respected
-- But since review_sections has a public SELECT policy for approved only via the view,
-- we need to use security_invoker = true and rely on anon having SELECT on the view
DROP VIEW IF EXISTS public.review_sections_public;

CREATE VIEW public.review_sections_public
WITH (security_invoker = true) AS
SELECT
  id,
  company_id,
  section_type,
  section_data,
  created_at
FROM public.review_sections
WHERE moderation_status = 'approved';

GRANT SELECT ON public.review_sections_public TO anon, authenticated;
