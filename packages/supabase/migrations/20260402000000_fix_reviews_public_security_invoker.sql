-- Rollback:
--   ALTER VIEW public.reviews_public SET (security_invoker = off);
--   ALTER VIEW public.referrers_leaderboard SET (security_invoker = off);

-- Fix views that were recreated without security_invoker, reverting to SECURITY DEFINER.
-- Ensures RLS of the querying user is enforced rather than the view creator's permissions.
ALTER VIEW public.reviews_public SET (security_invoker = on);
ALTER VIEW public.referrers_leaderboard SET (security_invoker = on);
