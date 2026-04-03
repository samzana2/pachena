"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { createBrowserSupabaseClient } from "@/lib/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Loader2, Save } from "lucide-react";
const supabase = createBrowserSupabaseClient();

interface JobEditorProps {
  companyId: string;
  jobId: string | null;
  onClose: (saved: boolean) => void;
}

interface JobFormData {
  title: string;
  description: string;
  location: string;
  job_type: string;
  experience_level: string;
  salary_min: string;
  salary_max: string;
  salary_currency: string;
  department: string;
  requirements: string;
  responsibilities: string;
  is_remote: boolean;
  is_active: boolean;
  expires_at: string;
}

const initialFormData: JobFormData = {
  title: "",
  description: "",
  location: "",
  job_type: "full_time",
  experience_level: "",
  salary_min: "",
  salary_max: "",
  salary_currency: "BWP",
  department: "",
  requirements: "",
  responsibilities: "",
  is_remote: false,
  is_active: true,
  expires_at: "",
};

const JobEditor = ({ companyId, jobId, onClose }: JobEditorProps) => {
  const [formData, setFormData] = useState<JobFormData>(initialFormData);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (jobId) {
      fetchJob();
    }
  }, [jobId]);

  const fetchJob = async () => {
    if (!jobId) return;
    
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from("jobs")
        .select("*")
        .eq("id", jobId)
        .single();

      if (error) throw error;

      setFormData({
        title: data.title || "",
        description: data.description || "",
        location: data.location || "",
        job_type: data.job_type || "full_time",
        experience_level: data.experience_level || "",
        salary_min: data.salary_min?.toString() || "",
        salary_max: data.salary_max?.toString() || "",
        salary_currency: data.salary_currency || "BWP",
        department: data.department || "",
        requirements: data.requirements || "",
        responsibilities: data.responsibilities || "",
        is_remote: data.is_remote || false,
        is_active: data.is_active ?? true,
        expires_at: data.expires_at ? data.expires_at.split("T")[0] : "",
      });
    } catch (error) {
      console.error("Error fetching job:", error);
      toast({
        title: "Error",
        description: "Failed to load job details",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.title.trim() || !formData.description.trim()) {
      toast({
        title: "Missing fields",
        description: "Title and description are required",
        variant: "destructive",
      });
      return;
    }

    setIsSaving(true);

    try {
      const jobData = {
        company_id: companyId,
        title: formData.title.trim(),
        description: formData.description.trim(),
        location: formData.location.trim() || null,
        job_type: formData.job_type,
        experience_level: formData.experience_level || null,
        salary_min: formData.salary_min ? parseInt(formData.salary_min) : null,
        salary_max: formData.salary_max ? parseInt(formData.salary_max) : null,
        salary_currency: formData.salary_currency,
        department: formData.department.trim() || null,
        requirements: formData.requirements.trim() || null,
        responsibilities: formData.responsibilities.trim() || null,
        is_remote: formData.is_remote,
        is_active: formData.is_active,
        expires_at: formData.expires_at ? new Date(formData.expires_at).toISOString() : null,
      };

      if (jobId) {
        const { error } = await supabase
          .from("jobs")
          .update(jobData)
          .eq("id", jobId);

        if (error) throw error;

        toast({
          title: "Job updated",
          description: "Your job posting has been updated successfully.",
        });
      } else {
        const { error } = await supabase
          .from("jobs")
          .insert(jobData);

        if (error) throw error;

        toast({
          title: "Job created",
          description: "Your job posting is now live.",
        });
      }

      onClose(true);
    } catch (error) {
      console.error("Error saving job:", error);
      toast({
        title: "Error",
        description: "Failed to save job posting",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" onClick={() => onClose(false)}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Jobs
        </Button>
        <h2 className="text-xl font-semibold">
          {jobId ? "Edit Job Posting" : "Create New Job"}
        </h2>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Basic Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="title">Job Title *</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="e.g. Senior Software Engineer"
                required
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="job_type">Job Type *</Label>
                <Select
                  value={formData.job_type}
                  onValueChange={(value) => setFormData({ ...formData, job_type: value })}
                >
                  <SelectTrigger id="job_type">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="full_time">Full-time</SelectItem>
                    <SelectItem value="part_time">Part-time</SelectItem>
                    <SelectItem value="contract">Contract</SelectItem>
                    <SelectItem value="internship">Internship</SelectItem>
                    <SelectItem value="temporary">Temporary</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="experience_level">Experience Level</Label>
                <Select
                  value={formData.experience_level}
                  onValueChange={(value) => setFormData({ ...formData, experience_level: value })}
                >
                  <SelectTrigger id="experience_level">
                    <SelectValue placeholder="Select level" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="entry">Entry Level</SelectItem>
                    <SelectItem value="mid">Mid Level</SelectItem>
                    <SelectItem value="senior">Senior</SelectItem>
                    <SelectItem value="executive">Executive</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="location">Location</Label>
                <Input
                  id="location"
                  value={formData.location}
                  onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                  placeholder="e.g. Gaborone, Botswana"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="department">Department</Label>
                <Input
                  id="department"
                  value={formData.department}
                  onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                  placeholder="e.g. Engineering"
                />
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <Switch
                id="is_remote"
                checked={formData.is_remote}
                onCheckedChange={(checked) => setFormData({ ...formData, is_remote: checked })}
              />
              <Label htmlFor="is_remote">Remote-friendly position</Label>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Job Description</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="description">Description *</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Describe the role, team, and what the candidate will be doing..."
                rows={6}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="requirements">Requirements</Label>
              <Textarea
                id="requirements"
                value={formData.requirements}
                onChange={(e) => setFormData({ ...formData, requirements: e.target.value })}
                placeholder="List the qualifications, skills, and experience required..."
                rows={4}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="responsibilities">Responsibilities</Label>
              <Textarea
                id="responsibilities"
                value={formData.responsibilities}
                onChange={(e) => setFormData({ ...formData, responsibilities: e.target.value })}
                placeholder="List the key responsibilities of this role..."
                rows={4}
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Compensation</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="salary_currency">Currency</Label>
                <Select
                  value={formData.salary_currency}
                  onValueChange={(value) => setFormData({ ...formData, salary_currency: value })}
                >
                  <SelectTrigger id="salary_currency">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="BWP">BWP (Pula)</SelectItem>
                    <SelectItem value="USD">USD (Dollar)</SelectItem>
                    <SelectItem value="ZAR">ZAR (Rand)</SelectItem>
                    <SelectItem value="EUR">EUR (Euro)</SelectItem>
                    <SelectItem value="GBP">GBP (Pound)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="salary_min">Minimum Salary</Label>
                <Input
                  id="salary_min"
                  type="number"
                  value={formData.salary_min}
                  onChange={(e) => setFormData({ ...formData, salary_min: e.target.value })}
                  placeholder="e.g. 50000"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="salary_max">Maximum Salary</Label>
                <Input
                  id="salary_max"
                  type="number"
                  value={formData.salary_max}
                  onChange={(e) => setFormData({ ...formData, salary_max: e.target.value })}
                  placeholder="e.g. 80000"
                />
              </div>
            </div>
            <p className="text-xs text-muted-foreground">
              Salary information is optional but helps attract qualified candidates.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Publishing Options</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="is_active">Active</Label>
                <p className="text-sm text-muted-foreground">
                  Make this job visible to job seekers
                </p>
              </div>
              <Switch
                id="is_active"
                checked={formData.is_active}
                onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="expires_at">Expiration Date (optional)</Label>
              <Input
                id="expires_at"
                type="date"
                value={formData.expires_at}
                onChange={(e) => setFormData({ ...formData, expires_at: e.target.value })}
                min={new Date().toISOString().split("T")[0]}
              />
              <p className="text-xs text-muted-foreground">
                The job will automatically be hidden after this date.
              </p>
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-end gap-3">
          <Button type="button" variant="outline" onClick={() => onClose(false)}>
            Cancel
          </Button>
          <Button type="submit" disabled={isSaving}>
            {isSaving ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="h-4 w-4 mr-2" />
                {jobId ? "Update Job" : "Create Job"}
              </>
            )}
          </Button>
        </div>
      </form>
    </div>
  );
};

export default JobEditor;
