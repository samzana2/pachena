"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import { createBrowserSupabaseClient } from "@/lib/supabase/client";
import { useToast } from "@/hooks/use-toast";
const supabase = createBrowserSupabaseClient();

interface SalaryAccurateButtonProps {
  companyId: string;
  roleLevel: string;
  confirmationCount: number;
  confirmedKeys: Set<string>;
  onConfirmed: (key: string, newCount: number) => void;
}

export function SalaryAccurateButton({
  companyId,
  roleLevel,
  confirmationCount,
  confirmedKeys,
  onConfirmed,
}: SalaryAccurateButtonProps) {
  const [isConfirming, setIsConfirming] = useState(false);
  const { toast } = useToast();
  const key = `${companyId}:${roleLevel}`;
  const isConfirmed = confirmedKeys.has(key);

  const handleClick = async () => {
    if (isConfirmed) return;
    setIsConfirming(true);
    try {
      const { data: newCount, error } = await supabase.rpc(
        "increment_salary_confirmation",
        {
          p_company_id: companyId,
          p_role_level: roleLevel,
        }
      );
      if (error) throw error;
      onConfirmed(key, typeof newCount === "number" ? newCount : confirmationCount + 1);
    } catch (err) {
      console.error("Error confirming salary:", err);
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
    <div className="mt-2 flex items-center">
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
        {confirmationCount > 0 && (
          <span className="font-medium">{confirmationCount}</span>
        )}
        <span>Accurate Based on My Experience</span>
        {isConfirming && <Loader2 className="h-3 w-3 animate-spin" />}
      </Button>
    </div>
  );
}
