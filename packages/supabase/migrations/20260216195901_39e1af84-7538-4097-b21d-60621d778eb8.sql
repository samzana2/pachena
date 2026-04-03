
-- Fix 1: Restrict user_roles INSERT/DELETE to super_admin only
DROP POLICY IF EXISTS "Admins can insert roles" ON public.user_roles;
DROP POLICY IF EXISTS "Admins can delete roles" ON public.user_roles;

CREATE POLICY "Super admins can insert roles"
ON public.user_roles FOR INSERT
TO authenticated
WITH CHECK (public.has_role(auth.uid(), 'super_admin'::app_role));

CREATE POLICY "Super admins can delete roles"
ON public.user_roles FOR DELETE
TO authenticated
USING (public.has_role(auth.uid(), 'super_admin'::app_role));

-- Fix 2: Create vote tracking table for helpful count deduplication
CREATE TABLE public.review_helpful_votes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  review_id UUID NOT NULL REFERENCES public.reviews(id) ON DELETE CASCADE,
  voter_ip_hash TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(review_id, voter_ip_hash)
);

ALTER TABLE public.review_helpful_votes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can insert votes"
ON public.review_helpful_votes FOR INSERT
WITH CHECK (true);

-- No SELECT/UPDATE/DELETE for public - votes are write-only
CREATE POLICY "Admins can view votes"
ON public.review_helpful_votes FOR SELECT
USING (public.is_admin(auth.uid()));

-- Update increment_helpful_count to require voter_ip_hash and prevent duplicates
CREATE OR REPLACE FUNCTION public.increment_helpful_count(
  p_review_id uuid,
  p_voter_ip_hash text
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_inserted boolean := false;
BEGIN
  -- Validate inputs
  IF p_review_id IS NULL OR p_voter_ip_hash IS NULL OR length(p_voter_ip_hash) < 16 THEN
    RETURN false;
  END IF;

  -- Try to insert vote (will fail silently if duplicate)
  INSERT INTO public.review_helpful_votes (review_id, voter_ip_hash)
  VALUES (p_review_id, p_voter_ip_hash)
  ON CONFLICT (review_id, voter_ip_hash) DO NOTHING;

  -- Check if the insert succeeded
  GET DIAGNOSTICS v_inserted = ROW_COUNT;

  -- Only increment if vote was new
  IF v_inserted THEN
    UPDATE reviews
    SET helpful_count = COALESCE(helpful_count, 0) + 1
    WHERE id = p_review_id;
    RETURN true;
  END IF;

  RETURN false;
END;
$$;
