"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  FileCheck,
  MessageSquare,
  Building2,
  Settings,
  LogOut,
  ChevronLeft,
  Menu,
  PlusCircle,
  Mail,
  ClipboardList,
  Shield,
  BarChart3,
  X,
  Share2,
  Briefcase,
  LucideIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { createBrowserSupabaseClient } from "@/lib/supabase/client";
import { toast } from "sonner";
import { useRouter } from 'next/navigation';
const supabase = createBrowserSupabaseClient();

interface AdminSidebarProps {
  isCollapsed: boolean;
  onToggle: () => void;
  onNavigate?: () => void;
  isMobile?: boolean;
  isOpen?: boolean;
}

interface NavItem {
  title: string;
  href: string;
  icon: LucideIcon;
  badgeKey?: keyof BadgeCounts;
}

interface NavGroup {
  label: string | null;
  items: NavItem[];
}

const dashboardItem: NavItem = {
  title: "Dashboard",
  href: "/admin",
  icon: LayoutDashboard,
};

const navGroups: NavGroup[] = [
  {
    label: "Moderation",
    items: [
      { title: "Reviews", href: "/admin/reviews", icon: MessageSquare, badgeKey: "pendingReviews" },
      { title: "Spam Analytics", href: "/admin/spam-analytics", icon: Shield },
    ],
  },
  {
    label: "Companies",
    items: [
      { title: "Companies", href: "/admin/companies", icon: Building2 },
      { title: "Claim Requests", href: "/admin/claims", icon: FileCheck, badgeKey: "pendingClaims" },
      { title: "Add Requests", href: "/admin/company-requests", icon: PlusCircle, badgeKey: "pendingCompanyRequests" },
      { title: "Waitlist", href: "/admin/waitlist", icon: ClipboardList, badgeKey: "waitlistCount" },
    ],
  },
  {
    label: "Job Board",
    items: [
      { title: "All Jobs", href: "/admin/jobs", icon: Briefcase },
      { title: "Seed Job", href: "/admin/seed-job", icon: PlusCircle },
    ],
  },
  {
    label: "General",
    items: [
      { title: "Messages", href: "/admin/contact-messages", icon: Mail, badgeKey: "unreadMessages" },
      { title: "Insights", href: "/admin/insights", icon: BarChart3 },
      { title: "Social", href: "/admin/social", icon: Share2 },
    ],
  },
];

const settingsItem: NavItem = {
  title: "Settings",
  href: "/admin/settings",
  icon: Settings,
};

interface BadgeCounts {
  pendingClaims: number;
  pendingCompanyRequests: number;
  flaggedReviews: number;
  unreadMessages: number;
  waitlistCount: number;
  pendingReviews: number;
}

