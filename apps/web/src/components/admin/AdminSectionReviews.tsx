"use client";

import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { TraceButton } from "@/components/ui/trace-button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { createBrowserSupabaseClient } from "@/lib/supabase/client";
import { toast } from "sonner";
import { extractEdgeFunctionError } from "@/lib/edge-function-errors";
import {
  Loader2,
  Search,
  CheckCircle,
  XCircle,
  ChevronDown,
  ChevronUp,
  ChevronsUpDown,
  AlertTriangle,
  Building2,
  Star,
  DollarSign,
  Briefcase,
  MessageSquare,
  ThumbsUp,
  ThumbsDown,
  GraduationCap,
  Gift,
  Scissors,
} from "lucide-react";
import { format } from "date-fns";
import type { Json } from "@/types/supabase";
import { AIFraudPanel } from "@/components/admin/AIFraudPanel";
import { AISectionModerationPanel, type AIModerationSummary } from "@/components/admin/AISectionModerationPanel";
import RedactionEditor, { type RedactionEntry } from "@/components/admin/RedactionEditor";
const supabase = createBrowserSupabaseClient();

interface ReviewSection {
  id: string;
  company_id: string;
  section_type: string;
  moderation_status: string;
  section_data: Json;
  created_at: string;
  review_session_id: string;
  ai_fraud_summary: Json | null;
  ai_moderation_summary: Json | null;
  redactions?: Json;
  companies?: { name: string; slug: string };
}

type SortColumn = "company" | "section_type" | "moderation_status" | "created_at";
type SortDirection = "asc" | "desc";

interface AdminSectionReviewsProps {
  sectionType?: string; // undefined = all sections
}

const SortIcon = ({ column, sortColumn, sortDirection }: { column: SortColumn; sortColumn: SortColumn; sortDirection: SortDirection }) => {
  if (column !== sortColumn) return <ChevronsUpDown className="h-3.5 w-3.5 ml-1 text-muted-foreground/50" />;
  return sortDirection === "asc"
    ? <ChevronUp className="h-3.5 w-3.5 ml-1" />
    : <ChevronDown className="h-3.5 w-3.5 ml-1" />;
};

const DataRow = ({ label, value }: { label: string; value: React.ReactNode }) => {
  const isEmpty = value === null || value === undefined || value === "";
  return (
    <div className="flex justify-between py-1 text-sm">
      <span className="text-muted-foreground">{label}</span>
      <span className={`font-medium text-right max-w-[60%] ${isEmpty ? "text-muted-foreground/50 italic" : ""}`}>
        {isEmpty ? "—" : (typeof value === "string" ? value : value)}
      </span>
    </div>
  );
};

const renderStars = (rating: number) => (
  <div className="flex items-center gap-0.5">
    {[1, 2, 3, 4, 5].map((star) => (
      <Star
        key={star}
        className={`h-3.5 w-3.5 ${star <= rating ? "fill-primary text-primary" : "text-muted-foreground/30"}`}
      />
    ))}
    <span className="ml-1 text-sm text-muted-foreground">{Number(rating).toFixed(1)}/5</span>
  </div>
);

const formatCurrency = (amount: unknown, currency: unknown) => {
  if (!amount || typeof amount !== "number") return null;
  return `${currency || "USD"} ${amount.toLocaleString()}`;
};

const BENEFIT_KEY_LABELS: Record<string, string> = {
  medical_aid: "Medical Aid",
  transport_fuel: "Transport / Fuel",
  airtime_data: "Airtime / Data",
  housing_allowance: "Housing",
  school_fees: "School Fees",
  education_training: "Education / Training",
  performance_bonus_annual_value: "Performance Bonus",
  pension_nssa: "Pension / NSSA",
  paid_leave: "Paid Leave",
  flexible_remote: "Flexible / Remote",
  funeral_assistance: "Funeral Assistance",
  thirteenth_cheque: "Thirteenth Cheque",
  maternity_paternity: "Maternity / Paternity",
  unlimited_vacation: "Unlimited Vacation",
};

