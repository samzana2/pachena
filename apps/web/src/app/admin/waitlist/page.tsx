"use client";

import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import AdminLayout from "@/components/admin/AdminLayout";
import { createBrowserSupabaseClient } from "@/lib/supabase/client";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Trash2, Mail, Building2, Calendar, Download } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const supabase = createBrowserSupabaseClient();

interface WaitlistEntry {
  id: string;
  email: string;
  company_name: string | null;
  plan_interest: string;
  created_at: string;
}

const AdminWaitlist = () => {
  const queryClient = useQueryClient();
  const [deleteId, setDeleteId] = useState<string | null>(null);

  useEffect(() => {
    localStorage.setItem("admin_waitlist_viewed", "true");
  }, []);

  const { data: waitlistEntries, isLoading } = useQuery({
    queryKey: ["admin-waitlist"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("waitlist")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data as WaitlistEntry[];
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("waitlist").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-waitlist"] });
      toast.success("Entry removed from waitlist");
      setDeleteId(null);
    },
    onError: () => {
      toast.error("Failed to remove entry");
    },
  });

  const employerWaitlist = waitlistEntries?.filter(
    (e) => e.plan_interest === "employer_early_access"
  ) || [];
  const planWaitlist = waitlistEntries?.filter(
    (e) => e.plan_interest !== "employer_early_access"
  ) || [];

  const getPlanBadgeVariant = (plan: string) => {
    switch (plan) {
      case "Growth":
        return "default";
      case "Enterprise":
        return "secondary";
      case "employer_early_access":
        return "outline";
      default:
        return "outline";
    }
  };

  const getPlanLabel = (plan: string) => {
    if (plan === "employer_early_access") return "Employer Access";
    return plan;
  };

  const handleExportCSV = (entries: WaitlistEntry[], filename: string) => {
    const headers = ["Email", "Company Name", "Signed Up"];
    const rows = entries.map((e) => [
      e.email,
      e.company_name || "",
      format(new Date(e.created_at), "yyyy-MM-dd HH:mm"),
    ]);

    const csvContent = [
      headers.join(","),
      ...rows.map((row) => row.map((cell) => `"${cell}"`).join(",")),
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${filename}-${format(new Date(), "yyyy-MM-dd")}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("CSV exported successfully");
  };

  const renderTable = (entries: WaitlistEntry[], showPlanColumn: boolean) => (
    <div className="rounded-lg border bg-card">
      {isLoading ? (
        <div className="p-8 text-center text-muted-foreground">Loading...</div>
      ) : entries.length === 0 ? (
        <div className="p-8 text-center text-muted-foreground">
          No signups yet
        </div>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Email</TableHead>
              <TableHead>Company</TableHead>
              {showPlanColumn && <TableHead>Plan Interest</TableHead>}
              <TableHead>Signed Up</TableHead>
              <TableHead className="w-[100px]">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {entries.map((entry) => (
              <TableRow key={entry.id}>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <Mail className="h-4 w-4 text-muted-foreground" />
                    <a
                      href={`mailto:${entry.email}`}
                      className="text-foreground hover:underline"
                    >
                      {entry.email}
                    </a>
                  </div>
                </TableCell>
                <TableCell>
                  {entry.company_name ? (
                    <div className="flex items-center gap-2">
                      <Building2 className="h-4 w-4 text-muted-foreground" />
                      {entry.company_name}
                    </div>
                  ) : (
                    <span className="text-muted-foreground">—</span>
                  )}
                </TableCell>
                {showPlanColumn && (
                  <TableCell>
                    <Badge variant={getPlanBadgeVariant(entry.plan_interest) as any}>
                      {getPlanLabel(entry.plan_interest)}
                    </Badge>
                  </TableCell>
                )}
                <TableCell>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Calendar className="h-4 w-4" />
                    {format(new Date(entry.created_at), "MMM d, yyyy")}
                  </div>
                </TableCell>
                <TableCell>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setDeleteId(entry.id)}
                  >
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </div>
  );

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">Waitlist</h1>
          <p className="text-muted-foreground">
            Employers waiting for access and plan signups
          </p>
        </div>

        <Tabs defaultValue="employers" className="space-y-6">
          <TabsList>
            <TabsTrigger value="employers">
              Employer Waitlist ({employerWaitlist.length})
            </TabsTrigger>
            <TabsTrigger value="plans">
              Plan Interest ({planWaitlist.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="employers" className="space-y-4">
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">
                Company representatives waiting to claim their company profiles
              </p>
              {employerWaitlist.length > 0 && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleExportCSV(employerWaitlist, "employer-waitlist")}
                >
                  <Download className="h-4 w-4 mr-2" />
                  Export CSV
                </Button>
              )}
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="rounded-lg border bg-card p-4">
                <p className="text-sm text-muted-foreground">Total Employers</p>
                <p className="text-2xl font-bold">{employerWaitlist.length}</p>
              </div>
              <div className="rounded-lg border bg-card p-4">
                <p className="text-sm text-muted-foreground">With Company Name</p>
                <p className="text-2xl font-bold">
                  {employerWaitlist.filter((e) => e.company_name).length}
                </p>
              </div>
            </div>

            {renderTable(employerWaitlist, false)}
          </TabsContent>

          <TabsContent value="plans" className="space-y-4">
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">
                Employers interested in specific pricing plans
              </p>
              {planWaitlist.length > 0 && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleExportCSV(planWaitlist, "plan-waitlist")}
                >
                  <Download className="h-4 w-4 mr-2" />
                  Export CSV
                </Button>
              )}
            </div>

            <div className="grid gap-4 md:grid-cols-3">
              <div className="rounded-lg border bg-card p-4">
                <p className="text-sm text-muted-foreground">Total</p>
                <p className="text-2xl font-bold">{planWaitlist.length}</p>
              </div>
              <div className="rounded-lg border bg-card p-4">
                <p className="text-sm text-muted-foreground">Growth Interest</p>
                <p className="text-2xl font-bold">
                  {planWaitlist.filter((e) => e.plan_interest === "Growth").length}
                </p>
              </div>
              <div className="rounded-lg border bg-card p-4">
                <p className="text-sm text-muted-foreground">Enterprise Interest</p>
                <p className="text-2xl font-bold">
                  {planWaitlist.filter((e) => e.plan_interest === "Enterprise").length}
                </p>
              </div>
            </div>

            {renderTable(planWaitlist, true)}
          </TabsContent>
        </Tabs>
      </div>

      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove from waitlist?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently remove this entry from the waitlist.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteId && deleteMutation.mutate(deleteId)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Remove
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AdminLayout>
  );
};

export default AdminWaitlist;
