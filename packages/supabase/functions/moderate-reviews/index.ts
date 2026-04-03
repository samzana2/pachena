import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const VERSION = "moderate-reviews@2026-02-13.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": 
    "authorization, x-client-info, apikey, content-type, " +
    "x-supabase-client-platform, x-supabase-client-platform-version, " +
    "x-supabase-client-runtime, x-supabase-client-runtime-version",
  "Access-Control-Allow-Methods": "GET, POST, PUT, PATCH, DELETE, OPTIONS",
};

interface RedactionEntry {
  field: string;
  original_text: string;
  redacted_by?: string;
  redacted_at?: string;
  reason: string;
}

interface ModerateRequest {
  reviewId?: string;
  sectionId?: string;
  action: 'flag' | 'unflag' | 'hide' | 'approve' | 'delete' | 'update_hidden_fields' | 'reject' | 'redact' | 'unredact';
  reason?: string;
  notes?: string;
  hiddenFields?: string[];
  redactions?: RedactionEntry[];
  unredactIndices?: number[];
}

const ALLOWED_HIDDEN_FIELDS = ['pros', 'cons', 'advice', 'title', 'department', 'role_title', 'compensation'];

Deno.serve(async (req) => {
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

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get user from auth header
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
      console.error('Auth error:', authError);
      return new Response(
        JSON.stringify({ error: 'Invalid token', _version: VERSION }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check if user is admin (use limit(1) in case user has multiple admin roles)
    const { data: roleData, error: roleError } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .in('role', ['admin', 'super_admin', 'support_admin'])
      .limit(1);

    if (roleError || !roleData || roleData.length === 0) {
      console.error('Role check error:', roleError);
      return new Response(
        JSON.stringify({ error: 'Access denied - admin role required', _version: VERSION }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const userRole = roleData[0].role;
    console.log(`Admin ${user.id} (${userRole}) accessing moderate-reviews`);

    if (req.method !== 'POST') {
      return new Response(
        JSON.stringify({ error: 'Method not allowed', _version: VERSION }),
        { status: 405, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { reviewId, sectionId, action, reason, notes, hiddenFields, redactions, unredactIndices }: ModerateRequest = await req.json();

    // Handle section moderation (review_sections table)
    if (sectionId) {
      // Handle redact action
      if (action === 'redact') {
        if (!redactions || !Array.isArray(redactions) || redactions.length === 0) {
          return new Response(
            JSON.stringify({ error: 'redactions array is required', _version: VERSION }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        // Fetch the section to validate text exists
        const { data: section, error: fetchErr } = await supabase
          .from('review_sections')
          .select('section_data, redactions')
          .eq('id', sectionId)
          .single();

        if (fetchErr || !section) {
          return new Response(
            JSON.stringify({ error: 'Section not found', _version: VERSION }),
            { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        const sectionData = (section.section_data || {}) as Record<string, unknown>;

        // Validate each redaction entry
        for (const r of redactions) {
          if (!r.field || !r.original_text || !r.reason) {
            return new Response(
              JSON.stringify({ error: 'Each redaction needs field, original_text, and reason', _version: VERSION }),
              { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            );
          }
          const fieldValue = sectionData[r.field];
          if (typeof fieldValue !== 'string' || !fieldValue.includes(r.original_text)) {
            return new Response(
              JSON.stringify({ error: `Text not found in field "${r.field}"`, _version: VERSION }),
              { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            );
          }
        }

        // Stamp each entry with admin info
        const stampedRedactions: RedactionEntry[] = redactions.map(r => ({
          ...r,
          redacted_by: user.id,
          redacted_at: new Date().toISOString(),
        }));

        const { error: updateErr } = await supabase
          .from('review_sections')
          .update({ redactions: stampedRedactions })
          .eq('id', sectionId);

        if (updateErr) {
          console.error('Redaction update error:', updateErr);
          return new Response(
            JSON.stringify({ error: 'Failed to save redactions', _version: VERSION }),
            { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        await supabase.from('admin_audit_logs').insert({
          admin_user_id: user.id,
          action: 'section_redact',
          metadata: { section_id: sectionId, redaction_count: stampedRedactions.length },
        });

        console.log(`Section ${sectionId}: ${stampedRedactions.length} redaction(s) saved by admin ${user.id}`);

        return new Response(
          JSON.stringify({ success: true, action: 'redact', redactions: stampedRedactions, _version: VERSION }),
          { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Handle unredact action
      if (action === 'unredact') {
        if (!unredactIndices || !Array.isArray(unredactIndices)) {
          return new Response(
            JSON.stringify({ error: 'unredactIndices array is required', _version: VERSION }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        const { data: section, error: fetchErr } = await supabase
          .from('review_sections')
          .select('redactions')
          .eq('id', sectionId)
          .single();

        if (fetchErr || !section) {
          return new Response(
            JSON.stringify({ error: 'Section not found', _version: VERSION }),
            { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        const existing = (section.redactions || []) as RedactionEntry[];
        const updated = existing.filter((_, i) => !unredactIndices.includes(i));

        const { error: updateErr } = await supabase
          .from('review_sections')
          .update({ redactions: updated })
          .eq('id', sectionId);

        if (updateErr) {
          return new Response(
            JSON.stringify({ error: 'Failed to update redactions', _version: VERSION }),
            { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        await supabase.from('admin_audit_logs').insert({
          admin_user_id: user.id,
          action: 'section_unredact',
          metadata: { section_id: sectionId, removed_count: unredactIndices.length },
        });

        return new Response(
          JSON.stringify({ success: true, action: 'unredact', redactions: updated, _version: VERSION }),
          { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      if (!['approve', 'reject', 'flag'].includes(action)) {
        return new Response(
          JSON.stringify({ error: 'Section moderation only supports approve/reject/flag/redact/unredact', _version: VERSION }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      const statusMap: Record<string, string> = {
        approve: 'approved',
        reject: 'hidden',
        flag: 'flagged',
      };
      const newStatus = statusMap[action];

      // Fetch current section status + session for referral tracking
      const { data: sectionData, error: sectionFetchErr } = await supabase
        .from('review_sections')
        .select('moderation_status, review_session_id')
        .eq('id', sectionId)
        .single();

      if (sectionFetchErr || !sectionData) {
        return new Response(
          JSON.stringify({ error: 'Section not found', _version: VERSION }),
          { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      const previousSectionStatus = sectionData.moderation_status;

      const { error: updateErr } = await supabase
        .from('review_sections')
        .update({ moderation_status: newStatus })
        .eq('id', sectionId);

      if (updateErr) {
        console.error('Section update error:', updateErr);
        return new Response(
          JSON.stringify({ error: 'Failed to update section', _version: VERSION }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      await supabase.from('admin_audit_logs').insert({
        admin_user_id: user.id,
        action: `section_${action}`,
        metadata: { section_id: sectionId, new_status: newStatus, reason: reason || null, notes: notes || null },
      });

      console.log(`Section ${sectionId} ${action} by admin ${user.id}`);

      return new Response(
        JSON.stringify({ success: true, action, sectionId, _version: VERSION }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!reviewId || !action) {
      return new Response(
        JSON.stringify({ error: 'Missing reviewId/sectionId or action', _version: VERSION }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Handle update_hidden_fields action separately (before fetching review for moderation)
    if (action === 'update_hidden_fields') {
      if (!hiddenFields || !Array.isArray(hiddenFields)) {
        return new Response(
          JSON.stringify({ error: 'hiddenFields must be an array', _version: VERSION }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      const invalid = hiddenFields.filter(f => !ALLOWED_HIDDEN_FIELDS.includes(f));
      if (invalid.length > 0) {
        return new Response(
          JSON.stringify({ error: `Invalid field keys: ${invalid.join(', ')}`, _version: VERSION }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      const { error: updateErr } = await supabase
        .from('reviews')
        .update({ hidden_fields: hiddenFields })
        .eq('id', reviewId);

      if (updateErr) {
        console.error('Update hidden_fields error:', updateErr);
        return new Response(
          JSON.stringify({ error: 'Failed to update hidden fields', _version: VERSION }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      await supabase.from('admin_audit_logs').insert({
        admin_user_id: user.id,
        action: 'review_update_hidden_fields',
        metadata: { review_id: reviewId, hidden_fields: hiddenFields },
      });

      console.log(`Review ${reviewId} hidden_fields updated to [${hiddenFields.join(', ')}] by admin ${user.id}`);

      return new Response(
        JSON.stringify({ success: true, action: 'update_hidden_fields', hiddenFields, _version: VERSION }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get current review including referral_code and current moderation_status
    const { data: review, error: fetchError } = await supabase
      .from('reviews')
      .select('id, title, company_id, moderation_status, companies(name)')
      .eq('id', reviewId)
      .single();

    if (fetchError || !review) {
      console.error('Review fetch error:', fetchError);
      return new Response(
        JSON.stringify({ error: 'Review not found', _version: VERSION }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Prepare update data based on action
    let updateData: Record<string, unknown> = {
      moderated_at: new Date().toISOString(),
      moderated_by: user.id,
    };

    if (notes) {
      updateData.moderation_notes = notes;
    }

    // Store moderation justification for approve/flag/hide actions
    if (action === 'approve' || action === 'flag' || action === 'hide') {
      updateData.moderation_justification = {
        action,
        reason: reason || null,
        notes: notes || null,
        admin_id: user.id,
        timestamp: new Date().toISOString(),
      };
    }

    // Handle delete action separately
    if (action === 'delete') {
      const { error: deleteError } = await supabase
        .from('reviews')
        .delete()
        .eq('id', reviewId);

      if (deleteError) {
        console.error('Delete error:', deleteError);
        return new Response(
          JSON.stringify({ error: 'Failed to delete review', _version: VERSION }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Log the deletion with review content preserved
      const companyData = review.companies as { name?: string } | null;
      await supabase.from('admin_audit_logs').insert({
        admin_user_id: user.id,
        action: 'review_delete',
        metadata: {
          review_id: reviewId,
          review_title: review.title,
          company_name: companyData?.name || 'Unknown',
          reason: reason || null,
          notes: notes || null,
        },
      });

      console.log(`Review ${reviewId} permanently deleted by admin ${user.id}`);

      return new Response(
        JSON.stringify({ success: true, action: 'delete', _version: VERSION }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    switch (action) {
      case 'flag':
        updateData.flagged = true;
        break;
      case 'unflag':
        updateData.flagged = false;
        break;
      case 'hide':
        updateData.moderation_status = 'hidden';
        updateData.flagged = false; // Clear flag since the issue has been resolved
        break;
      case 'approve':
        updateData.moderation_status = 'approved';
        updateData.flagged = false;
        break;
      default:
        return new Response(
          JSON.stringify({ error: 'Invalid action', _version: VERSION }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
    }

    // Update the review
    const { error: updateError } = await supabase
      .from('reviews')
      .update(updateData)
      .eq('id', reviewId);

    if (updateError) {
      console.error('Update error:', updateError);
      return new Response(
        JSON.stringify({ error: 'Failed to update review', _version: VERSION }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Update linked reward status based on moderation action
    if (action === 'approve' && review.moderation_status !== 'approved') {
      // Approve reward: pending -> approved
      const { error: rewardError } = await supabase
        .from('review_rewards')
        .update({ status: 'approved' })
        .eq('review_id', reviewId)
        .eq('status', 'pending');
      
      if (rewardError) {
        console.error('Failed to update reward status to approved:', rewardError);
      } else {
        console.log(`Reward status updated to approved for review ${reviewId}`);
      }
    } else if (action === 'hide') {
      // Reject reward: delete phone number
      const { error: rewardError } = await supabase
        .from('review_rewards')
        .update({ 
          status: 'rejected',
          phone_number_encrypted: '', // Delete PII
        })
        .eq('review_id', reviewId)
        .in('status', ['pending', 'approved']);
      
      if (rewardError) {
        console.error('Failed to update reward status to rejected:', rewardError);
      } else {
        console.log(`Reward status updated to rejected for review ${reviewId}`);
      }
    }

    // Log the action
    const companyData = review.companies as { name?: string } | null;
    await supabase.from('admin_audit_logs').insert({
      admin_user_id: user.id,
      action: `review_${action}`,
      metadata: {
        review_id: reviewId,
        review_title: review.title,
        company_name: companyData?.name || 'Unknown',
        reason: reason || null,
        notes: notes || null,
      },
    });

    console.log(`Review ${reviewId} ${action} by admin ${user.id}`);

    return new Response(
      JSON.stringify({ success: true, action, _version: VERSION }),
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
