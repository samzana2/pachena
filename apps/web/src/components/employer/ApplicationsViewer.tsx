"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { createBrowserSupabaseClient } from "@/lib/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { 
  ArrowLeft, 
  Loader2, 
  Mail, 
  Phone, 
  FileText,
  ExternalLink,
  Globe,
  User,
  Clock
} from "lucide-react";
import { formatDistanceToNow, format } from "date-fns";
const supabase = createBrowserSupabaseClient();

interface Application {
  id: string;
  full_name: string;
  email: string;
  phone: string | null;
  resume_url: string | null;
  cover_letter: string | null;
  linkedin_url: string | null;
  portfolio_url: string | null;
  status: string;
  employer_notes: string | null;
  created_at: string;
}

interface ApplicationsViewerProps {
  jobId: string;
  jobTitle: string;
  onBack: () => void;
}

const STATUS_OPTIONS = [
  { value: "pending", label: "Pending", color: "secondary" },
  { value: "reviewed", label: "Reviewed", color: "outline" },
  { value: "shortlisted", label: "Shortlisted", color: "default" },
  { value: "rejected", label: "Rejected", color: "destructive" },
];

const ApplicationsViewer = ({ jobId, jobTitle, onBack }: ApplicationsViewerProps) => {
  const [applications, setApplications] = useState<Application[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedApplication, setSelectedApplication] = useState<Application | null>(null);
  const [notes, setNotes] = useState("");
  const [isSavingNotes, setIsSavingNotes] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    fetchApplications();
  }, [jobId]);

  const fetchApplications = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from("job_applications")
        .select("*")
        .eq("job_id", jobId)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setApplications(data || []);
    } catch (error) {
      console.error("Error fetching applications:", error);
      toast({
        title: "Error",
        description: "Failed to load applications",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleStatusChange = async (applicationId: string, newStatus: string) => {
    try {
      const { error } = await supabase
        .from("job_applications")
        .update({ status: newStatus })
        .eq("id", applicationId);

      if (error) throw error;

      setApplications(applications.map(app =>
        app.id === applicationId ? { ...app, status: newStatus } : app
      ));

      if (selectedApplication?.id === applicationId) {
        setSelectedApplication({ ...selectedApplication, status: newStatus });
      }

      toast({
        title: "Status updated",
        description: `Application marked as ${newStatus}`,
      });
    } catch (error) {
      console.error("Error updating status:", error);
      toast({
        title: "Error",
        description: "Failed to update status",
        variant: "destructive",
      });
    }
  };

  const handleSaveNotes = async () => {
    if (!selectedApplication) return;

    setIsSavingNotes(true);
    try {
      const { error } = await supabase
        .from("job_applications")
        .update({ employer_notes: notes })
        .eq("id", selectedApplication.id);

      if (error) throw error;

      setApplications(applications.map(app =>
        app.id === selectedApplication.id ? { ...app, employer_notes: notes } : app
      ));
      setSelectedApplication({ ...selectedApplication, employer_notes: notes });

      toast({
        title: "Notes saved",
        description: "Your notes have been saved",
      });
    } catch (error) {
      console.error("Error saving notes:", error);
      toast({
        title: "Error",
        description: "Failed to save notes",
        variant: "destructive",
      });
    } finally {
      setIsSavingNotes(false);
    }
  };

  const openApplicationDetail = (app: Application) => {
    setSelectedApplication(app);
    setNotes(app.employer_notes || "");
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = STATUS_OPTIONS.find(s => s.value === status) || STATUS_OPTIONS[0];
    return (
      <Badge variant={statusConfig.color as any}>
        {statusConfig.label}
      </Badge>
    );
  };

  // Stats
  const pendingCount = applications.filter(a => a.status === "pending").length;
  const shortlistedCount = applications.filter(a => a.status === "shortlisted").length;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" onClick={onBack}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Jobs
        </Button>
        <div>
          <h2 className="text-xl font-semibold">Applications for {jobTitle}</h2>
          <p className="text-sm text-muted-foreground">
            {applications.length} application{applications.length !== 1 ? "s" : ""} received
            {pendingCount > 0 && ` • ${pendingCount} pending review`}
          </p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All Applications</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
            </div>
          ) : applications.length === 0 ? (
            <div className="text-center py-8">
              <User className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold">No applications yet</h3>
              <p className="text-muted-foreground mt-1">
                Applications will appear here when candidates apply.
              </p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Applicant</TableHead>
                  <TableHead>Contact</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Applied</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {applications.map((app) => (
                  <TableRow key={app.id}>
                    <TableCell>
                      <div>
                        <p className="font-medium">{app.full_name}</p>
                        {app.resume_url && (
                          <a
                            href={app.resume_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-xs text-primary hover:underline flex items-center gap-1"
                          >
                            <FileText className="h-3 w-3" />
                            View Resume
                          </a>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        <a
                          href={`mailto:${app.email}`}
                          className="text-sm text-primary hover:underline flex items-center gap-1"
                        >
                          <Mail className="h-3 w-3" />
                          {app.email}
                        </a>
                        {app.phone && (
                          <p className="text-sm text-muted-foreground flex items-center gap-1">
                            <Phone className="h-3 w-3" />
                            {app.phone}
                          </p>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Select
                        value={app.status}
                        onValueChange={(value) => handleStatusChange(app.id, value)}
                      >
                        <SelectTrigger className="w-[130px] h-8">
                          <SelectValue>{getStatusBadge(app.status)}</SelectValue>
                        </SelectTrigger>
                        <SelectContent>
                          {STATUS_OPTIONS.map((status) => (
                            <SelectItem key={status.value} value={status.value}>
                              {status.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </TableCell>
                    <TableCell className="text-muted-foreground text-sm">
                      <span className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {formatDistanceToNow(new Date(app.created_at), { addSuffix: true })}
                      </span>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => openApplicationDetail(app)}
                      >
                        View Details
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Application Detail Dialog */}
      <Dialog open={!!selectedApplication} onOpenChange={() => setSelectedApplication(null)}>
        <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Application Details</DialogTitle>
          </DialogHeader>

          {selectedApplication && (
            <div className="space-y-6">
              {/* Applicant Info */}
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="text-lg font-semibold">{selectedApplication.full_name}</h3>
                  <p className="text-sm text-muted-foreground">
                    Applied {format(new Date(selectedApplication.created_at), "PPP")}
                  </p>
                </div>
                <Select
                  value={selectedApplication.status}
                  onValueChange={(value) => handleStatusChange(selectedApplication.id, value)}
                >
                  <SelectTrigger className="w-[130px]">
                    <SelectValue>{getStatusBadge(selectedApplication.status)}</SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    {STATUS_OPTIONS.map((status) => (
                      <SelectItem key={status.value} value={status.value}>
                        {status.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Contact Info */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <p className="text-sm font-medium text-muted-foreground">Email</p>
                  <a
                    href={`mailto:${selectedApplication.email}`}
                    className="text-primary hover:underline flex items-center gap-2"
                  >
                    <Mail className="h-4 w-4" />
                    {selectedApplication.email}
                  </a>
                </div>
                {selectedApplication.phone && (
                  <div className="space-y-2">
                    <p className="text-sm font-medium text-muted-foreground">Phone</p>
                    <p className="flex items-center gap-2">
                      <Phone className="h-4 w-4" />
                      {selectedApplication.phone}
                    </p>
                  </div>
                )}
              </div>

              {/* Links */}
              <div className="flex flex-wrap gap-3">
                {selectedApplication.resume_url && (
                  <Button variant="outline" size="sm" asChild>
                    <a
                      href={selectedApplication.resume_url}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <FileText className="h-4 w-4 mr-2" />
                      Download Resume
                    </a>
                  </Button>
                )}
                {selectedApplication.linkedin_url && (
                  <Button variant="outline" size="sm" asChild>
                    <a
                      href={selectedApplication.linkedin_url}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <ExternalLink className="h-4 w-4 mr-2" />
                      LinkedIn
                    </a>
                  </Button>
                )}
                {selectedApplication.portfolio_url && (
                  <Button variant="outline" size="sm" asChild>
                    <a
                      href={selectedApplication.portfolio_url}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <Globe className="h-4 w-4 mr-2" />
                      Portfolio
                    </a>
                  </Button>
                )}
              </div>

              {/* Cover Letter */}
              {selectedApplication.cover_letter && (
                <div className="space-y-2">
                  <p className="text-sm font-medium">Cover Letter</p>
                  <div className="bg-muted p-4 rounded-lg">
                    <p className="text-sm whitespace-pre-wrap">{selectedApplication.cover_letter}</p>
                  </div>
                </div>
              )}

              {/* Employer Notes */}
              <div className="space-y-2">
                <p className="text-sm font-medium">Your Notes</p>
                <Textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Add notes about this candidate..."
                  rows={3}
                />
                <Button
                  size="sm"
                  onClick={handleSaveNotes}
                  disabled={isSavingNotes || notes === (selectedApplication.employer_notes || "")}
                >
                  {isSavingNotes ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    "Save Notes"
                  )}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ApplicationsViewer;
