"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Loader2, FlaskConical, RotateCcw } from "lucide-react";
import { createBrowserSupabaseClient } from "@/lib/supabase/client";
import { getEdgeFunctionUrl } from "@/lib/edge-functions";
import { toast } from "sonner";
const supabase = createBrowserSupabaseClient();

interface RiskScores {
  identifiability: number;
  defamation: number;
  legal_sensitivity: number;
  toxicity: number;
  constructiveness: number;
}

interface AnalysisResult {
  risk_scores: RiskScores;
  total_risk_score: number;
  flag_types: string[];
  suggested_action: "APPROVE" | "REVIEW" | "PRIORITY_REVIEW" | "REJECT";
  redaction_suggestions: { field: string; text_span: string; reason: string }[];
  explanation_summary: string;
  analyzed_at: string;
}

const ACTION_COLORS: Record<string, string> = {
  APPROVE: "bg-green-100 text-green-800 border-green-300",
  REVIEW: "bg-yellow-100 text-yellow-800 border-yellow-300",
  PRIORITY_REVIEW: "bg-orange-100 text-orange-800 border-orange-300",
  REJECT: "bg-red-100 text-red-800 border-red-300",
};

function ScoreBar({ label, value, max = 20, inverted = false }: { label: string; value: number; max?: number; inverted?: boolean }) {
  const pct = Math.min((value / max) * 100, 100);
  const color = inverted
    ? value >= 14 ? "bg-green-500" : value >= 7 ? "bg-yellow-500" : "bg-red-500"
    : value >= 15 ? "bg-red-500" : value >= 10 ? "bg-orange-500" : value >= 5 ? "bg-yellow-500" : "bg-green-500";

  return (
    <div className="space-y-1">
      <div className="flex justify-between text-sm">
        <span className="text-muted-foreground">{label}</span>
        <span className="font-mono font-semibold">{value}/{max}</span>
      </div>
      <div className="h-2 rounded-full bg-muted overflow-hidden">
        <div className={`h-full rounded-full transition-all ${color}`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

const StressTestPanel = () => {
  const [text, setText] = useState("");
  const [sectionType, setSectionType] = useState("culture");
  const [companyName, setCompanyName] = useState("");
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<{ text: string; analysis: AnalysisResult }[]>([]);

  const handleAnalyze = async () => {
    if (!text.trim()) {
      toast.error("Please enter review text to analyze.");
      return;
    }

    setLoading(true);
    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const token = sessionData?.session?.access_token;
      if (!token) {
        toast.error("You must be logged in as admin.");
        return;
      }

      const res = await fetch(getEdgeFunctionUrl("test-analyze-section"), {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
          apikey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "",
        },
        body: JSON.stringify({
          text: text.trim(),
          sectionType,
          companyName: companyName.trim() || undefined,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        toast.error(data.error || "Analysis failed");
        return;
      }

      setResults((prev) => [{ text: text.trim(), analysis: data.analysis }, ...prev]);
      setText("");
      toast.success(`Score: ${data.analysis.total_risk_score} → ${data.analysis.suggested_action}`);
    } catch (err) {
      toast.error("Network error — please try again.");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Input */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <FlaskConical className="h-5 w-5" />
            AI Moderation Stress Test
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="review-text">Review Text</Label>
            <Textarea
              id="review-text"
              placeholder="Paste review text here to analyze..."
              value={text}
              onChange={(e) => setText(e.target.value)}
              className="mt-1 min-h-[100px]"
            />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <Label>Section Type</Label>
              <Select value={sectionType} onValueChange={setSectionType}>
                <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="culture">Culture</SelectItem>
                  <SelectItem value="compensation">Compensation</SelectItem>
                  <SelectItem value="interview">Interview</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="company">Company Name (optional)</Label>
              <Input
                id="company"
                placeholder="Test Company"
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                className="mt-1"
              />
            </div>
          </div>
          <div className="flex gap-2">
            <Button onClick={handleAnalyze} disabled={loading || !text.trim()}>
              {loading ? <><Loader2 className="animate-spin mr-2 h-4 w-4" />Analyzing...</> : "Analyze"}
            </Button>
            {results.length > 0 && (
              <Button variant="outline" onClick={() => setResults([])}>
                <RotateCcw className="mr-2 h-4 w-4" />Clear Results
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Results */}
      {results.map((r, i) => (
        <Card key={i} className="border-l-4" style={{ borderLeftColor: r.analysis.suggested_action === "APPROVE" ? "#22c55e" : r.analysis.suggested_action === "REJECT" ? "#ef4444" : r.analysis.suggested_action === "PRIORITY_REVIEW" ? "#f97316" : "#eab308" }}>
          <CardContent className="pt-6 space-y-4">
            {/* Header */}
            <div className="flex flex-wrap items-center justify-between gap-2">
              <Badge className={`text-sm px-3 py-1 ${ACTION_COLORS[r.analysis.suggested_action]}`}>
                {r.analysis.suggested_action}
              </Badge>
              <span className="font-mono text-2xl font-bold">
                Score: {r.analysis.total_risk_score}
              </span>
            </div>

            {/* Input text */}
            <div className="bg-muted rounded-md p-3 text-sm italic">"{r.text}"</div>

            {/* Scores */}
            <div className="space-y-2">
              <ScoreBar label="Identifiability" value={r.analysis.risk_scores.identifiability} />
              <ScoreBar label="Defamation" value={r.analysis.risk_scores.defamation} />
              <ScoreBar label="Legal Sensitivity" value={r.analysis.risk_scores.legal_sensitivity} />
              <ScoreBar label="Toxicity" value={r.analysis.risk_scores.toxicity} />
              <ScoreBar label="Constructiveness" value={r.analysis.risk_scores.constructiveness} inverted />
            </div>

            {/* Explanation */}
            <div>
              <Label className="text-xs uppercase tracking-wide text-muted-foreground">Explanation</Label>
              <p className="mt-1 text-sm">{r.analysis.explanation_summary}</p>
            </div>

            {/* Flags */}
            {r.analysis.flag_types.length > 0 && (
              <div>
                <Label className="text-xs uppercase tracking-wide text-muted-foreground">Flags</Label>
                <div className="mt-1 flex flex-wrap gap-1">
                  {r.analysis.flag_types.map((f) => (
                    <Badge key={f} variant="outline" className="text-xs">{f}</Badge>
                  ))}
                </div>
              </div>
            )}

            {/* Redactions */}
            {r.analysis.redaction_suggestions.length > 0 && (
              <div>
                <Label className="text-xs uppercase tracking-wide text-muted-foreground">Redaction Suggestions</Label>
                <ul className="mt-1 space-y-1 text-sm">
                  {r.analysis.redaction_suggestions.map((rd, j) => (
                    <li key={j} className="bg-red-50 rounded px-2 py-1">
                      <span className="font-medium">"{rd.text_span}"</span>
                      <span className="text-muted-foreground"> — {rd.reason}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  );
};

export default StressTestPanel;
