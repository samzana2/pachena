-- Create jobs table
CREATE TABLE public.jobs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  location TEXT,
  job_type TEXT NOT NULL DEFAULT 'full_time',
  experience_level TEXT,
  salary_min INTEGER,
  salary_max INTEGER,
  salary_currency TEXT DEFAULT 'USD',
  department TEXT,
  requirements TEXT,
  responsibilities TEXT,
  is_remote BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,
  expires_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create job_applications table
CREATE TABLE public.job_applications (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  job_id UUID NOT NULL REFERENCES public.jobs(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  resume_url TEXT,
  cover_letter TEXT,
  linkedin_url TEXT,
  portfolio_url TEXT,
  status TEXT NOT NULL DEFAULT 'pending',
  employer_notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on both tables
ALTER TABLE public.jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.job_applications ENABLE ROW LEVEL SECURITY;

-- Jobs RLS policies
CREATE POLICY "Active jobs are publicly readable"
ON public.jobs
FOR SELECT
USING (is_active = true AND (expires_at IS NULL OR expires_at > now()));

CREATE POLICY "Employers can view all their company jobs"
ON public.jobs
FOR SELECT
USING (EXISTS (
  SELECT 1 FROM companies
  WHERE companies.id = jobs.company_id
  AND companies.claimed_by = auth.uid()
  AND companies.is_claimed = true
));

CREATE POLICY "Employers can create jobs for their company"
ON public.jobs
FOR INSERT
WITH CHECK (EXISTS (
  SELECT 1 FROM companies
  WHERE companies.id = jobs.company_id
  AND companies.claimed_by = auth.uid()
  AND companies.is_claimed = true
));

CREATE POLICY "Employers can update their company jobs"
ON public.jobs
FOR UPDATE
USING (EXISTS (
  SELECT 1 FROM companies
  WHERE companies.id = jobs.company_id
  AND companies.claimed_by = auth.uid()
  AND companies.is_claimed = true
));

CREATE POLICY "Employers can delete their company jobs"
ON public.jobs
FOR DELETE
USING (EXISTS (
  SELECT 1 FROM companies
  WHERE companies.id = jobs.company_id
  AND companies.claimed_by = auth.uid()
  AND companies.is_claimed = true
));

-- Job applications RLS policies
CREATE POLICY "Anyone can submit job applications"
ON public.job_applications
FOR INSERT
WITH CHECK (true);

CREATE POLICY "Employers can view applications for their jobs"
ON public.job_applications
FOR SELECT
USING (EXISTS (
  SELECT 1 FROM jobs
  JOIN companies ON companies.id = jobs.company_id
  WHERE jobs.id = job_applications.job_id
  AND companies.claimed_by = auth.uid()
  AND companies.is_claimed = true
));

CREATE POLICY "Employers can update applications for their jobs"
ON public.job_applications
FOR UPDATE
USING (EXISTS (
  SELECT 1 FROM jobs
  JOIN companies ON companies.id = jobs.company_id
  WHERE jobs.id = job_applications.job_id
  AND companies.claimed_by = auth.uid()
  AND companies.is_claimed = true
));

-- Create triggers for updated_at
CREATE TRIGGER update_jobs_updated_at
BEFORE UPDATE ON public.jobs
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_job_applications_updated_at
BEFORE UPDATE ON public.job_applications
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create resumes storage bucket
INSERT INTO storage.buckets (id, name, public) VALUES ('resumes', 'resumes', false);

-- Storage policies for resumes bucket
CREATE POLICY "Anyone can upload resumes"
ON storage.objects
FOR INSERT
WITH CHECK (bucket_id = 'resumes');

CREATE POLICY "Employers can view resumes for their job applications"
ON storage.objects
FOR SELECT
USING (
  bucket_id = 'resumes' 
  AND EXISTS (
    SELECT 1 FROM job_applications ja
    JOIN jobs j ON j.id = ja.job_id
    JOIN companies c ON c.id = j.company_id
    WHERE ja.resume_url LIKE '%' || storage.objects.name
    AND c.claimed_by = auth.uid()
    AND c.is_claimed = true
  )
);