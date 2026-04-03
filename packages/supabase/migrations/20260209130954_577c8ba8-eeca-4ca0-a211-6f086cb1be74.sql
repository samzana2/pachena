
ALTER TABLE public.verification_sessions
  ADD COLUMN IF NOT EXISTS verification_code_hash text,
  ADD COLUMN IF NOT EXISTS verification_code_expires_at timestamptz,
  ADD COLUMN IF NOT EXISTS verification_code_attempts integer NOT NULL DEFAULT 0;
