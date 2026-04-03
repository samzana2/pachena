-- Add flagged column to company_claim_requests table
ALTER TABLE company_claim_requests 
ADD COLUMN flagged BOOLEAN DEFAULT false;