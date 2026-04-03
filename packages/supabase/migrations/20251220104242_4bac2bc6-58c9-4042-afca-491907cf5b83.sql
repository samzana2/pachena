-- Create company_requests table for tracking company addition requests
CREATE TABLE public.company_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_name text NOT NULL,
  industry text,
  location text,
  website text,
  requester_email text, -- Optional - to notify when added
  status text NOT NULL DEFAULT 'pending',
  admin_notes text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  reviewed_at timestamp with time zone,
  reviewed_by uuid
);

-- Enable RLS
ALTER TABLE public.company_requests ENABLE ROW LEVEL SECURITY;

-- Anyone can submit company requests
CREATE POLICY "Anyone can submit company requests"
ON public.company_requests
FOR INSERT
WITH CHECK (true);

-- Admins can view all company requests
CREATE POLICY "Admins can view company requests"
ON public.company_requests
FOR SELECT
USING (is_admin(auth.uid()));

-- Admins can update company requests
CREATE POLICY "Admins can update company requests"
ON public.company_requests
FOR UPDATE
USING (is_admin(auth.uid()));

-- Admins can delete company requests
CREATE POLICY "Admins can delete company requests"
ON public.company_requests
FOR DELETE
USING (is_admin(auth.uid()));