-- Add admin policies for job moderation
-- Admins need to be able to view, update, and delete job postings for content moderation

-- Allow admins to view all jobs (including inactive/expired)
CREATE POLICY "Admins can view all jobs"
ON public.jobs
FOR SELECT
USING (is_admin(auth.uid()));

-- Allow admins to update any job (mark as inactive, add warnings, etc.)
CREATE POLICY "Admins can update all jobs"
ON public.jobs
FOR UPDATE
USING (is_admin(auth.uid()));

-- Allow admins to delete any job (remove TOS violations)
CREATE POLICY "Admins can delete all jobs"
ON public.jobs
FOR DELETE
USING (is_admin(auth.uid()));