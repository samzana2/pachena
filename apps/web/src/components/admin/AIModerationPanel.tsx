"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Loader2, Bot, RefreshCw, Shield, AlertTriangle, CheckCircle, XCircle } from "lucide-react";
import { createBrowserSupabaseClient } from "@/lib/supabase/client";
import { toast } from "sonner";
import { extractEdgeFunctionError } from "@/lib/edge-function-errors";
import { Skeleton } from "@/components/ui/skeleton";
import { format } from "date-fns";
const supabase = createBrowserSupabaseClient();

interface AIModerationSummary {
  recommendation: "approve" | "flag" | "reject";
  confidence: "high" | "medium" | "low";
  summary: string;
  flags: string[];
  analyzed_at: string;
}

interface AIModerationPanelProps {
  reviewId: string;
  existingSummary: AIModerationSummary | null;
  onAnalysisComplete: (summary: AIModerationSummary) => void;
}

const recommendationConfig = {
  approve: { icon: CheckCircle, label: "Approve", className: "bg-green-100 text-green-800 border-green-200" },
  flag: { icon: AlertTriangle, label: "Flag for Review", className: "bg-yellow-100 text-yellow-800 border-yellow-200" },
  reject: { icon: XCircle, label: "Reject", className: "bg-red-100 text-red-800 border-red-200" },
};

const confidenceConfig = {
  high: { className: "bg-green-100 text-green-700", label: "AI certainty: high" },
  medium: { className: "bg-yellow-100 text-yellow-700", label: "AI certainty: medium" },
  low: { className: "bg-red-100 text-red-700", label: "AI certainty: low" },
};

export function AIModerationPanel({ reviewId, existingSummary, onAnalysisComplete }: AIModerationPanelProps) {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const summary = existingSummary;

  const runAnalysis = async () => {
    setIsAnalyzing(true);
    try {
      const response = await supabase.functions.invoke('analyze-review', {
        body: { reviewId },
      });

      const errorMessage = await extractEdgeFunctionError(response);
      if (errorMessage) throw new Error(errorMessage);

      const analysis = response.data?.analysis;
      if (analysis) {
        onAnalysisComplete(analysis);
        toast.success("AI analysis complete");
      }
    } catch (error) {
      console.error("AI analysis error:", error);
      toast.error(error instanceof Error ? error.message : "Failed to analyze review");
    } finally {
      setIsAnalyzing(false);
    }
  };

  if (isAnalyzing) {
    return (
      <Card className="border-primary/20 bg-primary/5">
        <CardContent className="p-4 space-y-3">
          <div className="flex items-center gap-2 text-sm font-medium">
            <Bot className="h-4 w-4 text-primary" />
            AI Moderation Assistant
          </div>
          <div className="space-y-2">
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-4 w-1/2" />
            <Skeleton className="h-4 w-2/3" />
          </div>
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Loader2 className="h-3 w-3 animate-spin" />
            Analyzing review content...
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
            <Bot className="h-4 w-4" />
            AI moderation analysis not yet run
          </div>
          <Button variant="outline" size="sm" onClick={runAnalysis}>
            <Shield className="h-3.5 w-3.5 mr-1.5" />
            Analyze Review
          </Button>
        </CardContent>
      </Card>
    );
  }

  const config = recommendationConfig[summary.recommendation];
  const RecIcon = config.icon;

  return (
    <Card className={`border ${config.className.includes('green') ? 'border-green-200 bg-green-50/50' : config.className.includes('yellow') ? 'border-yellow-200 bg-yellow-50/50' : 'border-red-200 bg-red-50/50'}`}>
      <CardContent className="p-4 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-sm font-medium">
            <Bot className="h-4 w-4 text-primary" />
            AI Moderation Assistant
          </div>
          <Button variant="ghost" size="sm" onClick={runAnalysis} className="h-7 text-xs">
            <RefreshCw className="h-3 w-3 mr-1" />
            Re-analyze
          </Button>
        </div>

        <p className="text-sm text-foreground/80">{summary.summary}</p>

        {/* Policy verdict */}
        <div className={`flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium ${
          summary.recommendation === 'approve'
            ? 'bg-green-100 text-green-800'
            : summary.recommendation === 'reject'
            ? 'bg-red-100 text-red-800'
            : 'bg-yellow-100 text-yellow-800'
        }`}>
          <RecIcon className="h-4 w-4 shrink-0" />
          {summary.recommendation === 'approve'
            ? 'No policy violations detected — safe to publish'
            : summary.recommendation === 'reject'
            ? 'Policy violation(s) found — recommend rejecting'
            : 'Potential policy concern(s) — recommend manual review'}
        </div>

        {summary.flags.length > 0 && (
          <div className="space-y-1">
            <p className="text-xs font-medium text-muted-foreground">Flagged concerns:</p>
            <div className="flex flex-wrap gap-1.5">
              {summary.flags.map((flag, i) => (
                <Badge key={i} variant="outline" className="text-xs bg-background">
                  {flag}
                </Badge>
              ))}
            </div>
          </div>
        )}

        <p className="text-xs text-muted-foreground">
          Analyzed {format(new Date(summary.analyzed_at), "MMM d, yyyy 'at' h:mm a")} · {confidenceConfig[summary.confidence].label}
        </p>
      </CardContent>
    </Card>
  );
}
