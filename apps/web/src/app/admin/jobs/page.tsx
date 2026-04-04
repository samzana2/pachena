"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import AdminLayout from "@/components/admin/AdminLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { createBrowserSupabaseClient } from "@/lib/supabase/client";
import { toast } from "sonner";
import { Plus, Archive, CheckCircle, AlertTriangle } from "lucide-react";
import { format, differenceInDays } from "date-fns";

const supabase = createBrowserSupabaseClient();

interface AdminJob {
  id: string;
  title: string;
  job_type: string;
  source_type: string;
  source_url: string | null;
  is_active: boolean;
  archived_at: string | null;
  archive_reason: string | null;
  created_at: string;
  expires_at: string | null;
  companies: { name: string };
}

const AdminJobs = () => {
  const [jobs, setJobs] = useState<AdminJob[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");

  useEffect(() => { fetchJobs(); }, [filter]);

  const fetchJobs = async () => {
    setLoading(true);
    let query = supabase
      .from("jobs")
      .select("id, title, job_type, source_type, source_url, is_active, archived_at, archive_reason, created_at, expires_at, companies(name)")
      .order("created_at", { ascending: false });

    if (filter === "active") query = query.is("archived_at", null).eq("is_active", true);
    if (filter === "archived") query = query.not("archived_at", "is", null);
    if (filter === "seeded") query = query.eq("source_type", "seeded");
    if (filter === "employer") query = query.eq("source_type", "employer");

    const { data, error } = await query;
    if (!error && data) setJobs(data as unknown as AdminJob[]);
    setLoading(false);
  };

  const markAsFilled = async (id: string) => {
    const { error } = await supabase
      .from("jobs")
      .update({ archived_at: new Date().toISOString(), archive_reason: "filled", is_active: false } as any)
      .eq("id", id);
    if (error) toast.error("Failed to archive job");
    else { toast.success("Job marked as filled"); fetchJobs(); }
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Job Board Management</h1>
            <p className="text-sm text-muted-foreground">{jobs.length} total jobs</p>
          </div>
          <Link href="/admin/seed-job">
            <Button><Plus className="h-4 w-4 mr-2" /> Seed Job</Button>
          </Link>
        </div>

        <div className="flex gap-3">
          <Select value={filter} onValueChange={setFilter}>
            <SelectTrigger className="w-44">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Jobs</SelectItem>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="archived">Archived</SelectItem>
              <SelectItem value="seeded">Seeded</SelectItem>
              <SelectItem value="employer">Employer</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Title</TableHead>
                  <TableHead>Company</TableHead>
                  <TableHead>Source</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Expires</TableHead>
                  <TableHead></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow><TableCell colSpan={6} className="text-center py-8 text-muted-foreground">Loading...</TableCell></TableRow>
                ) : jobs.length === 0 ? (
                  <TableRow><TableCell colSpan={6} className="text-center py-8 text-muted-foreground">No jobs found</TableCell></TableRow>
                ) : (
                  jobs.map((job) => {
                    const daysLeft = job.expires_at ? differenceInDays(new Date(job.expires_at), new Date()) : null;
                    const expiring = daysLeft !== null && daysLeft <= 7 && daysLeft >= 0;
                    return (
                      <TableRow key={job.id}>
                        <TableCell className="font-medium">{job.title}</TableCell>
                        <TableCell>{(job.companies as any)?.name}</TableCell>
                        <TableCell>
                          <Badge variant={job.source_type === "seeded" ? "secondary" : "outline"}>
                            {job.source_type}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {job.archived_at ? (
                            <Badge variant="outline" className="text-muted-foreground">
                              <Archive className="h-3 w-3 mr-1" />
                              {job.archive_reason || "archived"}
                            </Badge>
                          ) : (
                            <Badge className="bg-green-100 text-green-700 hover:bg-green-100">Active</Badge>
                          )}
                        </TableCell>
                        <TableCell>
                          {job.expires_at ? (
                            <span className={expiring ? "text-destructive font-medium" : "text-muted-foreground"}>
                              {expiring && <AlertTriangle className="h-3 w-3 inline mr-1" />}
                              {format(new Date(job.expires_at), "MMM d, yyyy")}
                            </span>
                          ) : (
                            <span className="text-muted-foreground">—</span>
                          )}
                        </TableCell>
                        <TableCell>
                          {!job.archived_at && (
                            <Button variant="ghost" size="sm" onClick={() => markAsFilled(job.id)}>
                              <CheckCircle className="h-4 w-4 mr-1" /> Filled
                            </Button>
                          )}
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
};

export default AdminJobs;
