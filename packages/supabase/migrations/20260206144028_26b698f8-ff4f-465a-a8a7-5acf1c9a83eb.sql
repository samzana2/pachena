-- Create a function to increment approved_review_count for a referrer by referral code
CREATE OR REPLACE FUNCTION public.increment_approved_review_count(p_referral_code text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.referrers
  SET approved_review_count = approved_review_count + 1
  WHERE referral_code = p_referral_code;
END;
$$;