// Type-aware section data renderers
const CompensationRenderer = ({ data, benefitsMap }: { data: Record<string, unknown>; benefitsMap: Record<string, string> }) => {
  const benefitValues = data.benefit_values && typeof data.benefit_values === "object" ? data.benefit_values as Record<string, number> : null;
  const standardBenefitIds = Array.isArray(data.standard_benefit_ids) ? data.standard_benefit_ids as string[] : [];
  const customBenefits = Array.isArray(data.custom_benefits) ? data.custom_benefits as string[] : [];
  const thirteenthCheque = typeof data.thirteenth_cheque_annual_value === "number" ? data.thirteenth_cheque_annual_value : null;

  return (
    <div className="space-y-2">
      {/* Role & Employment */}
      <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Role & Employment</p>
      <DataRow label="Role Title" value={data.role_title as string} />
      <DataRow label="Role Level" value={data.role_level as string} />
      <DataRow label="Department" value={data.department as string} />
      <DataRow label="Employment Type" value={data.employment_type as string} />
      <DataRow label="Employment Status" value={data.employment_status as string} />
      <DataRow label="Tenure" value={data.tenure_range as string} />
      <DataRow label="End Year" value={data.end_year ? String(data.end_year) : undefined} />

      {/* Salary */}
      <div className="border-t border-border my-2" />
      <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Salary</p>
      <DataRow label="Monthly Take-Home Salary (net)" value={formatCurrency(data.base_salary_amount, data.base_salary_currency)} />
      <DataRow label="Additional Local Currency Salary" value={formatCurrency(data.secondary_salary_amount, data.secondary_salary_currency)} />

      {/* Legacy fields */}
      {(data.allowances_amount as number) > 0 && (
        <DataRow label="Allowances (legacy)" value={formatCurrency(data.allowances_amount, data.allowances_currency)} />
      )}
      {(data.bonus_amount as number) > 0 && (
        <DataRow label="Bonus (legacy)" value={formatCurrency(data.bonus_amount, data.bonus_currency)} />
      )}

      {/* Benefit Values (monetised) */}
      {benefitValues != null && Object.keys(benefitValues).length > 0 && (
        <>
          <div className="border-t border-border my-2" />
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Monetised Benefits</p>
          {Object.entries(benefitValues).map(([key, amount]) =>
            amount > 0 ? (
              <DataRow
                key={key}
                label={BENEFIT_KEY_LABELS[key] || key}
                value={`${data.base_salary_currency || "USD"} ${amount.toLocaleString()}${key === "performance_bonus_annual_value" ? "/yr" : "/mo"}`}
              />
            ) : null
          )}
        </>
      )}

      {thirteenthCheque !== null && thirteenthCheque > 0 && (
        <DataRow label="Thirteenth Cheque (annual)" value={`${data.bonus_currency || data.base_salary_currency || "USD"} ${thirteenthCheque.toLocaleString()}/yr`} />
      )}

      {/* Commission */}
      {typeof data.commission_amount === "number" && (data.commission_amount as number) > 0 && (
        <DataRow label="Avg Monthly Commission" value={`${data.base_salary_currency || "USD"} ${(data.commission_amount as number).toLocaleString()}/mo`} />
      )}

      {/* Standard Benefits (checklist) */}
      {standardBenefitIds.length > 0 && (
        <>
          <div className="border-t border-border my-2" />
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Standard Benefits Selected</p>
          <div className="flex flex-wrap gap-1.5 py-1">
            {standardBenefitIds.map(id => (
              <Badge key={id} variant="outline" className="text-xs">
                {benefitsMap[id] || id.slice(0, 8)}
              </Badge>
            ))}
          </div>
        </>
      )}

      {/* Custom Benefits */}
      {customBenefits.length > 0 && (
        <div className="py-1">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1">Custom Benefits</p>
          <div className="flex flex-wrap gap-1.5">
            {customBenefits.map((b, i) => (
              <Badge key={i} variant="outline" className="text-xs">{b}</Badge>
            ))}
          </div>
        </div>
      )}

      {/* Demographics */}
      {!!(data.age_range || data.gender || data.ethnicity || data.education_level) && (
        <>
          <div className="border-t border-border my-2" />
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Demographics</p>
          <DataRow label="Age Range" value={data.age_range as string} />
          <DataRow label="Gender" value={data.gender as string} />
          <DataRow label="Ethnicity" value={data.ethnicity as string} />
          <DataRow label="Education" value={data.education_level as string} />
        </>
      )}
    </div>
  );
};

