import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";
import { z } from "https://deno.land/x/zod@v3.22.4/mod.ts";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");

// Bump this when deploying changes (helps debug stale deployments)
const VERSION = "submit-review@2026-02-07.2";
const DEPLOYED_AT = new Date().toISOString();

const DEFAULT_ALLOWED_HEADERS = [
  "authorization",
  "x-client-info",
  "apikey",
  "content-type",
  "x-supabase-client-platform",
  "x-supabase-client-platform-version",
  "x-supabase-client-runtime",
  "x-supabase-client-runtime-version",
  // Newer clients may send additional headers; OPTIONS handler below will reflect dynamically.
  "x-supabase-client-trace-id",
  "x-supabase-js-version",
].join(", ");

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": DEFAULT_ALLOWED_HEADERS,
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Expose-Headers": "X-Function-Version",
  "X-Function-Version": VERSION,
};

function getPreflightHeaders(req: Request) {
  const requested = req.headers.get("Access-Control-Request-Headers");
  return {
    ...corsHeaders,
    "Access-Control-Allow-Headers": requested || corsHeaders["Access-Control-Allow-Headers"],
  };
}

// Zod schema for input validation with length limits
// Note: Many optional fields use .nullable() because the frontend sends null for empty values
const reviewSchema = z.object({
  review_token: z.string().min(1).max(500),
  session_id: z.string().uuid(),
  company_id: z.string().uuid(),
  title: z.string().trim().min(20, "Title must be at least 20 characters").max(200, "Title must be less than 200 characters"),
  employment_status: z.string().max(50).optional().nullable(),
  employment_type: z.string().max(50).optional().nullable(),
  role_level: z.string().max(100).optional().nullable(),
  role_title: z.string().max(150).optional().nullable(),
  department: z.string().max(100).optional().nullable(),
  role_focus: z.string().max(100).optional().nullable(),
  tenure_range: z.string().max(50).optional().nullable(),
  salary_range: z.string().max(100).optional().nullable(),
  // Structured salary fields
  base_salary_currency: z.string().min(1, "Salary currency is required").max(10),
  base_salary_amount: z.number().min(1, "Monthly take-home salary is required").max(100000000),
  is_net_salary: z.boolean().optional().nullable(),
  allowances_currency: z.string().max(10).optional().nullable(),
  allowances_amount: z.number().min(0).max(100000000).optional().nullable(),
  bonus_currency: z.string().max(10).optional().nullable(),
  bonus_amount: z.number().min(0).max(100000000).optional().nullable(),
  // Core review fields
  market_alignment: z.string().max(100).optional().nullable(),
  pay_transparency: z.string().max(100).optional().nullable(),
  pros: z.string().trim().min(30, "Pros must be at least 30 characters").max(3000, "Pros must be less than 3000 characters"),
  cons: z.string().trim().min(30, "Cons must be at least 30 characters").max(3000, "Cons must be less than 3000 characters"),
  advice: z.string().trim().max(5000, "Advice must be less than 5000 characters").optional().nullable(),
  rating: z.number().min(1).max(5),
  recommendation: z.string().max(20).optional().nullable(),
  ceo_approval: z.boolean().nullable().optional(),
  ratings: z.array(z.object({
    category: z.string().max(100),
    rating: z.number().min(0).max(5),
  })).max(20).optional().nullable(),
  company_benefit_ids: z.array(z.string().uuid()).max(50).optional().nullable(),
  standard_benefit_ids: z.array(z.string().uuid()).max(50).optional().nullable(),
  custom_benefits: z.array(z.string().max(100)).max(20).optional().nullable(),
  private_feedback: z.string().max(5000, "Private feedback must be less than 5000 characters").optional().nullable(),
  // Demographics (optional)
  age_range: z.string().max(50).optional().nullable(),
  gender: z.string().max(50).optional().nullable(),
  ethnicity: z.string().max(100).optional().nullable(),
  education_level: z.string().max(100).optional().nullable(),
  // Interview Experience (optional)
  did_interview: z.boolean().nullable().optional(),
  interview_experience_rating: z.number().min(1).max(5).nullable().optional(),
  interview_count: z.number().min(1).max(50).nullable().optional(),
  interview_difficulty: z.string().max(50).optional().nullable(),
  interview_description: z.string().max(5000, "Interview description must be less than 5000 characters").optional().nullable(),
  interview_tips: z.string().max(3000, "Interview tips must be less than 3000 characters").optional().nullable(),
  // End year for former employees
  end_year: z.number().int().min(1950).max(2100).optional().nullable(),
  // Referral tracking
  
  // Honeypot for spam protection
  honeypot_field: z.string().max(500).optional().nullable(),
});

