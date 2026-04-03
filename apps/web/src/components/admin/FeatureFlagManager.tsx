import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Loader2, Flag } from "lucide-react";
import { useFeatureFlagsAdmin } from "@/hooks/useFeatureFlags";
import { toast } from "sonner";

export const FeatureFlagManager = () => {
  const { flags, loading, toggleFlag } = useFeatureFlagsAdmin();

  const handleToggle = async (id: string, currentValue: boolean, label: string) => {
    const success = await toggleFlag(id, currentValue);
    if (success) {
      toast.success(`${label} ${!currentValue ? "enabled" : "disabled"}`);
    } else {
      toast.error("Failed to update feature flag");
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  // Group flags by category
  const groupedFlags = flags.reduce((acc, flag) => {
    const category = flag.category || "general";
    if (!acc[category]) {
      acc[category] = [];
    }
    acc[category].push(flag);
    return acc;
  }, {} as Record<string, typeof flags>);

  const categoryLabels: Record<string, string> = {
    employer: "Employer Features",
    general: "General Features",
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <Flag className="h-5 w-5" />
        <div>
          <h2 className="text-xl font-semibold">Feature Flags</h2>
          <p className="text-sm text-muted-foreground">
            Toggle features on or off without code changes
          </p>
        </div>
      </div>

      {Object.entries(groupedFlags).map(([category, categoryFlags]) => (
        <Card key={category}>
          <CardHeader>
            <CardTitle className="text-lg">
              {categoryLabels[category] || category}
            </CardTitle>
            <CardDescription>
              {category === "employer" && "Control visibility of employer-facing features"}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {categoryFlags.map((flag) => (
              <div
                key={flag.id}
                className="flex items-center justify-between rounded-lg border p-4"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <Label htmlFor={flag.id} className="font-medium">
                      {flag.flag_label}
                    </Label>
                    <Badge variant={flag.is_enabled ? "default" : "secondary"}>
                      {flag.is_enabled ? "Enabled" : "Disabled"}
                    </Badge>
                  </div>
                  {flag.description && (
                    <p className="text-sm text-muted-foreground">
                      {flag.description}
                    </p>
                  )}
                </div>
                <Switch
                  id={flag.id}
                  checked={flag.is_enabled}
                  onCheckedChange={() =>
                    handleToggle(flag.id, flag.is_enabled, flag.flag_label)
                  }
                />
              </div>
            ))}
          </CardContent>
        </Card>
      ))}

      {flags.length === 0 && (
        <Card>
          <CardContent className="py-8 text-center text-muted-foreground">
            No feature flags configured
          </CardContent>
        </Card>
      )}
    </div>
  );
};
