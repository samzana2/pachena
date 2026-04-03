import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const VERSION = "detect-fraud-ai@2026-02-20.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, " +
    "x-supabase-client-platform, x-supabase-client-platform-version, " +
    "x-supabase-client-runtime, x-supabase-client-runtime-version",
  "Access-Control-Allow-Methods": "GET, POST, PUT, PATCH, DELETE, OPTIONS",
};

const SYSTEM_PROMPT = `You are a fraud detection analyst for Pachena, an anonymous employer review platform. Your job is to detect CROSS-REVIEW PATTERNS that indicate fraud -- you are NOT judging whether the content of any individual review is plausible, accurate, or reasonable.

## Geographic & Economic Context
This platform exclusively serves Zimbabwe. Salaries, benefits, and working conditions reflect the Zimbabwean economy, NOT Western markets. Monthly take-home salaries of $100-$500 USD are common and legitimate. Do NOT treat low compensation as a fraud signal.

## What You Must NOT Flag
- Low salary amounts -- these are normal for Zimbabwe
- Negative reviews or harsh criticism of employers
- Short or terse responses (low effort ≠ fraud)
- Unusual currency amounts by international standards
- Reviews describing poor working conditions
- Any judgment about whether salary/benefits seem "too low" or "unrealistic"
- Industry-specific jargon or local terminology

## What You ARE Looking For

### Same-Author Fingerprints (across different reviews)
- Identical or near-identical typos/misspellings appearing in multiple reviews
- Same unusual grammar patterns, sentence structures, or phrasing habits
- Similar writing style across reviews for different companies
- Consistent use of specific phrases or expressions

### Referral Farming Patterns
- Multiple reviews from the same referral code that feel templated or formulaic
- Generic, vague content that could apply to any company
- Suspiciously similar structure across reviews (e.g., always same length, same format)
- Reviews that feel written to meet a minimum bar rather than share genuine experience

### Copy-Paste / Templated Content
- Repeated phrases or sentences across different reviews
- Boilerplate-sounding content lacking specific details
- Reviews that swap company names but keep similar content

### Suspicious Timing/Volume
- Note if reviews from DIFFERENT review sessions (different session IDs) were submitted in rapid succession by the same referral code
- Multiple sections within the SAME review session submitted close together is NORMAL platform behavior -- do NOT flag this

## How to Use Comparison Data
When comparison reviews are available, look for STATISTICAL PATTERNS within the dataset:
- Are multiple reviews using the same unusual phrases?
- Do reviews from different sessions share identical sentence structures?
- Is there templated content being reused across submissions?
Do NOT compare salaries/ratings against what you think they "should" be. Outliers are only meaningful when they deviate from OTHER REVIEWS IN THE DATASET, not from external assumptions.

## Platform Context -- Section-Based Reviews
Pachena's review form is split into independent sections (compensation, culture, interview). A single reviewer submits multiple sections for the same company within one review session. This means:
- Multiple sections from the SAME review session submitted in rapid succession is NORMAL, not suspicious
- When comparing sections, group them by review_session_id -- sections sharing a session are from the same person and should be treated as one review
- Fraud signals should focus on patterns ACROSS different sessions/reviewers, not within a single session
- A referral code may have multiple sessions, each with multiple sections -- this is expected

## Important Rules
- A single review in isolation may look fine -- the fraud signals emerge from PATTERNS across multiple reviews
- Low-effort or vague reviews aren't necessarily fraud, but ARE suspicious when combined with referral patterns
- Genuine reviews have company-specific details that can't easily be copy-pasted
- If there are no comparison reviews, note that limited comparison data is available and judge based on the target review alone
- Be specific in your evidence -- quote exact phrases, typos, or patterns you found`;

