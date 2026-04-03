import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Auth + admin check
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    if (authError || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { data: roles } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id)
      .in("role", ["admin", "super_admin", "support_admin"])
      .limit(1);

    if (!roles || roles.length === 0) {
      return new Response(JSON.stringify({ error: "Forbidden" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const body = await req.json();
    const { text, file_base64, mime_type } = body;

    if (!text && !file_base64) {
      return new Response(
        JSON.stringify({ error: "Either text or file_base64 is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const systemPrompt = `You are a job posting parser. Extract structured job details from the provided content. Always call the extract_job function with the extracted data. If a field cannot be determined, use null. For salary, extract numeric values without currency symbols. Infer job_type from context (full-time, part-time, contract, internship). Infer experience_level (entry, mid, senior, executive). For is_remote, infer from context.`;

    const userContent: any[] = [];

    if (file_base64) {
      userContent.push({
        type: "image_url",
        image_url: { url: `data:${mime_type || "image/png"};base64,${file_base64}` },
      });
      userContent.push({
        type: "text",
        text: "Extract all job posting details from this image/document.",
      });
    } else {
      userContent.push({
        type: "text",
        text: `Extract job posting details from the following text:\n\n${text}`,
      });
    }

    const aiBody = {
      model: "google/gemini-2.5-flash",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userContent },
      ],
      tools: [
        {
          type: "function",
          function: {
            name: "extract_job",
            description: "Extract structured job posting details",
            parameters: {
              type: "object",
              properties: {
                title: { type: "string", description: "Job title" },
                company_name: { type: "string", description: "Company name" },
                location: { type: "string", description: "Job location" },
                job_type: {
                  type: "string",
                  enum: ["full-time", "part-time", "contract", "internship"],
                  description: "Employment type",
                },
                experience_level: {
                  type: "string",
                  enum: ["entry", "mid", "senior", "executive"],
                  description: "Experience level required",
                },
                description: { type: "string", description: "Full job description" },
                requirements: { type: "string", description: "Job requirements" },
                responsibilities: { type: "string", description: "Job responsibilities" },
                department: { type: "string", description: "Department" },
                salary_min: { type: "number", description: "Minimum salary" },
                salary_max: { type: "number", description: "Maximum salary" },
                salary_currency: { type: "string", description: "Salary currency code e.g. BWP, USD" },
                is_remote: { type: "boolean", description: "Whether the job is remote" },
                application_url: { type: "string", description: "URL to apply" },
              },
              required: ["title", "description"],
              additionalProperties: false,
            },
          },
        },
      ],
      tool_choice: { type: "function", function: { name: "extract_job" } },
    };

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(aiBody),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded, please try again later." }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "Payment required." }), {
          status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const t = await response.text();
      console.error("AI gateway error:", response.status, t);
      return new Response(JSON.stringify({ error: "AI extraction failed" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const data = await response.json();
    const toolCall = data.choices?.[0]?.message?.tool_calls?.[0];

    if (!toolCall?.function?.arguments) {
      return new Response(JSON.stringify({ error: "AI did not return structured data" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const extracted = JSON.parse(toolCall.function.arguments);

    return new Response(JSON.stringify({ data: extracted }), {
      status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("extract-job-details error:", e);
    return new Response(
      JSON.stringify({ error: "An unexpected error occurred" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
