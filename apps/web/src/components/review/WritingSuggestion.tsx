"use client";

import { useState, useEffect, useRef } from "react";
import { createBrowserSupabaseClient } from "@/lib/supabase/client";
import { Check, X, Loader2 } from "lucide-react";
const supabase = createBrowserSupabaseClient();

interface WritingSuggestionProps {
  value: string;
  fieldName: string;
  onAccept: (corrected: string) => void;
}

export function WritingSuggestion({ value, fieldName, onAccept }: WritingSuggestionProps) {
  const [isChecking, setIsChecking] = useState(false);
  const [suggestion, setSuggestion] = useState<string | null>(null);
  const [dismissed, setDismissed] = useState(false);
  const lastCheckedRef = useRef("");
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    // Reset dismissed state when text changes
    setDismissed(false);

    // Clear previous timer
    if (timerRef.current) clearTimeout(timerRef.current);

    // Don't check short text or text we already checked
    const trimmed = value.trim();
    if (trimmed.length < 15 || trimmed === lastCheckedRef.current) {
      if (trimmed.length < 15) setSuggestion(null);
      return;
    }

    // Debounce 1.5s
    timerRef.current = setTimeout(async () => {
      setIsChecking(true);
      lastCheckedRef.current = trimmed;

      try {
        const { data, error } = await supabase.functions.invoke("polish-review-text", {
          body: { text: trimmed, fieldName },
        });

        if (error) {
          console.error("WritingSuggestion error:", error);
          setSuggestion(null);
        } else if (data?.hasChanges && data.corrected && data.corrected !== trimmed) {
          setSuggestion(data.corrected);
        } else {
          setSuggestion(null);
        }
      } catch (err) {
        console.error("WritingSuggestion fetch error:", err);
        setSuggestion(null);
      } finally {
        setIsChecking(false);
      }
    }, 500);

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [value, fieldName]);

  const handleAccept = () => {
    if (suggestion) {
      onAccept(suggestion);
      setSuggestion(null);
      lastCheckedRef.current = suggestion;
    }
  };

  const handleDismiss = () => {
    setSuggestion(null);
    setDismissed(true);
  };

  if (isChecking) {
    return (
      <div className="flex items-center gap-1.5 text-xs text-muted-foreground mt-1">
        <Loader2 className="h-3 w-3 animate-spin" />
        <span>Checking for grammatical errors.</span>
      </div>
    );
  }

  if (!suggestion || dismissed) return null;

  return (
    <div className="mt-1.5 rounded-md border border-muted bg-muted/30 px-3 py-2">
      <div className="flex items-start gap-2">
        <div className="flex-1 min-w-0">
          <p className="text-xs font-medium text-muted-foreground mb-0.5">Suggested:</p>
          <p className="text-sm text-foreground leading-snug">&ldquo;{suggestion}&rdquo;</p>
        </div>
        <div className="flex items-center gap-1 shrink-0 pt-0.5">
          <button
            type="button"
            onClick={handleAccept}
            className="inline-flex items-center gap-1 rounded px-2 py-1 text-xs font-medium bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
          >
            <Check className="h-3 w-3" />
            Apply
          </button>
          <button
            type="button"
            onClick={handleDismiss}
            className="inline-flex items-center justify-center rounded p-1 text-muted-foreground hover:text-foreground transition-colors"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
}
