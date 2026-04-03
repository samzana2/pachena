"use client";

import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
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

import { LINKEDIN_INDUSTRIES as INDUSTRIES } from "@/lib/industries";

interface FilterSidebarProps {
  filters: {
    industry: string;
    location: string;
    rating: string;
    size: string;
    companyName?: string;
  };
  onFilterChange: (key: string, value: string) => void;
  onClearFilters?: () => void;
  activeFilterCount?: number;
  onSearch?: () => void;
  showSearchButton?: boolean;
  showCompanySearch?: boolean;
}

const FilterSidebar = ({ filters, onFilterChange, onClearFilters, activeFilterCount = 0, onSearch, showSearchButton = false, showCompanySearch = false }: FilterSidebarProps) => {
  const [industryOpen, setIndustryOpen] = useState(false);

  return (
    <Card className="border border-black/5 shadow-sm">
      <CardContent className="p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-medium text-black">
            Filter Companies
          </h2>
          {activeFilterCount > 0 && onClearFilters && (
            <Button variant="ghost" size="sm" onClick={onClearFilters} className="h-8 px-2 text-xs">
              <X className="h-3 w-3 mr-1" />
              Clear
            </Button>
          )}
        </div>

        <div className="space-y-5">
          {showCompanySearch && (
            <div>
              <Label htmlFor="companyName" className="text-sm font-medium text-black">
                Company Name
              </Label>
              <Input
                id="companyName"
                placeholder="Search companies..."
                value={filters.companyName || ""}
                onChange={(e) => onFilterChange("companyName", e.target.value)}
                className="mt-1.5"
              />
            </div>
          )}

          <div>
            <Label htmlFor="industry" className="text-sm font-medium text-black">
              Industry
            </Label>
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
                  <CommandInput 
                    placeholder="Search industry..." 
                    onValueChange={(value) => {
                      onFilterChange("industry", value);
                    }}
                  />
                  <CommandList>
                    <CommandEmpty>
                      <span className="text-black/60">
                        Press enter to use "{filters.industry}"
                      </span>
                    </CommandEmpty>
                    <CommandGroup>
                      <CommandItem
                        value=""
                        onSelect={() => {
                          onFilterChange("industry", "");
                          setIndustryOpen(false);
                        }}
                      >
                        <Check
                          className={cn(
                            "mr-2 h-4 w-4",
                            !filters.industry ? "opacity-100" : "opacity-0"
                          )}
                        />
                        All Industries
                      </CommandItem>
                      {INDUSTRIES.map((industry) => (
                        <CommandItem
                          key={industry}
                          value={industry}
                          onSelect={(currentValue) => {
                            const originalIndustry = INDUSTRIES.find(
                              (ind) => ind.toLowerCase() === currentValue.toLowerCase()
                            );
                            onFilterChange("industry", originalIndustry || currentValue);
                            setIndustryOpen(false);
                          }}
                        >
                          <Check
                            className={cn(
                              "mr-2 h-4 w-4",
                              filters.industry.toLowerCase() === industry.toLowerCase()
                                ? "opacity-100"
                                : "opacity-0"
                            )}
                          />
                          {industry}
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  </CommandList>
                </Command>
              </PopoverContent>
            </Popover>
          </div>

          <div>
            <Label htmlFor="location" className="text-sm font-medium text-black">
              Location
            </Label>
            <Input
              id="location"
              placeholder="Type Location"
              value={filters.location}
              onChange={(e) => onFilterChange("location", e.target.value)}
              className="mt-1.5"
            />
          </div>

          <div>
            <Label htmlFor="rating" className="text-sm font-medium text-black">
              Rating
            </Label>
            <Select
              value={filters.rating}
              onValueChange={(value) => onFilterChange("rating", value)}
            >
              <SelectTrigger id="rating" className="mt-1.5">
                <SelectValue placeholder="All Ratings" />
              </SelectTrigger>
              <SelectContent className="bg-popover z-50">
                <SelectItem value="all">All Ratings</SelectItem>
                <SelectItem value="4">4+ Stars</SelectItem>
                <SelectItem value="3">3+ Stars</SelectItem>
                <SelectItem value="2">2+ Stars</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="size" className="text-sm font-medium text-black">
              Size
            </Label>
            <Select
              value={filters.size}
              onValueChange={(value) => onFilterChange("size", value)}
            >
              <SelectTrigger id="size" className="mt-1.5">
                <SelectValue placeholder="All Sizes" />
              </SelectTrigger>
              <SelectContent className="bg-popover z-50">
                <SelectItem value="all">All Sizes</SelectItem>
                
                <SelectItem value="1_10">1-10 Employees</SelectItem>
                <SelectItem value="11_50">11-50 Employees</SelectItem>
                <SelectItem value="51_200">51-200 Employees</SelectItem>
                <SelectItem value="201_500">201-500 Employees</SelectItem>
                <SelectItem value="501_1000">501-1,000 Employees</SelectItem>
                <SelectItem value="1001_5000">1,001-5,000 Employees</SelectItem>
                <SelectItem value="5001_10000">5,001-10,000 Employees</SelectItem>
                <SelectItem value="10001_plus">10,001+ Employees</SelectItem>

                {/* Legacy values (keep compatibility with existing URLs) */}
                <SelectItem value="500_plus" className="hidden">500+ Employees</SelectItem>
                <SelectItem value="small" className="hidden">1-50 Employees</SelectItem>
                <SelectItem value="medium" className="hidden">51-200 Employees</SelectItem>
                <SelectItem value="large" className="hidden">201-1000 Employees</SelectItem>
                <SelectItem value="enterprise" className="hidden">1000+ Employees</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {showSearchButton && onSearch && (
            <Button className="w-full mt-2 bg-brand text-brand-foreground hover:bg-transparent hover:text-brand border border-brand" onClick={onSearch}>
              Search
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default FilterSidebar;
