"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { createBrowserSupabaseClient } from "@/lib/supabase/client";
import { 
  Shield, 
  Globe, 
  Building2, 
  Clock, 
  AlertTriangle,
  RefreshCw,
  Loader2,
  TrendingUp,
  Users,
  Fingerprint,
  Zap,
  FileText,
} from "lucide-react";
import { format, subDays, subHours } from "date-fns";
const supabase = createBrowserSupabaseClient();

interface IPStats {
  request_ip: string;
  request_count: number;
  first_seen: string;
  last_seen: string;
  companies_targeted: number;
}

interface DomainStats {
  email_domain: string;
  request_count: number;
  verified_count: number;
  review_submitted_count: number;
}

interface HourlyStats {
  hour: string;
  count: number;
}

interface OverviewStats {
  totalVerifications24h: number;
  totalVerifications7d: number;
  uniqueIPs24h: number;
  suspiciousIPs: number;
  verificationRate: number;
  reviewSubmissionRate: number;
}

interface SimilarityFlag {
  id: string;
  review_id: string;
  matched_review_id: string | null;
  flag_type: string;
  details: unknown;
  created_at: string;
}

const SpamAnalytics = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [ipStats, setIPStats] = useState<IPStats[]>([]);
  const [domainStats, setDomainStats] = useState<DomainStats[]>([]);
  const [hourlyStats, setHourlyStats] = useState<HourlyStats[]>([]);
  const [overview, setOverview] = useState<OverviewStats | null>(null);
  const [fraudAlerts, setFraudAlerts] = useState<SimilarityFlag[]>([]);

  const fetchAnalytics = async () => {
    setIsLoading(true);
    try {
      const now = new Date();
      const cutoff24h = subHours(now, 24).toISOString();
      const cutoff7d = subDays(now, 7).toISOString();

      // Fetch all verification sessions for analysis
      const { data: sessions, error } = await supabase
        .from("verification_sessions")
        .select("*")
        .gte("created_at", cutoff7d)
        .order("created_at", { ascending: false });

      if (error) throw error;

      const sessions24h = sessions?.filter(s => new Date(s.created_at) >= new Date(cutoff24h)) || [];
      const allSessions = sessions || [];

      // Calculate overview stats
      const uniqueIPs24h = new Set(sessions24h.map(s => s.request_ip).filter(Boolean)).size;
      const verifiedCount = allSessions.filter(s => s.verified).length;
      const submittedCount = allSessions.filter(s => s.review_submitted).length;

      // Find suspicious IPs (more than 5 requests in 24h)
      const ipCounts24h = sessions24h.reduce((acc, s) => {
        if (s.request_ip) {
          acc[s.request_ip] = (acc[s.request_ip] || 0) + 1;
        }
        return acc;
      }, {} as Record<string, number>);
      const suspiciousIPs = Object.values(ipCounts24h).filter(count => count > 5).length;

      setOverview({
        totalVerifications24h: sessions24h.length,
        totalVerifications7d: allSessions.length,
        uniqueIPs24h,
        suspiciousIPs,
        verificationRate: allSessions.length > 0 ? (verifiedCount / allSessions.length) * 100 : 0,
        reviewSubmissionRate: verifiedCount > 0 ? (submittedCount / verifiedCount) * 100 : 0,
      });

      // Calculate IP stats
      const ipData = allSessions.reduce((acc, s) => {
        const ip = s.request_ip || "unknown";
        if (!acc[ip]) {
          acc[ip] = {
            request_ip: ip,
            request_count: 0,
            first_seen: s.created_at,
            last_seen: s.created_at,
            companies: new Set<string>(),
          };
        }
        acc[ip].request_count++;
        acc[ip].companies.add(s.company_id);
        if (new Date(s.created_at) < new Date(acc[ip].first_seen)) {
          acc[ip].first_seen = s.created_at;
        }
        if (new Date(s.created_at) > new Date(acc[ip].last_seen)) {
          acc[ip].last_seen = s.created_at;
        }
        return acc;
      }, {} as Record<string, { request_ip: string; request_count: number; first_seen: string; last_seen: string; companies: Set<string> }>);

      const sortedIPStats = Object.values(ipData)
        .map(ip => ({
          request_ip: ip.request_ip,
          request_count: ip.request_count,
          first_seen: ip.first_seen,
          last_seen: ip.last_seen,
          companies_targeted: ip.companies.size,
        }))
        .sort((a, b) => b.request_count - a.request_count)
        .slice(0, 20);

      setIPStats(sortedIPStats);

      // Calculate domain stats
      const domainData = allSessions.reduce((acc, s) => {
        const domain = s.email_domain;
        if (!acc[domain]) {
          acc[domain] = {
            email_domain: domain,
            request_count: 0,
            verified_count: 0,
            review_submitted_count: 0,
          };
        }
        acc[domain].request_count++;
        if (s.verified) acc[domain].verified_count++;
        if (s.review_submitted) acc[domain].review_submitted_count++;
        return acc;
      }, {} as Record<string, DomainStats>);

      const sortedDomainStats = Object.values(domainData)
        .sort((a, b) => b.request_count - a.request_count)
        .slice(0, 20);

      setDomainStats(sortedDomainStats);

      // Calculate hourly distribution for last 24h
      const hourlyData: Record<string, number> = {};
      for (let i = 23; i >= 0; i--) {
        const hour = subHours(now, i);
        const hourKey = format(hour, "HH:00");
        hourlyData[hourKey] = 0;
      }

      sessions24h.forEach(s => {
        const hourKey = format(new Date(s.created_at), "HH:00");
        if (hourlyData[hourKey] !== undefined) {
          hourlyData[hourKey]++;
        }
      });

      setHourlyStats(Object.entries(hourlyData).map(([hour, count]) => ({ hour, count })));

      // Fetch fraud alerts (similarity flags)
      const { data: flagsData } = await supabase
        .from("review_similarity_flags")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(50);

      setFraudAlerts(flagsData || []);

    } catch (error) {
      console.error("Error fetching analytics:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
    // Refresh every 5 minutes
    const interval = setInterval(fetchAnalytics, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <Shield className="h-6 w-6" />
            Spam Analytics
          </h1>
          <p className="text-muted-foreground">
            Monitor verification patterns and detect suspicious activity
          </p>
        </div>
        <Button variant="outline" onClick={fetchAnalytics} disabled={isLoading}>
          <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      {/* Overview Stats */}
      {overview && (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Verifications (24h)
              </CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{overview.totalVerifications24h}</div>
              <p className="text-xs text-muted-foreground">
                {overview.totalVerifications7d} in last 7 days
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Unique IPs (24h)
              </CardTitle>
              <Globe className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{overview.uniqueIPs24h}</div>
              <p className="text-xs text-muted-foreground">
                Distinct locations
              </p>
            </CardContent>
          </Card>

          <Card className={overview.suspiciousIPs > 0 ? "border-amber-200 bg-amber-50/50" : ""}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className={`text-sm font-medium ${overview.suspiciousIPs > 0 ? 'text-amber-800' : 'text-muted-foreground'}`}>
                Suspicious IPs
              </CardTitle>
              <AlertTriangle className={`h-4 w-4 ${overview.suspiciousIPs > 0 ? 'text-amber-600' : 'text-muted-foreground'}`} />
            </CardHeader>
            <CardContent>
              <div className={`text-2xl font-bold ${overview.suspiciousIPs > 0 ? 'text-amber-600' : ''}`}>
                {overview.suspiciousIPs}
              </div>
              <p className="text-xs text-muted-foreground">
                5+ requests in 24h
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Conversion Rate
              </CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{overview.reviewSubmissionRate.toFixed(1)}%</div>
              <p className="text-xs text-muted-foreground">
                Verified → Submitted
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Hourly Activity */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Hourly Activity (Last 24h)
          </CardTitle>
          <CardDescription>
            Verification requests by hour - look for unusual spikes
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-end gap-1 h-32">
            {hourlyStats.map((stat) => {
              const maxCount = Math.max(...hourlyStats.map(s => s.count), 1);
              const heightPercent = (stat.count / maxCount) * 100;
              const isHigh = stat.count > 5;
              return (
                <div
                  key={stat.hour}
                  className="flex-1 flex flex-col items-center gap-1"
                  title={`${stat.hour}: ${stat.count} requests`}
                >
                  <div
                    className={`w-full rounded-t ${isHigh ? 'bg-amber-500' : 'bg-primary'} transition-all`}
                    style={{ height: `${Math.max(heightPercent, 2)}%` }}
                  />
                  <span className="text-[10px] text-muted-foreground -rotate-45 origin-center">
                    {stat.hour.slice(0, 2)}
                  </span>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* IP Activity */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Globe className="h-5 w-5" />
              Top IPs by Request Volume
            </CardTitle>
            <CardDescription>
              IPs with high request counts may indicate abuse
            </CardDescription>
          </CardHeader>
          <CardContent>
            {ipStats.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">
                No verification data available
              </p>
            ) : (
              <div className="space-y-3">
                {ipStats.slice(0, 10).map((ip) => (
                  <div 
                    key={ip.request_ip} 
                    className={`flex items-center justify-between p-2 rounded-lg ${
                      ip.request_count > 5 ? 'bg-amber-50 border border-amber-200' : 'bg-muted/50'
                    }`}
                  >
                    <div className="flex-1 min-w-0">
                      <p className="font-mono text-sm truncate">
                        {ip.request_ip === "unknown" ? "(No IP recorded)" : ip.request_ip}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {ip.companies_targeted} {ip.companies_targeted === 1 ? 'company' : 'companies'} • 
                        Last: {format(new Date(ip.last_seen), "MMM d, HH:mm")}
                      </p>
                    </div>
                    <div className={`text-lg font-bold ${ip.request_count > 5 ? 'text-amber-600' : ''}`}>
                      {ip.request_count}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Domain Activity */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building2 className="h-5 w-5" />
              Top Domains by Request Volume
            </CardTitle>
            <CardDescription>
              Email domains with the most verification attempts
            </CardDescription>
          </CardHeader>
          <CardContent>
            {domainStats.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">
                No verification data available
              </p>
            ) : (
              <div className="space-y-3">
                {domainStats.slice(0, 10).map((domain) => (
                  <div 
                    key={domain.email_domain} 
                    className="flex items-center justify-between p-2 rounded-lg bg-muted/50"
                  >
                    <div className="flex-1 min-w-0">
                      <p className="font-mono text-sm truncate">
                        @{domain.email_domain}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {domain.verified_count} verified • {domain.review_submitted_count} submitted
                      </p>
                    </div>
                    <div className="text-lg font-bold">
                      {domain.request_count}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Fraud Alerts */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Fingerprint className="h-5 w-5" />
            Fraud Alerts
            {fraudAlerts.length > 0 && (
              <Badge variant="destructive" className="ml-2">{fraudAlerts.length}</Badge>
            )}
          </CardTitle>
          <CardDescription>
            Automated similarity detection flags — IP clustering, referrer velocity, and text similarity
          </CardDescription>
        </CardHeader>
        <CardContent>
          {fraudAlerts.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">
              No fraud alerts detected
            </p>
          ) : (
            <div className="space-y-3">
              {fraudAlerts.map((flag) => {
                const details = (flag.details || {}) as Record<string, unknown>;
                const iconMap: Record<string, typeof Fingerprint> = {
                  ip_cluster: Globe,
                  referrer_velocity: Zap,
                  text_similarity: FileText,
                };
                const Icon = iconMap[flag.flag_type] || AlertTriangle;
                const labelMap: Record<string, string> = {
                  ip_cluster: "IP Cluster",
                  referrer_velocity: "Referrer Velocity",
                  text_similarity: "Text Similarity",
                };

                return (
                  <div
                    key={flag.id}
                    className="flex items-start gap-3 p-3 rounded-lg border border-destructive/30 bg-destructive/5"
                  >
                    <Icon className="h-5 w-5 text-destructive mt-0.5 shrink-0" />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <Badge variant="outline" className="text-destructive border-destructive/30">
                          {labelMap[flag.flag_type] || flag.flag_type}
                        </Badge>
                        <span className="text-xs text-muted-foreground">
                          {format(new Date(flag.created_at), "MMM d, HH:mm")}
                        </span>
                      </div>
                      <p className="text-sm mt-1 font-mono truncate">
                        Review: {flag.review_id.slice(0, 8)}…
                        {flag.matched_review_id && (
                          <span className="text-muted-foreground"> → matched {flag.matched_review_id.slice(0, 8)}…</span>
                        )}
                      </p>
                      {flag.flag_type === "text_similarity" && Array.isArray((details as any)?.shared_phrases) && (
                        <p className="text-xs text-muted-foreground mt-1">
                          Shared phrases: "{((details as any).shared_phrases as string[]).slice(0, 3).join('", "')}"
                          {(details as any).shared_count > 3 && ` +${(details as any).shared_count - 3} more`}
                        </p>
                      )}
                      {flag.flag_type === "ip_cluster" && (
                        <p className="text-xs text-muted-foreground mt-1">
                          {String((details as any)?.companies_count || 0)} companies from same IP in 7 days
                        </p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default SpamAnalytics;