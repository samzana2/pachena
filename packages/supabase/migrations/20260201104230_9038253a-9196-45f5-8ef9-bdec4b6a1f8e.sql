-- Add public SELECT policy for approved reviews
-- This allows anonymous/unauthenticated users to view approved reviews

CREATE POLICY "Anyone can view approved reviews" 
ON public.reviews 
FOR SELECT 
USING (moderation_status = 'approved');