/** Extract all string values from a JSONB section_data object for prompt building */
function extractTextFromSectionData(data: Record<string, unknown>, sectionType: string): string {
  const lines: string[] = [];

  if (sectionType === 'culture') {
    if (data.title) lines.push(`Title: ${data.title}`);
    if (data.pros) lines.push(`Pros: ${data.pros}`);
    if (data.cons) lines.push(`Cons: ${data.cons}`);
    if (data.advice) lines.push(`Advice: ${data.advice}`);
    if (data.role_title) lines.push(`Role: ${data.role_title}`);
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

  // Fallback: grab any remaining string fields not already captured
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

    // Auth check: internal service key OR admin JWT
    const internalKey = req.headers.get('x-internal-key');
    const isInternalCall = internalKey === supabaseServiceKey;

    if (!isInternalCall) {
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
    } else {
      console.log('Internal call authenticated via service key');
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

    // ---- DUAL-TABLE LOOKUP ----
    let isSection = false;
    let prompt = '';
    let comparisonCount = 0;
    let saveTable: 'reviews' | 'review_sections' = 'reviews';

    // Try legacy reviews table first
    const { data: review, error: fetchError } = await supabase
      .from('reviews')
      .select('id, title, pros, cons, advice, referral_code, company_id, created_at, companies(name)')
      .eq('id', reviewId)
      .single();

    if (!fetchError && review) {
      // ---- LEGACY REVIEW PATH (unchanged logic) ----
      const companyData = review.companies as { name?: string } | null;
      const comparisonReviews: any[] = [];

      if (review.referral_code) {
        const { data: referralReviews } = await supabase
          .from('reviews')
          .select('id, title, pros, cons, advice, company_id, created_at, companies(name)')
          .eq('referral_code', review.referral_code)
          .neq('id', reviewId)
          .order('created_at', { ascending: false })
          .limit(10);
        if (referralReviews) comparisonReviews.push(...referralReviews.map(r => ({ ...r, source: 'same_referral_code' })));
      }

      const remaining = 15 - comparisonReviews.length;
      if (remaining > 0) {
        const existingIds = [reviewId, ...comparisonReviews.map(r => r.id)];
        const { data: companyReviews } = await supabase
          .from('reviews')
          .select('id, title, pros, cons, advice, company_id, created_at, companies(name)')
          .eq('company_id', review.company_id)
          .not('id', 'in', `(${existingIds.join(',')})`)
          .order('created_at', { ascending: false })
          .limit(remaining);
        if (companyReviews) comparisonReviews.push(...companyReviews.map(r => ({ ...r, source: 'same_company' })));
      }

      comparisonCount = comparisonReviews.length;

      prompt = `TARGET REVIEW (ID: ${review.id}, Company: ${companyData?.name || 'Unknown'}, Referral Code: ${review.referral_code || 'None'}):\nTitle: ${review.title}\nPros: ${review.pros}\nCons: ${review.cons}\n`;
      if (review.advice) prompt += `Advice: ${review.advice}\n`;
      prompt += `Submitted: ${review.created_at}\n`;

      if (comparisonReviews.length > 0) {
        const referralReviews = comparisonReviews.filter(r => r.source === 'same_referral_code');
        const companyOnlyReviews = comparisonReviews.filter(r => r.source === 'same_company');

        if (referralReviews.length > 0) {
          prompt += `\nCOMPARISON REVIEWS FROM SAME REFERRAL CODE (${review.referral_code}):\n`;
          referralReviews.forEach((r, i) => {
            const rCompany = r.companies as { name?: string } | null;
            prompt += `[Review ${i + 1}] Company: ${rCompany?.name || 'Unknown'} | Title: ${r.title} | Pros: ${r.pros} | Cons: ${r.cons}`;
            if (r.advice) prompt += ` | Advice: ${r.advice}`;
            prompt += ` | Submitted: ${r.created_at}\n`;
          });
        }

        if (companyOnlyReviews.length > 0) {
          prompt += `\nOTHER REVIEWS FROM SAME COMPANY (${companyData?.name || 'Unknown'}):\n`;
          companyOnlyReviews.forEach((r, i) => {
            prompt += `[Review ${i + 1}] Title: ${r.title} | Pros: ${r.pros} | Cons: ${r.cons}`;
            if (r.advice) prompt += ` | Advice: ${r.advice}`;
            prompt += ` | Submitted: ${r.created_at}\n`;
          });
        }
      } else {
        prompt += `\nNo comparison reviews available.\n`;
      }
    } else {
      // ---- SECTION-BASED REVIEW PATH ----
    const { data: section, error: sectionError } = await supabase
        .from('review_sections')
        .select('id, section_type, section_data, company_id, review_session_id, created_at, companies(name)')
        .eq('id', reviewId)
        .single();

      console.log(`Section lookup result: ${section ? 'found' : 'not found'}, session: ${section?.review_session_id}`);

      if (sectionError || !section) {
        return new Response(
          JSON.stringify({ error: 'Review not found in reviews or review_sections', _version: VERSION }),
          { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      isSection = true;
      saveTable = 'review_sections';
      const companyData = section.companies as { name?: string } | null;
      const sectionData = (section.section_data || {}) as Record<string, unknown>;
      const targetText = extractTextFromSectionData(sectionData, section.section_type);

      // Get session info for referral_code
      const { data: session } = await supabase
        .from('review_sessions')
        .select('referral_code')
        .eq('id', section.review_session_id)
        .single();

      const referralCode = session?.referral_code || null;

      // Fetch comparison sections
      const comparisonSections: any[] = [];

      // 1. Sections from same referral code
      if (referralCode) {
        const { data: relatedSessions } = await supabase
          .from('review_sessions')
          .select('id')
          .eq('referral_code', referralCode);

        if (relatedSessions && relatedSessions.length > 0) {
          const sessionIds = relatedSessions.map(s => s.id);
          const { data: referralSections } = await supabase
            .from('review_sections')
            .select('id, section_type, section_data, company_id, created_at, companies(name)')
            .in('review_session_id', sessionIds)
            .neq('id', reviewId)
            .order('created_at', { ascending: false })
            .limit(10);

          if (referralSections) {
            comparisonSections.push(...referralSections.map(s => ({ ...s, source: 'same_referral_code' })));
          }
        }
      }

      // 2. Sections from same company (fill up to 15)
      const remaining = 15 - comparisonSections.length;
      if (remaining > 0) {
        const existingIds = [reviewId, ...comparisonSections.map(s => s.id)];
        const { data: companySections } = await supabase
          .from('review_sections')
          .select('id, section_type, section_data, company_id, created_at, companies(name)')
          .eq('company_id', section.company_id)
          .not('id', 'in', `(${existingIds.join(',')})`)
          .order('created_at', { ascending: false })
          .limit(remaining);

        if (companySections) {
          comparisonSections.push(...companySections.map(s => ({ ...s, source: 'same_company' })));
        }
      }

      comparisonCount = comparisonSections.length;

      // Build prompt
      prompt = `TARGET REVIEW SECTION (ID: ${section.id}, Type: ${section.section_type}, Company: ${companyData?.name || 'Unknown'}, Referral Code: ${referralCode || 'None'}):\n${targetText}\nSubmitted: ${section.created_at}\n`;

      if (comparisonSections.length > 0) {
        const fromReferral = comparisonSections.filter(s => s.source === 'same_referral_code');
        const fromCompany = comparisonSections.filter(s => s.source === 'same_company');

        if (fromReferral.length > 0) {
          prompt += `\nCOMPARISON SECTIONS FROM SAME REFERRAL CODE (${referralCode}):\n`;
          fromReferral.forEach((s, i) => {
            const sc = s.companies as { name?: string } | null;
            const text = extractTextFromSectionData((s.section_data || {}) as Record<string, unknown>, s.section_type);
            prompt += `[Section ${i + 1}] Type: ${s.section_type} | Company: ${sc?.name || 'Unknown'} | ${text} | Submitted: ${s.created_at}\n`;
          });
        }

        if (fromCompany.length > 0) {
          prompt += `\nOTHER SECTIONS FROM SAME COMPANY (${companyData?.name || 'Unknown'}):\n`;
          fromCompany.forEach((s, i) => {
            const text = extractTextFromSectionData((s.section_data || {}) as Record<string, unknown>, s.section_type);
            prompt += `[Section ${i + 1}] Type: ${s.section_type} | ${text} | Submitted: ${s.created_at}\n`;
          });
        }
      } else {
        prompt += `\nNo comparison sections available.\n`;
      }
    }

    console.log(`Analyzing ${isSection ? 'section' : 'review'} ${reviewId} with ${comparisonCount} comparisons`);

    // Call Lovable AI
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
              name: 'report_fraud_analysis',
              description: 'Report the fraud analysis results for this review.',
              parameters: {
                type: 'object',
                properties: {
                  verdict: {
                    type: 'string',
                    enum: ['clean', 'suspicious', 'likely_fraud'],
                    description: 'Overall fraud verdict.',
                  },
                  confidence: {
                    type: 'string',
                    enum: ['high', 'medium', 'low'],
                    description: 'How confident you are in this verdict.',
                  },
                  summary: {
                    type: 'string',
                    description: 'A 2-4 sentence plain-English explanation of the fraud analysis.',
                  },
                  evidence: {
                    type: 'array',
                    items: { type: 'string' },
                    description: 'Specific fraud observations. Each item should be a concrete finding. Empty array if clean.',
                  },
                },
                required: ['verdict', 'confidence', 'summary', 'evidence'],
                additionalProperties: false,
              },
            },
          },
        ],
        tool_choice: { type: 'function', function: { name: 'report_fraud_analysis' } },
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

    // Save to appropriate table
    const fraudSummary = {
      verdict: analysis.verdict,
      confidence: analysis.confidence,
      summary: analysis.summary,
      evidence: analysis.evidence || [],
      analyzed_at: new Date().toISOString(),
      comparison_count: comparisonCount,
    };

    const { error: updateError } = await supabase
      .from(saveTable)
      .update({ ai_fraud_summary: fraudSummary })
      .eq('id', reviewId);

    if (updateError) {
      console.error('Failed to save fraud summary:', updateError);
    }

    console.log(`${isSection ? 'Section' : 'Review'} ${reviewId} fraud check: ${analysis.verdict} (${analysis.confidence})`);

    return new Response(
      JSON.stringify({ success: true, analysis: fraudSummary, _version: VERSION }),
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
