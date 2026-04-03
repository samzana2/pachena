import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const VERSION = "analyze-review@2026-02-16.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, " +
    "x-supabase-client-platform, x-supabase-client-platform-version, " +
    "x-supabase-client-runtime, x-supabase-client-runtime-version",
  "Access-Control-Allow-Methods": "GET, POST, PUT, PATCH, DELETE, OPTIONS",
};

const SYSTEM_PROMPT = `You are a content moderation assistant for Pachena, an anonymous employer review platform. Analyze the following review against Pachena's published guidelines and provide a moderation recommendation.

## Pachena Review Guidelines

### What reviews SHOULD include:
- Specific, concrete examples of experiences
- Balanced perspective (both positives and areas for improvement)
- Honest, genuine experiences
- Helpful content for others making employment decisions
- Professional, respectful tone
- Current information about when they worked there

### What reviews MUST NOT include:
- Personal attacks or naming individuals
- Confidential information, trade secrets, client details
- Discriminatory language or hate speech
- False or fabricated claims
- Promotional content
- Threats or harassment
- Defamatory or legally problematic statements
- Personally identifiable information (PII)

### Additional considerations:
- Very vague or low-effort content (e.g., one-word answers) reduces review quality but isn't necessarily a policy violation
- Compensation data is expected and encouraged
- Reviews can be negative as long as they're constructive
- Low ratings alone are NOT grounds for rejection
- Worker rights concerns and labor issues are valid review topics

Analyze the review and provide your recommendation using the analyze_review tool.`;

Deno.serve(async (req) => {
  console.log(`[${VERSION}] ${req.method} ${new URL(req.url).pathname}`);

  if (req.method === 'OPTIONS') {
    const requestedHeaders = req.headers.get("Access-Control-Request-Headers");
    return new Response(null, {
      headers: {
        ...corsHeaders,
        "Access-Control-Allow-Headers": requestedHeaders || corsHeaders["Access-Control-Allow-Headers"],
      },
    });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Auth check
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'No authorization header', _version: VERSION }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: 'Invalid token', _version: VERSION }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Admin check
    const { data: roleData, error: roleError } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .in('role', ['admin', 'super_admin', 'support_admin'])
      .limit(1);

    if (roleError || !roleData || roleData.length === 0) {
      return new Response(
        JSON.stringify({ error: 'Access denied - admin role required', _version: VERSION }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (req.method !== 'POST') {
      return new Response(
        JSON.stringify({ error: 'Method not allowed', _version: VERSION }),
        { status: 405, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { reviewId } = await req.json();
    if (!reviewId) {
      return new Response(
        JSON.stringify({ error: 'Missing reviewId', _version: VERSION }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Fetch the review
    const { data: review, error: fetchError } = await supabase
      .from('reviews')
      .select('id, title, pros, cons, advice, private_feedback, base_salary_amount, base_salary_currency, verification_type, role_title, department, companies(name)')
      .eq('id', reviewId)
      .single();

    if (fetchError || !review) {
      return new Response(
        JSON.stringify({ error: 'Review not found', _version: VERSION }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Build the prompt
    const companyData = review.companies as { name?: string } | null;
    const reviewContent = `
## Review to Analyze

**Company:** ${companyData?.name || 'Unknown'}
**Title:** ${review.title}
**Role:** ${review.role_title || 'Not specified'}
**Department:** ${review.department || 'Not specified'}
**Verification Type:** ${review.verification_type}

**Pros:**
${review.pros}

**Cons:**
${review.cons}

${review.advice ? `**Advice / One Thing to Know:**\n${review.advice}` : ''}

${review.private_feedback ? `**Private Feedback (employer only):**\n${review.private_feedback}` : ''}

${review.base_salary_amount ? `**Reported Salary:** ${review.base_salary_currency || 'USD'} ${review.base_salary_amount}` : ''}
`.trim();

    // Call Lovable AI with tool calling
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      return new Response(
        JSON.stringify({ error: 'AI service not configured', _version: VERSION }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const aiResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-3-flash-preview',
        messages: [
          { role: 'system', content: SYSTEM_PROMPT },
          { role: 'user', content: reviewContent },
        ],
        tools: [
          {
            type: 'function',
            function: {
              name: 'analyze_review',
              description: 'Provide a structured moderation analysis of the review.',
              parameters: {
                type: 'object',
                properties: {
                  recommendation: {
                    type: 'string',
                    enum: ['approve', 'flag', 'reject'],
                    description: 'The recommended moderation action.',
                  },
                  confidence: {
                    type: 'string',
                    enum: ['high', 'medium', 'low'],
                    description: 'How confident you are in this recommendation.',
                  },
                  summary: {
                    type: 'string',
                    description: 'A 2-3 sentence plain-English analysis of the review content and quality.',
                  },
                  flags: {
                    type: 'array',
                    items: { type: 'string' },
                    description: 'Specific concerns found (e.g., "vague content", "possible PII", "personal attack", "low effort"). Empty array if no concerns.',
                  },
                },
                required: ['recommendation', 'confidence', 'summary', 'flags'],
                additionalProperties: false,
              },
            },
          },
        ],
        tool_choice: { type: 'function', function: { name: 'analyze_review' } },
      }),
    });

    if (!aiResponse.ok) {
      const status = aiResponse.status;
      const errorText = await aiResponse.text();
      console.error(`AI gateway error: ${status}`, errorText);

      if (status === 429) {
        return new Response(
          JSON.stringify({ error: 'AI rate limit exceeded. Please try again in a moment.', _version: VERSION }),
          { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      if (status === 402) {
        return new Response(
          JSON.stringify({ error: 'AI usage limit reached. Please add credits.', _version: VERSION }),
          { status: 402, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      return new Response(
        JSON.stringify({ error: 'AI analysis failed', _version: VERSION }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const aiData = await aiResponse.json();
    const toolCall = aiData.choices?.[0]?.message?.tool_calls?.[0];

    if (!toolCall?.function?.arguments) {
      console.error('No tool call in AI response:', JSON.stringify(aiData));
      return new Response(
        JSON.stringify({ error: 'AI returned unexpected format', _version: VERSION }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    let analysis;
    try {
      analysis = JSON.parse(toolCall.function.arguments);
    } catch {
      console.error('Failed to parse tool call arguments:', toolCall.function.arguments);
      return new Response(
        JSON.stringify({ error: 'AI returned invalid data', _version: VERSION }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Save to DB
    const summaryData = {
      recommendation: analysis.recommendation,
      confidence: analysis.confidence,
      summary: analysis.summary,
      flags: analysis.flags || [],
      analyzed_at: new Date().toISOString(),
    };

    const { error: updateError } = await supabase
      .from('reviews')
      .update({ ai_moderation_summary: summaryData })
      .eq('id', reviewId);

    if (updateError) {
      console.error('Failed to save AI summary:', updateError);
      // Still return the analysis even if save fails
    }

    console.log(`Review ${reviewId} analyzed: ${analysis.recommendation} (${analysis.confidence})`);

    return new Response(
      JSON.stringify({ success: true, analysis: summaryData, _version: VERSION }),
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
