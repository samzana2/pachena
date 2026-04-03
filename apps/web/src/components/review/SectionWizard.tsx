"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { createBrowserSupabaseClient } from "@/lib/supabase/client";
import { toast } from "@/hooks/use-toast";
import { Loader2, Star, Plus, X } from "lucide-react";
import { SalaryInput } from "@/components/SalaryInput";
import { CharacterCounter } from "@/components/review/CharacterCounter";
import { extractEdgeFunctionError } from "@/lib/edge-function-errors";
import { getTotalComp, ANNUAL_BENEFIT_KEYS, formatSalaryAmount } from "@/lib/salaryUtils";
import { cn } from "@/lib/utils";
import { TraceButton } from "@/components/ui/trace-button";
import { trackSessionEvent } from "@/lib/trackSessionEvent";
import { Info } from "lucide-react";
import { DictationButton } from "@/components/review/DictationButton";
import { WritingSuggestion } from "@/components/review/WritingSuggestion";
const supabase = createBrowserSupabaseClient();

interface SectionWizardProps {
  sectionType: string;
  companyId: string;
  companyName: string;
  sessionId: string;
  sessionToken: string;
  onSuccess: () => void;
  headerSlot?: React.ReactNode;
  isFullReview?: boolean;
}

interface RatingCategory {
  id: string;
  category_key: string;
  category_label: string;
  category_description: string | null;
  display_order: number;
  value: number;
}

interface CompanyBenefit { id: string; benefit_name: string; }
interface StandardBenefit { id: string; benefit_key: string; benefit_label: string; display_order: number; }

const VALIDATION_RULES = {
  title: { min: 30, max: 200 },
  pros: { min: 50, max: 3000 },
  cons: { min: 50, max: 3000 },
} as const;

/** Typeform-style step wrapper – bare content, no card chrome */
function StepContent({ title, description, optional, children }: {
  title: string;
  description?: string;
  optional?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-6">
      <div>
        {optional && (
          <span className="text-xs font-normal text-muted-foreground bg-muted px-2 py-0.5 rounded inline-block mb-2">
            Optional
          </span>
        )}
        <h2 className="text-2xl font-bold text-foreground">
          {title}
        </h2>
        {description && (
          <p className="text-sm text-foreground mt-2">{description}</p>
        )}
      </div>
      <div className="space-y-4">
        {children}
      </div>
    </div>
  );
}

/** Clickable option card with trace border animation */
function OptionCard({ label, description, selected, onClick }: {
  label: string;
  description?: string;
  selected: boolean;
  onClick: () => void;
}) {
  const [isHovered, setIsHovered] = useState(false);
  const [entryDirection, setEntryDirection] = useState<"top" | "right" | "bottom" | "left" | null>(null);
  const cardRef = useRef<HTMLButtonElement>(null);

  const getClipPath = (direction: typeof entryDirection, show: boolean): string => {
    if (!show) {
      switch (direction) {
        case "top": return "inset(0 0 100% 0)";
        case "right": return "inset(0 0 0 100%)";
        case "bottom": return "inset(100% 0 0 0)";
        case "left": return "inset(0 100% 0 0)";
        default: return "inset(0 100% 100% 0)";
      }
    }
    return "inset(0 0 0 0)";
  };

  const handleMouseEnter = (e: React.MouseEvent) => {
    if (selected) return;
    const el = cardRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const dT = y, dB = rect.height - y, dL = x, dR = rect.width - x;
    const min = Math.min(dT, dB, dL, dR);
    if (min === dT) setEntryDirection("top");
    else if (min === dR) setEntryDirection("right");
    else if (min === dB) setEntryDirection("bottom");
    else setEntryDirection("left");
    setIsHovered(true);
  };

  return (
    <button
      ref={cardRef}
      type="button"
      onClick={onClick}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={() => { if (!selected) setIsHovered(false); }}
      className={cn(
        "relative w-full flex items-center gap-3 px-4 py-3 rounded-lg border text-left transition-colors duration-200 overflow-hidden",
        selected
          ? "border-foreground bg-foreground text-background"
          : isHovered
            ? "border-transparent bg-background text-foreground"
            : "border-border bg-background text-foreground"
      )}
    >
      {/* Trace border overlay */}
      {!selected && (
        <div
          className="absolute inset-0 pointer-events-none border border-foreground rounded-lg z-10"
          style={{
            clipPath: getClipPath(entryDirection, isHovered),
            transition: "clip-path 0.2s ease-out",
          }}
        />
      )}
      <div className="flex flex-col">
        <span className="text-sm font-medium">{label}</span>
        {description && (
          <span className={cn(
            "text-xs mt-0.5",
            selected ? "text-background/70" : "text-muted-foreground"
          )}>{description}</span>
        )}
      </div>
    </button>
  );
}

