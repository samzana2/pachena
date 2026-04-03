"use client";

import { useRef, useState, useEffect } from "react";
import Link from 'next/link';
import { Building2, ExternalLink, Briefcase, MapPin, Clock, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatDistanceToNow } from "date-fns";
import { createBrowserSupabaseClient } from "@/lib/supabase/client";
import StarRating from "@/components/StarRating";
import type { JobListItem } from "./JobListPanel";
const supabase = createBrowserSupabaseClient();

interface JobDetailPanelProps {
  job: JobListItem;
}

const formatSalary = (amount: number) =>
  new Intl.NumberFormat("en", { maximumFractionDigits: 0 }).format(amount);

const JobDetailPanel = ({ job }: JobDetailPanelProps) => {
  const currency = job.salary_currency || "BWP";
  const hasSalary = job.salary_min || job.salary_max;
  const salaryText = hasSalary
    ? job.salary_min && job.salary_max
      ? `${currency} ${formatSalary(job.salary_min)} – ${formatSalary(job.salary_max)}`
      : job.salary_min
      ? `From ${currency} ${formatSalary(job.salary_min)}`
      : `Up to ${currency} ${formatSalary(job.salary_max!)}`
    : null;

  const applyUrl =
    job.source_type === "seeded" && job.source_url
      ? job.source_url
      : `/company/${job.companies.slug}/jobs`;
  const isExternal = job.source_type === "seeded" && job.source_url;

  const company = job.companies;

  const scrollRef = useRef<HTMLDivElement>(null);
  const sentinelRef = useRef<HTMLDivElement>(null);
  const [showSticky, setShowSticky] = useState(false);
  const [avgRating, setAvgRating] = useState(0);
  const [recommendPercent, setRecommendPercent] = useState(0);
  const [reviewCount, setReviewCount] = useState(0);

  useEffect(() => {
    const fetchStats = async () => {
      const { data: companyRow } = await supabase
        .from("companies")
        .select("id")
        .eq("slug", job.companies.slug)
        .single();
      
      if (!companyRow) return;

      const { data: reviews } = await supabase
        .from("reviews_public")
        .select("rating, recommend_to_friend")
        .eq("company_id", companyRow.id);

      if (reviews && reviews.length > 0) {
        const avg = reviews.reduce((sum, r) => sum + Number(r.rating), 0) / reviews.length;
        const recPct = Math.round((reviews.filter(r => r.recommend_to_friend).length / reviews.length) * 100);
        setAvgRating(avg);
        setRecommendPercent(recPct);
        setReviewCount(reviews.length);
      }
    };
    fetchStats();
  }, [job.companies.slug]);

  useEffect(() => {
    const sentinel = sentinelRef.current;
    const scrollContainer = scrollRef.current;
    if (!sentinel || !scrollContainer) return;

    const observer = new IntersectionObserver(
      ([entry]) => setShowSticky(!entry.isIntersecting),
      { root: scrollContainer, threshold: 0 }
    );
    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [job.id]);

  const applyButton = isExternal ? (
    <a href={applyUrl} target="_blank" rel="noopener noreferrer">
      <Button size="sm" className="gap-2 w-full sm:w-auto shrink-0 bg-foreground text-background hover:bg-foreground/90">
        Apply Now <ExternalLink className="h-4 w-4" />
      </Button>
    </a>
  ) : (
    <Link href={applyUrl}>
      <Button size="sm" className="w-full sm:w-auto shrink-0 bg-foreground text-background hover:bg-foreground/90">
        Apply Now
      </Button>
    </Link>
  );

  const postedAgo = formatDistanceToNow(new Date(job.created_at), { addSuffix: true });

  return (
    <div ref={scrollRef} className="h-full overflow-y-auto relative">
      {/* Sticky bar */}
      {showSticky && (
        <div className="sticky top-0 z-10 bg-background border-b border-border px-6 py-3 flex items-center justify-between">
          <div className="min-w-0">
            <p className="text-sm font-medium text-foreground truncate">{job.title}</p>
            <p className="text-xs text-muted-foreground truncate">{company.name}</p>
          </div>
          {applyButton}
        </div>
      )}

      <div className="p-6 space-y-6">
        {/* Job Header Card */}
        <Card className="border border-black/5 shadow-sm">
          <CardContent className="p-6">
            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
              <div className="space-y-2">
                <h2 className="text-lg font-medium text-foreground">{job.title}</h2>
                <Link 
                  href={`/company/${company.slug}`} 
                  className="text-sm text-muted-foreground hover:text-foreground transition-colors inline-flex items-center gap-1"
                >
                  {company.name}
                  <ChevronRight className="h-3 w-3" />
                </Link>
              </div>
              {applyButton}
            </div>

            <div className="mt-4 flex flex-wrap gap-2">
              <Badge variant="outline" className="text-xs font-normal gap-1.5">
                <Briefcase className="h-3 w-3" />
                {job.job_type}
              </Badge>
              {job.is_remote && (
                <Badge variant="outline" className="text-xs font-normal">
                  Remote
                </Badge>
              )}
              {job.location && (
                <Badge variant="outline" className="text-xs font-normal gap-1.5">
                  <MapPin className="h-3 w-3" />
                  {job.location}
                </Badge>
              )}
              {job.experience_level && (
                <Badge variant="outline" className="text-xs font-normal">
                  {job.experience_level}
                </Badge>
              )}
              {job.department && (
                <Badge variant="outline" className="text-xs font-normal">
                  {job.department}
                </Badge>
              )}
            </div>

            <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm">
              {salaryText && (
                <span className="font-medium text-foreground">{salaryText}</span>
              )}
              <span className="flex items-center gap-1.5 text-muted-foreground">
                <Clock className="h-3.5 w-3.5" />
                Posted {postedAgo}
              </span>
            </div>
          </CardContent>
        </Card>

        {/* Sentinel for sticky bar */}
        <div ref={sentinelRef} className="h-0" />

        {/* Company Snapshot */}
        <Card className="border border-black/5 shadow-sm">
          <CardContent className="p-6">
            <h2 className="text-lg font-medium text-foreground">{company.name} Snapshot</h2>

            {reviewCount > 0 && (
              <>
                <div className="mt-4 flex items-baseline gap-2">
                  <span className="text-3xl font-bold text-foreground">
                    {avgRating.toFixed(1)}
                  </span>
                  <StarRating rating={avgRating} size="sm" />
                </div>
                <p className="mt-2 text-sm text-muted-foreground">
                  {recommendPercent}% would recommend working at {company.name} to a friend.
                </p>
              </>
            )}

            <div className="mt-6 grid gap-4 md:grid-cols-2">
              <div className="space-y-3">
                <p className="text-sm text-foreground">
                  <span className="font-medium">Number of Employees:</span>{" "}
                  <span className="text-muted-foreground">{company.employee_count || "Unknown"}</span>
                </p>
                <p className="text-sm text-foreground">
                  <span className="font-medium">Headquarters:</span>{" "}
                  <span className="text-muted-foreground">{company.headquarters || company.location || "Unknown"}</span>
                </p>
                <p className="text-sm text-foreground">
                  <span className="font-medium">Industry:</span>{" "}
                  <span className="text-muted-foreground">{company.industry || "Unknown"}</span>
                </p>
                <p className="text-sm text-foreground">
                  <span className="font-medium">Year Founded:</span>{" "}
                  <span className="text-muted-foreground">{company.year_founded || "Unknown"}</span>
                </p>
                {company.ceo && (
                  <p className="text-sm text-foreground">
                    <span className="font-medium">CEO:</span>{" "}
                    <span className="text-muted-foreground">{company.ceo}</span>
                  </p>
                )}
                {company.website && (
                  <p className="text-sm text-foreground">
                    <span className="font-medium">Website:</span>{" "}
                    <a 
                      href={company.website.startsWith("http") ? company.website : `https://${company.website}`} 
                      target="_blank" 
                      rel="noopener noreferrer" 
                      className="text-muted-foreground hover:underline"
                    >
                      {company.website.replace(/^https?:\/\//, "")}
                    </a>
                  </p>
                )}
              </div>
              {company.description && (
                <div>
                  <p className="text-sm font-medium text-foreground">About:</p>
                  <p className="mt-1 text-sm text-muted-foreground">{company.description}</p>
                </div>
              )}
            </div>

            {/* Link to full profile */}
            <div className="mt-6 pt-4 border-t border-border">
              <Link 
                href={`/company/${company.slug}`}
                className="text-sm text-muted-foreground hover:text-foreground transition-colors inline-flex items-center gap-1"
              >
                View full company profile
                <ChevronRight className="h-3.5 w-3.5" />
              </Link>
            </div>
          </CardContent>
        </Card>

        {/* Job Description */}
        <Card className="border border-black/5 shadow-sm">
          <CardContent className="p-6">
            <h2 className="text-lg font-medium text-foreground mb-4">Job Description</h2>
            {job.description ? (
              <div className="prose prose-sm max-w-none text-muted-foreground whitespace-pre-line">{job.description}</div>
            ) : (
              <p className="text-sm text-muted-foreground">No description available.</p>
            )}
          </CardContent>
        </Card>

        {/* Bottom Apply CTA */}
        <Card className="border border-black/5 shadow-sm bg-secondary/30">
          <CardContent className="p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div>
              <p className="text-sm font-medium text-foreground">Interested in this role?</p>
              <p className="text-xs text-muted-foreground">Apply now to join {company.name}.</p>
            </div>
            {applyButton}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default JobDetailPanel;
