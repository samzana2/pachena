import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

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
    const { text, fieldName } = await req.json();

    if (!text || typeof text !== "string" || text.trim().length < 15) {
      return new Response(
        JSON.stringify({ corrected: text || "", hasChanges: false }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    const response = await fetch(
      "https://ai.gateway.lovable.dev/v1/chat/completions",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${LOVABLE_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "google/gemini-3-flash-preview",
          messages: [
            {
              role: "system",
              content: `You are a text proofreader. Fix ONLY spelling errors, missing capitalization, punctuation issues, and spacing problems. Do NOT change the meaning, tone, word choice, or sentence structure. If the text has no issues, return it exactly as-is. The text is from a "${fieldName || "review"}" field in an employee review form.`,
            },
            {
              role: "user",
              content: text,
            },
          ],
          tools: [
            {
              type: "function",
              function: {
                name: "return_corrected_text",
                description:
                  "Return the corrected text with only spelling, capitalization, punctuation, and spacing fixes applied.",
                parameters: {
                  type: "object",
                  properties: {
                    corrected: {
                      type: "string",
                      description: "The corrected version of the text",
                    },
                    hasChanges: {
                      type: "boolean",
                      description:
                        "Whether any corrections were made (true) or the text was already correct (false)",
                    },
                  },
                  required: ["corrected", "hasChanges"],
                  additionalProperties: false,
                },
              },
            },
          ],
          tool_choice: {
            type: "function",
            function: { name: "return_corrected_text" },
          },
        }),
      }
    );

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ corrected: text, hasChanges: false, error: "Rate limited" }),
          { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      const errText = await response.text();
      console.error("AI gateway error:", response.status, errText);
      return new Response(
        JSON.stringify({ corrected: text, hasChanges: false }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const data = await response.json();
    const toolCall = data.choices?.[0]?.message?.tool_calls?.[0];

    if (toolCall?.function?.arguments) {
      const result = JSON.parse(toolCall.function.arguments);
      return new Response(
        JSON.stringify({
          corrected: result.corrected || text,
          hasChanges: result.hasChanges ?? false,
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Fallback if no tool call returned
    return new Response(
      JSON.stringify({ corrected: text, hasChanges: false }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (e) {
    console.error("polish-review-text error:", e);
    return new Response(
      JSON.stringify({ corrected: "", hasChanges: false, error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
