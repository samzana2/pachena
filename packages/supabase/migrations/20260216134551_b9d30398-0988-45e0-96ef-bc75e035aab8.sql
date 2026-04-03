
-- Add end_year column for former employees
ALTER TABLE public.reviews ADD COLUMN end_year integer NULL;

-- Drop and recreate the public view with end_year included
DROP VIEW IF EXISTS public.reviews_public;

CREATE VIEW public.reviews_public AS
SELECT
    id,
    company_id,
    title,
    pros,
    cons,
    advice,
    rating,
    CASE
        WHEN (SELECT count(*) FROM reviews r2 WHERE r2.company_id = r.company_id AND r2.moderation_status = 'approved') >= 5 THEN role_title
        ELSE NULL::text
    END AS role_title,
    CASE
        WHEN (SELECT count(*) FROM reviews r2 WHERE r2.company_id = r.company_id AND r2.moderation_status = 'approved') >= 5 THEN role_level
        ELSE NULL::text
    END AS role_level,
    CASE
        WHEN (SELECT count(*) FROM reviews r2 WHERE r2.company_id = r.company_id AND r2.moderation_status = 'approved') >= 5 THEN department
        ELSE NULL::text
    END AS department,
    CASE
        WHEN (SELECT count(*) FROM reviews r2 WHERE r2.company_id = r.company_id AND r2.moderation_status = 'approved') >= 5 THEN tenure_range
        ELSE NULL::text
    END AS tenure_range,
    employment_status,
    employment_type,
    recommend_to_friend,
    ceo_approval,
    helpful_count,
    salary_range,
    market_alignment,
    pay_transparency,
    did_interview,
    interview_experience_rating,
    interview_count,
    interview_difficulty,
    interview_description,
    interview_tips,
    CASE
        WHEN (SELECT count(*) FROM reviews r2 WHERE r2.company_id = r.company_id AND r2.moderation_status = 'approved') >= 5 THEN age_range
        ELSE NULL::text
    END AS age_range,
    CASE
        WHEN (SELECT count(*) FROM reviews r2 WHERE r2.company_id = r.company_id AND r2.moderation_status = 'approved') >= 5 THEN gender
        ELSE NULL::text
    END AS gender,
    CASE
        WHEN (SELECT count(*) FROM reviews r2 WHERE r2.company_id = r.company_id AND r2.moderation_status = 'approved') >= 5 THEN ethnicity
        ELSE NULL::text
    END AS ethnicity,
    CASE
        WHEN (SELECT count(*) FROM reviews r2 WHERE r2.company_id = r.company_id AND r2.moderation_status = 'approved') >= 5 THEN education_level
        ELSE NULL::text
    END AS education_level,
    created_at + '00:00:01'::interval * (abs((('x'::text || left(md5(id::text), 8)))::bit(32)::integer) % 259200 - 129600)::double precision AS created_at,
    updated_at,
    base_salary_amount,
    base_salary_currency,
    is_net_salary,
    allowances_amount,
    allowances_currency,
    bonus_amount,
    bonus_currency,
    hidden_fields,
    verification_type,
    end_year
FROM reviews r
WHERE moderation_status = 'approved';
