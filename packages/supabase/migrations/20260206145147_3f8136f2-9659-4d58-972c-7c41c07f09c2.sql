-- Add RLS policy to allow admins to delete referrers
CREATE POLICY "Admins can delete referrers"
ON public.referrers
FOR DELETE
TO authenticated
USING (is_admin(auth.uid()));