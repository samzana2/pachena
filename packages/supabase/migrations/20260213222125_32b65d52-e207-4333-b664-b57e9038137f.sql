
-- Fix: Make the view SECURITY INVOKER to avoid privilege escalation
DROP VIEW IF EXISTS public.referrers_leaderboard;
CREATE VIEW public.referrers_leaderboard 
WITH (security_invoker = true) AS
SELECT 
  id,
  full_name,
  approved_review_count,
  review_count,
  status,
  partner_status
FROM public.referrers
WHERE status = 'approved' AND partner_status = 'active';
