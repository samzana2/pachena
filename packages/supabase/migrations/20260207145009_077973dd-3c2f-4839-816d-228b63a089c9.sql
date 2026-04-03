-- Add phone_number column to referrers table for payout and verification
ALTER TABLE public.referrers
ADD COLUMN phone_number text;