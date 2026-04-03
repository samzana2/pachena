"use client";

import { useState, useMemo, useCallback } from "react";
import { useQuery } from "@tanstack/react-query";
import { createBrowserSupabaseClient } from "@/lib/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, PieChart, Pie, Cell, Legend } from "recharts";
import { RotateCcw, TrendingUp, CalendarIcon } from "lucide-react";
import { subMonths, startOfYear, subYears, endOfYear, format } from "date-fns";

import { getTotalComp, type TotalCompInput } from "@/lib/salaryUtils";
const supabase = createBrowserSupabaseClient();

const STANDARD_BENEFITS = [
  { key: "medical_aid", label: "Medical Aid", monetisable: true, valueKey: "medical_aid_value" },
  { key: "transport_fuel", label: "Transport allowance / Fuel", monetisable: true, valueKey: "transport_fuel_value" },
  { key: "pension_nssa", label: "Pension / NSSA contributions", monetisable: false, valueKey: null },
  { key: "performance_bonus", label: "Annual Performance Bonus", monetisable: true, valueKey: "performance_bonus_annual_value" },
  { key: "airtime_data", label: "Airtime / data allowance", monetisable: true, valueKey: "airtime_data_value" },
  { key: "housing_allowance", label: "Housing allowance", monetisable: true, valueKey: "housing_allowance_value" },
  { key: "school_fees", label: "School Fees", monetisable: true, valueKey: "school_fees_value" },
  { key: "education_training", label: "Education / training support", monetisable: true, valueKey: "education_training_value" },
  { key: "paid_leave", label: "Paid leave (annual, sick, maternity)", monetisable: false, valueKey: null },
  { key: "flexible_remote", label: "Flexible or remote work", monetisable: false, valueKey: null },
  { key: "funeral_assistance", label: "Funeral assistance / funeral policy", monetisable: false, valueKey: null },
  { key: "thirteenth_cheque", label: "Thirteenth Cheque", monetisable: true, valueKey: "thirteenth_cheque_annual_value" },
] as const;

const ANNUAL_VALUE_KEYS = new Set(["performance_bonus_annual_value", "thirteenth_cheque_annual_value"]);

// Types
interface ReviewData {
  id: string;
  rating: number;
  base_salary_amount: number | null;
  role_level: string | null;
  department: string | null;
  employment_type: string | null;
  tenure_range: string | null;
  gender: string | null;
  age_range: string | null;
  education_level: string | null;
  ethnicity: string | null;
  created_at: string;
  company_id: string;
  companies: { name: string; industry: string | null } | null;
  rating_categories: { category: string; rating: number }[];
  review_standard_benefits: { standard_benefit_id: string; standard_benefits: { benefit_label: string } | null }[];
  allowances_amount: number | null;
  bonus_amount: number | null;
  benefit_values: Record<string, number> | null;
  thirteenth_cheque_annual_value: number | null;
  commission_amount: number | null;
  performance_bonus_annual_value: number | null;
  standard_benefit_ids: string[];
  sectionCount: number;
}

type DateRange = "all" | "this_year" | "last_year" | "6m" | "3m" | "custom";

const CHART_COLORS = [
  "#6C63FF",
  "#4ECDC4",
  "#FF6B6B",
  "#FFE66D",
  "#95E1D3",
  "#A78BFA",
  "#F97316",
  "#38BDF8",
  "#FB7185",
  "#34D399",
];

const ROLE_LEVEL_ORDER = ["Intern", "Entry Level", "Mid Level", "Senior", "Lead / Manager", "Director", "C-Suite / Executive"];

/** Maps legacy role level values to the current consolidated labels */
const normalizeRoleLevel = (level: string | null | undefined): string | null => {
  if (!level) return null;
  const ROLE_LEVEL_MAP: Record<string, string> = {
    "Lead": "Lead / Manager",
    "Manager": "Lead / Manager",
    "Management": "Lead / Manager",
    "VP": "C-Suite / Executive",
    "C-Suite": "C-Suite / Executive",
    "Executive": "C-Suite / Executive",
  };
  return ROLE_LEVEL_MAP[level] || level;
};

/** Maps legacy employment type values to the current consolidated labels */
const normalizeEmploymentType = (type: string | null | undefined): string | null => {
  if (!type) return null;
  const MAP: Record<string, string> = {
    "Full Time": "Full-Time",
    "Part Time": "Part-Time",
    "Intern": "Internship",
  };
  return MAP[type] || type;
};

/** Maps legacy education level values to the current consolidated labels */
const normalizeEducationLevel = (level: string | null | undefined): string | null => {
  if (!level) return null;
  const MAP: Record<string, string> = {
    "Some College": "Diploma / Certificate",
    "Professional Certification": "Professional Qualification",
  };
  return MAP[level] || level;
};

/** Maps legacy tenure range values to the current consolidated labels */
const normalizeTenureRange = (range: string | null | undefined): string | null => {
  if (!range) return null;
  const MAP: Record<string, string> = {
    "6-10 years": "5-10 years",
  };
  return MAP[range] || range;
};

/** Maps legacy age range values to the current consolidated labels */
const normalizeAgeRange = (range: string | null | undefined): string | null => {
  if (!range) return null;
  const MAP: Record<string, string> = {
    "18-24": "20-24",
  };
  return MAP[range] || range;
};

/** Normalizes gender values for consistent casing */
const normalizeGender = (gender: string | null | undefined): string | null => {
  if (!gender) return null;
  const MAP: Record<string, string> = {
    "male": "Male",
    "female": "Female",
    "non-binary": "Non-binary",
    "Non-Binary": "Non-binary",
    "nonbinary": "Non-binary",
    "prefer not to say": "Prefer not to say",
    "Prefer Not To Say": "Prefer not to say",
  };
  return MAP[gender] || gender;
};

