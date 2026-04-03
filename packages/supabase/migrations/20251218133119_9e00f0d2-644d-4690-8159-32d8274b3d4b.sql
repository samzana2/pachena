-- Create storage bucket for company logos
INSERT INTO storage.buckets (id, name, public)
VALUES ('company-logos', 'company-logos', true)
ON CONFLICT (id) DO NOTHING;

-- Allow anyone to view company logos (public bucket)
CREATE POLICY "Company logos are publicly accessible"
ON storage.objects FOR SELECT
USING (bucket_id = 'company-logos');

-- Allow verified employers to upload their company logo
CREATE POLICY "Verified employers can upload company logos"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'company-logos' 
  AND EXISTS (
    SELECT 1 FROM public.companies
    WHERE companies.id::text = (storage.foldername(name))[1]
    AND companies.claimed_by = auth.uid()
    AND companies.is_claimed = true
  )
);

-- Allow verified employers to update their company logo
CREATE POLICY "Verified employers can update company logos"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'company-logos' 
  AND EXISTS (
    SELECT 1 FROM public.companies
    WHERE companies.id::text = (storage.foldername(name))[1]
    AND companies.claimed_by = auth.uid()
    AND companies.is_claimed = true
  )
);

-- Allow verified employers to delete their company logo
CREATE POLICY "Verified employers can delete company logos"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'company-logos' 
  AND EXISTS (
    SELECT 1 FROM public.companies
    WHERE companies.id::text = (storage.foldername(name))[1]
    AND companies.claimed_by = auth.uid()
    AND companies.is_claimed = true
  )
);