-- Add demographic columns to reviews table for analytics purposes
-- All fields are optional with "Prefer not to say" as implicit default

ALTER TABLE public.reviews 
ADD COLUMN age_range text,
ADD COLUMN gender text,
ADD COLUMN ethnicity text,
ADD COLUMN education_level text;

-- Add comments for documentation
COMMENT ON COLUMN public.reviews.age_range IS 'Optional: Age range of reviewer for demographic analytics';
COMMENT ON COLUMN public.reviews.gender IS 'Optional: Gender of reviewer for demographic analytics';
COMMENT ON COLUMN public.reviews.ethnicity IS 'Optional: Ethnicity of reviewer for demographic analytics';
COMMENT ON COLUMN public.reviews.education_level IS 'Optional: Education level of reviewer for demographic analytics';

-- NOTE: The reviews_public view should NOT be updated to include these fields
-- to protect reviewer privacy. These demographics are only for internal analytics.