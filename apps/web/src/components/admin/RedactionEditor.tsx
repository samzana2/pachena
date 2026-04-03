"use client";

import React from "react";
import { useState, useCallback } from "react";
import { TraceButton } from "@/components/ui/trace-button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Scissors, Undo2, Save, X } from "lucide-react";
import type { Json } from "@/types/supabase";

export interface RedactionEntry {
  field: string;
  original_text: string;
  redacted_by?: string;
  redacted_at?: string;
  reason: string;
}

const REDACTION_REASONS = [
  { value: "personal_info", label: "Personal / identifying information" },
  { value: "contact_info", label: "Contact information" },
  { value: "threats", label: "Threats or hate speech" },
  { value: "identifying_details", label: "Could identify the reviewer" },
  { value: "explicit_content", label: "Explicit content" },
  { value: "other", label: "Other" },
];

// Fields that contain free-text content eligible for redaction, per section type
const REDACTABLE_FIELDS: Record<string, { key: string; label: string }[]> = {
  culture: [
    { key: "title", label: "Title" },
    { key: "pros", label: "Pros" },
    { key: "cons", label: "Cons" },
    { key: "advice", label: "Advice" },
  ],
  compensation: [
    { key: "role_title", label: "Role Title" },
    { key: "department", label: "Department" },
  ],
  interview: [
    { key: "interview_description", label: "Interview Description" },
    { key: "interview_tips", label: "Tips / Advice" },
  ],
};

interface RedactionEditorProps {
  sectionType: string;
  sectionData: Json;
  existingRedactions: RedactionEntry[];
  onSave: (redactions: RedactionEntry[]) => void;
  onCancel: () => void;
  isSaving: boolean;
}

