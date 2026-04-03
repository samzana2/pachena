"use client";

import { useState, useEffect } from "react";
import { createBrowserSupabaseClient } from "@/lib/supabase/client";
import { getEdgeFunctionUrl } from "@/lib/edge-functions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { toast } from "sonner";
import { UserPlus, Trash2, Shield, Loader2, Pencil, AlertTriangle } from "lucide-react";
import type { Database } from "@/types/supabase";
const supabase = createBrowserSupabaseClient();

type AppRole = Database["public"]["Enums"]["app_role"];
type AdminRole = 'admin' | 'super_admin' | 'support_admin';

interface UserRole {
  id: string;
  user_id: string;
  role: AppRole;
  created_at: string;
  email?: string;
}

const roleLabels: Record<AppRole, string> = {
  admin: "Admin",
  super_admin: "Super Admin",
  support_admin: "Support Admin",
  employer: "Employer",
};

const roleBadgeVariants: Record<AppRole, "default" | "secondary" | "destructive" | "outline"> = {
  super_admin: "destructive",
  admin: "default",
  support_admin: "secondary",
  employer: "outline",
};

export function UserRoleManager() {
  const [userRoles, setUserRoles] = useState<UserRole[]>([]);
  const [loading, setLoading] = useState(true);
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedRole, setSelectedRole] = useState<UserRole | null>(null);
  const [newUserEmail, setNewUserEmail] = useState("");
  const [newUserRole, setNewUserRole] = useState<AdminRole>("admin");
  const [editingRole, setEditingRole] = useState<AdminRole>("admin");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [currentUserRole, setCurrentUserRole] = useState<AppRole | null>(null);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  useEffect(() => {
    fetchCurrentUserRole();
  }, []);

  useEffect(() => {
    if (currentUserRole === 'super_admin') {
      fetchUserRolesViaEdgeFunction();
    } else if (currentUserRole) {
      fetchUserRolesDirectly();
    }
  }, [currentUserRole]);

  const fetchCurrentUserRole = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      setCurrentUserId(user.id);
      const { data } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", user.id)
        .in("role", ["admin", "super_admin", "support_admin"])
        .limit(1);
      if (data && data.length > 0) {
        setCurrentUserRole(data[0].role);
      }
    }
  };

  const fetchUserRolesViaEdgeFunction = async () => {
    setLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        toast.error("Not authenticated");
        return;
      }

      const response = await fetch(
        getEdgeFunctionUrl('manage-admin-users'),
        {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${session.access_token}`,
            'Content-Type': 'application/json',
          },
        }
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to fetch admin users');
      }

      const { users } = await response.json();
      setUserRoles(users || []);
    } catch (error) {
      console.error("Error fetching user roles:", error);
      toast.error("Failed to load admin users");
    } finally {
      setLoading(false);
    }
  };

  const fetchUserRolesDirectly = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("user_roles")
        .select("*")
        .in("role", ["admin", "super_admin", "support_admin"])
        .order("created_at", { ascending: false });

      if (error) throw error;
      setUserRoles(data || []);
    } catch (error) {
      console.error("Error fetching user roles:", error);
      toast.error("Failed to load admin users");
    } finally {
      setLoading(false);
    }
  };

  const handleAddUser = async () => {
    if (!newUserEmail.trim()) {
      toast.error("Please enter an email address");
      return;
    }

    setIsSubmitting(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        toast.error("Not authenticated");
        return;
      }

      const response = await fetch(
        getEdgeFunctionUrl('manage-admin-users'),
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${session.access_token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            email: newUserEmail,
            role: newUserRole,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to add admin user');
      }

      toast.success(`Admin role added for ${newUserEmail}`);
      setAddDialogOpen(false);
      setNewUserEmail("");
      setNewUserRole("admin");
      fetchUserRolesViaEdgeFunction();
    } catch (error) {
      console.error("Error adding user:", error);
      toast.error(error instanceof Error ? error.message : "Failed to add admin user");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleChangeRole = async () => {
    if (!selectedRole) return;

    setIsSubmitting(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        toast.error("Not authenticated");
        return;
      }

      const response = await fetch(
        getEdgeFunctionUrl('manage-admin-users'),
        {
          method: 'PUT',
          headers: {
            'Authorization': `Bearer ${session.access_token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            roleId: selectedRole.id,
            newRole: editingRole,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to update role');
      }

      toast.success("Role updated successfully");
      setEditDialogOpen(false);
      setSelectedRole(null);
      fetchUserRolesViaEdgeFunction();
    } catch (error) {
      console.error("Error updating role:", error);
      toast.error(error instanceof Error ? error.message : "Failed to update role");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteRole = async () => {
    if (!selectedRole) return;

    setIsSubmitting(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        toast.error("Not authenticated");
        return;
      }

      const response = await fetch(
        getEdgeFunctionUrl('manage-admin-users'),
        {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${session.access_token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            roleId: selectedRole.id,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to remove admin access');
      }

      toast.success("Admin access removed");
      setDeleteDialogOpen(false);
      setSelectedRole(null);
      fetchUserRolesViaEdgeFunction();
    } catch (error) {
      console.error("Error removing role:", error);
      toast.error(error instanceof Error ? error.message : "Failed to remove admin access");
    } finally {
      setIsSubmitting(false);
    }
  };

  const isSuperAdmin = currentUserRole === "super_admin";
  const canManageUsers = isSuperAdmin;

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-medium">Admin Users</h3>
          <p className="text-sm text-muted-foreground">
            {isSuperAdmin 
              ? "Manage who has administrative access to the platform"
              : "View administrative users (only Super Admins can manage users)"
            }
          </p>
        </div>
        {canManageUsers && (
          <Dialog open={addDialogOpen} onOpenChange={setAddDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <UserPlus className="mr-2 h-4 w-4" />
                Add Admin
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add Admin User</DialogTitle>
                <DialogDescription>
                  Add administrative access for an existing user account. The user must have created an account first.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="email">User Email</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="user@example.com"
                    value={newUserEmail}
                    onChange={(e) => setNewUserEmail(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="role">Role</Label>
                  <Select value={newUserRole} onValueChange={(v) => setNewUserRole(v as AdminRole)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="support_admin">Support Admin</SelectItem>
                      <SelectItem value="admin">Admin</SelectItem>
                      <SelectItem value="super_admin">Super Admin</SelectItem>
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground">
                    Super Admin can manage other admins. Admin has full platform access. Support Admin has limited access.
                  </p>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setAddDialogOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleAddUser} disabled={isSubmitting}>
                  {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Add User
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        )}
      </div>

      {!isSuperAdmin && (
        <Card className="border-yellow-500/50 bg-yellow-500/10">
          <CardContent className="flex items-center gap-3 py-4">
            <AlertTriangle className="h-5 w-5 text-yellow-500" />
            <p className="text-sm text-yellow-700 dark:text-yellow-400">
              Only Super Admins can add, edit, or remove admin users. Contact a Super Admin for access changes.
            </p>
          </CardContent>
        </Card>
      )}

      <div className="space-y-3">
        {userRoles.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Shield className="h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-muted-foreground">No admin users found</p>
            </CardContent>
          </Card>
        ) : (
          userRoles.map((userRole) => {
            const isCurrentUser = userRole.user_id === currentUserId;
            
            return (
              <Card key={userRole.id} className={isCurrentUser ? "border-primary/50" : ""}>
                <CardContent className="flex items-center justify-between py-4">
                  <div className="flex items-center gap-4">
                    <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center">
                      <Shield className="h-5 w-5 text-muted-foreground" />
                    </div>
                    <div>
                      <p className="font-medium text-sm flex items-center gap-2">
                        {userRole.email || `User ID: ${userRole.user_id.substring(0, 8)}...`}
                        {isCurrentUser && (
                          <Badge variant="outline" className="text-xs">You</Badge>
                        )}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Added {new Date(userRole.created_at).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Badge variant={roleBadgeVariants[userRole.role]}>
                      {roleLabels[userRole.role]}
                    </Badge>
                    {canManageUsers && !isCurrentUser && (
                      <>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => {
                            setSelectedRole(userRole);
                            setEditingRole(userRole.role as AdminRole);
                            setEditDialogOpen(true);
                          }}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="text-destructive hover:text-destructive"
                          onClick={() => {
                            setSelectedRole(userRole);
                            setDeleteDialogOpen(true);
                          }}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </>
                    )}
                    {isCurrentUser && (
                      <span className="text-xs text-muted-foreground italic">
                        Cannot modify own role
                      </span>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })
        )}
      </div>

      {/* Edit Role Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Admin Role</DialogTitle>
            <DialogDescription>
              Change the role for {selectedRole?.email || 'this user'}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Current Role</Label>
              <Badge variant={selectedRole ? roleBadgeVariants[selectedRole.role] : "default"}>
                {selectedRole ? roleLabels[selectedRole.role] : ""}
              </Badge>
            </div>
            <div className="space-y-2">
              <Label htmlFor="newRole">New Role</Label>
              <Select value={editingRole} onValueChange={(v) => setEditingRole(v as AdminRole)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="support_admin">Support Admin</SelectItem>
                  <SelectItem value="admin">Admin</SelectItem>
                  <SelectItem value="super_admin">Super Admin</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleChangeRole} disabled={isSubmitting || editingRole === selectedRole?.role}>
              {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Update Role
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove Admin Access</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to remove admin access for {selectedRole?.email || 'this user'}? 
              They will no longer be able to access the admin panel.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isSubmitting}>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleDeleteRole} 
              disabled={isSubmitting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Remove Access
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
