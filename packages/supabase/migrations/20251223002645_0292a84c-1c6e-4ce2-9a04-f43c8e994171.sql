-- Create waitlist table for capturing interest in paid plans
CREATE TABLE public.waitlist (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  email TEXT NOT NULL,
  company_name TEXT,
  plan_interest TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.waitlist ENABLE ROW LEVEL SECURITY;

-- Anyone can submit to waitlist (public form)
CREATE POLICY "Anyone can join waitlist"
ON public.waitlist
FOR INSERT
WITH CHECK (true);

-- Only admins can view waitlist entries
CREATE POLICY "Admins can view waitlist"
ON public.waitlist
FOR SELECT
USING (is_admin(auth.uid()));

-- Only admins can delete waitlist entries
CREATE POLICY "Admins can delete waitlist entries"
ON public.waitlist
FOR DELETE
USING (is_admin(auth.uid()));