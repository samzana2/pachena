"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import { createBrowserSupabaseClient } from "@/lib/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface AccurateButtonProps {
  reviewId: string;
  helpfulCount: number;
  confirmedReviews: Set<string>;
  onConfirmed: (reviewId: string) => void;
  onCountIncremented?: (reviewId: string) => void;
}

async function generateVoterHash(): Promise<string> {
  const voterData = [
    navigator.userAgent,
    navigator.language,
    screen.width + "x" + screen.height,
    Intl.DateTimeFormat().resolvedOptions().timeZone,
  ].join("|");
  const encoder = new TextEncoder();
  const data = encoder.encode(voterData);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
}

export function AccurateButton({
  reviewId,
  helpfulCount,
  confirmedReviews,
  onConfirmed,
  onCountIncremented,
}: AccurateButtonProps) {
  const [isConfirming, setIsConfirming] = useState(false);
  const { toast } = useToast();
  const isConfirmed = confirmedReviews.has(reviewId);

  const handleClick = async () => {
    if (isConfirmed) return;
    setIsConfirming(true);
    try {
      const supabase = createBrowserSupabaseClient();
      const voterHash = await generateVoterHash();
      const { data: voteResult, error } = await supabase.rpc(
        "increment_helpful_count",
        {
          p_review_id: reviewId,
          p_voter_ip_hash: voterHash,
        }
      );
      if (error) throw error;
      if (voteResult === false) {
        toast({
          title: "Already confirmed",
          description: "You've already marked this as accurate.",
          variant: "default",
        });
        onConfirmed(reviewId);
        return;
      }
      onConfirmed(reviewId);
      onCountIncremented?.(reviewId);
    } catch (err) {
      console.error("Error confirming review:", err);
      toast({
        title: "Something went wrong",
        description: "Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsConfirming(false);
    }
  };

  return (
    <div className="mt-4 pt-3 border-t border-border flex items-center">
      <Button
        variant="ghost"
        size="sm"
        disabled={isConfirmed || isConfirming}
        className={`gap-1.5 text-xs ${
          isConfirmed
            ? "text-green-700 bg-green-50 hover:bg-green-50 cursor-default"
            : "text-black/50 hover:text-green-700 hover:bg-green-50"
        }`}
        onClick={handleClick}
      >
        <span className="text-base leading-none">👍</span>
        {helpfulCount > 0 && <span className="font-medium">{helpfulCount}</span>}
        <span>Accurate Based on My Experience</span>
        {isConfirming && <Loader2 className="h-3 w-3 animate-spin" />}
      </Button>
    </div>
  );
}
