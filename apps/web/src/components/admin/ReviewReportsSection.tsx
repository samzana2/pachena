"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { createBrowserSupabaseClient } from "@/lib/supabase/client";
import { ChevronDown, ChevronUp, AlertTriangle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
const supabase = createBrowserSupabaseClient();

interface ReviewReport {
  id: string;
  reason: string;
  details: string | null;
  reported_section: string | null;
  created_at: string | null;
}

interface ReviewReportsSectionProps {
  reviewId: string;
  reportCount: number;
}

// Map reason keys to human-readable labels
const REASON_LABELS: Record<string, string> = {
  inappropriate: "Inappropriate",
  spam: "Spam",
  conflict: "Conflict of interest",
  personal_info: "Personal info",
  not_relevant: "Not relevant",
  other: "Other",
};

// Parse legacy reports that have "Reason Label: details" format in reason field
const parseReportReason = (report: ReviewReport): { reason: string; notes: string | null } => {
  // First check if it's a new format (short key like "inappropriate")
  if (REASON_LABELS[report.reason]) {
    return { reason: REASON_LABELS[report.reason], notes: report.details };
  }
  
  // Legacy format - try to extract reason and notes from concatenated string
  // Format is typically: "Reason Label: additional notes" or just "Reason Label"
  const colonIndex = report.reason.indexOf(':');
  
  if (colonIndex > 0) {
    const reasonPart = report.reason.substring(0, colonIndex).trim();
    const notesPart = report.reason.substring(colonIndex + 1).trim();
    return { reason: reasonPart, notes: notesPart || null };
  }
  
  // No colon found - entire string is the reason
  return { reason: report.reason, notes: report.details };
};

const fetchReviewReports = async (reviewId: string): Promise<ReviewReport[]> => {
  const { data, error } = await supabase
    .from('review_reports')
    .select('id, reason, details, reported_section, created_at')
    .eq('review_id', reviewId)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data || [];
};

export function ReviewReportsSection({ reviewId, reportCount }: ReviewReportsSectionProps) {
  const [isOpen, setIsOpen] = useState(false);

  const { data: reports = [], isLoading } = useQuery({
    queryKey: ['review-reports', reviewId],
    queryFn: () => fetchReviewReports(reviewId),
    enabled: isOpen && reportCount > 0,
    staleTime: 60000,
  });

  if (reportCount === 0) {
    return null;
  }

  return (
    <div className="border rounded-lg p-4 bg-orange-50/50 dark:bg-orange-950/20">
      <Collapsible open={isOpen} onOpenChange={setIsOpen}>
        <CollapsibleTrigger asChild>
          <Button
            variant="ghost"
            className="w-full justify-between p-0 h-auto hover:bg-transparent"
          >
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-orange-600" />
              <span className="font-medium text-orange-800 dark:text-orange-200">
                User Reports
              </span>
              <Badge variant="secondary" className="bg-orange-100 text-orange-800">
                {reportCount}
              </Badge>
            </div>
            {isOpen ? (
              <ChevronUp className="h-4 w-4 text-muted-foreground" />
            ) : (
              <ChevronDown className="h-4 w-4 text-muted-foreground" />
            )}
          </Button>
        </CollapsibleTrigger>
        <CollapsibleContent className="mt-3">
          {isLoading ? (
            <p className="text-sm text-muted-foreground">Loading reports...</p>
          ) : reports.length === 0 ? (
            <p className="text-sm text-muted-foreground">No reports found</p>
          ) : (
            <div className="rounded-md border bg-background overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[140px]">Location</TableHead>
                    <TableHead className="w-[140px]">Reason for Flag</TableHead>
                    <TableHead>Additional Notes</TableHead>
                    <TableHead className="w-[100px] text-right">Date</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                {reports.map((report) => {
                    const { reason, notes } = parseReportReason(report);
                    return (
                      <TableRow key={report.id}>
                        <TableCell>
                          <Badge 
                            variant="outline" 
                            className={report.reported_section === 'interview' 
                              ? 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950 dark:text-blue-300 dark:border-blue-800' 
                              : 'bg-green-50 text-green-700 border-green-200 dark:bg-green-950 dark:text-green-300 dark:border-green-800'
                            }
                          >
                            {report.reported_section === 'interview' ? 'Interview Section' : 'Employee Review'}
                          </Badge>
                        </TableCell>
                        <TableCell className="font-medium">
                          {reason}
                        </TableCell>
                        <TableCell className="text-muted-foreground text-sm">
                          {notes ? (
                            <span className="italic">"{notes}"</span>
                          ) : (
                            <span className="text-muted-foreground/50">—</span>
                          )}
                        </TableCell>
                        <TableCell className="text-right text-sm text-muted-foreground">
                          {report.created_at ? new Date(report.created_at).toLocaleDateString() : "—"}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CollapsibleContent>
      </Collapsible>
    </div>
  );
}
