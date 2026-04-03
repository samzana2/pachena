
-- Create review_rewards table
CREATE TABLE public.review_rewards (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  review_id UUID NOT NULL UNIQUE REFERENCES public.reviews(id) ON DELETE CASCADE,
  phone_number_encrypted TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  sent_at TIMESTAMP WITH TIME ZONE,
  sent_by UUID
);

-- Enable RLS
ALTER TABLE public.review_rewards ENABLE ROW LEVEL SECURITY;

-- Public INSERT (reviewer has no auth session)
CREATE POLICY "Anyone can insert review rewards"
ON public.review_rewards
FOR INSERT
WITH CHECK (true);

-- Admin-only SELECT
CREATE POLICY "Admins can view review rewards"
ON public.review_rewards
FOR SELECT
USING (is_admin(auth.uid()));

-- Admin-only UPDATE
CREATE POLICY "Admins can update review rewards"
ON public.review_rewards
FOR UPDATE
USING (is_admin(auth.uid()));

-- Admin-only DELETE
CREATE POLICY "Admins can delete review rewards"
ON public.review_rewards
FOR DELETE
USING (is_admin(auth.uid()));

-- Insert the feature flag
INSERT INTO public.feature_flags (flag_key, flag_label, description, category, is_enabled)
VALUES ('review_rewards_enabled', 'Review Rewards', 'Show reward prompt after review submission during promotional periods', 'promotions', false);
