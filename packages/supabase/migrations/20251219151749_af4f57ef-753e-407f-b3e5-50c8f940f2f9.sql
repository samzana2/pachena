-- Fix the security definer view issue by explicitly setting SECURITY INVOKER
DROP VIEW IF EXISTS public.claim_requests_list;

CREATE VIEW public.claim_requests_list
WITH (security_invoker = true)
AS
SELECT 
  id,
  company_name,
  status,
  created_at,
  work_email,
  reviewed_at
FROM public.company_claim_requests;