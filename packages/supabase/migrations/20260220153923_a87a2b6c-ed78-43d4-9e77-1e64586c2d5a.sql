
-- Add redactions JSONB column to review_sections
ALTER TABLE public.review_sections
  ADD COLUMN redactions jsonb DEFAULT '[]'::jsonb;

-- Update the review_sections_public view to include redactions so the frontend can apply them
DROP VIEW IF EXISTS public.review_sections_public;
CREATE VIEW public.review_sections_public AS
SELECT
  id,
  company_id,
  section_data,
  created_at,
  section_type,
  redactions
FROM public.review_sections
WHERE moderation_status = 'approved';
