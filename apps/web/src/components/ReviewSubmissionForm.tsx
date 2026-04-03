"use client";

import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { createBrowserSupabaseClient } from "@/lib/supabase/client";
import { toast } from "@/hooks/use-toast";
import { Loader2, Star, Plus, X } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Json } from "@/types/supabase";
import { SalaryInput } from "@/components/SalaryInput";
import { FormSectionCard } from "@/components/review/FormSectionCard";
import { WritingSuggestion } from "@/components/review/WritingSuggestion";
import { CharacterCounter } from "@/components/review/CharacterCounter";
import { cn } from "@/lib/utils";
import { extractEdgeFunctionError } from "@/lib/edge-function-errors";
const supabase = createBrowserSupabaseClient();

// Validation rules aligned with backend requirements
const VALIDATION_RULES = {
  title: { min: 20, max: 100 },
  pros: { min: 30, max: 300 },
  cons: { min: 30, max: 300 },
} as const;

interface ReviewSubmissionFormProps {
  companyId: string;
  companyName: string;
  sessionId: string;
  reviewToken: string;
  onSuccess: (reviewId?: string) => void;
}

interface RatingCategory {
  id: string;
  category_key: string;
  category_label: string;
  category_description: string | null;
  display_order: number;
  is_active: boolean | null;
  value: number;
}

interface FormField {
  id: string;
  field_key: string;
  field_label: string;
  field_type: string;
  display_order: number;
  is_required: boolean | null;
  is_visible: boolean | null;
  placeholder: string | null;
  description: string | null;
  options: Json | null;
  allow_other_text: boolean | null;
  other_text_placeholder: string | null;
  section_id: string | null;
}

interface FormSection {
  id: string;
  section_key: string;
  section_title: string;
  section_description: string | null;
  section_icon: string | null;
  display_order: number;
  is_visible: boolean | null;
}

interface FormConfig {
  id: string;
  form_type: string;
  title: string | null;
  description: string | null;
  updated_at: string | null;
}

interface CompanyBenefit {
  id: string;
  benefit_name: string;
}

interface StandardBenefit {
  id: string;
  benefit_key: string;
  benefit_label: string;
  display_order: number;
}

const parseOptions = (options: Json | null): string[] => {
  if (!options) return [];
  if (typeof options === "string") {
    try {
      return JSON.parse(options);
    } catch {
      return [];
    }
  }
  if (Array.isArray(options)) {
    return options.map(String);
  }
  return [];
};

