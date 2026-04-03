"use client";

import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { useRouter } from "next/navigation";
import { createBrowserSupabaseClient } from "@/lib/supabase/client";
import { toast } from "sonner";

interface CompanyData {
  id: string;
  name: string;
  slug: string;
  logo_url: string | null;
  description: string | null;
  industry: string | null;
  location: string | null;
  headquarters: string | null;
  employee_count: string | null;
  year_founded: number | null;
  ceo: string | null;
  mission: string | null;
  website: string | null;
  linkedin_url: string | null;
  is_claimed: boolean | null;
}

interface EmployerContextValue {
  company: CompanyData | null;
  userEmail: string;
  isLoading: boolean;
  refreshCompany: () => Promise<void>;
}

const EmployerContext = createContext<EmployerContextValue | null>(null);

export const useEmployer = () => {
  const context = useContext(EmployerContext);
  if (!context) {
    throw new Error("useEmployer must be used within an EmployerProvider");
  }
  return context;
};

interface EmployerProviderProps {
  children: ReactNode;
}

export const EmployerProvider = ({ children }: EmployerProviderProps) => {
  const router = useRouter();
  const [company, setCompany] = useState<CompanyData | null>(null);
  const [userEmail, setUserEmail] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    verifyAndFetch();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const verifyAndFetch = async () => {
    const supabase = createBrowserSupabaseClient();
    try {
      const { data: { session } } = await supabase.auth.getSession();

      if (!session) {
        toast.error("Please log in to access the employer dashboard");
        router.push("/auth");
        return;
      }

      setUserEmail(session.user.email || "");

      const { data: roleData } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", session.user.id)
        .in("role", ["employer", "admin"]);

      if (!roleData || roleData.length === 0) {
        toast.error("You don't have employer access");
        router.push("/");
        return;
      }

      const { data: employerProfile } = await supabase
        .from("employer_profiles")
        .select("company_id")
        .eq("user_id", session.user.id)
        .single();

      if (employerProfile?.company_id) {
        const { data: companyData } = await supabase
          .from("companies")
          .select("*")
          .eq("id", employerProfile.company_id)
          .single();

        if (companyData) {
          setCompany(companyData as CompanyData);
        }
      }
    } catch (error) {
      console.error("Employer context error:", error);
      toast.error("Failed to load dashboard");
      router.push("/");
    } finally {
      setIsLoading(false);
    }
  };

  const refreshCompany = async () => {
    if (!company?.id) return;
    const supabase = createBrowserSupabaseClient();
    const { data: companyData } = await supabase
      .from("companies")
      .select("*")
      .eq("id", company.id)
      .single();

    if (companyData) {
      setCompany(companyData as CompanyData);
    }
  };

  return (
    <EmployerContext.Provider value={{ company, userEmail, isLoading, refreshCompany }}>
      {children}
    </EmployerContext.Provider>
  );
};
