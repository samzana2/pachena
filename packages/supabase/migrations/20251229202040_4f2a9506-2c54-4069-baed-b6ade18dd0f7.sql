-- Add advice column to reviews table for storing prospective employee advice
ALTER TABLE public.reviews ADD COLUMN IF NOT EXISTS advice TEXT;