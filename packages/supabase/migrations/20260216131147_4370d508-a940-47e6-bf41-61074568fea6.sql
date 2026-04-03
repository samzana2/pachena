
CREATE OR REPLACE FUNCTION public.increment_helpful_count(p_review_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE reviews
  SET helpful_count = COALESCE(helpful_count, 0) + 1
  WHERE id = p_review_id;
END;
$$;
