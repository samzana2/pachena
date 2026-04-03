ALTER TABLE public.reviews
  ADD COLUMN IF NOT EXISTS ai_moderation_summary jsonb DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS moderation_justification jsonb DEFAULT NULL;