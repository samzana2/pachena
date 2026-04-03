import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const VERSION = "analyze-section@2026-02-20.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, " +
    "x-supabase-client-platform, x-supabase-client-platform-version, " +
    "x-supabase-client-runtime, x-supabase-client-runtime-version",
  "Access-Control-Allow-Methods": "GET, POST, PUT, PATCH, DELETE, OPTIONS",
};

const SYSTEM_PROMPT = `You are a content risk analyst for Pachena, an anonymous employer review platform based in Zimbabwe. Your job is to analyze individual review sections for content risk across five dimensions and output a structured risk assessment.

IMPORTANT RULES:
- You do NOT modify, redact, or rewrite any content.
- You do NOT auto-approve or auto-reject anything.
- Your output is advisory only — a human moderator makes all final decisions.
- You must be culturally aware that this platform operates in Zimbabwe. Salaries of $100–$500 USD/month are common and legitimate.

## Risk Scoring Dimensions (each 0–20)

### 1. Identifiability Risk
Measures whether a private individual could be identified from the review.
- 0 = no individuals referenced
- 10 = role/department only
- 15 = role + location or timing that narrows identification
- 20 = private individual clearly identifiable (name, unique role, etc.)
If ≥15 → flag for potential redaction or escalation.

### 2. Defamation / Criminal Allegation Risk
- 0 = no misconduct claims
- 5–8 = cultural commentary about workplace atmosphere (e.g., "the culture is sexual," "it feels unsafe," "leadership is aggressive"). These are opinions, NOT allegations.
- 10 = vague ethical concerns with some specificity
- 15 = strong misconduct implication against identifiable individuals
- 20 = explicit crime allegation stated as fact against specific people
Only assign 15+ when ALL of these apply:
  - A specific unlawful act is alleged as fact (not just described as atmosphere)
  - A specific individual or identifiable role is accused of misconduct
  - The wording implies a crime actually occurred
If ≥15 → must escalate for human review. AI must never auto-approve crime allegations.

### 3. Legal Sensitivity Category
Low (0–7): Workload, pay, career growth
Medium (8–14): Toxic culture, favoritism, AND general/atmospheric mentions of sensitive topics (e.g., "the environment feels harassing," "there's a culture of discrimination"). Mentioning harassment, discrimination, or safety concerns in a general way lands here, NOT in High.
High (15–20): Reserved ONLY for specific claims that harassment/discrimination/misconduct actually occurred, especially with named or identifiable perpetrators, or factual assertions of safety violations or financial misconduct.

### 4. Toxicity / Threat Risk
- 0 = professional tone
- 10 = harsh criticism
- 15 = inflammatory language
- 20 = threats, hate speech, incitement
If ≥18 → strongly recommend rejection.

### 5. Constructiveness Score
- 20 = workplace-specific and useful feedback
- 10 = somewhat relevant
- 0 = pure insult or rant
Higher constructiveness REDUCES overall risk.

## CRITICAL DISTINCTION: Cultural Commentary vs. Direct Allegations
When evaluating defamation risk and legal sensitivity, you MUST distinguish between:
- **Cultural commentary**: General descriptions of workplace atmosphere, culture, or environment (e.g., "the culture is sexual," "it feels unsafe," "leadership is aggressive," "the environment is toxic"). These are OPINIONS about atmosphere and should score LOW in defamation (0-8) and MEDIUM in legal sensitivity (8-14).
- **Direct allegations**: Specific claims that unlawful conduct occurred, especially against identifiable individuals (e.g., "the manager harassed me," "they committed fraud," "sexual assault occurred," "he discriminated against women"). Only these should score HIGH in defamation (15-20) and HIGH in legal sensitivity (15-20).

Gender-based cultural observations (e.g., "men in senior positions create discomfort") are cultural commentary unless paired with a specific misconduct claim. Do NOT escalate cultural critique to allegation-level scoring.

## Total Risk Formula
Total = Identifiability + Defamation + Legal Sensitivity + Toxicity − (Constructiveness ÷ 2)

## Suggested Action Thresholds
- 0–29 → APPROVE (low risk, human likely approves)
- 30–49 → REVIEW (moderate risk, human review required)
- 50–69 → PRIORITY_REVIEW (high risk, priority human review)
- 70+ → REJECT (very high risk, likely reject unless reviewed)

## Redaction Suggestion Policy
You may ONLY suggest redactions for:
- Full names of private individuals
- Email addresses
- Phone numbers
- Social media handles
- Exact street addresses
- Employee ID numbers
- Clearly identifying role + location combinations

Redaction must:
- Identify the exact text span to remove
- Specify the field it appears in
- Never rewrite or substitute wording
- Never soften allegations into milder language

If removal alone does not reduce legal risk → recommend escalation or rejection instead.

## Flag Types
Use descriptive labels such as: "pii_detected", "crime_allegation", "harassment_claim", "threat_language", "highly_identifiable", "discrimination_claim", "financial_misconduct", "safety_violation"

## Output
Use the analyze_section tool to return your structured analysis.`;

