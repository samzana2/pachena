import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const VERSION = "daily-health-check@2026-03-20.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, " +
    "x-supabase-client-platform, x-supabase-client-platform-version, " +
    "x-supabase-client-runtime, x-supabase-client-runtime-version",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

interface HealthCheckResult {
  check: string;
  status: "pass" | "fail" | "warn";
  detail: string;
}

serve(async (req: Request): Promise<Response> => {
  console.log(`[${VERSION}] ${req.method} ${new URL(req.url).pathname}`);

  if (req.method === "OPTIONS") {
    const requested = req.headers.get("Access-Control-Request-Headers");
    return new Response(null, {
      headers: { ...corsHeaders, "Access-Control-Allow-Headers": requested || corsHeaders["Access-Control-Allow-Headers"] },
    });
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const resendApiKey = Deno.env.get("RESEND_API_KEY");
  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  const results: HealthCheckResult[] = [];
  const now = new Date();
  const twentyFourHoursAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString();
  const fortyEightHoursAgo = new Date(now.getTime() - 48 * 60 * 60 * 1000).toISOString();

  // ─── CHECK 1: Review session creation (smoke test) ───
  try {
    // Get any company to test with
    const { data: company, error: companyErr } = await supabase
      .from("companies")
      .select("id")
      .limit(1)
      .single();

    if (companyErr || !company) {
      results.push({ check: "Session Creation", status: "fail", detail: "No companies found in database" });
    } else {
      // Create a test session
      const tokenBytes = new Uint8Array(32);
      crypto.getRandomValues(tokenBytes);
      const rawToken = Array.from(tokenBytes).map(b => b.toString(16).padStart(2, "0")).join("");
      const encoder = new TextEncoder();
      const hashBuffer = await crypto.subtle.digest("SHA-256", encoder.encode(rawToken));
      const tokenHash = Array.from(new Uint8Array(hashBuffer)).map(b => b.toString(16).padStart(2, "0")).join("");

      const expiresAt = new Date(Date.now() + 60 * 1000).toISOString(); // 1 min expiry

      const { data: session, error: sessionErr } = await supabase
        .from("review_sessions")
        .insert({
          company_id: company.id,
          session_token_hash: tokenHash,
          expires_at: expiresAt,
        })
        .select("id")
        .single();

      if (sessionErr) {
        results.push({ check: "Session Creation", status: "fail", detail: `Insert failed: ${sessionErr.message}` });
      } else {
        // Clean up test session immediately
        await supabase.from("review_sessions").delete().eq("id", session.id);
        results.push({ check: "Session Creation", status: "pass", detail: "Successfully created and cleaned up test session" });
      }
    }
  } catch (err: any) {
    results.push({ check: "Session Creation", status: "fail", detail: `Exception: ${err.message}` });
  }

  // ─── CHECK 2: Submission volume (last 24h vs previous 24h) ───
  try {
    const { count: last24h } = await supabase
      .from("review_sections")
      .select("*", { count: "exact", head: true })
      .gte("created_at", twentyFourHoursAgo);

    const { count: prev24h } = await supabase
      .from("review_sections")
      .select("*", { count: "exact", head: true })
      .gte("created_at", fortyEightHoursAgo)
      .lt("created_at", twentyFourHoursAgo);

    const current = last24h ?? 0;
    const previous = prev24h ?? 0;

    if (current === 0 && previous > 0) {
      results.push({
        check: "Submission Volume",
        status: "fail",
        detail: `⚠️ ZERO submissions in last 24h (previous 24h had ${previous}). Possible regression!`,
      });
    } else if (current === 0 && previous === 0) {
      results.push({
        check: "Submission Volume",
        status: "warn",
        detail: "No submissions in last 48h. Low traffic or potential issue.",
      });
    } else {
      const change = previous > 0 ? Math.round(((current - previous) / previous) * 100) : 100;
      results.push({
        check: "Submission Volume",
        status: "pass",
        detail: `${current} submissions in last 24h (${change >= 0 ? "+" : ""}${change}% vs previous 24h: ${previous})`,
      });
    }
  } catch (err: any) {
    results.push({ check: "Submission Volume", status: "fail", detail: `Exception: ${err.message}` });
  }

  // ─── CHECK 3: Session-to-submission conversion ───
  try {
    const { count: sessionsCount } = await supabase
      .from("review_sessions")
      .select("*", { count: "exact", head: true })
      .gte("created_at", twentyFourHoursAgo);

    const { count: sectionsCount } = await supabase
      .from("review_sections")
      .select("*", { count: "exact", head: true })
      .gte("created_at", twentyFourHoursAgo);

    const sessions = sessionsCount ?? 0;
    const sections = sectionsCount ?? 0;

    if (sessions > 0 && sections === 0) {
      results.push({
        check: "Conversion Rate",
        status: "fail",
        detail: `⚠️ ${sessions} sessions created but 0 submissions completed. Users may be blocked!`,
      });
    } else if (sessions > 0) {
      const rate = Math.round((sections / sessions) * 100);
      results.push({
        check: "Conversion Rate",
        status: rate < 20 ? "warn" : "pass",
        detail: `${rate}% conversion (${sections} submissions from ${sessions} sessions)`,
      });
    } else {
      results.push({
        check: "Conversion Rate",
        status: "pass",
        detail: "No sessions created in last 24h",
      });
    }
  } catch (err: any) {
    results.push({ check: "Conversion Rate", status: "fail", detail: `Exception: ${err.message}` });
  }

  // ─── CHECK 4: Database connectivity ───
  try {
    const { count, error } = await supabase
      .from("companies")
      .select("*", { count: "exact", head: true });

    if (error) {
      results.push({ check: "Database Connectivity", status: "fail", detail: `Query failed: ${error.message}` });
    } else {
      results.push({ check: "Database Connectivity", status: "pass", detail: `${count} companies accessible` });
    }
  } catch (err: any) {
    results.push({ check: "Database Connectivity", status: "fail", detail: `Exception: ${err.message}` });
  }

  // ─── CHECK 5: Abandoned sessions (last 24h) ───
  try {
    const { data: recentSessions } = await supabase
      .from("review_sessions")
      .select("id, company_id")
      .gte("created_at", twentyFourHoursAgo);

    if (recentSessions && recentSessions.length > 0) {
      const sessionIds = recentSessions.map(s => s.id);
      const { data: withSections } = await supabase
        .from("review_sections")
        .select("review_session_id")
        .in("review_session_id", sessionIds);

      const completedIds = new Set((withSections || []).map(s => s.review_session_id));
      const abandonedSessions = recentSessions.filter(s => !completedIds.has(s.id));
      const abandoned = abandonedSessions.length;
      const total = recentSessions.length;
      const abandonRate = Math.round((abandoned / total) * 100);

      // Look up company names for abandoned sessions
      let abandonedCompanyDetail = "";
      if (abandoned > 0) {
        const abandonedCompanyIds = [...new Set(abandonedSessions.map(s => s.company_id))];
        const { data: companies } = await supabase
          .from("companies")
          .select("id, name")
          .in("id", abandonedCompanyIds);

        const companyMap = new Map((companies || []).map(c => [c.id, c.name]));
        const companyCounts: Record<string, number> = {};
        for (const s of abandonedSessions) {
          const name = companyMap.get(s.company_id) || "Unknown";
          companyCounts[name] = (companyCounts[name] || 0) + 1;
        }
        const companyList = Object.entries(companyCounts)
          .map(([name, count]) => `${name} (${count})`)
          .join(", ");
        abandonedCompanyDetail = ` | Abandoned at: ${companyList}`;
      }

      results.push({
        check: "Abandon Rate (last 24h)",
        status: abandonRate > 80 ? "fail" : abandonRate > 50 ? "warn" : "pass",
        detail: `${abandonRate}% abandonment (${abandoned}/${total} sessions had no submissions)${abandonedCompanyDetail}`,
      });
    } else {
      results.push({ check: "Abandon Rate (last 24h)", status: "pass", detail: "No sessions in last 24h" });
    }
  } catch (err: any) {
    results.push({ check: "Abandon Rate (last 24h)", status: "fail", detail: `Exception: ${err.message}` });
  }

  // ─── Build summary ───
  const hasFailures = results.some(r => r.status === "fail");
  const hasWarnings = results.some(r => r.status === "warn");
  const overallStatus = hasFailures ? "🔴 CRITICAL" : hasWarnings ? "🟡 WARNING" : "🟢 ALL CLEAR";

  const reportDate = now.toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  // ─── Send email report ───
  if (resendApiKey) {
    const statusEmoji = (s: string) =>
      s === "pass" ? "✅" : s === "fail" ? "❌" : "⚠️";

    const rowsHtml = results
      .map(
        (r) => `
        <tr>
          <td style="padding: 12px 16px; border-bottom: 1px solid #e5e7eb;">
            ${statusEmoji(r.status)}
          </td>
          <td style="padding: 12px 16px; border-bottom: 1px solid #e5e7eb; font-weight: 600;">
            ${r.check}
          </td>
          <td style="padding: 12px 16px; border-bottom: 1px solid #e5e7eb; color: ${r.status === "fail" ? "#dc2626" : r.status === "warn" ? "#d97706" : "#16a34a"};">
            ${r.detail}
          </td>
        </tr>`
      )
      .join("");

    const html = `
      <!DOCTYPE html>
      <html>
        <head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
        <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 700px; margin: 0 auto; padding: 20px;">
          <div style="background: ${hasFailures ? "linear-gradient(135deg, #dc2626, #991b1b)" : hasWarnings ? "linear-gradient(135deg, #d97706, #92400e)" : "linear-gradient(135deg, #16a34a, #15803d)"}; padding: 30px; border-radius: 10px 10px 0 0; text-align: center;">
            <h1 style="color: white; margin: 0; font-size: 22px;">${overallStatus} — Pachena Daily Health Check</h1>
            <p style="color: rgba(255,255,255,0.85); margin: 8px 0 0; font-size: 14px;">${reportDate}</p>
          </div>
          
          <div style="background: #f9fafb; padding: 24px; border-radius: 0 0 10px 10px;">
            <table style="width: 100%; border-collapse: collapse; background: white; border-radius: 8px; overflow: hidden; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
              <thead>
                <tr style="background: #f3f4f6;">
                  <th style="padding: 12px 16px; text-align: left; font-size: 12px; text-transform: uppercase; color: #6b7280; width: 40px;"></th>
                  <th style="padding: 12px 16px; text-align: left; font-size: 12px; text-transform: uppercase; color: #6b7280;">Check</th>
                  <th style="padding: 12px 16px; text-align: left; font-size: 12px; text-transform: uppercase; color: #6b7280;">Detail</th>
                </tr>
              </thead>
              <tbody>
                ${rowsHtml}
              </tbody>
            </table>

            ${hasFailures ? `
            <div style="background: #fef2f2; border-left: 4px solid #dc2626; padding: 15px 20px; margin: 20px 0; border-radius: 0 8px 8px 0;">
              <p style="margin: 0; font-size: 14px; color: #991b1b;">
                <strong>Action Required:</strong> One or more critical checks failed. This may indicate a regression that is blocking users from submitting reviews. Please investigate immediately.
              </p>
            </div>` : ""}
            
            <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 24px 0;">
            <p style="font-size: 12px; color: #999; text-align: center;">
              Pachena Platform Health Monitor · ${VERSION}
            </p>
          </div>
        </body>
      </html>
    `;

    try {
      const emailRes = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${resendApiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          from: "Pachena Health Monitor <noreply@pachena.co>",
          to: ["hello@pachena.co"],
          subject: `${overallStatus} — Daily Health Report (${reportDate})`,
          html,
        }),
      });

      if (!emailRes.ok) {
        const errData = await emailRes.json();
        console.error("Failed to send report email:", errData);
      } else {
        console.log("Health report email sent successfully");
      }
    } catch (emailErr: any) {
      console.error("Email send exception:", emailErr.message);
    }
  } else {
    console.warn("RESEND_API_KEY not set — skipping email report");
  }

  return new Response(
    JSON.stringify({ status: overallStatus, results, _version: VERSION }),
    { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
  );
});
