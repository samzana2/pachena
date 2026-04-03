"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Loader2, RefreshCw, ShieldAlert, ShieldCheck, ShieldQuestion, Fingerprint } from "lucide-react";
import { createBrowserSupabaseClient } from "@/lib/supabase/client";
import { toast } from "sonner";
import { extractEdgeFunctionError } from "@/lib/edge-function-errors";
import { Skeleton } from "@/components/ui/skeleton";
import { format } from "date-fns";
const supabase = createBrowserSupabaseClient();

interface AIFraudSummary {
  verdict: "clean" | "suspicious" | "likely_fraud";
  confidence: "high" | "medium" | "low";
  summary: string;
  evidence: string[];
  analyzed_at: string;
  comparison_count?: number;
}

interface AIFraudPanelProps {
  reviewId: string;
  existingSummary: AIFraudSummary | null;
  onAnalysisComplete: (summary: AIFraudSummary) => void;
}

const verdictConfig = {
  clean: {
    icon: ShieldCheck,
    label: "Clean",
    message: "No fraud signals detected — review appears genuine",
    bannerClass: "bg-green-100 text-green-800",
    borderClass: "border-green-200 bg-green-50/50",
  },
  suspicious: {
    icon: ShieldQuestion,
    label: "Suspicious",
    message: "Potential fraud signals found — recommend closer inspection",
    bannerClass: "bg-yellow-100 text-yellow-800",
    borderClass: "border-yellow-200 bg-yellow-50/50",
  },
  likely_fraud: {
    icon: ShieldAlert,
    label: "Likely Fraud",
    message: "Strong fraud indicators detected — recommend rejecting",
    bannerClass: "bg-red-100 text-red-800",
    borderClass: "border-red-200 bg-red-50/50",
  },
};

const confidenceConfig = {
  high: { className: "bg-green-100 text-green-700", label: "Confidence: high" },
  medium: { className: "bg-yellow-100 text-yellow-700", label: "Confidence: medium" },
  low: { className: "bg-red-100 text-red-700", label: "Confidence: low" },
};

export function AIFraudPanel({ reviewId, existingSummary, onAnalysisComplete }: AIFraudPanelProps) {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const summary = existingSummary;

  const runAnalysis = async () => {
    setIsAnalyzing(true);
    try {
      const response = await supabase.functions.invoke('detect-fraud-ai', {
        body: { reviewId },
      });

      const errorMessage = await extractEdgeFunctionError(response);
      if (errorMessage) throw new Error(errorMessage);

      const analysis = response.data?.analysis;
      if (analysis) {
        onAnalysisComplete(analysis);
        toast.success("Fraud analysis complete");
      }
    } catch (error) {
      console.error("Fraud analysis error:", error);
      toast.error(error instanceof Error ? error.message : "Failed to run fraud check");
    } finally {
      setIsAnalyzing(false);
    }
  };

  if (isAnalyzing) {
    return (
      <Card className="border-orange-200 bg-orange-50/30">
        <CardContent className="p-4 space-y-3">
          <div className="flex items-center gap-2 text-sm font-medium">
            <Fingerprint className="h-4 w-4 text-orange-600" />
            AI Fraud Detection
          </div>
          <div className="space-y-2">
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-4 w-1/2" />
            <Skeleton className="h-4 w-2/3" />
          </div>
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Loader2 className="h-3 w-3 animate-spin" />
            Comparing against related reviews...
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
            <Fingerprint className="h-4 w-4" />
            AI fraud check not yet run
          </div>
          <Button variant="outline" size="sm" onClick={runAnalysis}>
            <Fingerprint className="h-3.5 w-3.5 mr-1.5" />
            Fraud Check
          </Button>
        </CardContent>
      </Card>
    );
  }

  const config = verdictConfig[summary.verdict];
  const VerdictIcon = config.icon;

  return (
    <Card className={`border ${config.borderClass}`}>
      <CardContent className="p-4 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-sm font-medium">
            <Fingerprint className="h-4 w-4 text-orange-600" />
            AI Fraud Detection
          </div>
          <Button variant="ghost" size="sm" onClick={runAnalysis} className="h-7 text-xs">
            <RefreshCw className="h-3 w-3 mr-1" />
            Re-check
          </Button>
        </div>

        <p className="text-sm text-foreground/80">{summary.summary}</p>

        {/* Verdict banner */}
        <div className={`flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium ${config.bannerClass}`}>
          <VerdictIcon className="h-4 w-4 shrink-0" />
          {config.message}
        </div>

        {summary.evidence.length > 0 && (
          <div className="space-y-1.5">
            <p className="text-xs font-medium text-muted-foreground">Evidence:</p>
            <ul className="space-y-1">
              {summary.evidence.map((item, i) => (
                <li key={i} className="text-sm text-foreground/80 flex items-start gap-2">
                  <span className="text-muted-foreground mt-0.5">•</span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <span>
            Analyzed {format(new Date(summary.analyzed_at), "MMM d, yyyy 'at' h:mm a")}
          </span>
          <span>·</span>
          <Badge variant="secondary" className={`text-xs ${confidenceConfig[summary.confidence].className}`}>
            {confidenceConfig[summary.confidence].label}
          </Badge>
          {summary.comparison_count !== undefined && (
            <>
              <span>·</span>
              <span>{summary.comparison_count} reviews compared</span>
            </>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
