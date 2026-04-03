-- Fix 1: Remove the dangerous public UPDATE policy on verification_sessions
-- Edge functions use service role keys and don't need public UPDATE access
DROP POLICY IF EXISTS "Sessions can be updated" ON public.verification_sessions;

-- Fix 2: Ensure verification_sessions has no SELECT/UPDATE/DELETE policies for public
-- (INSERT is needed for creating sessions, but is already protected by token hashing and rate limiting)
-- The table already has RLS enabled (from migration 20251219102656), just confirm no dangerous policies exist
DROP POLICY IF EXISTS "Verification sessions are readable by everyone" ON public.verification_sessions;
DROP POLICY IF EXISTS "Anyone can update verification sessions" ON public.verification_sessions;
DROP POLICY IF EXISTS "Anyone can delete verification sessions" ON public.verification_sessions;

-- Fix 3: Add admin SELECT policy for debugging purposes (optional but useful)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'verification_sessions' 
    AND policyname = 'Admins can view verification sessions'
  ) THEN
    CREATE POLICY "Admins can view verification sessions"
    ON public.verification_sessions
    FOR SELECT
    TO authenticated
    USING (public.is_admin(auth.uid()));
  END IF;
END $$;

-- Fix 4: Verify job_applications table has proper RLS enabled and policies
-- This table already has proper policies from the context, but let's ensure RLS is enabled
ALTER TABLE public.job_applications ENABLE ROW LEVEL SECURITY;

-- Fix 5: Add admin access to job_applications for support purposes
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'job_applications' 
    AND policyname = 'Admins can view all job applications'
  ) THEN
    CREATE POLICY "Admins can view all job applications"
    ON public.job_applications
    FOR SELECT
    TO authenticated
    USING (public.is_admin(auth.uid()));
  END IF;
END $$;