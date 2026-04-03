-- Add RLS policy for admins to update companies
CREATE POLICY "Admins can update companies" 
ON public.companies 
FOR UPDATE 
USING (is_admin(auth.uid()));