-- Add payout_rate to referrers table
ALTER TABLE public.referrers 
ADD COLUMN payout_rate numeric DEFAULT 5.00;

-- Create referrer_payouts table
CREATE TABLE public.referrer_payouts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  referrer_id uuid NOT NULL REFERENCES public.referrers(id) ON DELETE CASCADE,
  amount numeric NOT NULL,
  currency text NOT NULL DEFAULT 'USD',
  payout_date date NOT NULL,
  payment_method text NOT NULL,
  payment_reference text,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  created_by uuid NOT NULL
);

-- Create referrer_payout_reviews junction table
CREATE TABLE public.referrer_payout_reviews (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  payout_id uuid NOT NULL REFERENCES public.referrer_payouts(id) ON DELETE CASCADE,
  review_id uuid NOT NULL REFERENCES public.reviews(id) ON DELETE CASCADE,
  payout_amount numeric NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(review_id) -- Prevents double payments
);

-- Enable RLS
ALTER TABLE public.referrer_payouts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.referrer_payout_reviews ENABLE ROW LEVEL SECURITY;

-- RLS policies for referrer_payouts (immutable - SELECT and INSERT only)
CREATE POLICY "Admins can view payouts"
ON public.referrer_payouts
FOR SELECT
USING (is_admin(auth.uid()));

CREATE POLICY "Admins can insert payouts"
ON public.referrer_payouts
FOR INSERT
WITH CHECK (is_admin(auth.uid()));

-- RLS policies for referrer_payout_reviews (immutable - SELECT and INSERT only)
CREATE POLICY "Admins can view payout reviews"
ON public.referrer_payout_reviews
FOR SELECT
USING (is_admin(auth.uid()));

CREATE POLICY "Admins can insert payout reviews"
ON public.referrer_payout_reviews
FOR INSERT
WITH CHECK (is_admin(auth.uid()));