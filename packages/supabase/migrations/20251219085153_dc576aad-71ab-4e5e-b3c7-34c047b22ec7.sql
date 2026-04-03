-- Create function to handle new employer signup
CREATE OR REPLACE FUNCTION public.handle_new_employer()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.employer_profiles (user_id)
  VALUES (NEW.id)
  ON CONFLICT (user_id) DO NOTHING;
  RETURN NEW;
END;
$$;

-- Create trigger to auto-create employer profile on signup
CREATE TRIGGER on_auth_user_created_employer
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_employer();

-- Add unique constraint on user_id if not exists (for ON CONFLICT to work)
ALTER TABLE public.employer_profiles 
  DROP CONSTRAINT IF EXISTS employer_profiles_user_id_key;

ALTER TABLE public.employer_profiles 
  ADD CONSTRAINT employer_profiles_user_id_key UNIQUE (user_id);