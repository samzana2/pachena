-- Add approved_review_count column to referrers table
ALTER TABLE public.referrers 
ADD COLUMN approved_review_count integer NOT NULL DEFAULT 0;

-- Add comment for clarity
COMMENT ON COLUMN public.referrers.review_count IS 'Total reviews submitted using this referral code';
COMMENT ON COLUMN public.referrers.approved_review_count IS 'Reviews that were approved (used for payment calculation)';