const RedactionEditor = ({
  sectionType,
  sectionData,
  existingRedactions,
  onSave,
  onCancel,
  isSaving,
}: RedactionEditorProps) => {
  const [pendingRedactions, setPendingRedactions] = useState<RedactionEntry[]>([
    ...existingRedactions,
  ]);
  const [selectedReason, setSelectedReason] = useState("personal_info");
  const [selectionInfo, setSelectionInfo] = useState<{
    field: string;
    text: string;
  } | null>(null);

  const data =
    sectionData && typeof sectionData === "object" && !Array.isArray(sectionData)
      ? (sectionData as Record<string, unknown>)
      : {};

  const fields = REDACTABLE_FIELDS[sectionType] || [];

  const handleTextSelect = useCallback(
    (fieldKey: string) => {
      const selection = window.getSelection();
      const text = selection?.toString().trim();
      if (text && text.length > 0) {
        setSelectionInfo({ field: fieldKey, text });
      }
    },
    []
  );

  const addRedaction = () => {
    if (!selectionInfo) return;
    const entry: RedactionEntry = {
      field: selectionInfo.field,
      original_text: selectionInfo.text,
      reason: selectedReason,
    };
    setPendingRedactions((prev) => [...prev, entry]);
    setSelectionInfo(null);
  };

  const removeRedaction = (index: number) => {
    setPendingRedactions((prev) => prev.filter((_, i) => i !== index));
  };

  const hasChanges =
    JSON.stringify(pendingRedactions) !== JSON.stringify(existingRedactions);

  // Render text with existing redactions highlighted
  const renderFieldText = (fieldKey: string, rawText: string) => {
    const fieldRedactions = pendingRedactions.filter((r) => r.field === fieldKey);
    if (fieldRedactions.length === 0) return rawText;

    let result: (string | React.ReactElement)[] = [rawText];
    fieldRedactions.forEach((redaction, rIdx) => {
      const newResult: (string | React.ReactElement)[] = [];
      result.forEach((segment) => {
        if (typeof segment !== "string") {
          newResult.push(segment);
          return;
        }
        const parts = segment.split(redaction.original_text);
        parts.forEach((part, pIdx) => {
          if (pIdx > 0) {
            newResult.push(
              <span
                key={`r-${rIdx}-${pIdx}`}
                className="bg-destructive/20 text-destructive line-through px-0.5 rounded"
              >
                {redaction.original_text}
              </span>
            );
          }
          if (part) newResult.push(part);
        });
      });
      result = newResult;
    });
    return <>{result}</>;
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-semibold flex items-center gap-1.5">
          <Scissors className="h-4 w-4" />
          Redaction Mode
        </h4>
        <p className="text-xs text-muted-foreground">
          Highlight text to redact, then click "Redact Selection"
        </p>
      </div>

      {/* Text fields */}
      <div className="space-y-3">
        {fields.map(({ key, label }) => {
          const value = data[key];
          if (!value || typeof value !== "string") return null;
          return (
            <div key={key} className="border rounded-lg p-3">
              <p className="text-xs font-medium text-muted-foreground mb-1">
                {label}
              </p>
              <p
                className="text-sm whitespace-pre-wrap select-text cursor-text"
                onMouseUp={() => handleTextSelect(key)}
              >
                {renderFieldText(key, value)}
              </p>
            </div>
          );
        })}
      </div>

      {/* Selection action bar */}
      {selectionInfo && (
        <div className="border border-primary/30 bg-primary/5 rounded-lg p-3 space-y-2">
          <p className="text-sm">
            Selected from <strong>{selectionInfo.field}</strong>:{" "}
            <span className="font-mono text-xs bg-muted px-1 py-0.5 rounded">
              "{selectionInfo.text}"
            </span>
          </p>
          <div className="flex items-center gap-2">
            <Select value={selectedReason} onValueChange={setSelectedReason}>
              <SelectTrigger className="w-[260px] h-8 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {REDACTION_REASONS.map((r) => (
                  <SelectItem key={r.value} value={r.value}>
                    {r.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <TraceButton
              traceColor="red"
              onClick={addRedaction}
            >
              <Scissors className="h-3.5 w-3.5 mr-1" />
              Redact
            </TraceButton>
            <TraceButton
              traceColor="black"
              onClick={() => setSelectionInfo(null)}
            >
              <X className="h-3.5 w-3.5" />
            </TraceButton>
          </div>
        </div>
      )}

      {/* Pending redactions list */}
      {pendingRedactions.length > 0 && (
        <div className="space-y-1.5">
          <p className="text-xs font-medium text-muted-foreground">
            Redactions ({pendingRedactions.length})
          </p>
          {pendingRedactions.map((r, i) => (
            <div
              key={i}
              className="flex items-center justify-between text-xs border rounded px-2 py-1.5 bg-muted/50"
            >
              <div className="flex items-center gap-2 min-w-0">
                <Badge variant="outline" className="text-[10px] shrink-0">
                  {r.field}
                </Badge>
                <span className="truncate font-mono">"{r.original_text}"</span>
                <Badge variant="secondary" className="text-[10px] shrink-0">
                  {REDACTION_REASONS.find((rr) => rr.value === r.reason)?.label ||
                    r.reason}
                </Badge>
              </div>
              <button
                onClick={() => removeRedaction(i)}
                className="ml-2 text-muted-foreground hover:text-destructive shrink-0"
              >
                <Undo2 className="h-3.5 w-3.5" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Actions */}
      <div className="flex justify-end gap-2 pt-2 border-t">
        <TraceButton
          traceColor="black"
          onClick={onCancel}
          disabled={isSaving}
        >
          Cancel
        </TraceButton>
        <TraceButton
          traceColor="green"
          onClick={() => onSave(pendingRedactions)}
          disabled={isSaving || !hasChanges}
        >
          {isSaving ? "Saving…" : (
            <>
              <Save className="h-4 w-4 mr-1" />
              Save Redactions
            </>
          )}
        </TraceButton>
      </div>
    </div>
  );
};

export default RedactionEditor;
