"use client";

import { useRouter } from "next/navigation";
import { useEmployer } from "@/contexts/EmployerContext";
import CompanyEditor from "@/components/employer/CompanyEditor";
import BenefitsManager from "@/components/employer/BenefitsManager";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Building2, Gift, Eye } from "lucide-react";
import { Button } from "@/components/ui/button";

const CompanyProfilePage = () => {
  const { company, refreshCompany } = useEmployer();
  const router = useRouter();

  if (!company) return null;

  const fields = [
    company.description,
    company.industry,
    company.location,
    company.headquarters,
    company.employee_count,
    company.year_founded,
    company.website,
    company.logo_url,
    company.mission,
  ];
  const filledFields = fields.filter(Boolean).length;
  const completeness = Math.round((filledFields / fields.length) * 100);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-heading font-bold text-foreground">
            Company Profile
          </h1>
          <p className="text-muted-foreground mt-1">
            Manage your company information and benefits
          </p>
        </div>
        <Button
          variant="outline"
          onClick={() => router.push(`/company/${company.slug}`)}
        >
          <Eye className="h-4 w-4 mr-2" />
          View Public Page
        </Button>
      </div>

      {/* Profile Completeness */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <Building2 className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="font-medium text-foreground">Profile Completeness</p>
                <p className="text-sm text-muted-foreground">
                  {completeness === 100
                    ? "Your profile is complete!"
                    : "Complete your profile to attract more candidates"}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-32 h-2 bg-muted rounded-full overflow-hidden">
                <div
                  className="h-full bg-primary rounded-full transition-all"
                  style={{ width: `${completeness}%` }}
                />
              </div>
              <span className="text-sm font-semibold text-foreground w-12 text-right">
                {completeness}%
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tabs */}
      <Tabs defaultValue="profile" className="space-y-6">
        <TabsList>
          <TabsTrigger value="profile" className="gap-2">
            <Building2 className="h-4 w-4" />
            Company Info
          </TabsTrigger>
          <TabsTrigger value="benefits" className="gap-2">
            <Gift className="h-4 w-4" />
            Benefits
          </TabsTrigger>
        </TabsList>

        <TabsContent value="profile">
          <CompanyEditor company={company} onUpdate={refreshCompany} />
        </TabsContent>

        <TabsContent value="benefits">
          <BenefitsManager companyId={company.id} />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default CompanyProfilePage;
