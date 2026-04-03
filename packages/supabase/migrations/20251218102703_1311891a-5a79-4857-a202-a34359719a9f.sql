-- Create app roles enum
CREATE TYPE public.app_role AS ENUM ('admin', 'employer');

-- User roles table (for employer access)
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  UNIQUE (user_id, role)
);

ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Security definer function to check roles
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;

-- Companies table
CREATE TABLE public.companies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  industry TEXT,
  location TEXT,
  description TEXT,
  logo_url TEXT,
  website TEXT,
  year_founded INTEGER,
  employee_count TEXT,
  headquarters TEXT,
  mission TEXT,
  ceo TEXT,
  is_claimed BOOLEAN DEFAULT false,
  claimed_by UUID REFERENCES auth.users(id),
  claimed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

ALTER TABLE public.companies ENABLE ROW LEVEL SECURITY;

-- Companies are publicly readable
CREATE POLICY "Companies are publicly readable"
ON public.companies FOR SELECT
USING (true);

-- Employers can update their claimed company
CREATE POLICY "Employers can update their claimed company"
ON public.companies FOR UPDATE
USING (auth.uid() = claimed_by AND is_claimed = true);

-- Authenticated users can create companies
CREATE POLICY "Authenticated users can create companies"
ON public.companies FOR INSERT
TO authenticated
WITH CHECK (true);

-- Reviews table (anonymous but verified)
CREATE TABLE public.reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE NOT NULL,
  verification_token TEXT NOT NULL, -- hashed token, not the actual email
  rating DECIMAL(2,1) NOT NULL CHECK (rating >= 1 AND rating <= 5),
  title TEXT NOT NULL,
  pros TEXT NOT NULL,
  cons TEXT NOT NULL,
  role_title TEXT,
  employment_status TEXT, -- Current Employee, Former Employee
  recommend_to_friend BOOLEAN,
  ceo_approval BOOLEAN,
  helpful_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;

-- Reviews are publicly readable
CREATE POLICY "Reviews are publicly readable"
ON public.reviews FOR SELECT
USING (true);

-- Reviews can be inserted (verification handled in app)
CREATE POLICY "Anyone can insert reviews"
ON public.reviews FOR INSERT
WITH CHECK (true);

-- Review responses from employers
CREATE TABLE public.review_responses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  review_id UUID REFERENCES public.reviews(id) ON DELETE CASCADE NOT NULL UNIQUE,
  company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE NOT NULL,
  responder_id UUID REFERENCES auth.users(id) NOT NULL,
  response_text TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

ALTER TABLE public.review_responses ENABLE ROW LEVEL SECURITY;

-- Responses are publicly readable
CREATE POLICY "Review responses are publicly readable"
ON public.review_responses FOR SELECT
USING (true);

-- Employers can respond to reviews for their company
CREATE POLICY "Employers can respond to reviews"
ON public.review_responses FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.companies
    WHERE id = company_id
    AND claimed_by = auth.uid()
    AND is_claimed = true
  )
);

-- Employers can update their responses
CREATE POLICY "Employers can update their responses"
ON public.review_responses FOR UPDATE
TO authenticated
USING (responder_id = auth.uid());

-- Salaries table
CREATE TABLE public.salaries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE NOT NULL,
  role_title TEXT NOT NULL,
  salary_min INTEGER,
  salary_max INTEGER,
  currency TEXT DEFAULT 'USD',
  verification_token TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

ALTER TABLE public.salaries ENABLE ROW LEVEL SECURITY;

-- Salaries are publicly readable
CREATE POLICY "Salaries are publicly readable"
ON public.salaries FOR SELECT
USING (true);

-- Anyone can insert salaries
CREATE POLICY "Anyone can insert salaries"
ON public.salaries FOR INSERT
WITH CHECK (true);

-- Rating categories for detailed ratings
CREATE TABLE public.rating_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  review_id UUID REFERENCES public.reviews(id) ON DELETE CASCADE NOT NULL,
  category TEXT NOT NULL, -- compensation, diversity, culture, workLife, career, management
  rating DECIMAL(2,1) NOT NULL CHECK (rating >= 1 AND rating <= 5)
);

ALTER TABLE public.rating_categories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Rating categories are publicly readable"
ON public.rating_categories FOR SELECT
USING (true);

CREATE POLICY "Anyone can insert rating categories"
ON public.rating_categories FOR INSERT
WITH CHECK (true);

-- Company benefits
CREATE TABLE public.company_benefits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE NOT NULL,
  benefit_name TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

ALTER TABLE public.company_benefits ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Benefits are publicly readable"
ON public.company_benefits FOR SELECT
USING (true);

CREATE POLICY "Employers can manage benefits"
ON public.company_benefits FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.companies
    WHERE id = company_id
    AND claimed_by = auth.uid()
    AND is_claimed = true
  )
);

-- Verification sessions (for magic link flow - no personal data stored)
CREATE TABLE public.verification_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  token_hash TEXT NOT NULL UNIQUE, -- hashed verification token
  company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE NOT NULL,
  email_domain TEXT NOT NULL, -- only domain, not full email
  verified BOOLEAN DEFAULT false,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

ALTER TABLE public.verification_sessions ENABLE ROW LEVEL SECURITY;

-- Sessions can be read by token
CREATE POLICY "Sessions can be accessed by anyone"
ON public.verification_sessions FOR SELECT
USING (true);

CREATE POLICY "Anyone can create verification sessions"
ON public.verification_sessions FOR INSERT
WITH CHECK (true);

CREATE POLICY "Sessions can be updated"
ON public.verification_sessions FOR UPDATE
USING (true);

-- Employer profiles
CREATE TABLE public.employer_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  company_id UUID REFERENCES public.companies(id) ON DELETE SET NULL,
  job_title TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

ALTER TABLE public.employer_profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Employer profiles are readable by owner"
ON public.employer_profiles FOR SELECT
TO authenticated
USING (user_id = auth.uid());

CREATE POLICY "Employers can insert their profile"
ON public.employer_profiles FOR INSERT
TO authenticated
WITH CHECK (user_id = auth.uid());

CREATE POLICY "Employers can update their profile"
ON public.employer_profiles FOR UPDATE
TO authenticated
USING (user_id = auth.uid());

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Triggers for updated_at
CREATE TRIGGER update_companies_updated_at
BEFORE UPDATE ON public.companies
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_reviews_updated_at
BEFORE UPDATE ON public.reviews
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_review_responses_updated_at
BEFORE UPDATE ON public.review_responses
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_employer_profiles_updated_at
BEFORE UPDATE ON public.employer_profiles
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();