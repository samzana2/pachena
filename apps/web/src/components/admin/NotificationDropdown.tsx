"use client";

import { useState, useEffect } from "react";
import Link from 'next/link';
import { Bell, FileCheck, Building2, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { createBrowserSupabaseClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";
const supabase = createBrowserSupabaseClient();

interface NotificationCounts {
  pendingClaims: number;
  pendingCompanyRequests: number;
  flaggedReviews: number;
}

const VIEWED_KEYS = {
  claims: "admin_claims_viewed_count",
  requests: "admin_requests_viewed_count",
  flagged: "admin_flagged_viewed_count",
};

const NotificationDropdown = () => {
  const [counts, setCounts] = useState<NotificationCounts>({
    pendingClaims: 0,
    pendingCompanyRequests: 0,
    flaggedReviews: 0,
  });
  const [viewedCounts, setViewedCounts] = useState({
    claims: parseInt(localStorage.getItem(VIEWED_KEYS.claims) || "0", 10),
    requests: parseInt(localStorage.getItem(VIEWED_KEYS.requests) || "0", 10),
    flagged: parseInt(localStorage.getItem(VIEWED_KEYS.flagged) || "0", 10),
  });
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    fetchCounts();
    // Refresh counts every 30 seconds
    const interval = setInterval(fetchCounts, 30000);
    return () => clearInterval(interval);
  }, []);

  const fetchCounts = async () => {
    try {
      const [claimsResult, requestsResult, reviewsResult] = await Promise.all([
        supabase
          .from("company_claim_requests")
          .select("status", { count: "exact" })
          .eq("status", "pending"),
        supabase
          .from("company_requests")
          .select("status", { count: "exact" })
          .eq("status", "pending"),
        supabase
          .from("reviews")
          .select("flagged", { count: "exact" })
          .eq("flagged", true),
      ]);

      const newCounts = {
        pendingClaims: claimsResult.count || 0,
        pendingCompanyRequests: requestsResult.count || 0,
        flaggedReviews: reviewsResult.count || 0,
      };
      
      setCounts(newCounts);
      
      // Reset viewed counts if actual count dropped below viewed count
      // (items were processed)
      setViewedCounts(prev => ({
        claims: newCounts.pendingClaims < prev.claims ? 0 : prev.claims,
        requests: newCounts.pendingCompanyRequests < prev.requests ? 0 : prev.requests,
        flagged: newCounts.flaggedReviews < prev.flagged ? 0 : prev.flagged,
      }));
    } catch (error) {
      console.error("Error fetching notification counts:", error);
    }
  };

  const markAsViewed = (type: "claims" | "requests" | "flagged", count: number) => {
    localStorage.setItem(VIEWED_KEYS[type], count.toString());
    setViewedCounts(prev => ({ ...prev, [type]: count }));
  };

  // Calculate unviewed notifications
  const unviewedClaims = counts.pendingClaims > viewedCounts.claims 
    ? counts.pendingClaims - viewedCounts.claims 
    : (counts.pendingClaims > 0 && viewedCounts.claims === 0 ? counts.pendingClaims : 0);
  const unviewedRequests = counts.pendingCompanyRequests > viewedCounts.requests 
    ? counts.pendingCompanyRequests - viewedCounts.requests 
    : (counts.pendingCompanyRequests > 0 && viewedCounts.requests === 0 ? counts.pendingCompanyRequests : 0);
  const unviewedFlagged = counts.flaggedReviews > viewedCounts.flagged 
    ? counts.flaggedReviews - viewedCounts.flagged 
    : (counts.flaggedReviews > 0 && viewedCounts.flagged === 0 ? counts.flaggedReviews : 0);

  const totalNotifications = unviewedClaims + unviewedRequests + unviewedFlagged;

  const notifications = [
    {
      label: "Pending Claims",
      count: counts.pendingClaims,
      unviewedCount: unviewedClaims,
      href: "/admin/claims",
      icon: FileCheck,
      color: "text-black",
      bgColor: "bg-black/5",
      onView: () => markAsViewed("claims", counts.pendingClaims),
    },
    {
      label: "Company Requests",
      count: counts.pendingCompanyRequests,
      unviewedCount: unviewedRequests,
      href: "/admin/company-requests",
      icon: Building2,
      color: "text-black",
      bgColor: "bg-black/5",
      onView: () => markAsViewed("requests", counts.pendingCompanyRequests),
    },
    {
      label: "Flagged Reviews",
      count: counts.flaggedReviews,
      unviewedCount: unviewedFlagged,
      href: "/admin/reviews?filter=flagged",
      icon: AlertTriangle,
      color: "text-black",
      bgColor: "bg-black/5",
      onView: () => markAsViewed("flagged", counts.flaggedReviews),
    },
  ];

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5" />
          {totalNotifications > 0 && (
            <span className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-red-400 text-white text-xs flex items-center justify-center font-medium">
              {totalNotifications > 99 ? "99+" : totalNotifications}
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0 bg-popover" align="end">
        <div className="border-b border-border px-4 py-3">
          <h3 className="font-semibold text-foreground">Notifications</h3>
          <p className="text-xs text-muted-foreground">
            Items requiring your attention
          </p>
        </div>
        <div className="py-2">
          {notifications.map((notification) => (
            <Link
              key={notification.href}
              href={notification.href}
              onClick={() => {
                notification.onView();
                setIsOpen(false);
              }}
              className={cn(
                "flex items-center gap-3 px-4 py-3 hover:bg-accent transition-colors",
                notification.count === 0 && "opacity-50"
              )}
            >
              <div className={cn("p-2 rounded-lg", notification.bgColor)}>
                <notification.icon className={cn("h-4 w-4", notification.color)} />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-foreground">
                  {notification.label}
                </p>
                <p className="text-xs text-muted-foreground">
                  {notification.count === 0
                    ? "No pending items"
                    : `${notification.count} pending`}
                </p>
              </div>
              {notification.unviewedCount > 0 && (
                <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-red-400 text-white">
                  {notification.unviewedCount}
                </span>
              )}
            </Link>
          ))}
        </div>
        {totalNotifications === 0 && (
          <div className="border-t border-border px-4 py-3 text-center">
            <p className="text-sm text-muted-foreground">
              All caught up! No items need attention.
            </p>
          </div>
        )}
      </PopoverContent>
    </Popover>
  );
};

export default NotificationDropdown;