export function ReviewSubmissionForm({ 
  companyId, 
  companyName, 
  sessionId, 
  reviewToken,
  onSuccess 
}: ReviewSubmissionFormProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [isConfigLoading, setIsConfigLoading] = useState(true);
  const [companyBenefits, setCompanyBenefits] = useState<CompanyBenefit[]>([]);
  const [standardBenefits, setStandardBenefits] = useState<StandardBenefit[]>([]);
  const [confirmedCompanyBenefits, setConfirmedCompanyBenefits] = useState<Set<string>>(new Set());
  const [confirmedStandardBenefits, setConfirmedStandardBenefits] = useState<Set<string>>(new Set());
  const [customBenefits, setCustomBenefits] = useState<string[]>([]);
  const [newCustomBenefit, setNewCustomBenefit] = useState("");
  const [ratingCategories, setRatingCategories] = useState<RatingCategory[]>([]);
  const [formConfig, setFormConfig] = useState<FormConfig | null>(null);
  const [formSections, setFormSections] = useState<FormSection[]>([]);
  const [formFields, setFormFields] = useState<FormField[]>([]);
  const [otherTextValues, setOtherTextValues] = useState<Record<string, string>>({});
  const [fieldErrors, setFieldErrors] = useState<Set<string>>(new Set());
  
  const [formData, setFormData] = useState({
    // Employment Context
    employmentStatus: "",
    employmentType: "",
    roleLevel: "",
    department: "",
    roleFocus: "",
    tenureRange: "",
    // Compensation - structured salary fields
    baseSalaryCurrency: "USD",
    baseSalaryAmount: "",
    isNetSalary: false,
    allowancesCurrency: "USD",
    allowancesAmount: "",
    bonusCurrency: "USD",
    bonusAmount: "",
    // Legacy field (kept for backwards compatibility)
    salaryRange: "",
    marketAlignment: "",
    payTransparency: "",
    // Review Content
    title: "",
    pros: "",
    cons: "",
    advice: "",
    // Recommendation
    recommendation: "",
    ceoApproval: "",
    // Private Feedback
    privateFeedback: "",
    // Demographics (optional)
    ageRange: "",
    gender: "",
    ethnicity: "",
    educationLevel: "",
    // End year (for former employees)
    endYear: "",
    // Interview Experience (optional)
    didInterview: "",
    interviewExperienceRating: 0,
    interviewCount: "",
    interviewDifficulty: "",
    interviewDescription: "",
    interviewTips: "",
  });

  // Section tracking for progress indicator
  const [activeSection, setActiveSection] = useState("employment");
  const [completedSections, setCompletedSections] = useState<Set<string>>(new Set());
  
  const employmentRef = useRef<HTMLDivElement>(null);
  const compensationRef = useRef<HTMLDivElement>(null);
  const benefitsRef = useRef<HTMLDivElement>(null);
  const ratingsRef = useRef<HTMLDivElement>(null);
  const reviewRef = useRef<HTMLDivElement>(null);
  const demographicsRef = useRef<HTMLDivElement>(null);
  const feedbackRef = useRef<HTMLDivElement>(null);
  const interviewRef = useRef<HTMLDivElement>(null);

  // Track which section is in view
  useEffect(() => {
    const refs = [employmentRef, compensationRef, benefitsRef, ratingsRef, reviewRef, demographicsRef, feedbackRef, interviewRef];
    
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const sectionId = entry.target.id.replace("section-", "");
            setActiveSection(sectionId);
          }
        });
      },
      {
        rootMargin: "-20% 0px -60% 0px",
        threshold: 0,
      }
    );

    refs.forEach((ref) => {
      if (ref.current) {
        observer.observe(ref.current);
      }
    });

    return () => observer.disconnect();
  }, [isConfigLoading]);

  const handleSelectChange = (fieldKey: string, value: string, formDataKey: keyof typeof formData) => {
    setFormData(prev => ({ ...prev, [formDataKey]: value }));
    // Clear "other" text if selecting a non-Other option
    if (value.toLowerCase() !== 'other') {
      setOtherTextValues(prev => {
        const newValues = { ...prev };
        delete newValues[fieldKey];
        return newValues;
      });
    }
  };

  const handleOtherTextChange = (fieldKey: string, text: string) => {
    setOtherTextValues(prev => ({ ...prev, [fieldKey]: text }));
  };

  const getFieldValue = (fieldKey: string, formDataKey: keyof typeof formData): string => {
    const baseValue = formData[formDataKey];
    if (typeof baseValue === 'string' && baseValue.toLowerCase() === 'other' && otherTextValues[fieldKey]) {
      return `other:${otherTextValues[fieldKey]}`;
    }
    return typeof baseValue === 'string' ? baseValue : String(baseValue);
  };

  const isOtherSelected = (formDataKey: keyof typeof formData): boolean => {
    const value = formData[formDataKey];
    return typeof value === 'string' && value.toLowerCase() === 'other';
  };

  const shouldShowOtherInput = (fieldKey: string, formDataKey: keyof typeof formData): boolean => {
    const field = getField(fieldKey);
    return Boolean(field?.allow_other_text) && isOtherSelected(formDataKey);
  };

  useEffect(() => {
    async function fetchConfig() {
      setIsConfigLoading(true);
      
      try {
        // First, fetch the active review_form configuration dynamically
        const { data: configData, error: configError } = await supabase
          .from("form_configurations")
          .select("id, form_type, title, description, updated_at")
          .eq("form_type", "review_form")
          .eq("is_active", true)
          .single();
        
        if (configError) {
          console.error("Error fetching form config:", configError);
        }
        
        const formConfigId = configData?.id;
        setFormConfig(configData || null);
        
        console.log("Loaded form config:", configData?.id, "updated_at:", configData?.updated_at);
        
        // Now fetch sections and fields using the dynamic config ID
        const [categoriesRes, sectionsRes, fieldsRes, companyBenefitsRes, standardBenefitsRes] = await Promise.all([
          supabase
            .from("rating_category_configs")
            .select("*")
            .eq("is_active", true)
            .order("display_order"),
          formConfigId ? supabase
            .from("form_sections")
            .select("*")
            .eq("form_config_id", formConfigId)
            .eq("is_visible", true)
            .order("display_order") : Promise.resolve({ data: null, error: null }),
          formConfigId ? supabase
            .from("form_fields")
            .select("*")
            .eq("form_config_id", formConfigId)
            .eq("is_visible", true)
            .order("display_order") : Promise.resolve({ data: null, error: null }),
          supabase
            .from("company_benefits")
            .select("id, benefit_name")
            .eq("company_id", companyId),
          supabase
            .from("standard_benefits")
            .select("*")
            .eq("is_active", true)
            .order("display_order"),
        ]);

        if (categoriesRes.data) {
          setRatingCategories(
            categoriesRes.data.map((cat) => ({ ...cat, value: 0 }))
          );
        }
        
        if (sectionsRes.data) {
          setFormSections(sectionsRes.data);
          console.log("Loaded", sectionsRes.data.length, "form sections");
        }
        
        if (fieldsRes.data) {
          setFormFields(fieldsRes.data);
          console.log("Loaded", fieldsRes.data.length, "form fields");
          
          // Log key field descriptions for debugging
          const salaryField = fieldsRes.data.find((f: FormField) => f.field_key === "salary_range");
          const adviceField = fieldsRes.data.find((f: FormField) => f.field_key === "advice");
          console.log("salary_range description:", salaryField?.description?.substring(0, 60) || "(none)");
          console.log("advice field present:", !!adviceField, "label:", adviceField?.field_label);
        }
        
        setCompanyBenefits(companyBenefitsRes.data || []);
        setStandardBenefits(standardBenefitsRes.data || []);
      } catch (error) {
        console.error("Error fetching form configuration:", error);
      }
      
      setIsConfigLoading(false);
    }
    
    fetchConfig();
  }, [companyId]);

  const toggleCompanyBenefit = (benefitId: string) => {
    setConfirmedCompanyBenefits(prev => {
      const newSet = new Set(prev);
      if (newSet.has(benefitId)) {
        newSet.delete(benefitId);
      } else {
        newSet.add(benefitId);
      }
      return newSet;
    });
  };

  const toggleStandardBenefit = (benefitId: string) => {
    setConfirmedStandardBenefits(prev => {
      const newSet = new Set(prev);
      if (newSet.has(benefitId)) {
        newSet.delete(benefitId);
      } else {
        newSet.add(benefitId);
      }
      return newSet;
    });
  };

  const handleAddCustomBenefit = () => {
    const trimmed = newCustomBenefit.trim();
    if (!trimmed) return;
    if (customBenefits.some(b => b.toLowerCase() === trimmed.toLowerCase())) {
      toast({
        title: "Benefit already added",
        description: "This benefit is already in your list.",
        variant: "destructive",
      });
      return;
    }
    setCustomBenefits(prev => [...prev, trimmed]);
    setNewCustomBenefit("");
  };

  const handleRemoveCustomBenefit = (benefit: string) => {
    setCustomBenefits(prev => prev.filter(b => b !== benefit));
  };

  const handleRatingClick = (categoryKey: string, rating: number) => {
    setRatingCategories(prev => 
      prev.map(cat => 
        cat.category_key === categoryKey ? { ...cat, value: rating } : cat
      )
    );
  };

  const calculateOverallRating = () => {
    const validRatings = ratingCategories.filter(r => r.value > 0);
    if (validRatings.length === 0) return 0;
    return validRatings.reduce((sum, r) => sum + r.value, 0) / validRatings.length;
  };

  const getField = (key: string) => formFields.find(f => f.field_key === key);
  const isFieldVisible = (key: string) => getField(key) !== undefined;
  const isFieldRequired = (key: string) => getField(key)?.is_required ?? false;
  const getFieldLabel = (key: string, fallback: string) => getField(key)?.field_label ?? fallback;
  const getFieldPlaceholder = (key: string, fallback: string) => getField(key)?.placeholder ?? fallback;
  const getFieldOptions = (key: string) => parseOptions(getField(key)?.options ?? null);

  // Clear field error when user starts typing/selecting
  const clearFieldError = (fieldKey: string) => {
    if (fieldErrors.has(fieldKey)) {
      setFieldErrors(prev => {
        const newErrors = new Set(prev);
        newErrors.delete(fieldKey);
        return newErrors;
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Collect all validation errors at once
    const errors = new Set<string>();

    // Validation based on dynamic config
    if (isFieldRequired("employment_status") && !formData.employmentStatus) {
      errors.add("employment_status");
    }

    if (isFieldRequired("employment_type") && !formData.employmentType) {
      errors.add("employment_type");
    }

    if (isFieldRequired("role_level") && !formData.roleLevel) {
      errors.add("role_level");
    }

    // Validate base salary is required
    if (!formData.baseSalaryAmount) {
      errors.add("base_salary");
    }

    if (isFieldRequired("title") && !formData.title.trim()) {
      errors.add("title");
    } else if (isFieldRequired("title") && formData.title.trim().length < VALIDATION_RULES.title.min) {
      errors.add("title");
    }
    
    if (isFieldRequired("pros") && !formData.pros.trim()) {
      errors.add("pros");
    } else if (isFieldRequired("pros") && formData.pros.trim().length < VALIDATION_RULES.pros.min) {
      errors.add("pros");
    }
    
    if (isFieldRequired("cons") && !formData.cons.trim()) {
      errors.add("cons");
    } else if (isFieldRequired("cons") && formData.cons.trim().length < VALIDATION_RULES.cons.min) {
      errors.add("cons");
    }

    if (isFieldRequired("recommendation") && !formData.recommendation) {
      errors.add("recommendation");
    }

    // Validate ALL ratings are required
    const allRatingsComplete = ratingCategories.every(cat => cat.value > 0);
    if (!allRatingsComplete) {
      errors.add("ratings");
    }
    
    const overallRating = calculateOverallRating();

    // If there are any errors, show single toast and highlight fields
    if (errors.size > 0) {
      setFieldErrors(errors);
      toast({
        title: "Please fix errors before submitting",
        description: "Some required fields still need your attention.",
        variant: "destructive",
      });
      return;
    }

    // Clear any previous errors on successful validation
    setFieldErrors(new Set());

    setIsLoading(true);

    try {

      const { data, error } = await supabase.functions.invoke('submit-review', {
        body: {
          review_token: reviewToken,
          session_id: sessionId,
          company_id: companyId,
          title: formData.title,
          employment_status: getFieldValue("employment_status", "employmentStatus") || null,
          employment_type: formData.employmentType || null,
          role_level: getFieldValue("role_level", "roleLevel") || null,
          department: getFieldValue("department", "department") || null,
          tenure_range: formData.tenureRange || null,
          // Structured salary fields
          base_salary_currency: formData.baseSalaryCurrency || null,
          base_salary_amount: formData.baseSalaryAmount ? parseFloat(formData.baseSalaryAmount) : null,
          is_net_salary: formData.isNetSalary,
          allowances_currency: formData.allowancesAmount ? formData.allowancesCurrency : null,
          allowances_amount: formData.allowancesAmount ? parseFloat(formData.allowancesAmount) : null,
          bonus_currency: formData.bonusAmount ? formData.bonusCurrency : null,
          bonus_amount: formData.bonusAmount ? parseFloat(formData.bonusAmount) : null,
          // Legacy field
          salary_range: formData.salaryRange || null,
          market_alignment: formData.marketAlignment || null,
          pay_transparency: formData.payTransparency || null,
          pros: formData.pros,
          cons: formData.cons,
          advice: formData.advice || null,
          rating: overallRating,
          recommendation: formData.recommendation || null,
          ceo_approval: formData.ceoApproval === "Yes" ? true : formData.ceoApproval === "No" ? false : null,
          ratings: ratingCategories
            .filter(r => r.value > 0)
            .map(r => ({
              category: r.category_label,
              rating: r.value,
            })),
          company_benefit_ids: Array.from(confirmedCompanyBenefits),
          standard_benefit_ids: Array.from(confirmedStandardBenefits),
          custom_benefits: customBenefits,
          private_feedback: formData.privateFeedback || null,
          // Demographics (optional)
          age_range: formData.ageRange || null,
          gender: formData.gender || null,
          ethnicity: formData.ethnicity || null,
          education_level: formData.educationLevel || null,
          // Interview Experience (optional)
          did_interview: formData.didInterview === "Yes" ? true : formData.didInterview === "No" ? false : null,
          interview_experience_rating: formData.interviewExperienceRating > 0 ? formData.interviewExperienceRating : null,
          interview_count: formData.interviewCount ? parseInt(formData.interviewCount) : null,
          interview_difficulty: formData.interviewDifficulty || null,
          interview_description: formData.interviewDescription || null,
          interview_tips: formData.interviewTips || null,
          // End year for former employees
          end_year: formData.endYear ? parseInt(formData.endYear) : null,
        },
      });

      const errorMessage = await extractEdgeFunctionError({ data, error });
      if (errorMessage) {
        throw new Error(errorMessage);
      }
      
      
      if (!data?.success) {
        throw new Error(data?.error || "Failed to submit review");
      }

      toast({
        title: "Review submitted!",
        description: "Your review will be published after moderation (usually within 48 hours).",
      });

      console.log("submit-review response data:", data);
      onSuccess(data?.review_id);
    } catch (error: any) {
      console.error("Error submitting review:", error);
      toast({
        title: "Failed to submit review",
        description: error.message || "Please try again later.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Separate rating categories
  const compensationRating = ratingCategories.find(r => r.category_key === "compensation_fairness");
  const coreRatings = ratingCategories.filter(r => 
    r.category_key !== "compensation_fairness"
  );

  // Calculate granular progress based on individual fields filled
  const formProgress = useMemo(() => {
    let filledCount = 0;
    const totalFields = 14 + coreRatings.length; // Base fields + rating categories
    
    // Employment fields (4 core fields)
    if (formData.employmentStatus) filledCount++;
    if (formData.employmentType) filledCount++;
    if (formData.roleLevel) filledCount++;
    if (formData.department) filledCount++;
    
    // Compensation fields (1 core field)
    if (formData.baseSalaryAmount) filledCount++;
    
    // Rating categories
    coreRatings.forEach(r => {
      if (r.value > 0) filledCount++;
    });
    
    // Review fields (3 core fields)
    if (formData.title) filledCount++;
    if (formData.pros) filledCount++;
    if (formData.cons) filledCount++;
    
    // Recommendation fields (2 fields)
    if (formData.recommendation) filledCount++;
    if (formData.ceoApproval) filledCount++;
    
    return Math.min((filledCount / totalFields) * 100, 100);
  }, [formData, coreRatings]);

  // Mark sections as completed based on filled data
  useEffect(() => {
    const completed = new Set<string>();
    
    // Employment section
    if (formData.employmentStatus && formData.employmentType) {
      completed.add("employment");
    }
    
    // Compensation section
    if (formData.baseSalaryAmount) {
      completed.add("compensation");
    }
    
    // Benefits section (optional - mark complete if any benefit selected)
    if (confirmedCompanyBenefits.size > 0 || confirmedStandardBenefits.size > 0 || customBenefits.length > 0) {
      completed.add("benefits");
    }
    
    // Ratings section
    const allRatingsComplete = coreRatings.every(r => r.value > 0);
    if (allRatingsComplete && coreRatings.length > 0) {
      completed.add("ratings");
    }
    
    // Review section
    if (formData.title && formData.pros && formData.cons) {
      completed.add("review");
    }
    
    // Demographics is optional, mark complete if any field filled
    if (formData.ageRange || formData.gender || formData.ethnicity || formData.educationLevel) {
      completed.add("demographics");
    }
    
    // Feedback is optional
    if (formData.privateFeedback) {
      completed.add("feedback");
    }
    
    setCompletedSections(completed);
  }, [formData, coreRatings]);

  if (isConfigLoading) {
    return (
      <Card className="max-w-2xl mx-auto">
        <CardContent className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="max-w-2xl mx-auto">
      {/* Sticky Header */}
      <div className="sticky top-16 z-20 -mx-4 px-4">
        <div className="bg-white pt-4 pb-4">
          <div className="flex items-center gap-3 mb-3">
            <h1 className="font-playfair text-2xl font-semibold tracking-tight">{companyName}</h1>
            <span className="text-muted-foreground">|</span>
            <span className="text-xl font-light text-muted-foreground">Company Review</span>
          </div>
          <div>
            <h3 className="font-semibold text-foreground">Your Review is Completely Anonymous</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              Pachena reviews are anonymous by design, so neither we nor employers can ever see who submitted a review. Thank you for sharing your insights and helping bring transparency to the workplace.
            </p>
          </div>
          {/* Progress Bar */}
          <div className="mt-4 h-1 bg-black/10 rounded-full overflow-hidden">
            <div 
              className="h-full bg-black transition-all duration-300 ease-out rounded-full"
              style={{ width: `${formProgress}%` }}
            />
          </div>
        </div>
        {/* Blur fade effect */}
        <div className="h-6 bg-gradient-to-b from-white to-transparent pointer-events-none" />
      </div>
      
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Section 1: Employment Context */}
        <FormSectionCard
          ref={employmentRef}
          id="employment"
          title="Employment Context"
          description="This information is used to provide aggregate, anonymized comparisons."
        >
          <div className="space-y-4">
            
            {isFieldVisible("employment_status") && (
              <div className="space-y-2">
                <Label className={fieldErrors.has("employment_status") ? "text-destructive" : ""}>
                  {getFieldLabel("employment_status", "Employment Status")}
                  {isFieldRequired("employment_status") && " *"}
                </Label>
                <Select 
                  value={formData.employmentStatus} 
                  onValueChange={(value) => {
                    setFormData(prev => ({ ...prev, employmentStatus: value }));
                    clearFieldError("employment_status");
                    // Clear end year if switching away from former
                    if (!value.toLowerCase().includes("former")) {
                      setFormData(prev => ({ ...prev, endYear: "" }));
                    }
                  }}
                >
                  <SelectTrigger className={fieldErrors.has("employment_status") ? "border-destructive" : ""}>
                    <SelectValue placeholder="Select..." />
                  </SelectTrigger>
                  <SelectContent>
                    {getFieldOptions("employment_status").map((option) => (
                      <SelectItem key={option} value={option}>
                        {option}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                {/* End year selector for former employees */}
                {formData.employmentStatus.toLowerCase().includes("former") && (
                  <div className="mt-3 space-y-2">
                    <Label>Year you left</Label>
                    <Select
                      value={formData.endYear}
                      onValueChange={(value) => setFormData(prev => ({ ...prev, endYear: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select year..." />
                      </SelectTrigger>
                      <SelectContent>
                        {Array.from({ length: new Date().getFullYear() - 1999 }, (_, i) => new Date().getFullYear() - i).map((year) => (
                          <SelectItem key={year} value={String(year)}>
                            {year}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}
              </div>
            )}
            
            {isFieldVisible("employment_type") && (
              <div className="space-y-2">
                <Label className={fieldErrors.has("employment_type") ? "text-destructive" : ""}>
                  {getFieldLabel("employment_type", "Employment Type")}
                  {isFieldRequired("employment_type") && " *"}
                </Label>
                <Select 
                  value={formData.employmentType} 
                  onValueChange={(value) => {
                    setFormData(prev => ({ ...prev, employmentType: value }));
                    clearFieldError("employment_type");
                  }}
                >
                  <SelectTrigger className={fieldErrors.has("employment_type") ? "border-destructive" : ""}>
                    <SelectValue placeholder="Select..." />
                  </SelectTrigger>
                  <SelectContent>
                    {getFieldOptions("employment_type").map((option) => (
                      <SelectItem key={option} value={option}>
                        {option}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
            
            {isFieldVisible("role_level") && (
              <div className="space-y-2">
                <Label className={fieldErrors.has("role_level") ? "text-destructive" : ""}>
                  {getFieldLabel("role_level", "Role Level")}
                  {isFieldRequired("role_level") && " *"}
                </Label>
                <Select 
                  value={formData.roleLevel} 
                  onValueChange={(value) => {
                    handleSelectChange("role_level", value, "roleLevel");
                    clearFieldError("role_level");
                  }}
                >
                  <SelectTrigger className={fieldErrors.has("role_level") ? "border-destructive" : ""}>
                    <SelectValue placeholder="Select..." />
                  </SelectTrigger>
                  <SelectContent>
                    {getFieldOptions("role_level").map((option) => (
                      <SelectItem key={option} value={option}>
                        {option}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {shouldShowOtherInput("role_level", "roleLevel") && (
                  <Input
                    placeholder={getField("role_level")?.other_text_placeholder || "Please specify your role level..."}
                    value={otherTextValues["role_level"] || ""}
                    onChange={(e) => handleOtherTextChange("role_level", e.target.value)}
                  />
                )}
              </div>
            )}

            {isFieldVisible("department") && (
              <div className="space-y-2">
                <Label>
                  {getFieldLabel("department", "Broad Role")}
                  {isFieldRequired("department") ? " *" : ""}
                </Label>
                <Select 
                  value={formData.department} 
                  onValueChange={(value) => handleSelectChange("department", value, "department")}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select..." />
                  </SelectTrigger>
                  <SelectContent>
                    {getFieldOptions("department").map((option) => (
                      <SelectItem key={option} value={option}>
                        {option}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {shouldShowOtherInput("department", "department") && (
                  <Input
                    placeholder={getField("department")?.other_text_placeholder || "Please specify your role family..."}
                    value={otherTextValues["department"] || ""}
                    onChange={(e) => handleOtherTextChange("department", e.target.value)}
                  />
                )}
              </div>
            )}
            
            {isFieldVisible("tenure_range") && (
              <div className="space-y-2">
                <Label>
                  {getFieldLabel("tenure_range", "Time at Company")}
                  {isFieldRequired("tenure_range") ? " *" : ""}
                </Label>
                <Select 
                  value={formData.tenureRange} 
                  onValueChange={(value) => setFormData(prev => ({ ...prev, tenureRange: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select..." />
                  </SelectTrigger>
                  <SelectContent>
                    {getFieldOptions("tenure_range").map((option) => (
                      <SelectItem key={option} value={option}>
                        {option}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {/* Role Focus - Short text field */}
            {isFieldVisible("role_focus") && (
              <div className="space-y-2">
                <Label>
                  {getFieldLabel("role_focus", "Role Focus")}
                  {isFieldRequired("role_focus") ? " *" : ""}
                </Label>
                {getField("role_focus")?.description && (
                  <p className="text-xs text-muted-foreground">
                    {getField("role_focus")?.description}
                  </p>
                )}
                <Input
                  placeholder={getFieldPlaceholder("role_focus", "e.g. Frontend Engineer, UX Designer, Data Scientist")}
                  value={formData.roleFocus}
                  onChange={(e) => setFormData(prev => ({ ...prev, roleFocus: e.target.value.slice(0, 40) }))}
                  maxLength={40}
                />
                <p className="text-xs text-muted-foreground text-right">
                  {formData.roleFocus.length}/40
                </p>
              </div>
            )}
          </div>
        </FormSectionCard>

        {/* Section 2: Compensation */}
        <FormSectionCard
          ref={compensationRef}
          id="compensation"
          title="Compensation"
          description="We display salary data as ranges across multiple reviews, never individual amounts."
        >
          <div className="space-y-4">
            
            {/* Monthly Take-Home Salary - Required */}
            <div className="space-y-2">
              <Label className={fieldErrors.has("base_salary") ? "text-destructive" : ""}>
                Monthly Take-Home Salary *
              </Label>
              <p className="text-xs text-muted-foreground">
                This is the net amount you receive after taxes.
              </p>
              <SalaryInput
                currencyValue={formData.baseSalaryCurrency}
                amountValue={formData.baseSalaryAmount}
                onCurrencyChange={(value) => setFormData(prev => ({ ...prev, baseSalaryCurrency: value }))}
                onAmountChange={(value) => {
                  setFormData(prev => ({ ...prev, baseSalaryAmount: value }));
                  clearFieldError("base_salary");
                }}
                amountPlaceholder="Amount"
                hasError={fieldErrors.has("base_salary")}
              />
            </div>

            {/* Additional Monthly Allowances - Optional */}
            <div className="space-y-2">
              <Label>
                Additional Monthly Allowances
              </Label>
              <p className="text-xs text-muted-foreground">
                e.g., transport, housing, fuel, mobile allowance
              </p>
              <SalaryInput
                currencyValue={formData.allowancesCurrency}
                amountValue={formData.allowancesAmount}
                onCurrencyChange={(value) => setFormData(prev => ({ ...prev, allowancesCurrency: value }))}
                onAmountChange={(value) => setFormData(prev => ({ ...prev, allowancesAmount: value }))}
                amountPlaceholder="Enter amount"
              />
            </div>

            {/* Annual Bonus / Commission - Optional */}
            <div className="space-y-2">
              <Label>
                Annual Bonus / Commission
              </Label>
              <SalaryInput
                currencyValue={formData.bonusCurrency}
                amountValue={formData.bonusAmount}
                onCurrencyChange={(value) => setFormData(prev => ({ ...prev, bonusCurrency: value }))}
                onAmountChange={(value) => setFormData(prev => ({ ...prev, bonusAmount: value }))}
                amountPlaceholder="Enter amount"
              />
            </div>

            {/* Compensation Fairness Rating */}
            {compensationRating && (
              <div className="space-y-2">
                <Label>{compensationRating.category_label} *</Label>
                <p className="text-xs text-muted-foreground">
                  How fair is your total compensation for the work you do?
                </p>
                <div className="flex gap-1">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => handleRatingClick(compensationRating.category_key, star)}
                      className="p-1 hover:scale-110 transition-transform"
                    >
                      <Star
                        className={`h-6 w-6 ${
                          star <= compensationRating.value
                            ? "fill-yellow-400 text-yellow-400"
                            : "text-muted-foreground/30"
                        }`}
                      />
                    </button>
                  ))}
                </div>
              </div>
            )}

          </div>
        </FormSectionCard>

        {/* Section 3: Benefits */}
        <FormSectionCard
          ref={benefitsRef}
          id="benefits"
          title="Benefits"
          description="Select the benefits you receive in your role."
          optional
        >
          <div className="space-y-4">
            {/* Tier 1: Company Benefits (if employer has added them) */}
            {companyBenefits.length > 0 && (
              <div className="space-y-3 p-4 border border-black/10 rounded-lg bg-secondary/30">
                <div className="space-y-1">
                  <Label className="text-base font-medium">
                    Benefits offered by {companyName}
                  </Label>
                  <p className="text-xs text-muted-foreground">
                    {companyName} has indicated that the following benefits are provided, though not all roles receive the same benefits. Please select the ones you receive.
                  </p>
                </div>
                <div className="grid gap-2 sm:grid-cols-2">
                  {companyBenefits.map((benefit) => (
                    <div key={benefit.id} className="flex items-center space-x-2">
                      <Checkbox
                        id={`company-benefit-${benefit.id}`}
                        checked={confirmedCompanyBenefits.has(benefit.id)}
                        onCheckedChange={() => toggleCompanyBenefit(benefit.id)}
                      />
                      <label
                        htmlFor={`company-benefit-${benefit.id}`}
                        className="text-sm cursor-pointer"
                      >
                        {benefit.benefit_name}
                      </label>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Tier 2: Standard Benefits (always shown as secondary/fallback) */}
            {standardBenefits.length > 0 && (
              <div className="space-y-3">
                <div className="space-y-1">
                  <Label className="text-base font-medium">
                    {companyBenefits.length > 0 
                      ? "Other common benefits" 
                      : "What benefits do you receive?"}
                  </Label>
                  <p className="text-xs text-muted-foreground">
                    {companyBenefits.length > 0 
                      ? "Select any additional benefits you receive that aren't listed above."
                      : "Select all benefits that apply to your role."}
                  </p>
                </div>
                <div className="grid gap-2 sm:grid-cols-2">
                  {standardBenefits.map((benefit) => (
                    <div key={benefit.id} className="flex items-center space-x-2">
                      <Checkbox
                        id={`standard-benefit-${benefit.id}`}
                        checked={confirmedStandardBenefits.has(benefit.id)}
                        onCheckedChange={() => toggleStandardBenefit(benefit.id)}
                      />
                      <label
                        htmlFor={`standard-benefit-${benefit.id}`}
                        className="text-sm cursor-pointer"
                      >
                        {benefit.benefit_label}
                      </label>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Tier 3: Custom Benefits Input */}
            <div className="space-y-3 border-t pt-4">
              <div className="space-y-1">
                <Label>Other benefits not listed?</Label>
                <p className="text-xs text-muted-foreground">
                  Add any unique perks or benefits specific to your role.
                </p>
              </div>
              <div className="flex gap-2">
                <Input
                  placeholder="e.g., Pet Insurance, Childcare Subsidy..."
                  value={newCustomBenefit}
                  onChange={(e) => setNewCustomBenefit(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleAddCustomBenefit();
                    }
                  }}
                  className="flex-1"
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleAddCustomBenefit}
                  disabled={!newCustomBenefit.trim()}
                  className="bg-black text-white border-black hover:bg-black/90 hover:text-white transition-none disabled:bg-black/50 disabled:text-white/70"
                >
                  <Plus className="h-4 w-4 mr-1" />
                  Add
                </Button>
              </div>

              {/* Added Custom Benefits Display */}
              {customBenefits.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {customBenefits.map((benefit) => (
                    <Badge
                      key={benefit}
                      variant="secondary"
                      className="pl-3 pr-1 py-1.5 text-sm flex items-center gap-1"
                    >
                      {benefit}
                      <button
                        type="button"
                        onClick={() => handleRemoveCustomBenefit(benefit)}
                        className="ml-1 p-0.5 rounded hover:bg-muted-foreground/20 transition-colors"
                        aria-label={`Remove ${benefit}`}
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </Badge>
                  ))}
                </div>
              )}
            </div>
          </div>
        </FormSectionCard>

        {/* Section 4: Rate Your Experience */}
        {coreRatings.length > 0 && (
          <FormSectionCard
            ref={ratingsRef}
            id="ratings"
            title="Rate Your Experience *"
            description="1 star = Very Poor | 5 stars = Excellent"
            hasError={fieldErrors.has("ratings")}
          >
            <div className="space-y-4">
                {coreRatings.map((category) => (
                  <div key={category.id} className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <span className="font-medium text-sm">{category.category_label}</span>
                      {category.category_description && (
                        <p className="text-sm text-muted-foreground mt-0.5">
                          {category.category_description}
                        </p>
                      )}
                    </div>
                    <div className="flex gap-1 flex-shrink-0">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <button
                          key={star}
                          type="button"
                          onClick={() => {
                            handleRatingClick(category.category_key, star);
                            clearFieldError("ratings");
                          }}
                          className="p-1 hover:scale-110 transition-transform"
                        >
                          <Star
                            className={`h-5 w-5 ${
                              star <= category.value
                                ? "fill-yellow-400 text-yellow-400"
                                : "text-muted-foreground/30"
                            }`}
                          />
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
          </FormSectionCard>
        )}

        {/* Section 4: Your Review */}
        <FormSectionCard
          ref={reviewRef}
          id="review"
          title="Your Review"
          description="Share your experience with future employees."
        >
          <div className="space-y-4">
            {isFieldVisible("title") && (
              <div className="space-y-2">
                <Label htmlFor="title" className={fieldErrors.has("title") ? "text-destructive" : ""}>
                  {getFieldLabel("title", "Review Headline")}
                  {isFieldRequired("title") && " *"}
                </Label>
                <Input
                  id="title"
                  placeholder={getFieldPlaceholder("title", "Summarize your experience in one sentence")}
                  value={formData.title}
                  onChange={(e) => {
                    setFormData(prev => ({ ...prev, title: e.target.value }));
                    clearFieldError("title");
                  }}
                  maxLength={VALIDATION_RULES.title.max}
                  className={fieldErrors.has("title") ? "border-destructive" : ""}
                />
                <CharacterCounter 
                  current={formData.title.trim().length} 
                  max={VALIDATION_RULES.title.max} 
                  min={VALIDATION_RULES.title.min} 
                />
                <WritingSuggestion
                  value={formData.title}
                  fieldName="headline"
                  onAccept={(corrected) => setFormData(prev => ({ ...prev, title: corrected }))}
                />
              </div>
            )}

            {isFieldVisible("pros") && (
              <div className="space-y-2">
                <Label htmlFor="pros" className={fieldErrors.has("pros") ? "text-destructive" : ""}>
                  {getFieldLabel("pros", "One thing you love")}
                  {isFieldRequired("pros") && " *"}
                </Label>
                <Textarea
                  id="pros"
                  placeholder={getFieldPlaceholder("pros", "What do you love most about working here?")}
                  value={formData.pros}
                  onChange={(e) => {
                    setFormData(prev => ({ ...prev, pros: e.target.value }));
                    clearFieldError("pros");
                  }}
                  rows={2}
                  maxLength={VALIDATION_RULES.pros.max}
                  className={fieldErrors.has("pros") ? "border-destructive" : ""}
                />
                <CharacterCounter 
                  current={formData.pros.trim().length} 
                  max={VALIDATION_RULES.pros.max} 
                  min={VALIDATION_RULES.pros.min} 
                />
                <WritingSuggestion
                  value={formData.pros}
                  fieldName="pros"
                  onAccept={(corrected) => setFormData(prev => ({ ...prev, pros: corrected }))}
                />
              </div>
            )}

            {isFieldVisible("cons") && (
              <div className="space-y-2">
                <Label htmlFor="cons" className={fieldErrors.has("cons") ? "text-destructive" : ""}>
                  {getFieldLabel("cons", "One thing to improve")}
                  {isFieldRequired("cons") && " *"}
                </Label>
                <Textarea
                  id="cons"
                  placeholder={getFieldPlaceholder("cons", "What is one thing that could be better?")}
                  value={formData.cons}
                  onChange={(e) => {
                    setFormData(prev => ({ ...prev, cons: e.target.value }));
                    clearFieldError("cons");
                  }}
                  rows={2}
                  maxLength={VALIDATION_RULES.cons.max}
                  className={fieldErrors.has("cons") ? "border-destructive" : ""}
                />
                <CharacterCounter 
                  current={formData.cons.trim().length} 
                  max={VALIDATION_RULES.cons.max} 
                  min={VALIDATION_RULES.cons.min} 
                />
                <WritingSuggestion
                  value={formData.cons}
                  fieldName="cons"
                  onAccept={(corrected) => setFormData(prev => ({ ...prev, cons: corrected }))}
                />
              </div>
            )}

            {isFieldVisible("advice") && (
              <div className="space-y-2">
                <Label htmlFor="advice">
                  {getFieldLabel("advice", "One thing a prospective employee should know")}
                </Label>
                {getField("advice")?.description && (
                  <p className="text-xs text-muted-foreground">
                    {getField("advice")?.description}
                  </p>
                )}
                <Textarea
                  id="advice"
                  placeholder={getFieldPlaceholder("advice", "What do you wish you had known before joining?")}
                  value={formData.advice}
                  onChange={(e) => setFormData(prev => ({ ...prev, advice: e.target.value }))}
                  rows={2}
                  maxLength={300}
                />
                <p className="text-xs text-muted-foreground text-right">
                  {formData.advice.length}/300
                </p>
                <WritingSuggestion
                  value={formData.advice}
                  fieldName="advice"
                  onAccept={(corrected) => setFormData(prev => ({ ...prev, advice: corrected }))}
                />
              </div>
            )}
          </div>

          {/* Section 5: Recommendation */}
          {isFieldVisible("recommendation") && (
            <div className="space-y-4 pt-4">
              <Label className={fieldErrors.has("recommendation") ? "text-destructive" : ""}>
                {getFieldLabel("recommendation", "Would you recommend this company as a place to work?")}
                {isFieldRequired("recommendation") && " *"}
              </Label>
              <div className={cn(
                "flex gap-3 p-1 rounded-md",
                fieldErrors.has("recommendation") && "ring-1 ring-destructive"
              )}>
                {getFieldOptions("recommendation").map((option) => (
                  <Button
                    key={option}
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setFormData(prev => ({ ...prev, recommendation: option }));
                      clearFieldError("recommendation");
                    }}
                    className={cn(
                      "flex-1 transition-none",
                      formData.recommendation === option && "bg-black text-white border-black hover:bg-black/90 hover:text-white"
                    )}
                  >
                    {option}
                  </Button>
                ))}
              </div>
            </div>
          )}

          {/* Section 5b: CEO Approval */}
          <div className="space-y-4 pt-4">
            <Label>
              Do you approve of the CEO's leadership?
            </Label>
            <div className="flex gap-3">
              {["Yes", "No", "Not Sure"].map((option) => (
                <Button
                  key={option}
                  type="button"
                  variant="outline"
                  onClick={() => setFormData(prev => ({ ...prev, ceoApproval: option }))}
                  className={cn(
                    "flex-1 transition-none",
                    formData.ceoApproval === option && "bg-black text-white border-black hover:bg-black/90 hover:text-white"
                  )}
                >
                  {option}
                </Button>
              ))}
            </div>
          </div>
        </FormSectionCard>

        {/* Section 5: Demographics (Optional) */}
        {(isFieldVisible("age_range") || isFieldVisible("gender") || isFieldVisible("ethnicity") || isFieldVisible("education_level")) && (
          <FormSectionCard
            ref={demographicsRef}
            id="demographics"
            title="Demographics"
            description="Help us understand compensation patterns across demographics. All fields are optional and used only for aggregate analytics—never shown publicly."
            optional
          >
            <div className="grid gap-4 md:grid-cols-2">
                {isFieldVisible("age_range") && (
                  <div className="space-y-2">
                    <Label>{getFieldLabel("age_range", "Age Range")}</Label>
                    <Select 
                      value={formData.ageRange} 
                      onValueChange={(value) => setFormData(prev => ({ ...prev, ageRange: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select..." />
                      </SelectTrigger>
                      <SelectContent>
                        {getFieldOptions("age_range").length > 0 ? (
                          getFieldOptions("age_range").map((option) => (
                            <SelectItem key={option} value={option}>
                              {option}
                            </SelectItem>
                          ))
                        ) : (
                          <>
                            <SelectItem value="18-24">18-24</SelectItem>
                            <SelectItem value="25-34">25-34</SelectItem>
                            <SelectItem value="35-44">35-44</SelectItem>
                            <SelectItem value="45-54">45-54</SelectItem>
                            <SelectItem value="55-64">55-64</SelectItem>
                            <SelectItem value="65+">65+</SelectItem>
                            <SelectItem value="Prefer not to say">Prefer not to say</SelectItem>
                          </>
                        )}
                      </SelectContent>
                    </Select>
                  </div>
                )}

                {isFieldVisible("gender") && (
                  <div className="space-y-2">
                    <Label>{getFieldLabel("gender", "Gender")}</Label>
                    <Select 
                      value={formData.gender} 
                      onValueChange={(value) => setFormData(prev => ({ ...prev, gender: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select..." />
                      </SelectTrigger>
                      <SelectContent>
                        {getFieldOptions("gender").length > 0 ? (
                          getFieldOptions("gender").map((option) => (
                            <SelectItem key={option} value={option}>
                              {option}
                            </SelectItem>
                          ))
                        ) : (
                          <>
                            <SelectItem value="Male">Male</SelectItem>
                            <SelectItem value="Female">Female</SelectItem>
                            <SelectItem value="Non-binary">Non-binary</SelectItem>
                            <SelectItem value="Prefer not to say">Prefer not to say</SelectItem>
                          </>
                        )}
                      </SelectContent>
                    </Select>
                  </div>
                )}

                {isFieldVisible("ethnicity") && (
                  <div className="space-y-2">
                    <Label>{getFieldLabel("ethnicity", "Ethnicity")}</Label>
                    <Select 
                      value={formData.ethnicity} 
                      onValueChange={(value) => setFormData(prev => ({ ...prev, ethnicity: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select..." />
                      </SelectTrigger>
                      <SelectContent>
                        {getFieldOptions("ethnicity").length > 0 ? (
                          getFieldOptions("ethnicity").map((option) => (
                            <SelectItem key={option} value={option}>
                              {option}
                            </SelectItem>
                          ))
                        ) : (
                          <>
                            <SelectItem value="Black African">Black African</SelectItem>
                            <SelectItem value="Coloured">Coloured</SelectItem>
                            <SelectItem value="White">White</SelectItem>
                            <SelectItem value="Asian">Asian</SelectItem>
                            <SelectItem value="Other">Other</SelectItem>
                            <SelectItem value="Prefer not to say">Prefer not to say</SelectItem>
                          </>
                        )}
                      </SelectContent>
                    </Select>
                  </div>
                )}

                {isFieldVisible("education_level") && (
                  <div className="space-y-2">
                    <Label>{getFieldLabel("education_level", "Education Level")}</Label>
                    <Select 
                      value={formData.educationLevel} 
                      onValueChange={(value) => setFormData(prev => ({ ...prev, educationLevel: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select..." />
                      </SelectTrigger>
                      <SelectContent>
                        {getFieldOptions("education_level").length > 0 ? (
                          getFieldOptions("education_level").map((option) => (
                            <SelectItem key={option} value={option}>
                              {option}
                            </SelectItem>
                          ))
                        ) : (
                          <>
                            <SelectItem value="High School">High School</SelectItem>
                            <SelectItem value="Some College">Some College</SelectItem>
                            <SelectItem value="Bachelor's Degree">Bachelor's Degree</SelectItem>
                            <SelectItem value="Master's Degree">Master's Degree</SelectItem>
                            <SelectItem value="Doctorate">Doctorate</SelectItem>
                            <SelectItem value="Professional Certification">Professional Certification</SelectItem>
                            <SelectItem value="Prefer not to say">Prefer not to say</SelectItem>
                          </>
                        )}
                      </SelectContent>
                    </Select>
                  </div>
                )}
              </div>
          </FormSectionCard>
        )}

        {/* Section 6: Private Feedback */}
        {isFieldVisible("private_feedback") && (
          <FormSectionCard
            ref={feedbackRef}
            id="feedback"
            title="Private Feedback to Leadership"
            description="What should leadership understand but may not hear directly? This will not be made public."
            optional
          >
            <Textarea
              id="privateFeedback"
              placeholder={getFieldPlaceholder("private_feedback", "Share private feedback, suggestions, or concerns...")}
              value={formData.privateFeedback}
              onChange={(e) => setFormData(prev => ({ ...prev, privateFeedback: e.target.value }))}
              rows={4}
              maxLength={2000}
            />
          </FormSectionCard>
        )}

        {/* Section 7: Interview Experience (Optional) */}
        <FormSectionCard
          ref={interviewRef}
          id="interview"
          title="Interview Experience"
          description="Your insights about the interview process are extremely valuable to potential applicants. Thank you for sharing!"
          optional
        >
          <div className="space-y-6">
            {/* Did you interview? */}
            <div className="space-y-3">
              <Label>Did you interview at this company?</Label>
              <div className="flex gap-3">
                {["Yes", "No"].map((option) => (
                  <Button
                    key={option}
                    type="button"
                    variant="outline"
                    onClick={() => setFormData(prev => ({ ...prev, didInterview: option }))}
                    className={cn(
                      "flex-1 transition-none",
                      formData.didInterview === option && "bg-black text-white border-black hover:bg-black/90 hover:text-white"
                    )}
                  >
                    {option}
                  </Button>
                ))}
              </div>
            </div>

            {/* Show additional fields only if user selected "Yes" */}
            {formData.didInterview === "Yes" && (
              <div className="space-y-6 pt-4 border-t">
                {/* Overall Interview Experience Rating */}
                <div className="space-y-3">
                  <Label>Overall Interview Experience</Label>
                  <div className="flex gap-1">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        type="button"
                        onClick={() => setFormData(prev => ({ ...prev, interviewExperienceRating: star }))}
                        className="p-1 transition-colors hover:scale-110"
                      >
                        <Star
                          className={cn(
                            "h-8 w-8 transition-colors",
                            star <= formData.interviewExperienceRating
                              ? "fill-yellow-400 text-yellow-400"
                              : "text-gray-300"
                          )}
                        />
                      </button>
                    ))}
                  </div>
                </div>

                {/* Number of Interviews */}
                <div className="space-y-2">
                  <Label>Number of Interviews</Label>
                   <Input
                     type="number"
                     min="1"
                     max="20"
                     placeholder="e.g., 3"
                     value={formData.interviewCount}
                     onChange={(e) => setFormData(prev => ({ ...prev, interviewCount: e.target.value }))}
                     className="w-32"
                     onWheel={e => (e.target as HTMLInputElement).blur()}
                   />
                </div>

                {/* Interview Difficulty */}
                <div className="space-y-3">
                  <Label>Interview Difficulty</Label>
                  <div className="flex gap-3">
                    {["Easy", "Average", "Difficult"].map((option) => (
                      <Button
                        key={option}
                        type="button"
                        variant="outline"
                        onClick={() => setFormData(prev => ({ ...prev, interviewDifficulty: option }))}
                        className={cn(
                          "flex-1 transition-none",
                          formData.interviewDifficulty === option && "bg-black text-white border-black hover:bg-black/90 hover:text-white"
                        )}
                      >
                        {option}
                      </Button>
                    ))}
                  </div>
                </div>

                {/* Interview Description */}
                <div className="space-y-2">
                  <Label>Describe your interview experience</Label>
                  <p className="text-sm text-muted-foreground">What was the process like? What should candidates know?</p>
                  <Textarea
                    placeholder="Describe the interview process, types of questions asked, etc."
                    value={formData.interviewDescription}
                    onChange={(e) => setFormData(prev => ({ ...prev, interviewDescription: e.target.value }))}
                    rows={4}
                    maxLength={750}
                  />
                  <p className="text-xs text-muted-foreground text-right">{formData.interviewDescription.length}/750</p>
                </div>

                {/* Interview Tips */}
                <div className="space-y-2">
                  <Label>Interview Tips</Label>
                  <p className="text-sm text-muted-foreground">Any advice for candidates interviewing here?</p>
                  <Textarea
                    placeholder="Share tips for future candidates..."
                    value={formData.interviewTips}
                    onChange={(e) => setFormData(prev => ({ ...prev, interviewTips: e.target.value }))}
                    rows={4}
                    maxLength={750}
                  />
                  <p className="text-xs text-muted-foreground text-right">{formData.interviewTips.length}/750</p>
                </div>
              </div>
            )}
          </div>
        </FormSectionCard>

        {/* Submit */}
        <Card>
          <CardContent className="pt-6">
            <Button 
              type="submit" 
              disabled={isLoading} 
              variant="outline"
              className="w-full bg-black text-white border-black hover:bg-black/90 hover:text-white transition-none disabled:bg-black/50 disabled:text-white/70"
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Submitting...
                </>
              ) : (
                "Submit Anonymous Review"
              )}
            </Button>

            <p className="text-xs text-center text-muted-foreground mt-4">
              By submitting, you confirm this review reflects your genuine experience.
            </p>
          </CardContent>
        </Card>
      </form>
    </div>
  );
}
