-- Fix overly permissive UPDATE policy on verification_sessions
-- Only allow updates from the edge function via service role (not direct client access)
DROP POLICY IF EXISTS "Sessions can be updated" ON public.verification_sessions;

-- No public UPDATE policy needed since edge functions use service role key