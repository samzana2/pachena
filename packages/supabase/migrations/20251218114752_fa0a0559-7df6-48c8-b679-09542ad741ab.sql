-- Create table for company claim requests
CREATE TABLE public.company_claim_requests (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    full_name TEXT NOT NULL,
    work_email TEXT NOT NULL,
    company_name TEXT NOT NULL,
    job_title TEXT,
    message TEXT,
    status TEXT NOT NULL DEFAULT 'pending',
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    reviewed_at TIMESTAMP WITH TIME ZONE,
    reviewed_by UUID
);

-- Enable RLS
ALTER TABLE public.company_claim_requests ENABLE ROW LEVEL SECURITY;

-- Allow anyone to submit a claim request (public form)
CREATE POLICY "Anyone can submit claim requests"
ON public.company_claim_requests
FOR INSERT
WITH CHECK (true);

-- Only admins can view/update claim requests
CREATE POLICY "Admins can view all claim requests"
ON public.company_claim_requests
FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update claim requests"
ON public.company_claim_requests
FOR UPDATE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));