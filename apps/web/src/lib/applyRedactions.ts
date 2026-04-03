export interface RedactionEntry {
  field: string;
  original_text: string;
  redacted_by: string;
  redacted_at: string;
  reason: string;
}

export function applyRedactions(
  sectionData: Record<string, unknown>,
  redactions: RedactionEntry[] | null | undefined
): Record<string, unknown> {
  if (!redactions || redactions.length === 0) return sectionData;

  const result = { ...sectionData };

  for (const redaction of redactions) {
    const fieldValue = result[redaction.field];
    if (typeof fieldValue === "string" && redaction.original_text) {
      result[redaction.field] = fieldValue.split(redaction.original_text).join("[redacted]");
    }
  }

  return result;
}
