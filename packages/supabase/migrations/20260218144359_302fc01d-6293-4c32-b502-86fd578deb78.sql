
-- Create a public view for review_sections (similar to reviews_public)
-- Only shows approved sections, no sensitive fields
CREATE OR REPLACE VIEW public.review_sections_public AS
SELECT
  id,
  company_id,
  section_type,
  section_data,
  created_at
FROM public.review_sections
WHERE moderation_status = 'approved';

-- Grant access
GRANT SELECT ON public.review_sections_public TO anon, authenticated;
