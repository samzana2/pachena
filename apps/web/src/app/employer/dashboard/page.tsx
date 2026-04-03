"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useEmployer } from "@/contexts/EmployerContext";
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
  TrendingUp,
} from "lucide-react";
import { format } from "date-fns";

const supabase = createBrowserSupabaseClient();

interface Stats {
  totalReviews: number;
  averageRating: number;
  responseRate: number;
  activeJobs: number;
  applications30Days: number;
}

interface ActivityItem {
  id: string;
  type: "application" | "review" | "feedback";
  title: string;
  subtitle: string;
  timestamp: string;
}

const OverviewPage = () => {
  const router = useRouter();
  const { company } = useEmployer();
  const [stats, setStats] = useState<Stats>({
    totalReviews: 0,
    averageRating: 0,
    responseRate: 0,
    activeJobs: 0,
    applications30Days: 0,
  });
  const [recentActivity, setRecentActivity] = useState<ActivityItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [pendingResponses, setPendingResponses] = useState(0);

  useEffect(() => {
    if (company?.id) {
      fetchStats();
      fetchRecentActivity();
    }
  }, [company?.id]);

  const fetchStats = async () => {
    if (!company?.id) return;

    try {
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      const [jobsResult, applicationsResult, reviewsResult, responsesResult] =
        await Promise.all([
          supabase
            .from("jobs")
            .select("id", { count: "exact" })
            .eq("company_id", company.id)
            .eq("is_active", true),
          supabase
            .from("job_applications")
            .select("id, created_at, jobs!inner(company_id)")
            .eq("jobs.company_id", company.id)
            .gte("created_at", thirtyDaysAgo.toISOString()),
          supabase
            .from("reviews")
            .select("id, rating")
            .eq("company_id", company.id)
            .eq("moderation_status", "approved"),
          supabase
            .from("review_responses")
            .select("review_id")
            .eq("company_id", company.id),
        ]);

      const reviews = reviewsResult.data || [];
      const responses = responsesResult.data || [];
      const respondedIds = new Set(responses.map((r) => r.review_id));

      const responseRate =
        reviews.length > 0
          ? Math.round((responses.length / reviews.length) * 100)
          : 0;

      const averageRating =
        reviews.length > 0
          ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length
          : 0;

      const pending = reviews.filter((r) => !respondedIds.has(r.id)).length;
      setPendingResponses(pending);

      setStats({
        totalReviews: reviews.length,
        averageRating: Math.round(averageRating * 10) / 10,
        responseRate,
        activeJobs: jobsResult.count || 0,
        applications30Days: applicationsResult.data?.length || 0,
      });
    } catch (error) {
      console.error("Error fetching stats:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchRecentActivity = async () => {
    if (!company?.id) return;

    try {
      const { data: applications } = await supabase
        .from("job_applications")
        .select("id, full_name, created_at, jobs!inner(title, company_id)")
        .eq("jobs.company_id", company.id)
        .order("created_at", { ascending: false })
        .limit(3);

      const { data: reviews } = await supabase
        .from("reviews")
        .select("id, title, rating, created_at")
        .eq("company_id", company.id)
        .eq("moderation_status", "approved")
        .order("created_at", { ascending: false })
        .limit(3);

      const { data: feedback } = await supabase
        .from("employer_feedback")
        .select("id, title, created_at")
        .eq("company_id", company.id)
        .order("created_at", { ascending: false })
        .limit(2);

      const activity: ActivityItem[] = [];

      applications?.forEach((app) => {
        const job = app.jobs as unknown as { title: string };
        activity.push({
          id: app.id,
          type: "application",
          title: `New application from ${app.full_name}`,
          subtitle: job.title,
          timestamp: app.created_at,
        });
      });

      reviews?.forEach((review) => {
        activity.push({
          id: review.id,
          type: "review",
          title: `New ${review.rating}-star review`,
          subtitle: review.title,
          timestamp: review.created_at,
        });
      });

      feedback?.forEach((fb) => {
        activity.push({
          id: fb.id,
          type: "feedback",
          title: "Private feedback received",
          subtitle: fb.title,
          timestamp: fb.created_at,
        });
      });

      activity.sort(
        (a, b) =>
          new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
      );
      setRecentActivity(activity.slice(0, 5));
    } catch (error) {
      console.error("Error fetching activity:", error);
    }
  };

  const statCards = [
    {
      title: "Total Reviews",
      value: stats.totalReviews,
      icon: MessageSquare,
    },
    {
      title: "Avg. Rating",
      value: stats.averageRating.toFixed(1),
      icon: Star,
    },
    {
      title: "Response Rate",
      value: `${stats.responseRate}%`,
      icon: TrendingUp,
    },
    {
      title: "Active Jobs",
      value: stats.activeJobs,
      icon: Briefcase,
    },
    {
      title: "Applications (30d)",
      value: stats.applications30Days,
      icon: Users,
    },
  ];

  if (!company) return null;

  return (
    <div className="space-y-8">
      {/* Welcome Header */}
      <div>
        <h1 className="text-3xl font-heading font-bold text-foreground tracking-tight">
          Welcome back
        </h1>
        <p className="text-muted-foreground mt-1 text-base">
          Here's what's happening with {company.name}
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        {statCards.map((stat) => (
          <Card
            key={stat.title}
            className="border-border/50 bg-background shadow-sm"
          >
            <CardContent className="p-5">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <p className="text-sm font-medium text-muted-foreground">
                    {stat.title}
                  </p>
                  <p className="text-2xl font-heading font-bold text-foreground">
                    {stat.value}
                  </p>
                </div>
                <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                  <stat.icon className="h-5 w-5 text-foreground" />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Primary CTA */}
      {pendingResponses > 0 && (
        <Card className="border-primary/20 bg-primary/5">
          <CardContent className="p-6 flex items-center justify-between">
            <div>
              <h3 className="font-heading font-semibold text-foreground">
                You have {pendingResponses} review
                {pendingResponses > 1 ? "s" : ""} awaiting response
              </h3>
              <p className="text-sm text-muted-foreground mt-1">
                Responding to reviews helps build trust with potential employees
              </p>
            </div>
            <Button
              onClick={() => router.push("/employer/dashboard/reviews")}
            >
              Respond to Reviews
              <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Quick Actions */}
        <Card className="border-border/50 bg-background shadow-sm">
          <CardHeader className="pb-4">
            <CardTitle className="text-base font-heading font-semibold text-foreground">
              Quick Actions
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <Button
              className="w-full justify-start h-11 text-sm font-medium"
              variant="outline"
              onClick={() => router.push("/employer/dashboard/jobs")}
            >
              <Plus className="h-4 w-4 mr-3" />
              Post a New Job
            </Button>
            <Button
              className="w-full justify-start h-11 text-sm font-medium"
              variant="outline"
              onClick={() => router.push("/employer/dashboard/company")}
            >
              <Building2 className="h-4 w-4 mr-3" />
              Complete Company Profile
            </Button>
          </CardContent>
        </Card>

        {/* Recent Activity */}
        <Card className="border-border/50 bg-background shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-4">
            <CardTitle className="text-base font-heading font-semibold text-foreground">
              Recent Activity
            </CardTitle>
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
                  <div key={item.id} className="flex items-start gap-3">
                    <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                      {item.type === "application" ? (
                        <Users className="h-4 w-4 text-foreground" />
                      ) : item.type === "review" ? (
                        <Star className="h-4 w-4 text-foreground" />
                      ) : (
                        <MessageSquare className="h-4 w-4 text-foreground" />
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

export default OverviewPage;
