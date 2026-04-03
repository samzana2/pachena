import { createBrowserSupabaseClient } from "@/lib/supabase/client";

/**
 * Fire-and-forget session event tracking for abandonment analysis.
 */
export function trackSessionEvent(
  reviewSessionId: string,
  eventType: string,
  eventData?: Record<string, unknown>
) {
  const supabase = createBrowserSupabaseClient();
  supabase
    .from("session_events" as never)
    .insert({
      review_session_id: reviewSessionId,
      event_type: eventType,
      event_data: eventData ?? {},
    } as never)
    .then(({ error }) => {
      if (error) console.warn("[session-event] Failed to log:", error.message);
    });
}
