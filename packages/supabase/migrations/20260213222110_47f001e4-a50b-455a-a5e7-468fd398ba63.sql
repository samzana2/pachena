
-- Create a public leaderboard view with only non-sensitive columns
CREATE OR REPLACE VIEW public.referrers_leaderboard AS
SELECT 
  id,
  full_name,
  approved_review_count,
  review_count,
  status,
  partner_status
FROM public.referrers
WHERE status = 'approved' AND partner_status = 'active';

-- Drop the overly permissive SELECT policy
DROP POLICY IF EXISTS "Allow referrer lookup by email" ON public.referrers;
