"use client";

import { useState, useEffect } from "react";
import { createBrowserSupabaseClient } from "@/lib/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Loader2, User, Lock, History, Eye, EyeOff } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import { MfaSettings } from "./MfaSettings";
const supabase = createBrowserSupabaseClient();

interface UserProfile {
  email: string;
  role: string;
  createdAt: string;
}

interface AuditLog {
  id: string;
  action: string;
  timestamp: string;
  metadata: unknown;
}

export const AdminAccountSettings = () => {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [activityLogs, setActivityLogs] = useState<AuditLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  useEffect(() => {
    fetchProfileAndLogs();
  }, []);

  const fetchProfileAndLogs = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) return;

      // Fetch user role
      const { data: roleData } = await supabase
        .from("user_roles")
        .select("role, created_at")
        .eq("user_id", session.user.id)
        .limit(1);

      const role = roleData?.[0]?.role || "admin";

      setProfile({
        email: session.user.email || "",
        role: role,
        createdAt: session.user.created_at || "",
      });

      // Fetch user's own activity logs
      const { data: logs } = await supabase
        .from("admin_audit_logs")
        .select("id, action, timestamp, metadata")
        .eq("admin_user_id", session.user.id)
        .order("timestamp", { ascending: false })
        .limit(20);

      setActivityLogs(logs || []);
    } catch (error) {
      console.error("Error fetching profile:", error);
      toast.error("Failed to load account information");
    } finally {
      setIsLoading(false);
    }
  };

  const handlePasswordChange = async () => {
    if (newPassword.length < 6) {
      toast.error("Password must be at least 6 characters");
      return;
    }

    if (newPassword !== confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }

    setIsChangingPassword(true);
    try {
      const { error } = await supabase.auth.updateUser({
        password: newPassword,
      });

      if (error) throw error;

      toast.success("Password updated successfully");
      setNewPassword("");
      setConfirmPassword("");
    } catch (error: unknown) {
      console.error("Password change error:", error);
      toast.error(error instanceof Error ? error.message : "Failed to update password");
    } finally {
      setIsChangingPassword(false);
    }
  };

  const formatRole = (role: string) => {
    return role
      .split("_")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ");
  };

  const getRoleBadgeVariant = (role: string) => {
    switch (role) {
      case "super_admin":
        return "destructive";
      case "admin":
        return "default";
      case "support_admin":
        return "secondary";
      default:
        return "outline";
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Profile Information */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            Profile Information
          </CardTitle>
          <CardDescription>
            View your account details
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label className="text-muted-foreground">Email</Label>
              <p className="font-medium">{profile?.email}</p>
            </div>
            <div className="space-y-2">
              <Label className="text-muted-foreground">Role</Label>
              <div>
                <Badge variant={getRoleBadgeVariant(profile?.role || "")}>
                  {formatRole(profile?.role || "")}
                </Badge>
              </div>
            </div>
            <div className="space-y-2">
              <Label className="text-muted-foreground">Account Created</Label>
              <p className="font-medium">
                {profile?.createdAt
                  ? format(new Date(profile.createdAt), "PPP")
                  : "N/A"}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Change Password */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Lock className="h-5 w-5" />
            Change Password
          </CardTitle>
          <CardDescription>
            Update your account password
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="new-password">New Password</Label>
              <div className="relative">
                <Input
                  id="new-password"
                  type={showPassword ? "text" : "password"}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Enter new password"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-0 top-0 h-full px-3"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirm-password">Confirm Password</Label>
              <div className="relative">
                <Input
                  id="confirm-password"
                  type={showConfirmPassword ? "text" : "password"}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Confirm new password"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-0 top-0 h-full px-3"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                >
                  {showConfirmPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </div>
          </div>
          <Button
            onClick={handlePasswordChange}
            disabled={isChangingPassword || !newPassword || !confirmPassword}
          >
            {isChangingPassword && (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            )}
            Update Password
          </Button>
        </CardContent>
      </Card>

      {/* Two-Factor Authentication */}
      <MfaSettings />

      {/* Activity Log */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <History className="h-5 w-5" />
            Your Recent Activity
          </CardTitle>
          <CardDescription>
            Actions you've performed in the admin panel
          </CardDescription>
        </CardHeader>
        <CardContent>
          {activityLogs.length === 0 ? (
            <p className="text-muted-foreground text-sm">No activity recorded yet.</p>
          ) : (
            <div className="space-y-3">
              {activityLogs.map((log) => (
                <div
                  key={log.id}
                  className="flex items-center justify-between border-b border-border pb-3 last:border-0 last:pb-0"
                >
                  <div>
                    <p className="font-medium text-sm">{log.action}</p>
                    {log.metadata != null && (
                      <p className="text-xs text-muted-foreground">
                        {JSON.stringify(log.metadata).slice(0, 100)}
                        {JSON.stringify(log.metadata).length > 100 && "..."}
                      </p>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {format(new Date(log.timestamp), "PPp")}
                  </p>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
