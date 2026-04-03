-- 2. Create a helper function for claim request access (super_admin or support_admin only)
CREATE OR REPLACE FUNCTION public.has_claim_access(_user_id uuid)
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
      AND role IN ('super_admin', 'support_admin')
  )
$$;

-- 3. Create admin_audit_logs table for tracking sensitive data access
CREATE TABLE public.admin_audit_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_user_id uuid NOT NULL,
  action text NOT NULL,
  claim_request_id uuid,
  timestamp timestamp with time zone NOT NULL DEFAULT now(),
  metadata jsonb DEFAULT '{}'::jsonb
);

-- Enable RLS on audit logs
ALTER TABLE public.admin_audit_logs ENABLE ROW LEVEL SECURITY;

-- Only super_admins can view audit logs
CREATE POLICY "Super admins can view audit logs"
ON public.admin_audit_logs
FOR SELECT
USING (public.has_role(auth.uid(), 'super_admin'));

-- Service role can insert audit logs (via edge functions)
CREATE POLICY "Service role can insert audit logs"
ON public.admin_audit_logs
FOR INSERT
WITH CHECK (true);

-- 4. Drop existing RLS policies on company_claim_requests
DROP POLICY IF EXISTS "Admins can view all claim requests" ON public.company_claim_requests;
DROP POLICY IF EXISTS "Admins can update claim requests" ON public.company_claim_requests;
DROP POLICY IF EXISTS "Anyone can submit claim requests" ON public.company_claim_requests;

-- 5. Create new stricter RLS policies for company_claim_requests
-- Only super_admin or support_admin can SELECT
CREATE POLICY "Claim admins can view claim requests"
ON public.company_claim_requests
FOR SELECT
USING (public.has_claim_access(auth.uid()));

-- Only super_admin or support_admin can UPDATE
CREATE POLICY "Claim admins can update claim requests"
ON public.company_claim_requests
FOR UPDATE
USING (public.has_claim_access(auth.uid()));

-- Anyone can still submit claim requests (public form)
CREATE POLICY "Anyone can submit claim requests"
ON public.company_claim_requests
FOR INSERT
WITH CHECK (true);

-- 6. Add encrypted columns to company_claim_requests for sensitive data
ALTER TABLE public.company_claim_requests 
ADD COLUMN IF NOT EXISTS phone_number_encrypted text,
ADD COLUMN IF NOT EXISTS supervisor_name_encrypted text,
ADD COLUMN IF NOT EXISTS supervisor_email_encrypted text,
ADD COLUMN IF NOT EXISTS anonymized_at timestamp with time zone;

-- 7. Create a view for list view (minimal data exposure)
CREATE OR REPLACE VIEW public.claim_requests_list AS
SELECT 
  id,
  company_name,
  status,
  created_at,
  work_email,
  reviewed_at
FROM public.company_claim_requests;

-- 8. Update Constants for new roles in app_role
-- (This is handled automatically by the enum addition)