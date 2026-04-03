import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const VERSION = "manage-admin-users@2026-02-06.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": 
    "authorization, x-client-info, apikey, content-type, " +
    "x-supabase-client-platform, x-supabase-client-platform-version, " +
    "x-supabase-client-runtime, x-supabase-client-runtime-version",
  "Access-Control-Allow-Methods": "GET, POST, PUT, PATCH, DELETE, OPTIONS",
};

interface AddUserRequest {
  email: string;
  role: 'admin' | 'super_admin' | 'support_admin';
}

interface UpdateRoleRequest {
  roleId: string;
  newRole: 'admin' | 'super_admin' | 'support_admin';
}

interface DeleteRoleRequest {
  roleId: string;
}

// Sanitize error messages to prevent information leakage
function sanitizeError(error: unknown, fallbackMessage: string): string {
  // Log full error details server-side for debugging
  console.error('Internal error:', error);
  
  // Return generic, safe message to client
  return fallbackMessage;
}

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

    // Check if user is super_admin
    const { data: roleData, error: roleError } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .eq('role', 'super_admin')
      .limit(1);

    if (roleError || !roleData || roleData.length === 0) {
      console.error('Role check error:', roleError);
      return new Response(
        JSON.stringify({ error: 'Access denied - insufficient permissions', _version: VERSION }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Super admin ${user.id} accessing manage-admin-users`);

    // Handle different HTTP methods
    if (req.method === 'GET') {
      // Get all admin users with their emails
      const { data: adminRoles, error: fetchError } = await supabase
        .from('user_roles')
        .select('*')
        .in('role', ['admin', 'super_admin', 'support_admin'])
        .order('created_at', { ascending: false });

      if (fetchError) {
        console.error('Fetch error:', fetchError);
        return new Response(
          JSON.stringify({ error: 'Unable to load admin users', _version: VERSION }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Get emails from auth.users for each role
      const userIds = adminRoles?.map(r => r.user_id) || [];
      const usersWithEmails = [];

      for (const role of adminRoles || []) {
        const { data: authUser } = await supabase.auth.admin.getUserById(role.user_id);
        usersWithEmails.push({
          ...role,
          email: authUser?.user?.email || 'Unknown'
        });
      }

      return new Response(
        JSON.stringify({ users: usersWithEmails, _version: VERSION }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (req.method === 'POST') {
      // Add a new admin user
      const { email, role }: AddUserRequest = await req.json();

      if (!email || !role) {
        return new Response(
          JSON.stringify({ error: 'Email and role are required', _version: VERSION }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Validate role
      if (!['admin', 'super_admin', 'support_admin'].includes(role)) {
        return new Response(
          JSON.stringify({ error: 'Invalid role', _version: VERSION }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Look up user by email using admin API
      const { data: usersData, error: lookupError } = await supabase.auth.admin.listUsers();
      
      if (lookupError) {
        console.error('User lookup error:', lookupError);
        return new Response(
          JSON.stringify({ error: 'Unable to verify user account', _version: VERSION }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      const targetUser = usersData?.users?.find(u => u.email?.toLowerCase() === email.toLowerCase());
      
      if (!targetUser) {
        return new Response(
          JSON.stringify({ error: 'User not found. They must create an account first.', _version: VERSION }),
          { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Check if user already has an admin role
      const { data: existingRole } = await supabase
        .from('user_roles')
        .select('id, role')
        .eq('user_id', targetUser.id)
        .in('role', ['admin', 'super_admin', 'support_admin'])
        .limit(1);

      if (existingRole && existingRole.length > 0) {
        return new Response(
          JSON.stringify({ error: `User already has ${existingRole[0].role} role`, _version: VERSION }),
          { status: 409, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Add the role
      const { data: newRole, error: insertError } = await supabase
        .from('user_roles')
        .insert({
          user_id: targetUser.id,
          role: role
        })
        .select()
        .single();

      if (insertError) {
        console.error('Insert error:', insertError);
        return new Response(
          JSON.stringify({ error: 'Unable to assign admin role', _version: VERSION }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Log the action
      await supabase.from('admin_audit_logs').insert({
        admin_user_id: user.id,
        action: 'admin_role_added',
        metadata: {
          target_user_id: targetUser.id,
          target_email: email,
          role: role,
        },
      });

      console.log(`Admin role ${role} added for user ${targetUser.id} by super admin ${user.id}`);

      return new Response(
        JSON.stringify({ 
          success: true, 
          role: { ...newRole, email: targetUser.email },
          _version: VERSION
        }),
        { status: 201, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (req.method === 'PUT') {
      // Update an existing role
      const { roleId, newRole }: UpdateRoleRequest = await req.json();

      if (!roleId || !newRole) {
        return new Response(
          JSON.stringify({ error: 'roleId and newRole are required', _version: VERSION }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Validate role
      if (!['admin', 'super_admin', 'support_admin'].includes(newRole)) {
        return new Response(
          JSON.stringify({ error: 'Invalid role', _version: VERSION }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Get the existing role
      const { data: existingRole, error: fetchError } = await supabase
        .from('user_roles')
        .select('*')
        .eq('id', roleId)
        .single();

      if (fetchError || !existingRole) {
        return new Response(
          JSON.stringify({ error: 'Role not found', _version: VERSION }),
          { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Prevent self-demotion from super_admin
      if (existingRole.user_id === user.id && existingRole.role === 'super_admin' && newRole !== 'super_admin') {
        return new Response(
          JSON.stringify({ error: 'Cannot demote yourself from super_admin', _version: VERSION }),
          { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Update the role
      const { error: updateError } = await supabase
        .from('user_roles')
        .update({ role: newRole })
        .eq('id', roleId);

      if (updateError) {
        console.error('Update error:', updateError);
        return new Response(
          JSON.stringify({ error: 'Unable to update role', _version: VERSION }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Log the action
      await supabase.from('admin_audit_logs').insert({
        admin_user_id: user.id,
        action: 'admin_role_updated',
        metadata: {
          target_user_id: existingRole.user_id,
          old_role: existingRole.role,
          new_role: newRole,
        },
      });

      console.log(`Admin role updated from ${existingRole.role} to ${newRole} for user ${existingRole.user_id}`);

      return new Response(
        JSON.stringify({ success: true, _version: VERSION }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (req.method === 'DELETE') {
      // Delete a role
      const { roleId }: DeleteRoleRequest = await req.json();

      if (!roleId) {
        return new Response(
          JSON.stringify({ error: 'roleId is required', _version: VERSION }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Get the existing role
      const { data: existingRole, error: fetchError } = await supabase
        .from('user_roles')
        .select('*')
        .eq('id', roleId)
        .single();

      if (fetchError || !existingRole) {
        return new Response(
          JSON.stringify({ error: 'Role not found', _version: VERSION }),
          { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Prevent self-deletion
      if (existingRole.user_id === user.id) {
        return new Response(
          JSON.stringify({ error: 'Cannot remove your own admin access', _version: VERSION }),
          { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Delete the role
      const { error: deleteError } = await supabase
        .from('user_roles')
        .delete()
        .eq('id', roleId);

      if (deleteError) {
        console.error('Delete error:', deleteError);
        return new Response(
          JSON.stringify({ error: 'Unable to remove admin access', _version: VERSION }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Log the action
      await supabase.from('admin_audit_logs').insert({
        admin_user_id: user.id,
        action: 'admin_role_removed',
        metadata: {
          target_user_id: existingRole.user_id,
          removed_role: existingRole.role,
        },
      });

      console.log(`Admin role ${existingRole.role} removed for user ${existingRole.user_id}`);

      return new Response(
        JSON.stringify({ success: true, _version: VERSION }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({ error: 'Method not allowed', _version: VERSION }),
      { status: 405, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Unexpected error:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error', _version: VERSION }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
