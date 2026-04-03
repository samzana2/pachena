"use client";

import { useEffect, useState } from "react";
import { createBrowserSupabaseClient } from "@/lib/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Briefcase,
  Users,
  Star,
  MessageSquare,
  Plus,
  ArrowRight,
  Building2,
} from "lucide-react";
import { useRouter } from 'next/navigation';
import { format } from "date-fns";
import { cn } from "@/lib/utils";
const supabase = createBrowserSupabaseClient();

interface OverviewSectionProps {
  companyId: string;
  companyName: string;
}

interface Stats {
  activeJobs: number;
  totalApplications: number;
  averageRating: number;
  totalReviews: number;
  pendingResponses: number;
}

interface ActivityItem {
  id: string;
  type: "application" | "review" | "feedback";
  title: string;
  subtitle: string;
  timestamp: string;
}

const OverviewSection = ({ companyId, companyName }: OverviewSectionProps) => {
  const router = useRouter();
  const [stats, setStats] = useState<Stats>({
    activeJobs: 0,
    totalApplications: 0,
    averageRating: 0,
    totalReviews: 0,
    pendingResponses: 0,
  });
  const [recentActivity, setRecentActivity] = useState<ActivityItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (companyId) {
      fetchStats();
      fetchRecentActivity();
    }
  }, [companyId]);

  const fetchStats = async () => {
    try {
      const [jobsResult, applicationsResult, reviewsResult, responsesResult] = await Promise.all([
        supabase
          .from("jobs")
          .select("id", { count: "exact" })
          .eq("company_id", companyId)
          .eq("is_active", true),
        supabase
          .from("job_applications")
          .select("id, jobs!inner(company_id)", { count: "exact" })
          .eq("jobs.company_id", companyId),
        supabase
          .from("reviews")
          .select("id, rating")
          .eq("company_id", companyId)
          .eq("moderation_status", "approved"),
        supabase
          .from("review_responses")
          .select("review_id")
          .eq("company_id", companyId),
      ]);

      const reviews = reviewsResult.data || [];
      const responses = responsesResult.data || [];
      const respondedIds = new Set(responses.map(r => r.review_id));
      const pendingResponses = reviews.filter(r => !respondedIds.has(r.id)).length;
      const averageRating = reviews.length > 0
        ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length
        : 0;

      setStats({
        activeJobs: jobsResult.count || 0,
        totalApplications: applicationsResult.count || 0,
        averageRating: Math.round(averageRating * 10) / 10,
        totalReviews: reviews.length,
        pendingResponses,
      });
    } catch (error) {
      console.error("Error fetching stats:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchRecentActivity = async () => {
    try {
      const { data: applications } = await supabase
        .from("job_applications")
        .select("id, full_name, created_at, jobs!inner(title, company_id)")
        .eq("jobs.company_id", companyId)
        .order("created_at", { ascending: false })
        .limit(3);

      const { data: reviews } = await supabase
        .from("reviews")
        .select("id, title, rating, created_at")
        .eq("company_id", companyId)
        .eq("moderation_status", "approved")
        .order("created_at", { ascending: false })
        .limit(3);

      const { data: feedback } = await supabase
        .from("employer_feedback")
        .select("id, title, created_at")
        .eq("company_id", companyId)
        .order("created_at", { ascending: false })
        .limit(2);

      const activity: ActivityItem[] = [];

      applications?.forEach(app => {
        const job = app.jobs as unknown as { title: string; company_id: string };
        activity.push({
          id: app.id,
          type: "application",
          title: `New application from ${app.full_name}`,
          subtitle: job.title,
          timestamp: app.created_at,
        });
      });

      reviews?.forEach(review => {
        activity.push({
          id: review.id,
          type: "review",
          title: `New ${review.rating}-star review`,
          subtitle: review.title,
          timestamp: review.created_at,
        });
      });

      feedback?.forEach(fb => {
        activity.push({
          id: fb.id,
          type: "feedback",
          title: "Private feedback received",
          subtitle: fb.title,
          timestamp: fb.created_at,
        });
      });

      activity.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
      setRecentActivity(activity.slice(0, 5));
    } catch (error) {
      console.error("Error fetching activity:", error);
    }
  };

  const statCards = [
    {
      title: "Active Jobs",
      value: stats.activeJobs,
      icon: Briefcase,
    },
    {
      title: "Applications",
      value: stats.totalApplications,
      icon: Users,
    },
    {
      title: "Avg. Rating",
      value: stats.averageRating.toFixed(1),
      icon: Star,
      suffix: stats.totalReviews > 0 ? `(${stats.totalReviews})` : "",
    },
    {
      title: "Pending Responses",
      value: stats.pendingResponses,
      icon: MessageSquare,
    },
  ];

  return (
    <div className="space-y-8">
      {/* Welcome Header */}
      <div>
        <h1 className="text-3xl font-heading font-bold text-foreground tracking-tight">
          Welcome back
        </h1>
        <p className="text-muted-foreground mt-1 text-base">
          Here's what's happening with {companyName}
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {statCards.map((stat) => (
          <Card key={stat.title} className="border-border/50 bg-background shadow-sm">
            <CardContent className="p-5">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <p className="text-sm font-medium text-muted-foreground">
                    {stat.title}
                  </p>
                  <div className="flex items-baseline gap-1.5">
                    <p className="text-2xl font-heading font-bold text-foreground">
                      {stat.value}
                    </p>
                    {stat.suffix && (
                      <span className="text-xs text-muted-foreground font-medium">
                        {stat.suffix}
                      </span>
                    )}
                  </div>
                </div>
                <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                  <stat.icon className="h-5 w-5 text-primary" />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Quick Actions */}
        <Card className="border-border/50 bg-background shadow-sm">
          <CardHeader className="pb-4">
            <CardTitle className="text-base font-heading font-semibold text-foreground">Quick Actions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <Button
              className="w-full justify-start h-11 text-sm font-medium"
              variant="outline"
              onClick={() => router.push("/test-employer-dashboard?section=jobs")}
            >
              <Plus className="h-4 w-4 mr-3" />
              Post a New Job
            </Button>
            <Button
              className="w-full justify-start h-11 text-sm font-medium"
              variant="outline"
              onClick={() => router.push("/test-employer-dashboard?section=reviews")}
            >
              <MessageSquare className="h-4 w-4 mr-3" />
              Respond to Reviews
              {stats.pendingResponses > 0 && (
                <span className="ml-auto bg-primary/10 text-primary px-2 py-0.5 rounded-full text-xs font-semibold">
                  {stats.pendingResponses} pending
                </span>
              )}
            </Button>
            <Button
              className="w-full justify-start h-11 text-sm font-medium"
              variant="outline"
              onClick={() => router.push("/test-employer-dashboard?section=company")}
            >
              <Building2 className="h-4 w-4 mr-3" />
              Edit Company Profile
            </Button>
          </CardContent>
        </Card>

        {/* Recent Activity */}
        <Card className="border-border/50 bg-background shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-4">
            <CardTitle className="text-base font-heading font-semibold text-foreground">Recent Activity</CardTitle>
            <Button variant="ghost" size="sm" className="text-xs text-muted-foreground hover:text-foreground h-8">
              View All
              <ArrowRight className="h-3 w-3 ml-1" />
            </Button>
          </CardHeader>
          <CardContent>
            {recentActivity.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-muted-foreground text-sm">
                  No recent activity to show
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {recentActivity.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-start gap-3"
                  >
                    <div
                      className={cn(
                        "h-8 w-8 rounded-lg flex items-center justify-center shrink-0",
                        item.type === "application"
                          ? "bg-primary/10"
                          : item.type === "review"
                          ? "bg-primary/10"
                          : "bg-primary/10"
                      )}
                    >
                      {item.type === "application" ? (
                        <Users className="h-4 w-4 text-primary" />
                      ) : item.type === "review" ? (
                        <Star className="h-4 w-4 text-primary" />
                      ) : (
                        <MessageSquare className="h-4 w-4 text-primary" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-foreground text-sm truncate">
                        {item.title}
                      </p>
                      <p className="text-muted-foreground text-xs truncate">
                        {item.subtitle}
                      </p>
                    </div>
                    <span className="text-xs text-muted-foreground shrink-0 font-medium">
                      {format(new Date(item.timestamp), "MMM d")}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default OverviewSection;