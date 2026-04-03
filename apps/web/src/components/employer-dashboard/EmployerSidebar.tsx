"use client";

import { useRouter } from 'next/navigation';
import { usePathname } from 'next/navigation';
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  Building2,
  Briefcase,
  Users,
  MessageSquare,
  Lock,
  BarChart3,
  ChevronLeft,
  Menu,
  LogOut,
  Settings,
  HelpCircle,
  ChevronDown,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { createBrowserSupabaseClient } from "@/lib/supabase/client";
import { toast } from "sonner";
import { useState } from "react";
import { useEmployer } from "@/contexts/EmployerContext";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
const supabase = createBrowserSupabaseClient();

interface EmployerSidebarProps {
  isCollapsed: boolean;
  onToggle: () => void;
}

const primaryNavItems = [
  { title: "Overview", path: "/employer/dashboard", icon: LayoutDashboard },
  { title: "Company Profile", path: "/employer/dashboard/company", icon: Building2 },
  { title: "Reviews", path: "/employer/dashboard/reviews", icon: MessageSquare },
  { title: "Inbox", path: "/employer/dashboard/inbox", icon: Lock },
  { title: "Jobs", path: "/employer/dashboard/jobs", icon: Briefcase },
  { title: "Applications", path: "/employer/dashboard/applications", icon: Users },
  { title: "Insights", path: "/employer/dashboard/insights", icon: BarChart3 },
];

const secondaryNavItems = [
  { title: "Settings", path: "/employer/dashboard/settings", icon: Settings },
  { title: "Help", path: "/employer-guidelines", icon: HelpCircle },
];

const EmployerSidebar = ({ isCollapsed, onToggle }: EmployerSidebarProps) => {
  const pathname = usePathname();
  const router = useRouter();
  const { company } = useEmployer();
  const [secondaryOpen, setSecondaryOpen] = useState(false);

  const handleLogout = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      toast.error("Failed to sign out");
    } else {
      toast.success("Signed out successfully");
      router.push("/");
    }
  };

  const isActive = (path: string) => {
    if (path === "/employer/dashboard") {
      return pathname === path;
    }
    return pathname.startsWith(path);
  };

  return (
    <aside
      className={cn(
        "fixed left-0 top-0 z-40 h-screen border-r border-border bg-background transition-all duration-300",
        isCollapsed ? "w-16" : "w-64"
      )}
    >
      <div className="flex h-full flex-col">
        {/* Header */}
        <div className="flex h-16 items-center justify-between border-b border-border px-4">
          {!isCollapsed && (
            <div className="flex items-center gap-3 min-w-0">
              <div className="h-9 w-9 rounded-lg bg-primary flex items-center justify-center shrink-0">
                <Building2 className="h-5 w-5 text-primary-foreground" />
              </div>
              <span className="font-heading font-semibold text-foreground truncate text-sm">
                {company?.name || "Dashboard"}
              </span>
            </div>
          )}
          <Button
            variant="ghost"
            size="icon"
            onClick={onToggle}
            className={cn(
              "h-9 w-9 shrink-0 text-muted-foreground hover:text-foreground hover:bg-muted",
              isCollapsed && "mx-auto"
            )}
          >
            {isCollapsed ? <Menu className="h-5 w-5" /> : <ChevronLeft className="h-5 w-5" />}
          </Button>
        </div>

        {/* Primary Navigation */}
        <nav className="flex-1 space-y-1 p-3 overflow-y-auto">
          {primaryNavItems.map((item) => (
            <button
              key={item.path}
              onClick={() => router.push(item.path)}
              className={cn(
                "w-full flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200",
                isActive(item.path)
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground",
                isCollapsed && "justify-center px-2"
              )}
            >
              <item.icon className="h-[18px] w-[18px] shrink-0" />
              {!isCollapsed && <span className="flex-1 text-left">{item.title}</span>}
            </button>
          ))}

          {/* Secondary Navigation */}
          {!isCollapsed && (
            <Collapsible open={secondaryOpen} onOpenChange={setSecondaryOpen} className="mt-4">
              <CollapsibleTrigger className="w-full flex items-center gap-2 px-3 py-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider hover:text-foreground">
                More
                <ChevronDown className={cn("h-3 w-3 transition-transform", secondaryOpen && "rotate-180")} />
              </CollapsibleTrigger>
              <CollapsibleContent className="space-y-1 mt-1">
                {secondaryNavItems.map((item) => (
                  <button
                    key={item.path}
                    onClick={() => router.push(item.path)}
                    className={cn(
                      "w-full flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200",
                      isActive(item.path)
                        ? "bg-primary text-primary-foreground shadow-sm"
                        : "text-muted-foreground hover:bg-muted hover:text-foreground"
                    )}
                  >
                    <item.icon className="h-[18px] w-[18px] shrink-0" />
                    <span className="flex-1 text-left">{item.title}</span>
                  </button>
                ))}
              </CollapsibleContent>
            </Collapsible>
          )}
        </nav>

        {/* Footer */}
        <div className="border-t border-border p-3">
          <Button
            variant="ghost"
            onClick={handleLogout}
            className={cn(
              "w-full justify-start gap-3 text-muted-foreground hover:text-foreground hover:bg-muted h-10",
              isCollapsed && "justify-center px-2"
            )}
          >
            <LogOut className="h-[18px] w-[18px] shrink-0" />
            {!isCollapsed && <span className="text-sm font-medium">Sign Out</span>}
          </Button>
        </div>
      </div>
    </aside>
  );
};

export default EmployerSidebar;
