"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Flag, EyeOff, Loader2, CheckCircle } from "lucide-react";

export const FLAG_REASONS = [
  { value: "review_needed", label: "Needs closer review" },
  { value: "suspicious_pattern", label: "Suspicious activity pattern" },
  { value: "community_reports", label: "Multiple community reports" },
  { value: "verification_issue", label: "Employment verification concern" },
  { value: "other", label: "Other (see notes)" },
] as const;

export const REJECTION_REASONS = [
  { value: "inappropriate", label: "Inappropriate or offensive content" },
  { value: "spam", label: "Spam or fake review" },
  { value: "conflict", label: "Conflict of interest" },
  { value: "personal_info", label: "Contains personal information" },
  { value: "not_relevant", label: "Not relevant to employment experience" },
  { value: "duplicate", label: "Duplicate review" },
  { value: "other", label: "Other (see notes)" },
] as const;

export const UNFLAG_REASONS = [
  { value: "reviewed_ok", label: "Reviewed - no issues found" },
  { value: "concern_resolved", label: "Original concern resolved" },
  { value: "false_positive", label: "False positive / flagged in error" },
  { value: "other", label: "Other (see notes)" },
] as const;

export const APPROVAL_REASONS = [
  { value: "meets_guidelines", label: "Meets all community guidelines" },
  { value: "verified_content", label: "Verified, authentic content" },
  { value: "minor_concerns_acceptable", label: "Minor concerns but acceptable" },
  { value: "ai_cleared", label: "AI analysis cleared — no violations" },
  { value: "other", label: "Other (see notes)" },
] as const;

interface ModerationJustificationDialogProps {
  isOpen: boolean;
  action: "flag" | "unflag" | "hide" | "approve" | null;
  onConfirm: (reason: string, notes: string) => void;
  onCancel: () => void;
  isProcessing?: boolean;
}

export function ModerationJustificationDialog({
  isOpen,
  action,
  onConfirm,
  onCancel,
  isProcessing = false,
}: ModerationJustificationDialogProps) {
  const [reason, setReason] = useState("");
  const [notes, setNotes] = useState("");

  const getReasons = () => {
    switch (action) {
      case "approve": return APPROVAL_REASONS;
      case "flag": return FLAG_REASONS;
      case "unflag": return UNFLAG_REASONS;
      case "hide": return REJECTION_REASONS;
      default: return FLAG_REASONS;
    }
  };

  const getTitle = () => {
    switch (action) {
      case "approve": return "Approve Review";
      case "flag": return "Flag Review for Follow-up";
      case "unflag": return "Remove Flag from Review";
      case "hide": return "Reject Review";
      default: return "Moderation Action";
    }
  };

  const getDescription = () => {
    switch (action) {
      case "approve": return "This review will be published. Select a reason for your approval decision.";
      case "flag": return "This review will be marked for closer review. Select a reason for flagging.";
      case "unflag": return "This review will be unmarked for follow-up. Select a resolution reason.";
      case "hide": return "This review will be hidden from public view. Select a reason for rejection.";
      default: return "";
    }
  };

  const getConfirmLabel = () => {
    switch (action) {
      case "approve": return "Confirm Approval";
      case "flag": return "Confirm Flag";
      case "unflag": return "Confirm Unflag";
      case "hide": return "Confirm Rejection";
      default: return "Confirm";
    }
  };

  const getIcon = () => {
    switch (action) {
      case "approve": return CheckCircle;
      case "flag": return Flag;
      case "unflag": return CheckCircle;
      case "hide": return EyeOff;
      default: return Flag;
    }
  };

  const reasons = getReasons();
  const title = getTitle();
  const description = getDescription();
  const confirmLabel = getConfirmLabel();
  const Icon = getIcon();

  const handleConfirm = () => {
    if (!reason) return;
    onConfirm(reason, notes);
    // Reset form after confirm
    setReason("");
    setNotes("");
  };

  const handleOpenChange = (open: boolean) => {
    if (!open) {
      setReason("");
      setNotes("");
      onCancel();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Icon className="h-5 w-5" />
            {title}
          </DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="reason">
              Reason <span className="text-destructive">*</span>
            </Label>
            <Select value={reason} onValueChange={setReason}>
              <SelectTrigger id="reason">
                <SelectValue placeholder="Select a reason..." />
              </SelectTrigger>
              <SelectContent>
                {reasons.map((r) => (
                  <SelectItem key={r.value} value={r.value}>
                    {r.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Additional Notes (optional)</Label>
            <Textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Add any additional context..."
              rows={3}
            />
          </div>
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button variant="outline" onClick={onCancel} disabled={isProcessing}>
            Cancel
          </Button>
          <Button
            onClick={handleConfirm}
            disabled={!reason || isProcessing}
            variant={action === "hide" ? "destructive" : action === "approve" ? "default" : "default"}
            className={action === "approve" ? "bg-green-600 hover:bg-green-700 text-white" : ""}
          >
            {isProcessing && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            {confirmLabel}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
