-- Table to track which benefits employees confirm they received
CREATE TABLE public.benefit_confirmations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  benefit_id uuid REFERENCES public.company_benefits(id) ON DELETE CASCADE NOT NULL,
  review_id uuid REFERENCES public.reviews(id) ON DELETE CASCADE NOT NULL,
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  UNIQUE(benefit_id, review_id)
);

-- Enable RLS
ALTER TABLE public.benefit_confirmations ENABLE ROW LEVEL SECURITY;

-- Anyone can view confirmations (for calculating percentages)
CREATE POLICY "Benefit confirmations are publicly readable"
ON public.benefit_confirmations FOR SELECT
USING (true);

-- Anyone can insert confirmations (when submitting a review)
CREATE POLICY "Anyone can insert benefit confirmations"
ON public.benefit_confirmations FOR INSERT
WITH CHECK (true);