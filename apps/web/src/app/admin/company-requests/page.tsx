"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import AdminLayout from "@/components/admin/AdminLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { createBrowserSupabaseClient } from "@/lib/supabase/client";
import { toast } from "sonner";
import { Check, X, Loader2, Building2, ExternalLink, Filter } from "lucide-react";
import { format } from "date-fns";

interface CompanyRequest {
  id: string;
  company_name: string;
  industry: string | null;
  location: string | null;
  website: string | null;
  requester_email: string | null;
  status: string;
  admin_notes: string | null;
  created_at: string;
  reviewed_at: string | null;
}

type StatusFilter = "all" | "pending" | "approved" | "rejected";

const supabase = createBrowserSupabaseClient();

export default function AdminCompanyRequests() {
  const router = useRouter();
  const [requests, setRequests] = useState<CompanyRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedRequest, setSelectedRequest] = useState<CompanyRequest | null>(null);
  const [actionType, setActionType] = useState<"approve" | "reject" | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [adminNotes, setAdminNotes] = useState("");
  const [companySlug, setCompanySlug] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");

  const filteredRequests = useMemo(() => {
    if (statusFilter === "all") return requests;
    return requests.filter((r) => r.status === statusFilter);
  }, [requests, statusFilter]);

  const fetchRequests = async () => {
    setIsLoading(true);
    const { data, error } = await supabase
      .from("company_requests")
      .select("*")
      .order("created_at", { ascending: false });

    if (!error && data) {
      setRequests(data);
    }
    setIsLoading(false);
  };

  useEffect(() => {
    fetchRequests();
  }, []);

  const generateSlug = (name: string) => {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "");
  };

  const handleOpenAction = (request: CompanyRequest, action: "approve" | "reject") => {
    setSelectedRequest(request);
    setActionType(action);
    setAdminNotes("");
    if (action === "approve") {
      setCompanySlug(generateSlug(request.company_name));
    }
  };

  const handleCloseAction = () => {
    setSelectedRequest(null);
    setActionType(null);
    setAdminNotes("");
    setCompanySlug("");
  };

  const handleApprove = async () => {
    if (!selectedRequest || !companySlug.trim()) return;

    setIsProcessing(true);

    const { data: companyData, error: companyError } = await supabase.from("companies").insert({
      name: selectedRequest.company_name,
      slug: companySlug.trim(),
      industry: selectedRequest.industry,
      location: selectedRequest.location,
      website: selectedRequest.website,
    }).select('id').single();

    if (companyError) {
      toast.error("Failed to create company: " + companyError.message);
      setIsProcessing(false);
      return;
    }

    const newCompanyId = companyData.id;

    const { error: updateError } = await supabase
      .from("company_requests")
      .update({
        status: "approved",
        admin_notes: adminNotes || null,
        reviewed_at: new Date().toISOString(),
      })
      .eq("id", selectedRequest.id);

    if (updateError) {
      toast.error("Failed to update request status");
      setIsProcessing(false);
      return;
    }

    if (selectedRequest.requester_email) {
      try {
        const { error: emailError } = await supabase.functions.invoke("send-company-approved-email", {
          body: {
            email: selectedRequest.requester_email,
            company_name: selectedRequest.company_name,
            company_slug: companySlug.trim(),
          },
        });

        if (emailError) {
          console.error("Failed to send approval email:", emailError);
        }
      } catch (emailErr) {
        console.error("Error sending approval email:", emailErr);
      }
    }

    toast.success(`Company "${selectedRequest.company_name}" has been created!`);
    setIsProcessing(false);
    handleCloseAction();
    router.push(`/admin/companies/${newCompanyId}/edit`);
  };

  const handleReject = async () => {
    if (!selectedRequest) return;

    setIsProcessing(true);

    const { error } = await supabase
      .from("company_requests")
      .update({
        status: "rejected",
        admin_notes: adminNotes || null,
        reviewed_at: new Date().toISOString(),
      })
      .eq("id", selectedRequest.id);

    if (error) {
      toast.error("Failed to reject request");
      setIsProcessing(false);
      return;
    }

    toast.success("Request has been rejected");
    setIsProcessing(false);
    handleCloseAction();
    fetchRequests();
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "pending":
        return <Badge variant="secondary">Pending</Badge>;
      case "approved":
        return <Badge className="bg-green-500/10 text-green-500 hover:bg-green-500/20">Approved</Badge>;
      case "rejected":
        return <Badge variant="destructive">Rejected</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const pendingCount = requests.filter((r) => r.status === "pending").length;

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Company Requests</h1>
            <p className="text-muted-foreground">
              Review and approve requests to add new companies
            </p>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-muted-foreground" />
              <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as StatusFilter)}>
                <SelectTrigger className="w-[140px]">
                  <SelectValue placeholder="Filter status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="approved">Approved</SelectItem>
                  <SelectItem value="rejected">Rejected</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {pendingCount > 0 && (
              <Badge variant="secondary" className="text-base px-3 py-1">
                {pendingCount} pending
              </Badge>
            )}
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building2 className="h-5 w-5" />
              All Requests
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex justify-center py-8">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : filteredRequests.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">
                {statusFilter === "all" ? "No company requests yet" : `No ${statusFilter} requests`}
              </p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Company</TableHead>
                    <TableHead>Industry</TableHead>
                    <TableHead>Location</TableHead>
                    <TableHead>Requester</TableHead>
                    <TableHead>Submitted</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Admin Notes</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredRequests.map((request) => (
                    <TableRow key={request.id}>
                      <TableCell>
                        <div className="font-medium">{request.company_name}</div>
                        {request.website && (
                          <a
                            href={request.website.startsWith('http://') || request.website.startsWith('https://') ? request.website : `https://${request.website}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-xs text-primary hover:underline flex items-center gap-1"
                          >
                            Website <ExternalLink className="h-3 w-3" />
                          </a>
                        )}
                      </TableCell>
                      <TableCell>{request.industry || "—"}</TableCell>
                      <TableCell>{request.location || "—"}</TableCell>
                      <TableCell>
                        {request.requester_email || (
                          <span className="text-muted-foreground">Anonymous</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {format(new Date(request.created_at), "MMM d, yyyy")}
                      </TableCell>
                      <TableCell>{getStatusBadge(request.status)}</TableCell>
                      <TableCell>
                        {request.admin_notes ? (
                          <p className="text-xs text-muted-foreground max-w-[200px] truncate" title={request.admin_notes}>
                            {request.admin_notes}
                          </p>
                        ) : (
                          <span className="text-xs text-muted-foreground/50">—</span>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        {request.status === "pending" && (
                          <div className="flex justify-end gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              className="text-green-600 hover:text-green-700"
                              onClick={() => handleOpenAction(request, "approve")}
                            >
                              <Check className="h-4 w-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              className="text-destructive hover:text-destructive"
                              onClick={() => handleOpenAction(request, "reject")}
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          </div>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Approve/Reject Dialog */}
      <Dialog open={!!selectedRequest && !!actionType} onOpenChange={handleCloseAction}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {actionType === "approve" ? "Approve Request" : "Reject Request"}
            </DialogTitle>
            <DialogDescription>
              {actionType === "approve"
                ? `This will create a new company "${selectedRequest?.company_name}" on Pachena.`
                : `This will reject the request to add "${selectedRequest?.company_name}".`}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {actionType === "approve" && (
              <div className="space-y-2">
                <Label htmlFor="slug">Company Slug (URL)</Label>
                <Input
                  id="slug"
                  value={companySlug}
                  onChange={(e) => setCompanySlug(e.target.value)}
                  placeholder="company-name"
                />
                <p className="text-xs text-muted-foreground">
                  This will be used in the company URL: /companies/{companySlug || "slug"}
                </p>
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="notes">Admin Notes (optional)</Label>
              <Textarea
                id="notes"
                value={adminNotes}
                onChange={(e) => setAdminNotes(e.target.value)}
                placeholder={
                  actionType === "approve"
                    ? "Any notes about this approval..."
                    : "Reason for rejection..."
                }
                rows={3}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={handleCloseAction}>
              Cancel
            </Button>
            <Button
              variant={actionType === "approve" ? "default" : "destructive"}
              onClick={actionType === "approve" ? handleApprove : handleReject}
              disabled={isProcessing || (actionType === "approve" && !companySlug.trim())}
            >
              {isProcessing && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {actionType === "approve" ? "Create Company" : "Reject Request"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
}
