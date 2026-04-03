-- Remove motivation column from referrers table
ALTER TABLE public.referrers 
DROP COLUMN IF EXISTS motivation;