-- Fix resume storage policy to require authentication
DROP POLICY IF EXISTS "Anyone can upload resumes" ON storage.objects;

-- Create new policy requiring authentication for resume uploads
CREATE POLICY "Authenticated users can upload resumes"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'resumes');