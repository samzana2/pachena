-- Add policy to allow users to view their own claim requests
-- This ensures users can track the status of their own claims
-- while maintaining security for claims submitted by others
CREATE POLICY "Users can view their own claim requests"
ON public.company_claim_requests FOR SELECT
TO authenticated
USING (user_id = auth.uid());