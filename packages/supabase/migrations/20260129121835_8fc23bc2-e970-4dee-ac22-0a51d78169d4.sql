-- Add structured salary columns to reviews table
ALTER TABLE public.reviews
ADD COLUMN base_salary_currency text,
ADD COLUMN base_salary_amount numeric,
ADD COLUMN is_net_salary boolean DEFAULT false,
ADD COLUMN allowances_currency text,
ADD COLUMN allowances_amount numeric,
ADD COLUMN bonus_currency text,
ADD COLUMN bonus_amount numeric;