/** Normalizes ethnicity values for consistent casing/labels */
const normalizeEthnicity = (ethnicity: string | null | undefined): string | null => {
  if (!ethnicity) return null;
  if (ethnicity.startsWith("other:")) return "Other";
  const MAP: Record<string, string> = {
    "black": "Black",
    "white": "White",
    "coloured": "Coloured",
    "indian": "Indian",
    "asian": "Asian",
    "mixed": "Mixed / Multiracial",
    "Mixed": "Mixed / Multiracial",
    "prefer not to say": "Prefer not to say",
    "Prefer Not To Say": "Prefer not to say",
  };
  return MAP[ethnicity] || ethnicity;
};

/** Maps legacy department values to the current consolidated labels */
const normalizeDepartment = (dept: string | null | undefined): string | null => {
  if (!dept) return null;
  // Handle legacy "other:XYZ" entries → "Other"
  if (dept.startsWith("other:")) return "Other";
  const MAP: Record<string, string> = {
    "Engineering / IT": "IT",
    "Finance & Accounting": "Accounting & Finance",
    "Marketing & Communications": "Marketing",
    "Customer Service / Support": "Customer Service",
    "Sales & Business Development": "Sales",
    "Product / Design": "Product",
    "Supply Chain / Logistics": "Supply Chain & Logistics",
    "Clinical / Medical / Healthcare": "Healthcare",
    "Technical / Field Operations": "Operations",
  };
  return MAP[dept] || dept;
};

