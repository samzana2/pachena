-- Create table for individual review reports
CREATE TABLE public.review_reports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  review_id uuid NOT NULL REFERENCES public.reviews(id) ON DELETE CASCADE,
  reason text NOT NULL,
  details text,
  reporter_ip text,
  created_at timestamptz DEFAULT now()
);

-- Index for lookups by review
CREATE INDEX idx_review_reports_review_id ON public.review_reports(review_id);

-- Index for IP-based rate limiting
CREATE INDEX idx_review_reports_ip_time ON public.review_reports(reporter_ip, created_at);

-- Enable Row Level Security
ALTER TABLE public.review_reports ENABLE ROW LEVEL SECURITY;

-- Admins can view all reports
CREATE POLICY "Admins can view reports"
  ON public.review_reports FOR SELECT
  USING (is_admin(auth.uid()));

-- Anyone can insert reports (anonymous reporting)
CREATE POLICY "Anyone can insert reports"
  ON public.review_reports FOR INSERT
  WITH CHECK (true);

-- Add report count to reviews table for quick filtering/sorting
ALTER TABLE public.reviews ADD COLUMN report_count integer DEFAULT 0;