const AdminSidebar = ({ isCollapsed, onToggle, onNavigate, isMobile = false, isOpen = true }: AdminSidebarProps) => {
  const pathname = usePathname();
  const router = useRouter();
  const [badgeCounts, setBadgeCounts] = useState<BadgeCounts>({
    pendingClaims: 0,
    pendingCompanyRequests: 0,
    flaggedReviews: 0,
    unreadMessages: 0,
    waitlistCount: 0,
    pendingReviews: 0,
  });

  useEffect(() => {
    fetchBadgeCounts();
    const interval = setInterval(fetchBadgeCounts, 30000);
    return () => clearInterval(interval);
  }, []);

  const waitlistViewed = localStorage.getItem("admin_waitlist_viewed") === "true";

  const fetchBadgeCounts = async () => {
    try {
      const [claimsResult, requestsResult, reviewsResult, messagesResult, waitlistResult, pendingReviewsResult, pendingSectionsResult] = await Promise.all([
        supabase.from("company_claim_requests").select("status", { count: "exact" }).eq("status", "pending"),
        supabase.from("company_requests").select("status", { count: "exact" }).eq("status", "pending"),
        supabase.from("reviews").select("flagged", { count: "exact" }).eq("flagged", true),
        supabase.from("contact_messages").select("id", { count: "exact" }).is("read_at", null),
        supabase.from("waitlist").select("id", { count: "exact" }),
        supabase.from("reviews").select("id", { count: "exact" }).eq("moderation_status", "pending"),
        supabase.from("review_sections").select("id", { count: "exact" }).eq("moderation_status", "pending"),
      ]);

      setBadgeCounts({
        pendingClaims: claimsResult.count || 0,
        pendingCompanyRequests: requestsResult.count || 0,
        flaggedReviews: reviewsResult.count || 0,
        unreadMessages: messagesResult.count || 0,
        waitlistCount: waitlistResult.count || 0,
        pendingReviews: (pendingReviewsResult.count || 0) + (pendingSectionsResult.count || 0),
      });
    } catch (error) {
      console.error("Error fetching badge counts:", error);
    }
  };

  const handleLogout = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      toast.error("Failed to sign out");
    } else {
      toast.success("Signed out successfully");
      router.push("/");
    }
  };

  const isActive = (href: string) =>
    pathname === href || (href !== "/admin" && pathname.startsWith(href.split("?")[0]));

  const renderNavItem = (item: NavItem) => {
    const active = isActive(item.href);
    let badgeCount = item.badgeKey ? badgeCounts[item.badgeKey] : 0;
    if (item.badgeKey === "waitlistCount" && waitlistViewed) badgeCount = 0;
    const showBadge = badgeCount > 0 && !active;

    return (
      <Link
        key={item.href}
        href={item.href}
        onClick={() => onNavigate?.()}
        className={cn(
          "flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors relative group hover:bg-black/[0.03]",
          active ? "text-black font-medium" : "text-black/60 font-light",
          isCollapsed && !isMobile && "justify-center px-2"
        )}
      >
        <div className="relative">
          <item.icon className={cn("h-5 w-5 shrink-0", active ? "text-black" : "text-black/60")} strokeWidth={active ? 1.75 : 1.5} />
          {isCollapsed && !isMobile && showBadge && (
            <span className="absolute -top-1.5 -right-1.5 h-4 w-4 rounded-full bg-red-400 text-white text-[10px] flex items-center justify-center font-medium">
              {badgeCount > 9 ? "9+" : badgeCount}
            </span>
          )}
        </div>
        {(!isCollapsed || isMobile) && (
          <>
            <span className="flex-1">{item.title}</span>
            {showBadge && (
              <span className="px-1.5 py-0.5 rounded-full bg-red-400 text-white text-xs font-medium">
                {badgeCount}
              </span>
            )}
          </>
        )}
      </Link>
    );
  };

  // On mobile, sidebar is an overlay drawer
  if (isMobile) {
    return (
      <aside
        className={cn(
          "fixed left-0 top-0 z-40 h-screen w-72 border-r border-border bg-card transition-transform duration-300",
          isOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div className="flex h-full flex-col">
          {/* Header */}
          <div className="flex h-14 items-center justify-between border-b border-border px-4">
            <Link href="/admin" onClick={() => onNavigate?.()} className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center">
                <span className="text-primary-foreground font-bold text-sm">P</span>
              </div>
              <span className="font-semibold text-foreground">Admin</span>
            </Link>
            <Button variant="ghost" size="icon" onClick={onToggle} className="h-8 w-8">
              <X className="h-4 w-4" />
            </Button>
          </div>

          {/* Navigation */}
          <nav className="flex-1 overflow-y-auto p-2">
            {renderNavItem(dashboardItem)}
            {navGroups.map((group, idx) => (
              <div key={group.label ?? idx} className="mt-4">
                <span className="px-3 mb-1 block text-[10px] uppercase tracking-wider text-muted-foreground font-medium">
                  {group.label}
                </span>
                <div className="space-y-0.5">
                  {group.items.map(renderNavItem)}
                </div>
              </div>
            ))}
          </nav>

          {/* Footer */}
          <div className="border-t border-border p-2 space-y-1">
            {renderNavItem(settingsItem)}
            <Button
              variant="ghost"
              onClick={handleLogout}
              className="w-full justify-start gap-3 text-black hover:bg-black/5 hover:text-black"
            >
              <LogOut className="h-5 w-5 shrink-0" strokeWidth={1.5} />
              <span>Sign Out</span>
            </Button>
          </div>
        </div>
      </aside>
    );
  }

  // Desktop sidebar
  return (
    <aside
      className={cn(
        "fixed left-0 top-0 z-40 h-screen border-r border-border bg-card transition-all duration-300",
        isCollapsed ? "w-16" : "w-64"
      )}
    >
      <div className="flex h-full flex-col">
        {/* Header */}
        <div className="flex h-16 items-center justify-between border-b border-border px-4">
          {!isCollapsed && (
            <Link href="/admin" className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center">
                <span className="text-primary-foreground font-bold text-sm">P</span>
              </div>
              <span className="font-semibold text-foreground">Admin</span>
            </Link>
          )}
          <Button variant="ghost" size="icon" onClick={onToggle} className={cn("h-8 w-8", isCollapsed && "mx-auto")}>
            {isCollapsed ? <Menu className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
          </Button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto p-2">
          {renderNavItem(dashboardItem)}
          {navGroups.map((group, idx) => (
            <div key={group.label ?? idx} className="mt-4">
              {isCollapsed ? (
                <Separator className="mx-auto w-8 my-2" />
              ) : (
                <span className="px-3 mb-1 block text-[10px] uppercase tracking-wider text-muted-foreground font-medium">
                  {group.label}
                </span>
              )}
              <div className="space-y-0.5">
                {group.items.map(renderNavItem)}
              </div>
            </div>
          ))}
        </nav>

        {/* Footer */}
        <div className="border-t border-border p-2 space-y-1">
          {renderNavItem(settingsItem)}
          <Button
            variant="ghost"
            onClick={handleLogout}
            className={cn(
              "w-full justify-start gap-3 text-black hover:bg-black/5 hover:text-black",
              isCollapsed && "justify-center px-2"
            )}
          >
            <LogOut className="h-5 w-5 shrink-0" strokeWidth={1.5} />
            {!isCollapsed && <span>Sign Out</span>}
          </Button>
        </div>
      </div>
    </aside>
  );
};

export default AdminSidebar;
