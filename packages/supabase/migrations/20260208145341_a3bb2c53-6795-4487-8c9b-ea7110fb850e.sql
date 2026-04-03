
-- Add verified_at timestamp to track when verification first occurred
ALTER TABLE public.verification_sessions
ADD COLUMN verified_at timestamp with time zone DEFAULT NULL;

-- Add an index for faster lookups when checking time elapsed
CREATE INDEX idx_verification_sessions_verified_at 
ON public.verification_sessions(verified_at);
