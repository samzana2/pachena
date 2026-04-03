-- Add interview experience columns to reviews table
ALTER TABLE public.reviews
ADD COLUMN did_interview boolean DEFAULT NULL,
ADD COLUMN interview_experience_rating numeric DEFAULT NULL,
ADD COLUMN interview_count integer DEFAULT NULL,
ADD COLUMN interview_difficulty text DEFAULT NULL,
ADD COLUMN interview_description text DEFAULT NULL,
ADD COLUMN interview_tips text DEFAULT NULL;