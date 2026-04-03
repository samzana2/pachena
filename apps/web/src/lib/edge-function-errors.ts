interface EdgeFunctionResponse {
  data: unknown;
  error: unknown;
}

export async function extractEdgeFunctionError(response: EdgeFunctionResponse): Promise<string | null> {
  if (response.data && typeof response.data === "object" && (response.data as Record<string, unknown>).error) {
    return String((response.data as Record<string, unknown>).error);
  }

  if (response.error) {
    const err = response.error as Record<string, unknown>;
    if (err.context && typeof (err.context as Record<string, unknown>).json === "function") {
      try {
        const body = await (err.context as { json: () => Promise<Record<string, unknown>> }).json();
        if (body?.error) return String(body.error);
      } catch {
        // Response body already consumed or not JSON
      }
    }

    if (typeof err.message === "string") {
      return err.message;
    }

    return "An unexpected error occurred";
  }

  return null;
}

export function hasEdgeFunctionError(response: EdgeFunctionResponse): boolean {
  const hasDataError = !!(
    response.data &&
    typeof response.data === "object" &&
    (response.data as Record<string, unknown>).error
  );
  return !!(response.error || hasDataError);
}
