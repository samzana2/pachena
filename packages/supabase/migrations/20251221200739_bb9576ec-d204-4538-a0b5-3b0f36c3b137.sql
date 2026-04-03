-- Drop the overly permissive INSERT policy that allows any authenticated user to create companies
DROP POLICY IF EXISTS "Authenticated users can create companies" ON public.companies;

-- Create a new policy that only allows admins to create companies
-- This ensures companies can only be created through:
-- 1. Admin approval of company_requests (via AdminCompanyRequests page)
-- 2. Admin approval of company claims (via manage-claims edge function with service role)
CREATE POLICY "Admins can create companies"
ON public.companies FOR INSERT
TO authenticated
WITH CHECK (public.is_admin(auth.uid()));