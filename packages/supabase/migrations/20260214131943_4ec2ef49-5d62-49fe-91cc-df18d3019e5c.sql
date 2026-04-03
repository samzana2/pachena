CREATE OR REPLACE VIEW public.referrers_leaderboard
WITH (security_invoker = false) AS
SELECT id, full_name, approved_review_count, review_count, status, partner_status
FROM public.referrers
WHERE status = 'approved' AND partner_status = 'active';