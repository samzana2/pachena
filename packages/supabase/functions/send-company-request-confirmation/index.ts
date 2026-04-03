import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const VERSION = "send-company-request-confirmation@2026-02-06.1";
const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": 
    "authorization, x-client-info, apikey, content-type, " +
    "x-supabase-client-platform, x-supabase-client-platform-version, " +
    "x-supabase-client-runtime, x-supabase-client-runtime-version",
  "Access-Control-Allow-Methods": "GET, POST, PUT, PATCH, DELETE, OPTIONS",
};

interface ConfirmationEmailRequest {
  email?: string;
  company_name: string;
  industry?: string;
  location?: string;
  website?: string;
}

serve(async (req: Request): Promise<Response> => {
  console.log(`[${VERSION}] ${req.method} ${new URL(req.url).pathname}`);

  // Handle CORS preflight requests with dynamic header reflection
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
    const { email, company_name, industry, location, website }: ConfirmationEmailRequest = await req.json();

    if (!company_name) {
      console.error("Missing required field: company_name");
      return new Response(
        JSON.stringify({ error: "Missing required field: company_name", _version: VERSION }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    console.log(`Processing company request for "${company_name}"`);

    // Always send admin notification to hello@pachena.co
    const adminEmailResponse = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: "Pachena <noreply@pachena.co>",
        to: ["hello@pachena.co"],
        subject: `🏢 New Company Request: ${company_name}`,
        html: `
          <!DOCTYPE html>
          <html>
            <head>
              <meta charset="utf-8">
              <meta name="viewport" content="width=device-width, initial-scale=1.0">
            </head>
            <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
              <div style="background: #78350f; padding: 30px; border-radius: 10px 10px 0 0; text-align: center;">
                <h1 style="color: white; margin: 0; font-size: 24px;">🏢 New Company Request</h1>
              </div>
              
              <div style="background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px;">
                <p style="font-size: 16px; margin-bottom: 20px;">
                  A new company request has been submitted and is awaiting review.
                </p>
                
                <div style="background: white; border: 1px solid #e5e7eb; border-radius: 8px; padding: 20px; margin-bottom: 20px;">
                  <table style="width: 100%; border-collapse: collapse;">
                    <tr>
                      <td style="padding: 8px 0; font-weight: bold; color: #555; width: 120px;">Company:</td>
                      <td style="padding: 8px 0;">${company_name}</td>
                    </tr>
                    ${website ? `
                    <tr>
                      <td style="padding: 8px 0; font-weight: bold; color: #555;">Website:</td>
                      <td style="padding: 8px 0;"><a href="${website.startsWith('http') ? website : `https://${website}`}" style="color: #78350f;">${website}</a></td>
                    </tr>
                    ` : ''}
                    ${industry ? `
                    <tr>
                      <td style="padding: 8px 0; font-weight: bold; color: #555;">Industry:</td>
                      <td style="padding: 8px 0;">${industry}</td>
                    </tr>
                    ` : ''}
                    ${location ? `
                    <tr>
                      <td style="padding: 8px 0; font-weight: bold; color: #555;">Location:</td>
                      <td style="padding: 8px 0;">${location}</td>
                    </tr>
                    ` : ''}
                    ${email ? `
                    <tr>
                      <td style="padding: 8px 0; font-weight: bold; color: #555;">Requester:</td>
                      <td style="padding: 8px 0;"><a href="mailto:${email}" style="color: #78350f;">${email}</a></td>
                    </tr>
                    ` : ''}
                  </table>
                </div>
                
                <p style="font-size: 14px; color: #666;">
                  Review this request in the <a href="https://pachena.lovable.app/admin/company-requests" style="color: #78350f;">Admin Dashboard</a>.
                </p>
              </div>
            </body>
          </html>
        `,
      }),
    });

    if (!adminEmailResponse.ok) {
      const errorData = await adminEmailResponse.json();
      console.error("Resend API error (admin notification):", errorData);
      // Continue even if admin email fails - we still want to send user confirmation
    } else {
      console.log("Admin notification sent successfully");
    }

    // Send confirmation email to requester if email was provided
    if (email) {
      console.log(`Sending confirmation email to ${email}`);
      
      const userEmailResponse = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${RESEND_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          from: "Pachena <noreply@pachena.co>",
          to: [email],
          subject: `We've received your request to add ${company_name}`,
          html: `
            <!DOCTYPE html>
            <html>
              <head>
                <meta charset="utf-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
              </head>
              <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
                <div style="background: #78350f; padding: 30px; border-radius: 10px 10px 0 0; text-align: center;">
                  <h1 style="color: white; margin: 0; font-size: 24px;">📬 Request Received!</h1>
                </div>
                
                <div style="background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px;">
                  <p style="font-size: 16px; margin-bottom: 20px;">
                    Thank you for requesting <strong>${company_name}</strong> to be added to Pachena!
                  </p>
                  
                  <p style="font-size: 16px; margin-bottom: 20px;">
                    Our team will review your request and verify the company details. This typically takes 1-2 business days.
                  </p>
                  
                  <div style="background: white; border-left: 4px solid #78350f; padding: 15px 20px; margin: 25px 0; border-radius: 0 8px 8px 0;">
                    <p style="margin: 0; font-size: 14px; color: #555;">
                      <strong>What happens next?</strong><br>
                      Once approved, we'll send you another email with a direct link to the company profile so you can be the first to leave a review!
                    </p>
                  </div>
                  
                  <p style="font-size: 14px; color: #666; margin-top: 30px;">
                    Thank you for helping build a more transparent workplace community.
                  </p>
                  
                  <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;">
                  
                  <p style="font-size: 12px; color: #999; text-align: center;">
                    This email was sent by Pachena because you requested a company to be added. If you didn't make this request, you can safely ignore this email.
                  </p>
                </div>
              </body>
            </html>
          `,
        }),
      });

      if (!userEmailResponse.ok) {
        const errorData = await userEmailResponse.json();
        console.error("Resend API error (user confirmation):", errorData);
      } else {
        console.log("User confirmation email sent successfully");
      }
    }

    return new Response(JSON.stringify({ success: true, _version: VERSION }), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  } catch (error: any) {
    console.error("Error in send-company-request-confirmation:", error);
    return new Response(
      JSON.stringify({ error: error.message, _version: VERSION }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
});
