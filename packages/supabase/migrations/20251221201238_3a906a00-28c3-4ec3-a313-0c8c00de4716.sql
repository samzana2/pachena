-- Drop the existing overly permissive SELECT policy on salaries
DROP POLICY IF EXISTS "Salaries are publicly readable" ON public.salaries;

-- Create a new policy that only allows admins to SELECT from the base table
-- Public access should go through the salaries_public view which excludes verification_token
CREATE POLICY "Admins can view salaries with tokens"
ON public.salaries FOR SELECT
TO authenticated
USING (public.is_admin(auth.uid()));

-- Recreate the salaries_public view with SECURITY INVOKER (safer than definer)
-- This view excludes the verification_token field
DROP VIEW IF EXISTS public.salaries_public;
CREATE VIEW public.salaries_public 
WITH (security_invoker = true) AS
SELECT 
    id,
    company_id,
    role_title,
    salary_min,
    salary_max,
    currency,
    created_at
FROM public.salaries;

-- Grant SELECT on the view to anon and authenticated roles
GRANT SELECT ON public.salaries_public TO anon;
GRANT SELECT ON public.salaries_public TO authenticated;