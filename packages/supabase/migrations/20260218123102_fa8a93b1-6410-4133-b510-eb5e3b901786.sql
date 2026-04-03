
-- Create review_sessions table
CREATE TABLE public.review_sessions (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id uuid NOT NULL REFERENCES public.companies(id),
  session_token_hash text NOT NULL,
  verification_session_id uuid REFERENCES public.verification_sessions(id),
  verification_type text NOT NULL DEFAULT 'unverified',
  referral_code text,
  referrer_id uuid REFERENCES public.referrers(id),
  expires_at timestamptz NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Create review_sections table
CREATE TABLE public.review_sections (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  review_session_id uuid NOT NULL REFERENCES public.review_sessions(id),
  company_id uuid NOT NULL REFERENCES public.companies(id),
  section_type text NOT NULL,
  section_data jsonb NOT NULL DEFAULT '{}'::jsonb,
  moderation_status text NOT NULL DEFAULT 'pending',
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Add review_session_id to reviews table for linking
ALTER TABLE public.reviews ADD COLUMN review_session_id uuid REFERENCES public.review_sessions(id);

-- Enable RLS
ALTER TABLE public.review_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.review_sections ENABLE ROW LEVEL SECURITY;

-- RLS for review_sessions: service role inserts via edge functions, admins can read
CREATE POLICY "Anyone can create review sessions"
  ON public.review_sessions FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Admins can view review sessions"
  ON public.review_sessions FOR SELECT
  USING (is_admin(auth.uid()));

CREATE POLICY "Admins can update review sessions"
  ON public.review_sessions FOR UPDATE
  USING (is_admin(auth.uid()));

-- RLS for review_sections: service role inserts via edge functions, admins can read
CREATE POLICY "Anyone can create review sections"
  ON public.review_sections FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Admins can view review sections"
  ON public.review_sections FOR SELECT
  USING (is_admin(auth.uid()));

CREATE POLICY "Admins can update review sections"
  ON public.review_sections FOR UPDATE
  USING (is_admin(auth.uid()));

-- Index for fast lookups
CREATE INDEX idx_review_sections_session_id ON public.review_sections(review_session_id);
CREATE INDEX idx_review_sessions_company_id ON public.review_sessions(company_id);
CREATE INDEX idx_reviews_session_id ON public.reviews(review_session_id);
