import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { z } from "https://deno.land/x/zod@v3.22.4/mod.ts";

const VERSION = "submit-claim@2026-02-15.1";

// Rate limiting: 3 claim submissions per day per IP
const RATE_LIMIT_WINDOW_HOURS = 24;
const MAX_CLAIMS_PER_IP = 3;

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

// Zod schema for input validation with length limits
const claimSchema = z.object({
  fullName: z.string().min(2, "Full name must be at least 2 characters").max(100, "Full name must be less than 100 characters"),
  jobTitle: z.string().min(2, "Job title must be at least 2 characters").max(100, "Job title must be less than 100 characters"),
  workEmail: z.string().email("Invalid email format").max(255, "Email must be less than 255 characters"),
  companyName: z.string().min(2, "Company name must be at least 2 characters").max(200, "Company name must be less than 200 characters"),
  companyWebsite: z.string().max(500, "Website must be less than 500 characters").optional().nullable(),
  phoneNumber: z.string().max(30, "Phone number must be less than 30 characters").optional().nullable(),
  message: z.string().max(2000, "Message must be less than 2000 characters").optional().nullable(),
  supervisorName: z.string().max(100, "Supervisor name must be less than 100 characters").optional().nullable(),
  supervisorEmail: z.string().email("Invalid supervisor email format").max(255).optional().nullable().or(z.literal("")),
  authorizationConfirmed: z.boolean().refine(val => val === true, "Authorization must be confirmed"),
});

// AES-256-GCM encryption utility
async function encrypt(plaintext: string): Promise<string> {
  if (!plaintext) return '';
  
  const keyBase64 = Deno.env.get('CLAIM_ENCRYPTION_KEY');
  if (!keyBase64) {
    throw new Error('CLAIM_ENCRYPTION_KEY not configured');
  }
  
  const keyData = Uint8Array.from(atob(keyBase64), c => c.charCodeAt(0));
  const key = await crypto.subtle.importKey(
    'raw',
    keyData,
    { name: 'AES-GCM' },
    false,
    ['encrypt']
  );
  
  // Generate random IV
  const iv = crypto.getRandomValues(new Uint8Array(12));
  
  const encoded = new TextEncoder().encode(plaintext);
  const encrypted = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv },
    key,
    encoded
  );
  
  // Combine IV and encrypted data as base64
  const ivBase64 = btoa(String.fromCharCode(...iv));
  const dataBase64 = btoa(String.fromCharCode(...new Uint8Array(encrypted)));
  
  return `${ivBase64}:${dataBase64}`;
}

serve(async (req) => {
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
    // Rate limiting
    const clientIP = await getClientIP(req);
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const serviceClient = createClient(supabaseUrl, supabaseServiceKey);

    const rateLimitCutoff = new Date(Date.now() - RATE_LIMIT_WINDOW_HOURS * 60 * 60 * 1000).toISOString();
    const { count, error: rlError } = await serviceClient
      .from("rate_limit_entries")
      .select("*", { count: "exact", head: true })
      .eq("ip_address", clientIP)
      .eq("endpoint", "submit-claim")
      .gte("created_at", rateLimitCutoff);

    if (!rlError && count !== null && count >= MAX_CLAIMS_PER_IP) {
      console.log("Rate limit exceeded for hashed IP");
      return new Response(
        JSON.stringify({ error: "Too many submissions. Please try again later.", _version: VERSION }),
        { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Record this request for rate limiting
    await serviceClient.from("rate_limit_entries").insert({ ip_address: clientIP, endpoint: "submit-claim" });

    const rawBody = await req.json();
    
    // Validate input with zod schema
    const parseResult = claimSchema.safeParse(rawBody);
    if (!parseResult.success) {
      const errors = parseResult.error.errors.map(e => `${e.path.join('.')}: ${e.message}`).join(', ');
      console.error("Validation error:", errors);
      return new Response(
        JSON.stringify({ error: `Validation failed: ${errors}`, _version: VERSION }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    const {
      fullName,
      jobTitle,
      workEmail,
      companyName,
      companyWebsite,
      phoneNumber,
      message,
      supervisorName,
      supervisorEmail,
      authorizationConfirmed
    } = parseResult.data;

    // Encrypt sensitive fields
    const encryptedPhoneNumber = phoneNumber ? await encrypt(phoneNumber) : null;
    const encryptedSupervisorName = supervisorName ? await encrypt(supervisorName) : null;
    const encryptedSupervisorEmail = supervisorEmail ? await encrypt(supervisorEmail) : null;

    // Reuse serviceClient created above for rate limiting

    // Insert the claim request with encrypted fields
    const { data, error } = await serviceClient
      .from('company_claim_requests')
      .insert({
        full_name: fullName,
        job_title: jobTitle,
        work_email: workEmail,
        company_name: companyName,
        company_website: companyWebsite || null,
        phone_number: null, // Store in plaintext column for backwards compatibility during transition
        phone_number_encrypted: encryptedPhoneNumber,
        message: message || null,
        supervisor_name: null, // Store in plaintext column for backwards compatibility
        supervisor_name_encrypted: encryptedSupervisorName,
        supervisor_email: null, // Store in plaintext column for backwards compatibility
        supervisor_email_encrypted: encryptedSupervisorEmail,
        authorization_confirmed: authorizationConfirmed,
      })
      .select('id')
      .single();

    if (error) {
      console.error('Database insert error:', error);
      return new Response(
        JSON.stringify({ error: 'Failed to submit claim request', _version: VERSION }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Claim request submitted successfully:', data.id);

    // Send confirmation email (non-blocking)
    try {
      const emailResponse = await fetch(`${supabaseUrl}/functions/v1/send-claim-confirmation`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${supabaseServiceKey}`,
        },
        body: JSON.stringify({
          email: workEmail,
          full_name: fullName,
          company_name: companyName,
        }),
      });
      
      if (!emailResponse.ok) {
        console.error('Failed to send confirmation email:', await emailResponse.text());
      } else {
        console.log('Confirmation email sent successfully');
      }
    } catch (emailError) {
      console.error('Error sending confirmation email:', emailError);
      // Don't fail the claim submission if email fails
    }

    return new Response(
      JSON.stringify({ success: true, id: data.id, _version: VERSION }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Edge function error:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error', _version: VERSION }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
