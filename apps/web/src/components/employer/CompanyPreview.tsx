"use client";

import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import StarRating from "@/components/StarRating";
import { createBrowserSupabaseClient } from "@/lib/supabase/client";
import { 
  CheckCircle2, 
  Gift, 
  Loader2
} from "lucide-react";
const supabase = createBrowserSupabaseClient();

interface CompanyData {
  id: string;
  name: string;
  description: string | null;
  industry: string | null;
  location: string | null;
  headquarters: string | null;
  employee_count: string | null;
  year_founded: number | string | null;
  ceo: string | null;
  mission: string | null;
  website: string | null;
  is_claimed?: boolean | null;
  logo_url: string | null;
}

interface ReviewData {
  id: string;
  rating: number;
  title: string;
  pros: string | null;
  cons: string | null;
  role_title: string | null;
  employment_status: string | null;
  created_at: string;
  recommend_to_friend: boolean | null;
  ceo_approval: boolean | null;
  moderation_status: string | null;
}

interface BenefitData {
  id: string;
  benefit_name: string;
}

interface CompensationData {
  role_level: string | null;
  salary_range: string | null;
  base_salary_amount: number | null;
  base_salary_currency: string | null;
  is_net_salary: boolean | null;
  allowances_amount: number | null;
  allowances_currency: string | null;
  bonus_amount: number | null;
  bonus_currency: string | null;
  secondary_salary_amount: number | null;
  secondary_salary_currency: string | null;
}

interface InterviewData {
  id: string;
  interview_experience_rating: number | null;
  interview_count: number | null;
  interview_difficulty: string | null;
  interview_description: string | null;
  interview_tips: string | null;
  created_at: string;
}

type TabType = "about" | "reviews" | "pay" | "interviews";

interface CompanyPreviewProps {
  company: CompanyData;
  logoPreview?: string | null;
  formValues?: Partial<CompanyData>;
}

