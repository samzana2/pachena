import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const VERSION = "create-unverified-session@2026-02-16.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "X-Function-Version": VERSION,
};

function getPreflightHeaders(req: Request) {
  const requested = req.headers.get("Access-Control-Request-Headers");
  return {
    ...corsHeaders,
    "Access-Control-Allow-Headers": requested || corsHeaders["Access-Control-Allow-Headers"],
  };
}

async function hashToken(token: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(token);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((byte) => byte.toString(16).padStart(2, "0")).join("");
}

serve(async (req: Request): Promise<Response> => {
  console.log(`[${VERSION}] ${req.method} ${new URL(req.url).pathname}`);

  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: getPreflightHeaders(req) });
  }

  try {
    const { company_id, honeypot_field } = await req.json();

    // Honeypot check - silently reject bots
    if (honeypot_field) {
      console.log("Honeypot triggered, silently rejecting");
      return new Response(
        JSON.stringify({ session_id: "fake-id", review_token: "fake-token" }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (!company_id) {
      return new Response(
        JSON.stringify({ error: "company_id is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Rate limiting disabled for now

    // Generate tokens
    const tokenBytes = new Uint8Array(32);
    crypto.getRandomValues(tokenBytes);
    const rawToken = Array.from(tokenBytes).map(b => b.toString(16).padStart(2, "0")).join("");
    const tokenHash = await hashToken(rawToken);

    const reviewTokenBytes = new Uint8Array(32);
    crypto.getRandomValues(reviewTokenBytes);
    const reviewToken = Array.from(reviewTokenBytes).map(b => b.toString(16).padStart(2, "0")).join("");
    const reviewTokenHash = await hashToken(reviewToken);

    // Create verification session
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();

    // Note: referral code is handled client-side via sessionStorage and passed through submit-review

    const { data: session, error: sessionError } = await supabase
      .from("verification_sessions")
      .insert({
        company_id,
        email_domain: "unverified",
        token_hash: tokenHash,
        review_token_hash: reviewTokenHash,
        verified: true,
        verified_at: new Date().toISOString(),
        expires_at: expiresAt,
        request_ip: null,
      })
      .select("id")
      .single();

    if (sessionError) {
      console.error("Error creating session:", sessionError);
      return new Response(
        JSON.stringify({ error: "Failed to create review session" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log("Unverified session created:", session.id);

    return new Response(
      JSON.stringify({ session_id: session.id, review_token: reviewToken }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("Unexpected error:", err);
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
