-- Create is_admin function for checking any admin role
CREATE OR REPLACE FUNCTION public.is_admin(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role IN ('admin', 'super_admin', 'support_admin')
  )
$$;

-- Add moderation fields to reviews table
ALTER TABLE public.reviews ADD COLUMN IF NOT EXISTS flagged boolean DEFAULT false;
ALTER TABLE public.reviews ADD COLUMN IF NOT EXISTS moderation_status text DEFAULT 'approved';
ALTER TABLE public.reviews ADD COLUMN IF NOT EXISTS moderation_notes text;
ALTER TABLE public.reviews ADD COLUMN IF NOT EXISTS moderated_at timestamp with time zone;
ALTER TABLE public.reviews ADD COLUMN IF NOT EXISTS moderated_by uuid;

-- Create policy for admins to update reviews (for moderation)
CREATE POLICY "Admins can update reviews for moderation" 
ON public.reviews 
FOR UPDATE 
USING (is_admin(auth.uid()));

-- Create policy for admins to view all audit logs (not just super_admin)
DROP POLICY IF EXISTS "Super admins can view audit logs" ON public.admin_audit_logs;
CREATE POLICY "Admins can view audit logs" 
ON public.admin_audit_logs 
FOR SELECT 
USING (is_admin(auth.uid()));

-- Allow admins to insert audit logs
DROP POLICY IF EXISTS "Service role can insert audit logs" ON public.admin_audit_logs;
CREATE POLICY "Admins can insert audit logs" 
ON public.admin_audit_logs 
FOR INSERT 
WITH CHECK (is_admin(auth.uid()));