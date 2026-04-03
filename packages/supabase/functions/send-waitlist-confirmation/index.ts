import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const VERSION = "send-waitlist-confirmation@2026-02-06.1";
const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": 
    "authorization, x-client-info, apikey, content-type, " +
    "x-supabase-client-platform, x-supabase-client-platform-version, " +
    "x-supabase-client-runtime, x-supabase-client-runtime-version",
  "Access-Control-Allow-Methods": "GET, POST, PUT, PATCH, DELETE, OPTIONS",
};

interface WaitlistConfirmationRequest {
  email: string;
  company_name?: string;
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
    const { email, company_name }: WaitlistConfirmationRequest = await req.json();

    if (!email) {
      console.error("Missing required email field");
      return new Response(
        JSON.stringify({ error: "Email is required", _version: VERSION }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    console.log(`Sending waitlist confirmation email to ${email}`);

    // Send confirmation to the user
    const userEmailResponse = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: "Pachena <noreply@pachena.co>",
        to: [email],
        subject: "You're on the Pachena Employers waitlist!",
        html: `
          <!DOCTYPE html>
          <html>
            <head>
              <meta charset="utf-8">
              <meta name="viewport" content="width=device-width, initial-scale=1.0">
            </head>
            <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
              <div style="background: linear-gradient(135deg, #fef3c7 0%, #fce7f3 50%, #ede9fe 100%); padding: 30px; border-radius: 10px 10px 0 0; text-align: center;">
                <h1 style="color: #1f2937; margin: 0; font-size: 24px;">🎉 You're on the list!</h1>
              </div>
              
              <div style="background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px;">
                <p style="font-size: 16px; margin-bottom: 20px;">
                  Hi there${company_name ? ` from <strong>${company_name}</strong>` : ''},
                </p>
                
                <p style="font-size: 16px; margin-bottom: 20px;">
                  Thank you for joining the Pachena for Employers waitlist. We've added you to the list and will notify you as soon as employer features are available.
                </p>
                
                <p style="font-size: 16px; margin-bottom: 20px;">
                  We're working hard to bring you tools to claim your company profile, respond to employee reviews, and access workforce insights.
                </p>
                
                <p style="font-size: 16px; margin-bottom: 20px;">
                  Stay tuned!
                </p>
                
                <p style="font-size: 16px; margin-bottom: 0;">
                  — The Pachena Team
                </p>
                
                <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;">
                
                <p style="font-size: 12px; color: #999; text-align: center;">
                  This email was sent by Pachena because you signed up for our employer waitlist.<br>
                  If you didn't sign up, you can safely ignore this email.
                </p>
              </div>
            </body>
          </html>
        `,
      }),
    });

    if (!userEmailResponse.ok) {
      const errorData = await userEmailResponse.json();
      console.error("User email error:", errorData);
    } else {
      console.log("User confirmation email sent successfully");
    }

    // Send notification to admin (hello@pachena.co)
    const adminEmailResponse = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: "Pachena <noreply@pachena.co>",
        to: ["hello@pachena.co"],
        subject: `New Employer Waitlist Signup${company_name ? `: ${company_name}` : ''}`,
        html: `
          <h1>New Employer Waitlist Signup</h1>
          <p><strong>Email:</strong> ${email}</p>
          ${company_name ? `<p><strong>Company:</strong> ${company_name}</p>` : '<p><em>No company name provided</em></p>'}
          <hr />
          <p style="color: #666; font-size: 12px;">
            This notification was sent because someone joined the Pachena employer waitlist.
          </p>
        `,
      }),
    });

    if (!adminEmailResponse.ok) {
      const errorData = await adminEmailResponse.json();
      console.error("Admin notification error:", errorData);
    } else {
      console.log("Admin notification sent successfully");
    }

    return new Response(JSON.stringify({ success: true, _version: VERSION }), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  } catch (error: any) {
    console.error("Error sending waitlist confirmation email:", error);
    return new Response(
      JSON.stringify({ error: error.message, _version: VERSION }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
});