function extractTextFromSectionData(data: Record<string, unknown>, sectionType: string): string {
  const lines: string[] = [];

  if (sectionType === 'culture') {
    if (data.title) lines.push(`Title: ${data.title}`);
    if (data.pros) lines.push(`Pros: ${data.pros}`);
    if (data.cons) lines.push(`Cons: ${data.cons}`);
    if (data.advice) lines.push(`Advice: ${data.advice}`);
    if (data.private_feedback) lines.push(`Private Feedback: ${data.private_feedback}`);
    if (data.recommendation) lines.push(`Recommendation: ${data.recommendation}`);
    if (data.rating) lines.push(`Rating: ${data.rating}/5`);
  } else if (sectionType === 'compensation') {
    if (data.role_title) lines.push(`Role: ${data.role_title}`);
    if (data.role_level) lines.push(`Level: ${data.role_level}`);
    if (data.department) lines.push(`Department: ${data.department}`);
    if (data.salary_range) lines.push(`Salary Range: ${data.salary_range}`);
    if (data.base_salary_amount) lines.push(`Base Salary: ${data.base_salary_currency || 'USD'} ${data.base_salary_amount}`);
    if (data.market_alignment) lines.push(`Market Alignment: ${data.market_alignment}`);
    if (data.pay_transparency) lines.push(`Pay Transparency: ${data.pay_transparency}`);
  } else if (sectionType === 'interview') {
    if (data.interview_description) lines.push(`Description: ${data.interview_description}`);
    if (data.interview_tips) lines.push(`Tips: ${data.interview_tips}`);
    if (data.interview_difficulty) lines.push(`Difficulty: ${data.interview_difficulty}`);
    if (Array.isArray(data.interview_stages)) lines.push(`Stages: ${data.interview_stages.join(', ')}`);
  }

  if (lines.length === 0) {
    for (const [key, val] of Object.entries(data)) {
      if (typeof val === 'string' && val.length > 2) {
        lines.push(`${key}: ${val}`);
      }
    }
  }

  return lines.join('\n');
}

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

    const { data: roleData } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .in('role', ['admin', 'super_admin', 'support_admin'])
      .limit(1);

    if (!roleData || roleData.length === 0) {
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

    const { sectionId } = await req.json();
    if (!sectionId || typeof sectionId !== 'string') {
      return new Response(
        JSON.stringify({ error: 'Missing or invalid sectionId', _version: VERSION }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Fetch section
    const { data: section, error: sectionError } = await supabase
      .from('review_sections')
      .select('id, section_type, section_data, company_id, created_at, companies(name)')
      .eq('id', sectionId)
      .single();

    if (sectionError || !section) {
      return new Response(
        JSON.stringify({ error: 'Section not found', _version: VERSION }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const companyData = section.companies as { name?: string } | null;
    const sectionData = (section.section_data || {}) as Record<string, unknown>;
    const targetText = extractTextFromSectionData(sectionData, section.section_type);

    const prompt = `Analyze this ${section.section_type} review section for ${companyData?.name || 'Unknown Company'}:\n\n${targetText}\n\nSubmitted: ${section.created_at}`;

    console.log(`Analyzing section ${sectionId} (${section.section_type}) for company ${companyData?.name}`);

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
          { role: 'user', content: prompt },
        ],
        tools: [
          {
            type: 'function',
            function: {
              name: 'analyze_section',
              description: 'Return the structured risk analysis for this review section.',
              parameters: {
                type: 'object',
                properties: {
                  risk_scores: {
                    type: 'object',
                    properties: {
                      identifiability: { type: 'integer', minimum: 0, maximum: 20 },
                      defamation: { type: 'integer', minimum: 0, maximum: 20 },
                      legal_sensitivity: { type: 'integer', minimum: 0, maximum: 20 },
                      toxicity: { type: 'integer', minimum: 0, maximum: 20 },
                      constructiveness: { type: 'integer', minimum: 0, maximum: 20 },
                    },
                    required: ['identifiability', 'defamation', 'legal_sensitivity', 'toxicity', 'constructiveness'],
                    additionalProperties: false,
                  },
                  total_risk_score: { type: 'integer' },
                  flag_types: {
                    type: 'array',
                    items: { type: 'string' },
                  },
                  suggested_action: {
                    type: 'string',
                    enum: ['APPROVE', 'REVIEW', 'PRIORITY_REVIEW', 'REJECT'],
                  },
                  redaction_suggestions: {
                    type: 'array',
                    items: {
                      type: 'object',
                      properties: {
                        field: { type: 'string' },
                        text_span: { type: 'string' },
                        reason: { type: 'string' },
                      },
                      required: ['field', 'text_span', 'reason'],
                      additionalProperties: false,
                    },
                  },
                  explanation_summary: { type: 'string' },
                },
                required: ['risk_scores', 'total_risk_score', 'flag_types', 'suggested_action', 'redaction_suggestions', 'explanation_summary'],
                additionalProperties: false,
              },
            },
          },
        ],
        tool_choice: { type: 'function', function: { name: 'analyze_section' } },
      }),
    });

    if (!aiResponse.ok) {
      const status = aiResponse.status;
      const body = await aiResponse.text();
      console.error(`AI gateway error: ${status}`, body);

      if (status === 429) {
        return new Response(
          JSON.stringify({ error: 'Rate limit exceeded. Please try again in a moment.', _version: VERSION }),
          { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      if (status === 402) {
        return new Response(
          JSON.stringify({ error: 'AI credits exhausted. Please add funds to continue.', _version: VERSION }),
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

    let analysis: Record<string, unknown>;
    try {
      analysis = typeof toolCall.function.arguments === 'string'
        ? JSON.parse(toolCall.function.arguments)
        : toolCall.function.arguments;
    } catch {
      console.error('Failed to parse tool call arguments:', toolCall.function.arguments);
      return new Response(
        JSON.stringify({ error: 'Failed to parse AI analysis', _version: VERSION }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Add metadata
    const summary = {
      ...analysis,
      analyzed_at: new Date().toISOString(),
    };

    // Save to review_sections
    const { error: updateError } = await supabase
      .from('review_sections')
      .update({ ai_moderation_summary: summary })
      .eq('id', sectionId);

    if (updateError) {
      console.error('Failed to save analysis:', updateError);
      return new Response(
        JSON.stringify({ error: 'Failed to save analysis result', _version: VERSION }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Analysis saved for section ${sectionId}: action=${analysis.suggested_action}, risk=${analysis.total_risk_score}`);

    return new Response(
      JSON.stringify({ analysis: summary, _version: VERSION }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (e) {
    console.error('analyze-section error:', e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : 'Unknown error', _version: VERSION }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
