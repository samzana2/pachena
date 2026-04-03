import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
  'Access-Control-Allow-Methods': 'GET, POST, PATCH, DELETE, OPTIONS',
};

// AES-256-GCM encryption/decryption utilities
async function getEncryptionKey(): Promise<CryptoKey> {
  const keyBase64 = Deno.env.get('CLAIM_ENCRYPTION_KEY');
  if (!keyBase64) {
    throw new Error('CLAIM_ENCRYPTION_KEY not configured');
  }
  
  const keyData = Uint8Array.from(atob(keyBase64), c => c.charCodeAt(0));
  return await crypto.subtle.importKey(
    'raw',
    keyData,
    { name: 'AES-GCM' },
    false,
    ['encrypt', 'decrypt']
  );
}

async function decrypt(encryptedData: string): Promise<string> {
  if (!encryptedData) return '';
  
  try {
    const key = await getEncryptionKey();
    const [ivBase64, dataBase64] = encryptedData.split(':');
    
    if (!ivBase64 || !dataBase64) return encryptedData; // Not encrypted
    
    const iv = Uint8Array.from(atob(ivBase64), c => c.charCodeAt(0));
    const data = Uint8Array.from(atob(dataBase64), c => c.charCodeAt(0));
    
    const decrypted = await crypto.subtle.decrypt(
      { name: 'AES-GCM', iv },
      key,
      data
    );
    
    return new TextDecoder().decode(decrypted);
  } catch (error) {
    console.error('Decryption failed:', error);
    return encryptedData; // Return as-is if decryption fails
  }
}

