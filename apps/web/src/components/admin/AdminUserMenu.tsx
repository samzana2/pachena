"use client";

import { useState, useEffect } from "react";
import { useRouter } from 'next/navigation';
import { createBrowserSupabaseClient } from "@/lib/supabase/client";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { LogOut, User, ChevronDown } from "lucide-react";
import { toast } from "sonner";
const supabase = createBrowserSupabaseClient();

interface UserInfo {
  email: string;
  role: string;
}

export const AdminUserMenu = () => {
  const router = useRouter();
  const [userInfo, setUserInfo] = useState<UserInfo | null>(null);

  useEffect(() => {
    fetchUserInfo();
  }, []);

  const fetchUserInfo = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) return;

      const { data: roleData } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", session.user.id)
        .limit(1);

      setUserInfo({
        email: session.user.email || "",
        role: roleData?.[0]?.role || "admin",
      });
    } catch (error) {
      console.error("Error fetching user info:", error);
    }
  };

  const handleSignOut = async () => {
    try {
      await supabase.auth.signOut();
      toast.success("Signed out successfully");
      router.push("/admin/auth");
    } catch (error) {
      console.error("Sign out error:", error);
      toast.error("Failed to sign out");
    }
  };

  const formatRole = (role: string) => {
    return role
      .split("_")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ");
  };

  const getRoleBadgeVariant = (role: string) => {
    switch (role) {
      case "super_admin":
        return "destructive";
      case "admin":
        return "default";
      case "support_admin":
        return "secondary";
      default:
        return "outline";
    }
  };

  const getInitials = (email: string) => {
    return email.charAt(0).toUpperCase();
  };

  if (!userInfo) return null;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="flex items-center gap-3 px-3 h-auto py-2">
          <Avatar className="h-9 w-9">
            <AvatarFallback className="bg-primary text-primary-foreground text-sm font-medium">
              {getInitials(userInfo.email)}
            </AvatarFallback>
          </Avatar>
          <div className="hidden md:flex flex-col items-start gap-0.5">
            <span className="text-sm font-medium leading-none truncate max-w-[160px]">
              {userInfo.email}
            </span>
            <span className="text-xs text-muted-foreground leading-none">
              {formatRole(userInfo.role)}
            </span>
          </div>
          <ChevronDown className="h-4 w-4 text-muted-foreground ml-1" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel>
          <div className="flex flex-col">
            <span className="font-medium">{userInfo.email}</span>
            <Badge 
              variant={getRoleBadgeVariant(userInfo.role)} 
              className="w-fit mt-1 text-xs"
            >
              {formatRole(userInfo.role)}
            </Badge>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={() => router.push("/admin/settings?tab=account")}>
          <User className="mr-2 h-4 w-4" />
          My Account
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={handleSignOut} className="text-destructive">
          <LogOut className="mr-2 h-4 w-4" />
          Sign Out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
