
-- Rename the table
ALTER TABLE paystub_verifications RENAME TO employment_verifications;

-- Add a proper verification_method column
ALTER TABLE employment_verifications 
  ADD COLUMN verification_method text NOT NULL DEFAULT 'paystub';

-- Backfill from the email_domain hack
UPDATE employment_verifications 
  SET verification_method = 'linkedin' 
  WHERE email_domain = 'linkedin-verified';

-- Purge LinkedIn URLs from file_path for decided verifications
UPDATE employment_verifications 
  SET file_path = 'linkedin-verified-purged' 
  WHERE email_domain = 'linkedin-verified' 
    AND status IN ('approved', 'rejected');

-- Purge paystub file references for decided verifications (files already deleted from storage)
UPDATE employment_verifications
  SET file_path = 'paystub-purged'
  WHERE email_domain != 'linkedin-verified'
    AND status IN ('approved', 'rejected');
