-- Add role_focus column to reviews table
ALTER TABLE public.reviews 
ADD COLUMN IF NOT EXISTS role_focus text;

-- Add comment for documentation
COMMENT ON COLUMN public.reviews.role_focus IS 'Optional free-text role focus (e.g. Frontend Engineer, UX Designer, Data Scientist)';