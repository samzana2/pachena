import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const VERSION = "send-claim-confirmation@2026-02-06.1";
const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": 
    "authorization, x-client-info, apikey, content-type, " +
    "x-supabase-client-platform, x-supabase-client-platform-version, " +
    "x-supabase-client-runtime, x-supabase-client-runtime-version",
  "Access-Control-Allow-Methods": "GET, POST, PUT, PATCH, DELETE, OPTIONS",
};

interface ClaimConfirmationRequest {
  email: string;
  full_name: string;
  company_name: string;
}

serve(async (req: Request): Promise<Response> => {
  console.log(`[${VERSION}] ${req.method} ${new URL(req.url).pathname}`);

  // Handle CORS preflight with dynamic header reflection
  if (req.method === "OPTIONS") {
    const requestedHeaders = req.headers.get("Access-Control-Request-Headers");
    return new Response(null, { 
      headers: {
        ...corsHeaders,
        "Access-Control-Allow-Headers": requestedHeaders || corsHeaders["Access-Control-Allow-Headers"],
      }
    });
  }

  try {
    const { email, full_name, company_name }: ClaimConfirmationRequest = await req.json();

    if (!email || !full_name || !company_name) {
      console.error("Missing required fields:", { email, full_name, company_name });
      return new Response(
        JSON.stringify({ error: "Missing required fields", _version: VERSION }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    console.log(`Sending claim confirmation email to ${email} for company "${company_name}"`);

    const emailResponse = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: "Pachena <noreply@pachena.co>",
        to: [email],
        subject: `We received your claim request for ${company_name}`,
        html: `
          <!DOCTYPE html>
          <html>
            <head>
              <meta charset="utf-8">
              <meta name="viewport" content="width=device-width, initial-scale=1.0">
            </head>
            <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
              <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; border-radius: 10px 10px 0 0; text-align: center;">
                <h1 style="color: white; margin: 0; font-size: 24px;">📋 Claim Request Received</h1>
              </div>
              
              <div style="background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px;">
                <p style="font-size: 16px; margin-bottom: 20px;">
                  Hi ${full_name},
                </p>
                
                <p style="font-size: 16px; margin-bottom: 20px;">
                  Thank you for submitting your claim request for <strong>${company_name}</strong>. We've received your request and our team will review it shortly.
                </p>
                
                <div style="background: white; border-left: 4px solid #667eea; padding: 15px 20px; margin: 20px 0; border-radius: 0 8px 8px 0;">
                  <p style="margin: 0; font-size: 14px; color: #666;">
                    <strong>What happens next?</strong><br>
                    Our team will verify your information and review your claim request. This typically takes 1-3 business days. You'll receive an email once a decision has been made.
                  </p>
                </div>
                
                <p style="font-size: 14px; color: #666; margin-top: 30px;">
                  If you have any questions in the meantime, feel free to reach out to our support team.
                </p>
                
                <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;">
                
                <p style="font-size: 12px; color: #999; text-align: center;">
                  This email was sent by Pachena. If you didn't submit this claim request, please contact us immediately.
                </p>
              </div>
            </body>
          </html>
        `,
      }),
    });

    if (!emailResponse.ok) {
      const errorData = await emailResponse.json();
      console.error("Resend API error:", errorData);
      throw new Error(errorData.message || "Failed to send email");
    }

    const emailData = await emailResponse.json();
    console.log("Claim confirmation email sent successfully:", emailData);

    return new Response(JSON.stringify({ success: true, data: emailData, _version: VERSION }), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  } catch (error: any) {
    console.error("Error sending claim confirmation email:", error);
    return new Response(
      JSON.stringify({ error: error.message, _version: VERSION }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
});
