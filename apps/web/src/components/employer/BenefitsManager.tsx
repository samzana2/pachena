"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { createBrowserSupabaseClient } from "@/lib/supabase/client";
import { toast } from "sonner";
import { Plus, X, Loader2, Gift } from "lucide-react";
const supabase = createBrowserSupabaseClient();

interface Benefit {
  id: string;
  benefit_name: string;
  created_at: string;
}

interface BenefitsManagerProps {
  companyId: string;
}

const BenefitsManager = ({ companyId }: BenefitsManagerProps) => {
  const [benefits, setBenefits] = useState<Benefit[]>([]);
  const [newBenefit, setNewBenefit] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isAdding, setIsAdding] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  useEffect(() => {
    fetchBenefits();
  }, [companyId]);

  const fetchBenefits = async () => {
    try {
      const { data, error } = await supabase
        .from("company_benefits")
        .select("*")
        .eq("company_id", companyId)
        .order("created_at", { ascending: true });

      if (error) throw error;
      setBenefits(data || []);
    } catch (error) {
      console.error("Error fetching benefits:", error);
      toast.error("Failed to load benefits");
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddBenefit = async (e?: React.FormEvent, benefitName?: string) => {
    e?.preventDefault();
    const nameToAdd = benefitName || newBenefit.trim();
    if (!nameToAdd) return;

    setIsAdding(true);
    try {
      const { data, error } = await supabase
        .from("company_benefits")
        .insert({ company_id: companyId, benefit_name: nameToAdd })
        .select()
        .single();

      if (error) throw error;
      
      setBenefits([...benefits, data]);
      if (!benefitName) setNewBenefit("");
      toast.success("Benefit added");
    } catch (error) {
      console.error("Error adding benefit:", error);
      toast.error("Failed to add benefit");
    } finally {
      setIsAdding(false);
    }
  };

  const handleDeleteBenefit = async (id: string) => {
    setDeletingId(id);
    try {
      const { error } = await supabase
        .from("company_benefits")
        .delete()
        .eq("id", id);

      if (error) throw error;
      
      setBenefits(benefits.filter((b) => b.id !== id));
      toast.success("Benefit removed");
    } catch (error) {
      console.error("Error deleting benefit:", error);
      toast.error("Failed to remove benefit");
    } finally {
      setDeletingId(null);
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="py-10 flex justify-center">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Gift className="h-5 w-5" />
          Company Benefits & Perks
        </CardTitle>
        <CardDescription>
          Add the benefits and perks your company offers to employees. These will be displayed on your public company page.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Add new benefit form */}
        <form onSubmit={handleAddBenefit} className="flex gap-2">
          <Input
            placeholder="e.g., Health Insurance, Remote Work, Gym Membership..."
            value={newBenefit}
            onChange={(e) => setNewBenefit(e.target.value)}
            disabled={isAdding}
            className="flex-1"
          />
          <Button type="submit" disabled={isAdding || !newBenefit.trim()}>
            {isAdding ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <>
                <Plus className="h-4 w-4 mr-1" />
                Add
              </>
            )}
          </Button>
        </form>

        {/* Benefits list */}
        {benefits.length === 0 ? (
          <div className="text-center py-8 border border-dashed rounded-lg">
            <Gift className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
            <p className="text-muted-foreground">No benefits added yet</p>
            <p className="text-sm text-muted-foreground mt-1">
              Add your first benefit to showcase what you offer
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            <p className="text-sm font-medium text-foreground">
              Current Benefits ({benefits.length})
            </p>
            <div className="flex flex-wrap gap-2">
              {benefits.map((benefit) => (
                <Badge
                  key={benefit.id}
                  variant="secondary"
                  className="pl-3 pr-1 py-1.5 text-sm flex items-center gap-1"
                >
                  {benefit.benefit_name}
                  <button
                    onClick={() => handleDeleteBenefit(benefit.id)}
                    disabled={deletingId === benefit.id}
                    className="ml-1 p-0.5 rounded hover:bg-muted-foreground/20 transition-colors"
                    aria-label={`Remove ${benefit.benefit_name}`}
                  >
                    {deletingId === benefit.id ? (
                      <Loader2 className="h-3 w-3 animate-spin" />
                    ) : (
                      <X className="h-3 w-3" />
                    )}
                  </button>
                </Badge>
              ))}
            </div>
          </div>
        )}

        {/* Suggestions */}
        <div className="border-t pt-4">
          <p className="text-sm font-medium text-foreground mb-2">Popular benefits to consider:</p>
          <div className="flex flex-wrap gap-2">
            {[
              "Medical Aid",
              "Pension Fund",
              "Transport Allowance",
              "Housing Allowance",
              "Fuel Allowance",
              "Performance Bonus",
              "Study Assistance",
              "Maternity/Paternity Leave",
              "Staff Loans",
              "Airtime Allowance"
            ]
              .filter((suggestion) => !benefits.some((b) => b.benefit_name.toLowerCase() === suggestion.toLowerCase()))
              .slice(0, 6)
              .map((suggestion) => (
                <Button
                  key={suggestion}
                  variant="outline"
                  size="sm"
                  onClick={() => handleAddBenefit(undefined, suggestion)}
                  disabled={isAdding}
                  className="text-xs"
                >
                  <Plus className="h-3 w-3 mr-1" />
                  {suggestion}
                </Button>
              ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default BenefitsManager;
