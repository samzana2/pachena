"use client";

import { useState, useEffect } from "react";
import { createBrowserSupabaseClient } from "@/lib/supabase/client";
import { Badge } from "@/components/ui/badge";
import { Loader2, History, Clock } from "lucide-react";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { ChevronDown } from "lucide-react";
import { CLAIM_DENIAL_REASONS, CLAIM_FLAG_REASONS, CLAIM_UNFLAG_REASONS } from "./ClaimJustificationDialog";
const supabase = createBrowserSupabaseClient();

interface ClaimHistoryEntry {
  id: string;
  timestamp: string;
  action: string;
  admin_user_id: string;
  metadata: unknown;
}

interface ParsedMetadata {
  claim_request_id?: string;
  reason?: string;
  notes?: string;
  previous_status?: string;
  company_name?: string;
  [key: string]: unknown;
}

interface ClaimHistorySectionProps {
  claimId: string;
}

const actionLabels: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
  claim_flag: { label: "Flagged", variant: "secondary" },
  claim_unflag: { label: "Unflagged", variant: "outline" },
  claim_approved: { label: "Approved", variant: "default" },
  claim_denied: { label: "Denied", variant: "destructive" },
  view_claim_details: { label: "Viewed", variant: "outline" },
};

export function ClaimHistorySection({ claimId }: ClaimHistorySectionProps) {
  const [history, setHistory] = useState<ClaimHistoryEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    fetchHistory();
  }, [claimId]);

  const fetchHistory = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from("admin_audit_logs")
        .select("*")
        .eq("claim_request_id", claimId)
        .order("timestamp", { ascending: false });

      if (error) throw error;

      // Filter out view_claim_details actions for cleaner history
      const filteredData = (data || []).filter(
        (entry) => entry.action !== "view_claim_details" && entry.action !== "list_claims"
      );

      setHistory(filteredData);
      if (filteredData.length > 0) {
        setIsOpen(true);
      }
    } catch (error) {
      console.error("Error fetching claim history:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    return {
      date: date.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      }),
      time: date.toLocaleTimeString("en-US", {
        hour: "numeric",
        minute: "2-digit",
        hour12: true,
      }),
    };
  };

  const formatAdminId = (adminId: string) => {
    return `${adminId.substring(0, 8)}...`;
  };

  const getReasonLabel = (action: string, reasonValue: string | undefined): string | null => {
    if (!reasonValue) return null;
    
    let reasons;
    switch (action) {
      case "claim_flag":
        reasons = CLAIM_FLAG_REASONS;
        break;
      case "claim_unflag":
        reasons = CLAIM_UNFLAG_REASONS;
        break;
      case "claim_denied":
        reasons = CLAIM_DENIAL_REASONS;
        break;
      default:
        return reasonValue;
    }
    
    const found = reasons.find(r => r.value === reasonValue);
    return found?.label || reasonValue;
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-4">
        <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen} className="border-t pt-4">
      <CollapsibleTrigger className="flex items-center justify-between w-full py-2 text-sm font-medium hover:text-primary transition-colors">
        <div className="flex items-center gap-2">
          <History className="h-4 w-4" />
          Moderation History
          {history.length > 0 && (
            <Badge variant="secondary" className="text-xs">
              {history.length}
            </Badge>
          )}
        </div>
        <ChevronDown
          className={`h-4 w-4 transition-transform ${isOpen ? "rotate-180" : ""}`}
        />
      </CollapsibleTrigger>
      <CollapsibleContent>
        <div className="pt-2 space-y-3">
          {history.length === 0 ? (
            <p className="text-sm text-muted-foreground py-2">
              No moderation actions have been taken on this claim yet.
            </p>
          ) : (
            <div className="space-y-3">
              {history.map((entry) => {
                const { date, time } = formatTimestamp(entry.timestamp);
                const actionInfo = actionLabels[entry.action] || {
                  label: entry.action.replace("claim_", "").replace(/_/g, " "),
                  variant: "outline" as const,
                };
                const metadata = entry.metadata as ParsedMetadata | null;
                const reasonLabel = getReasonLabel(entry.action, metadata?.reason);
                const notes = metadata?.notes;

                return (
                  <div
                    key={entry.id}
                    className="p-3 bg-muted/30 rounded-lg border border-border/50 space-y-2"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <Badge variant={actionInfo.variant}>{actionInfo.label}</Badge>
                        <span className="text-xs text-muted-foreground">
                          by {formatAdminId(entry.admin_user_id)}
                        </span>
                      </div>
                      <div className="flex items-center gap-1 text-xs text-muted-foreground">
                        <Clock className="h-3 w-3" />
                        <span>{date}</span>
                        <span>at</span>
                        <span>{time}</span>
                      </div>
                    </div>
                    
                    {reasonLabel && (
                      <div className="text-sm">
                        <span className="text-muted-foreground">Reason: </span>
                        <span className="font-medium">{reasonLabel}</span>
                      </div>
                    )}
                    
                    {notes && (
                      <p className="text-sm text-foreground/80 italic border-l-2 border-primary/30 pl-3">
                        "{notes}"
                      </p>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
}
