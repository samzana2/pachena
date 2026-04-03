"use client";

import { useState } from "react";
import { useRouter } from 'next/navigation';
import { useEmployer } from "@/contexts/EmployerContext";
import { createBrowserSupabaseClient } from "@/lib/supabase/client";
import { toast } from "sonner";
import { Loader2, Bell, ChevronDown, ExternalLink } from "lucide-react";
import EmployerSidebar from "./EmployerSidebar";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
const supabase = createBrowserSupabaseClient();

interface EmployerDashboardShellProps {
  children: React.ReactNode;
}

const EmployerDashboardShell = ({ children }: EmployerDashboardShellProps) => {
  const router = useRouter();
  const { company, userEmail, isLoading } = useEmployer();
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  const handleSignOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      toast.error("Failed to sign out");
    } else {
      toast.success("Signed out successfully");
      router.push("/");
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground font-medium">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  if (!company) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-4">
          <p className="text-muted-foreground">No company associated with your account.</p>
          <Button onClick={() => router.push("/claim")}>Claim a Company</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-muted/30">
      <EmployerSidebar
        isCollapsed={isSidebarCollapsed}
        onToggle={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
      />

      {/* Top Header Bar */}
      <header
        className={cn(
          "fixed top-0 right-0 z-30 h-16 border-b border-border bg-background flex items-center justify-between px-6 transition-all duration-300",
          isSidebarCollapsed ? "left-16" : "left-64"
        )}
      >
        <div className="flex items-center gap-3">
          <h1 className="text-lg font-heading font-semibold text-foreground">
            {company.name}
          </h1>
          <Badge variant="secondary" className="text-xs font-medium">
            {company.is_claimed ? "Claimed" : "Pending"}
          </Badge>
          <Button
            variant="ghost"
            size="sm"
            className="text-muted-foreground hover:text-foreground h-8 px-2"
            onClick={() => router.push(`/company/${company.slug}`)}
          >
            <ExternalLink className="h-4 w-4" />
          </Button>
        </div>

        <div className="flex items-center gap-2">
          {/* Notifications */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="relative h-9 w-9 text-muted-foreground hover:text-foreground">
                <Bell className="h-[18px] w-[18px]" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-80">
              <DropdownMenuLabel className="font-heading font-semibold">Notifications</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <div className="py-4 text-center text-sm text-muted-foreground">
                No new notifications
              </div>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* User Menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="flex items-center gap-2 h-9 px-2 text-muted-foreground hover:text-foreground">
                <Avatar className="h-7 w-7">
                  <AvatarFallback className="bg-primary text-primary-foreground text-xs font-semibold">
                    {userEmail.charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <span className="text-sm font-medium hidden sm:block max-w-[150px] truncate">
                  {userEmail}
                </span>
                <ChevronDown className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel className="font-heading font-semibold">My Account</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem 
                onClick={() => router.push(`/company/${company.slug}`)}
                className="cursor-pointer"
              >
                <ExternalLink className="h-4 w-4 mr-2" />
                View Public Page
              </DropdownMenuItem>
              <DropdownMenuItem 
                onClick={() => router.push("/employer/dashboard/settings")}
                className="cursor-pointer"
              >
                Settings
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleSignOut} className="text-destructive cursor-pointer">
                Sign Out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </header>

      {/* Main Content */}
      <main
        className={cn(
          "min-h-screen pt-16 transition-all duration-300",
          isSidebarCollapsed ? "ml-16" : "ml-64"
        )}
      >
        <div className="p-6">{children}</div>
      </main>
    </div>
  );
};

export default EmployerDashboardShell;
