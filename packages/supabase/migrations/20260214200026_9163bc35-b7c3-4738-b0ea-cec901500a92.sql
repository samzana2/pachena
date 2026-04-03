
-- Create paystub_verifications table
CREATE TABLE public.paystub_verifications (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  verification_session_id UUID NOT NULL REFERENCES public.verification_sessions(id),
  company_id UUID NOT NULL REFERENCES public.companies(id),
  file_path TEXT NOT NULL,
  email_domain TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  reviewed_at TIMESTAMP WITH TIME ZONE,
  reviewed_by UUID,
  admin_notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.paystub_verifications ENABLE ROW LEVEL SECURITY;

-- Admins can view all paystub verifications
CREATE POLICY "Admins can view paystub verifications"
ON public.paystub_verifications
FOR SELECT
USING (public.is_admin(auth.uid()));

-- Admins can update paystub verifications
CREATE POLICY "Admins can update paystub verifications"
ON public.paystub_verifications
FOR UPDATE
USING (public.is_admin(auth.uid()));

-- Anyone can insert (edge function will handle validation)
CREATE POLICY "Anyone can insert paystub verifications"
ON public.paystub_verifications
FOR INSERT
WITH CHECK (true);

-- Trigger for updated_at
CREATE TRIGGER update_paystub_verifications_updated_at
BEFORE UPDATE ON public.paystub_verifications
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create private storage bucket for paystub uploads
INSERT INTO storage.buckets (id, name, public)
VALUES ('paystub-uploads', 'paystub-uploads', false);

-- Only admins can view uploaded paystubs
CREATE POLICY "Admins can view paystub uploads"
ON storage.objects
FOR SELECT
USING (bucket_id = 'paystub-uploads' AND public.is_admin(auth.uid()));

-- Anyone can upload paystubs (edge function controls access)
CREATE POLICY "Anyone can upload paystubs"
ON storage.objects
FOR INSERT
WITH CHECK (bucket_id = 'paystub-uploads');

-- Admins can delete paystub files after review
CREATE POLICY "Admins can delete paystub uploads"
ON storage.objects
FOR DELETE
USING (bucket_id = 'paystub-uploads' AND public.is_admin(auth.uid()));
