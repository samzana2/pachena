
-- Add encrypted contact email column to paystub_verifications
ALTER TABLE public.paystub_verifications
ADD COLUMN contact_email_encrypted TEXT;
