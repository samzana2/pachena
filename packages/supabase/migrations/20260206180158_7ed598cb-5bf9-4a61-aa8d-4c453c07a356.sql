-- Part 1: Add new columns to referrers table
ALTER TABLE public.referrers 
ADD COLUMN IF NOT EXISTS linkedin_url text,
ADD COLUMN IF NOT EXISTS admin_notes text,
ADD COLUMN IF NOT EXISTS partner_status text DEFAULT 'active',
ADD COLUMN IF NOT EXISTS last_activity_at timestamptz;

-- Part 2: Add referrer_id to reviews table
ALTER TABLE public.reviews 
ADD COLUMN IF NOT EXISTS referrer_id uuid REFERENCES public.referrers(id) ON DELETE SET NULL;

-- Part 3: Add referrer_id to verification_sessions table
ALTER TABLE public.verification_sessions 
ADD COLUMN IF NOT EXISTS referrer_id uuid REFERENCES public.referrers(id) ON DELETE SET NULL;

-- Part 4: Create index for efficient queries
CREATE INDEX IF NOT EXISTS idx_reviews_referrer_id ON public.reviews(referrer_id);
CREATE INDEX IF NOT EXISTS idx_verification_sessions_referrer_id ON public.verification_sessions(referrer_id);

-- Part 5: Add unique constraint on referral_code if not exists
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'referrers_referral_code_key' 
    AND conrelid = 'public.referrers'::regclass
  ) THEN
    ALTER TABLE public.referrers ADD CONSTRAINT referrers_referral_code_key UNIQUE (referral_code);
  END IF;
EXCEPTION WHEN duplicate_object THEN
  NULL;
END $$;

-- Part 6: Backfill referrer_id on existing reviews from referral_code
UPDATE public.reviews r
SET referrer_id = ref.id
FROM public.referrers ref
WHERE r.referral_code = ref.referral_code
  AND r.referral_code IS NOT NULL
  AND r.referrer_id IS NULL;