type ReviewSubmission = z.infer<typeof reviewSchema>;

// Hash a token using SHA-256
async function hashToken(token: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(token);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((byte) => byte.toString(16).padStart(2, "0")).join("");
}

serve(async (req: Request): Promise<Response> => {
  console.log(`[${VERSION}] ${req.method} ${new URL(req.url).pathname}`);

  // Handle CORS preflight (reflect requested headers to avoid client/header drift)
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: getPreflightHeaders(req) });
  }

  try {
    const rawBody = await req.json();
    
    // Validate input with zod schema
    const parseResult = reviewSchema.safeParse(rawBody);
    if (!parseResult.success) {
      const errors = parseResult.error.errors.map(e => `${e.path.join('.')}: ${e.message}`).join(', ');
      console.error("Validation error:", errors);
      return new Response(
        JSON.stringify({ error: `Validation failed: ${errors}` }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    
    const body = parseResult.data;

    // Honeypot check - silently reject bots
    if (body.honeypot_field) {
      console.log("Honeypot triggered, silently returning success");
      return new Response(
        JSON.stringify({ success: true, review_id: "filtered" }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    
    console.log("submit-review invoked for company:", body.company_id, "session:", body.session_id);

    // Create Supabase client with service role
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Hash the review token for comparison
    const tokenHash = await hashToken(body.review_token);

    // Validate the session and review token
    const { data: session, error: sessionError } = await supabase
      .from("verification_sessions")
      .select("*")
      .eq("id", body.session_id)
      .eq("company_id", body.company_id)
      .eq("verified", true)
      .eq("review_submitted", false)
      .single();

    if (sessionError || !session) {
      console.error("Invalid session or already used:", sessionError);
      return new Response(
        JSON.stringify({ error: "Invalid or expired review session. Please verify your email again." }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Validate the review token hash matches
    if (session.review_token_hash && session.review_token_hash !== tokenHash) {
      console.error("Review token mismatch");
      return new Response(
        JSON.stringify({ error: "Invalid review token" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Check if session has expired
    const now = new Date();
    const expiresAt = new Date(session.expires_at);
    if (now > expiresAt) {
      console.error("Session expired:", { now, expiresAt });
      return new Response(
        JSON.stringify({ error: "Review session has expired. Please verify your email again." }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log("Submitting review for session:", body.session_id, "email_domain:", session.email_domain);

    // All reviews are now unverified (no verification paths exist)
    const verificationType = "unverified";

    // Mark session as used FIRST to prevent race conditions
    const { error: updateError } = await supabase
      .from("verification_sessions")
      .update({ review_submitted: true })
      .eq("id", body.session_id);

    if (updateError) {
      console.error("Error marking session as used:", updateError);
      return new Response(
        JSON.stringify({ error: "Failed to process review submission" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Convert recommendation to recommend_to_friend boolean for backwards compatibility
    let recommendToFriend: boolean | null = null;
    if (body.recommendation === "Yes") {
      recommendToFriend = true;
    } else if (body.recommendation === "No") {
      recommendToFriend = false;
    }

    // Insert the review with new fields including demographics and structured salary
    const { data: reviewData, error: reviewError } = await supabase
      .from("reviews")
      .insert({
        company_id: body.company_id,
        title: body.title,
        employment_status: body.employment_status || null,
        employment_type: body.employment_type || null,
        role_level: body.role_level || null,
        department: body.department || null,
        role_focus: body.role_focus || null,
        tenure_range: body.tenure_range || null,
        salary_range: body.salary_range || null,
        // Structured salary fields
        base_salary_currency: body.base_salary_currency || null,
        base_salary_amount: body.base_salary_amount || null,
        is_net_salary: body.is_net_salary ?? null,
        allowances_currency: body.allowances_currency || null,
        allowances_amount: body.allowances_amount || null,
        bonus_currency: body.bonus_currency || null,
        bonus_amount: body.bonus_amount || null,
        // Other fields
        market_alignment: body.market_alignment || null,
        pay_transparency: body.pay_transparency || null,
        pros: body.pros,
        cons: body.cons,
        advice: body.advice || null,
        rating: body.rating,
        recommend_to_friend: recommendToFriend,
        ceo_approval: body.ceo_approval ?? null,
        private_feedback: body.private_feedback || null,
        verification_token: tokenHash, // Store hash, not raw token
        // Demographics (optional)
        age_range: body.age_range || null,
        gender: body.gender || null,
        ethnicity: body.ethnicity || null,
        education_level: body.education_level || null,
        // Interview Experience (optional)
        did_interview: body.did_interview ?? null,
        interview_experience_rating: body.interview_experience_rating ?? null,
        interview_count: body.interview_count ?? null,
        interview_difficulty: body.interview_difficulty || null,
        interview_description: body.interview_description || null,
        interview_tips: body.interview_tips || null,
        // End year for former employees
        end_year: body.end_year ?? null,
        // Verification type
        verification_type: verificationType,
      })
      .select()
      .single();

    if (reviewError) {
      console.error("Error inserting review:", reviewError);
      // Rollback session update on failure
      await supabase
        .from("verification_sessions")
        .update({ review_submitted: false })
        .eq("id", body.session_id);
      
      return new Response(
        JSON.stringify({ error: "Failed to submit review" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log("Review inserted:", reviewData.id);

    // Insert rating categories
    if (body.ratings && body.ratings.length > 0) {
      const ratingInserts = body.ratings
        .filter(r => r.rating > 0)
        .map(r => ({
          review_id: reviewData.id,
          category: r.category,
          rating: r.rating,
        }));

      if (ratingInserts.length > 0) {
        const { error: ratingsError } = await supabase
          .from("rating_categories")
          .insert(ratingInserts);

        if (ratingsError) {
          console.error("Error inserting ratings:", ratingsError);
        }
      }
    }

    // Insert company benefit confirmations
    if (body.company_benefit_ids && body.company_benefit_ids.length > 0) {
      const benefitInserts = body.company_benefit_ids.map(benefitId => ({
        benefit_id: benefitId,
        review_id: reviewData.id,
      }));

      const { error: benefitError } = await supabase
        .from("benefit_confirmations")
        .insert(benefitInserts);

      if (benefitError) {
        console.error("Error inserting company benefit confirmations:", benefitError);
      }
    }

    // Insert standard benefit selections
    if (body.standard_benefit_ids && body.standard_benefit_ids.length > 0) {
      const standardBenefitInserts = body.standard_benefit_ids.map(benefitId => ({
        standard_benefit_id: benefitId,
        review_id: reviewData.id,
      }));

      const { error: stdBenefitError } = await supabase
        .from("review_standard_benefits")
        .insert(standardBenefitInserts);

      if (stdBenefitError) {
        console.error("Error inserting standard benefit selections:", stdBenefitError);
      }
    }

    // Insert custom benefits reported by employee
    if (body.custom_benefits && body.custom_benefits.length > 0) {
      for (const benefitName of body.custom_benefits) {
        const trimmedName = benefitName.trim();
        if (!trimmedName) continue;

        // First, insert the benefit into company_benefits (if it doesn't exist)
        const { data: existingBenefit } = await supabase
          .from("company_benefits")
          .select("id")
          .eq("company_id", body.company_id)
          .ilike("benefit_name", trimmedName)
          .maybeSingle();

        let benefitId: string;

        if (existingBenefit) {
          benefitId = existingBenefit.id;
        } else {
          // Insert new benefit
          const { data: newBenefit, error: insertError } = await supabase
            .from("company_benefits")
            .insert({
              company_id: body.company_id,
              benefit_name: trimmedName,
            })
            .select("id")
            .single();

          if (insertError) {
            console.error("Error inserting custom benefit:", insertError);
            continue;
          }
          benefitId = newBenefit.id;
        }

        // Insert confirmation for this benefit
        const { error: confirmError } = await supabase
          .from("benefit_confirmations")
          .insert({
            benefit_id: benefitId,
            review_id: reviewData.id,
          });

        if (confirmError) {
          console.error("Error inserting custom benefit confirmation:", confirmError);
        }
      }
      console.log("Custom benefits processed successfully");
    }

    // Insert private feedback to employer_feedback table if provided
    if (body.private_feedback && body.private_feedback.trim()) {
      const { error: feedbackError } = await supabase
        .from("employer_feedback")
        .insert({
          company_id: body.company_id,
          title: "Anonymous Employee Feedback",
          content: body.private_feedback.trim(),
        });

      if (feedbackError) {
        console.error("Error inserting private employer feedback:", feedbackError);
      } else {
        console.log("Private employer feedback inserted successfully");
      }
    }

    // Get company name for the email notification
    const { data: companyData } = await supabase
      .from("companies")
      .select("name")
      .eq("id", body.company_id)
      .single();

    const companyName = companyData?.name || "Unknown Company";

    // Get rating categories for the email
    const { data: ratingCategoriesData } = await supabase
      .from("rating_categories")
      .select("category, rating")
      .eq("review_id", reviewData.id);

    // Get standard benefits for the email
    const { data: benefitsData } = await supabase
      .from("review_standard_benefits")
      .select("standard_benefits(benefit_label)")
      .eq("review_id", reviewData.id);

    // Helper function to format currency
    const formatCurrency = (amount: number | null | undefined, currency: string | null | undefined) => {
      if (!amount) return "Not provided";
      return `${currency || "USD"} ${amount.toLocaleString()}`;
    };

    // Build category ratings HTML
    const categoryRatingsHtml = ratingCategoriesData && ratingCategoriesData.length > 0
      ? ratingCategoriesData.map(cat => `<li>${cat.category}: ${cat.rating}/5</li>`).join("")
      : "<li>No category ratings provided</li>";

    // Build benefits HTML
    const benefitsHtml = benefitsData && benefitsData.length > 0
      ? benefitsData.map(b => `<li>${(b.standard_benefits as any)?.benefit_label || "Unknown"}</li>`).join("")
      : "<li>No benefits selected</li>";

    // Send email notification to admin
    try {
      if (RESEND_API_KEY) {
        const emailHtml = `
          <h2>New Review Submitted</h2>
          <p>A new review has been submitted and requires moderation.</p>
          
          <h3>📋 Basic Information</h3>
          <table style="border-collapse: collapse; width: 100%; margin-bottom: 20px;">
            <tr>
              <td style="padding: 8px; border: 1px solid #ddd; background: #f9f9f9;"><strong>Company</strong></td>
              <td style="padding: 8px; border: 1px solid #ddd;">${companyName}</td>
            </tr>
            <tr>
              <td style="padding: 8px; border: 1px solid #ddd; background: #f9f9f9;"><strong>Title</strong></td>
              <td style="padding: 8px; border: 1px solid #ddd;">${body.title}</td>
            </tr>
            <tr>
              <td style="padding: 8px; border: 1px solid #ddd; background: #f9f9f9;"><strong>Overall Rating</strong></td>
              <td style="padding: 8px; border: 1px solid #ddd;">${body.rating}/5</td>
            </tr>
            <tr>
              <td style="padding: 8px; border: 1px solid #ddd; background: #f9f9f9;"><strong>Recommend to Friend</strong></td>
              <td style="padding: 8px; border: 1px solid #ddd;">${body.recommendation || "Not specified"}</td>
            </tr>
            <tr>
              <td style="padding: 8px; border: 1px solid #ddd; background: #f9f9f9;"><strong>CEO Approval</strong></td>
              <td style="padding: 8px; border: 1px solid #ddd;">${body.ceo_approval === true ? "Yes" : body.ceo_approval === false ? "No" : "Not specified"}</td>
            </tr>
          </table>

          <h3>💼 Employment Context</h3>
          <table style="border-collapse: collapse; width: 100%; margin-bottom: 20px;">
            <tr>
              <td style="padding: 8px; border: 1px solid #ddd; background: #f9f9f9;"><strong>Employment Status</strong></td>
              <td style="padding: 8px; border: 1px solid #ddd;">${body.employment_status || "Not specified"}</td>
            </tr>
            <tr>
              <td style="padding: 8px; border: 1px solid #ddd; background: #f9f9f9;"><strong>Employment Type</strong></td>
              <td style="padding: 8px; border: 1px solid #ddd;">${body.employment_type || "Not specified"}</td>
            </tr>
            <tr>
              <td style="padding: 8px; border: 1px solid #ddd; background: #f9f9f9;"><strong>Role Level</strong></td>
              <td style="padding: 8px; border: 1px solid #ddd;">${body.role_level || "Not specified"}</td>
            </tr>
            <tr>
              <td style="padding: 8px; border: 1px solid #ddd; background: #f9f9f9;"><strong>Department</strong></td>
              <td style="padding: 8px; border: 1px solid #ddd;">${body.department || "Not specified"}</td>
            </tr>
            <tr>
              <td style="padding: 8px; border: 1px solid #ddd; background: #f9f9f9;"><strong>Role Focus</strong></td>
              <td style="padding: 8px; border: 1px solid #ddd;">${body.role_focus || "Not specified"}</td>
            </tr>
            <tr>
              <td style="padding: 8px; border: 1px solid #ddd; background: #f9f9f9;"><strong>Tenure</strong></td>
              <td style="padding: 8px; border: 1px solid #ddd;">${body.tenure_range || "Not specified"}</td>
            </tr>
          </table>

          <h3>💰 Compensation</h3>
          <table style="border-collapse: collapse; width: 100%; margin-bottom: 20px;">
            <tr>
              <td style="padding: 8px; border: 1px solid #ddd; background: #f9f9f9;"><strong>Salary Range</strong></td>
              <td style="padding: 8px; border: 1px solid #ddd;">${body.salary_range || "Not specified"}</td>
            </tr>
            <tr>
              <td style="padding: 8px; border: 1px solid #ddd; background: #f9f9f9;"><strong>Monthly Take-Home Salary${body.is_net_salary ? " (Net)" : ""}</strong></td>
              <td style="padding: 8px; border: 1px solid #ddd;">${formatCurrency(body.base_salary_amount, body.base_salary_currency)}</td>
            </tr>
            <tr>
              <td style="padding: 8px; border: 1px solid #ddd; background: #f9f9f9;"><strong>Monthly Allowances</strong></td>
              <td style="padding: 8px; border: 1px solid #ddd;">${formatCurrency(body.allowances_amount, body.allowances_currency)}</td>
            </tr>
            <tr>
              <td style="padding: 8px; border: 1px solid #ddd; background: #f9f9f9;"><strong>Annual Bonus</strong></td>
              <td style="padding: 8px; border: 1px solid #ddd;">${formatCurrency(body.bonus_amount, body.bonus_currency)}</td>
            </tr>
            <tr>
              <td style="padding: 8px; border: 1px solid #ddd; background: #f9f9f9;"><strong>Market Alignment</strong></td>
              <td style="padding: 8px; border: 1px solid #ddd;">${body.market_alignment || "Not specified"}</td>
            </tr>
            <tr>
              <td style="padding: 8px; border: 1px solid #ddd; background: #f9f9f9;"><strong>Pay Transparency</strong></td>
              <td style="padding: 8px; border: 1px solid #ddd;">${body.pay_transparency || "Not specified"}</td>
            </tr>
          </table>

          <h3>⭐ Category Ratings</h3>
          <ul style="margin-bottom: 20px;">
            ${categoryRatingsHtml}
          </ul>

          <h3>🎁 Benefits Confirmed</h3>
          <ul style="margin-bottom: 20px;">
            ${benefitsHtml}
          </ul>

          <h3>✅ Pros</h3>
          <div style="background: #e8f5e9; padding: 15px; border-radius: 8px; margin-bottom: 15px;">
            <p style="margin: 0; white-space: pre-wrap;">${body.pros}</p>
          </div>

          <h3>❌ Cons</h3>
          <div style="background: #ffebee; padding: 15px; border-radius: 8px; margin-bottom: 15px;">
            <p style="margin: 0; white-space: pre-wrap;">${body.cons}</p>
          </div>

          ${body.advice ? `
          <h3>💡 One Thing to Know</h3>
          <div style="background: #fff8e1; padding: 15px; border-radius: 8px; margin-bottom: 15px;">
            <p style="margin: 0; white-space: pre-wrap;">${body.advice}</p>
          </div>
          ` : ""}

          ${body.did_interview ? `
          <h3>🎤 Interview Experience</h3>
          <table style="border-collapse: collapse; width: 100%; margin-bottom: 15px;">
            <tr>
              <td style="padding: 8px; border: 1px solid #ddd; background: #f9f9f9;"><strong>Interview Rating</strong></td>
              <td style="padding: 8px; border: 1px solid #ddd;">${body.interview_experience_rating ? `${body.interview_experience_rating}/5` : "Not rated"}</td>
            </tr>
            <tr>
              <td style="padding: 8px; border: 1px solid #ddd; background: #f9f9f9;"><strong>Difficulty</strong></td>
              <td style="padding: 8px; border: 1px solid #ddd;">${body.interview_difficulty || "Not specified"}</td>
            </tr>
            <tr>
              <td style="padding: 8px; border: 1px solid #ddd; background: #f9f9f9;"><strong>Number of Rounds</strong></td>
              <td style="padding: 8px; border: 1px solid #ddd;">${body.interview_count || "Not specified"}</td>
            </tr>
          </table>
          ${body.interview_description ? `
          <p><strong>Interview Description:</strong></p>
          <div style="background: #f5f5f5; padding: 15px; border-radius: 8px; margin-bottom: 10px;">
            <p style="margin: 0; white-space: pre-wrap;">${body.interview_description}</p>
          </div>
          ` : ""}
          ${body.interview_tips ? `
          <p><strong>Interview Tips:</strong></p>
          <div style="background: #f5f5f5; padding: 15px; border-radius: 8px; margin-bottom: 15px;">
            <p style="margin: 0; white-space: pre-wrap;">${body.interview_tips}</p>
          </div>
          ` : ""}
          ` : ""}

          ${(body.age_range || body.gender || body.ethnicity || body.education_level) ? `
          <h3>👥 Demographics</h3>
          <table style="border-collapse: collapse; width: 100%; margin-bottom: 20px;">
            <tr>
              <td style="padding: 8px; border: 1px solid #ddd; background: #f9f9f9;"><strong>Age Range</strong></td>
              <td style="padding: 8px; border: 1px solid #ddd;">${body.age_range || "Not specified"}</td>
            </tr>
            <tr>
              <td style="padding: 8px; border: 1px solid #ddd; background: #f9f9f9;"><strong>Gender</strong></td>
              <td style="padding: 8px; border: 1px solid #ddd;">${body.gender || "Not specified"}</td>
            </tr>
            <tr>
              <td style="padding: 8px; border: 1px solid #ddd; background: #f9f9f9;"><strong>Ethnicity</strong></td>
              <td style="padding: 8px; border: 1px solid #ddd;">${body.ethnicity || "Not specified"}</td>
            </tr>
            <tr>
              <td style="padding: 8px; border: 1px solid #ddd; background: #f9f9f9;"><strong>Education Level</strong></td>
              <td style="padding: 8px; border: 1px solid #ddd;">${body.education_level || "Not specified"}</td>
            </tr>
          </table>
          ` : ""}

          ${body.private_feedback ? `
          <h3>🔒 Private Feedback (For Employer Only)</h3>
          <div style="background: #fff3cd; border: 1px solid #ffc107; padding: 15px; border-radius: 8px; margin-bottom: 20px;">
            <p style="margin: 0; white-space: pre-wrap;">${body.private_feedback}</p>
          </div>
          ` : ""}
          
          <p style="margin-top: 20px;">
            <a href="https://pachena.co/admin/reviews" style="background-color: #7c3aed; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px;">
              Review in Admin Dashboard
            </a>
          </p>
        `;

        const emailResponse = await fetch("https://api.resend.com/emails", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${RESEND_API_KEY}`,
          },
          body: JSON.stringify({
            from: "Pachena <notifications@pachena.co>",
            to: ["hello@pachena.co"],
            subject: `New Review Pending Approval - ${companyName}`,
            html: emailHtml,
          }),
        });

        if (emailResponse.ok) {
          console.log("Admin notification email sent successfully");
        } else {
          const errorText = await emailResponse.text();
          console.error("Failed to send admin notification email:", errorText);
        }
      } else {
        console.warn("RESEND_API_KEY not configured, skipping email notification");
      }
    } catch (emailError) {
      console.error("Failed to send admin notification email:", emailError);
      // Don't fail the review submission if email fails
    }

    console.log("Review submission completed successfully");

    // Fire-and-forget: trigger similarity detection (non-blocking)
    try {
      const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
      const detectUrl = `${supabaseUrl}/functions/v1/detect-review-similarity`;
      fetch(detectUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${Deno.env.get("SUPABASE_ANON_KEY")}`,
        },
        body: JSON.stringify({ review_id: reviewData.id }),
      }).catch((err) => console.error("Similarity detection call failed:", err));
      console.log("Similarity detection triggered for review:", reviewData.id);
    } catch (detectErr) {
      console.error("Failed to trigger similarity detection:", detectErr);
    }

    return new Response(
      JSON.stringify({
        success: true,
        review_id: reviewData.id,
        message: "Review submitted successfully. It will be visible after moderation.",
        _version: VERSION,
        _deployed_at: DEPLOYED_AT,
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error: any) {
    console.error("Error in submit-review:", error);
    return new Response(
      JSON.stringify({
        error: error.message || "Internal server error",
        _version: VERSION,
        _deployed_at: DEPLOYED_AT,
      }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
