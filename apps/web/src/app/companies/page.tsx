import type { Metadata } from "next";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import type { Company } from "@/components/CompanyCard";
import CompaniesClient from "./CompaniesClient";

export const metadata: Metadata = {
  title: "Browse Companies — Pachena",
  description:
    "Explore anonymous employee reviews, salary data, and workplace insights for companies across Africa.",
};

interface SpotlightCompany {
  id: string;
  name: string;
  logo?: string;
  description: string;
  rating: number;
}

interface SearchParams {
  search?: string;
  letter?: string;
  industry?: string;
  location?: string;
  rating?: string;
  size?: string;
}

async function fetchCompaniesData() {
  const supabase = await createServerSupabaseClient();

  const [
    { data: companiesData },
    { data: allReviews },
    { data: allSections },
  ] = await Promise.all([
    supabase.from("companies").select("*").order("name"),
    supabase
      .from("reviews_public")
      .select(
        "company_id, rating, salary_range, base_salary_amount, did_interview, interview_experience_rating, interview_difficulty, interview_description, interview_tips"
      ),
    supabase
      .from("review_sections_public")
      .select("company_id, section_type, section_data"),
  ]);

  // Pre-aggregate review stats by company
  const reviewStats: Record<
    string,
    { ratings: number[]; salaryCount: number; interviewCount: number; count: number }
  > = {};
  for (const r of (allReviews ?? []) as Array<{
    company_id: string | null;
    rating: number | null;
    salary_range: string | null;
    base_salary_amount: number | null;
    did_interview: boolean | null;
    interview_experience_rating: number | null;
    interview_difficulty: string | null;
    interview_description: string | null;
    interview_tips: string | null;
  }>) {
    if (!r.company_id) continue;
    reviewStats[r.company_id] ??= {
      ratings: [],
      salaryCount: 0,
      interviewCount: 0,
      count: 0,
    };
    const s = reviewStats[r.company_id];
    s.count++;
    s.ratings.push(Number(r.rating));
    if (r.salary_range !== null || r.base_salary_amount !== null) s.salaryCount++;
    if (
      r.did_interview === true &&
      (r.interview_experience_rating ||
        r.interview_difficulty ||
        r.interview_description ||
        r.interview_tips)
    )
      s.interviewCount++;
  }

  // Pre-aggregate section stats by company
  const sectionStats: Record<
    string,
    { cultureCount: number; cultureRatings: number[]; compCount: number; intCount: number }
  > = {};
  for (const s of (allSections ?? []) as Array<{
    company_id: string | null;
    section_type: string | null;
    section_data: Record<string, unknown> | null;
  }>) {
    if (!s.company_id) continue;
    sectionStats[s.company_id] ??= {
      cultureCount: 0,
      cultureRatings: [],
      compCount: 0,
      intCount: 0,
    };
    const st = sectionStats[s.company_id];
    if (s.section_type === "culture") {
      st.cultureCount++;
      const rating = Number(s.section_data?.rating);
      if (rating > 0) st.cultureRatings.push(rating);
    } else if (s.section_type === "compensation") {
      st.compCount++;
    } else if (s.section_type === "interview") {
      st.intCount++;
    }
  }

  const companies: Company[] = (companiesData ?? []).map((company) => {
    const rs = reviewStats[company.id] ?? {
      ratings: [],
      salaryCount: 0,
      interviewCount: 0,
      count: 0,
    };
    const ss = sectionStats[company.id] ?? {
      cultureCount: 0,
      cultureRatings: [],
      compCount: 0,
      intCount: 0,
    };
    const allRatings = [...rs.ratings, ...ss.cultureRatings];
    const avgRating =
      allRatings.length > 0
        ? allRatings.reduce((a, b) => a + b, 0) / allRatings.length
        : 0;
    return {
      id: company.slug ?? company.id,
      name: company.name,
      industry: company.industry ?? "Unknown",
      location: company.location ?? "Unknown",
      employeeCount: company.employee_count ?? "Unknown",
      rating: avgRating,
      reviewCount: rs.count + ss.cultureCount,
      salaryCount: rs.salaryCount + ss.compCount,
      interviewCount: rs.interviewCount + ss.intCount,
      description: company.description ?? "",
    };
  });

  // Compute spotlight companies (top rated with at least some reviews)
  const spotlightCompanies: SpotlightCompany[] = companies
    .filter((c) => c.rating > 0)
    .map((c) => ({
      id: c.id,
      name: c.name,
      logo: (companiesData ?? []).find(
        (d) => (d.slug ?? d.id) === c.id
      )?.logo_url ?? undefined,
      description: c.description || `${c.name} is a company on Pachena.`,
      rating: c.rating,
    }))
    .sort((a, b) => b.rating - a.rating)
    .slice(0, 10);

  return { companies, spotlightCompanies };
}

export default async function CompaniesPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const params = await searchParams;
  const { companies, spotlightCompanies } = await fetchCompaniesData();

  const initialSearch = params.search ?? "";
  const initialLetter = params.letter ?? null;
  const initialFilters = {
    industry: params.industry ?? "",
    location: params.location ?? "",
    rating: params.rating ?? "all",
    size: params.size ?? "all",
  };

  return (
    <CompaniesClient
      companies={companies}
      spotlightCompanies={spotlightCompanies}
      initialSearch={initialSearch}
      initialLetter={initialLetter}
      initialFilters={initialFilters}
    />
  );
}
