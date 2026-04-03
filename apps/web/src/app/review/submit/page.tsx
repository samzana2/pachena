"use client";

import { useState, useEffect, useCallback, useRef, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { SectionWizard } from "@/components/review/SectionWizard";
import { ReviewSuccessPrompt } from "@/components/review/ReviewSuccessPrompt";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { createBrowserSupabaseClient } from "@/lib/supabase/client";

interface ReviewSession {
  session_id: string;
  session_token: string;
  company_id: string;
  company_name: string;
}

const sectionMeta: Record<string, { label: string; description: string }> = {
  compensation: {
    label: "Compensation & Benefits",
    description: "Help others understand their market value by sharing your compensation information.",
  },
  culture: {
    label: "Workplace Culture",
    description: "Share your workplace experience — the Pros, the Cons, and what others should know.",
  },
  interview: {
    label: "Interview Insights",
    description: "Help others prepare for their interview. Share your experience, insights, and tips.",
  },
};

const ALL_SECTIONS = ["compensation", "culture", "interview"];
const FULL_REVIEW_SECTIONS = ["compensation", "culture", "interview"];

type PageState = "attestation" | "wizard" | "prompt";

/** Typeform-style option card with directional trace border */
function AttestationOption({ label, onClick }: { label: string; onClick: () => void }) {
  const [isHovered, setIsHovered] = useState(false);
  const [entryDir, setEntryDir] = useState<"top" | "right" | "bottom" | "left" | null>(null);
  const ref = useRef<HTMLButtonElement>(null);

  const clipPath = (dir: typeof entryDir, show: boolean) => {
    if (!show) {
      switch (dir) {
        case "top": return "inset(0 0 100% 0)";
        case "right": return "inset(0 0 0 100%)";
        case "bottom": return "inset(100% 0 0 0)";
        case "left": return "inset(0 100% 0 0)";
        default: return "inset(0 100% 100% 0)";
      }
    }
    return "inset(0 0 0 0)";
  };

  return (
    <button
      ref={ref}
      type="button"
      onClick={onClick}
      onMouseEnter={(e) => {
        const el = ref.current;
        if (!el) return;
        const rect = el.getBoundingClientRect();
        const x = e.clientX - rect.left, y = e.clientY - rect.top;
        const dT = y, dB = rect.height - y, dL = x, dR = rect.width - x;
        const min = Math.min(dT, dB, dL, dR);
        setEntryDir(min === dT ? "top" : min === dR ? "right" : min === dB ? "bottom" : "left");
        setIsHovered(true);
      }}
      onMouseLeave={() => setIsHovered(false)}
      className={cn(
        "relative w-full flex items-center gap-3 px-4 py-3 rounded-lg border text-left transition-colors duration-200 overflow-hidden",
        isHovered ? "border-transparent bg-background text-foreground" : "border-border bg-background text-foreground"
      )}
    >
      <div
        className="absolute inset-0 pointer-events-none border border-foreground rounded-lg z-10"
        style={{ clipPath: clipPath(entryDir, isHovered), transition: "clip-path 0.2s ease-out" }}
      />
      <span className="text-sm font-medium">{label}</span>
    </button>
  );
}

function SectionReviewPageContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const rawSection = searchParams.get("section") || "compensation";
  const isFullReview = rawSection === "full";

  // For full review, track which section index we're on
  const [fullReviewIndex, setFullReviewIndex] = useState(0);

  // Current section being worked on
  const [activeSectionType, setActiveSectionType] = useState<string>(
    isFullReview ? FULL_REVIEW_SECTIONS[0] : rawSection
  );

  const sectionType = isFullReview
    ? FULL_REVIEW_SECTIONS[fullReviewIndex]
    : activeSectionType;

  const [session, setSession] = useState<ReviewSession | null>(null);
  const [pageState, setPageState] = useState<PageState>(isFullReview ? "attestation" : "wizard");
  const [attestationChecked, setAttestationChecked] = useState(false);
  const [companySlug, setCompanySlug] = useState<string | undefined>();

  // Track completed sections (persisted in sessionStorage)
  const [completedSections, setCompletedSections] = useState<string[]>(() => {
    try {
      const stored = sessionStorage.getItem("review_completed_sections");
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });

  // Persist completed sections
  useEffect(() => {
    sessionStorage.setItem("review_completed_sections", JSON.stringify(completedSections));
  }, [completedSections]);

  useEffect(() => {
    if (pageState === "prompt") return;
    const stored = sessionStorage.getItem("review_session");
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        setSession(parsed);
      } catch {
        router.push("/review");
      }
    } else {
      router.push("/review");
    }
  }, [router, pageState]);

  // Fetch company slug for navigation
  useEffect(() => {
    if (!session) return;
    const supabase = createBrowserSupabaseClient();
    supabase.from("companies").select("slug").eq("id", session.company_id).single()
      .then(({ data }) => { if (data) setCompanySlug(data.slug); });
  }, [session]);

  // Compute remaining sections
  const remainingSections = ALL_SECTIONS.filter(
    (s) => !completedSections.includes(s)
  );

  const handleSuccess = useCallback(() => {
    // Mark current section as completed
    const justCompleted = sectionType;
    setCompletedSections((prev) => {
      if (prev.includes(justCompleted)) return prev;
      return [...prev, justCompleted];
    });

    if (isFullReview && fullReviewIndex < FULL_REVIEW_SECTIONS.length - 1) {
      // Move to next section in full review sequence
      setFullReviewIndex((prev) => prev + 1);
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }

    // Show the "share more" prompt
    setPageState("prompt");
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [isFullReview, fullReviewIndex, sectionType]);

  const handleAddSection = useCallback((newSection: string) => {
    setActiveSectionType(newSection);
    setPageState("wizard");
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, []);

  const handleReturnToCompany = useCallback(() => {
    sessionStorage.removeItem("review_session");
    sessionStorage.removeItem("review_completed_sections");
    router.push(companySlug ? `/company/${companySlug}` : "/companies");
  }, [router, companySlug]);

  const meta = sectionMeta[sectionType] || sectionMeta.compensation;

  if (!session) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const sidebarContent = () => (
    <div className="space-y-2">
      <div>
        <h2 className="text-base font-bold text-foreground">{session.company_name}</h2>
        <p className="text-sm text-foreground mt-0.5">{meta.label}</p>
        {isFullReview && (
          <p className="text-xs text-muted-foreground mt-1">
            Section {fullReviewIndex + 1} of {FULL_REVIEW_SECTIONS.length}
          </p>
        )}
      </div>
      <p className="text-sm text-foreground leading-relaxed">
        {meta.description}
      </p>
    </div>
  );

  return (
    <div className="h-[100dvh] bg-background flex flex-col overflow-hidden">
      {/* Header + Form */}
      <div className="flex-1 flex flex-col min-w-0 min-h-0">
        {/* Minimal logo-only header */}
        <header className="w-full bg-background">
          <div className="container flex h-16 items-center">
            <Link href="/" className="flex items-center gap-2">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-brand">
                <span className="font-logo text-xl font-bold text-brand-foreground">P</span>
              </div>
            </Link>
          </div>
        </header>

        <main className="flex-1 flex flex-col min-h-0 overflow-auto">
          {pageState === "attestation" && (
            <div className="flex-1 flex flex-col max-w-xl mx-auto w-full px-6">
            <div className="flex-1 flex flex-col justify-center">
                <div className="animate-in fade-in slide-in-from-bottom-4 duration-300 space-y-6">
                  <div>
                    <h2 className="text-2xl font-bold text-foreground">Your experience matters</h2>
                    <p className="text-sm text-foreground mt-2 leading-relaxed">
                      Your honest insights help bring more data and transparency to the labour market. Before we begin, please confirm that you are sharing this review based on your own genuine experience.
                    </p>
                    <p className="text-sm text-foreground mt-4 leading-relaxed">
                      On behalf of the Pachena community, thank you.
                    </p>
                  </div>
                  <div className="space-y-3">
                    <AttestationOption
                      label="Yes, let's begin."
                      onClick={() => {
                        setAttestationChecked(true);
                        setTimeout(() => setPageState("wizard"), 400);
                      }}
                    />
                    <AttestationOption
                      label="No, go back."
                      onClick={() => {
                        router.push(companySlug ? `/company/${companySlug}` : "/companies");
                      }}
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {pageState === "prompt" && (
            <div className="container py-8">
              <ReviewSuccessPrompt
                companyName={session.company_name}
                companySlug={companySlug}
                submittedSections={completedSections}
                remainingSections={remainingSections}
                onAddSection={handleAddSection}
              />
            </div>
          )}

          {pageState === "wizard" && (
            <SectionWizard
              key={`${sectionType}-${completedSections.length}`}
              sectionType={sectionType}
              companyId={session.company_id}
              companyName={session.company_name}
              sessionId={session.session_id}
              sessionToken={session.session_token}
              onSuccess={handleSuccess}
              headerSlot={sidebarContent()}
              isFullReview={isFullReview}
            />
          )}
        </main>
      </div>
    </div>
  );
}

export default function SectionReviewPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    }>
      <SectionReviewPageContent />
    </Suspense>
  );
}
