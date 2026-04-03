"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { SlidersHorizontal, X, Check, ChevronsUpDown } from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
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

interface Filters {
  industry: string;
  location: string;
  rating: string;
  size: string;
}

interface MobileFilterSheetProps {
  filters: Filters;
  onFilterChange: (key: string, value: string) => void;
  onClearFilters: () => void;
  activeFilterCount: number;
}

const MobileFilterSheet = ({
  filters,
  onFilterChange,
  onClearFilters,
  activeFilterCount,
}: MobileFilterSheetProps) => {
  const [open, setOpen] = useState(false);
  const [industryOpen, setIndustryOpen] = useState(false);

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button
          variant="outline"
          size="icon"
          className="fixed bottom-6 right-6 h-14 w-14 rounded-full shadow-lg z-40 lg:hidden"
        >
          <SlidersHorizontal className="h-5 w-5" />
          {activeFilterCount > 0 && (
            <span className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-primary text-primary-foreground text-xs flex items-center justify-center">
              {activeFilterCount}
            </span>
          )}
        </Button>
      </SheetTrigger>
      <SheetContent side="bottom" className="h-[85vh] rounded-t-xl">
        <SheetHeader className="flex flex-row items-center justify-between pb-4">
          <SheetTitle>Filter Companies</SheetTitle>
          {activeFilterCount > 0 && (
            <Button variant="ghost" size="sm" onClick={onClearFilters}>
              <X className="h-4 w-4 mr-1" />
              Clear All
            </Button>
          )}
        </SheetHeader>

        <div className="space-y-6 overflow-y-auto">
          {/* Industry */}
          <div>
            <Label className="text-sm font-medium">Industry</Label>
            <Popover open={industryOpen} onOpenChange={setIndustryOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  role="combobox"
                  className="w-full justify-between mt-1.5 font-normal"
                >
                  {filters.industry || "All Industries"}
                  <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-full p-0 z-50 bg-popover" align="start">
                <Command>
                  <CommandInput placeholder="Search industry..." />
                  <CommandList>
                    <CommandEmpty>No industry found.</CommandEmpty>
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
                          onSelect={() => {
                            onFilterChange("industry", industry);
                            setIndustryOpen(false);
                          }}
                        >
                          <Check
                            className={cn(
                              "mr-2 h-4 w-4",
                              filters.industry === industry ? "opacity-100" : "opacity-0"
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

          {/* Location */}
          <div>
            <Label className="text-sm font-medium">Location</Label>
            <Input
              placeholder="Type location..."
              value={filters.location}
              onChange={(e) => onFilterChange("location", e.target.value)}
              className="mt-1.5"
            />
          </div>

          {/* Rating */}
          <div>
            <Label className="text-sm font-medium">Minimum Rating</Label>
            <Select
              value={filters.rating}
              onValueChange={(value) => onFilterChange("rating", value)}
            >
              <SelectTrigger className="mt-1.5">
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

          {/* Size */}
          <div>
            <Label className="text-sm font-medium">Company Size</Label>
            <Select
              value={filters.size}
              onValueChange={(value) => onFilterChange("size", value)}
            >
              <SelectTrigger className="mt-1.5">
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

          {/* Apply Filters Button */}
          <Button className="w-full bg-brand text-brand-foreground hover:bg-transparent hover:text-brand border border-brand" variant="default" onClick={() => setOpen(false)}>
            Apply Filters
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
};

export default MobileFilterSheet;
