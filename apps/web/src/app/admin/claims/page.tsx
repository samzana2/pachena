"use client";

import { useState, useEffect } from "react";
import AdminLayout from "@/components/admin/AdminLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { createBrowserSupabaseClient } from "@/lib/supabase/client";
import { toast } from "sonner";
import { Loader2, CheckCircle, XCircle, Clock, Mail, Building2, Eye, ChevronDown, Flag, AlertTriangle } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { ClaimJustificationDialog } from "@/components/admin/ClaimJustificationDialog";
import { ClaimHistorySection } from "@/components/admin/ClaimHistorySection";
import { extractEdgeFunctionError } from "@/lib/edge-function-errors";

interface ClaimListItem {
  id: string;
  company_name: string;
  status: string;
  created_at: string;
  work_email: string;
  reviewed_at: string | null;
  flagged?: boolean;
}

interface ClaimDetails {
  id: string;
  full_name: string;
  job_title: string | null;
  work_email: string;
  company_name: string;
  company_website: string | null;
  phone_number: string | null;
  message: string | null;
  supervisor_name: string | null;
  supervisor_email: string | null;
  status: string;
  created_at: string;
  reviewed_at: string | null;
  flagged?: boolean;
}

const supabase = createBrowserSupabaseClient();

const AdminClaims = () => {
  const [claims, setClaims] = useState<ClaimListItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [selectedClaim, setSelectedClaim] = useState<ClaimDetails | null>(null);
  const [isLoadingDetails, setIsLoadingDetails] = useState(false);
  const [detailsDialogOpen, setDetailsDialogOpen] = useState(false);
  const [justificationAction, setJustificationAction] = useState<"flag" | "unflag" | "deny" | null>(null);
  const [justificationDialogOpen, setJustificationDialogOpen] = useState(false);
  const [justificationClaimId, setJustificationClaimId] = useState<string | null>(null);
  const [openSections, setOpenSections] = useState<Record<string, boolean>>({
    requester: true,
    contact: true,
    company: true,
    message: true,
    supervisor: true,
  });

  const toggleSection = (section: string) => {
    setOpenSections(prev => ({ ...prev, [section]: !prev[section] }));
  };

  const SectionHeader = ({
    title,
    section
  }: {
    title: string;
    section: string;
  }) => (
    <CollapsibleTrigger className="flex items-center justify-between w-full py-2 text-sm font-medium hover:text-primary transition-colors">
      <span>{title}</span>
      <ChevronDown className={`h-4 w-4 transition-transform ${openSections[section] ? 'rotate-180' : ''}`} />
    </CollapsibleTrigger>
  );

  const DataRow = ({ label, value, isLink }: { label: string; value: React.ReactNode; isLink?: boolean }) => (
    <div className="flex justify-between py-1.5 text-sm">
      <span className="text-foreground">{label}</span>
      {value ? (
        isLink ? (
          <a href={value as string} target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:underline text-right max-w-[60%] truncate">
            {value}
          </a>
        ) : (
          <span className="text-muted-foreground text-right max-w-[60%]">{value}</span>
        )
      ) : (
        <span className="text-muted-foreground italic">—</span>
      )}
    </div>
  );

  useEffect(() => {
    fetchClaims();
  }, []);

  const fetchClaims = async () => {
    setIsLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error("No session");

      const response = await supabase.functions.invoke('manage-claims', {
        method: 'GET',
      });

      const errorMessage = await extractEdgeFunctionError(response);
      if (errorMessage) {
        throw new Error(errorMessage);
      }
      setClaims(response.data.claims || []);
    } catch (error: any) {
      console.error("Fetch error:", error);
      toast.error(error.message || "Failed to load claim requests");
    } finally {
      setIsLoading(false);
    }
  };

  const viewClaimDetails = async (claimId: string) => {
    setIsLoadingDetails(true);
    setDetailsDialogOpen(true);
    try {
      const response = await supabase.functions.invoke(`manage-claims?id=${claimId}`, {
        method: 'GET',
      });

      const errorMessage = await extractEdgeFunctionError(response);
      if (errorMessage) {
        throw new Error(errorMessage);
      }
      setSelectedClaim(response.data.claim);
    } catch (error: any) {
      console.error("View details error:", error);
      toast.error(error.message || "Failed to load claim details");
      setDetailsDialogOpen(false);
    } finally {
      setIsLoadingDetails(false);
    }
  };

  const updateClaimStatus = async (claimId: string, action: "approved" | "denied" | "flag" | "unflag", reason?: string, notes?: string) => {
    setProcessingId(claimId);
    try {
      const response = await supabase.functions.invoke('manage-claims', {
        method: 'PATCH',
        body: { id: claimId, action, reason, notes },
      });

      const errorMessage = await extractEdgeFunctionError(response);
      if (errorMessage) {
        throw new Error(errorMessage);
      }

      if (action === 'approved') {
        toast.success(response.data.companyCreated ? "Claim approved and company page created!" : "Claim approved.");
        setDetailsDialogOpen(false);
      } else if (action === 'denied') {
        toast.success("Claim denied");
        setDetailsDialogOpen(false);
      } else if (action === 'flag') {
        toast.success("Claim flagged for review");
      } else if (action === 'unflag') {
        toast.success("Flag removed from claim");
      }

      fetchClaims();
      if (selectedClaim?.id === claimId && (action === 'flag' || action === 'unflag')) {
        viewClaimDetails(claimId);
      }
    } catch (error: any) {
      console.error("Claim update error:", error);
      toast.error(error.message || "Failed to update claim");
    } finally {
      setProcessingId(null);
    }
  };

  const handleJustificationConfirm = (reason: string, notes: string) => {
    const claimId = justificationClaimId || selectedClaim?.id;
    if (!claimId || !justificationAction) return;
    const action = justificationAction === "deny" ? "denied" : justificationAction;
    updateClaimStatus(claimId, action, reason, notes);
    setJustificationDialogOpen(false);
    setJustificationAction(null);
    setJustificationClaimId(null);
  };

  const openJustificationDialog = (action: "flag" | "unflag" | "deny", claimId?: string) => {
    setJustificationAction(action);
    setJustificationClaimId(claimId || null);
    setJustificationDialogOpen(true);
  };

  const getStatusBadge = (status: string, flagged?: boolean) => {
    if (flagged && status === "pending") {
      return <Badge className="bg-orange-100 text-orange-800 hover:bg-orange-100"><AlertTriangle className="h-3 w-3 mr-1" />Flagged</Badge>;
    }
    switch (status) {
      case "approved":
        return <Badge className="bg-green-100 text-green-800 hover:bg-green-100">Approved</Badge>;
      case "denied":
        return <Badge className="bg-red-100 text-red-800 hover:bg-red-100">Denied</Badge>;
      default:
        return <Badge className="bg-yellow-100 text-yellow-800 hover:bg-yellow-100">Pending</Badge>;
    }
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Company Claim Requests</h1>
          <p className="mt-1 text-muted-foreground">
            Review and approve company claim requests from employers
          </p>
        </div>

        {isLoading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : claims.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <Clock className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-muted-foreground">No claim requests yet.</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {claims.map((claim) => (
              <Card key={claim.id}>
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="text-lg flex items-center gap-2">
                        <Building2 className="h-5 w-5" />
                        {claim.company_name}
                      </CardTitle>
                      <CardDescription className="mt-1">
                        Submitted {new Date(claim.created_at).toLocaleDateString()}
                      </CardDescription>
                    </div>
                    {getStatusBadge(claim.status, claim.flagged)}
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Mail className="h-4 w-4" />
                    {claim.work_email}
                  </div>
                  <div className="flex gap-3 pt-2">
                    <Button variant="outline" onClick={() => viewClaimDetails(claim.id)} className="flex-1">
                      <Eye className="h-4 w-4 mr-2" />
                      View Details
                    </Button>
                    {claim.status === "pending" && (
                      <>
                        <Button onClick={() => updateClaimStatus(claim.id, "approved")} disabled={processingId === claim.id}>
                          {processingId === claim.id ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <CheckCircle className="h-4 w-4 mr-2" />}
                          Approve
                        </Button>
                        <Button variant="outline" onClick={() => openJustificationDialog("deny", claim.id)} disabled={processingId === claim.id}>
                          <XCircle className="h-4 w-4 mr-2" />
                          Deny
                        </Button>
                      </>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        <Dialog open={detailsDialogOpen} onOpenChange={setDetailsDialogOpen}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {selectedClaim?.company_name || "Claim Details"}
              </DialogTitle>
              <DialogDescription className="space-y-1">
                <div>Claim Request Date: {selectedClaim && new Date(selectedClaim.created_at).toLocaleDateString('en-CA')}</div>
                <div>Status: {selectedClaim?.flagged ? 'Flagged' : selectedClaim?.status ? selectedClaim.status.charAt(0).toUpperCase() + selectedClaim.status.slice(1) : 'Pending'}</div>
              </DialogDescription>
            </DialogHeader>

            {isLoadingDetails ? (
              <div className="flex justify-center py-8">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : selectedClaim ? (
              <div className="divide-y divide-border">

                <Collapsible open={openSections.requester} onOpenChange={() => toggleSection('requester')} className="py-3 first:pt-0">
                  <SectionHeader title="Requester Information" section="requester" />
                  <CollapsibleContent>
                    <div className="pt-2 space-y-1">
                      <DataRow label="Full Name" value={selectedClaim.full_name} />
                      <DataRow label="Job Title" value={selectedClaim.job_title} />
                    </div>
                  </CollapsibleContent>
                </Collapsible>

                <Collapsible open={openSections.contact} onOpenChange={() => toggleSection('contact')} className="py-3">
                  <SectionHeader title="Contact Information" section="contact" />
                  <CollapsibleContent>
                    <div className="pt-2 space-y-1">
                      <DataRow label="Work Email" value={selectedClaim.work_email} />
                      <DataRow label="Phone Number" value={selectedClaim.phone_number} />
                    </div>
                  </CollapsibleContent>
                </Collapsible>

                <Collapsible open={openSections.company} onOpenChange={() => toggleSection('company')} className="py-3">
                  <SectionHeader title="Company Information" section="company" />
                  <CollapsibleContent>
                    <div className="pt-2 space-y-1">
                      <DataRow label="Company Name" value={selectedClaim.company_name} />
                      <DataRow label="Company Website" value={selectedClaim.company_website} isLink />
                    </div>
                  </CollapsibleContent>
                </Collapsible>

                <Collapsible open={openSections.message} onOpenChange={() => toggleSection('message')} className="py-3">
                  <SectionHeader title="Why They Want to Claim" section="message" />
                  <CollapsibleContent>
                    <div className="p-4 bg-muted/30 rounded-lg mt-2 text-sm">
                      {selectedClaim.message ? (
                        <p className="whitespace-pre-wrap">{selectedClaim.message}</p>
                      ) : (
                        <p className="text-muted-foreground italic">No message provided</p>
                      )}
                    </div>
                  </CollapsibleContent>
                </Collapsible>

                <Collapsible open={openSections.supervisor} onOpenChange={() => toggleSection('supervisor')} className="py-3">
                  <SectionHeader title="Supervisor/CEO Contact" section="supervisor" />
                  <CollapsibleContent>
                    <div className="pt-2 space-y-1">
                      <DataRow label="Supervisor Name" value={selectedClaim.supervisor_name} />
                      <DataRow label="Supervisor Email" value={selectedClaim.supervisor_email} isLink={!!selectedClaim.supervisor_email} />
                    </div>
                  </CollapsibleContent>
                </Collapsible>

                <div className="py-3">
                  <ClaimHistorySection claimId={selectedClaim.id} />
                </div>

                {selectedClaim.status === "pending" && (
                  <div className="flex flex-wrap gap-3 pt-4 border-t">
                    <Button onClick={() => updateClaimStatus(selectedClaim.id, "approved")} disabled={processingId === selectedClaim.id} className="flex-1">
                      {processingId === selectedClaim.id ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <CheckCircle className="h-4 w-4 mr-2" />}
                      Approve
                    </Button>
                    {selectedClaim.flagged ? (
                      <Button variant="outline" onClick={() => openJustificationDialog("unflag")} disabled={processingId === selectedClaim.id} className="flex-1">
                        <Flag className="h-4 w-4 mr-2" />
                        Unflag
                      </Button>
                    ) : (
                      <Button variant="outline" onClick={() => openJustificationDialog("flag")} disabled={processingId === selectedClaim.id} className="flex-1">
                        <Flag className="h-4 w-4 mr-2" />
                        Flag for Review
                      </Button>
                    )}
                    <Button variant="destructive" onClick={() => openJustificationDialog("deny")} disabled={processingId === selectedClaim.id} className="flex-1">
                      <XCircle className="h-4 w-4 mr-2" />
                      Deny
                    </Button>
                  </div>
                )}
              </div>
            ) : null}
          </DialogContent>
        </Dialog>

        <ClaimJustificationDialog
          isOpen={justificationDialogOpen}
          action={justificationAction}
          onConfirm={handleJustificationConfirm}
          onCancel={() => {
            setJustificationDialogOpen(false);
            setJustificationAction(null);
            setJustificationClaimId(null);
          }}
          isProcessing={processingId === (justificationClaimId || selectedClaim?.id)}
        />
      </div>
    </AdminLayout>
  );
};

export default AdminClaims;
