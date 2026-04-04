"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import AdminLayout from "@/components/admin/AdminLayout";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { UserRoleManager } from "@/components/admin/UserRoleManager";
import { PlatformConfigManager } from "@/components/admin/PlatformConfigManager";
import { AuditLogViewer } from "@/components/admin/AuditLogViewer";
import { FeatureFlagManager } from "@/components/admin/FeatureFlagManager";
import { AdminAccountSettings } from "@/components/admin/AdminAccountSettings";
import { Users, Settings, FileText, Flag, UserCircle } from "lucide-react";

const AdminSettingsContent = () => {
  const searchParams = useSearchParams();
  const defaultTab = searchParams.get("tab") || "users";

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
        <p className="text-muted-foreground">
          Manage platform configuration and admin access
        </p>
      </div>

      <Tabs defaultValue={defaultTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-5 lg:w-auto lg:inline-flex">
          <TabsTrigger value="account" className="flex items-center gap-2">
            <UserCircle className="h-4 w-4" />
            <span className="hidden sm:inline">My Account</span>
            <span className="sm:hidden">Account</span>
          </TabsTrigger>
          <TabsTrigger value="users" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            <span className="hidden sm:inline">Users & Roles</span>
            <span className="sm:hidden">Users</span>
          </TabsTrigger>
          <TabsTrigger value="flags" className="flex items-center gap-2">
            <Flag className="h-4 w-4" />
            <span className="hidden sm:inline">Feature Flags</span>
            <span className="sm:hidden">Flags</span>
          </TabsTrigger>
          <TabsTrigger value="platform" className="flex items-center gap-2">
            <Settings className="h-4 w-4" />
            <span className="hidden sm:inline">Platform</span>
            <span className="sm:hidden">Config</span>
          </TabsTrigger>
          <TabsTrigger value="audit" className="flex items-center gap-2">
            <FileText className="h-4 w-4" />
            <span className="hidden sm:inline">Audit Logs</span>
            <span className="sm:hidden">Logs</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="account">
          <AdminAccountSettings />
        </TabsContent>

        <TabsContent value="users">
          <UserRoleManager />
        </TabsContent>

        <TabsContent value="flags">
          <FeatureFlagManager />
        </TabsContent>

        <TabsContent value="platform">
          <PlatformConfigManager />
        </TabsContent>

        <TabsContent value="audit">
          <AuditLogViewer />
        </TabsContent>
      </Tabs>
    </div>
  );
};

const AdminSettings = () => {
  return (
    <AdminLayout>
      <Suspense fallback={null}>
        <AdminSettingsContent />
      </Suspense>
    </AdminLayout>
  );
};

export default AdminSettings;
