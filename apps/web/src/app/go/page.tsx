"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { ReviewSubmissionForm } from "@/components/ReviewSubmissionForm";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { createBrowserSupabaseClient } from "@/lib/supabase/client";
import { toast } from "sonner";
import { Loader2, CheckCircle, XCircle, Bug } from "lucide-react";

type VerificationState = "loading" | "verified" | "error" | "success";

interface CompanyInfo {
  id: string;
  name: string;
  slug: string;
}

interface FormDebugInfo {
  configId: string | null;
  configUpdatedAt: string | null;
  sectionsCount: number;
  fieldsCount: number;
  salaryRangeDesc: string | null;
  adviceFieldPresent: boolean;
}

function LoadingSpinner() {
  return (
    <div className="flex flex-col items-center justify-center py-20">
      <Loader2 className="h-12 w-12 animate-spin text-primary" />
      <p className="mt-4 text-muted-foreground">Loading...</p>
    </div>
  );
}

function GoPageInner() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [state, setState] = useState<VerificationState>("loading");
  const [error, setError] = useState<string>("");
  const [company, setCompany] = useState<CompanyInfo | null>(null);
  const [sessionId, setSessionId] = useState<string>("");
  const [reviewToken, setReviewToken] = useState<string>("");
  const [debugInfo, setDebugInfo] = useState<FormDebugInfo | null>(null);
  const [submittedReviewId, setSubmittedReviewId] = useState<string | null>(null);

  const supabase = createBrowserSupabaseClient();

  const showDebug = searchParams.get("debug") === "1";

  const companyId = searchParams.get("c");
  const sessionParam = searchParams.get("session");
  const reviewTokenParam = searchParams.get("reviewToken");

  useEffect(() => {
    const unverified = searchParams.get("unverified") === "true";
    if (unverified && sessionParam && reviewTokenParam && companyId) {
      (async () => {
        const { data: companyData } = await supabase
          .from("companies")
          .select("id, name, slug")
          .eq("id", companyId)
          .single();

        if (companyData) {
          setCompany(companyData);
          setSessionId(sessionParam);
          setReviewToken(reviewTokenParam);
          setState("verified");
          toast.success("Ready to review", { description: "You can now submit your anonymous review." });
        } else {
          setState("error");
          setError("Company not found.");
        }
      })();
      return;
    }

    // No valid session params — show error
    setState("error");
    setError("Invalid verification link. Please start from the company page.");
  }, [companyId, sessionParam, reviewTokenParam]);

  // Fetch debug info
  useEffect(() => {
    async function fetchDebugInfo() {
      if (!showDebug || state !== "verified") return;
      try {
        const { data: configData } = await supabase
          .from("form_configurations")
          .select("id, updated_at")
          .eq("form_type", "review_form")
          .eq("is_active", true)
          .single();
        const configId = configData?.id;
        const [sectionsRes, fieldsRes] = await Promise.all([
          configId ? supabase.from("form_sections").select("id").eq("form_config_id", configId).eq("is_visible", true) : Promise.resolve({ data: [] }),
          configId ? supabase.from("form_fields").select("id, field_key, description").eq("form_config_id", configId).eq("is_visible", true) : Promise.resolve({ data: [] }),
        ]);
        const salaryField = (fieldsRes.data as any[])?.find((f: any) => f.field_key === "salary_range");
        const adviceField = (fieldsRes.data as any[])?.find((f: any) => f.field_key === "advice");
        setDebugInfo({
          configId: configId || null,
          configUpdatedAt: configData?.updated_at || null,
          sectionsCount: sectionsRes.data?.length || 0,
          fieldsCount: fieldsRes.data?.length || 0,
          salaryRangeDesc: salaryField?.description?.substring(0, 60) || null,
          adviceFieldPresent: !!adviceField,
        });
      } catch (err) {
        console.error("Debug info fetch error:", err);
      }
    }
    fetchDebugInfo();
  }, [showDebug, state]);

  const handleReviewSuccess = (reviewId?: string) => {
    console.log("handleReviewSuccess called with reviewId:", reviewId);
    if (reviewId) setSubmittedReviewId(reviewId);
    setState("success");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <div className="min-h-screen bg-white">
      <Header />

      <main className="container py-12">
        {state === "loading" && (
          <LoadingSpinner />
        )}

        {state === "error" && (
          <Card className="max-w-md mx-auto">
            <CardContent className="p-8 text-center">
              <div className="mx-auto w-16 h-16 rounded-full bg-destructive/10 flex items-center justify-center mb-4">
                <XCircle className="h-8 w-8 text-destructive" />
              </div>
              <h1 className="text-xl font-semibold text-foreground">Something Went Wrong</h1>
              <p className="mt-2 text-muted-foreground">{error}</p>
              <div className="mt-6 space-y-3">
                <Button asChild className="w-full">
                  <Link href="/companies">Browse Companies</Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {state === "verified" && company && (
          <div className="space-y-6">
            {showDebug && debugInfo && (
              <Card className="border-dashed border-amber-500/50 bg-amber-50/50">
                <CardContent className="p-4">
                  <div className="flex items-center gap-2 text-amber-700 mb-3">
                    <Bug className="h-4 w-4" />
                    <span className="text-sm font-medium">Debug Info</span>
                  </div>
                  <div className="text-xs space-y-1 text-amber-800 font-mono">
                    <p><strong>Origin:</strong> {window.location.origin}</p>
                    <p><strong>Config ID:</strong> {debugInfo.configId || "(not loaded)"}</p>
                    <p><strong>Config Updated:</strong> {debugInfo.configUpdatedAt || "(unknown)"}</p>
                    <p><strong>Sections:</strong> {debugInfo.sectionsCount}</p>
                    <p><strong>Fields:</strong> {debugInfo.fieldsCount}</p>
                    <p><strong>Salary Range Desc:</strong> {debugInfo.salaryRangeDesc || "(none)"}</p>
                    <p><strong>Advice Field:</strong> {debugInfo.adviceFieldPresent ? "Yes" : "No"}</p>
                  </div>
                </CardContent>
              </Card>
            )}

            <ReviewSubmissionForm
              companyId={company.id}
              companyName={company.name}
              sessionId={sessionId}
              reviewToken={reviewToken}
              onSuccess={handleReviewSuccess}
            />
          </div>
        )}

        {state === "success" && company && (
          <div className="max-w-md mx-auto space-y-4">
            <Card>
              <CardContent className="p-8 text-center">
                <div className="mx-auto w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mb-4">
                  <CheckCircle className="h-8 w-8 text-green-600" />
                </div>
                <h1 className="text-xl font-semibold text-foreground">Review Submitted!</h1>
                <p className="mt-2 text-muted-foreground">
                  Thank you for sharing your anonymous feedback about {company.name}.
                </p>
                <div className="mt-4 p-4 bg-muted/30 border border-border rounded-lg text-sm text-foreground">
                  <p className="font-medium mb-1">Pending Review</p>
                  <p className="text-muted-foreground">
                    Your review is being moderated and will be published within 48 hours. It won&apos;t appear on the company page until approved.
                  </p>
                </div>
                <div className="mt-3 p-3 bg-muted/20 border border-border/50 rounded-lg text-xs text-muted-foreground">
                  <p>
                    If your review doesn&apos;t appear after 48 hours, it may have been flagged for violating our{" "}
                    <Link href="/guidelines" className="text-primary hover:underline">community guidelines</Link>.
                  </p>
                </div>
                <div className="mt-6 space-y-3">
                  <Button asChild className="w-full">
                    <Link href={`/company/${company.slug}`}>View Company Page</Link>
                  </Button>
                  <Button asChild variant="outline" className="w-full">
                    <Link href="/companies">Browse Other Companies</Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}

export default function GoPage() {
  return (
    <Suspense fallback={<LoadingSpinner />}>
      <GoPageInner />
    </Suspense>
  );
}
