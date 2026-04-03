
-- Create social_posts table
CREATE TABLE public.social_posts (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  caption text NOT NULL,
  image_url text NOT NULL,
  platforms jsonb NOT NULL DEFAULT '{}'::jsonb,
  posted_by uuid,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.social_posts ENABLE ROW LEVEL SECURITY;

-- Admin-only policies
CREATE POLICY "Admins can view social posts"
  ON public.social_posts FOR SELECT
  USING (is_admin(auth.uid()));

CREATE POLICY "Admins can insert social posts"
  ON public.social_posts FOR INSERT
  WITH CHECK (is_admin(auth.uid()));

CREATE POLICY "Admins can update social posts"
  ON public.social_posts FOR UPDATE
  USING (is_admin(auth.uid()));

CREATE POLICY "Admins can delete social posts"
  ON public.social_posts FOR DELETE
  USING (is_admin(auth.uid()));

-- Create public storage bucket for social media images
INSERT INTO storage.buckets (id, name, public)
VALUES ('social-media-images', 'social-media-images', true);

-- Storage policies: admins can upload, anyone can view (public bucket)
CREATE POLICY "Anyone can view social media images"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'social-media-images');

CREATE POLICY "Admins can upload social media images"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'social-media-images' AND is_admin(auth.uid()));

CREATE POLICY "Admins can delete social media images"
  ON storage.objects FOR DELETE
  USING (bucket_id = 'social-media-images' AND is_admin(auth.uid()));
