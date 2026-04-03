"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from 'next/navigation';
import { createBrowserSupabaseClient } from "@/lib/supabase/client";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import AdminSidebar from "./AdminSidebar";
import NotificationDropdown from "./NotificationDropdown";
import { AdminUserMenu } from "./AdminUserMenu";
import { cn } from "@/lib/utils";
import { useIsMobile } from "@/hooks/use-mobile";
const supabase = createBrowserSupabaseClient();

interface AdminLayoutProps {
  children: React.ReactNode;
}

const AdminLayout = ({ children }: AdminLayoutProps) => {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(true);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const isMounted = useRef(true);
  const isMobile = useIsMobile();

  useEffect(() => {
    isMounted.current = true;
    verifyAdminAccess();
    
    return () => {
      isMounted.current = false;
    };
  }, []);

  // Close mobile sidebar on route change
  useEffect(() => {
    if (isMobile) {
      setIsMobileSidebarOpen(false);
    }
  }, [isMobile]);

  const verifyAdminAccess = async (retryCount = 0) => {
    try {
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      
      if (!isMounted.current) return;
      
      if (sessionError || !session) {
        toast.error("Please log in to access this page");
        router.push("/admin/auth");
        return;
      }

      const { data: isAdminUser, error: rpcError } = await supabase.rpc('is_admin', {
        _user_id: session.user.id
      });

      if (!isMounted.current) return;

      if (rpcError) {
        console.error("RPC error checking admin status:", rpcError);
        if (retryCount < 1) {
          setTimeout(() => {
            if (isMounted.current) {
              verifyAdminAccess(retryCount + 1);
            }
          }, 1000);
          return;
        }
        toast.error("Failed to verify admin access. Please refresh the page.");
        setIsLoading(false);
        return;
      }

      if (!isAdminUser) {
        toast.error("You don't have permission to access this page");
        router.push("/");
        return;
      }

      setIsAdmin(true);
    } catch (error) {
      console.error("Access verification error:", error);
      if (!isMounted.current) return;
      if (retryCount < 1) {
        setTimeout(() => {
          if (isMounted.current) {
            verifyAdminAccess(retryCount + 1);
          }
        }, 1000);
        return;
      }
      toast.error("Failed to verify access. Please refresh the page.");
    } finally {
      if (isMounted.current) {
        setIsLoading(false);
      }
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground">Verifying access...</p>
        </div>
      </div>
    );
  }

  if (!isAdmin) {
    return null;
  }

  const handleToggleSidebar = () => {
    if (isMobile) {
      setIsMobileSidebarOpen(!isMobileSidebarOpen);
    } else {
      setIsSidebarCollapsed(!isSidebarCollapsed);
    }
  };

  const handleNavigate = () => {
    if (isMobile) {
      setIsMobileSidebarOpen(false);
    } else {
      setIsSidebarCollapsed(true);
    }
  };

  const sidebarOpen = isMobile ? isMobileSidebarOpen : true;
  const sidebarCollapsed = isMobile ? false : isSidebarCollapsed;

  return (
    <div className="min-h-screen bg-background overflow-x-hidden">
      {/* Mobile overlay */}
      {isMobile && isMobileSidebarOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/40"
          onClick={() => setIsMobileSidebarOpen(false)}
        />
      )}

      <AdminSidebar
        isCollapsed={sidebarCollapsed}
        onToggle={handleToggleSidebar}
        onNavigate={handleNavigate}
        isMobile={isMobile}
        isOpen={sidebarOpen}
      />

      {/* Top Header Bar */}
      <header
        className={cn(
          "fixed top-0 right-0 z-20 h-14 md:h-16 border-b border-border bg-card flex items-center justify-end gap-2 md:gap-4 px-3 md:px-6 transition-all duration-300",
          isMobile ? "left-0" : (isSidebarCollapsed ? "left-16" : "left-64")
        )}
      >
        {isMobile && (
          <button
            onClick={() => setIsMobileSidebarOpen(true)}
            className="mr-auto p-2 -ml-1 text-foreground"
            aria-label="Open sidebar"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="4" x2="20" y1="12" y2="12"/><line x1="4" x2="20" y1="6" y2="6"/><line x1="4" x2="20" y1="18" y2="18"/></svg>
          </button>
        )}
        <NotificationDropdown />
        <AdminUserMenu />
      </header>

      <main
        className={cn(
          "min-h-screen pt-14 md:pt-16 transition-all duration-300",
          isMobile ? "ml-0" : (isSidebarCollapsed ? "ml-16" : "ml-64")
        )}
      >
        <div className="p-3 md:p-6 max-w-full overflow-x-hidden">
          {children}
        </div>
      </main>
    </div>
  );
};

export default AdminLayout;
