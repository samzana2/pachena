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
import { Flag, XCircle, Loader2, CheckCircle } from "lucide-react";

export const CLAIM_DENIAL_REASONS = [
  { value: "unverifiable_employment", label: "Unverifiable employment relationship" },
  { value: "insufficient_evidence", label: "Insufficient authorization evidence" },
  { value: "duplicate_claim", label: "Duplicate claim request" },
  { value: "fraudulent_info", label: "Fraudulent/misleading information" },
  { value: "company_inactive", label: "Company doesn't exist or is inactive" },
  { value: "other", label: "Other (see notes)" },
] as const;

export const CLAIM_FLAG_REASONS = [
  { value: "needs_verification", label: "Needs additional verification" },
  { value: "awaiting_supervisor", label: "Awaiting supervisor confirmation" },
  { value: "suspicious_pattern", label: "Suspicious activity pattern" },
  { value: "incomplete_info", label: "Incomplete information" },
  { value: "other", label: "Other (see notes)" },
] as const;

export const CLAIM_UNFLAG_REASONS = [
  { value: "verification_complete", label: "Verification complete - approved" },
  { value: "concern_resolved", label: "Concern resolved" },
  { value: "false_positive", label: "False positive" },
  { value: "other", label: "Other (see notes)" },
] as const;

interface ClaimJustificationDialogProps {
  isOpen: boolean;
  action: "flag" | "unflag" | "deny" | null;
  onConfirm: (reason: string, notes: string) => void;
  onCancel: () => void;
  isProcessing?: boolean;
}

export function ClaimJustificationDialog({
  isOpen,
  action,
  onConfirm,
  onCancel,
  isProcessing = false,
}: ClaimJustificationDialogProps) {
  const [reason, setReason] = useState("");
  const [notes, setNotes] = useState("");

  const getReasons = () => {
    switch (action) {
      case "flag": return CLAIM_FLAG_REASONS;
      case "unflag": return CLAIM_UNFLAG_REASONS;
      case "deny": return CLAIM_DENIAL_REASONS;
      default: return CLAIM_FLAG_REASONS;
    }
  };

  const getTitle = () => {
    switch (action) {
      case "flag": return "Flag Claim for Review";
      case "unflag": return "Remove Flag from Claim";
      case "deny": return "Deny Claim Request";
      default: return "Moderation Action";
    }
  };

  const getDescription = () => {
    switch (action) {
      case "flag": return "This claim will be marked for closer review. Select a reason for flagging.";
      case "unflag": return "This claim will be unmarked for follow-up. Select a resolution reason.";
      case "deny": return "This claim will be denied and the requester notified. Select a reason for denial.";
      default: return "";
    }
  };

  const getConfirmLabel = () => {
    switch (action) {
      case "flag": return "Confirm Flag";
      case "unflag": return "Confirm Unflag";
      case "deny": return "Confirm Denial";
      default: return "Confirm";
    }
  };

  const getIcon = () => {
    switch (action) {
      case "flag": return Flag;
      case "unflag": return CheckCircle;
      case "deny": return XCircle;
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
            variant={action === "deny" ? "destructive" : "default"}
          >
            {isProcessing && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            {confirmLabel}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
