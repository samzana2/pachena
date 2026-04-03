-- Fix: Reviews table exposes verification tokens, private feedback, demographics to public
-- The reviews_public view already exists and properly filters sensitive columns
-- We need to restrict direct table access to admins and verified employers only

-- Drop the overly permissive public SELECT policy
DROP POLICY IF EXISTS "Reviews are publicly readable" ON public.reviews;

-- Create a policy that allows admins to view all review fields (for moderation)
CREATE POLICY "Admins can view all reviews" 
ON public.reviews 
FOR SELECT 
USING (is_admin(auth.uid()));

-- Create a policy that allows verified employers to view reviews for their company
-- (including private_feedback intended for them)
CREATE POLICY "Employers can view reviews for their company" 
ON public.reviews 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM companies 
    WHERE companies.id = reviews.company_id 
    AND companies.claimed_by = auth.uid() 
    AND companies.is_claimed = true
  )
);