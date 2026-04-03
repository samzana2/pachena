-- Add supervisor contact and authorization confirmation to company_claim_requests
ALTER TABLE public.company_claim_requests 
ADD COLUMN supervisor_name text,
ADD COLUMN supervisor_email text,
ADD COLUMN authorization_confirmed boolean NOT NULL DEFAULT false;