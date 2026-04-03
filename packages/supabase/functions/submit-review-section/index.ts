import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";
import { z } from "https://deno.land/x/zod@v3.22.4/mod.ts";

const VERSION = "submit-review-section@2026-02-23.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "X-Function-Version": VERSION,
};

function getPreflightHeaders(req: Request) {
  const requested = req.headers.get("Access-Control-Request-Headers");
  return { ...corsHeaders, "Access-Control-Allow-Headers": requested || corsHeaders["Access-Control-Allow-Headers"] };
}

async function hashToken(token: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(token);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(hashBuffer)).map(b => b.toString(16).padStart(2, "0")).join("");
}

// Section-specific Zod schemas
const compensationSchema = z.object({
  employment_status: z.string().max(50).optional().nullable(),
  employment_type: z.string().max(50).optional().nullable(),
  role_level: z.string().max(100).optional().nullable(),
  role_title: z.string().max(150).optional().nullable(),
  department: z.string().max(100).optional().nullable(),
  role_focus: z.string().max(100).optional().nullable(),
  tenure_range: z.string().max(50).optional().nullable(),
  base_salary_currency: z.string().min(1, "Salary currency is required").max(10),
  base_salary_amount: z.number().min(1, "Monthly take-home salary is required").max(100000000),
  is_net_salary: z.boolean().optional().nullable(),
  allowances_currency: z.string().max(10).optional().nullable(),
  allowances_amount: z.number().min(0).max(100000000).optional().nullable(),
  secondary_salary_currency: z.string().max(10).optional().nullable(),
  secondary_salary_amount: z.number().min(0).max(100000000).optional().nullable(),
  bonus_currency: z.string().max(10).optional().nullable(),
  bonus_amount: z.number().min(0).max(100000000).optional().nullable(),
  thirteenth_cheque_annual_value: z.number().min(0).max(100000000).optional().nullable(),
  commission_amount: z.number().min(0).max(100000000).optional().nullable(),
  end_year: z.number().int().min(1950).max(2100).optional().nullable(),
  age_range: z.string().max(50).optional().nullable(),
  gender: z.string().max(50).optional().nullable(),
  ethnicity: z.string().max(100).optional().nullable(),
  education_level: z.string().max(100).optional().nullable(),
  company_benefit_ids: z.array(z.string().uuid()).max(50).optional().nullable(),
  standard_benefit_ids: z.array(z.string().uuid()).max(50).optional().nullable(),
  custom_benefits: z.array(z.string().max(100)).max(20).optional().nullable(),
  benefit_values: z.record(z.string().max(100), z.number().min(0).max(100000000)).optional().nullable(),
  ratings: z.array(z.object({
    category: z.string().max(100),
    rating: z.number().min(0).max(5),
  })).max(5).optional().nullable(),
});

const cultureSchema = z.object({
  title: z.string().trim().min(20, "Title must be at least 20 characters").max(200),
  pros: z.string().trim().min(30, "Pros must be at least 30 characters").max(3000),
  cons: z.string().trim().min(30, "Cons must be at least 30 characters").max(3000),
  advice: z.string().trim().max(5000).optional().nullable(),
  rating: z.number().min(1).max(5),
  recommendation: z.string().max(20).optional().nullable(),
  ceo_approval: z.boolean().nullable().optional(),
  ratings: z.array(z.object({
    category: z.string().max(100),
    rating: z.number().min(0).max(5),
  })).max(20).optional().nullable(),
  private_feedback: z.string().max(5000).optional().nullable(),
});

const interviewSchema = z.object({
  did_interview: z.boolean(),
  interview_experience_rating: z.number().min(1, "Experience rating is required").max(5),
  interview_count: z.number().min(1, "Interview count is required").max(50),
  interview_difficulty: z.string().min(1, "Difficulty is required").max(50),
  interview_stages: z.array(z.string().max(100)).min(1, "At least one interview stage is required").max(20),
  interview_description: z.string().max(5000).optional().nullable(),
  interview_tips: z.string().trim().min(30, "Interview advice must be at least 30 characters").max(3000),
});

