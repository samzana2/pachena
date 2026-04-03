"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { createBrowserSupabaseClient } from "@/lib/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { 
  Plus, 
  Pencil, 
  Trash2, 
  Eye, 
  EyeOff, 
  Loader2,
  Briefcase,
  Users,
  Clock
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import JobEditor from "./JobEditor";
import ApplicationsViewer from "./ApplicationsViewer";
const supabase = createBrowserSupabaseClient();

interface Job {
  id: string;
  title: string;
  location: string | null;
  job_type: string | null;
  is_active: boolean | null;
  is_remote: boolean | null;
  created_at: string;
  expires_at: string | null;
  application_count?: number;
}

interface JobsManagerProps {
  companyId: string;
}

const JOB_TYPE_LABELS: Record<string, string> = {
  full_time: "Full-time",
  part_time: "Part-time",
  contract: "Contract",
  internship: "Internship",
  temporary: "Temporary",
};

const JobsManager = ({ companyId }: JobsManagerProps) => {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [editingJob, setEditingJob] = useState<string | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [viewingApplicationsFor, setViewingApplicationsFor] = useState<string | null>(null);
  const [deletingJobId, setDeletingJobId] = useState<string | null>(null);
  const { toast } = useToast();

  const fetchJobs = async () => {
    setIsLoading(true);
    try {
      // Fetch jobs
      const { data: jobsData, error } = await supabase
        .from("jobs")
        .select("*")
        .eq("company_id", companyId)
        .order("created_at", { ascending: false });

      if (error) throw error;

      // Fetch application counts for each job
      const jobIds = (jobsData || []).map(j => j.id);
      
      if (jobIds.length > 0) {
        const { data: appCounts } = await supabase
          .from("job_applications")
          .select("job_id")
          .in("job_id", jobIds);

        const countMap: Record<string, number> = {};
        appCounts?.forEach(app => {
          countMap[app.job_id] = (countMap[app.job_id] || 0) + 1;
        });

        setJobs((jobsData || []).map(job => ({
          ...job,
          application_count: countMap[job.id] || 0
        })));
      } else {
        setJobs([]);
      }
    } catch (error) {
      console.error("Error fetching jobs:", error);
      toast({
        title: "Error",
        description: "Failed to load jobs",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchJobs();
  }, [companyId]);

  const handleToggleActive = async (jobId: string, currentState: boolean) => {
    try {
      const { error } = await supabase
        .from("jobs")
        .update({ is_active: !currentState })
        .eq("id", jobId);

      if (error) throw error;

      setJobs(jobs.map(j => 
        j.id === jobId ? { ...j, is_active: !currentState } : j
      ));

      toast({
        title: !currentState ? "Job activated" : "Job deactivated",
        description: !currentState 
          ? "This job is now visible to job seekers" 
          : "This job is now hidden from job seekers",
      });
    } catch (error) {
      console.error("Error toggling job:", error);
      toast({
        title: "Error",
        description: "Failed to update job status",
        variant: "destructive",
      });
    }
  };

  const handleDeleteJob = async (jobId: string) => {
    setDeletingJobId(jobId);
    try {
      const { error } = await supabase
        .from("jobs")
        .delete()
        .eq("id", jobId);

      if (error) throw error;

      setJobs(jobs.filter(j => j.id !== jobId));
      toast({
        title: "Job deleted",
        description: "The job posting has been removed",
      });
    } catch (error) {
      console.error("Error deleting job:", error);
      toast({
        title: "Error",
        description: "Failed to delete job",
        variant: "destructive",
      });
    } finally {
      setDeletingJobId(null);
    }
  };

  const handleEditorClose = (saved: boolean) => {
    setEditingJob(null);
    setIsCreating(false);
    if (saved) {
      fetchJobs();
    }
  };

  // Stats
  const activeJobs = jobs.filter(j => j.is_active).length;
  const totalApplications = jobs.reduce((sum, j) => sum + (j.application_count || 0), 0);
  const recentJobs = jobs.filter(j => {
    const created = new Date(j.created_at);
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    return created > weekAgo;
  }).length;

  if (editingJob || isCreating) {
    return (
      <JobEditor
        companyId={companyId}
        jobId={editingJob}
        onClose={handleEditorClose}
      />
    );
  }

  if (viewingApplicationsFor) {
    const job = jobs.find(j => j.id === viewingApplicationsFor);
    return (
      <ApplicationsViewer
        jobId={viewingApplicationsFor}
        jobTitle={job?.title || "Job"}
        onBack={() => setViewingApplicationsFor(null)}
      />
    );
  }

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Jobs</CardTitle>
            <Briefcase className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{activeJobs}</div>
            <p className="text-xs text-muted-foreground">
              of {jobs.length} total postings
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Applications</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalApplications}</div>
            <p className="text-xs text-muted-foreground">
              across all job postings
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Posted This Week</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{recentJobs}</div>
            <p className="text-xs text-muted-foreground">
              new job postings
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Jobs Table */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Job Postings</CardTitle>
          <Button onClick={() => setIsCreating(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Create Job
          </Button>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
            </div>
          ) : jobs.length === 0 ? (
            <div className="text-center py-8">
              <Briefcase className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold">No jobs posted yet</h3>
              <p className="text-muted-foreground mt-1">
                Create your first job posting to start receiving applications.
              </p>
              <Button onClick={() => setIsCreating(true)} className="mt-4">
                <Plus className="h-4 w-4 mr-2" />
                Create Your First Job
              </Button>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Job Title</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Location</TableHead>
                  <TableHead>Applications</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Posted</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {jobs.map((job) => (
                  <TableRow key={job.id}>
                    <TableCell className="font-medium">{job.title}</TableCell>
                    <TableCell>
                      <Badge variant="secondary" className="text-xs">
                        {(job.job_type && JOB_TYPE_LABELS[job.job_type]) || job.job_type || "—"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {job.location || "—"}
                      {job.is_remote && (
                        <Badge variant="outline" className="ml-2 text-xs">Remote</Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setViewingApplicationsFor(job.id)}
                        className="h-auto py-1 px-2"
                      >
                        <Users className="h-3 w-3 mr-1" />
                        {job.application_count || 0}
                      </Button>
                    </TableCell>
                    <TableCell>
                      <Badge variant={job.is_active ? "default" : "secondary"}>
                        {job.is_active ? "Active" : "Inactive"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-muted-foreground text-sm">
                      {formatDistanceToNow(new Date(job.created_at), { addSuffix: true })}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleToggleActive(job.id, job.is_active ?? false)}
                          title={job.is_active ? "Deactivate" : "Activate"}
                        >
                          {job.is_active ? (
                            <EyeOff className="h-4 w-4" />
                          ) : (
                            <Eye className="h-4 w-4" />
                          )}
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => setEditingJob(job.id)}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Delete Job Posting?</AlertDialogTitle>
                              <AlertDialogDescription>
                                This will permanently delete "{job.title}" and all associated applications.
                                This action cannot be undone.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() => handleDeleteJob(job.id)}
                                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                              >
                                {deletingJobId === job.id ? (
                                  <Loader2 className="h-4 w-4 animate-spin" />
                                ) : (
                                  "Delete"
                                )}
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default JobsManager;
