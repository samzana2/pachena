"use client";

import { useState, useEffect } from "react";
import { createBrowserSupabaseClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { Loader2, Save, Settings } from "lucide-react";
const supabase = createBrowserSupabaseClient();

interface PlatformSetting {
  id: string;
  setting_key: string;
  setting_value: string | null;
  setting_type: string;
  description: string | null;
  updated_at: string | null;
}

interface SettingConfig {
  key: string;
  label: string;
  type: "string" | "number" | "boolean" | "select";
  options?: { value: string; label: string }[];
}

const settingConfigs: SettingConfig[] = [
  { key: "site_name", label: "Site Name", type: "string" },
  { key: "support_email", label: "Support Email", type: "string" },
  { key: "min_review_length", label: "Minimum Review Length (characters)", type: "number" },
  {
    key: "review_moderation_mode",
    label: "Review Moderation Mode",
    type: "select",
    options: [
      { value: "auto_approve", label: "Auto Approve" },
      { value: "manual", label: "Manual Review" },
      { value: "ai_moderation", label: "AI Moderation" },
    ],
  },
  { key: "allow_anonymous_reviews", label: "Allow Anonymous Reviews", type: "boolean" },
  { key: "session_timeout_minutes", label: "Session Timeout (minutes)", type: "number" },
];

export function PlatformConfigManager() {
  const [settings, setSettings] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const [originalSettings, setOriginalSettings] = useState<Record<string, string>>({});

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("platform_settings")
        .select("*");

      if (error) throw error;

      const settingsMap: Record<string, string> = {};
      (data || []).forEach((setting: PlatformSetting) => {
        settingsMap[setting.setting_key] = setting.setting_value || "";
      });

      setSettings(settingsMap);
      setOriginalSettings(settingsMap);
    } catch (error) {
      console.error("Error fetching settings:", error);
      toast.error("Failed to load platform settings");
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (key: string, value: string) => {
    setSettings((prev) => ({ ...prev, [key]: value }));
    setHasChanges(true);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      const updates = Object.entries(settings).map(([key, value]) => ({
        setting_key: key,
        setting_value: value,
        updated_at: new Date().toISOString(),
        updated_by: user?.id,
      }));

      for (const update of updates) {
        const { error } = await supabase
          .from("platform_settings")
          .update({
            setting_value: update.setting_value,
            updated_at: update.updated_at,
            updated_by: update.updated_by,
          })
          .eq("setting_key", update.setting_key);

        if (error) throw error;
      }

      toast.success("Settings saved successfully");
      setOriginalSettings(settings);
      setHasChanges(false);
    } catch (error) {
      console.error("Error saving settings:", error);
      toast.error("Failed to save settings");
    } finally {
      setSaving(false);
    }
  };

  const handleReset = () => {
    setSettings(originalSettings);
    setHasChanges(false);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-medium">Platform Configuration</h3>
          <p className="text-sm text-muted-foreground">
            Configure general platform settings and behavior
          </p>
        </div>
        <div className="flex gap-2">
          {hasChanges && (
            <Button variant="outline" onClick={handleReset}>
              Reset
            </Button>
          )}
          <Button onClick={handleSave} disabled={saving || !hasChanges}>
            {saving ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Save className="mr-2 h-4 w-4" />
            )}
            Save Changes
          </Button>
        </div>
      </div>

      <div className="grid gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Settings className="h-4 w-4" />
              General Settings
            </CardTitle>
            <CardDescription>
              Basic platform configuration options
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {settingConfigs.slice(0, 2).map((config) => (
              <div key={config.key} className="space-y-2">
                <Label htmlFor={config.key}>{config.label}</Label>
                <Input
                  id={config.key}
                  value={settings[config.key] || ""}
                  onChange={(e) => handleChange(config.key, e.target.value)}
                />
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Review Settings</CardTitle>
            <CardDescription>
              Configure how reviews are submitted and moderated
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="min_review_length">
                {settingConfigs.find((c) => c.key === "min_review_length")?.label}
              </Label>
              <Input
                id="min_review_length"
                type="number"
                value={settings.min_review_length || "50"}
                onChange={(e) => handleChange("min_review_length", e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="review_moderation_mode">Review Moderation Mode</Label>
              <Select
                value={settings.review_moderation_mode || "auto_approve"}
                onValueChange={(v) => handleChange("review_moderation_mode", v)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="auto_approve">Auto Approve</SelectItem>
                  <SelectItem value="manual">Manual Review</SelectItem>
                  <SelectItem value="ai_moderation">AI Moderation</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                How new reviews should be processed before becoming visible
              </p>
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="allow_anonymous_reviews">Allow Anonymous Reviews</Label>
                <p className="text-xs text-muted-foreground">
                  Let users submit reviews without revealing their identity
                </p>
              </div>
              <Switch
                id="allow_anonymous_reviews"
                checked={settings.allow_anonymous_reviews === "true"}
                onCheckedChange={(checked) =>
                  handleChange("allow_anonymous_reviews", checked ? "true" : "false")
                }
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Security Settings</CardTitle>
            <CardDescription>
              Configure security-related platform options
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="session_timeout_minutes">Session Timeout (minutes)</Label>
              <Input
                id="session_timeout_minutes"
                type="number"
                value={settings.session_timeout_minutes || "60"}
                onChange={(e) => handleChange("session_timeout_minutes", e.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                Auto-logout after this many minutes of inactivity
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
