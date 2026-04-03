-- Create referrers table for external advocates
CREATE TABLE public.referrers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text NOT NULL UNIQUE,
  full_name text NOT NULL,
  motivation text,
  referral_code text UNIQUE,
  status text NOT NULL DEFAULT 'pending',
  review_count integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  approved_at timestamptz,
  approved_by uuid
);

-- Add referral tracking to reviews
ALTER TABLE public.reviews 
ADD COLUMN referral_code text;

-- Enable RLS
ALTER TABLE public.referrers ENABLE ROW LEVEL SECURITY;

-- RLS Policies for referrers table
CREATE POLICY "Anyone can apply to be a referrer"
  ON public.referrers FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Admins can view all referrers"
  ON public.referrers FOR SELECT
  USING (is_admin(auth.uid()));

CREATE POLICY "Admins can update referrers"
  ON public.referrers FOR UPDATE
  USING (is_admin(auth.uid()));

CREATE POLICY "Referrers can view their own record by email"
  ON public.referrers FOR SELECT
  USING (email = (auth.jwt() ->> 'email'));

-- Create index for faster referral code lookups
CREATE INDEX idx_referrers_referral_code ON public.referrers(referral_code) WHERE referral_code IS NOT NULL;

-- Create index for reviews referral tracking
CREATE INDEX idx_reviews_referral_code ON public.reviews(referral_code) WHERE referral_code IS NOT NULL;