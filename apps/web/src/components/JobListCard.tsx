"use client";

import { useState, useRef } from "react";
import { MapPin, Building2 } from "lucide-react";
import Link from 'next/link';
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { formatDistanceToNow } from "date-fns";

interface JobListCardProps {
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
  description?: string | null;
  department?: string | null;
  experienceLevel?: string | null;
  sourceType: string;
  sourceUrl?: string | null;
  createdAt: string;
  expiresAt?: string | null;
  onClick?: () => void;
}

type EntryDirection = "top" | "right" | "bottom" | "left" | null;

const getClipPath = (direction: EntryDirection, isHovered: boolean): string => {
  if (!isHovered) {
    switch (direction) {
      case "top": return "inset(0 0 100% 0)";
      case "right": return "inset(0 0 0 100%)";
      case "bottom": return "inset(100% 0 0 0)";
      case "left": return "inset(0 100% 0 0)";
      default: return "inset(0 100% 100% 0)";
    }
  }
  return "inset(0 0 0 0)";
};

const JobListCard = ({
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
  description,
  sourceType,
  sourceUrl,
  createdAt,
  onClick,
}: JobListCardProps) => {
  const [isHovered, setIsHovered] = useState(false);
  const [entryDirection, setEntryDirection] = useState<EntryDirection>(null);
  const cardRef = useRef<HTMLDivElement>(null);

  const postedAgo = formatDistanceToNow(new Date(createdAt), { addSuffix: true });

  const formatSalary = (amount: number) =>
    new Intl.NumberFormat("en", { maximumFractionDigits: 0 }).format(amount);

  const hasSalary = salaryMin || salaryMax;
  const currency = salaryCurrency || "BWP";

  const salaryText = hasSalary
    ? salaryMin && salaryMax
      ? `${currency} ${formatSalary(salaryMin)} – ${formatSalary(salaryMax)}`
      : salaryMin
      ? `From ${currency} ${formatSalary(salaryMin)}`
      : `Up to ${currency} ${formatSalary(salaryMax!)}`
    : null;


  const snippet = description
    ? description.length > 160
      ? description.slice(0, 160).trimEnd() + "…"
      : description
    : null;

  const handleMouseEnter = (e: React.MouseEvent) => {
    if (!cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const distTop = y;
    const distBottom = rect.height - y;
    const distLeft = x;
    const distRight = rect.width - x;
    const min = Math.min(distTop, distBottom, distLeft, distRight);
    if (min === distTop) setEntryDirection("top");
    else if (min === distRight) setEntryDirection("right");
    else if (min === distBottom) setEntryDirection("bottom");
    else setEntryDirection("left");
    setIsHovered(true);
  };

  const handleMouseLeave = () => {
    setIsHovered(false);
  };

  return (
    <Link href={`/jobs/${id}`} className="block">
    <Card
      ref={cardRef}
      className="group relative border border-black/5 shadow-sm overflow-hidden"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {/* Trace border overlay */}
      <div
        className="absolute inset-0 pointer-events-none border border-black rounded-lg"
        style={{
          clipPath: getClipPath(entryDirection, isHovered),
          transition: "clip-path 0.2s ease-out",
        }}
      />

      <CardContent className="p-6">
        <div className="flex gap-4">
          {/* Logo */}
          <div className="hidden sm:flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-muted">
            {companyLogo ? (
              <img
                src={companyLogo}
                alt={companyName}
                className="h-full w-full rounded-lg object-contain"
              />
            ) : (
              <Building2 className="h-5 w-5 text-muted-foreground" />
            )}
          </div>

          <div className="min-w-0 flex-1">
            <div className="flex items-start justify-between gap-2">
              <div>
                <span className="font-medium text-foreground">
                  {title}
                </span>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className="text-sm text-muted-foreground">{companyName}</span>
                </div>
              </div>
              <span className="text-xs text-black/60 whitespace-nowrap">{postedAgo}</span>
            </div>

            {snippet && (
              <p className="mt-2 text-sm text-black/70 line-clamp-2">{snippet}</p>
            )}

            <div className="mt-3 flex flex-wrap items-center gap-2">
              <Badge variant="secondary" className="text-xs px-2 py-0.5 font-normal">
                {jobType}
              </Badge>
              {isRemote && (
                <Badge variant="outline" className="text-xs px-2 py-0.5 font-normal">
                  Remote
                </Badge>
              )}
              {location && (
                <span className="flex items-center gap-1 text-xs text-black/70">
                  <MapPin className="h-3 w-3" /> {location}
                </span>
              )}
              {salaryText && (
                <span className="text-xs font-medium text-foreground">{salaryText}</span>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
    </Link>
  );
};

export default JobListCard;
