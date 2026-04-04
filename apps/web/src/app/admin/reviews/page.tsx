"use client";

import AdminLayout from "@/components/admin/AdminLayout";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import AdminSectionReviews from "@/components/admin/AdminSectionReviews";
import StressTestPanel from "@/components/admin/StressTestPanel";

const AdminReviews = () => {
  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Review Moderation</h1>
          <p className="mt-1 text-muted-foreground">
            Monitor and moderate all review submissions
          </p>
        </div>

        <Tabs defaultValue="all" className="space-y-4">
          <TabsList className="bg-muted">
            <TabsTrigger value="all">All</TabsTrigger>
            <TabsTrigger value="compensation">Compensation</TabsTrigger>
            <TabsTrigger value="culture">Culture</TabsTrigger>
            <TabsTrigger value="interview">Interview</TabsTrigger>
            <TabsTrigger value="stress-test">Stress Test</TabsTrigger>
          </TabsList>

          <TabsContent value="all">
            <AdminSectionReviews />
          </TabsContent>
          <TabsContent value="compensation">
            <AdminSectionReviews sectionType="compensation" />
          </TabsContent>
          <TabsContent value="culture">
            <AdminSectionReviews sectionType="culture" />
          </TabsContent>
          <TabsContent value="interview">
            <AdminSectionReviews sectionType="interview" />
          </TabsContent>
          <TabsContent value="stress-test">
            <StressTestPanel />
          </TabsContent>
        </Tabs>
      </div>
    </AdminLayout>
  );
};

export default AdminReviews;
