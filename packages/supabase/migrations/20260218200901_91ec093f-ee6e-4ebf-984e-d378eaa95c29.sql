
-- Drop existing functions to change return types
DROP FUNCTION IF EXISTS public.increment_approved_review_count(text);
DROP FUNCTION IF EXISTS public.decrement_approved_review_count(text);
DROP FUNCTION IF EXISTS public.decrement_review_count(text);

-- Recreate with input validation and boolean return type
CREATE OR REPLACE FUNCTION public.increment_approved_review_count(p_referral_code text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_updated integer;
BEGIN
  IF p_referral_code IS NULL OR p_referral_code = '' OR length(p_referral_code) > 50 THEN
    RETURN false;
  END IF;

  UPDATE public.referrers
  SET approved_review_count = approved_review_count + 1
  WHERE referral_code = p_referral_code;

  GET DIAGNOSTICS v_updated = ROW_COUNT;
  RETURN v_updated > 0;
END;
$$;

CREATE OR REPLACE FUNCTION public.decrement_approved_review_count(p_referral_code text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_updated integer;
BEGIN
  IF p_referral_code IS NULL OR p_referral_code = '' OR length(p_referral_code) > 50 THEN
    RETURN false;
  END IF;

  UPDATE public.referrers
  SET approved_review_count = GREATEST(approved_review_count - 1, 0)
  WHERE referral_code = p_referral_code;

  GET DIAGNOSTICS v_updated = ROW_COUNT;
  RETURN v_updated > 0;
END;
$$;

CREATE OR REPLACE FUNCTION public.decrement_review_count(p_referral_code text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_updated integer;
BEGIN
  IF p_referral_code IS NULL OR p_referral_code = '' OR length(p_referral_code) > 50 THEN
    RETURN false;
  END IF;

  UPDATE public.referrers
  SET review_count = GREATEST(review_count - 1, 0)
  WHERE referral_code = p_referral_code;

  GET DIAGNOSTICS v_updated = ROW_COUNT;
  RETURN v_updated > 0;
END;
$$;

-- Remove overly broad public SELECT on reviews table
-- Public access is served through the reviews_public view
DROP POLICY IF EXISTS "Anyone can view approved reviews" ON public.reviews;
