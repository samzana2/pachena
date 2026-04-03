"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Settings, Users, Bell, History, Construction } from "lucide-react";

const PlaceholderTab = ({
  title,
  description,
}: {
  title: string;
  description: string;
}) => (
  <Card>
    <CardContent className="py-12 text-center">
      <Construction className="h-12 w-12 text-muted-foreground/50 mx-auto mb-4" />
      <h3 className="font-heading font-semibold text-foreground mb-2">
        {title}
      </h3>
      <p className="text-muted-foreground text-sm">{description}</p>
    </CardContent>
  </Card>
);

const SettingsPage = () => {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-heading font-bold text-foreground flex items-center gap-2">
          <Settings className="h-6 w-6" />
          Settings
        </h1>
        <p className="text-muted-foreground mt-1">
          Manage your team, notifications, and account
        </p>
      </div>

      <Tabs defaultValue="team" className="space-y-6">
        <TabsList>
          <TabsTrigger value="team" className="gap-2">
            <Users className="h-4 w-4" />
            Team
          </TabsTrigger>
          <TabsTrigger value="notifications" className="gap-2">
            <Bell className="h-4 w-4" />
            Notifications
          </TabsTrigger>
          <TabsTrigger value="activity" className="gap-2">
            <History className="h-4 w-4" />
            Activity Log
          </TabsTrigger>
        </TabsList>

        <TabsContent value="team">
          <PlaceholderTab
            title="Team Management"
            description="Invite team members, assign roles, and manage permissions. Coming soon."
          />
        </TabsContent>

        <TabsContent value="notifications">
          <PlaceholderTab
            title="Notification Preferences"
            description="Configure email notifications for reviews, applications, and feedback. Coming soon."
          />
        </TabsContent>

        <TabsContent value="activity">
          <PlaceholderTab
            title="Activity Log"
            description="View all actions taken on your employer account. Coming soon."
          />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default SettingsPage;