const InsightsDashboard = () => {
  const [industry, setIndustry] = useState<string>("all");
  const [company, setCompany] = useState<string>("all");
  const [roleLevel, setRoleLevel] = useState<string>("all");
  const [department, setDepartment] = useState<string>("all");
  const [dateRange, setDateRange] = useState<DateRange>("all");
  const [customFrom, setCustomFrom] = useState<Date | undefined>();
  const [customTo, setCustomTo] = useState<Date | undefined>();
  

  const handleDateRangeChange = useCallback((val: string) => {
    setDateRange(val as DateRange);
    if (val !== "custom") {
      setCustomFrom(undefined);
      setCustomTo(undefined);
    }
  }, []);

  // Fetch all approved legacy reviews with joins
  const { data: legacyReviews = [], isLoading: isLoadingLegacy } = useQuery({
    queryKey: ["admin-insights-legacy-reviews"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("reviews")
        .select(`
          id, rating, base_salary_amount, allowances_amount, bonus_amount, role_level, department, employment_type, tenure_range, gender, age_range, education_level, ethnicity, created_at, company_id,
          companies(name, industry),
          rating_categories(category, rating),
          review_standard_benefits(standard_benefit_id, standard_benefits:standard_benefit_id(benefit_label))
        `)
        .in("moderation_status", ["approved", "suppressed"]);

      if (error) throw error;
      return (data || []).map((r: any) => ({
        ...r,
        benefit_values: null,
        thirteenth_cheque_annual_value: null,
        commission_amount: null,
        performance_bonus_annual_value: null,
        standard_benefit_ids: (r.review_standard_benefits || []).map((b: any) => b.standard_benefit_id),
        sectionCount: 1,
      })) as unknown as ReviewData[];
    },
  });

  // Fetch approved compensation sections
  const { data: compSections = [], isLoading: isLoadingSections } = useQuery({
    queryKey: ["admin-insights-comp-sections"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("review_sections")
        .select(`
          id, section_data, created_at, company_id, review_session_id,
          companies(name, industry)
        `)
        .eq("section_type", "compensation")
        .eq("moderation_status", "approved");

      if (error) throw error;
      return (data || []) as any[];
    },
  });

  // Fetch approved culture sections (for ratings data)
  const { data: cultureSections = [], isLoading: isLoadingCulture } = useQuery({
    queryKey: ["admin-insights-culture-sections"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("review_sections")
        .select(`
          id, section_data, created_at, company_id, review_session_id,
          companies(name, industry)
        `)
        .eq("section_type", "culture")
        .eq("moderation_status", "approved");

      if (error) throw error;
      return (data || []) as any[];
    },
  });

  // Build a map from review_session_id → culture rating data
  const cultureBySession = useMemo(() => {
    const map = new Map<string, { rating: number; ratings: { category: string; rating: number }[] }>();
    cultureSections.forEach((s: any) => {
      const d = s.section_data || {};
      if (s.review_session_id && d.rating) {
        map.set(s.review_session_id, {
          rating: Number(d.rating) || 0,
          ratings: (d.ratings || []).map((r: any) => ({ category: r.category, rating: Number(r.rating) })),
        });
      }
    });
    return map;
  }, [cultureSections]);

  // Merge legacy + section data into unified ReviewData format
  const reviews: ReviewData[] = useMemo(() => {
    const cultureSessionIds = new Set(cultureSections.map((s: any) => s.review_session_id).filter(Boolean));

    const sectionReviews: ReviewData[] = compSections.map((s: any) => {
      const d = s.section_data || {};
      const cultureData = s.review_session_id ? cultureBySession.get(s.review_session_id) : null;
      // Count: comp (1) + culture if present
      let sectionCount = 1;
      if (s.review_session_id && cultureSessionIds.has(s.review_session_id)) sectionCount++;
      return {
        id: s.id,
        rating: cultureData?.rating || 0,
        base_salary_amount: d.base_salary_amount || null,
        allowances_amount: d.allowances_amount || null,
        bonus_amount: d.bonus_amount || null,
        benefit_values: d.benefit_values || null,
        thirteenth_cheque_annual_value: d.thirteenth_cheque_annual_value || null,
        commission_amount: d.commission_amount || null,
        performance_bonus_annual_value: d.performance_bonus_annual_value || null,
        standard_benefit_ids: d.standard_benefit_ids || [],
        role_level: d.role_level || null,
        department: d.department || null,
        employment_type: d.employment_type || null,
        tenure_range: d.tenure_range || null,
        gender: d.gender || null,
        age_range: d.age_range || null,
        education_level: d.education_level || null,
        ethnicity: d.ethnicity || null,
        created_at: s.created_at,
        company_id: s.company_id,
        companies: s.companies || null,
        rating_categories: cultureData?.ratings || [],
        review_standard_benefits: [],
        sectionCount,
      };
    });

    // Also include culture sections that have NO matching comp section (standalone culture reviews)
    const compSessionIds = new Set(compSections.map((s: any) => s.review_session_id).filter(Boolean));
    const standaloneCulture: ReviewData[] = cultureSections
      .filter((s: any) => !s.review_session_id || !compSessionIds.has(s.review_session_id))
      .map((s: any) => {
        const d = s.section_data || {};
        // Count: culture (1) + no interview counting needed
        const sectionCount = 1;
        return {
          id: s.id,
          rating: Number(d.rating) || 0,
          base_salary_amount: null,
          allowances_amount: null,
          bonus_amount: null,
          benefit_values: null,
          thirteenth_cheque_annual_value: null,
          commission_amount: null,
          performance_bonus_annual_value: null,
          standard_benefit_ids: [],
          role_level: null,
          department: null,
          employment_type: null,
          tenure_range: null,
           gender: null,
           age_range: null,
           education_level: null,
           ethnicity: null,
          created_at: s.created_at,
          company_id: s.company_id,
          companies: s.companies || null,
          rating_categories: (d.ratings || []).map((r: any) => ({ category: r.category, rating: Number(r.rating) })),
          review_standard_benefits: [],
          sectionCount,
        };
      });

    return [...legacyReviews, ...sectionReviews, ...standaloneCulture];
  }, [legacyReviews, compSections, cultureSections, cultureBySession]);

  // Fetch standard_benefits for id→key mapping
  const { data: standardBenefitsRows = [] } = useQuery({
    queryKey: ["admin-insights-standard-benefits"],
    queryFn: async () => {
      const { data, error } = await supabase.from("standard_benefits").select("id, benefit_key").eq("is_active", true);
      if (error) throw error;
      return data || [];
    },
  });

  const benefitIdToKey = useMemo(() => {
    const map: Record<string, string> = {};
    standardBenefitsRows.forEach((b) => { map[b.id] = b.benefit_key; });
    return map;
  }, [standardBenefitsRows]);

  const isLoading = isLoadingLegacy || isLoadingSections || isLoadingCulture;

  // Extract unique filter options
  const filterOptions = useMemo(() => {
    const industries = new Set<string>();
    const companies = new Map<string, string>();
    const departments = new Set<string>();

    reviews.forEach((r) => {
      if (r.companies?.industry) industries.add(r.companies.industry);
      if (r.companies?.name) companies.set(r.company_id, r.companies.name);
      if (r.department) departments.add(normalizeDepartment(r.department) || r.department);
    });

    return {
      industries: Array.from(industries).sort(),
      companies: Array.from(companies.entries()).map(([id, name]) => ({ id, name })).sort((a, b) => a.name.localeCompare(b.name)),
      departments: Array.from(departments).sort(),
    };
  }, [reviews]);

  // Apply filters
  const filtered = useMemo(() => {
    let result = reviews;

    if (industry !== "all") result = result.filter((r) => r.companies?.industry === industry);
    if (company !== "all") result = result.filter((r) => r.company_id === company);
    if (roleLevel !== "all") result = result.filter((r) => normalizeRoleLevel(r.role_level) === roleLevel);
    if (department !== "all") result = result.filter((r) => normalizeDepartment(r.department) === department);

    if (dateRange === "this_year") {
      const cutoff = startOfYear(new Date());
      result = result.filter((r) => new Date(r.created_at) >= cutoff);
    } else if (dateRange === "last_year") {
      const start = startOfYear(subYears(new Date(), 1));
      const end = endOfYear(subYears(new Date(), 1));
      result = result.filter((r) => { const d = new Date(r.created_at); return d >= start && d <= end; });
    } else if (dateRange === "6m" || dateRange === "3m") {
      const months = dateRange === "6m" ? 6 : 3;
      const cutoff = subMonths(new Date(), months);
      result = result.filter((r) => new Date(r.created_at) >= cutoff);
    } else if (dateRange === "custom") {
      if (customFrom && customTo) {
        result = result.filter((r) => { const d = new Date(r.created_at); return d >= customFrom && d <= customTo; });
      } else if (customFrom) {
        result = result.filter((r) => new Date(r.created_at) >= customFrom);
      } else if (customTo) {
        result = result.filter((r) => new Date(r.created_at) <= customTo);
      }
    }

    return result;
  }, [reviews, industry, company, roleLevel, department, dateRange, customFrom, customTo]);

  // Distinct company count and total submissions from filtered data
  const distinctCompanyCount = useMemo(() => {
    const ids = new Set(filtered.map((r) => r.company_id));
    return ids.size;
  }, [filtered]);

  const totalSubmissions = useMemo(() => {
    return filtered.reduce((sum, r) => sum + r.sectionCount, 0);
  }, [filtered]);

  const resetFilters = () => {
    setIndustry("all");
    setCompany("all");
    setRoleLevel("all");
    setDepartment("all");
    setDateRange("all");
    setCustomFrom(undefined);
    setCustomTo(undefined);
  };

  // ── Helper: compute stats for an array of numbers ──
  const computeStats = (values: number[]) => {
    if (!values.length) return { avg: 0, median: 0, min: 0, max: 0, count: 0 };
    const sorted = [...values].sort((a, b) => a - b);
    const mid = Math.floor(sorted.length / 2);
    return {
      avg: Math.round(values.reduce((a, b) => a + b, 0) / values.length),
      median: Math.round(sorted.length % 2 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2),
      min: Math.round(sorted[0]),
      max: Math.round(sorted[sorted.length - 1]),
      count: values.length,
    };
  };

  // ── Compensation computations ──
  const { baseSalaryStats, totalCompStats, avgBenefitsUplift } = useMemo(() => {
    const withBase = filtered.filter((r) => r.base_salary_amount && r.base_salary_amount > 0);
    const baseSalaries = withBase.map((r) => r.base_salary_amount!);
    const totalComps = withBase.map((r) => getTotalComp(r as TotalCompInput));

    const uplifts = withBase.map((r) => getTotalComp(r as TotalCompInput) - (r.base_salary_amount || 0));
    const avgUplift = uplifts.length > 0 ? Math.round(uplifts.reduce((a, b) => a + b, 0) / uplifts.length) : 0;

    return {
      baseSalaryStats: computeStats(baseSalaries),
      totalCompStats: computeStats(totalComps),
      avgBenefitsUplift: avgUplift,
    };
  }, [filtered]);

  // ── Dual-dimension aggregation (base + total comp) ──
  const dualByDimension = (getter: (r: ReviewData) => string | null | undefined) => {
    const map: Record<string, { baseTotal: number; compTotal: number; count: number }> = {};
    filtered.forEach((r) => {
      const key = getter(r);
      if (key && r.base_salary_amount && r.base_salary_amount > 0) {
        if (!map[key]) map[key] = { baseTotal: 0, compTotal: 0, count: 0 };
        map[key].baseTotal += r.base_salary_amount;
        map[key].compTotal += getTotalComp(r as TotalCompInput);
        map[key].count++;
      }
    });
    return Object.entries(map)
      .map(([name, { baseTotal, compTotal, count }]) => ({
        name,
        base: Math.round(baseTotal / count),
        totalComp: Math.round(compTotal / count),
        count,
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);
  };

  const compByRoleLevel = useMemo(() => {
    const map: Record<string, { baseTotal: number; compTotal: number; count: number }> = {};
    filtered.forEach((r) => {
      const level = normalizeRoleLevel(r.role_level);
      if (level && r.base_salary_amount && r.base_salary_amount > 0) {
        if (!map[level]) map[level] = { baseTotal: 0, compTotal: 0, count: 0 };
        map[level].baseTotal += r.base_salary_amount;
        map[level].compTotal += getTotalComp(r as TotalCompInput);
        map[level].count++;
      }
    });
    return ROLE_LEVEL_ORDER.map((level) => ({
      name: level,
      base: map[level] ? Math.round(map[level].baseTotal / map[level].count) : 0,
      totalComp: map[level] ? Math.round(map[level].compTotal / map[level].count) : 0,
      count: map[level]?.count || 0,
    }));
  }, [filtered]);

  const compByIndustry = useMemo(() => dualByDimension((r) => r.companies?.industry), [filtered]);
  const compByDepartment = useMemo(() => dualByDimension((r) => normalizeDepartment(r.department)), [filtered]);
  const compByGender = useMemo(() => dualByDimension((r) => normalizeGender(r.gender)), [filtered]);

  // ── Ratings computations ──
  const avgOverallRating = useMemo(() => {
    const rated = filtered.filter((r) => r.rating > 0);
    if (!rated.length) return 0;
    return +(rated.reduce((a, r) => a + Number(r.rating), 0) / rated.length).toFixed(2);
  }, [filtered]);

  const avgByCategory = useMemo(() => {
    const map: Record<string, { total: number; count: number }> = {};
    filtered.forEach((r) => {
      r.rating_categories?.forEach((rc) => {
        if (!map[rc.category]) map[rc.category] = { total: 0, count: 0 };
        map[rc.category].total += Number(rc.rating);
        map[rc.category].count++;
      });
    });
    return Object.entries(map)
      .map(([name, { total, count }]) => ({ name, value: +(total / count).toFixed(2) }))
      .sort((a, b) => b.value - a.value);
  }, [filtered]);

  const ratingByIndustry = useMemo(() => {
    const map: Record<string, { total: number; count: number }> = {};
    filtered.forEach((r) => {
      const ind = r.companies?.industry;
      if (ind && r.rating > 0) {
        if (!map[ind]) map[ind] = { total: 0, count: 0 };
        map[ind].total += Number(r.rating);
        map[ind].count++;
      }
    });
    return Object.entries(map)
      .map(([name, { total, count }]) => ({ name, value: +(total / count).toFixed(2), count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);
  }, [filtered]);

  // ── Benefits Landscape computations ──

  // Determine whether a submission "has" a given benefit
  const submissionHasBenefit = (r: ReviewData, benefitKey: string): boolean => {
    // Check standard_benefit_ids (mapped via benefitIdToKey)
    if (r.standard_benefit_ids?.some((id) => benefitIdToKey[id] === benefitKey)) return true;
    // Check legacy review_standard_benefits
    const matchLabel = STANDARD_BENEFITS.find((b) => b.key === benefitKey)?.label;
    if (matchLabel && r.review_standard_benefits?.some((b) => b.standard_benefits?.benefit_label === matchLabel)) return true;
    // Check benefit_values for monetisable ones
    const def = STANDARD_BENEFITS.find((b) => b.key === benefitKey);
    if (def?.valueKey && r.benefit_values && Number(r.benefit_values[def.valueKey]) > 0) return true;
    // Standalone fields
    if (benefitKey === "thirteenth_cheque" && r.thirteenth_cheque_annual_value && r.thirteenth_cheque_annual_value > 0) return true;
    if (benefitKey === "performance_bonus" && r.performance_bonus_annual_value && r.performance_bonus_annual_value > 0) return true;
    return false;
  };

  const benefitsLandscape = useMemo(() => {
    const withAnyBenefit = filtered.filter((r) =>
      STANDARD_BENEFITS.some((b) => submissionHasBenefit(r, b.key))
    );
    const totalWithBenefits = withAnyBenefit.length;

    // Prevalence
    const prevalence = STANDARD_BENEFITS.map((b) => {
      const count = filtered.filter((r) => submissionHasBenefit(r, b.key)).length;
      return { key: b.key, label: b.label, count, pct: totalWithBenefits > 0 ? Math.round((count / totalWithBenefits) * 100) : 0 };
    }).sort((a, b) => b.pct - a.pct);

    // Average values for monetisable benefits
    const monetisableBenefits = STANDARD_BENEFITS.filter(
      (b) => b.monetisable && !["pension_nssa", "paid_leave", "flexible_remote", "funeral_assistance"].includes(b.key)
    );
    const avgValues = monetisableBenefits.map((b) => {
      const values: number[] = [];
      filtered.forEach((r) => {
        // Check top-level fields first (for section-based extraction)
        if (b.key === "thirteenth_cheque") {
          if (r.thirteenth_cheque_annual_value && r.thirteenth_cheque_annual_value > 0) values.push(r.thirteenth_cheque_annual_value / 12);
        } else if (b.key === "performance_bonus") {
          if (r.performance_bonus_annual_value && r.performance_bonus_annual_value > 0) values.push(r.performance_bonus_annual_value / 12);
        } else if (r.benefit_values) {
          // Try both the valueKey (e.g. "medical_aid_value") and the plain key (e.g. "medical_aid")
          const v = Number(r.benefit_values[b.valueKey!] || r.benefit_values[b.key]) || 0;
          if (v > 0) {
            values.push(ANNUAL_VALUE_KEYS.has(b.valueKey!) ? v / 12 : v);
          }
        }
      });
      const avg = values.length > 0 ? Math.round(values.reduce((a, c) => a + c, 0) / values.length) : 0;
      return { key: b.key, label: b.label, avg, submissions: values.length };
    }).filter((b) => b.submissions > 0).sort((a, b) => b.avg - a.avg);

    // Most common benefit
    const mostCommon = prevalence.length > 0 && prevalence[0].count > 0 ? prevalence[0] : null;

    // Highest value benefit
    const highestValue = avgValues.length > 0 ? avgValues[0] : null;

    // By role level
    const roleLevels = ROLE_LEVEL_ORDER;
    const byRoleLevel = STANDARD_BENEFITS.map((b) => ({
      label: b.label,
      levels: roleLevels.map((level) => {
        const levelSubs = filtered.filter((r) => normalizeRoleLevel(r.role_level) === level);
        if (levelSubs.length === 0) return 0;
        const has = levelSubs.filter((r) => submissionHasBenefit(r, b.key)).length;
        return Math.round((has / levelSubs.length) * 100);
      }),
    }));

    return { totalWithBenefits, prevalence, avgValues, mostCommon, highestValue, byRoleLevel, roleLevels };
  }, [filtered, benefitIdToKey]);

  // ── Composition computations ──
  const distributionOf = (getter: (r: ReviewData) => string | null | undefined) => {
    const map: Record<string, number> = {};
    filtered.forEach((r) => {
      const val = getter(r);
      // Skip entries where the getter returns null (avoids inflating "Not specified")
      const key = val || "Not specified";
      map[key] = (map[key] || 0) + 1;
    });
    return Object.entries(map).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value);
  };

  const roleLevelDist = useMemo(() => distributionOf((r) => normalizeRoleLevel(r.role_level)), [filtered]);
  const departmentDist = useMemo(() => distributionOf((r) => normalizeDepartment(r.department)), [filtered]);
  const employmentTypeDist = useMemo(() => distributionOf((r) => normalizeEmploymentType(r.employment_type)), [filtered]);
  const tenureDist = useMemo(() => distributionOf((r) => normalizeTenureRange(r.tenure_range)), [filtered]);
  const genderDist = useMemo(() => distributionOf((r) => normalizeGender(r.gender)), [filtered]);
  const ageRangeDist = useMemo(() => distributionOf((r) => normalizeAgeRange(r.age_range)), [filtered]);
  const educationDist = useMemo(() => distributionOf((r) => normalizeEducationLevel(r.education_level)), [filtered]);
  const ethnicityDist = useMemo(() => distributionOf((r) => normalizeEthnicity(r.ethnicity)), [filtered]);

  const fmt = (n: number) => `$${n.toLocaleString()}`;

  const barChartConfig = { value: { label: "Value", color: "#6C63FF" } };
  const dualBarConfig = {
    base: { label: "Base Salary", color: "#6C63FF" },
    totalComp: { label: "Total Compensation", color: "#4ECDC4" },
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-semibold text-foreground">Insights & Analytics</h1>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <Card key={i}><CardContent className="p-6"><div className="h-16 bg-muted animate-pulse rounded" /></CardContent></Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">Insights & Analytics</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Showing {totalSubmissions} submissions from {filtered.length} {filtered.length === 1 ? "reviewer" : "reviewers"} across {distinctCompanyCount} {distinctCompanyCount === 1 ? "company" : "companies"}
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={resetFilters} className="gap-2">
          <RotateCcw className="h-4 w-4" /> Reset Filters
        </Button>
      </div>

      {/* Filter Bar */}
      <Card>
        <CardContent className="p-4">
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
            <Select value={industry} onValueChange={setIndustry}>
              <SelectTrigger><SelectValue placeholder="Industry" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Industries</SelectItem>
                {filterOptions.industries.map((i) => <SelectItem key={i} value={i}>{i}</SelectItem>)}
              </SelectContent>
            </Select>

            <Select value={company} onValueChange={setCompany}>
              <SelectTrigger><SelectValue placeholder="Company" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Companies</SelectItem>
                {filterOptions.companies.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
              </SelectContent>
            </Select>

            <Select value={roleLevel} onValueChange={setRoleLevel}>
              <SelectTrigger><SelectValue placeholder="Role Level" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Levels</SelectItem>
                {ROLE_LEVEL_ORDER.map((l) => <SelectItem key={l} value={l}>{l}</SelectItem>)}
              </SelectContent>
            </Select>

            <Select value={department} onValueChange={setDepartment}>
              <SelectTrigger><SelectValue placeholder="Department" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Departments</SelectItem>
                {filterOptions.departments.map((d) => <SelectItem key={d} value={d}>{d}</SelectItem>)}
              </SelectContent>
            </Select>

            <Select value={dateRange} onValueChange={handleDateRangeChange}>
              <SelectTrigger><SelectValue placeholder="Time Range" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Time</SelectItem>
                <SelectItem value="this_year">This Year</SelectItem>
                <SelectItem value="last_year">Last Year</SelectItem>
                <SelectItem value="6m">Last 6 Months</SelectItem>
                <SelectItem value="3m">Last 3 Months</SelectItem>
                <SelectItem value="custom">Custom Range</SelectItem>
              </SelectContent>
            </Select>
          </div>
          {dateRange === "custom" && (
            <div className="flex gap-3 mt-3">
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className={cn("flex-1 justify-start text-left font-normal text-sm", !customFrom && "text-muted-foreground")}>
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {customFrom ? format(customFrom, "PPP") : "From"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar mode="single" selected={customFrom} onSelect={setCustomFrom} initialFocus className={cn("p-3 pointer-events-auto")} />
                </PopoverContent>
              </Popover>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className={cn("flex-1 justify-start text-left font-normal text-sm", !customTo && "text-muted-foreground")}>
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {customTo ? format(customTo, "PPP") : "To"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar mode="single" selected={customTo} onSelect={setCustomTo} initialFocus className={cn("p-3 pointer-events-auto")} />
                </PopoverContent>
              </Popover>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Section 1: Compensation Overview */}
      <section className="space-y-4">
        <h2 className="text-lg font-semibold text-foreground">Compensation Overview</h2>

        {/* 2x3 Metric Grid */}
        <div className="grid grid-cols-2 gap-4">
          <Card>
            <CardContent className="p-4">
              <p className="text-xs text-foreground">Average Base Salary</p>
              <p className="text-2xl font-semibold text-foreground mt-1">{fmt(baseSalaryStats.avg)}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <p className="text-xs text-foreground">Average Total Compensation</p>
              <p className="text-2xl font-semibold text-foreground mt-1">{fmt(totalCompStats.avg)}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <p className="text-xs text-foreground">Median Base Salary</p>
              <p className="text-2xl font-semibold text-foreground mt-1">{fmt(baseSalaryStats.median)}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <p className="text-xs text-foreground">Median Total Compensation</p>
              <p className="text-2xl font-semibold text-foreground mt-1">{fmt(totalCompStats.median)}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <p className="text-xs text-foreground">Min Total Compensation</p>
              <p className="text-2xl font-semibold text-foreground mt-1">{fmt(totalCompStats.min)}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <p className="text-xs text-foreground">Max Total Compensation</p>
              <p className="text-2xl font-semibold text-foreground mt-1">{fmt(totalCompStats.max)}</p>
            </CardContent>
          </Card>
        </div>

        {/* Benefits Uplift */}
        <Card className="border-dashed border-[#6C63FF]/30 bg-[#6C63FF]/5">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-[#6C63FF]/10 flex items-center justify-center shrink-0">
              <TrendingUp className="h-5 w-5 text-[#6C63FF]" />
            </div>
            <div>
              <p className="text-xs text-foreground">Benefits Uplift</p>
              <p className="text-lg font-semibold text-foreground">
                + {fmt(avgBenefitsUplift)}/month on average from benefits
              </p>
              <p className="text-xs text-foreground">
                Average difference between total compensation and base salary across {baseSalaryStats.count} submissions
              </p>
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <DualBarChartCard title="Avg Total Compensation by Role Level" data={compByRoleLevel} config={dualBarConfig} formatter={fmt} />
          <DualBarChartCard title="Avg Total Compensation by Gender" data={compByGender} config={dualBarConfig} formatter={fmt} />
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <DualBarChartCard title="Avg Total Compensation by Industry" data={compByIndustry} config={dualBarConfig} formatter={fmt} />
          <DualBarChartCard title="Avg Total Compensation by Department" data={compByDepartment} config={dualBarConfig} formatter={fmt} />
        </div>
      </section>

      {/* Section 2: Ratings Breakdown */}
      <section className="space-y-4">
        <h2 className="text-lg font-semibold text-foreground">Ratings Breakdown</h2>

        <HorizontalBarCard title="Average by Category" data={avgByCategory} maxValue={5} showOutOf5 overallAvg={String(avgOverallRating)} />

        <BarChartCard title="Avg Rating by Industry" data={ratingByIndustry} config={{ value: { label: "Rating", color: "#6C63FF" } }} formatter={(v) => `${v}`} yDomain={[0, 5]} />
      </section>

      {/* Section 3: Benefits Landscape */}
      <section className="space-y-4">
        <h2 className="text-lg font-semibold text-foreground">Benefits Landscape</h2>

        {/* 2x2 Summary Metric Cards */}
        <div className="grid grid-cols-2 gap-4">
          <Card>
            <CardContent className="p-4">
              <p className="text-xs text-foreground">Submissions with Benefits Data</p>
              <p className="text-2xl font-semibold text-foreground mt-1">{benefitsLandscape.totalWithBenefits}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <p className="text-xs text-foreground">Average Benefits Uplift</p>
              <p className="text-2xl font-semibold text-foreground mt-1">+ {fmt(avgBenefitsUplift)}/mo</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <p className="text-xs text-foreground">Most Common Benefit</p>
              <p className="text-lg font-semibold text-foreground mt-1">
                {benefitsLandscape.mostCommon ? `${benefitsLandscape.mostCommon.label} (${benefitsLandscape.mostCommon.pct}%)` : "No data"}
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <p className="text-xs text-foreground">Highest Value Benefit</p>
              <p className="text-lg font-semibold text-foreground mt-1">
                {benefitsLandscape.highestValue ? `${benefitsLandscape.highestValue.label} (${fmt(benefitsLandscape.highestValue.avg)}/mo)` : "No data"}
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Benefit Prevalence Chart */}
        <Card>
          <CardHeader className="px-4 pt-4 pb-2">
            <CardTitle className="text-sm font-medium">Benefit Prevalence</CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-0 space-y-2">
            {benefitsLandscape.prevalence.length > 0 ? benefitsLandscape.prevalence.map((item, i) => (
              <div key={item.key} className="flex items-center gap-3">
                <span className="text-xs text-foreground w-[200px] truncate shrink-0">{item.label}</span>
                <div className="flex-1 bg-muted rounded-full h-4 overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all"
                    style={{
                      width: `${Math.max(item.pct, 2)}%`,
                      backgroundColor: CHART_COLORS[i % CHART_COLORS.length],
                    }}
                  />
                </div>
                <span className="text-xs font-medium text-foreground w-12 text-right">{item.pct}%</span>
              </div>
            )) : <p className="text-sm text-muted-foreground">No data available</p>}
          </CardContent>
        </Card>

        {/* Average Benefit Values Chart */}
        <Card>
          <CardHeader className="px-4 pt-4 pb-2">
            <CardTitle className="text-sm font-medium">Average Benefit Values (Monthly)</CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-0 space-y-3">
            {benefitsLandscape.avgValues.length > 0 ? benefitsLandscape.avgValues.map((item, i) => (
              <div key={item.key}>
                <div className="flex items-center gap-3">
                  <span className="text-xs text-foreground w-[200px] truncate shrink-0">{item.label}</span>
                  <div className="flex-1 bg-muted rounded-full h-4 overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all"
                      style={{
                        width: `${Math.max((item.avg / (benefitsLandscape.avgValues[0]?.avg || 1)) * 100, 4)}%`,
                        backgroundColor: CHART_COLORS[i % CHART_COLORS.length],
                      }}
                    />
                  </div>
                  <span className="text-xs font-medium text-foreground w-20 text-right">{fmt(item.avg)}/mo</span>
                </div>
                <p className="text-[10px] text-foreground ml-[212px]">Based on {item.submissions} submission{item.submissions !== 1 ? "s" : ""}</p>
              </div>
            )) : <p className="text-sm text-muted-foreground">No data available</p>}
          </CardContent>
        </Card>

        {/* Benefits by Role Level Table */}
        <Card>
          <CardHeader className="px-4 pt-4 pb-2">
            <CardTitle className="text-sm font-medium">Benefits by Role Level</CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-0">
            <div className="overflow-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-xs w-[180px]">Benefit</TableHead>
                    {benefitsLandscape.roleLevels.map((level) => (
                      <TableHead key={level} className="text-xs text-center">{level}</TableHead>
                    ))}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {benefitsLandscape.byRoleLevel.map((row) => (
                    <TableRow key={row.label}>
                      <TableCell className="text-xs font-medium">{row.label}</TableCell>
                      {row.levels.map((pct, i) => (
                        <TableCell
                          key={i}
                          className={`text-xs text-center ${
                            pct > 50
                              ? "bg-[#4ECDC4]/15 text-[#4ECDC4]"
                              : pct < 20
                                ? "text-muted-foreground"
                                : ""
                          }`}
                        >
                          {pct > 0 ? `${pct}%` : "—"}
                        </TableCell>
                      ))}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </section>

      {/* Section 4: Workforce Composition */}
      <section className="space-y-4">
        <h2 className="text-lg font-semibold text-foreground">Workforce Composition</h2>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <DonutCard title="By Role Level" data={roleLevelDist} />
          <DonutCard title="By Department" data={departmentDist} />
          <DonutCard title="By Employment Type" data={employmentTypeDist} />
          <DonutCard title="By Tenure" data={tenureDist} />
          <DonutCard title="By Gender" data={genderDist} />
          <DonutCard title="By Age Range" data={ageRangeDist} />
          <DonutCard title="By Education Level" data={educationDist} />
          <DonutCard title="By Ethnicity" data={ethnicityDist} />
        </div>
      </section>
    </div>
  );
};

// ── Reusable chart sub-components ──

function DualBarChartCard({ title, data, config, formatter, horizontal }: {
  title: string;
  data: { name: string; base: number; totalComp: number }[];
  config: Record<string, any>;
  formatter: (v: number) => string;
  horizontal?: boolean;
}) {
  if (!data.length) return <Card><CardHeader className="px-4 pt-4 pb-2"><CardTitle className="text-sm font-medium">{title}</CardTitle></CardHeader><CardContent className="p-4 pt-0"><p className="text-sm text-muted-foreground">No data available</p></CardContent></Card>;

  const chartHeight = horizontal ? Math.max(280, data.length * 50) : 280;

  return (
    <Card>
      <CardHeader className="px-4 pt-4 pb-2 flex flex-row items-center justify-between">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1.5">
            <div className="h-2.5 w-2.5 rounded-sm" style={{ backgroundColor: "#6C63FF" }} />
            <span className="text-xs text-foreground">Base Salary</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="h-2.5 w-2.5 rounded-sm" style={{ backgroundColor: "#4ECDC4" }} />
            <span className="text-xs text-foreground">Total Compensation</span>
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-4 pt-0">
        <ChartContainer config={config} className="w-full" style={{ height: `${chartHeight}px` }}>
          {horizontal ? (
            <BarChart data={data} layout="vertical" margin={{ top: 5, right: 10, left: 10, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" horizontal={false} />
              <XAxis type="number" tick={{ fontSize: 11, fill: "hsl(var(--foreground))" }} tickFormatter={formatter} />
              <YAxis type="category" dataKey="name" tick={{ fontSize: 11, fill: "hsl(var(--foreground))" }} width={160} interval={0} />
              <ChartTooltip content={<ChartTooltipContent formatter={(val) => formatter(Number(val))} />} />
              <Bar dataKey="base" name="Base Salary" fill="#6C63FF" radius={[0, 4, 4, 0]} />
              <Bar dataKey="totalComp" name="Total Compensation" fill="#4ECDC4" radius={[0, 4, 4, 0]} />
            </BarChart>
          ) : (
            <BarChart data={data} margin={{ top: 5, right: 10, left: 10, bottom: 60 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="name" tick={{ fontSize: 11, fill: "hsl(var(--foreground))" }} angle={-35} textAnchor="end" interval={0} />
              <YAxis tick={{ fontSize: 11, fill: "hsl(var(--foreground))" }} tickFormatter={formatter} />
              <ChartTooltip content={<ChartTooltipContent formatter={(val) => formatter(Number(val))} />} />
              <Bar dataKey="base" name="Base Salary" fill="#6C63FF" radius={[4, 4, 0, 0]} />
              <Bar dataKey="totalComp" name="Total Compensation" fill="#4ECDC4" radius={[4, 4, 0, 0]} />
            </BarChart>
          )}
        </ChartContainer>
      </CardContent>
    </Card>
  );
}

function BarChartCard({ title, data, config, formatter, yDomain }: { title: string; data: { name: string; value: number }[]; config: Record<string, any>; formatter: (v: number) => string; yDomain?: [number, number] }) {
  if (!data.length) return <Card><CardHeader className="px-4 pt-4 pb-2"><CardTitle className="text-sm font-medium">{title}</CardTitle></CardHeader><CardContent className="p-4 pt-0"><p className="text-sm text-muted-foreground">No data available</p></CardContent></Card>;

  return (
    <Card>
      <CardHeader className="px-4 pt-4 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
      </CardHeader>
      <CardContent className="p-4 pt-0">
        <ChartContainer config={config} className="h-[300px] w-full">
          <BarChart data={data} margin={{ top: 5, right: 10, left: 10, bottom: 80 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} />
            <XAxis dataKey="name" tick={{ fontSize: 10, fill: "hsl(var(--foreground))" }} angle={-45} textAnchor="end" interval={0} height={80} />
            <YAxis tick={{ fontSize: 11, fill: "hsl(var(--foreground))" }} tickFormatter={formatter} domain={yDomain} />
            <ChartTooltip content={<ChartTooltipContent formatter={(val) => formatter(Number(val))} />} />
            <Bar dataKey="value" fill="var(--color-value)" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}

function HorizontalBarCard({ title, data, maxValue, showOutOf5, overallAvg }: { title: string; data: { name: string; value: number }[]; maxValue?: number; showOutOf5?: boolean; overallAvg?: string }) {
  if (!data.length) return <Card><CardHeader className="px-4 pt-4 pb-2"><CardTitle className="text-sm font-medium">{title}</CardTitle></CardHeader><CardContent className="p-4 pt-0"><p className="text-sm text-muted-foreground">No data available</p></CardContent></Card>;

  const max = maxValue || Math.max(...data.map((d) => d.value));

  return (
    <Card>
      <CardHeader className="px-4 pt-4 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
      </CardHeader>
      <CardContent className="p-4 pt-0 space-y-2">
        {overallAvg && (
          <div className="mb-3">
            <p className="text-lg font-bold text-foreground">Overall: {overallAvg} / 5</p>
            <p className="text-xs text-foreground">Average across all categories</p>
          </div>
        )}
        {data.map((item, i) => (
          <div key={item.name} className="flex items-center gap-3">
            <span className="text-xs text-foreground w-[200px] shrink-0 leading-tight">{item.name}</span>
            <div className="flex-1 bg-muted rounded-full h-4 overflow-hidden">
              <div
                className="h-full rounded-full transition-all"
                style={{
                  width: `${Math.max((item.value / max) * 100, 4)}%`,
                  backgroundColor: CHART_COLORS[i % CHART_COLORS.length],
                }}
              />
            </div>
            <span className="text-xs font-medium text-foreground w-16 text-right shrink-0">{showOutOf5 ? `${item.value} / 5` : item.value}</span>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

function DonutCard({ title, data }: { title: string; data: { name: string; value: number }[] }) {
  if (!data.length) return <Card><CardHeader className="px-4 pt-4 pb-2"><CardTitle className="text-sm font-medium">{title}</CardTitle></CardHeader><CardContent className="p-4 pt-0"><p className="text-sm text-muted-foreground">No data available</p></CardContent></Card>;

  // Separate "Not specified" from real data
  const specified = data.filter((d) => d.name !== "Not specified");
  const notSpecified = data.find((d) => d.name === "Not specified");
  const chartData = specified.length > 0 ? specified : data;

  const total = data.reduce((a, b) => a + b.value, 0);
  const pieConfig = chartData.reduce((acc, item, i) => {
    acc[item.name] = { label: item.name, color: CHART_COLORS[i % CHART_COLORS.length] };
    return acc;
  }, {} as Record<string, { label: string; color: string }>);

  return (
    <Card>
      <CardHeader className="px-4 pt-4 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
      </CardHeader>
      <CardContent className="p-4 pt-0">
        <ChartContainer config={pieConfig} className="h-[180px] w-full">
          <PieChart>
            <Pie data={chartData} cx="50%" cy="50%" innerRadius={40} outerRadius={70} dataKey="value" nameKey="name" paddingAngle={2}>
              {chartData.map((_, i) => (
                <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
              ))}
            </Pie>
            <ChartTooltip content={<ChartTooltipContent />} />
          </PieChart>
        </ChartContainer>
        <div className="mt-2 space-y-1">
          {chartData.map((item, i) => (
            <div key={item.name} className="flex items-center gap-2 text-xs">
              <div className="h-2 w-2 rounded-full shrink-0" style={{ backgroundColor: CHART_COLORS[i % CHART_COLORS.length] }} />
              <span className="text-foreground truncate flex-1">{item.name}</span>
              <span className="font-medium text-foreground">{Math.round((item.value / total) * 100)}%</span>
            </div>
          ))}
          {notSpecified && notSpecified.value > 0 && (
            <div className="flex items-center gap-2 text-xs pt-1 border-t border-border/50">
              <div className="h-2 w-2 rounded-full shrink-0 bg-muted-foreground/30" />
              <span className="text-muted-foreground truncate flex-1">Not specified</span>
              <span className="font-medium text-muted-foreground">{Math.round((notSpecified.value / total) * 100)}%</span>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

export default InsightsDashboard;
