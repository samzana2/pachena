
-- Add a public SELECT policy for approved review sections
-- This is needed because the view uses security_invoker = true
CREATE POLICY "Anyone can view approved review sections"
ON public.review_sections
FOR SELECT
USING (moderation_status = 'approved');
