"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Loader2 } from "lucide-react";

const REPORT_REASONS = [
  { value: "inappropriate", label: "Inappropriate or offensive content" },
  { value: "spam", label: "Spam or fake review" },
  { value: "conflict", label: "Conflicts of interest" },
  { value: "personal_info", label: "Contains personal information" },
  { value: "not_relevant", label: "Not relevant to the company" },
  { value: "other", label: "Other" },
];

interface ReportReviewDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (reason: string, details?: string) => Promise<void>;
  isLoading?: boolean;
}

export function ReportReviewDialog({
  open,
  onOpenChange,
  onSubmit,
  isLoading = false,
}: ReportReviewDialogProps) {
  const [reason, setReason] = useState("");
  const [details, setDetails] = useState("");

  const handleSubmit = async () => {
    if (!reason) return;
    
    // Pass the reason key (not the label) and details separately
    await onSubmit(reason, details || undefined);
    
    // Reset form on successful submit
    setReason("");
    setDetails("");
  };

  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen) {
      // Reset form when closing
      setReason("");
      setDetails("");
    }
    onOpenChange(newOpen);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Report Review</DialogTitle>
          <DialogDescription>
            Help us understand why you're reporting this review. Your feedback
            helps maintain a trustworthy platform.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="reason">Why are you reporting this review?</Label>
            <Select value={reason} onValueChange={setReason}>
              <SelectTrigger id="reason">
                <SelectValue placeholder="Select a reason" />
              </SelectTrigger>
              <SelectContent>
                {REPORT_REASONS.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          {reason && (
            <div className="space-y-2 animate-fade-in">
              <Label htmlFor="details">Additional details (optional)</Label>
              <Textarea
                id="details"
                placeholder="Provide any additional context that might help our moderation team..."
                value={details}
                onChange={(e) => setDetails(e.target.value)}
                className="min-h-[80px]"
              />
            </div>
          )}
        </div>
        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => handleOpenChange(false)}
            disabled={isLoading}
          >
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={!reason || isLoading}>
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Submitting...
              </>
            ) : (
              "Submit Report"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
