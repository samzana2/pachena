"use client";

import { useState, useEffect } from "react";
import { createBrowserSupabaseClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Loader2, Search, Download, FileText, RefreshCw } from "lucide-react";
const supabase = createBrowserSupabaseClient();

interface AuditLog {
  id: string;
  admin_user_id: string;
  action: string;
  claim_request_id: string | null;
  metadata: unknown;
  timestamp: string;
}

const actionLabels: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
  claim_approved: { label: "Claim Approved", variant: "default" },
  claim_rejected: { label: "Claim Rejected", variant: "destructive" },
  review_moderated: { label: "Review Moderated", variant: "secondary" },
  user_role_changed: { label: "Role Changed", variant: "outline" },
  settings_updated: { label: "Settings Updated", variant: "outline" },
};

export function AuditLogViewer() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [actionFilter, setActionFilter] = useState<string>("all");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");

  useEffect(() => {
    fetchLogs();
  }, []);

  const fetchLogs = async () => {
    setLoading(true);
    try {
      let query = supabase
        .from("admin_audit_logs")
        .select("*")
        .order("timestamp", { ascending: false })
        .limit(100);

      const { data, error } = await query;

      if (error) throw error;
      setLogs(data || []);
    } catch (error) {
      console.error("Error fetching audit logs:", error);
      toast.error("Failed to load audit logs");
    } finally {
      setLoading(false);
    }
  };

  const filteredLogs = logs.filter((log) => {
    // Action filter
    if (actionFilter !== "all" && log.action !== actionFilter) return false;

    // Search term (searches in action and metadata)
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      const actionMatch = log.action.toLowerCase().includes(searchLower);
      const metadataMatch = log.metadata
        ? JSON.stringify(log.metadata).toLowerCase().includes(searchLower)
        : false;
      if (!actionMatch && !metadataMatch) return false;
    }

    // Date filters
    if (dateFrom) {
      const logDate = new Date(log.timestamp);
      const fromDate = new Date(dateFrom);
      if (logDate < fromDate) return false;
    }
    if (dateTo) {
      const logDate = new Date(log.timestamp);
      const toDate = new Date(dateTo);
      toDate.setHours(23, 59, 59, 999);
      if (logDate > toDate) return false;
    }

    return true;
  });

  const handleExportCSV = () => {
    const headers = ["Timestamp", "Admin User ID", "Action", "Claim Request ID", "Metadata"];
    const rows = filteredLogs.map((log) => [
      new Date(log.timestamp).toISOString(),
      log.admin_user_id,
      log.action,
      log.claim_request_id || "",
      log.metadata ? JSON.stringify(log.metadata) : "",
    ]);

    const csvContent = [
      headers.join(","),
      ...rows.map((row) => row.map((cell) => `"${cell}"`).join(",")),
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `audit-logs-${new Date().toISOString().split("T")[0]}.csv`;
    link.click();
    URL.revokeObjectURL(url);

    toast.success("Audit logs exported");
  };

  const uniqueActions = [...new Set(logs.map((log) => log.action))];

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-medium">Audit Logs</h3>
          <p className="text-sm text-muted-foreground">
            View history of administrative actions
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={fetchLogs}>
            <RefreshCw className="mr-2 h-4 w-4" />
            Refresh
          </Button>
          <Button variant="outline" onClick={handleExportCSV}>
            <Download className="mr-2 h-4 w-4" />
            Export CSV
          </Button>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="grid gap-4 md:grid-cols-4">
            <div className="space-y-2">
              <Label htmlFor="search">Search</Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="search"
                  placeholder="Search logs..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="action">Action Type</Label>
              <Select value={actionFilter} onValueChange={setActionFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="All actions" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Actions</SelectItem>
                  {uniqueActions.map((action) => (
                    <SelectItem key={action} value={action}>
                      {actionLabels[action]?.label || action}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="dateFrom">From Date</Label>
              <Input
                id="dateFrom"
                type="date"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="dateTo">To Date</Label>
              <Input
                id="dateTo"
                type="date"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Logs Table */}
      <Card>
        <CardContent className="p-0">
          {filteredLogs.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12">
              <FileText className="h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-muted-foreground">No audit logs found</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Timestamp</TableHead>
                  <TableHead>Admin</TableHead>
                  <TableHead>Action</TableHead>
                  <TableHead>Details</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredLogs.map((log) => (
                  <TableRow key={log.id}>
                    <TableCell className="whitespace-nowrap">
                      <div className="text-sm">
                        {new Date(log.timestamp).toLocaleDateString()}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {new Date(log.timestamp).toLocaleTimeString()}
                      </div>
                    </TableCell>
                    <TableCell>
                      <code className="text-xs bg-muted px-1.5 py-0.5 rounded">
                        {log.admin_user_id.substring(0, 8)}...
                      </code>
                    </TableCell>
                    <TableCell>
                      <Badge variant={actionLabels[log.action]?.variant || "outline"}>
                        {actionLabels[log.action]?.label || log.action}
                      </Badge>
                    </TableCell>
                    <TableCell className="max-w-xs">
                      {log.claim_request_id && (
                        <div className="text-xs text-muted-foreground">
                          Claim: {log.claim_request_id.substring(0, 8)}...
                        </div>
                      )}
                      {log.metadata != null && typeof log.metadata === 'object' && Object.keys(log.metadata as object).length > 0 && (
                        <div className="text-xs text-muted-foreground truncate">
                          {JSON.stringify(log.metadata)}
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

      <p className="text-xs text-muted-foreground text-center">
        Showing {filteredLogs.length} of {logs.length} logs (max 100)
      </p>
    </div>
  );
}
