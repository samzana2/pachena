import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const VERSION = "send-contact-notification@2026-02-15.1";
const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");

// Rate limiting: 5 contact messages per hour per IP
const RATE_LIMIT_WINDOW_HOURS = 1;
const MAX_REQUESTS_PER_IP = 5;

function getRawClientIP(req: Request): string {
  const forwardedFor = req.headers.get("x-forwarded-for");
  if (forwardedFor) return forwardedFor.split(",")[0].trim();
  const realIP = req.headers.get("x-real-ip");
  if (realIP) return realIP.trim();
  const cfIP = req.headers.get("cf-connecting-ip");
  if (cfIP) return cfIP.trim();
  return "unknown";
}

async function hashIP(ip: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(ip);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((byte) => byte.toString(16).padStart(2, "0")).join("");
}

async function getClientIP(req: Request): Promise<string> {
  const raw = getRawClientIP(req);
  return raw === "unknown" ? raw : await hashIP(raw);
}

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": 
    "authorization, x-client-info, apikey, content-type, " +
    "x-supabase-client-platform, x-supabase-client-platform-version, " +
    "x-supabase-client-runtime, x-supabase-client-runtime-version",
  "Access-Control-Allow-Methods": "GET, POST, PUT, PATCH, DELETE, OPTIONS",
};

function escapeHtml(str: string): string {
  return str.replace(/[&<>"']/g, (m) => {
    const map: Record<string, string> = {
      '&': '&amp;', '<': '&lt;', '>': '&gt;',
      '"': '&quot;', "'": '&#39;'
    };
    return map[m];
  });
}

// Input validation
function validateInput(body: unknown): { name: string; email: string; subject: string; message: string } | null {
  if (!body || typeof body !== "object") return null;
  const { name, email, subject, message } = body as Record<string, unknown>;

  if (typeof name !== "string" || name.trim().length === 0 || name.length > 200) return null;
  if (typeof email !== "string" || email.length > 255 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return null;
  if (typeof subject !== "string" || subject.trim().length === 0 || subject.length > 200) return null;
  if (typeof message !== "string" || message.trim().length === 0 || message.length > 5000) return null;

  return {
    name: name.trim(),
    email: email.trim().toLowerCase(),
    subject: subject.trim(),
    message: message.trim(),
  };
}

serve(async (req: Request): Promise<Response> => {
  console.log(`[${VERSION}] ${req.method} ${new URL(req.url).pathname}`);

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
    // Rate limiting
    const clientIP = await getClientIP(req);
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const serviceClient = createClient(supabaseUrl, supabaseServiceKey);

    const rateLimitCutoff = new Date(Date.now() - RATE_LIMIT_WINDOW_HOURS * 60 * 60 * 1000).toISOString();
    const { count, error: rlError } = await serviceClient
      .from("rate_limit_entries")
      .select("*", { count: "exact", head: true })
      .eq("ip_address", clientIP)
      .eq("endpoint", "send-contact-notification")
      .gte("created_at", rateLimitCutoff);

    if (!rlError && count !== null && count >= MAX_REQUESTS_PER_IP) {
      console.log("Rate limit exceeded for hashed IP");
      return new Response(
        JSON.stringify({ error: "Too many messages. Please try again later.", _version: VERSION }),
        { status: 429, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Record this request for rate limiting
    await serviceClient.from("rate_limit_entries").insert({ ip_address: clientIP, endpoint: "send-contact-notification" });

    const rawBody = await req.json();
    const validated = validateInput(rawBody);

    if (!validated) {
      return new Response(
        JSON.stringify({ error: "Invalid input. Check name (max 200), email, subject (max 200), and message (max 5000).", _version: VERSION }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    const { name, email, subject, message } = validated;

    // Escape all user inputs for safe HTML embedding
    const safeName = escapeHtml(name);
    const safeEmail = escapeHtml(email);
    const safeSubject = escapeHtml(subject);
    const safeMessage = escapeHtml(message);

    console.log("Sending contact notification for:", { name: safeName, subject: safeSubject });

    // Send notification to admin
    const adminEmailResponse = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: "Pachena <noreply@pachena.co>",
        to: ["hello@pachena.co"],
        subject: `New Contact Form Submission: ${safeSubject}`,
        html: `
          <h1>New Contact Form Submission</h1>
          <p><strong>From:</strong> ${safeName} (${safeEmail})</p>
          <p><strong>Subject:</strong> ${safeSubject}</p>
          <hr />
          <h2>Message:</h2>
          <p>${safeMessage.replace(/\n/g, '<br>')}</p>
          <hr />
          <p style="color: #666; font-size: 12px;">
            This message was sent via the Pachena contact form.
          </p>
        `,
      }),
    });

    if (!adminEmailResponse.ok) {
      const errorData = await adminEmailResponse.json();
      console.error("Admin email error:", errorData);
    } else {
      console.log("Admin notification sent successfully");
    }

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
        subject: "We received your message - Pachena",
        html: `
          <h1>Thank you for contacting us, ${safeName}!</h1>
          <p>We have received your message and will get back to you as soon as possible.</p>
          <p><strong>Your message:</strong></p>
          <blockquote style="border-left: 3px solid #ccc; padding-left: 15px; color: #555;">
            <p><strong>Subject:</strong> ${safeSubject}</p>
            <p>${safeMessage.replace(/\n/g, '<br>')}</p>
          </blockquote>
          <p>Best regards,<br>The Pachena Team</p>
        `,
      }),
    });

    if (!userEmailResponse.ok) {
      const errorData = await userEmailResponse.json();
      console.error("User email error:", errorData);
    } else {
      console.log("User confirmation sent successfully");
    }

    return new Response(
      JSON.stringify({ success: true, _version: VERSION }),
      {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  } catch (error: any) {
    console.error("Error in send-contact-notification function:", error);
    return new Response(
      JSON.stringify({ error: "An unexpected error occurred", _version: VERSION }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
});
