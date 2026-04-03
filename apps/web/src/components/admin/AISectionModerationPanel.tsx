"use client";

import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Loader2,
  RefreshCw,
  ShieldCheck,
  ShieldAlert,
  ShieldQuestion,
  Eye,
  Scissors,
  Brain,
} from "lucide-react";
import { createBrowserSupabaseClient } from "@/lib/supabase/client";
import { toast } from "sonner";
import { extractEdgeFunctionError } from "@/lib/edge-function-errors";
import { format } from "date-fns";
const supabase = createBrowserSupabaseClient();

interface RiskScores {
  identifiability: number;
  defamation: number;
  legal_sensitivity: number;
  toxicity: number;
  constructiveness: number;
}

interface RedactionSuggestion {
  field: string;
  text_span: string;
  reason: string;
}

export interface AIModerationSummary {
  risk_scores: RiskScores;
  total_risk_score: number;
  flag_types: string[];
  suggested_action: "APPROVE" | "REVIEW" | "PRIORITY_REVIEW" | "REJECT";
  redaction_suggestions: RedactionSuggestion[];
  explanation_summary: string;
  analyzed_at: string;
}

interface AISectionModerationPanelProps {
  sectionId: string;
  existingSummary: AIModerationSummary | null;
  onAnalysisComplete: (summary: AIModerationSummary) => void;
  onApplyRedactions?: (suggestions: RedactionSuggestion[]) => void;
}

const actionConfig: Record<string, { icon: typeof ShieldCheck; label: string; className: string; bannerClass: string }> = {
  APPROVE: {
    icon: ShieldCheck,
    label: "Low Risk",
    className: "bg-green-100 text-green-800",
    bannerClass: "border-green-200 bg-green-50/50",
  },
  REVIEW: {
    icon: ShieldQuestion,
    label: "Moderate Risk",
    className: "bg-yellow-100 text-yellow-800",
    bannerClass: "border-yellow-200 bg-yellow-50/50",
  },
  PRIORITY_REVIEW: {
    icon: Eye,
    label: "High Risk",
    className: "bg-orange-100 text-orange-800",
    bannerClass: "border-orange-200 bg-orange-50/50",
  },
  REJECT: {
    icon: ShieldAlert,
    label: "Very High Risk",
    className: "bg-red-100 text-red-800",
    bannerClass: "border-red-200 bg-red-50/50",
  },
};

const riskBarColor = (value: number, inverted = false) => {
  if (inverted) {
    if (value >= 13) return "bg-green-500";
    if (value >= 7) return "bg-yellow-500";
    return "bg-red-500";
  }
  if (value <= 7) return "bg-green-500";
  if (value <= 14) return "bg-yellow-500";
  return "bg-red-500";
};

const DIMENSION_LABELS: { key: keyof RiskScores; label: string; inverted?: boolean }[] = [
  { key: "identifiability", label: "Identifiability" },
  { key: "defamation", label: "Defamation" },
  { key: "legal_sensitivity", label: "Legal Sensitivity" },
  { key: "toxicity", label: "Toxicity" },
  { key: "constructiveness", label: "Constructiveness", inverted: true },
];

