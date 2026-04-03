
-- Create review_similarity_flags table
CREATE TABLE public.review_similarity_flags (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  review_id UUID NOT NULL REFERENCES public.reviews(id),
  matched_review_id UUID REFERENCES public.reviews(id),
  flag_type TEXT NOT NULL,
  details JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.review_similarity_flags ENABLE ROW LEVEL SECURITY;

-- Admin-only access
CREATE POLICY "Admins can view similarity flags"
  ON public.review_similarity_flags
  FOR SELECT
  USING (is_admin(auth.uid()));

CREATE POLICY "Service role can insert similarity flags"
  ON public.review_similarity_flags
  FOR INSERT
  WITH CHECK (true);

-- Index for fast lookups
CREATE INDEX idx_review_similarity_flags_review_id ON public.review_similarity_flags(review_id);
CREATE INDEX idx_review_similarity_flags_created_at ON public.review_similarity_flags(created_at DESC);
