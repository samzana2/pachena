import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { Resend } from 'https://esm.sh/resend@2.0.0';
import { z } from "https://deno.land/x/zod@v3.22.4/mod.ts";

const VERSION = "flag-review@2026-02-06.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": 
    "authorization, x-client-info, apikey, content-type, " +
    "x-supabase-client-platform, x-supabase-client-platform-version, " +
    "x-supabase-client-runtime, x-supabase-client-runtime-version",
  "Access-Control-Allow-Methods": "GET, POST, PUT, PATCH, DELETE, OPTIONS",
};

// Zod schema for input validation with length limits
const flagSchema = z.object({
  reviewId: z.string().uuid("Invalid review ID format"),
  reason: z.string().max(200, "Reason must be less than 200 characters").optional(),
  details: z.string().max(2000, "Details must be less than 2000 characters").optional(),
  section: z.enum(['review', 'interview']).optional(),
});

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

Deno.serve(async (req) => {
  console.log(`[${VERSION}] ${req.method} ${new URL(req.url).pathname}`);

  // Handle CORS preflight with dynamic header reflection
  if (req.method === 'OPTIONS') {
    const requestedHeaders = req.headers.get("Access-Control-Request-Headers");
    return new Response(null, { 
      headers: {
        ...corsHeaders,
        "Access-Control-Allow-Headers": requestedHeaders || corsHeaders["Access-Control-Allow-Headers"],
      }
    });
  }

  if (req.method !== 'POST') {
    return new Response(
      JSON.stringify({ error: 'Method not allowed', _version: VERSION }),
      { status: 405, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const rawBody = await req.json();
    
    // Validate input with zod schema
    const parseResult = flagSchema.safeParse(rawBody);
    if (!parseResult.success) {
      const errors = parseResult.error.errors.map(e => `${e.path.join('.')}: ${e.message}`).join(', ');
      console.error("Validation error:", errors);
      return new Response(
        JSON.stringify({ error: `Validation failed: ${errors}`, _version: VERSION }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    const { reviewId, reason, details, section } = parseResult.data;

    // Get client IP and hash it for rate limiting (no raw IPs stored)
    const rawIp = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 
                     req.headers.get('cf-connecting-ip') || 
                     req.headers.get('x-real-ip') ||
                     'unknown';
    const encoder = new TextEncoder();
    const hashBuffer = await crypto.subtle.digest("SHA-256", encoder.encode(rawIp));
    const clientIp = Array.from(new Uint8Array(hashBuffer)).map(b => b.toString(16).padStart(2, "0")).join("");

    console.log(`Public flag request for review ${reviewId}${reason ? ` with reason: ${reason}` : ''}${section ? ` in section: ${section}` : ''}`);

    // Check if review exists and get details for email
    const { data: review, error: fetchError } = await supabase
      .from('reviews')
      .select('id, flagged, report_count, title, pros, cons, companies(name, slug)')
      .eq('id', reviewId)
      .single();

    if (fetchError || !review) {
      console.error('Review not found:', fetchError);
      return new Response(
        JSON.stringify({ error: 'Review not found', _version: VERSION }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Rate limit: max 3 reports per IP per review within 24 hours
    const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
    const { count: recentReportCount } = await supabase
      .from('review_reports')
      .select('id', { count: 'exact', head: true })
      .eq('review_id', reviewId)
      .eq('reporter_ip', clientIp)
      .gte('created_at', twentyFourHoursAgo);

    if (recentReportCount !== null && recentReportCount >= 3) {
      console.log(`Rate limit reached for review ${reviewId} in 24h`);
      return new Response(
        JSON.stringify({ success: true, message: 'Report submitted', _version: VERSION }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Insert the report into review_reports table
    const { error: insertError } = await supabase
      .from('review_reports')
      .insert({
        review_id: reviewId,
        reason: reason || 'No reason provided',
        details: details || null,
        reporter_ip: clientIp,
        reported_section: section || 'review',
      });

    if (insertError) {
      console.error('Failed to insert report:', insertError);
      return new Response(
        JSON.stringify({ error: 'Failed to submit report', _version: VERSION }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Determine if this is the first report
    const isFirstReport = !review.flagged;
    const currentReportCount = review.report_count || 0;

    // Update the review with new report count and flagged status
    const { error: updateError } = await supabase
      .from('reviews')
      .update({ 
        flagged: true,
        report_count: currentReportCount + 1,
        moderation_notes: isFirstReport 
          ? `User reported: ${reason || 'No reason provided'}` 
          : review.flagged 
            ? undefined  // Don't update notes on subsequent reports
            : `User reported: ${reason || 'No reason provided'}`
      })
      .eq('id', reviewId);

    if (updateError) {
      console.error('Failed to update review:', updateError);
      return new Response(
        JSON.stringify({ error: 'Failed to submit report', _version: VERSION }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Review ${reviewId} report count updated to ${currentReportCount + 1}. First report: ${isFirstReport}`);

    // Only send email notification on first report
    if (isFirstReport) {
      const companyData = review.companies as { name?: string; slug?: string } | null;
      const companyName = companyData?.name || 'Unknown Company';
      const appUrl = Deno.env.get('APP_URL') || 'https://pachena.co';

      try {
        await resend.emails.send({
          from: "Pachena <notifications@pachena.co>",
          to: ["hello@pachena.co"],
          subject: `Review Reported: ${review.title}`,
          html: `
            <h2>A review has been reported</h2>
            <p>A user has flagged the following review for moderation:</p>
            
            <div style="background: #f5f5f5; padding: 16px; border-radius: 8px; margin: 16px 0;">
              <p><strong>Company:</strong> ${companyName}</p>
              <p><strong>Review Title:</strong> ${review.title}</p>
              <p><strong>Reported Section:</strong> ${section === 'interview' ? 'Interview Experience' : 'Employee Review'}</p>
              <p><strong>Report Reason:</strong> ${reason || 'No reason provided'}</p>
              ${details ? `<p><strong>Additional Details:</strong> ${details}</p>` : ''}
            </div>
            
            <h3>Review Content</h3>
            <p><strong>Pros:</strong> ${review.pros}</p>
            <p><strong>Cons:</strong> ${review.cons}</p>
            
            <p style="margin-top: 24px;">
              <a href="${appUrl}/admin/reviews" style="background: #0070f3; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px;">
                Review in Dashboard
              </a>
            </p>
            
            <p style="color: #666; font-size: 12px; margin-top: 24px;">
              This is an automated notification from Pachena.
            </p>
          `,
        });
        console.log(`Email notification sent for flagged review ${reviewId}`);
      } catch (emailError) {
        // Log but don't fail the request if email fails
        console.error('Failed to send email notification:', emailError);
      }
    } else {
      console.log(`Skipping email for review ${reviewId} - already flagged (report #${currentReportCount + 1})`);
    }

    return new Response(
      JSON.stringify({ success: true, message: 'Report submitted', _version: VERSION }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Unexpected error:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error', _version: VERSION }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
