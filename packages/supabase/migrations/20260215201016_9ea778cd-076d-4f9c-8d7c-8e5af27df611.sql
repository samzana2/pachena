-- Create a simple rate limiting table for edge functions
CREATE TABLE public.rate_limit_entries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ip_address text NOT NULL,
  endpoint text NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Index for efficient lookups
CREATE INDEX idx_rate_limit_ip_endpoint_created ON public.rate_limit_entries (ip_address, endpoint, created_at DESC);

-- Enable RLS but restrict all access (only service role via edge functions)
ALTER TABLE public.rate_limit_entries ENABLE ROW LEVEL SECURITY;

-- Auto-cleanup old entries (older than 24 hours) 
CREATE OR REPLACE FUNCTION public.cleanup_old_rate_limits()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  DELETE FROM public.rate_limit_entries WHERE created_at < now() - interval '24 hours';
  RETURN NEW;
END;
$$;

CREATE TRIGGER cleanup_rate_limits
AFTER INSERT ON public.rate_limit_entries
FOR EACH STATEMENT
EXECUTE FUNCTION public.cleanup_old_rate_limits();