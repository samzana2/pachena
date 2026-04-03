-- Add admin policy for managing company benefits
CREATE POLICY "Admins can manage all benefits"
ON public.company_benefits FOR ALL
TO authenticated
USING (public.is_admin(auth.uid()))
WITH CHECK (public.is_admin(auth.uid()));