async function logAuditEvent(
  supabase: any,
  adminUserId: string,
  action: string,
  claimRequestId?: string,
  metadata?: Record<string, any>
) {
  try {
    await supabase.from('admin_audit_logs').insert({
      admin_user_id: adminUserId,
      action,
      claim_request_id: claimRequestId,
      metadata: metadata || {},
    });
  } catch (error) {
    console.error('Audit logging failed:', error);
  }
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    
    // Get auth token from request
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Missing authorization header' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Create client with user's token to verify identity
    const supabaseClient = createClient(supabaseUrl, Deno.env.get('SUPABASE_ANON_KEY')!, {
      global: { headers: { Authorization: authHeader } }
    });

    // Get the authenticated user
    const { data: { user }, error: userError } = await supabaseClient.auth.getUser();
    if (userError || !user) {
      return new Response(
        JSON.stringify({ error: 'Invalid or expired token' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Use service role client for checking roles and accessing data
    const serviceClient = createClient(supabaseUrl, supabaseServiceKey);

    // Check if user has claim access (super_admin or support_admin)
    const { data: hasAccess, error: accessError } = await serviceClient.rpc('has_claim_access', {
      _user_id: user.id
    });

    if (accessError || !hasAccess) {
      console.log('Access denied for user:', user.id, accessError);
      return new Response(
        JSON.stringify({ error: 'Access denied. Requires super_admin or support_admin role.' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const url = new URL(req.url);
    const claimId = url.searchParams.get('id');

    // GET - List claims or get single claim details
    if (req.method === 'GET') {
      if (claimId) {
        // Get full claim details with decryption
        const { data: claim, error } = await serviceClient
          .from('company_claim_requests')
          .select('*')
          .eq('id', claimId)
          .single();

        if (error || !claim) {
          return new Response(
            JSON.stringify({ error: 'Claim not found' }),
            { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        // Log access to sensitive data
        await logAuditEvent(serviceClient, user.id, 'view_claim_details', claimId, {
          ip: req.headers.get('x-forwarded-for') || 'unknown'
        });

        // Decrypt sensitive fields
        const decryptedClaim = {
          ...claim,
          phone_number: claim.phone_number_encrypted 
            ? await decrypt(claim.phone_number_encrypted) 
            : claim.phone_number,
          supervisor_name: claim.supervisor_name_encrypted
            ? await decrypt(claim.supervisor_name_encrypted)
            : claim.supervisor_name,
          supervisor_email: claim.supervisor_email_encrypted
            ? await decrypt(claim.supervisor_email_encrypted)
            : claim.supervisor_email,
        };

        // Remove encrypted fields from response
        delete decryptedClaim.phone_number_encrypted;
        delete decryptedClaim.supervisor_name_encrypted;
        delete decryptedClaim.supervisor_email_encrypted;

        return new Response(
          JSON.stringify({ claim: decryptedClaim }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      } else {
        // List claims using the secure view (minimal data)
        const { data: claims, error } = await serviceClient
          .from('claim_requests_list')
          .select('*')
          .order('created_at', { ascending: false });

        if (error) {
          console.error('Error fetching claims:', error);
          return new Response(
            JSON.stringify({ error: 'Failed to fetch claims' }),
            { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        // Log list access
        await logAuditEvent(serviceClient, user.id, 'list_claims', undefined, {
          count: claims?.length || 0
        });

        return new Response(
          JSON.stringify({ claims }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    }

    // PATCH - Update claim status or flag
    if (req.method === 'PATCH') {
      const body = await req.json();
      const { id, action, reason, notes } = body;

      // Support both legacy 'status' parameter and new 'action' parameter
      const effectiveAction = action || body.status;

      if (!id || !['approved', 'denied', 'flag', 'unflag'].includes(effectiveAction)) {
        return new Response(
          JSON.stringify({ error: 'Invalid request. Required: id and action (approved/denied/flag/unflag)' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Get the claim first
      const { data: claim, error: claimError } = await serviceClient
        .from('company_claim_requests')
        .select('*')
        .eq('id', id)
        .single();

      if (claimError || !claim) {
        return new Response(
          JSON.stringify({ error: 'Claim not found' }),
          { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Handle flag/unflag actions
      if (effectiveAction === 'flag' || effectiveAction === 'unflag') {
        const { error: flagError } = await serviceClient
          .from('company_claim_requests')
          .update({
            flagged: effectiveAction === 'flag',
          })
          .eq('id', id);

        if (flagError) {
          console.error('Flag update error:', flagError);
          return new Response(
            JSON.stringify({ error: 'Failed to update flag status' }),
            { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        // Log the flag action
        await logAuditEvent(serviceClient, user.id, `claim_${effectiveAction}`, id, {
          previous_flagged: claim.flagged,
          company_name: claim.company_name,
          reason: reason,
          notes: notes,
        });

        return new Response(
          JSON.stringify({ success: true, action: effectiveAction }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Handle approve/deny actions
      const status = effectiveAction;
      const { error: updateError } = await serviceClient
        .from('company_claim_requests')
        .update({
          status,
          reviewed_at: new Date().toISOString(),
          reviewed_by: user.id,
        })
        .eq('id', id);

      if (updateError) {
        console.error('Update error:', updateError);
        return new Response(
          JSON.stringify({ error: 'Failed to update claim' }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Log the status change with reason and notes
      await logAuditEvent(serviceClient, user.id, `claim_${status}`, id, {
        previous_status: claim.status,
        company_name: claim.company_name,
        reason: reason,
        notes: notes,
      });

      // If approved, create company if it doesn't exist and set up employer access
      let companyCreated = false;
      let companySlug = '';
      let companyId = '';
      
      if (status === 'approved') {
        companySlug = claim.company_name
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, '-')
          .replace(/(^-|-$)/g, '');

        // Check if company exists
        const { data: existingCompany } = await serviceClient
          .from('companies')
          .select('id')
          .eq('slug', companySlug)
          .maybeSingle();

        if (existingCompany) {
          companyId = existingCompany.id;
        } else {
          // Create the company
          const { data: newCompany, error: companyError } = await serviceClient
            .from('companies')
            .insert({
              name: claim.company_name,
              slug: companySlug,
              website: claim.company_website,
              is_claimed: true,
            })
            .select('id')
            .single();

          if (!companyError && newCompany) {
            companyCreated = true;
            companyId = newCompany.id;
          }
        }

        // Mark company as claimed if it exists
        if (companyId) {
          await serviceClient
            .from('companies')
            .update({ is_claimed: true, claimed_at: new Date().toISOString() })
            .eq('id', companyId);
        }

        // Find user by work email using admin API
        const { data: authData, error: authError } = await serviceClient.auth.admin.listUsers();
        
        let claimUserId = claim.user_id;
        
        if (!claimUserId && authData) {
          const matchingUser = authData.users.find(u => u.email === claim.work_email);
          if (matchingUser) {
            claimUserId = matchingUser.id;
          }
        }

        if (claimUserId && companyId) {
          // Assign employer role
          const { error: roleError } = await serviceClient
            .from('user_roles')
            .upsert({
              user_id: claimUserId,
              role: 'employer',
            }, { onConflict: 'user_id,role' });

          if (roleError) {
            console.error('Failed to assign employer role:', roleError);
          } else {
            console.log(`Assigned employer role to user ${claimUserId}`);
          }

          // Update or create employer profile with company link
          const { data: existingProfile } = await serviceClient
            .from('employer_profiles')
            .select('id')
            .eq('user_id', claimUserId)
            .maybeSingle();

          if (existingProfile) {
            const { error: profileError } = await serviceClient
              .from('employer_profiles')
              .update({
                company_id: companyId,
                job_title: claim.job_title,
                updated_at: new Date().toISOString(),
              })
              .eq('user_id', claimUserId);

            if (profileError) {
              console.error('Failed to update employer profile:', profileError);
            }
          } else {
            const { error: profileError } = await serviceClient
              .from('employer_profiles')
              .insert({
                user_id: claimUserId,
                company_id: companyId,
                job_title: claim.job_title,
              });

            if (profileError) {
              console.error('Failed to create employer profile:', profileError);
            }
          }

          // Update claim with user_id
          await serviceClient
            .from('company_claim_requests')
            .update({ user_id: claimUserId })
            .eq('id', id);

          // Update company with claimed_by
          await serviceClient
            .from('companies')
            .update({ claimed_by: claimUserId })
            .eq('id', companyId);

          console.log(`Employer access set up for user ${claimUserId} on company ${companyId}`);
        } else {
          console.log('Could not find user for claim email:', claim.work_email);
        }
      }

      // Send notification email based on status
      try {
        const emailFunctionName = status === 'approved' 
          ? 'send-company-approved-email' 
          : 'send-claim-denied-email';
        
        const emailPayload = status === 'approved'
          ? {
              email: claim.work_email,
              company_name: claim.company_name,
              company_slug: companySlug,
            }
          : {
              email: claim.work_email,
              full_name: claim.full_name,
              company_name: claim.company_name,
            };

        const emailResponse = await fetch(`${supabaseUrl}/functions/v1/${emailFunctionName}`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${supabaseServiceKey}`,
          },
          body: JSON.stringify(emailPayload),
        });

        if (!emailResponse.ok) {
          console.error(`Failed to send ${status} email:`, await emailResponse.text());
        } else {
          console.log(`${status} email sent successfully to ${claim.work_email}`);
        }
      } catch (emailError) {
        console.error('Error sending notification email:', emailError);
        // Don't fail the claim update if email fails
      }

      return new Response(
        JSON.stringify({ 
          success: true, 
          status,
          companyCreated 
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({ error: 'Method not allowed' }),
      { status: 405, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Edge function error:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});