-- Fix: Remove the broad public SELECT policy on salaries base table
-- Client code already uses salaries_public view which excludes verification_token
DROP POLICY IF EXISTS "Salaries are publicly readable" ON public.salaries;