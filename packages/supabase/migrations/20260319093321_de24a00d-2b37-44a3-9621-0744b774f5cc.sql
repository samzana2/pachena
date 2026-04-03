
CREATE TABLE public.session_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  review_session_id uuid NOT NULL,
  event_type text NOT NULL,
  event_data jsonb DEFAULT '{}'::jsonb,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- RLS: anyone can insert (anonymous users), admins can read
ALTER TABLE public.session_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can insert session events"
  ON public.session_events FOR INSERT
  TO public
  WITH CHECK (true);

CREATE POLICY "Admins can view session events"
  ON public.session_events FOR SELECT
  TO public
  USING (is_admin(auth.uid()));

-- Index for fast lookups by session
CREATE INDEX idx_session_events_session_id ON public.session_events (review_session_id);
CREATE INDEX idx_session_events_created_at ON public.session_events (created_at);