const CultureRenderer = ({ data }: { data: Record<string, unknown> }) => (
  <div className="space-y-2">
    <DataRow label="Title" value={data.title as string} />
    {!!data.rating && <DataRow label="Overall Rating" value={renderStars(data.rating as number)} />}
    <DataRow label="Recommendation" value={data.recommendation as string} />
    <DataRow label="CEO Approval" value={data.ceo_approval !== undefined ? (data.ceo_approval ? "Yes" : "No") : undefined} />
    <div className="border-t border-border my-2" />
    {!!data.pros && (
      <div className="py-1">
        <p className="text-sm text-muted-foreground mb-1">Pros</p>
        <p className="text-sm">{data.pros as string}</p>
      </div>
    )}
    {!!data.cons && (
      <div className="py-1">
        <p className="text-sm text-muted-foreground mb-1">Cons</p>
        <p className="text-sm">{data.cons as string}</p>
      </div>
    )}
    {!!data.advice && (
      <div className="py-1">
        <p className="text-sm text-muted-foreground mb-1">Advice</p>
        <p className="text-sm">{data.advice as string}</p>
      </div>
    )}
    {!!data.private_feedback && (
      <div className="py-1 bg-yellow-50 dark:bg-yellow-900/20 p-2 rounded">
        <p className="text-sm text-muted-foreground mb-1">Private Feedback (internal only)</p>
        <p className="text-sm">{data.private_feedback as string}</p>
      </div>
    )}
    {Array.isArray(data.ratings) && data.ratings.length > 0 && (
      <div className="border-t border-border my-2 pt-2">
        <p className="text-sm font-medium mb-2">Category Ratings</p>
        {(data.ratings as Array<{ category: string; rating: number }>).map((r, i) => (
          <DataRow key={i} label={r.category} value={renderStars(r.rating)} />
        ))}
      </div>
    )}
  </div>
);

const InterviewRenderer = ({ data }: { data: Record<string, unknown> }) => (
  <div className="space-y-2">
    <DataRow label="Did Interview" value={data.did_interview ? "Yes" : "No"} />
    <DataRow label="Difficulty" value={data.interview_difficulty as string} />
    <DataRow label="Experience Rating" value={data.interview_experience_rating ? renderStars(data.interview_experience_rating as number) : undefined} />
    <DataRow label="Interview Count" value={data.interview_count ? String(data.interview_count) : undefined} />
    {/* Interview Stages */}
    <div className="py-1">
      <p className="text-sm text-muted-foreground mb-1">Interview Stages</p>
      {Array.isArray(data.interview_stages) && data.interview_stages.length > 0 ? (
        <div className="flex flex-wrap gap-1.5">
          {(data.interview_stages as string[]).map((stage, i) => (
            <span key={i} className="text-xs px-2 py-0.5 rounded-full bg-muted text-muted-foreground border">
              {stage.startsWith("other:") ? stage.replace("other:", "") : stage}
            </span>
          ))}
        </div>
      ) : (
        <p className="text-sm text-muted-foreground/50 italic">—</p>
      )}
    </div>
    <div className="py-1">
      <p className="text-sm text-muted-foreground mb-1">Description</p>
      {data.interview_description ? (
        <p className="text-sm">{data.interview_description as string}</p>
      ) : (
        <p className="text-sm text-muted-foreground/50 italic">—</p>
      )}
    </div>
    <div className="py-1">
      <p className="text-sm text-muted-foreground mb-1">Tips / Advice</p>
      {data.interview_tips ? (
        <p className="text-sm">{data.interview_tips as string}</p>
      ) : (
        <p className="text-sm text-muted-foreground/50 italic">—</p>
      )}
    </div>
  </div>
);

const SectionDataRenderer = ({ sectionType, data, benefitsMap }: { sectionType: string; data: Json; benefitsMap?: Record<string, string> }) => {
  const d = (data && typeof data === "object" && !Array.isArray(data) ? data : {}) as Record<string, unknown>;
  switch (sectionType) {
    case "compensation": return <CompensationRenderer data={d} benefitsMap={benefitsMap || {}} />;
    case "culture": return <CultureRenderer data={d} />;
    case "interview": return <InterviewRenderer data={d} />;
    default: return <pre className="text-xs overflow-auto max-h-64">{JSON.stringify(data, null, 2)}</pre>;
  }
};

const getStatusBadge = (status: string) => {
  switch (status) {
    case "approved": return <Badge variant="secondary" className="bg-green-100 text-green-800">Approved</Badge>;
    case "hidden": return <Badge variant="destructive">Rejected</Badge>;
    case "flagged": return <Badge variant="secondary" className="bg-orange-100 text-orange-800">Flagged</Badge>;
    default: return <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">Pending</Badge>;
  }
};