export function AISectionModerationPanel({
  sectionId,
  existingSummary,
  onAnalysisComplete,
  onApplyRedactions,
}: AISectionModerationPanelProps) {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const summary = existingSummary;

  const runAnalysis = async () => {
    setIsAnalyzing(true);
    try {
      const response = await supabase.functions.invoke("analyze-section", {
        body: { sectionId },
      });

      const errorMessage = await extractEdgeFunctionError(response);
      if (errorMessage) throw new Error(errorMessage);

      const analysis = response.data?.analysis;
      if (analysis) {
        onAnalysisComplete(analysis);
        toast.success("Content risk analysis complete");
      }
    } catch (error) {
      console.error("Analysis error:", error);
      toast.error(error instanceof Error ? error.message : "Failed to run analysis");
    } finally {
      setIsAnalyzing(false);
    }
  };

  if (isAnalyzing) {
    return (
      <Card className="border-blue-200 bg-blue-50/30">
        <CardContent className="p-4 space-y-3">
          <div className="flex items-center gap-2 text-sm font-medium">
            <Brain className="h-4 w-4 text-blue-600" />
            AI Content Risk Analysis
          </div>
          <div className="space-y-2">
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-4 w-1/2" />
            <Skeleton className="h-4 w-2/3" />
          </div>
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Loader2 className="h-3 w-3 animate-spin" />
            Analyzing content risk dimensions...
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!summary) {
    return (
      <Card className="border-dashed border-muted-foreground/30">
        <CardContent className="p-4 flex items-center justify-between">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Brain className="h-4 w-4" />
            AI content risk analysis not yet run
          </div>
          <Button variant="outline" size="sm" onClick={runAnalysis}>
            <Brain className="h-3.5 w-3.5 mr-1.5" />
            Analyze Risk
          </Button>
        </CardContent>
      </Card>
    );
  }

  const config = actionConfig[summary.suggested_action] || actionConfig.REVIEW;
  const ActionIcon = config.icon;

  return (
    <Card className={`border ${config.bannerClass}`}>
      <CardContent className="p-4 space-y-3">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-sm font-medium">
            <Brain className="h-4 w-4 text-blue-600" />
            AI Content Risk Analysis
          </div>
          <Button variant="ghost" size="sm" onClick={runAnalysis} className="h-7 text-xs">
            <RefreshCw className="h-3 w-3 mr-1" />
            Re-analyze
          </Button>
        </div>

        {/* Suggested action banner */}
        <div className={`flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium ${config.className}`}>
          <ActionIcon className="h-4 w-4 shrink-0" />
          Suggested: {summary.suggested_action.replace("_", " ")}
          <span className="ml-auto text-xs font-normal">
            Total Score: {summary.total_risk_score}
          </span>
        </div>

        {/* Risk score bars */}
        <div className="space-y-2">
          {DIMENSION_LABELS.map(({ key, label, inverted }) => {
            const value = summary.risk_scores[key];
            return (
              <div key={key} className="space-y-0.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-muted-foreground">{label}</span>
                  <span className="font-medium">{value}/20</span>
                </div>
                <div className="h-2 rounded-full bg-muted overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all ${riskBarColor(value, inverted)}`}
                    style={{ width: `${(value / 20) * 100}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>

        {/* Explanation */}
        <p className="text-sm text-foreground/80">{summary.explanation_summary}</p>

        {/* Flag types */}
        {summary.flag_types.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {summary.flag_types.map((flag, i) => (
              <Badge key={i} variant="outline" className="text-xs">
                {flag.replace(/_/g, " ")}
              </Badge>
            ))}
          </div>
        )}

        {/* Redaction suggestions */}
        {summary.redaction_suggestions.length > 0 && (
          <div className="border-t pt-3 space-y-2">
            <div className="flex items-center justify-between">
              <p className="text-xs font-medium text-muted-foreground">
                {summary.redaction_suggestions.length} Redaction Suggestion{summary.redaction_suggestions.length > 1 ? "s" : ""}
              </p>
              {onApplyRedactions && (
                <Button
                  variant="outline"
                  size="sm"
                  className="h-7 text-xs"
                  onClick={() => onApplyRedactions(summary.redaction_suggestions)}
                >
                  <Scissors className="h-3 w-3 mr-1" />
                  Apply to Redaction Editor
                </Button>
              )}
            </div>
            {summary.redaction_suggestions.map((s, i) => (
              <div key={i} className="text-xs border rounded px-2 py-1.5 bg-muted/50 flex items-center gap-2">
                <Badge variant="outline" className="text-[10px] shrink-0">{s.field}</Badge>
                <span className="truncate font-mono">"{s.text_span}"</span>
                <Badge variant="secondary" className="text-[10px] shrink-0 ml-auto">
                  {s.reason.replace(/_/g, " ")}
                </Badge>
              </div>
            ))}
          </div>
        )}

        {/* Timestamp */}
        <p className="text-xs text-muted-foreground">
          Analyzed {format(new Date(summary.analyzed_at), "MMM d, yyyy 'at' h:mm a")}
        </p>
      </CardContent>
    </Card>
  );
}
