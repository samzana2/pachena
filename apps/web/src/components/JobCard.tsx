import { MapPin, Clock, Banknote, ExternalLink } from "lucide-react";
import Link from 'next/link';
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import heroLogo from "@/assets/hero-logo.png";
import { formatDistanceToNow, differenceInDays } from "date-fns";

interface JobCardProps {
  id: string;
  title: string;
  companyName: string;
  companyLogo?: string | null;
  companySlug?: string;
  location?: string | null;
  jobType: string;
  isRemote?: boolean | null;
  salaryMin?: number | null;
  salaryMax?: number | null;
  salaryCurrency?: string | null;
  sourceType: string;
  sourceUrl?: string | null;
  createdAt: string;
  expiresAt?: string | null;
}

const JobCard = ({
  id,
  title,
  companyName,
  companyLogo,
  companySlug,
  location,
  jobType,
  isRemote,
  salaryMin,
  salaryMax,
  salaryCurrency,
  sourceType,
  sourceUrl,
  createdAt,
  expiresAt,
}: JobCardProps) => {
  const postedAgo = formatDistanceToNow(new Date(createdAt), { addSuffix: true });
  const daysLeft = expiresAt ? differenceInDays(new Date(expiresAt), new Date()) : null;

  const formatSalary = (amount: number) => {
    return new Intl.NumberFormat("en", { maximumFractionDigits: 0 }).format(amount);
  };

  const hasSalary = salaryMin || salaryMax;
  const currency = salaryCurrency || "BWP";

  return (
    <Card className="group relative overflow-hidden transition-shadow hover:shadow-md border-border">
      {/* Company header */}
      <div className="flex items-center gap-3 p-5 pb-3">
        {companyLogo ? (
          <img
            src={companyLogo}
            alt={companyName}
            className="h-10 w-10 rounded-lg object-contain border border-border bg-muted"
          />
        ) : (
          <div className="h-10 w-10 rounded-lg bg-muted flex items-center justify-center">
            <span className="text-sm font-semibold text-muted-foreground">
              {companyName.charAt(0)}
            </span>
          </div>
        )}
        <div className="min-w-0 flex-1">
          {companySlug ? (
            <Link
              href={`/company/${companySlug}`}
              className="text-sm font-medium text-foreground hover:underline truncate block"
            >
              {companyName}
            </Link>
          ) : (
            <span className="text-sm font-medium text-foreground truncate block">
              {companyName}
            </span>
          )}
        </div>
      </div>

      <div className="border-t border-border mx-5" />

      {/* Job details */}
      <div className="px-5 pt-3 pb-4 space-y-2.5">
        <h3 className="text-base font-semibold text-foreground leading-tight line-clamp-2">
          {title}
        </h3>

        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-muted-foreground">
          {location && (
            <span className="flex items-center gap-1">
              <MapPin className="h-3.5 w-3.5" />
              {location}
            </span>
          )}
          <span className="flex items-center gap-1">
            <Clock className="h-3.5 w-3.5" />
            {jobType}
          </span>
          {isRemote && (
            <Badge variant="secondary" className="text-xs px-1.5 py-0">
              Remote
            </Badge>
          )}
        </div>

        {hasSalary && (
          <div className="flex items-center gap-1 text-sm font-medium text-foreground">
            <Banknote className="h-3.5 w-3.5 text-muted-foreground" />
            {salaryMin && salaryMax
              ? `${currency} ${formatSalary(salaryMin)} – ${formatSalary(salaryMax)}`
              : salaryMin
              ? `From ${currency} ${formatSalary(salaryMin)}`
              : `Up to ${currency} ${formatSalary(salaryMax!)}`}
          </div>
        )}

        {/* Freshness */}
        <p className="text-xs text-muted-foreground">
          Posted {postedAgo}
          {daysLeft !== null && daysLeft >= 0 && (
            <span className={daysLeft <= 7 ? "text-destructive font-medium" : ""}>
              {" "}· Expires in {daysLeft}d
            </span>
          )}
        </p>
      </div>

      {/* Footer */}
      <div className="border-t border-border px-5 py-3 flex items-center justify-between">
        {sourceType === "seeded" && sourceUrl ? (
          <a href={sourceUrl} target="_blank" rel="noopener noreferrer">
            <Button size="sm" className="bg-[hsl(var(--brand))] hover:bg-[hsl(var(--brand))]/90 text-[hsl(var(--brand-foreground))] gap-1.5">
              Apply at source
              <ExternalLink className="h-3.5 w-3.5" />
            </Button>
          </a>
        ) : (
          <Link href={`/company/${companySlug}/jobs`}>
            <Button size="sm" className="bg-[hsl(var(--brand))] hover:bg-[hsl(var(--brand))]/90 text-[hsl(var(--brand-foreground))]">
              Apply on Pachena
            </Button>
          </Link>
        )}

        <img src={(heroLogo as unknown as { src: string }).src} alt="Pachena" className="h-5 opacity-40 group-hover:opacity-60 transition-opacity" />
      </div>
    </Card>
  );
};

export default JobCard;
