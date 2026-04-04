"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import AdminLayout from "@/components/admin/AdminLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { createBrowserSupabaseClient } from "@/lib/supabase/client";
import {
  FileCheck,
  MessageSquare,
  Building2,
  Clock,
  CheckCircle,
  Flag,
  ArrowRight,
  Loader2,
  PlusCircle,
  Users,
  Inbox,
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";

const supabase = createBrowserSupabaseClient();

interface QueueItem {
  count: number;
  oldestDate: string | null;
}

interface DashboardQueues {
  pendingReviews: QueueItem;
  flaggedContent: QueueItem;
  pendingClaims: QueueItem;
  companyRequests: QueueItem;
  waitlist: QueueItem;
}

const fetchDashboardData = async (): Promise<DashboardQueues> => {
  const [
    pendingReviewsResult,
    flaggedReviewsResult,
    pendingClaimsResult,
    companyRequestsResult,
    waitlistResult,
  ] = await Promise.all([
    supabase
      .from('reviews')
      .select('id, created_at')
      .eq('moderation_status', 'pending')
      .order('created_at', { ascending: true }),
    supabase
      .from('reviews')
      .select('id, created_at')
      .eq('flagged', true)
      .order('created_at', { ascending: true }),
    supabase
      .from('company_claim_requests')
      .select('id, created_at')
      .eq('status', 'pending')
      .order('created_at', { ascending: true }),
    supabase
      .from('company_requests')
      .select('id, created_at')
      .eq('status', 'pending')
      .order('created_at', { ascending: true }),
    supabase
      .from('waitlist')
      .select('id, created_at')
      .order('created_at', { ascending: true }),
  ]);

  return {
    pendingReviews: {
      count: pendingReviewsResult.data?.length || 0,
      oldestDate: pendingReviewsResult.data?.[0]?.created_at || null,
    },
    flaggedContent: {
      count: flaggedReviewsResult.data?.length || 0,
      oldestDate: flaggedReviewsResult.data?.[0]?.created_at || null,
    },
    pendingClaims: {
      count: pendingClaimsResult.data?.length || 0,
      oldestDate: pendingClaimsResult.data?.[0]?.created_at || null,
    },
    companyRequests: {
      count: companyRequestsResult.data?.length || 0,
      oldestDate: companyRequestsResult.data?.[0]?.created_at || null,
    },
    waitlist: {
      count: waitlistResult.data?.length || 0,
      oldestDate: waitlistResult.data?.[0]?.created_at || null,
    },
  };
};

const Admin = () => {
  const { data: queues, isLoading } = useQuery({
    queryKey: ['admin-dashboard-queues'],
    queryFn: fetchDashboardData,
    refetchOnWindowFocus: true,
    staleTime: 30000,
  });

  const formatOldestAge = (date: string | null) => {
    if (!date) return null;
    return formatDistanceToNow(new Date(date), { addSuffix: false });
  };

  const totalPending = queues
    ? queues.pendingReviews.count + queues.flaggedContent.count + queues.pendingClaims.count + queues.companyRequests.count
    : 0;

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-foreground">Admin Dashboard</h1>
          <p className="mt-1 text-muted-foreground">
            {isLoading
              ? "Loading..."
              : totalPending === 0
                ? "All caught up! No items require attention."
                : `${totalPending} item${totalPending !== 1 ? 's' : ''} require${totalPending === 1 ? 's' : ''} your attention`
            }
          </p>
        </div>

        {isLoading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : totalPending === 0 && queues?.waitlist.count === 0 ? (
          <Card className="bg-white border border-black/5">
            <CardContent className="flex flex-col items-center justify-center py-16">
              <div className="h-16 w-16 rounded-full bg-muted flex items-center justify-center mb-4">
                <Inbox className="h-8 w-8 text-muted-foreground" />
              </div>
              <h2 className="text-xl font-semibold text-foreground mb-2">All caught up!</h2>
              <p className="text-muted-foreground text-center max-w-md">
                There are no pending items that require your attention. Check back later or browse the navigation to manage existing content.
              </p>
            </CardContent>
          </Card>
        ) : (
          <>
            {/* Action Queues */}
            <div className="space-y-4">
              <h2 className="text-sm font-medium text-black uppercase tracking-wide">
                Action Required
              </h2>

              <div className="grid gap-4 md:grid-cols-2">
                <QueueCard
                  title="Pending Reviews"
                  description="Pending employee reviews awaiting approval"
                  icon={MessageSquare}
                  count={queues?.pendingReviews.count || 0}
                  oldestAge={formatOldestAge(queues?.pendingReviews.oldestDate || null)}
                  href="/admin/reviews"
                  cta="Review"
                />

                <QueueCard
                  title="Flagged Content"
                  description="Reviews flagged for moderation review"
                  icon={Flag}
                  count={queues?.flaggedContent.count || 0}
                  oldestAge={formatOldestAge(queues?.flaggedContent.oldestDate || null)}
                  href="/admin/reviews?filter=flagged"
                  cta="Review"
                  variant={queues?.flaggedContent.count && queues.flaggedContent.count > 0 ? "urgent" : "default"}
                />

                <QueueCard
                  title="Company Claim Requests"
                  description="Employer requests to claim company pages"
                  icon={FileCheck}
                  count={queues?.pendingClaims.count || 0}
                  oldestAge={formatOldestAge(queues?.pendingClaims.oldestDate || null)}
                  href="/admin/claims"
                  cta="Review"
                />

                <QueueCard
                  title="Company Add Requests"
                  description="Requests to add new companies"
                  icon={PlusCircle}
                  count={queues?.companyRequests.count || 0}
                  oldestAge={formatOldestAge(queues?.companyRequests.oldestDate || null)}
                  href="/admin/company-requests"
                  cta="Review"
                />
              </div>
            </div>

            {queues && queues.waitlist.count > 0 && (
              <div className="space-y-4">
                <h2 className="text-sm font-medium text-black uppercase tracking-wide">
                  Tracking
                </h2>

                <div className="grid gap-4 md:grid-cols-2">
                  <QueueCard
                    title="Employer Waitlist"
                    description="Companies interested in claiming pages"
                    icon={Users}
                    count={queues.waitlist.count}
                    oldestAge={formatOldestAge(queues.waitlist.oldestDate)}
                    href="/admin/waitlist"
                    cta="View"
                    variant="secondary"
                  />
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </AdminLayout>
  );
};

interface QueueCardProps {
  title: string;
  description: string;
  icon: React.ElementType;
  count: number;
  oldestAge: string | null;
  href: string;
  cta: string;
  variant?: "default" | "urgent" | "secondary";
}

const QueueCard = ({
  title,
  description,
  icon: Icon,
  count,
  oldestAge,
  href,
  cta,
  variant = "default",
}: QueueCardProps) => {
  const isEmpty = count === 0;

  if (isEmpty && variant !== "secondary") {
    return (
      <Card className="bg-white border border-black">
        <CardHeader className="flex flex-row items-start justify-between pb-2">
          <div className="space-y-1">
            <CardTitle className="text-base font-medium text-black">
              {title}
            </CardTitle>
            <p className="text-sm text-black/60">{description}</p>
          </div>
          <div className="w-9 h-9 rounded-lg border border-black/10 flex items-center justify-center flex-shrink-0">
            <Icon className="w-4 h-4 text-black" />
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-2 text-sm text-black/60">
            <CheckCircle className="h-4 w-4" />
            <span>All clear</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-white border border-black hover:shadow-sm transition-shadow">
      <CardHeader className="flex flex-row items-start justify-between pb-2">
        <div className="space-y-1">
          <CardTitle className="text-base font-medium text-black">
            {title}
          </CardTitle>
          <p className="text-sm text-black/60">{description}</p>
        </div>
        <div className={`w-9 h-9 rounded-lg border flex items-center justify-center flex-shrink-0 ${
          variant === "urgent" ? "border-red-200 bg-red-50" : "border-black/10"
        }`}>
          <Icon className={`w-4 h-4 ${
            variant === "urgent" ? "text-red-600" : "text-black"
          }`} />
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-baseline gap-3">
          <span className={`text-3xl font-bold ${
            variant === "urgent" ? "text-red-600" : "text-black"
          }`}>
            {count}
          </span>
          {oldestAge && (
            <div className="flex items-center gap-1 text-sm text-black/60">
              <Clock className="h-3.5 w-3.5" />
              <span>oldest: {oldestAge}</span>
            </div>
          )}
        </div>

        <Button asChild variant="outline" size="sm" className="w-full">
          <Link href={href}>
            {cta}
            <ArrowRight className="ml-2 h-4 w-4" />
          </Link>
        </Button>
      </CardContent>
    </Card>
  );
};

export default Admin;
