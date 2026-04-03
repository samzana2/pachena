-- Add phone and company_website columns to company_claim_requests
ALTER TABLE public.company_claim_requests 
ADD COLUMN phone_number text,
ADD COLUMN company_website text;

-- Create employer_feedback table for private feedback
CREATE TABLE public.employer_feedback (
    id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
    title text NOT NULL,
    content text NOT NULL,
    created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.employer_feedback ENABLE ROW LEVEL SECURITY;

-- Only verified employers can view feedback for their company
CREATE POLICY "Verified employers can view their company feedback"
ON public.employer_feedback
FOR SELECT
USING (
    EXISTS (
        SELECT 1 FROM public.companies
        WHERE companies.id = employer_feedback.company_id
        AND companies.claimed_by = auth.uid()
        AND companies.is_claimed = true
    )
);

-- Anyone can submit feedback (anonymous)
CREATE POLICY "Anyone can submit feedback"
ON public.employer_feedback
FOR INSERT
WITH CHECK (true);