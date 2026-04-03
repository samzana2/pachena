-- Add storage policy for admins to upload company logos
CREATE POLICY "Admins can upload company logos"
ON storage.objects
FOR INSERT
WITH CHECK (
  bucket_id = 'company-logos' 
  AND is_admin(auth.uid())
);

-- Add storage policy for admins to update company logos
CREATE POLICY "Admins can update company logos"
ON storage.objects
FOR UPDATE
USING (
  bucket_id = 'company-logos' 
  AND is_admin(auth.uid())
);

-- Add storage policy for admins to delete company logos
CREATE POLICY "Admins can delete company logos"
ON storage.objects
FOR DELETE
USING (
  bucket_id = 'company-logos' 
  AND is_admin(auth.uid())
);