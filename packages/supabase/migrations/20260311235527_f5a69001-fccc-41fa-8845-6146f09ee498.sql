
-- Add job seeding columns to jobs table
ALTER TABLE public.jobs
  ADD COLUMN IF NOT EXISTS source_url text,
  ADD COLUMN IF NOT EXISTS source_type text NOT NULL DEFAULT 'employer',
  ADD COLUMN IF NOT EXISTS posted_by_admin uuid,
  ADD COLUMN IF NOT EXISTS archived_at timestamptz,
  ADD COLUMN IF NOT EXISTS archive_reason text;

-- Set default expires_at to 30 days from now for new rows
ALTER TABLE public.jobs ALTER COLUMN expires_at SET DEFAULT (now() + interval '30 days');

-- Update public SELECT policy to also exclude archived jobs
DROP POLICY IF EXISTS "Anyone can view active jobs" ON public.jobs;
CREATE POLICY "Anyone can view active jobs" ON public.jobs
  FOR SELECT TO public
  USING (
    is_active = true
    AND archived_at IS NULL
    AND (expires_at IS NULL OR expires_at > now())
  );

-- Allow admins to INSERT jobs (for seeding)
DROP POLICY IF EXISTS "Admins can insert jobs" ON public.jobs;
CREATE POLICY "Admins can insert jobs" ON public.jobs
  FOR INSERT TO authenticated
  WITH CHECK (is_admin(auth.uid()));

-- Allow admins to UPDATE jobs (mark as filled, etc.)
DROP POLICY IF EXISTS "Admins can update jobs" ON public.jobs;
CREATE POLICY "Admins can update jobs" ON public.jobs
  FOR UPDATE TO authenticated
  USING (is_admin(auth.uid()));

-- Allow admins to SELECT all jobs (including archived)
DROP POLICY IF EXISTS "Admins can view all jobs" ON public.jobs;
CREATE POLICY "Admins can view all jobs" ON public.jobs
  FOR SELECT TO authenticated
  USING (is_admin(auth.uid()));
