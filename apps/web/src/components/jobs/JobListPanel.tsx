"use client";

import { useState, useRef, useCallback } from "react";
import { Building2 } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { cn } from "@/lib/utils";

export interface JobListItem {
  id: string;
  title: string;
  location: string | null;
  job_type: string;
  is_remote: boolean | null;
  salary_min: number | null;
  salary_max: number | null;
  salary_currency: string | null;
  description: string | null;
  department: string | null;
  experience_level: string | null;
  source_type: string;
  source_url: string | null;
  created_at: string;
  expires_at: string | null;
  companies: {
    name: string;
    logo_url: string | null;
    slug: string;
    industry: string | null;
    location: string | null;
    employee_count: string | null;
    headquarters: string | null;
    year_founded: number | null;
    ceo: string | null;
    website: string | null;
    description: string | null;
  };
}

interface JobListPanelProps {
  jobs: JobListItem[];
  selectedId: string | null;
  onSelect: (id: string) => void;
}

const formatSalary = (amount: number) =>
  new Intl.NumberFormat("en", { maximumFractionDigits: 0 }).format(amount);

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

const JobCard = ({
  job,
  isSelected,
  onSelect,
}: {
  job: JobListItem;
  isSelected: boolean;
  onSelect: () => void;
}) => {
  const [isHovered, setIsHovered] = useState(false);
  const [entryDirection, setEntryDirection] = useState<EntryDirection>(null);
  const cardRef = useRef<HTMLButtonElement>(null);

  const handleMouseEnter = useCallback((e: React.MouseEvent) => {
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
  }, []);

  const currency = job.salary_currency || "BWP";
  const hasSalary = job.salary_min || job.salary_max;
  const salaryText = hasSalary
    ? job.salary_min && job.salary_max
      ? `${currency} ${formatSalary(job.salary_min)} – ${formatSalary(job.salary_max)}`
      : job.salary_min
      ? `From ${currency} ${formatSalary(job.salary_min)}`
      : `Up to ${currency} ${formatSalary(job.salary_max!)}`
    : null;

  const snippet = job.description
    ? job.description.length > 250
      ? job.description.slice(0, 250).trimEnd() + "…"
      : job.description
    : null;

  const postedAgo = formatDistanceToNow(new Date(job.created_at), { addSuffix: true });

  return (
    <button
      ref={cardRef}
      onClick={onSelect}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={() => setIsHovered(false)}
      className="relative w-full text-left p-5 overflow-hidden transition-shadow"
      style={{
        boxShadow: isHovered
          ? "0 2px 8px rgba(0,0,0,0.10)"
          : "0 1px 3px rgba(0,0,0,0.06)",
      }}
    >
      {/* Left accent bar for selected state */}
      {isSelected && (
        <div className="absolute left-0 top-0 bottom-0 w-1 bg-black" />
      )}

      {/* Trace border overlay — hover only, not selected */}
      {!isSelected && (
        <div
          className="absolute inset-0 pointer-events-none border border-foreground"
          style={{
            clipPath: getClipPath(entryDirection, isHovered),
            transition: "clip-path 0.2s ease-out",
          }}
        />
      )}

      {/* Company logo + name */}
      <div className="flex items-center gap-2 mb-2">
        <div className="h-7 w-7 shrink-0 rounded-md bg-muted flex items-center justify-center overflow-hidden">
          {job.companies.logo_url ? (
            <img src={job.companies.logo_url} alt="" className="h-full w-full object-contain" />
          ) : (
            <Building2 className="h-3.5 w-3.5 text-muted-foreground" />
          )}
        </div>
        <span className="text-sm text-muted-foreground truncate">{job.companies.name}</span>
      </div>

      {/* Title */}
      <h3 className="font-semibold text-foreground leading-snug">{job.title}</h3>

      {/* Location */}
      {(job.location || job.is_remote) && (
        <p className="text-sm text-muted-foreground mt-1">
          {job.location}{job.is_remote ? (job.location ? " · Remote" : "Remote") : ""}
        </p>
      )}

      {/* Salary */}
      {salaryText && (
        <p className="text-sm font-medium text-foreground mt-1">{salaryText}</p>
      )}

      {/* Description snippet */}
      {snippet && (
        <p className="text-sm text-muted-foreground mt-2 line-clamp-3">{snippet}</p>
      )}

      {/* Posted ago */}
      <p className="text-xs text-muted-foreground mt-2">{postedAgo}</p>
    </button>
  );
};

const JobListPanel = ({ jobs, selectedId, onSelect }: JobListPanelProps) => {
  return (
    <div className="h-full overflow-y-auto border-r border-border">
      {jobs.map((job) => (
        <JobCard
          key={job.id}
          job={job}
          isSelected={selectedId === job.id}
          onSelect={() => onSelect(job.id)}
        />
      ))}
    </div>
  );
};

export default JobListPanel;
