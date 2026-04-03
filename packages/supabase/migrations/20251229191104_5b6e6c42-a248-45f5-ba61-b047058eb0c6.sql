-- Ensure correct storage policies for company logos

DROP POLICY IF EXISTS "Employers can upload company logos" ON storage.objects;
DROP POLICY IF EXISTS "Employers can update company logos" ON storage.objects;
DROP POLICY IF EXISTS "Employers can delete company logos" ON storage.objects;
DROP POLICY IF EXISTS "Public can view company logos" ON storage.objects;

-- Public read (bucket is public, but policy makes it explicit)
CREATE POLICY "Public can view company logos"
ON storage.objects
FOR SELECT
USING (bucket_id = 'company-logos');

-- Helper predicate repeated to keep policies clear
-- NOTE: Postgres policies can't share local variables, so repeat the EXISTS.

CREATE POLICY "Employers can upload company logos"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'company-logos' AND
  EXISTS (
    SELECT 1
    FROM public.companies c
    WHERE c.id::text = (storage.foldername(name))[1]
      AND c.is_claimed = true
      AND c.claimed_by = auth.uid()
  )
);

CREATE POLICY "Employers can update company logos"
ON storage.objects
FOR UPDATE
TO authenticated
USING (
  bucket_id = 'company-logos' AND
  EXISTS (
    SELECT 1
    FROM public.companies c
    WHERE c.id::text = (storage.foldername(name))[1]
      AND c.is_claimed = true
      AND c.claimed_by = auth.uid()
  )
)
WITH CHECK (
  bucket_id = 'company-logos' AND
  EXISTS (
    SELECT 1
    FROM public.companies c
    WHERE c.id::text = (storage.foldername(name))[1]
      AND c.is_claimed = true
      AND c.claimed_by = auth.uid()
  )
);

CREATE POLICY "Employers can delete company logos"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'company-logos' AND
  EXISTS (
    SELECT 1
    FROM public.companies c
    WHERE c.id::text = (storage.foldername(name))[1]
      AND c.is_claimed = true
      AND c.claimed_by = auth.uid()
  )
);