const sectionSchemas: Record<string, z.ZodTypeAny> = {
  compensation: compensationSchema,
  culture: cultureSchema,
  interview: interviewSchema,
};

const requestSchema = z.object({
  session_id: z.string().uuid(),
  session_token: z.string().min(1).max(500),
  company_id: z.string().uuid(),
  section_type: z.enum(["compensation", "culture", "interview"]),
  section_data: z.record(z.unknown()),
  honeypot_field: z.string().max(500).optional().nullable(),
});

serve(async (req: Request): Promise<Response> => {
  console.log(`[${VERSION}] ${req.method} ${new URL(req.url).pathname}`);
  if (req.method === "OPTIONS") return new Response("ok", { headers: getPreflightHeaders(req) });

  try {
    const rawBody = await req.json();
    const reqParse = requestSchema.safeParse(rawBody);
    if (!reqParse.success) {
      const errors = reqParse.error.errors.map(e => `${e.path.join(".")}: ${e.message}`).join(", ");
      return new Response(JSON.stringify({ error: `Validation failed: ${errors}` }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const body = reqParse.data;
    if (body.honeypot_field) {
      return new Response(JSON.stringify({ success: true, section_id: "filtered" }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    // Validate section data against the appropriate schema
    const sectionSchema = sectionSchemas[body.section_type];
    const sectionParse = sectionSchema.safeParse(body.section_data);
    if (!sectionParse.success) {
      const errors = (sectionParse as any).error.errors.map((e: any) => `${e.path.join(".")}: ${e.message}`).join(", ");
      return new Response(JSON.stringify({ error: `Section validation failed: ${errors}` }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const sectionData = sectionParse.data as Record<string, unknown>;

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Validate session
    const tokenHash = await hashToken(body.session_token);
    const { data: session, error: sessionError } = await supabase
      .from("review_sessions")
      .select("*")
      .eq("id", body.session_id)
      .eq("company_id", body.company_id)
      .eq("session_token_hash", tokenHash)
      .single();

    if (sessionError || !session) {
      console.error("Invalid session:", sessionError);
      return new Response(JSON.stringify({ error: "Invalid or expired review session" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    if (new Date() > new Date(session.expires_at)) {
      return new Response(JSON.stringify({ error: "Review session has expired" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    // Check if this section_type was already submitted for this session
    const { data: existingSection } = await supabase
      .from("review_sections")
      .select("id")
      .eq("review_session_id", body.session_id)
      .eq("section_type", body.section_type)
      .maybeSingle();

    if (existingSection) {
      return new Response(JSON.stringify({ error: "This section has already been submitted for this session" }),
        { status: 409, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    // Insert into review_sections — this is the ONLY write for the submission
    const { data: newSection, error: sectionInsertError } = await supabase
      .from("review_sections")
      .insert({
        review_session_id: body.session_id,
        company_id: body.company_id,
        section_type: body.section_type,
        section_data: sectionData,
      })
      .select("id")
      .single();

    if (sectionInsertError || !newSection) {
      console.error("Error inserting section:", sectionInsertError);
      return new Response(JSON.stringify({ error: "Failed to save section" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const sectionId = newSection.id;

    // Handle benefits (compensation only) — store benefit IDs in section_data for display,
    // but also write to relational tables for query capability
    if (body.section_type === "compensation") {
      const companyBenefitIds = sectionData.company_benefit_ids as string[] | null;
      if (companyBenefitIds && companyBenefitIds.length > 0) {
        await supabase.from("benefit_confirmations").insert(
          companyBenefitIds.map(id => ({ benefit_id: id, review_id: sectionId }))
        );
      }

      const standardBenefitIds = sectionData.standard_benefit_ids as string[] | null;
      if (standardBenefitIds && standardBenefitIds.length > 0) {
        await supabase.from("review_standard_benefits").insert(
          standardBenefitIds.map(id => ({ standard_benefit_id: id, review_id: sectionId }))
        );
      }

      const customBenefits = sectionData.custom_benefits as string[] | null;
      if (customBenefits && customBenefits.length > 0) {
        for (const benefitName of customBenefits) {
          const trimmed = benefitName.trim();
          if (!trimmed) continue;
          const { data: existing } = await supabase.from("company_benefits")
            .select("id").eq("company_id", body.company_id).ilike("benefit_name", trimmed).maybeSingle();
          let benefitId: string;
          if (existing) { benefitId = existing.id; }
          else {
            const { data: newB, error: bErr } = await supabase.from("company_benefits")
              .insert({ company_id: body.company_id, benefit_name: trimmed }).select("id").single();
            if (bErr) { console.error("Error inserting custom benefit:", bErr); continue; }
            benefitId = newB.id;
          }
          await supabase.from("benefit_confirmations").insert({ benefit_id: benefitId, review_id: sectionId });
        }
      }
    }

    // Handle private feedback (culture only)
    if (body.section_type === "culture" && sectionData.private_feedback) {
      const feedback = (sectionData.private_feedback as string).trim();
      if (feedback) {
        await supabase.from("employer_feedback").insert({
          company_id: body.company_id,
          title: "Anonymous Employee Feedback",
          content: feedback,
        });
      }
    }

    // Get company name for notification
    const { data: companyData } = await supabase
      .from("companies")
      .select("name")
      .eq("id", body.company_id)
      .single();

    const companyName = companyData?.name || "Unknown Company";
    const sectionLabel = body.section_type.charAt(0).toUpperCase() + body.section_type.slice(1);

    console.log("Section submitted:", body.section_type, "ID:", sectionId);

    // Send admin notification email (non-blocking)
    const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
    if (RESEND_API_KEY) {
      const sendAdminEmail = async (): Promise<boolean> => {
        // Build a summary of the section data for the email
        let dataSummary = "";
        if (body.section_type === "compensation") {
          const d = sectionData;
          const benefitVals = d.benefit_values && typeof d.benefit_values === "object" ? d.benefit_values as Record<string, number> : {};
          const benefitLines = Object.entries(benefitVals)
            .filter(([, v]) => v > 0)
            .map(([k, v]) => `${k.replace(/_/g, " ")}: ${d.base_salary_currency || "USD"} ${v}`)
            .join(", ");
          dataSummary = `
            <p><strong>Role:</strong> ${d.role_title || "—"} (${d.role_level || "—"})</p>
            <p><strong>Employment:</strong> ${d.employment_type || "—"} · ${d.employment_status || "—"}</p>
            <p><strong>Monthly Take-Home Salary (net):</strong> ${d.base_salary_currency || "USD"} ${d.base_salary_amount || "—"}/mo</p>
            ${d.secondary_salary_amount ? `<p><strong>Additional Local Currency Salary:</strong> ${d.secondary_salary_currency || "ZWL"} ${d.secondary_salary_amount}/mo</p>` : ""}
            ${d.thirteenth_cheque_annual_value ? `<p><strong>Thirteenth Cheque (annual):</strong> ${d.bonus_currency || d.base_salary_currency || "USD"} ${d.thirteenth_cheque_annual_value}</p>` : ""}
            ${d.commission_amount ? `<p><strong>Avg Monthly Commission:</strong> ${d.base_salary_currency || "USD"} ${d.commission_amount}</p>` : ""}
            ${benefitLines ? `<p><strong>Benefits:</strong> ${benefitLines}</p>` : ""}
          `;
        } else if (body.section_type === "culture") {
          const d = sectionData;
          dataSummary = `
            <p><strong>Title:</strong> ${d.title || "—"}</p>
            <p><strong>Rating:</strong> ${d.rating || "—"}/5</p>
            <p><strong>Pros:</strong> ${(d.pros as string || "").substring(0, 200)}${(d.pros as string || "").length > 200 ? "…" : ""}</p>
            <p><strong>Cons:</strong> ${(d.cons as string || "").substring(0, 200)}${(d.cons as string || "").length > 200 ? "…" : ""}</p>
          `;
        } else if (body.section_type === "interview") {
          const d = sectionData;
          dataSummary = `
            <p><strong>Difficulty:</strong> ${d.interview_difficulty || "—"}</p>
            <p><strong>Experience Rating:</strong> ${d.interview_experience_rating || "—"}/5</p>
            <p><strong>Interview Count:</strong> ${d.interview_count || "—"}</p>
            ${d.interview_tips ? `<p><strong>Tips:</strong> ${(d.interview_tips as string).substring(0, 200)}${(d.interview_tips as string).length > 200 ? "…" : ""}</p>` : ""}
          `;
        }

        const APP_URL = Deno.env.get("APP_URL") || "https://pachena.lovable.app";

        const res = await fetch("https://api.resend.com/emails", {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${RESEND_API_KEY}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            from: "Pachena <notifications@pachena.co>",
            to: ["hello@pachena.co"],
            subject: `New ${sectionLabel} Review: ${companyName}`,
            html: `
              <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
                <h2 style="color: #1a1a1a;">New ${sectionLabel} Review Submitted</h2>
                <p style="color: #666;">A new <strong>${sectionLabel}</strong> review has been submitted for <strong>${companyName}</strong> and is awaiting moderation.</p>
                <div style="background: #f9f9f9; padding: 16px; border-radius: 8px; margin: 16px 0;">
                  ${dataSummary}
                </div>
                <a href="${APP_URL}/admin/reviews" style="display: inline-block; padding: 10px 20px; background: #1a1a1a; color: #fff; text-decoration: none; border-radius: 6px; margin-top: 8px;">Review in Admin Dashboard</a>
                <p style="color: #999; font-size: 12px; margin-top: 24px;">Section ID: ${sectionId}</p>
              </div>
            `,
          }),
        });

        if (!res.ok) {
          const body = await res.text();
          console.error(`Resend API error (${res.status}):`, body);
          return false;
        }
        await res.text(); // consume body
        return true;
      };

      // Attempt with one retry on failure
      try {
        const sent = await sendAdminEmail();
        if (sent) {
          console.log("Admin notification email sent for section:", sectionId);
        } else {
          console.warn("First email attempt failed, retrying in 1.5s...");
          await new Promise(r => setTimeout(r, 1500));
          const retrySent = await sendAdminEmail();
          if (retrySent) {
            console.log("Admin notification email sent on retry for section:", sectionId);
          } else {
            console.error("Admin notification email failed after retry for section:", sectionId);
          }
        }
      } catch (emailErr) {
        console.warn("First email attempt threw, retrying in 1.5s...", emailErr);
        try {
          await new Promise(r => setTimeout(r, 1500));
          const retrySent = await sendAdminEmail();
          if (retrySent) {
            console.log("Admin notification email sent on retry for section:", sectionId);
          } else {
            console.error("Admin notification email failed after retry for section:", sectionId);
          }
        } catch (retryErr) {
          console.error("Admin notification email failed after retry:", retryErr);
        }
      }
    }

    // Fire background AI fraud check (non-blocking)
    const fraudCheckUrl = `${supabaseUrl}/functions/v1/detect-fraud-ai`;
    fetch(fraudCheckUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-internal-key": supabaseServiceKey,
      },
      body: JSON.stringify({ reviewId: sectionId }),
    }).then(res => {
      console.log(`Fraud check triggered for section ${sectionId}: status ${res.status}`);
      return res.text(); // consume body
    }).catch(err => {
      console.error(`Failed to trigger fraud check for section ${sectionId}:`, err);
    });

    return new Response(JSON.stringify({
      success: true,
      section_id: sectionId,
    }), { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } });

  } catch (err) {
    console.error("Unexpected error:", err);
    return new Response(JSON.stringify({ error: "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});
