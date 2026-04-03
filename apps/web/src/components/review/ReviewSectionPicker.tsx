"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import { useRouter } from 'next/navigation';
import { useIsMobile } from "@/hooks/use-mobile";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { TraceCard } from "@/components/ui/trace-card";
import { Card, CardContent } from "@/components/ui/card";
import { Loader2, DollarSign, Users, MessageSquare, ClipboardList } from "lucide-react";
import { createBrowserSupabaseClient } from "@/lib/supabase/client";
import { extractEdgeFunctionError } from "@/lib/edge-function-errors";
import { trackSessionEvent } from "@/lib/trackSessionEvent";
import { toast } from "@/hooks/use-toast";
const supabase = createBrowserSupabaseClient();

interface ReviewSectionPickerProps {
  isOpen: boolean;
  onClose: () => void;
  companyId: string;
  companyName: string;
}

const SECTIONS = [
  {
    type: "full" as const,
    title: "Leave a Full Review",
    description: "Cover everything — compensation, culture, and interview — in one go.",
    icon: ClipboardList,
    active: true,
  },
  {
    type: "compensation" as const,
    title: "Compensation & Benefits",
    description: "Help others understand their market value by sharing your compensation information.",
    icon: DollarSign,
  },
  {
    type: "culture" as const,
    title: "Workplace Culture",
    description: "Share your workplace experience - the Pros, the Cons, and what others should know.",
    icon: Users,
  },
  {
    type: "interview" as const,
    title: "Interview Insights",
    description: "Help others prepare for their interview. Share your experience, insights, and tips.",
    icon: MessageSquare,
  },
];

export function ReviewSectionPicker({ isOpen, onClose, companyId, companyName }: ReviewSectionPickerProps) {
  const router = useRouter();
  const isMobile = useIsMobile();
  const [creatingSession, setCreatingSession] = useState<string | null>(null);
  const [hoveredSection, setHoveredSection] = useState<string | null>(null);

  const handleSectionClick = async (sectionType: string) => {
    setCreatingSession(sectionType);
    try {

      const response = await supabase.functions.invoke("create-review-session", {
        body: {
          company_id: companyId,
          honeypot_field: "",
        },
      });

      const errorMsg = await extractEdgeFunctionError(response);
      if (errorMsg) {
        toast({ title: "Error", description: errorMsg, variant: "destructive" });
        return;
      }

      const { data } = response;

      if (!data?.session_id || !data?.session_token) {
        toast({ title: "Error", description: "Failed to create review session", variant: "destructive" });
        return;
      }

      // Store session in sessionStorage for the review page
      sessionStorage.setItem("review_session", JSON.stringify({
        session_id: data.session_id,
        session_token: data.session_token,
        company_id: companyId,
        company_name: companyName,
      }));

      // Track section selection
      trackSessionEvent(data.session_id, "section_selected", {
        section_type: sectionType,
        company_name: companyName,
      });

      onClose();
      router.push(`/review/submit?section=${sectionType}`);
    } catch (err) {
      console.error("Error creating session:", err);
      toast({ title: "Error", description: "Something went wrong. Please try again.", variant: "destructive" });
    } finally {
      setCreatingSession(null);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-xl">
        <DialogHeader>
          <DialogTitle className="text-xl">Review {companyName}</DialogTitle>
          <DialogDescription>
            Every insight helps create a more transparent work environment. What would you like to share? Start with one section, or leave a full review.
          </DialogDescription>
        </DialogHeader>

        <div
          className="grid grid-cols-1 gap-3 mt-2"
          onMouseLeave={() => !isMobile && setHoveredSection(null)}
        >
          {SECTIONS.map((section) => {
            const Icon = section.icon;
            const isLoading = creatingSession === section.type;
            const isDisabled = creatingSession !== null;
            const isDefaultActive = "active" in section && section.active;
            // On mobile, always show active border for the default card (no hover logic)
            const showActiveBorder = isDefaultActive && (isMobile || !hoveredSection);

            return (
              <div
                key={section.type}
                onMouseEnter={() => !isMobile && setHoveredSection(section.type)}
              >
                {showActiveBorder ? (
                  // Active state: solid border, no trace effect
                  <Card
                    className={cn(
                      "cursor-pointer transition-all border-foreground h-full",
                      isDisabled && !isLoading ? "opacity-50 pointer-events-none" : ""
                    )}
                    onClick={() => !isDisabled && handleSectionClick(section.type)}
                  >
                    <CardContent className="p-3 flex items-center gap-3">
                      <div className="w-9 h-9 rounded-lg border border-black/10 flex items-center justify-center flex-shrink-0">
                        {isLoading ? (
                          <Loader2 className="w-4 h-4 animate-spin text-black" />
                        ) : (
                          <Icon className="w-4 h-4 text-black" />
                        )}
                      </div>
                      <div className="min-w-0">
                        <p className="font-semibold text-foreground text-sm">{section.title}</p>
                        <p className="text-xs text-muted-foreground line-clamp-2">{section.description}</p>
                      </div>
                    </CardContent>
                  </Card>
                ) : (
                  <TraceCard
                    className={cn(
                      "cursor-pointer transition-all h-full",
                      isDisabled && !isLoading ? "opacity-50 pointer-events-none" : ""
                    )}
                    onClick={() => !isDisabled && handleSectionClick(section.type)}
                  >
                    <CardContent className="p-3 flex items-center gap-3">
                      <div className="w-9 h-9 rounded-lg border border-black/10 flex items-center justify-center flex-shrink-0">
                        {isLoading ? (
                          <Loader2 className="w-4 h-4 animate-spin text-black" />
                        ) : (
                          <Icon className="w-4 h-4 text-black" />
                        )}
                      </div>
                      <div className="min-w-0">
                        <p className="font-semibold text-foreground text-sm">{section.title}</p>
                        <p className="text-xs text-muted-foreground line-clamp-2">{section.description}</p>
                      </div>
                    </CardContent>
                  </TraceCard>
                )}
              </div>
            );
          })}
        </div>

        <p className="text-xs text-muted-foreground text-center mt-2">
          Your review is anonymous. We never store your personal information.
        </p>
      </DialogContent>
    </Dialog>
  );
}
