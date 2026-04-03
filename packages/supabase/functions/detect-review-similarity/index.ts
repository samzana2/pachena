import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const VERSION = "detect-review-similarity@2026-02-17.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

/**
 * Extract 4-word n-grams from text for similarity comparison.
 * Normalizes text by lowercasing and removing punctuation.
 */
function extractNgrams(text: string, n = 4): Set<string> {
  const words = text
    .toLowerCase()
    .replace(/[^\w\s]/g, "")
    .split(/\s+/)
    .filter((w) => w.length > 2); // skip tiny words

  const ngrams = new Set<string>();
  for (let i = 0; i <= words.length - n; i++) {
    ngrams.add(words.slice(i, i + n).join(" "));
  }
  return ngrams;
}

/**
 * Find shared n-grams between two sets
 */
function findSharedNgrams(a: Set<string>, b: Set<string>): string[] {
  const shared: string[] = [];
  for (const gram of a) {
    if (b.has(gram)) shared.push(gram);
  }
  return shared;
}

serve(async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  console.log(`[${VERSION}] Processing similarity detection`);

  try {
    const { review_id } = await req.json();
    if (!review_id) {
      return new Response(JSON.stringify({ error: "review_id required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Fetch the new review
    const { data: newReview, error: reviewError } = await supabase
      .from("reviews")
      .select("id, company_id, pros, cons, advice, verification_token, created_at")
      .eq("id", review_id)
      .single();

    if (reviewError || !newReview) {
      console.error("Review not found:", reviewError);
      return new Response(JSON.stringify({ error: "Review not found" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const flags: Array<{ flag_type: string; matched_review_id?: string; details: Record<string, unknown> }> = [];

    // ---- CHECK 1: IP Clustering ----
    // Find the verification session for this review's token hash
    const { data: session } = await supabase
      .from("verification_sessions")
      .select("request_ip, id")
      .eq("review_token_hash", newReview.verification_token)
      .maybeSingle();

    if (session?.request_ip) {
      const ipHash = session.request_ip;

      // Find other sessions from the same IP in the last 7 days
      const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
      const { data: ipSessions } = await supabase
        .from("verification_sessions")
        .select("company_id, review_submitted")
        .eq("request_ip", ipHash)
        .eq("review_submitted", true)
        .gte("created_at", sevenDaysAgo);

      if (ipSessions) {
        const uniqueCompanies = new Set(ipSessions.map((s) => s.company_id));
        if (uniqueCompanies.size >= 3) {
          flags.push({
            flag_type: "ip_cluster",
            details: {
              ip_hash: ipHash,
              companies_count: uniqueCompanies.size,
              company_ids: [...uniqueCompanies],
              window: "7d",
            },
          });
          console.log(`IP cluster detected: ${uniqueCompanies.size} companies from same IP`);
        }
      }
    }

    // ---- CHECK 2: Text Similarity (n-gram phrase matching) ----
    const newText = [newReview.pros, newReview.cons, newReview.advice || ""].join(" ");
    const newNgrams = extractNgrams(newText);

    if (newNgrams.size > 0) {
      // Fetch recent reviews from different companies (last 30 days)
      const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
      const { data: recentReviews } = await supabase
        .from("reviews")
        .select("id, company_id, pros, cons, advice")
        .neq("id", review_id)
        .gte("created_at", thirtyDaysAgo)
        .limit(200);

      if (recentReviews) {
        for (const existing of recentReviews) {
          const existingText = [existing.pros, existing.cons, existing.advice || ""].join(" ");
          const existingNgrams = extractNgrams(existingText);
          const shared = findSharedNgrams(newNgrams, existingNgrams);

          if (shared.length >= 3) {
            flags.push({
              flag_type: "text_similarity",
              matched_review_id: existing.id,
              details: {
                shared_phrases: shared.slice(0, 10),
                shared_count: shared.length,
                same_company: existing.company_id === newReview.company_id,
              },
            });
            console.log(`Text similarity: ${shared.length} shared phrases with review ${existing.id}`);
          }
        }
      }
    }

    // ---- Apply flags ----
    if (flags.length > 0) {
      // Flag the review
      const flagTypes = [...new Set(flags.map((f) => f.flag_type))];
      const moderationNote = `Auto-flagged: ${flagTypes.join(", ")}`;

      await supabase
        .from("reviews")
        .update({ flagged: true, moderation_notes: moderationNote })
        .eq("id", review_id);

      // Insert similarity flag records
      const insertData = flags.map((f) => ({
        review_id,
        matched_review_id: f.matched_review_id || null,
        flag_type: f.flag_type,
        details: f.details,
      }));

      const { error: insertError } = await supabase
        .from("review_similarity_flags")
        .insert(insertData);

      if (insertError) {
        console.error("Error inserting similarity flags:", insertError);
      }

      // Send alert email
      const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
      if (RESEND_API_KEY) {
        try {
          const alertHtml = `
            <h2>🚨 Review Fraud Alert</h2>
            <p>Automated similarity detection flagged a new review.</p>
            <p><strong>Review ID:</strong> ${review_id}</p>
            <p><strong>Flags triggered:</strong> ${flagTypes.join(", ")}</p>
            <h3>Details</h3>
            <pre>${JSON.stringify(flags, null, 2)}</pre>
            <p><a href="https://pachena.co/admin/reviews" style="background-color: #dc2626; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px;">Review Now</a></p>
          `;

          await fetch("https://api.resend.com/emails", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${RESEND_API_KEY}`,
            },
            body: JSON.stringify({
              from: "Pachena <notifications@pachena.co>",
              to: ["hello@pachena.co"],
              subject: `🚨 Fraud Alert: Review ${review_id.slice(0, 8)}`,
              html: alertHtml,
            }),
          });
          console.log("Alert email sent");
        } catch (emailErr) {
          console.error("Failed to send alert email:", emailErr);
        }
      }

      console.log(`Review ${review_id} flagged with ${flags.length} similarity flags`);
    } else {
      console.log(`Review ${review_id}: no similarity flags triggered`);
    }

    return new Response(
      JSON.stringify({ success: true, flags_count: flags.length, _version: VERSION }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: any) {
    console.error("Error in detect-review-similarity:", error);
    return new Response(
      JSON.stringify({ error: error.message, _version: VERSION }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