export function SectionWizard({ sectionType, companyId, companyName, sessionId, sessionToken, onSuccess, headerSlot, isFullReview }: SectionWizardProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [isConfigLoading, setIsConfigLoading] = useState(true);
  const [attestationChecked, setAttestationChecked] = useState(false);

  // Compensation state
  const [employmentStatus, setEmploymentStatus] = useState("");
  const [employmentType, setEmploymentType] = useState("");
  const [roleLevel, setRoleLevel] = useState("");
  const [department, setDepartment] = useState("");
  const [roleFocus, setRoleFocus] = useState("");
  const [roleTitle, setRoleTitle] = useState("");
  const [tenureRange, setTenureRange] = useState("");
  const [baseSalaryCurrency, setBaseSalaryCurrency] = useState("USD");
  const [baseSalaryAmount, setBaseSalaryAmount] = useState("");
  const [isNetSalary, setIsNetSalary] = useState(false);
  const [allowancesCurrency, setAllowancesCurrency] = useState("USD");
  const [allowancesAmount, setAllowancesAmount] = useState("");
  const [bonusCurrency, setBonusCurrency] = useState("USD");
  const [bonusAmount, setBonusAmount] = useState("");
  // Commission state
  const [earnsCommission, setEarnsCommission] = useState("");
  const [commissionAmount, setCommissionAmount] = useState("");
  // Secondary salary for dual-currency earners
  const [hasSecondarySalary, setHasSecondarySalary] = useState("");
  const [secondarySalaryCurrency, setSecondarySalaryCurrency] = useState("ZWL");
  const [secondarySalaryAmount, setSecondarySalaryAmount] = useState("");
  // (salaryRange, marketAlignment, payTransparency removed — no wizard steps collected these)
  const [endYear, setEndYear] = useState("");
  const [hasAllowances, setHasAllowances] = useState("");

  // Benefits state
  const [companyBenefits, setCompanyBenefits] = useState<CompanyBenefit[]>([]);
  const [standardBenefits, setStandardBenefits] = useState<StandardBenefit[]>([]);
  const [confirmedCompanyBenefits, setConfirmedCompanyBenefits] = useState<Set<string>>(new Set());
  const [confirmedStandardBenefits, setConfirmedStandardBenefits] = useState<Set<string>>(new Set());
  const [customBenefits, setCustomBenefits] = useState<string[]>([]);
  const [newCustomBenefit, setNewCustomBenefit] = useState("");
  const [benefitValues, setBenefitValues] = useState<Record<string, string>>({});

  // Culture state
  const [title, setTitle] = useState("");
  const [pros, setPros] = useState("");
  const [cons, setCons] = useState("");
  const [advice, setAdvice] = useState("");
  const [recommendation, setRecommendation] = useState("");
  const [ceoApproval, setCeoApproval] = useState("");
  const [privateFeedback, setPrivateFeedback] = useState("");
  const [ratingCategories, setRatingCategories] = useState<RatingCategory[]>([]);

  // Demographics state (compensation only)
  const [ageRange, setAgeRange] = useState("");
  const [gender, setGender] = useState("");
  const [ethnicity, setEthnicity] = useState("");
  const [educationLevel, setEducationLevel] = useState("");

  // Interview state
  const [didInterview, setDidInterview] = useState("");
  const [interviewExperienceRating, setInterviewExperienceRating] = useState(0);
  const [interviewCount, setInterviewCount] = useState("");
  const [interviewDifficulty, setInterviewDifficulty] = useState("");
  const [interviewDescription, setInterviewDescription] = useState("");
  const [interviewTips, setInterviewTips] = useState("");
  const [interviewStages, setInterviewStages] = useState<Set<string>>(new Set());
  const [interviewStagesOther, setInterviewStagesOther] = useState("");

  // Multi-step wizard state
  const [currentStep, setCurrentStep] = useState(0);
  const hasTrackedStart = useRef(false);

  // Track form started on mount
  useEffect(() => {
    if (!hasTrackedStart.current && sessionId) {
      hasTrackedStart.current = true;
      trackSessionEvent(sessionId, "form_started", { section_type: sectionType });
    }
  }, [sessionId, sectionType]);
  const autoAdvanceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Compensation rating (separated from core ratings)
  const compensationRating = ratingCategories.find(r => r.category_key === "compensation_fairness");
  const coreRatings = ratingCategories.filter(r => r.category_key !== "compensation_fairness");

  // Auto-advance helper for single-select option cards
  const autoAdvance = useCallback(() => {
    if (autoAdvanceTimer.current) clearTimeout(autoAdvanceTimer.current);
    autoAdvanceTimer.current = setTimeout(() => {
      setCurrentStep(prev => prev + 1);
    }, 400);
  }, []);

  useEffect(() => {
    return () => { if (autoAdvanceTimer.current) clearTimeout(autoAdvanceTimer.current); };
  }, []);

  // Define single-question steps per section type
  type StepDef = { key: string; type: "select" | "input" | "multi" | "custom" };
  
  const getSteps = (): StepDef[] => {
    if (sectionType === "compensation") {
      const steps: StepDef[] = [
        { key: "employment_status", type: "select" },
      ];
      if (employmentStatus === "Former Employee") {
        steps.push({ key: "end_year", type: "input" });
      }
      steps.push(
        { key: "employment_type", type: "select" },
        { key: "role_level", type: "select" },
        { key: "department", type: "select" },
        { key: "role_title", type: "input" },
        { key: "tenure", type: "select" },
        { key: "salary", type: "input" },
        { key: "commission", type: "select" },
      );
      if (earnsCommission === "Yes") {
        steps.push({ key: "commission_amount", type: "input" });
      }
      steps.push(
        { key: "bonus", type: "input" },
        { key: "benefits", type: "custom" },
      );
      if (companyBenefits.length > 0) {
        steps.push({ key: "confirm_benefits", type: "multi" });
      }
      steps.push({ key: "comp_confirmation", type: "custom" });
      steps.push(
        { key: "demographics_age", type: "select" },
        { key: "demographics_gender", type: "select" },
        { key: "demographics_ethnicity", type: "select" },
        { key: "demographics_education", type: "select" },
      );
      if (!isFullReview) steps.push({ key: "attestation", type: "custom" });
      return steps;
    }
    if (sectionType === "culture") {
      const ratingSteps: StepDef[] = coreRatings.map(cat => ({
        key: `rating_${cat.category_key}`,
        type: "custom" as const,
      }));
      return [
        ...(isFullReview ? [] : [{ key: "culture_intro", type: "custom" as const }]),
        ...ratingSteps,
        { key: "review_title", type: "input" },
        { key: "pros", type: "input" },
        { key: "cons", type: "input" },
        { key: "advice", type: "input" },
        { key: "recommendation", type: "select" },
        { key: "ceo_approval", type: "select" },
        { key: "private_feedback", type: "input" },
        ...(isFullReview ? [] : [{ key: "attestation", type: "custom" as const }]),
      ];
    }
    // interview — user already chose this section, so did_interview is always true
    const interviewSteps: StepDef[] = [
      { key: "interview_rating", type: "custom" },
      { key: "interview_count", type: "input" },
      { key: "interview_difficulty", type: "select" },
      { key: "interview_stages", type: "multi" },
      { key: "interview_description", type: "input" },
      { key: "interview_tips", type: "input" },
    ];
    if (!isFullReview) interviewSteps.push({ key: "attestation", type: "custom" });
    return interviewSteps;
  };

  const steps = getSteps();

  // Clamp currentStep if steps shrink (e.g., conditional removed)
  const safeStep = Math.min(currentStep, steps.length - 1);
  useEffect(() => {
    if (currentStep > steps.length - 1) setCurrentStep(steps.length - 1);
  }, [steps.length, currentStep]);

  useEffect(() => {
    async function fetchConfig() {
      setIsConfigLoading(true);
      try {
        // Only fetch what's needed for the current section type
        const categoriesPromise = (sectionType === "culture" || sectionType === "compensation")
          ? supabase.from("rating_category_configs").select("*").eq("is_active", true).order("display_order")
          : Promise.resolve({ data: null });

        const companyBenefitsPromise = sectionType === "compensation"
          ? supabase.from("company_benefits").select("id, benefit_name").eq("company_id", companyId)
          : Promise.resolve({ data: null });

        const standardBenefitsPromise = sectionType === "compensation"
          ? supabase.from("standard_benefits").select("*").eq("is_active", true).order("display_order")
          : Promise.resolve({ data: null });

        const [categoriesRes, companyBenefitsRes, standardBenefitsRes] = await Promise.all([
          categoriesPromise,
          companyBenefitsPromise,
          standardBenefitsPromise,
        ]);

        if (categoriesRes.data) {
          setRatingCategories(categoriesRes.data.map((cat: any) => ({ ...cat, value: 0 })));
        }
        setCompanyBenefits(companyBenefitsRes.data || []);
        setStandardBenefits(standardBenefitsRes.data || []);
      } catch (error) {
        console.error("Error fetching config:", error);
      }
      setIsConfigLoading(false);
    }
    fetchConfig();
  }, [companyId, sectionType]);

  const handleRatingClick = (categoryKey: string, rating: number) => {
    setRatingCategories(prev => prev.map(cat => cat.category_key === categoryKey ? { ...cat, value: rating } : cat));
  };

  const calculateOverallRating = () => {
    const relevant = sectionType === "compensation" ? (compensationRating ? [compensationRating] : []) : coreRatings;
    const valid = relevant.filter(r => r.value > 0);
    if (valid.length === 0) return 0;
    return valid.reduce((sum, r) => sum + r.value, 0) / valid.length;
  };

  const handleAddCustom = () => {
    const trimmed = newCustomBenefit.trim();
    if (!trimmed) return;
    if (customBenefits.some(b => b.toLowerCase() === trimmed.toLowerCase())) return;
    setCustomBenefits(prev => [...prev, trimmed]);
    setNewCustomBenefit("");
  };

  const handleSubmit = async () => {
    setIsLoading(true);
    try {
      const sectionData: Record<string, unknown> = {};

      if (sectionType === "compensation") {
        const findStepIndex = (key: string) => steps.findIndex(s => s.key === key);
        const fieldStepMap: Record<string, string> = {
          "Employment Status": "employment_status",
          "Employment Type": "employment_type",
          "Role Level": "role_level",
          "Tenure": "tenure",
          "Monthly Take-Home Salary": "salary",
        };
        const missing: string[] = [];
        if (!employmentStatus) missing.push("Employment Status");
        if (!employmentType) missing.push("Employment Type");
        if (!roleLevel) missing.push("Role Level");
        if (!tenureRange) missing.push("Tenure");
        if (!baseSalaryAmount) missing.push("Monthly Take-Home Salary");
        if (missing.length > 0) {
          // Navigate to the first missing field's step
          const firstMissingStep = fieldStepMap[missing[0]];
          if (firstMissingStep) {
            const stepIdx = findStepIndex(firstMissingStep);
            if (stepIdx >= 0) setCurrentStep(stepIdx);
          }
          toast({ title: "Required fields missing", description: missing.join(", "), variant: "destructive" });
          setIsLoading(false);
          return;
        }
        Object.assign(sectionData, {
          employment_status: employmentStatus || null,
          employment_type: employmentType || null,
          role_level: roleLevel || null,
          department: department || null,
          role_focus: roleFocus || null,
          role_title: roleTitle || null,
          tenure_range: tenureRange || null,
          base_salary_currency: baseSalaryCurrency,
          base_salary_amount: parseFloat(baseSalaryAmount),
          is_net_salary: isNetSalary,
          allowances_currency: allowancesAmount ? allowancesCurrency : null,
          allowances_amount: allowancesAmount ? parseFloat(allowancesAmount) : null,
          secondary_salary_currency: secondarySalaryAmount ? secondarySalaryCurrency : null,
          secondary_salary_amount: secondarySalaryAmount ? parseFloat(secondarySalaryAmount) : null,
           bonus_currency: bonusAmount ? bonusCurrency : null,
           thirteenth_cheque_annual_value: bonusAmount ? parseFloat(bonusAmount) : null,
           commission_amount: commissionAmount ? parseFloat(commissionAmount) : null,
           end_year: endYear ? parseInt(endYear) : null,
          company_benefit_ids: Array.from(confirmedCompanyBenefits),
          standard_benefit_ids: Array.from(confirmedStandardBenefits),
          custom_benefits: customBenefits,
          benefit_values: Object.fromEntries(
            Object.entries(benefitValues)
              .filter(([, v]) => v && parseFloat(v) > 0)
              .map(([k, v]) => [k === "performance_bonus" ? "performance_bonus_annual_value" : k, parseFloat(v)])
          ),
          ratings: compensationRating && compensationRating.value > 0
            ? [{ category: compensationRating.category_label, rating: compensationRating.value }]
            : [],
          age_range: ageRange || null,
          gender: gender || null,
          ethnicity: ethnicity || null,
          education_level: educationLevel || null,
        });
      }

      if (sectionType === "culture") {
        // Find step index by key for auto-navigation on validation failure
        const findStepIndex = (key: string) => steps.findIndex(s => s.key === key);
        const unratedCategory = coreRatings.find(r => r.value === 0);

        if (unratedCategory) {
          const stepIdx = findStepIndex(`rating_${unratedCategory.category_key}`);
          if (stepIdx >= 0) setCurrentStep(stepIdx);
          toast({ title: "Missing rating", description: `Please rate "${unratedCategory.category_label}" before submitting.`, variant: "destructive" });
          setIsLoading(false);
          return;
        }
        if (!title || title.trim().length < VALIDATION_RULES.title.min) {
          const stepIdx = findStepIndex("review_title");
          if (stepIdx >= 0) setCurrentStep(stepIdx);
          toast({ title: "Title too short", description: `Your title needs at least ${VALIDATION_RULES.title.min} characters. You're on ${title?.trim().length || 0}.`, variant: "destructive" });
          setIsLoading(false);
          return;
        }
        if (!pros || pros.trim().length < VALIDATION_RULES.pros.min) {
          const stepIdx = findStepIndex("pros");
          if (stepIdx >= 0) setCurrentStep(stepIdx);
          toast({ title: "Pros too short", description: `Pros needs at least ${VALIDATION_RULES.pros.min} characters. You're on ${pros?.trim().length || 0}.`, variant: "destructive" });
          setIsLoading(false);
          return;
        }
        if (!cons || cons.trim().length < VALIDATION_RULES.cons.min) {
          const stepIdx = findStepIndex("cons");
          if (stepIdx >= 0) setCurrentStep(stepIdx);
          toast({ title: "Cons too short", description: `Cons needs at least ${VALIDATION_RULES.cons.min} characters. You're on ${cons?.trim().length || 0}.`, variant: "destructive" });
          setIsLoading(false);
          return;
        }

        Object.assign(sectionData, {
          title,
          pros,
          cons,
          advice: advice || null,
          rating: calculateOverallRating(),
          recommendation: recommendation || null,
          ceo_approval: ceoApproval === "Yes" ? true : ceoApproval === "No" ? false : null,
          private_feedback: privateFeedback || null,
          ratings: coreRatings.filter(r => r.value > 0).map(r => ({ category: r.category_label, rating: r.value })),
        });
      }

      if (sectionType === "interview") {
        const findStepIndex = (key: string) => steps.findIndex(s => s.key === key);
        const stagesArray = Array.from(interviewStages);
        if (interviewStagesOther.trim()) stagesArray.push(`other:${interviewStagesOther.trim()}`);

        // Validate all interview fields are filled
        const missing: { label: string; stepKey: string }[] = [];
        if (interviewExperienceRating === 0) missing.push({ label: "Experience Rating", stepKey: "interview_rating" });
        if (!interviewCount) missing.push({ label: "Interview Count", stepKey: "interview_count" });
        if (!interviewDifficulty) missing.push({ label: "Difficulty", stepKey: "interview_difficulty" });
        if (stagesArray.length === 0) missing.push({ label: "Interview Stages", stepKey: "interview_stages" });
        if (!interviewDescription || interviewDescription.trim().length < 30) missing.push({ label: "Interview Description (min 30 chars)", stepKey: "interview_description" });
        if (!interviewTips || interviewTips.trim().length < 30) missing.push({ label: "Interview Advice (min 30 chars)", stepKey: "interview_tips" });

        if (missing.length > 0) {
          const stepIdx = findStepIndex(missing[0].stepKey);
          if (stepIdx >= 0) setCurrentStep(stepIdx);
          toast({ title: "Required fields missing", description: missing.map(m => m.label).join(", "), variant: "destructive" });
          setIsLoading(false);
          return;
        }

        Object.assign(sectionData, {
          did_interview: true,
          interview_experience_rating: interviewExperienceRating,
          interview_count: parseInt(interviewCount),
          interview_difficulty: interviewDifficulty,
          interview_stages: stagesArray,
          interview_description: interviewDescription.trim(),
          interview_tips: interviewTips.trim(),
        });
      }

      const response = await supabase.functions.invoke("submit-review-section", {
        body: {
          session_id: sessionId,
          session_token: sessionToken,
          company_id: companyId,
          section_type: sectionType,
          section_data: sectionData,
          honeypot_field: "",
        },
      });

      const errorMessage = await extractEdgeFunctionError(response);
      
      if (errorMessage && errorMessage.includes("already been submitted")) {
        toast({ title: "Section already submitted", description: "Moving to the next step." });
        onSuccess();
        return;
      }
      
      if (errorMessage) throw new Error(errorMessage);
      if (!response.data?.success) throw new Error(response.data?.error || "Failed to submit");

      trackSessionEvent(sessionId, "section_submitted", { section_type: sectionType, step_reached: safeStep, total_steps: steps.length });
      toast({ title: "Section submitted!", description: "Your contribution will be reviewed by our team." });
      onSuccess();
    } catch (error: any) {
      console.error("Error submitting section:", error);
      toast({ title: "Failed to submit", description: error.message || "Please try again.", variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  if (isConfigLoading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  // Render current single-question step
  const renderStep = () => {
    const step = steps[safeStep];
    if (!step) return null;

    switch (step.key) {
      // ── Compensation: Employment Status ──
      case "employment_status": {
        const options = [
          { value: "Current Employee", label: "Current Employee" },
          { value: "Former Employee", label: "Former Employee" },
        ];
        return (
          <StepContent title="Let's start with the basics." description="Are you a current or former employee?">
            <div className="space-y-3">
              {options.map((opt) => (
                <OptionCard
                  key={opt.value}
                  label={opt.label}
                  selected={employmentStatus === opt.value}
                  onClick={() => { setEmploymentStatus(opt.value); autoAdvance(); }}
                />
              ))}
            </div>
          </StepContent>
        );
      }

      // ── Compensation: Year Left (conditional) ──
      case "end_year":
        return (
          <StepContent title="When did you leave?" description="This helps us provide relevant insights.">
            <Input type="number" value={endYear} onChange={e => setEndYear(e.target.value)} placeholder="e.g. 2024" min={1950} max={2100} onWheel={e => (e.target as HTMLInputElement).blur()} />
          </StepContent>
        );

      // ── Compensation: Employment Type ──
      case "employment_type": {
        const options = [
          { value: "Internship", label: "Intern" },
          { value: "Part-Time", label: "Part-Time" },
          { value: "Full-Time", label: "Full-Time" },
          { value: "Contract", label: "Contract" },
        ];
        return (
          <StepContent title="Got it. What about your employment type?">
            <div className="space-y-3">
              {options.map((opt) => (
                <OptionCard
                  key={opt.value}
                  label={opt.label}
                  selected={employmentType === opt.value}
                  onClick={() => { setEmploymentType(opt.value); autoAdvance(); }}
                />
              ))}
            </div>
          </StepContent>
        );
      }

      // ── Compensation: Role Level ──
      case "role_level": {
        const options = [
          { value: "Intern", label: "Intern", description: "Internship or training programme" },
          { value: "Entry Level", label: "Entry Level", description: "0–2 years of experience" },
          { value: "Mid Level", label: "Mid Level", description: "2–5 years of experience" },
          { value: "Senior", label: "Senior", description: "5+ years of experience" },
          { value: "Lead / Manager", label: "Lead / Manager", description: "Leading a team or function" },
          { value: "Director", label: "Director", description: "Overseeing multiple teams or a department" },
          { value: "C-Suite / Executive", label: "C-Suite / Executive", description: "CEO, CFO, COO, CTO etc." },
        ];
        // 9 options → use dropdown
        return (
          <StepContent title="What level best describes your role?">
            <Select value={roleLevel} onValueChange={(val) => { setRoleLevel(val); autoAdvance(); }}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select your role level" />
              </SelectTrigger>
              <SelectContent>
                {options.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>
                    <span className="font-medium">{opt.label}</span>
                    <span className="text-muted-foreground ml-2 text-xs">— {opt.description}</span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </StepContent>
        );
      }

      // ── Compensation: Department (14 options → dropdown) ──
      case "department": {
        const options = [
          "Accounting & Finance", "Administration", "Customer Service", "Engineering",
          "Human Resources", "IT", "Legal", "Marketing", "Operations", "Product",
          "Research & Development", "Sales", "Supply Chain & Logistics", "Other"
        ];
        return (
          <StepContent title="Which department do you work in?">
            <Select value={department} onValueChange={(val) => {
              setDepartment(val);
              if (val !== "Other") { setRoleFocus(""); autoAdvance(); }
            }}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select your department" />
              </SelectTrigger>
              <SelectContent className="max-h-60">
                {options.map((opt) => (
                  <SelectItem key={opt} value={opt}>{opt}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            {department === "Other" && (
              <div className="mt-4">
                <Input value={roleFocus} onChange={e => setRoleFocus(e.target.value)} placeholder="Type your department..." />
              </div>
            )}
          </StepContent>
        );
      }

      // ── Compensation: Role Title ──
      case "role_title":
        return (
          <StepContent title="What's your role title?" optional>
            <p className="text-xs text-muted-foreground">
              We collect role title to improve data quality and aggregated insights. This information will never be shown publicly or linked to your review.
            </p>
            <Input value={roleTitle} onChange={e => setRoleTitle(e.target.value)} placeholder="e.g. Software Engineer, Marketing Manager" />
          </StepContent>
        );

      // ── Compensation: Tenure ──
      case "tenure": {
        const options = [
          "Less than 1 year", "1-2 years", "3-5 years", "5-10 years", "10+ years"
        ];
        return (
          <StepContent title="How long have you been with the company?">
            <div className="space-y-3">
              {options.map((opt) => (
                <OptionCard
                  key={opt}
                  label={opt}
                  selected={tenureRange === opt}
                  onClick={() => { setTenureRange(opt); autoAdvance(); }}
                />
              ))}
            </div>
          </StepContent>
        );
      }

      // ── Compensation: Monthly Salary (with optional secondary currency) ──
      case "salary":
        return (
          <StepContent title="Now for the important part." description="What's your monthly take-home salary?">
            <p className="text-xs text-muted-foreground">This is the <span className="font-semibold text-foreground">net</span> amount you receive <span className="font-semibold text-foreground">after taxes</span>.</p>
            <SalaryInput
              currencyValue={baseSalaryCurrency}
              amountValue={baseSalaryAmount}
              onCurrencyChange={setBaseSalaryCurrency}
              onAmountChange={setBaseSalaryAmount}
              amountPlaceholder="Amount"
            />
            <div className="border-t border-border pt-4 mt-2">
              <Label className="text-sm font-semibold mb-1 block">Paid in a second currency?</Label>
              <p className="text-xs text-muted-foreground mb-3">If you receive part of your salary in a different currency (e.g. USD + ZWL), enter the additional amount below.</p>
              <SalaryInput
                currencyValue={secondarySalaryCurrency}
                amountValue={secondarySalaryAmount}
                onCurrencyChange={setSecondarySalaryCurrency}
                onAmountChange={setSecondarySalaryAmount}
                amountPlaceholder="Monthly amount (optional)"
              />
            </div>
          </StepContent>
        );
      // ── Compensation: Commission (yes/no gate) ──
      case "commission": {
        const options = [
          { value: "Yes", label: "Yes", description: "I earn commission on top of my salary" },
          { value: "No", label: "No", description: "My compensation does not include commission" },
        ];
        return (
          <StepContent title="Do you earn commission?" description="For example, sales commission, performance-based commissions, or referral bonuses." optional>
            <div className="space-y-3">
              {options.map((opt) => (
                <OptionCard
                  key={opt.value}
                  label={opt.label}
                  description={opt.description}
                  selected={earnsCommission === opt.value}
                  onClick={() => {
                    setEarnsCommission(opt.value);
                    if (opt.value === "No") setCommissionAmount("");
                    autoAdvance();
                  }}
                />
              ))}
            </div>
          </StepContent>
        );
      }

      // ── Compensation: Commission Amount ──
      case "commission_amount":
        return (
          <StepContent title="What's your average monthly commission?" description="Your typical monthly earnings from commission — doesn't have to be exact.">
            <SalaryInput
              currencyValue={baseSalaryCurrency}
              amountValue={commissionAmount}
              onCurrencyChange={() => {}}
              onAmountChange={setCommissionAmount}
              amountPlaceholder="Average monthly amount"
            />
            <p className="text-xs text-muted-foreground">This will be included in your estimated total compensation.</p>
          </StepContent>
        );

      // ── Compensation: Thirteenth Cheque ──
      case "bonus":
        return (
          <StepContent title="Do you receive a thirteenth cheque?" description="A guaranteed extra month's salary, typically paid in November or December." optional>
            <SalaryInput
              currencyValue={bonusCurrency}
              amountValue={bonusAmount}
              onCurrencyChange={setBonusCurrency}
              onAmountChange={setBonusAmount}
              amountPlaceholder="Total annual amount."
            />
            <p className="text-xs text-muted-foreground">We'll calculate the monthly equivalent automatically.</p>
          </StepContent>
        );

      // ── Compensation: Benefits (integrated selection + values) ──
      case "benefits": {
        const BENEFIT_HELPER_TEXT: Record<string, string> = {
          medical_aid: "Employer's monthly contribution — check your payslip",
          transport_fuel: "Monthly fuel card value, or cash transport allowance",
          pension_nssa: "Employer's monthly contribution amount",
          airtime_data: "Monthly airtime or data bundle value",
          housing_allowance: "Monthly cash allowance or estimated rental value of company housing",
          school_fees: "Monthly equivalent (divide annual amount by 12)",
          education_training: "Monthly equivalent of training budget or bursary",
        };
        const BENEFIT_LABEL_OVERRIDES: Record<string, string> = {
          medical_aid: "Medical Aid",
          transport_fuel: "Transport allowance / Fuel",
          pension_nssa: "Pension / NSSA contributions",
          performance_bonus: "Annual Performance Bonus",
          airtime_data: "Airtime / data allowance",
          housing_allowance: "Housing allowance",
          school_fees: "School Fees",
          education_training: "Education / training support",
          paid_leave: "Paid leave (annual, sick, maternity)",
          flexible_remote: "Flexible or remote work",
          funeral_assistance: "Funeral assistance / funeral policy",
        };
        const ANNUAL_BENEFITS = new Set(["performance_bonus"]);
        const NON_MONETISABLE_BENEFITS = new Set([
          "pension_nssa",
          "paid_leave",
          "flexible_remote",
          "funeral_assistance",
        ]);
        const BENEFIT_SORT_ORDER: Record<string, number> = {
          medical_aid: 0,
          transport_fuel: 1,
          performance_bonus: 2,
          airtime_data: 3,
          housing_allowance: 4,
          school_fees: 5,
          education_training: 6,
          pension_nssa: 7,
          paid_leave: 8,
          flexible_remote: 9,
          funeral_assistance: 10,
        };
        const sortedBenefits = [...standardBenefits]
          .filter(b => b.benefit_key !== "thirteenth_cheque")
          .sort((a, b) => (BENEFIT_SORT_ORDER[a.benefit_key] ?? 99) - (BENEFIT_SORT_ORDER[b.benefit_key] ?? 99));
        const ANNUAL_BENEFIT_HELPER: Record<string, string> = {
          performance_bonus: "Divide by 12 for the monthly equivalent — we'll do this automatically.",
        };
        const customBenefitTotal = customBenefits.reduce((sum, b) => {
          const customKey = `custom_${b.toLowerCase().replace(/[^a-z0-9]/g, "_")}`;
          const val = parseFloat(benefitValues[customKey] || "0");
          return sum + (isNaN(val) ? 0 : val);
        }, 0);
        const runningTotal = sortedBenefits
          .filter(b => confirmedStandardBenefits.has(b.id) && !NON_MONETISABLE_BENEFITS.has(b.benefit_key))
          .reduce((sum, b) => {
            const val = parseFloat(benefitValues[b.benefit_key] || "0");
            if (isNaN(val)) return sum;
            return sum + (ANNUAL_BENEFITS.has(b.benefit_key) ? val / 12 : val);
          }, 0) + customBenefitTotal;
        const hasAnnualBenefitWithValue = sortedBenefits.some(b =>
          confirmedStandardBenefits.has(b.id) && ANNUAL_BENEFITS.has(b.benefit_key) && parseFloat(benefitValues[b.benefit_key] || "0") > 0
        );
        return (
          <StepContent title="Which benefits do you receive?" optional description="Select each benefit you receive, then enter its estimated monthly value.">
            <div className="space-y-3">
              {sortedBenefits.map(b => {
                const isSelected = confirmedStandardBenefits.has(b.id);
                const isMonetisable = !NON_MONETISABLE_BENEFITS.has(b.benefit_key);
                return (
                  <div key={b.id} className="rounded-lg border border-border bg-background overflow-hidden">
                    <button
                      type="button"
                      onClick={() => {
                        setConfirmedStandardBenefits(prev => {
                          const s = new Set(prev);
                          if (s.has(b.id)) {
                            s.delete(b.id);
                            if (isMonetisable) {
                              setBenefitValues(prev => { const next = { ...prev }; delete next[b.benefit_key]; return next; });
                            }
                          } else {
                            s.add(b.id);
                          }
                          return s;
                        });
                      }}
                      className="w-full flex items-center gap-3 px-4 py-3 text-left"
                    >
                      <div className={cn(
                        "h-5 w-5 rounded border-2 flex items-center justify-center shrink-0 transition-colors",
                        isSelected ? "bg-foreground border-foreground" : "border-border"
                      )}>
                        {isSelected && (
                          <svg className="h-3 w-3 text-background" viewBox="0 0 12 12" fill="none"><path d="M2 6l3 3 5-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
                        )}
                      </div>
                      <span className="text-sm font-medium text-foreground">
                        {BENEFIT_LABEL_OVERRIDES[b.benefit_key] || b.benefit_label}
                      </span>
                    </button>
                    {isSelected && isMonetisable && (
                      <div className="px-4 pb-4 pt-0 space-y-1.5 animate-in fade-in slide-in-from-top-2 duration-200">
                        <SalaryInput
                          currencyValue={baseSalaryCurrency}
                          amountValue={benefitValues[b.benefit_key] || ""}
                          onCurrencyChange={() => {}}
                          onAmountChange={(val) => setBenefitValues(prev => ({ ...prev, [b.benefit_key]: val }))}
                         amountPlaceholder={ANNUAL_BENEFITS.has(b.benefit_key) ? "Total annual amount" : "Monthly value (optional)"}
                        />
                        <p className="text-xs text-muted-foreground">
                          {ANNUAL_BENEFIT_HELPER[b.benefit_key] || BENEFIT_HELPER_TEXT[b.benefit_key] || "Estimated monthly value in USD"}
                        </p>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
            <div className="border-t border-border pt-4">
              <Label className="text-sm font-semibold mb-1 block">Other benefits not listed?</Label>
              <p className="text-xs text-muted-foreground mb-3">Add any unique perks or benefits specific to your role.</p>
              <div className="flex gap-2">
                <Input value={newCustomBenefit} onChange={e => setNewCustomBenefit(e.target.value)} placeholder="e.g., Pet Insurance, Childcare Subsidy..." onKeyDown={e => e.key === "Enter" && (e.preventDefault(), handleAddCustom())} className="flex-1" />
                <Button type="button" variant="outline" onClick={handleAddCustom}><Plus className="h-4 w-4 mr-1" /> Add</Button>
              </div>
              {customBenefits.length > 0 && (
                <div className="space-y-3 mt-3">
                  {customBenefits.map(b => {
                    const customKey = `custom_${b.toLowerCase().replace(/[^a-z0-9]/g, "_")}`;
                    return (
                      <div key={b} className="rounded-lg border border-border bg-background overflow-hidden">
                        <div className="flex items-center justify-between px-4 py-3">
                          <span className="text-sm font-medium text-foreground">{b}</span>
                          <button
                            type="button"
                            onClick={() => {
                              setCustomBenefits(prev => prev.filter(x => x !== b));
                              setBenefitValues(prev => { const next = { ...prev }; delete next[customKey]; return next; });
                            }}
                            className="text-muted-foreground hover:text-foreground transition-colors"
                          >
                            <X className="h-4 w-4" />
                          </button>
                        </div>
                        <div className="px-4 pb-4 pt-0 space-y-1.5">
                          <SalaryInput
                            currencyValue={baseSalaryCurrency}
                            amountValue={benefitValues[customKey] || ""}
                            onCurrencyChange={() => {}}
                            onAmountChange={(val) => setBenefitValues(prev => ({ ...prev, [customKey]: val }))}
                            amountPlaceholder="Monthly value (optional)"
                          />
                          <p className="text-xs text-muted-foreground">Estimated monthly value</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
            <div className="mt-4 pt-4 border-t border-border">
              <div className="flex items-center justify-between">
                <span className="text-sm font-semibold text-foreground">Estimated total benefits value</span>
                <span className="text-sm font-bold text-foreground">
                  ${runningTotal.toLocaleString(undefined, { maximumFractionDigits: 0 })} / month
                </span>
              </div>
              {hasAnnualBenefitWithValue && (
                <p className="text-xs text-muted-foreground mt-1">Annual amounts have been converted to monthly equivalents.</p>
              )}
            </div>
          </StepContent>
        );
      }

      // ── Compensation: Confirm Company Benefits ──
      case "confirm_benefits":
        return (
          <StepContent title="Can you confirm these company benefits?" description="Either your company or a colleague indicated that the following benefits are provided. Please select any of the benefits that you receive." optional>
            <div className="flex flex-wrap gap-2">
              {companyBenefits.map(b => {
                const isSelected = confirmedCompanyBenefits.has(b.id);
                return (
                  <button
                    key={b.id}
                    type="button"
                    onClick={() => setConfirmedCompanyBenefits(prev => {
                      const s = new Set(prev);
                      s.has(b.id) ? s.delete(b.id) : s.add(b.id);
                      return s;
                    })}
                    className={cn(
                      "px-3.5 py-1.5 rounded-full text-sm font-medium border transition-all duration-200 cursor-pointer",
                      isSelected
                        ? "bg-foreground text-background border-foreground"
                        : "bg-background text-foreground border-border hover:border-foreground/40"
                    )}
                  >
                    {b.benefit_name}
                  </button>
                );
              })}
            </div>
          </StepContent>
        );

      // ── Compensation: Confirmation ──
      case "comp_confirmation": {
        const CONFIRM_LABEL: Record<string, string> = {
          medical_aid: "Medical Aid",
          transport_fuel: "Transport / Fuel",
          airtime_data: "Airtime / Data",
          housing_allowance: "Housing",
          school_fees: "School Fees",
          education_training: "Education / Training",
          performance_bonus: "Performance Bonus",
        };

        const baseNum = Number(baseSalaryAmount) || 0;
        const bonusNum = Number(bonusAmount) || 0;
        const commissionNum = Number(commissionAmount) || 0;

        // Build itemized monthly lines (only items with value > 0)
        const monthlyItems: { label: string; amount: number }[] = [];
        if (baseNum > 0) monthlyItems.push({ label: "Base salary", amount: baseNum });
        if (commissionNum > 0) monthlyItems.push({ label: "Commission (avg)", amount: commissionNum });

        Object.entries(benefitValues).forEach(([key, val]) => {
          const n = Number(val);
          if (n > 0 && key !== "performance_bonus") {
            const label = CONFIRM_LABEL[key] || key.replace(/_/g, " ").replace(/^custom\s/, "");
            monthlyItems.push({ label, amount: n });
          }
        });

        // Annual items
        const annualItems: { label: string; amount: number }[] = [];
        if (bonusNum > 0) annualItems.push({ label: "13th cheque", amount: bonusNum });
        const perfBonusNum = Number(benefitValues["performance_bonus"] || "0") || 0;
        if (perfBonusNum > 0) annualItems.push({ label: "Performance Bonus", amount: perfBonusNum });

        const benefitValuesNumeric: Record<string, number> = {};
        Object.entries(benefitValues).forEach(([key, val]) => {
          const n = Number(val);
          if (n > 0) benefitValuesNumeric[key] = n;
        });

        const totalMonthly = getTotalComp({
          base_salary_amount: baseNum,
          benefit_values: benefitValuesNumeric,
          bonus_amount: bonusNum,
          commission_amount: commissionNum,
        });

        return (
          <StepContent
            title="Does this look right?"
            description="Based on what you entered, here's your estimated total monthly compensation. If this does not look right, please review your submissions."
          >
            <div className="space-y-4">
              {/* Monthly items */}
              {monthlyItems.length > 0 && (
                <div className="space-y-2">
                  <span className="text-sm font-medium text-foreground">Monthly</span>
                  {monthlyItems.map((item) => (
                    <div key={item.label} className="flex items-center justify-between pl-3">
                      <span className="text-sm text-foreground">{item.label}</span>
                      <span className="text-sm text-foreground">{formatSalaryAmount(item.amount, baseSalaryCurrency)} / month</span>
                    </div>
                  ))}
                </div>
              )}

              {/* Annual items */}
              {annualItems.length > 0 && (
                <div className="space-y-2">
                  <span className="text-sm font-medium text-foreground">Annual</span>
                  {annualItems.map((item) => (
                    <div key={item.label} className="flex items-center justify-between pl-3">
                      <span className="text-sm text-foreground">{item.label}</span>
                      <span className="text-sm text-foreground">{formatSalaryAmount(item.amount, baseSalaryCurrency)} / year</span>
                    </div>
                  ))}
                </div>
              )}

              {/* Total */}
              <div className="border-t border-border pt-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-foreground">Estimated total compensation</span>
                  <span className="text-sm font-bold text-foreground">
                    {formatSalaryAmount(totalMonthly, baseSalaryCurrency)} / month
                  </span>
                </div>
                {annualItems.length > 0 && (
                  <p className="text-sm text-foreground mt-1">
                    Annual items divided by 12 and added to monthly compensation.
                  </p>
                )}
              </div>
            </div>
          </StepContent>
        );
      }

      // ── Culture: Intro Slide ──
      case "culture_intro":
        return (
          <StepContent title="Thanks for taking the time to share your experience.">
            <p className="text-sm text-muted-foreground">
              We'll start with a few quick ratings — just tap 1 to 5, with 5 being the best. It only takes a minute.
            </p>
          </StepContent>
        );

      case "attestation":
        return (
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold text-foreground">One last thing</h2>
              <p className="text-sm text-foreground mt-2 leading-relaxed">
                Before you submit, please confirm that you are sharing this review honestly, based on your own experience.
              </p>
              <p className="text-sm text-foreground mt-4 leading-relaxed">
                Your contribution means a great deal to the Pachena community.
              </p>
            </div>
            <div className="space-y-3">
              <OptionCard
                label="Yes, submit."
                selected={false}
                onClick={() => {
                  setAttestationChecked(true);
                  handleSubmit();
                }}
              />
            </div>
          </div>
        );

      default: {
        // ── Culture: Individual Rating Steps ──
        const ratingMatch = step.key.match(/^rating_(.+)$/);
        if (ratingMatch) {
          const catKey = ratingMatch[1];
          const cat = coreRatings.find(r => r.category_key === catKey);
          if (!cat) return null;
          return (
            <StepContent title={cat.category_label}>
              {cat.category_description && (
                <p className="text-base text-foreground -mt-2">{cat.category_description}</p>
              )}
              <div className="flex gap-2">
                {[1, 2, 3, 4, 5].map(star => (
                  <button key={star} type="button" onClick={() => { handleRatingClick(cat.category_key, star); autoAdvance(); }}>
                    <Star className={cn("h-8 w-8 transition-colors", star <= cat.value ? "fill-[hsl(var(--star))] text-[hsl(var(--star))]" : "text-[hsl(var(--star-empty))]")} />
                  </button>
                ))}
              </div>
            </StepContent>
          );
        }
        return null;
      }
      case "review_title":
        return (
          <StepContent title="Awesome. Now, let's give your review a title." description="This will be the first thing people see when reading your review.">
            <Input value={title} onChange={e => setTitle(e.target.value)} placeholder="e.g. Great place to grow your career" maxLength={200} />
            <WritingSuggestion value={title} fieldName="headline" onAccept={setTitle} />
            <CharacterCounter current={title.length} min={VALIDATION_RULES.title.min} max={VALIDATION_RULES.title.max} />
          </StepContent>
        );

      // ── Culture: Pros ──
      case "pros":
        return (
          <StepContent title="What do you like about working here?" description="Share your personal experience — what aspects of the role or culture have you found rewarding?">
            <Textarea value={pros} onChange={e => setPros(e.target.value)} placeholder="What do you like about working here?" rows={4} maxLength={3000} />
            <div className="flex justify-end mt-1">
              <DictationButton value={pros} onChange={setPros} fieldName="pros" />
            </div>
            <WritingSuggestion value={pros} fieldName="pros" onAccept={setPros} />
            <CharacterCounter current={pros.length} min={VALIDATION_RULES.pros.min} max={VALIDATION_RULES.pros.max} />
          </StepContent>
        );

      // ── Culture: Cons ──
      case "cons":
        return (
          <StepContent title="What could be improved?" description="Share your personal experience and honest opinions. Please avoid making specific allegations about individuals or the company.">
            <Textarea value={cons} onChange={e => setCons(e.target.value)} placeholder="What could be improved?" rows={4} maxLength={3000} />
            <div className="flex justify-end mt-1">
              <DictationButton value={cons} onChange={setCons} fieldName="cons" />
            </div>
            <WritingSuggestion value={cons} fieldName="cons" onAccept={setCons} />
            <CharacterCounter current={cons.length} min={VALIDATION_RULES.cons.min} max={VALIDATION_RULES.cons.max} />
          </StepContent>
        );

      // ── Culture: Advice ──
      case "advice":
        return (
          <StepContent title="What's one piece of advice you'd give to someone just joining the company?" description="Keep it practical and based on your own experience." optional>
            <Textarea value={advice} onChange={e => setAdvice(e.target.value)} placeholder="Share a tip for new joiners..." rows={4} maxLength={5000} />
            <div className="flex justify-end mt-1">
              <DictationButton value={advice} onChange={setAdvice} fieldName="advice" />
            </div>
            <WritingSuggestion value={advice} fieldName="advice" onAccept={setAdvice} />
          </StepContent>
        );

      // ── Culture: Recommendation ──
      case "recommendation": {
        const options = [
          { value: "Yes", label: "Yes" },
          { value: "No", label: "No" },
          { value: "Maybe", label: "Maybe" },
        ];
        return (
          <StepContent title="Would you recommend this employer to a friend?">
            <div className="space-y-3">
              {options.map((opt) => (
                <OptionCard
                  key={opt.value}
                  label={opt.label}
                  selected={recommendation === opt.value}
                  onClick={() => { setRecommendation(opt.value); autoAdvance(); }}
                />
              ))}
            </div>
          </StepContent>
        );
      }

      // ── Culture: CEO Approval ──
      case "ceo_approval": {
        const options = [
          { value: "Yes", label: "Yes" },
          { value: "No", label: "No" },
          { value: "No Opinion", label: "No Opinion" },
        ];
        return (
          <StepContent title="Do you approve of the CEO?">
            <div className="space-y-3">
              {options.map((opt) => (
                <OptionCard
                  key={opt.value}
                  label={opt.label}
                  selected={ceoApproval === opt.value}
                  onClick={() => { setCeoApproval(opt.value); autoAdvance(); }}
                />
              ))}
            </div>
          </StepContent>
        );
      }

      // ── Shared: Demographics - Age Range ──
      case "demographics_age": {
        const options = [
          "Under 20", "20-24", "25-34", "35-44", "45-54", "55-64", "65+", "Prefer not to say"
        ];
        return (
          <StepContent title="Almost done. A few optional questions to help us understand workforce trends." description="What is your age range?" optional>
            <div className="space-y-3">
              {options.map((opt) => (
                <OptionCard
                  key={opt}
                  label={opt}
                  selected={ageRange === opt}
                  onClick={() => { setAgeRange(opt); autoAdvance(); }}
                />
              ))}
            </div>
          </StepContent>
        );
      }

      // ── Culture: Demographics - Gender ──
      case "demographics_gender": {
        const options = ["Male", "Female", "Non-binary", "Prefer not to say"];
        return (
          <StepContent title="What is your gender?" optional>
            <div className="space-y-3">
              {options.map((opt) => (
                <OptionCard
                  key={opt}
                  label={opt}
                  selected={gender === opt}
                  onClick={() => { setGender(opt); autoAdvance(); }}
                />
              ))}
            </div>
          </StepContent>
        );
      }

      // ── Culture: Demographics - Ethnicity ──
      case "demographics_ethnicity": {
        const options = [
          "Black / African", "White / Caucasian", "Mixed / Multiracial",
          "Asian", "Indian", "Coloured", "Other", "Prefer not to say"
        ];
        return (
          <StepContent title="What is your ethnicity?" optional>
            <div className="space-y-3">
              {options.map((opt) => (
                <OptionCard
                  key={opt}
                  label={opt}
                  selected={ethnicity === opt}
                  onClick={() => { setEthnicity(opt); autoAdvance(); }}
                />
              ))}
            </div>
          </StepContent>
        );
      }

      // ── Culture: Demographics - Education Level ──
      case "demographics_education": {
        const options = [
          "High School", "Diploma / Certificate", "Bachelor's Degree",
          "Master's Degree", "Doctorate / PhD", "Professional Qualification", "Prefer not to say"
        ];
        return (
          <StepContent title="What is your highest level of education?" optional>
            <div className="space-y-3">
              {options.map((opt) => (
                <OptionCard
                  key={opt}
                  label={opt}
                  selected={educationLevel === opt}
                  onClick={() => { setEducationLevel(opt); autoAdvance(); }}
                />
              ))}
            </div>
          </StepContent>
        );
      }

      // ── Culture: Private Feedback ──
      case "private_feedback":
        return (
          <StepContent title="Anything you'd like to say directly to the employer?" optional>
            <p className="text-sm text-foreground">This will only be visible to the employer and not displayed publicly. Please keep it constructive and professional.</p>
            <Textarea value={privateFeedback} onChange={e => setPrivateFeedback(e.target.value)} placeholder="Private feedback (optional)" rows={4} maxLength={5000} />
            <div className="flex justify-end mt-1">
              <DictationButton value={privateFeedback} onChange={setPrivateFeedback} fieldName="private feedback" />
            </div>
            <WritingSuggestion value={privateFeedback} fieldName="private feedback" onAccept={setPrivateFeedback} />
          </StepContent>
        );

      // ── Interview: Did you interview? ──
      case "did_interview": {
        const options = [
          { value: "Yes", label: "Yes" },
          { value: "No", label: "No" },
        ];
        return (
          <StepContent title={`Did you interview at ${companyName}?`}>
            <div className="space-y-3">
              {options.map((opt) => (
                <OptionCard
                  key={opt.value}
                  label={opt.label}
                  selected={didInterview === opt.value}
                  onClick={() => { setDidInterview(opt.value); autoAdvance(); }}
                />
              ))}
            </div>
          </StepContent>
        );
      }

      // ── Interview: Rating ──
      case "interview_rating":
        return (
          <StepContent title="How would you rate the interview experience?" description="Think about the overall process — communication, fairness, and professionalism.">
            <div className="flex gap-1">
              {[1, 2, 3, 4, 5].map(star => (
                <button key={star} type="button" onClick={() => { setInterviewExperienceRating(star); autoAdvance(); }}>
                  <Star className={cn("h-8 w-8", star <= interviewExperienceRating ? "fill-[hsl(var(--star))] text-[hsl(var(--star))]" : "text-[hsl(var(--star-empty))]")} />
                </button>
              ))}
            </div>
          </StepContent>
        );

      // ── Interview: Count ──
      case "interview_count":
        return (
          <StepContent title="How many rounds of interviews did you go through?" description="Phone calls, video calls, in-person — count them all.">
            <Input type="number" value={interviewCount} onChange={e => setInterviewCount(e.target.value)} min={1} max={50} placeholder="e.g. 3" onWheel={e => (e.target as HTMLInputElement).blur()} />
          </StepContent>
        );

      // ── Interview: Difficulty ──
      case "interview_difficulty": {
        const options = ["Easy", "Average", "Difficult", "Very Difficult"];
        return (
          <StepContent title="How tough was the interview process?" description="Were the questions straightforward or did they really put you to the test?">
            <div className="space-y-3">
              {options.map((opt) => (
                <OptionCard
                  key={opt}
                  label={opt}
                  selected={interviewDifficulty === opt}
                  onClick={() => { setInterviewDifficulty(opt); autoAdvance(); }}
                />
              ))}
            </div>
          </StepContent>
        );
      }

      // ── Interview: Stages ──
      case "interview_stages": {
        const stageOptions = [
          "CV screening",
          "Phone screen",
          "Technical assessment",
          "Panel interview",
          "Psychometric test",
          "Case study",
          "Background check",
        ];
        return (
          <StepContent title="What stages were involved?" description="Select all that apply.">
            <div className="flex flex-wrap gap-2">
              {stageOptions.map(stage => {
                const isSelected = interviewStages.has(stage);
                return (
                  <button
                    key={stage}
                    type="button"
                    onClick={() => setInterviewStages(prev => {
                      const s = new Set(prev);
                      s.has(stage) ? s.delete(stage) : s.add(stage);
                      return s;
                    })}
                    className={cn(
                      "px-3.5 py-1.5 rounded-full text-sm font-medium border transition-all duration-200 cursor-pointer",
                      isSelected
                        ? "bg-foreground text-background border-foreground"
                        : "bg-background text-foreground border-border hover:border-foreground/40"
                    )}
                  >
                    {stage}
                  </button>
                );
              })}
            </div>
            <div className="mt-4">
              <Label className="text-sm text-muted-foreground mb-1.5 block">Other</Label>
              <Input
                value={interviewStagesOther}
                onChange={e => setInterviewStagesOther(e.target.value)}
                placeholder="e.g. Group exercise, Presentation..."
                maxLength={100}
              />
            </div>
          </StepContent>
        );
      }

      // ── Interview: Description ──
      case "interview_description":
        return (
          <StepContent title="What was your interview like?" description="Describe the overall process — how it was structured, the format, and how it felt.">
            <Textarea value={interviewDescription} onChange={e => setInterviewDescription(e.target.value)} placeholder="Walk us through what the interview experience was like..." rows={4} maxLength={3000} />
            <div className="flex justify-end mt-1">
              <DictationButton value={interviewDescription} onChange={setInterviewDescription} fieldName="interview description" />
            </div>
            <WritingSuggestion value={interviewDescription} fieldName="interview description" onAccept={setInterviewDescription} />
            <CharacterCounter current={interviewDescription.length} min={30} max={3000} />
          </StepContent>
        );

      // ── Interview: Tips ──
      case "interview_tips":
        return (
          <StepContent title="What advice would you give to someone preparing for an interview at this company?">
            <Textarea value={interviewTips} onChange={e => setInterviewTips(e.target.value)} placeholder="What do you wish you'd known before going in?" rows={4} maxLength={3000} />
            <div className="flex justify-end mt-1">
              <DictationButton value={interviewTips} onChange={setInterviewTips} fieldName="interview tips" />
            </div>
            <WritingSuggestion value={interviewTips} fieldName="interview tips" onAccept={setInterviewTips} />
            <CharacterCounter current={interviewTips.length} min={30} max={3000} />
          </StepContent>
        );

      // (handled by default case above)
    }
  };

  const isLastStep = safeStep === steps.length - 1;

  return (
    <div className="flex-1 flex flex-col max-w-xl mx-auto w-full overflow-hidden px-6">
      {/* Form content – fixed vertical position instead of centering */}
      <div className="flex-1 flex flex-col min-h-0 overflow-y-auto">
        <div className="w-full pt-[2vh] lg:pt-[8vh]">
          {headerSlot && <div className="mb-4">{headerSlot}</div>}

          {(sectionType === "compensation" || sectionType === "culture") && safeStep === 0 && (
            <div className="mb-4 flex items-start gap-2.5 rounded-lg border border-border bg-muted/50 px-3.5 py-3 text-xs text-muted-foreground leading-relaxed">
              <Info className="h-3.5 w-3.5 mt-0.5 flex-shrink-0" />
              <span>Please do not share confidential documents, proprietary information, or trade secrets. Share only your personal experience and what you're comfortable discussing publicly.</span>
            </div>
          )}
          {/* Progress bar – same width as form */}
          <div className="mb-4 lg:mb-8 flex-shrink-0">
            <div className="h-1.5 bg-muted rounded-full overflow-hidden">
              <div 
                className="h-full bg-foreground transition-all duration-300 ease-out rounded-full"
                style={{ width: `${((safeStep + 1) / steps.length) * 100}%` }}
              />
            </div>
          </div>

          <div
            key={`${steps[safeStep]?.key}-${safeStep}`}
            className="animate-in fade-in slide-in-from-bottom-4 duration-300"
          >
            {renderStep()}
          </div>
        </div>
      </div>

      {/* Navigation pinned to bottom */}
      <div className="flex justify-between py-4 pb-8 md:pb-12 bg-background flex-shrink-0">
        {steps[safeStep]?.key === "attestation" ? (
          <button
            type="button"
            onClick={() => setCurrentStep(prev => Math.max(0, prev - 1))}
            className="text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            Go Back
          </button>
        ) : (
          <Button
            variant="outline"
            onClick={() => setCurrentStep(prev => Math.max(0, prev - 1))}
            disabled={safeStep === 0}
          >
            Back
          </Button>
        )}

        {steps[safeStep]?.key === "attestation" ? (
          <span />
        ) : isLastStep ? (
          <TraceButton traceColor="black" onClick={handleSubmit} disabled={isLoading || (steps.some(s => s.key === "attestation") && !attestationChecked)} className="bg-black text-white border-black hover:bg-black/90 hover:text-white disabled:bg-black/50 disabled:text-white/70">
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {isFullReview
              ? `Submit ${sectionType === "compensation" ? "Compensation" : sectionType === "culture" ? "Culture" : "Interview"} Review`
              : "Submit"}
          </TraceButton>
        ) : (
          <TraceButton traceColor="black" onClick={() => {
            const nextStep = Math.min(currentStep + 1, steps.length - 1);
            trackSessionEvent(sessionId, "step_changed", { section_type: sectionType, from_step: currentStep, to_step: nextStep, step_key: steps[nextStep]?.key });
            setCurrentStep(prev => prev + 1);
          }}>
            Next →
          </TraceButton>
        )}
      </div>
    </div>
  );
}
