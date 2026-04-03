-- Fix Pachena company to be claimed by the current user
UPDATE public.companies 
SET is_claimed = true, 
    claimed_by = '78d0e624-068f-4f5f-9b77-c1e6070b5536',
    claimed_at = now()
WHERE slug = 'pachena';

-- Drop existing buggy storage policies
DROP POLICY IF EXISTS "Verified employers can upload company logos" ON storage.objects;
DROP POLICY IF EXISTS "Verified employers can update company logos" ON storage.objects;
DROP POLICY IF EXISTS "Verified employers can delete company logos" ON storage.objects;

-- Recreate with correct logic using employer_profiles
CREATE POLICY "Employers can upload company logos"
ON storage.objects FOR INSERT WITH CHECK (
  bucket_id = 'company-logos' AND
  auth.role() = 'authenticated' AND
  EXISTS (
    SELECT 1 FROM public.employer_profiles ep
    JOIN public.companies c ON c.id = ep.company_id
    WHERE ep.user_id = auth.uid()
    AND c.id::text = (storage.foldername(name))[1]
  )
);

CREATE POLICY "Employers can update company logos"
ON storage.objects FOR UPDATE USING (
  bucket_id = 'company-logos' AND
  auth.role() = 'authenticated' AND
  EXISTS (
    SELECT 1 FROM public.employer_profiles ep
    JOIN public.companies c ON c.id = ep.company_id
    WHERE ep.user_id = auth.uid()
    AND c.id::text = (storage.foldername(name))[1]
  )
);

CREATE POLICY "Employers can delete company logos"
ON storage.objects FOR DELETE USING (
  bucket_id = 'company-logos' AND
  auth.role() = 'authenticated' AND
  EXISTS (
    SELECT 1 FROM public.employer_profiles ep
    JOIN public.companies c ON c.id = ep.company_id
    WHERE ep.user_id = auth.uid()
    AND c.id::text = (storage.foldername(name))[1]
  )
);