const getSectionLabel = (type: string) => {
  switch (type) {
    case "compensation": return "Compensation";
    case "culture": return "Culture";
    case "interview": return "Interview";
    default: return type;
  }
};

const AdminSectionReviews = ({ sectionType }: AdminSectionReviewsProps) => {
  const [sections, setSections] = useState<ReviewSection[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [selectedSection, setSelectedSection] = useState<ReviewSection | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [sortColumn, setSortColumn] = useState<SortColumn>("created_at");
  const [sortDirection, setSortDirection] = useState<SortDirection>("desc");
  const [isRedactionMode, setIsRedactionMode] = useState(false);
  const [isRedactionSaving, setIsRedactionSaving] = useState(false);
  const [standardBenefitsMap, setStandardBenefitsMap] = useState<Record<string, string>>({});

  const handleSort = (column: SortColumn) => {
    if (sortColumn === column) {
      setSortDirection(prev => prev === "asc" ? "desc" : "asc");
    } else {
      setSortColumn(column);
      setSortDirection("asc");
    }
  };

  useEffect(() => {
    fetchSections();
    fetchStandardBenefits();
  }, [sectionType]);

  const fetchStandardBenefits = async () => {
    const { data } = await supabase.from("standard_benefits").select("id, benefit_label").eq("is_active", true);
    if (data) {
      const map: Record<string, string> = {};
      data.forEach(b => { map[b.id] = b.benefit_label; });
      setStandardBenefitsMap(map);
    }
  };

  const fetchSections = async () => {
    setIsLoading(true);
    try {
      let query = supabase
        .from("review_sections")
        .select("*, companies(name, slug)")
        .order("created_at", { ascending: false });

      if (sectionType) {
        query = query.eq("section_type", sectionType);
      }

      const { data, error } = await query;
      if (error) throw error;
      setSections((data as unknown as ReviewSection[]) || []);
    } catch (error) {
      console.error("Error fetching sections:", error);
      toast.error("Failed to load review sections");
    } finally {
      setIsLoading(false);
    }
  };

  const handleModerate = async (sectionId: string, action: "approve" | "reject" | "flag") => {
    setIsProcessing(true);
    try {
      const response = await supabase.functions.invoke("moderate-reviews", {
        body: { sectionId, action },
      });

      const errorMessage = await extractEdgeFunctionError(response);
      if (errorMessage) throw new Error(errorMessage);

      const labels: Record<string, string> = { approve: "approved", reject: "rejected", flag: "flagged for review" };
      toast.success(`Section ${labels[action]} successfully`);
      fetchSections();
      setIsDialogOpen(false);
    } catch (error) {
      console.error("Error moderating section:", error);
      toast.error(error instanceof Error ? error.message : "Failed to moderate section");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleSaveRedactions = async (sectionId: string, newRedactions: RedactionEntry[]) => {
    setIsRedactionSaving(true);
    try {
      const response = await supabase.functions.invoke("moderate-reviews", {
        body: { sectionId, action: "redact", redactions: newRedactions },
      });
      const errorMessage = await extractEdgeFunctionError(response);
      if (errorMessage) throw new Error(errorMessage);

      toast.success(`${newRedactions.length} redaction(s) saved`);
      setIsRedactionMode(false);
      fetchSections();
    } catch (error) {
      console.error("Error saving redactions:", error);
      toast.error(error instanceof Error ? error.message : "Failed to save redactions");
    } finally {
      setIsRedactionSaving(false);
    }
  };

  const filteredSections = sections.filter((s) => {
    const companyName = s.companies?.name?.toLowerCase() || "";
    const matchesSearch = companyName.includes(searchQuery.toLowerCase()) ||
      s.section_type.includes(searchQuery.toLowerCase());
    const matchesFilter = filterStatus === "all" || s.moderation_status === filterStatus ||
      (filterStatus === "hidden" && s.moderation_status === "hidden");
    return matchesSearch && matchesFilter;
  });

  const pendingCount = sections.filter(s => s.moderation_status === "pending").length;
  const approvedCount = sections.filter(s => s.moderation_status === "approved").length;
  const rejectedCount = sections.filter(s => s.moderation_status === "hidden").length;
  const flaggedCount = sections.filter(s => s.moderation_status === "flagged").length;

  return (
    <div className="space-y-4">
      {/* Filter pills + search */}
      <div className="space-y-4">
        <div className="flex flex-wrap gap-2">
          {[
            { value: "all", label: "All", count: sections.length },
            { value: "pending", label: "Pending", count: pendingCount },
            { value: "flagged", label: "Flagged", count: flaggedCount },
            { value: "approved", label: "Approved", count: approvedCount },
            { value: "hidden", label: "Rejected", count: rejectedCount },
          ].map((tab) => (
            <button
              key={tab.value}
              onClick={() => setFilterStatus(tab.value)}
              className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
                filterStatus === tab.value
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted text-muted-foreground hover:bg-muted/80"
              }`}
            >
              {tab.label}
              {tab.count > 0 && (
                <span className={`ml-1.5 px-1.5 py-0.5 text-xs rounded-full ${
                  filterStatus === tab.value
                    ? "bg-primary-foreground/20 text-primary-foreground"
                    : "bg-background text-foreground"
                }`}>
                  {tab.count}
                </span>
              )}
            </button>
          ))}
        </div>

        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by company..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>
      </div>

      <p className="text-sm text-muted-foreground">
        {filteredSections.length} section{filteredSections.length !== 1 ? "s" : ""} found
        {" · "}{pendingCount} pending
      </p>

      {isLoading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : filteredSections.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground">No review sections found</p>
          </CardContent>
        </Card>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="cursor-pointer select-none" onClick={() => handleSort("company")}>
                <span className="inline-flex items-center">Company <SortIcon column="company" sortColumn={sortColumn} sortDirection={sortDirection} /></span>
              </TableHead>
              {!sectionType && (
                <TableHead className="cursor-pointer select-none" onClick={() => handleSort("section_type")}>
                  <span className="inline-flex items-center">Type <SortIcon column="section_type" sortColumn={sortColumn} sortDirection={sortDirection} /></span>
                </TableHead>
              )}
              <TableHead className="cursor-pointer select-none" onClick={() => handleSort("moderation_status")}>
                <span className="inline-flex items-center">Status <SortIcon column="moderation_status" sortColumn={sortColumn} sortDirection={sortDirection} /></span>
              </TableHead>
              <TableHead className="cursor-pointer select-none" onClick={() => handleSort("created_at")}>
                <span className="inline-flex items-center">Date <SortIcon column="created_at" sortColumn={sortColumn} sortDirection={sortDirection} /></span>
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {[...filteredSections].sort((a, b) => {
              const dir = sortDirection === "asc" ? 1 : -1;
              switch (sortColumn) {
                case "company": return dir * (a.companies?.name || "").localeCompare(b.companies?.name || "");
                case "section_type": return dir * a.section_type.localeCompare(b.section_type);
                case "moderation_status": return dir * a.moderation_status.localeCompare(b.moderation_status);
                case "created_at": return dir * (new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
                default: return 0;
              }
            }).map((section) => (
              <TableRow
                key={section.id}
                className="cursor-pointer"
                onClick={() => { setSelectedSection(section); setIsDialogOpen(true); }}
              >
                <TableCell>
                  <p className="font-medium truncate max-w-[200px]">{section.companies?.name || "Unknown"}</p>
                </TableCell>
                {!sectionType && (
                  <TableCell>
                    <Badge variant="outline">{getSectionLabel(section.section_type)}</Badge>
                  </TableCell>
                )}
                <TableCell>
                  <div className="flex items-center gap-1.5">
                    {getStatusBadge(section.moderation_status)}
                    {(() => {
                      const mod = section.ai_moderation_summary as unknown as AIModerationSummary | null;
                      if (!mod || !mod.total_risk_score || mod.total_risk_score < 30) return null;
                      const isHigh = mod.total_risk_score >= 50;
                      return (
                        <Badge variant="outline" className={`text-[10px] ${isHigh ? "border-red-300 text-red-700" : "border-yellow-300 text-yellow-700"}`}>
                          {isHigh ? "⚠ HIGH" : "● MOD"}
                        </Badge>
                      );
                    })()}
                  </div>
                </TableCell>
                <TableCell className="text-sm text-muted-foreground">
                  {format(new Date(section.created_at), "MMM d, yyyy")}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}

      {/* Detail / Moderation Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={(open) => { setIsDialogOpen(open); if (!open) setIsRedactionMode(false); }}>
        <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
          {selectedSection && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <Badge variant="outline">{getSectionLabel(selectedSection.section_type)}</Badge>
                  {selectedSection.companies?.name || "Unknown Company"}
                </DialogTitle>
                <DialogDescription>
                  Submitted {format(new Date(selectedSection.created_at), "MMM d, yyyy 'at' h:mm a")}
                  {" · "}Status: {selectedSection.moderation_status}
                  {(() => {
                    const redactions = Array.isArray(selectedSection.redactions) ? selectedSection.redactions : [];
                    return redactions.length > 0 ? ` · ${redactions.length} redaction(s)` : "";
                  })()}
                </DialogDescription>
              </DialogHeader>

              {isRedactionMode ? (
                <RedactionEditor
                  sectionType={selectedSection.section_type}
                  sectionData={selectedSection.section_data}
                  existingRedactions={
                    (Array.isArray(selectedSection.redactions)
                      ? selectedSection.redactions
                      : []) as unknown as RedactionEntry[]
                  }
                  onSave={(redactions) => handleSaveRedactions(selectedSection.id, redactions)}
                  onCancel={() => setIsRedactionMode(false)}
                  isSaving={isRedactionSaving}
                />
              ) : (
                <>
                  <div className="border rounded-lg p-4">
                    <SectionDataRenderer
                      sectionType={selectedSection.section_type}
                      data={selectedSection.section_data}
                      benefitsMap={standardBenefitsMap}
                    />
                  </div>

                  <AISectionModerationPanel
                    sectionId={selectedSection.id}
                    existingSummary={selectedSection.ai_moderation_summary as unknown as AIModerationSummary | null}
                    onAnalysisComplete={(summary) => {
                      const updated = { ...selectedSection, ai_moderation_summary: summary as unknown as Json };
                      setSelectedSection(updated);
                      setSections(prev => prev.map(s => s.id === updated.id ? updated : s));
                    }}
                    onApplyRedactions={(suggestions) => {
                      // Pre-populate redaction editor with AI suggestions
                      const aiRedactions: RedactionEntry[] = suggestions.map(s => ({
                        field: s.field,
                        original_text: s.text_span,
                        reason: "personal_info",
                      }));
                      // Merge with existing redactions
                      const existing = (Array.isArray(selectedSection.redactions)
                        ? selectedSection.redactions : []) as unknown as RedactionEntry[];
                      const merged = [...existing, ...aiRedactions.filter(
                        ai => !existing.some(e => e.field === ai.field && e.original_text === ai.original_text)
                      )];
                      // Switch to redaction mode with pre-populated entries
                      setSelectedSection({ ...selectedSection, redactions: merged as unknown as Json });
                      setIsRedactionMode(true);
                    }}
                  />

                  <AIFraudPanel
                    reviewId={selectedSection.id}
                    existingSummary={selectedSection.ai_fraud_summary as any}
                    onAnalysisComplete={(summary) => {
                      const updated = { ...selectedSection, ai_fraud_summary: summary as unknown as Json };
                      setSelectedSection(updated);
                      setSections(prev => prev.map(s => s.id === updated.id ? updated : s));
                    }}
                  />

                  <DialogFooter className="flex flex-row gap-2 sm:justify-end flex-wrap">
                    <TraceButton
                      traceColor="black"
                      onClick={() => setIsRedactionMode(true)}
                      disabled={isProcessing}
                    >
                      <Scissors className="h-4 w-4 mr-1" />
                      Redact
                    </TraceButton>
                    {selectedSection.moderation_status !== "hidden" && (
                      <TraceButton
                        traceColor="red"
                        onClick={() => handleModerate(selectedSection.id, "reject")}
                        disabled={isProcessing}
                      >
                        {isProcessing ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : <XCircle className="h-4 w-4 mr-1" />}
                        Reject
                      </TraceButton>
                    )}
                    {selectedSection.moderation_status !== "flagged" && (
                      <TraceButton
                        traceColor="black"
                        onClick={() => handleModerate(selectedSection.id, "flag")}
                        disabled={isProcessing}
                      >
                        {isProcessing ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : <AlertTriangle className="h-4 w-4 mr-1" />}
                        Flag
                      </TraceButton>
                    )}
                    {selectedSection.moderation_status !== "approved" && (
                      <TraceButton
                        traceColor="green"
                        onClick={() => handleModerate(selectedSection.id, "approve")}
                        disabled={isProcessing}
                      >
                        {isProcessing ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : <CheckCircle className="h-4 w-4 mr-1" />}
                        Approve
                      </TraceButton>
                    )}
                  </DialogFooter>
                </>
              )}
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminSectionReviews;
