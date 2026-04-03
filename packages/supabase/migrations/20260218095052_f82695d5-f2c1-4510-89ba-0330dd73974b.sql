
CREATE OR REPLACE FUNCTION public.decrement_approved_review_count(p_referral_code text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  UPDATE public.referrers
  SET approved_review_count = GREATEST(approved_review_count - 1, 0)
  WHERE referral_code = p_referral_code;
END;
$$;

CREATE OR REPLACE FUNCTION public.decrement_review_count(p_referral_code text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  UPDATE public.referrers
  SET review_count = GREATEST(review_count - 1, 0)
  WHERE referral_code = p_referral_code;
END;
$$;
