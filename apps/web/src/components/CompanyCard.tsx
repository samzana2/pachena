"use client";

import { useState, useRef } from "react";
import Link from 'next/link';
import { Card, CardContent } from "@/components/ui/card";
import StarRating from "@/components/StarRating";

export interface Company {
  id: string;
  name: string;
  logo?: string;
  industry: string;
  location: string;
  employeeCount: string;
  rating: number;
  reviewCount: number;
  salaryCount: number;
  interviewCount: number;
  description: string;
}

interface CompanyCardProps {
  company: Company;
}

type EntryDirection = "top" | "right" | "bottom" | "left" | null;

const getClipPath = (direction: EntryDirection, isHovered: boolean): string => {
  if (!isHovered) {
    // Starting position based on entry direction
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

const CompanyCard = ({ company }: CompanyCardProps) => {
  const [isHovered, setIsHovered] = useState(false);
  const [entryDirection, setEntryDirection] = useState<EntryDirection>(null);
  const cardRef = useRef<HTMLDivElement>(null);

  const handleMouseEnter = (e: React.MouseEvent) => {
    if (!cardRef.current) return;
    
    const rect = cardRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    // Calculate which edge is closest
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
    <Link
      href={`/company/${company.id}`}
      className="block focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
    >
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
            {/* Hide logo on mobile to save space */}
            <div className="hidden sm:flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-muted">
              {company.logo ? (
                <img
                  src={company.logo}
                  alt={company.name}
                  className="h-full w-full rounded-lg object-cover"
                />
              ) : (
                <span className="text-lg font-bold text-black/40">
                  {company.name.charAt(0)}
                </span>
              )}
            </div>

            <div className="min-w-0 flex-1">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <h3 className="font-medium text-black">
                    {company.name}
                  </h3>
                  <p className="text-sm text-black/60">
                    {company.employeeCount} Employees
                  </p>
                </div>
                <StarRating rating={company.rating} size="sm" />
              </div>

              <p className="mt-2 line-clamp-2 text-sm text-black/70">
                {company.description}
              </p>

              {/* Stack stats on mobile, inline on larger screens */}
              <div className="mt-3 flex flex-col gap-1 text-sm sm:flex-row sm:items-center sm:gap-4">
                <span className="font-medium text-black">
                  {company.rating.toFixed(1)}{" "}
                  <span className="font-normal text-black/60">Rating</span>
                </span>
                <span className="font-medium text-black">
                  {company.reviewCount >= 5 ? `${company.reviewCount} ` : ""}
                  <span className="font-normal text-black/60">Reviews</span>
                </span>
                <span className="font-medium text-black">
                  {company.salaryCount >= 5 ? `${company.salaryCount} ` : ""}
                  <span className="font-normal text-black/60">Pay & Benefits</span>
                </span>
                <span className="font-medium text-black">
                  {company.interviewCount >= 5 ? `${company.interviewCount} ` : ""}
                  <span className="font-normal text-black/60">Interview Insights</span>
                </span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
};

export default CompanyCard;