-- Add employment_type column to reviews table
ALTER TABLE public.reviews 
ADD COLUMN employment_type text;