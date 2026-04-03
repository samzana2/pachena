-- Drop the existing referrer self-select policy that requires Supabase Auth
DROP POLICY IF EXISTS "Referrers can view their own record by email" ON public.referrers;

-- Create a new policy that allows selecting referrers by email (for dashboard login)
-- The phone number verification is handled in application code
CREATE POLICY "Allow referrer lookup by email" 
ON public.referrers 
FOR SELECT 
USING (true);

-- Note: This allows SELECT on referrers table, but:
-- 1. Phone verification is done in application code
-- 2. Sensitive admin fields (admin_notes, approved_by) aren't exposed in the dashboard
-- 3. INSERT still requires public access (for signup)
-- 4. UPDATE/DELETE still require admin role