const CompanyPreview = ({ company, logoPreview, formValues }: CompanyPreviewProps) => {
  const [activeTab, setActiveTab] = useState<TabType>("about");
  const [reviews, setReviews] = useState<ReviewData[]>([]);
  const [benefits, setBenefits] = useState<BenefitData[]>([]);
  const [interviewData, setInterviewData] = useState<InterviewData[]>([]);
  const [compensation, setCompensation] = useState<CompensationData[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Merge form values with company data
  const displayData = {
    ...company,
    ...formValues,
    logo_url: logoPreview || company.logo_url,
    is_claimed: true, // Always show as claimed in preview
  };

  useEffect(() => {
    async function fetchPreviewData() {
      setIsLoading(true);
      try {
        // Fetch reviews
        const { data: reviewsData } = await supabase
          .from("reviews_public")
          .select("*")
          .eq("company_id", company.id)
          .order("created_at", { ascending: false })
          .limit(3);

        setReviews((reviewsData || []) as unknown as ReviewData[]);

        // Extract compensation data from reviews
        const reviewsWithCompensation = (reviewsData || []).filter((r: any) => 
          r.salary_range || (r.base_salary_amount && r.base_salary_amount > 0)
        );
        setCompensation(reviewsWithCompensation.map((r: any) => ({
          role_level: r.role_level,
          salary_range: r.salary_range,
          base_salary_amount: r.base_salary_amount,
          base_salary_currency: r.base_salary_currency,
          is_net_salary: r.is_net_salary,
          allowances_amount: r.allowances_amount,
          allowances_currency: r.allowances_currency,
          bonus_amount: r.bonus_amount,
          bonus_currency: r.bonus_currency,
          secondary_salary_amount: null,
          secondary_salary_currency: null,
        })));

        // Extract interview data from reviews
        const reviewsWithInterviews = (reviewsData || []).filter((r: any) => 
          r.did_interview === true
        );
        setInterviewData(reviewsWithInterviews.map((r: any) => ({
          id: r.id,
          interview_experience_rating: r.interview_experience_rating,
          interview_count: r.interview_count,
          interview_difficulty: r.interview_difficulty,
          interview_description: r.interview_description,
          interview_tips: r.interview_tips,
          created_at: r.created_at,
        })));

        // Fetch benefits
        const { data: benefitsData } = await supabase
          .from("company_benefits")
          .select("id, benefit_name")
          .eq("company_id", company.id);

        setBenefits(benefitsData || []);
      } catch (error) {
        console.error("Error fetching preview data:", error);
      } finally {
        setIsLoading(false);
      }
    }

    fetchPreviewData();
  }, [company.id]);

  // Calculate aggregate stats
  const avgRating = reviews.length > 0
    ? reviews.reduce((sum, r) => sum + Number(r.rating), 0) / reviews.length
    : 0;

  const recommendPercent = reviews.length > 0
    ? Math.round((reviews.filter(r => r.recommend_to_friend).length / reviews.length) * 100)
    : 0;

  const ceoApprovalPercent = reviews.length > 0
    ? Math.round((reviews.filter(r => r.ceo_approval).length / reviews.length) * 100)
    : 0;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <ScrollArea className="h-[70vh]">
      <div className="space-y-4 p-1">
        {/* Preview Banner */}
        <div className="rounded-lg bg-primary/10 border border-primary/20 p-3 text-center">
          <p className="text-sm text-primary font-medium">
            This is how your company page appears to the public
          </p>
        </div>

        {/* Company Header */}
        <Card className="border border-black/5 shadow-sm">
          <CardContent className="p-6">
            <div className="flex items-start gap-4">
              <div className="relative flex h-16 w-16 shrink-0 items-center justify-center rounded-xl overflow-hidden">
                {displayData.logo_url ? (
                  <img src={displayData.logo_url} alt={displayData.name} className="h-16 w-16 object-contain p-1" />
                ) : (
                  <span className="text-2xl font-bold text-black/40">
                    {displayData.name?.charAt(0) || "C"}
                  </span>
                )}
              </div>
              <div className="flex-1">
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <h1 className="text-xl font-medium text-black">
                        {displayData.name || "Company Name"}
                      </h1>
                      {reviews.length > 0 && <StarRating rating={avgRating} size="sm" />}
                      <Badge className="text-xs bg-black/5 text-black border-0 hover:bg-black/10">
                        <CheckCircle2 className="h-3 w-3 mr-1" />
                        Verified
                      </Badge>
                    </div>
                    <p className="text-sm text-black/60">
                      {displayData.employee_count || "Unknown"} Employees
                    </p>
                  </div>
                </div>
                <p className="mt-3 text-sm text-black/70">
                  {displayData.description || "No description available."}
                </p>

                <div className="mt-4 flex items-center justify-between border-t border-border pt-4">
                  <div className="flex gap-3 sm:gap-4 flex-wrap items-center">
                    <button
                      onClick={() => setActiveTab("about")}
                      className={`text-sm font-medium pb-1 ${
                        activeTab === "about"
                          ? "border-b-2 border-primary text-black"
                          : "text-black/60 hover:text-black"
                      }`}
                    >
                      About
                    </button>
                    <button
                      onClick={() => setActiveTab("reviews")}
                      className={`text-sm font-medium pb-1 ${
                        activeTab === "reviews"
                          ? "border-b-2 border-primary text-black"
                          : "text-black/60 hover:text-black"
                      }`}
                    >
                      Reviews ({reviews.length})
                    </button>
                    <button
                      onClick={() => setActiveTab("pay")}
                      className={`text-sm font-medium pb-1 ${
                        activeTab === "pay"
                          ? "border-b-2 border-primary text-black"
                          : "text-black/60 hover:text-black"
                      }`}
                    >
                      Pay & Benefits {compensation.length > 0 && `(${compensation.length})`}
                    </button>
                    <button
                      onClick={() => setActiveTab("interviews")}
                      className={`text-sm font-medium pb-1 ${
                        activeTab === "interviews"
                          ? "border-b-2 border-primary text-black"
                          : "text-black/60 hover:text-black"
                      }`}
                    >
                      Interview Insights {interviewData.length > 0 && `(${interviewData.length})`}
                    </button>
                  </div>
                  <Button size="sm" disabled>
                    Add a Review
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* About Tab */}
        {activeTab === "about" && (
          <Card className="border border-black/5 shadow-sm animate-fade-in">
            <CardContent className="p-6">
              <h2 className="text-lg font-medium text-black">
                {displayData.name} Snapshot
              </h2>
              
              {reviews.length > 0 ? (
                <>
                  <div className="mt-4 flex items-baseline gap-2">
                    <span className="text-3xl font-bold text-black">
                      {avgRating.toFixed(1)}
                    </span>
                    <StarRating rating={avgRating} size="sm" />
                  </div>
                  <p className="mt-2 text-sm text-black/60">
                    {recommendPercent}% would recommend working here to a friend.
                  </p>
                </>
              ) : (
                <p className="mt-4 text-sm text-black/60">
                  No reviews yet. Be the first to share your experience!
                </p>
              )}

              <div className="mt-6 grid gap-4 md:grid-cols-2">
                <div className="space-y-3">
                  <p className="text-sm text-black">
                    <span className="font-medium">Number of Employees:</span>{" "}
                    <span className="text-black/60">{displayData.employee_count || "Unknown"}</span>
                  </p>
                  <p className="text-sm text-black">
                    <span className="font-medium">Headquarters:</span>{" "}
                    <span className="text-black/60">{displayData.headquarters || displayData.location || "Unknown"}</span>
                  </p>
                  <p className="text-sm text-black">
                    <span className="font-medium">Industry:</span>{" "}
                    <span className="text-black/60">{displayData.industry || "Unknown"}</span>
                  </p>
                  <p className="text-sm text-black">
                    <span className="font-medium">Year Founded:</span>{" "}
                    <span className="text-black/60">{displayData.year_founded || "Unknown"}</span>
                  </p>
                  {displayData.ceo && (
                    <p className="text-sm text-black">
                      <span className="font-medium">CEO:</span>{" "}
                      <span className="text-black/60">{displayData.ceo}</span>
                    </p>
                  )}
                  {displayData.website && (
                    <p className="text-sm text-black">
                      <span className="font-medium">Website:</span>{" "}
                      <span className="text-primary">{displayData.website.replace(/^https?:\/\//, '')}</span>
                    </p>
                  )}
                  {reviews.length > 0 && (
                    <p className="text-sm text-black">
                      <span className="font-medium">CEO Approval:</span>{" "}
                      <span className="text-black/60">{ceoApprovalPercent}% of employees approve</span>
                    </p>
                  )}
                </div>
                {displayData.mission && (
                  <div>
                    <p className="text-sm font-medium text-black">Mission:</p>
                    <p className="mt-1 text-sm text-black/60">
                      {displayData.mission}
                    </p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Reviews Tab */}
        {activeTab === "reviews" && (
          <div className="space-y-4 animate-fade-in">
            <Card className="border border-black/5 shadow-sm">
              <CardContent className="p-6">
                <h2 className="text-lg font-medium text-black">
                  {displayData.name} Overview
                </h2>
                {reviews.length > 0 ? (
                  <>
                    <div className="mt-4 flex items-baseline gap-2">
                      <span className="text-3xl font-bold text-black">
                        {avgRating.toFixed(1)}
                      </span>
                      <StarRating rating={avgRating} size="sm" />
                    </div>
                    <p className="mt-2 text-sm text-black/60">
                      {recommendPercent}% would recommend working here to a friend.
                    </p>
                  </>
                ) : (
                  <p className="mt-4 text-sm text-black/60">
                    No reviews yet.
                  </p>
                )}
              </CardContent>
            </Card>

            {reviews.length > 0 ? (
              reviews.map((review) => (
                <Card key={review.id} className="border border-black/5 shadow-sm">
                  <CardContent className="p-6">
                    <div className="flex items-center gap-3">
                      <span className="text-xl font-bold text-black">
                        {Number(review.rating).toFixed(1)}
                      </span>
                      <StarRating rating={Number(review.rating)} size="sm" />
                      <span className="text-sm text-black/60">
                        {new Date(review.created_at).toLocaleDateString()}
                      </span>
                    </div>
                    <p className="mt-3 text-sm italic text-black/60">
                      "{review.title}"
                    </p>
                    {review.role_title && (
                      <p className="mt-2 text-xs text-black/60">
                        {review.role_title} • {review.employment_status === "current" ? "Current Employee" : "Former Employee"}
                      </p>
                    )}
                    <div className="mt-4">
                      <h4 className="font-medium text-black">Pros</h4>
                      <p className="mt-1 text-sm text-black/60">"{review.pros}"</p>
                    </div>
                    <div className="mt-3">
                      <h4 className="font-medium text-black">Cons</h4>
                      <p className="mt-1 text-sm text-black/60">"{review.cons}"</p>
                    </div>
                  </CardContent>
                </Card>
              ))
            ) : (
              <Card className="border border-black/5 shadow-sm">
                <CardContent className="p-8 text-center">
                  <p className="text-black/60">No reviews yet.</p>
                </CardContent>
              </Card>
            )}
          </div>
        )}

        {/* Pay & Benefits Tab */}
        {activeTab === "pay" && (
          <div className="space-y-4 animate-fade-in">
            {/* Salary data from reviews */}
            {compensation.length > 0 && (
              <Card className="border border-black/5 shadow-sm">
                <CardContent className="p-6">
                  <h2 className="text-lg font-medium text-black">Salary Information</h2>
                  <div className="mt-4 space-y-3">
                    {compensation.map((comp, index) => {
                      const formatAmount = (amount: number, currency: string = "USD") => 
                        new Intl.NumberFormat("en-US", {
                          style: "currency",
                          currency,
                          minimumFractionDigits: 0,
                          maximumFractionDigits: 0,
                        }).format(amount);

                      const hasNumericSalary = comp.base_salary_amount && comp.base_salary_amount > 0;
                      const netGrossLabel = comp.is_net_salary ? "net" : "gross";

                      return (
                        <div key={`comp-${index}`} className="flex items-center justify-between p-3 rounded-lg border border-black/5 bg-black/[0.02]">
                          <div>
                            <p className="font-medium text-black">{comp.role_level || "Employee"}</p>
                            <p className="text-xs text-black/60">From verified review</p>
                          </div>
                          <div className="text-right">
                            {hasNumericSalary ? (
                              <>
                                <p className="font-medium text-black">
                                  {formatAmount(comp.base_salary_amount!, comp.base_salary_currency || "USD")}/month
                                </p>
                                <p className="text-xs text-black/60">
                                  {comp.base_salary_currency || "USD"} ({netGrossLabel})
                                </p>
                                {comp.secondary_salary_amount && comp.secondary_salary_amount > 0 && (
                                  <p className="text-xs text-black/50 mt-1">
                                    + {formatAmount(comp.secondary_salary_amount, comp.secondary_salary_currency || "ZWL")}/month ({comp.secondary_salary_currency || "ZWL"})
                                  </p>
                                )}
                              </>
                            ) : (
                              <p className="font-medium text-black">{comp.salary_range}</p>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            )}

            <Card className="border border-black/5 shadow-sm">
              <CardContent className="p-6">
                <h2 className="text-lg font-medium text-black flex items-center gap-2">
                  <Gift className="h-5 w-5" />
                  Benefits at {displayData.name}
                </h2>
                {benefits.length > 0 ? (
                  <div className="mt-4 flex flex-wrap gap-2">
                    {benefits.map((benefit) => (
                      <Badge key={benefit.id} variant="secondary" className="px-3 py-1">
                        {benefit.benefit_name}
                      </Badge>
                    ))}
                  </div>
                ) : (
                  <p className="mt-4 text-sm text-black/60">
                    No benefits information available yet.
                  </p>
                )}
              </CardContent>
            </Card>
          </div>
        )}

        {/* Interview Insights Tab */}
        {activeTab === "interviews" && (
          <div className="space-y-4 animate-fade-in">
            <Card className="border border-black/5 shadow-sm">
              <CardContent className="p-6">
                <h2 className="text-lg font-medium text-black">
                  Interview Insights at {displayData.name}
                </h2>
                {interviewData.length > 0 ? (
                  <div className="mt-4 space-y-4">
                    {/* Interview Overview */}
                    <div className="p-4 rounded-lg border border-black/5 bg-black/[0.02] space-y-2">
                      <p className="text-sm text-black/60">
                        Based on {interviewData.length} candidate{interviewData.length > 1 ? 's' : ''} who shared their interview experience
                      </p>
                      {interviewData.filter(i => i.interview_experience_rating).length > 0 && (
                        <p className="text-sm text-black">
                          <span className="font-medium">Average Rating:</span>{' '}
                          {(interviewData.filter(i => i.interview_experience_rating).reduce((sum, i) => sum + (i.interview_experience_rating || 0), 0) / interviewData.filter(i => i.interview_experience_rating).length).toFixed(1)}/5
                        </p>
                      )}
                      {interviewData.filter(i => i.interview_count).length > 0 && (
                        <p className="text-sm text-black">
                          <span className="font-medium">Average Interview Rounds:</span>{' '}
                          {Math.round(interviewData.filter(i => i.interview_count).reduce((sum, i) => sum + (i.interview_count || 0), 0) / interviewData.filter(i => i.interview_count).length)}
                        </p>
                      )}
                      {(() => {
                        const withDifficulty = interviewData.filter(i => i.interview_difficulty);
                        if (withDifficulty.length === 0) return null;
                        const difficultyCount = {
                          Easy: withDifficulty.filter(i => i.interview_difficulty === "Easy").length,
                          Average: withDifficulty.filter(i => i.interview_difficulty === "Average").length,
                          Difficult: withDifficulty.filter(i => i.interview_difficulty === "Difficult").length,
                        };
                        const dominant = Object.entries(difficultyCount).reduce((a, b) => a[1] >= b[1] ? a : b)[0];
                        return (
                          <p className="text-sm text-black">
                            <span className="font-medium">Interview Difficulty:</span> {dominant}
                          </p>
                        );
                      })()}
                    </div>
                    
                    {/* Individual experiences */}
                    {interviewData.slice(0, 2).map((interview) => (
                      <div key={interview.id} className="p-4 rounded-lg bg-secondary/30">
                        {interview.interview_description && (
                          <div>
                            <p className="text-xs font-medium text-black mb-1">Interview Experience:</p>
                            <p className="text-sm text-black/70 italic">"{interview.interview_description}"</p>
                          </div>
                        )}
                        {interview.interview_tips && (
                          <div className="mt-3">
                            <p className="text-xs font-medium text-black">Tips for candidates:</p>
                            <p className="text-sm text-black/70">{interview.interview_tips}</p>
                          </div>
                        )}
                        <p className="mt-2 text-xs text-black/50">
                          {new Date(interview.created_at).toLocaleDateString()}
                        </p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="mt-4 text-sm text-black/60">
                    No interview insights available yet.
                  </p>
                )}
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </ScrollArea>
  );
};

export default CompanyPreview;
