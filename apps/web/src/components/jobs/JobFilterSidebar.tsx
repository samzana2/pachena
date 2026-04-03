"use client";

import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { X, Check, ChevronsUpDown } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { cn } from "@/lib/utils";
import { LINKEDIN_INDUSTRIES } from "@/lib/industries";

export interface JobFilters {
  location: string;
  types: string[];
  experienceLevels: string[];
  industry: string;
  workArrangement: string;
}

interface JobFilterSidebarProps {
  filters: JobFilters;
  locations: string[];
  jobTypeCounts?: Record<string, number>;
  experienceLevelCounts?: Record<string, number>;
  onFilterChange: (filters: JobFilters) => void;
  onClearFilters: () => void;
  activeFilterCount: number;
  embedded?: boolean;
}

const JOB_TYPES = [
  { value: "full-time", label: "Full-time" },
  { value: "part-time", label: "Part-time" },
  { value: "contract", label: "Contract" },
  { value: "internship", label: "Internship" },
];

const EXPERIENCE_LEVELS = [
  { value: "entry", label: "Entry Level" },
  { value: "mid", label: "Mid Level" },
  { value: "senior", label: "Senior Level" },
  { value: "lead", label: "Lead / Manager" },
  { value: "executive", label: "Executive" },
];

const JobFilterSidebar = ({
  filters,
  locations,
  onFilterChange,
  onClearFilters,
  activeFilterCount,
  embedded = false,
}: JobFilterSidebarProps) => {
  const [industryOpen, setIndustryOpen] = useState(false);

  const filterContent = (
    <div className={embedded ? "space-y-3" : "space-y-5"}>
          {/* Industry */}
          <div>
            <Label className="text-sm font-medium text-black">Industry</Label>
            <Popover open={industryOpen} onOpenChange={setIndustryOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  role="combobox"
                  aria-expanded={industryOpen}
                  className="w-full justify-between mt-1.5 font-normal"
                  noTrace
                >
                  {filters.industry || "All Industries"}
                  <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-[--radix-popover-trigger-width] p-0 z-50 bg-popover" align="start">
                <Command>
                  <CommandInput placeholder="Search industry..." />
                  <CommandList>
                    <CommandEmpty>No industry found.</CommandEmpty>
                    <CommandGroup>
                      <CommandItem
                        value=""
                        onSelect={() => {
                          onFilterChange({ ...filters, industry: "" });
                          setIndustryOpen(false);
                        }}
                      >
                        <Check className={cn("mr-2 h-4 w-4", !filters.industry ? "opacity-100" : "opacity-0")} />
                        All Industries
                      </CommandItem>
                      {LINKEDIN_INDUSTRIES.map((ind) => (
                        <CommandItem
                          key={ind}
                          value={ind}
                          onSelect={(currentValue) => {
                            const original = LINKEDIN_INDUSTRIES.find(
                              (i) => i.toLowerCase() === currentValue.toLowerCase()
                            );
                            onFilterChange({ ...filters, industry: original || currentValue });
                            setIndustryOpen(false);
                          }}
                        >
                          <Check className={cn("mr-2 h-4 w-4", filters.industry === ind ? "opacity-100" : "opacity-0")} />
                          {ind}
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  </CommandList>
                </Command>
              </PopoverContent>
            </Popover>
          </div>

          {/* Job Type */}
          <div>
            <Label className="text-sm font-medium text-black">Job Type</Label>
            <Select
              value={filters.types.length === 1 ? filters.types[0] : "all"}
              onValueChange={(v) => onFilterChange({ ...filters, types: v === "all" ? [] : [v] })}
            >
              <SelectTrigger className="mt-1.5">
                <SelectValue placeholder="All Types" />
              </SelectTrigger>
              <SelectContent className="bg-popover z-50">
                <SelectItem value="all">All Types</SelectItem>
                {JOB_TYPES.map((type) => (
                  <SelectItem key={type.value} value={type.value}>{type.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Experience Level */}
          <div>
            <Label className="text-sm font-medium text-black">Experience Level</Label>
            <Select
              value={filters.experienceLevels.length === 1 ? filters.experienceLevels[0] : "all"}
              onValueChange={(v) => onFilterChange({ ...filters, experienceLevels: v === "all" ? [] : [v] })}
            >
              <SelectTrigger className="mt-1.5">
                <SelectValue placeholder="All Levels" />
              </SelectTrigger>
              <SelectContent className="bg-popover z-50">
                <SelectItem value="all">All Levels</SelectItem>
                {EXPERIENCE_LEVELS.map((level) => (
                  <SelectItem key={level.value} value={level.value}>{level.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Work Arrangement */}
          <div>
            <Label className="text-sm font-medium text-black">Type</Label>
            <Select
              value={filters.workArrangement || "all"}
              onValueChange={(v) => onFilterChange({ ...filters, workArrangement: v === "all" ? "" : v })}
            >
              <SelectTrigger className="mt-1.5">
                <SelectValue placeholder="All Arrangements" />
              </SelectTrigger>
              <SelectContent className="bg-popover z-50">
                <SelectItem value="all">All</SelectItem>
                <SelectItem value="remote">Remote</SelectItem>
                <SelectItem value="on-site">On-site</SelectItem>
                <SelectItem value="hybrid">Hybrid</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Location */}
          <div>
            <Label className="text-sm font-medium text-black">Location</Label>
            <Select
              value={filters.location || "all"}
              onValueChange={(v) => onFilterChange({ ...filters, location: v === "all" ? "" : v })}
            >
              <SelectTrigger className="mt-1.5">
                <SelectValue placeholder="All Locations" />
              </SelectTrigger>
              <SelectContent className="bg-popover z-50">
                <SelectItem value="all">All Locations</SelectItem>
                {locations.map((loc) => (
                  <SelectItem key={loc} value={loc}>{loc}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
      </div>
    );

  if (embedded) return filterContent;

  return (
    <Card className="border border-black/5 shadow-sm">
      <CardContent className="p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-medium text-black">Filter Jobs</h2>
          {activeFilterCount > 0 && (
            <Button variant="ghost" size="sm" onClick={onClearFilters} className="h-8 px-2 text-xs">
              <X className="h-3 w-3 mr-1" />
              Clear
            </Button>
          )}
        </div>
        {filterContent}
      </CardContent>
    </Card>
  );
};

export default JobFilterSidebar;
