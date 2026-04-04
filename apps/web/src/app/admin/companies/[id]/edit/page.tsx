"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import AdminLayout from "@/components/admin/AdminLayout";
import CompanyEditor from "@/components/employer/CompanyEditor";
import BenefitsManager from "@/components/employer/BenefitsManager";
import { AllowedEmailDomainsEditor } from "@/components/admin/AllowedEmailDomainsEditor";
import { createBrowserSupabaseClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { ArrowLeft, Loader2, Building2 } from "lucide-react";
import { toast } from "@/hooks/use-toast";

interface Company {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  industry: string | null;
  location: string | null;
  headquarters: string | null;
  employee_count: string | null;
  year_founded: number | null;
  ceo: string | null;
  mission: string | null;
  website: string | null;
  linkedin_url: string | null;
  logo_url: string | null;
  is_claimed: boolean | null;
  claimed_at: string | null;
  claimed_by: string | null;
  allowed_email_domains: string[] | null;
}

const supabase = createBrowserSupabaseClient();

const AdminCompanyEdit = () => {
  const params = useParams();
  const id = params.id as string;
  const router = useRouter();
  const [company, setCompany] = useState<Company | null>(null);
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  const [localClaimStatus, setLocalClaimStatus] = useState<boolean>(false);
  const [localAllowedDomains, setLocalAllowedDomains] = useState<string[]>([]);
  const [hasClaimChanges, setHasClaimChanges] = useState(false);
  const [hasDomainsChanges, setHasDomainsChanges] = useState(false);
  const [triggerSave, setTriggerSave] = useState(0);

  const fetchCompany = async () => {
    if (!id) return;

    const isInitialLoad = !company || company.id !== id;

    try {
      if (isInitialLoad) setLoading(true);
      const { data, error } = await supabase
        .from("companies")
        .select("*")
        .eq("id", id)
        .maybeSingle();

      if (error) throw error;
      if (!data) {
        toast({
          title: "Not found",
          description: "Company not found",
          variant: "destructive",
        });
        router.push("/admin/companies");
        return;
      }

      setCompany(data);
      setLocalClaimStatus(data.is_claimed || false);
      setLocalAllowedDomains(data.allowed_email_domains || []);
      setHasClaimChanges(false);
      setHasDomainsChanges(false);
    } catch (error) {
      console.error("Error fetching company:", error);
      toast({
        title: "Error",
        description: "Failed to load company",
        variant: "destructive",
      });
    } finally {
      if (isInitialLoad) setLoading(false);
    }
  };

  useEffect(() => {
    fetchCompany();
  }, [id]);

  const handleClaimToggle = (claimed: boolean) => {
    setLocalClaimStatus(claimed);
    setHasClaimChanges(claimed !== (company?.is_claimed || false));
  };

  const handleDomainsChange = (domains: string[]) => {
    setLocalAllowedDomains(domains);
    const originalDomains = company?.allowed_email_domains || [];
    const hasChanged = JSON.stringify(domains.sort()) !== JSON.stringify([...originalDomains].sort());
    setHasDomainsChanges(hasChanged);
  };

  const getWebsiteDomain = (): string | undefined => {
    if (!company?.website) return undefined;
    try {
      let websiteUrl = company.website;
      if (!websiteUrl.startsWith("http://") && !websiteUrl.startsWith("https://")) {
        websiteUrl = "https://" + websiteUrl;
      }
      const url = new URL(websiteUrl);
      return url.hostname.replace(/^www\./, "").toLowerCase();
    } catch {
      return undefined;
    }
  };

  const handleSaveAll = async () => {
    if (!company || isSaving) return;

    setIsSaving(true);
    try {
      if (hasClaimChanges || hasDomainsChanges) {
        const updateData: {
          is_claimed?: boolean;
          claimed_at?: string | null;
          claimed_by?: string | null;
          allowed_email_domains?: string[];
        } = {};

        if (hasClaimChanges) {
          updateData.is_claimed = localClaimStatus;
          updateData.claimed_at = localClaimStatus ? new Date().toISOString() : null;
          updateData.claimed_by = localClaimStatus ? (await supabase.auth.getUser()).data.user?.id || null : null;
        }

        if (hasDomainsChanges) {
          updateData.allowed_email_domains = localAllowedDomains;
        }

        const { error } = await supabase
          .from("companies")
          .update(updateData)
          .eq("id", company.id);

        if (error) throw error;
      }

      setTriggerSave(prev => prev + 1);
      setHasClaimChanges(false);
      setHasDomainsChanges(false);

      toast({
        title: "Changes saved",
        description: "All company information has been updated successfully.",
      });
    } catch (error) {
      console.error("Error saving changes:", error);
      toast({
        title: "Error",
        description: "Failed to save changes",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </AdminLayout>
    );
  }

  if (!company) {
    return null;
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => router.push("/admin/companies")}
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="flex items-center gap-3">
            <div className="h-12 w-12 rounded-lg bg-muted flex items-center justify-center overflow-hidden">
              {company.logo_url ? (
                <img
                  src={company.logo_url}
                  alt={company.name}
                  className="h-full w-full object-cover"
                />
              ) : (
                <Building2 className="h-6 w-6 text-muted-foreground" />
              )}
            </div>
            <div>
              <h1 className="text-2xl font-bold text-foreground">{company.name}</h1>
              <p className="text-foreground">Edit company details</p>
            </div>
          </div>
        </div>

        {/* Admin Controls */}
        <Card>
          <CardHeader>
            <CardTitle>Admin Controls</CardTitle>
            <CardDescription>
              Manage claim status and administrative settings
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="claim-status">Claim Status</Label>
                <p className="text-sm text-foreground">
                  Mark this company as claimed or unclaimed
                </p>
              </div>
              <div className="flex items-center gap-3">
                <Badge variant={localClaimStatus ? "default" : "secondary"}>
                  {localClaimStatus ? "Claimed" : "Unclaimed"}
                  {hasClaimChanges && " (unsaved)"}
                </Badge>
                <Switch
                  id="claim-status"
                  checked={localClaimStatus}
                  onCheckedChange={handleClaimToggle}
                />
              </div>
            </div>
            {company.claimed_at && !hasClaimChanges && localClaimStatus && (
              <p className="text-xs text-muted-foreground">
                Claimed on: {new Date(company.claimed_at).toLocaleDateString()}
              </p>
            )}

            <div className="border-t pt-4 mt-4">
              <AllowedEmailDomainsEditor
                domains={localAllowedDomains}
                onChange={handleDomainsChange}
                websiteDomain={getWebsiteDomain()}
              />
              {hasDomainsChanges && (
                <p className="text-xs text-amber-600 mt-2">(unsaved changes)</p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Company Editor */}
        <CompanyEditor
          company={company}
          onUpdate={fetchCompany}
          hideSaveButton
          externalSaveTrigger={triggerSave}
        />

        {/* Benefits Manager */}
        <BenefitsManager companyId={company.id} />

        {/* Global Save Button */}
        <div className="sticky bottom-6 flex justify-end">
          <Button
            onClick={handleSaveAll}
            disabled={isSaving}
            size="lg"
            className="shadow-lg"
          >
            {isSaving ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                Saving...
              </>
            ) : (
              "Save All Changes"
            )}
          </Button>
        </div>
      </div>
    </AdminLayout>
  );
};

export default AdminCompanyEdit;
