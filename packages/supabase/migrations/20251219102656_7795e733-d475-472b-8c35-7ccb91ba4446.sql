-- Task 1: Restrict verification_sessions SELECT policy
-- Remove the overly permissive policy that allows anyone to read session data
DROP POLICY IF EXISTS "Sessions can be accessed by anyone" ON public.verification_sessions;

-- Task 2: Create secure views for reviews and salaries that exclude verification_token
-- This prevents the token from being exposed via public API queries

-- Create a secure view for reviews without the verification token
CREATE OR REPLACE VIEW public.reviews_public AS
SELECT 
  id,
  company_id,
  title,
  pros,
  cons,
  rating,
  role_title,
  employment_status,
  recommend_to_friend,
  ceo_approval,
  helpful_count,
  created_at,
  updated_at
FROM public.reviews;

-- Create a secure view for salaries without the verification token
CREATE OR REPLACE VIEW public.salaries_public AS
SELECT 
  id,
  company_id,
  role_title,
  salary_min,
  salary_max,
  currency,
  created_at
FROM public.salaries;

-- Grant SELECT on views to authenticated and anon roles
GRANT SELECT ON public.reviews_public TO anon, authenticated;
GRANT SELECT ON public.salaries_public TO anon, authenticated;

-- Add a column to verification_sessions to track if review was submitted
ALTER TABLE public.verification_sessions 
ADD COLUMN IF NOT EXISTS review_submitted boolean DEFAULT false;

-- Add a column to store the review token hash for one-time validation
ALTER TABLE public.verification_sessions 
ADD COLUMN IF NOT EXISTS review_token_hash text;