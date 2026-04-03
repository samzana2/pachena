-- Remove the overly permissive UPDATE policy on verification_sessions
-- Edge functions use SUPABASE_SERVICE_ROLE_KEY which bypasses RLS
DROP POLICY IF EXISTS "Sessions can be updated" ON public.verification_sessions;