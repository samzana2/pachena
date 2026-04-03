-- Add IP tracking to verification_sessions for rate limiting
ALTER TABLE verification_sessions 
ADD COLUMN IF NOT EXISTS request_ip text;

-- Create index for efficient rate limit queries on IP
CREATE INDEX IF NOT EXISTS idx_verification_sessions_ip_created 
ON verification_sessions(request_ip, created_at DESC);

-- Create index for domain + company + time lookups (for analytics)
CREATE INDEX IF NOT EXISTS idx_verification_sessions_domain_company_created 
ON verification_sessions(email_domain, company_id, created_at DESC);