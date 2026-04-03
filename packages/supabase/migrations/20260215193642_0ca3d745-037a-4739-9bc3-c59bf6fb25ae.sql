
-- Table to track competition rounds
CREATE TABLE public.ambassador_competitions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  round_number integer NOT NULL DEFAULT 1,
  target_reviews integer NOT NULL DEFAULT 25,
  prize_amount numeric NOT NULL DEFAULT 100,
  prize_currency text NOT NULL DEFAULT 'USD',
  winner_id uuid REFERENCES public.referrers(id) ON DELETE SET NULL,
  started_at timestamp with time zone NOT NULL DEFAULT now(),
  ended_at timestamp with time zone,
  status text NOT NULL DEFAULT 'active',
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.ambassador_competitions ENABLE ROW LEVEL SECURITY;

-- Everyone can read competitions (ambassadors need to see current round)
CREATE POLICY "Competitions are publicly readable"
ON public.ambassador_competitions
FOR SELECT
USING (true);

-- Only admins can manage competitions
CREATE POLICY "Admins can manage competitions"
ON public.ambassador_competitions
FOR ALL
USING (is_admin(auth.uid()))
WITH CHECK (is_admin(auth.uid()));

-- Insert the first active round
INSERT INTO public.ambassador_competitions (round_number, target_reviews, prize_amount, status)
VALUES (1, 25, 100, 'active');
