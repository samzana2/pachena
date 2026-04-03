"use client";

import { useState, useMemo, useCallback } from "react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import Link from "next/link";
import { Search, Plus, ChevronDown } from "lucide-react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import FilterSidebar from "@/components/FilterSidebar";
import AlphabetFilter from "@/components/AlphabetFilter";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import CompanyCard, { Company } from "@/components/CompanyCard";
import CompanySpotlight from "@/components/CompanySpotlight";
import { RequestCompanyDialog } from "@/components/RequestCompanyDialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const COMPANIES_PER_LOAD = 10;

const parseEmployeeCount = (countStr: string): number | null => {
  if (!countStr) return null;
  const normalized = countStr.trim();
  if (!normalized || normalized.toLowerCase() === "unknown") return null;
  const noCommas = normalized.replace(/,/g, "");
  const rangeMatch = noCommas.match(/(\d+)\s*-\s*(\d+)/);
  if (rangeMatch) {
    return (parseInt(rangeMatch[1], 10) + parseInt(rangeMatch[2], 10)) / 2;
  }
  const numMatch = noCommas.match(/(\d+)/);
  return numMatch ? parseInt(numMatch[1], 10) : null;
};

interface SpotlightCompany {
  id: string;
  name: string;
  logo?: string;
  description: string;
  rating: number;
}

interface CompaniesClientProps {
  companies: Company[];
  spotlightCompanies: SpotlightCompany[];
  initialSearch: string;
  initialLetter: string | null;
  initialFilters: {
    industry: string;
    location: string;
    rating: string;
    size: string;
  };
}

export default function CompaniesClient({
  companies,
  spotlightCompanies,
  initialSearch,
  initialLetter,
  initialFilters,
}: CompaniesClientProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [searchQuery, setSearchQuery] = useState(initialSearch);
  const [selectedLetter, setSelectedLetter] = useState<string | null>(
    initialLetter
  );
  const [displayCount, setDisplayCount] = useState(COMPANIES_PER_LOAD);
  const [showRequestDialog, setShowRequestDialog] = useState(false);
  const [filters, setFilters] = useState(initialFilters);

  const updateURL = useCallback(
    (updates: Record<string, string | null>) => {
      const params = new URLSearchParams(searchParams.toString());
      for (const [key, value] of Object.entries(updates)) {
        if (value === null || value === "" || value === "all") {
          params.delete(key);
        } else {
          params.set(key, value);
        }
      }
      const query = params.toString();
      router.push(`${pathname}${query ? `?${query}` : ""}`, { scroll: false });
    },
    [router, pathname, searchParams]
  );

  const handleFilterChange = (key: string, value: string) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
    setDisplayCount(COMPANIES_PER_LOAD);
    updateURL({ [key]: value });
  };

  const handleClearFilters = () => {
    const cleared = { industry: "", location: "", rating: "all", size: "all" };
    setFilters(cleared);
    setDisplayCount(COMPANIES_PER_LOAD);
    updateURL({ industry: null, location: null, rating: null, size: null });
  };

  const handleLetterClick = (letter: string | null) => {
    setSelectedLetter(letter);
    setSearchQuery("");
    setDisplayCount(COMPANIES_PER_LOAD);
    updateURL({ letter: letter, search: null });
  };

  const handleSearchChange = (value: string) => {
    setSearchQuery(value);
    if (value.trim()) {
      setSelectedLetter(null);
      updateURL({ search: value, letter: null });
    } else {
      updateURL({ search: null });
    }
    setDisplayCount(COMPANIES_PER_LOAD);
  };

  const handleLoadMore = () => {
    setDisplayCount((prev) => prev + COMPANIES_PER_LOAD);
  };

  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (filters.industry) count++;
    if (filters.location) count++;
    if (filters.rating !== "all") count++;
    if (filters.size !== "all") count++;
    return count;
  }, [filters]);

  const isSearching = searchQuery.trim().length > 0;

  const filteredCompanies = useMemo(() => {
    let result = companies;

    if (isSearching) {
      result = result.filter(
        (c) =>
          c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          c.industry.toLowerCase().includes(searchQuery.toLowerCase()) ||
          c.location.toLowerCase().includes(searchQuery.toLowerCase())
      );
    } else if (selectedLetter) {
      result = result.filter((c) =>
        c.name.toUpperCase().startsWith(selectedLetter)
      );
    }

    if (filters.industry) {
      result = result.filter((c) =>
        c.industry.toLowerCase().includes(filters.industry.toLowerCase())
      );
    }
    if (filters.location) {
      result = result.filter((c) =>
        c.location.toLowerCase().includes(filters.location.toLowerCase())
      );
    }
    if (filters.rating !== "all") {
      result = result.filter((c) => c.rating >= parseFloat(filters.rating));
    }
    if (filters.size !== "all") {
      result = result.filter((c) => {
        const count = parseEmployeeCount(c.employeeCount);
        if (count === null) return false;
        switch (filters.size) {
          case "1_10":
            return count >= 1 && count <= 10;
          case "11_50":
            return count >= 11 && count <= 50;
          case "51_200":
            return count >= 51 && count <= 200;
          case "201_500":
            return count >= 201 && count <= 500;
          case "501_1000":
            return count >= 501 && count <= 1000;
          case "1001_5000":
            return count >= 1001 && count <= 5000;
          case "5001_10000":
            return count >= 5001 && count <= 10000;
          case "10001_plus":
            return count >= 10001;
          case "500_plus":
            return count >= 500;
          case "small":
            return count >= 1 && count <= 50;
          case "medium":
            return count >= 51 && count <= 200;
          case "large":
            return count >= 201 && count <= 1000;
          case "enterprise":
            return count >= 1000;
          default:
            return true;
        }
      });
    }

    if (!isSearching && !selectedLetter) {
      result = [...result].sort((a, b) => {
        if (b.reviewCount !== a.reviewCount) return b.reviewCount - a.reviewCount;
        return a.name.localeCompare(b.name);
      });
    }

    return result;
  }, [companies, searchQuery, selectedLetter, filters, isSearching]);

  const displayedCompanies = filteredCompanies.slice(0, displayCount);
  const hasMore = displayCount < filteredCompanies.length;

  const getResultsMessage = () => {
    const count = filteredCompanies.length;
    if (isSearching)
      return `${count} ${count === 1 ? "company" : "companies"} found for "${searchQuery}"`;
    if (selectedLetter)
      return `Companies starting with "${selectedLetter}" (${count})`;
    return `All companies (${count})`;
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />

      {/* Hero Section */}
      <section className="px-4 pb-8 pt-10">
        <div className="container">
          <div className="text-center max-w-2xl mx-auto">
            <h1 className="text-3xl md:text-4xl font-medium text-black">
              Find Companies
            </h1>
            <p className="mt-2 text-black/70">
              Explore workplaces across Zimbabwe to read anonymous employee
              insights.
            </p>

            {/* Centered Search */}
            <div className="mt-6 max-w-xl mx-auto">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-brand" />
                <Input
                  placeholder="Search companies by name, industry, or location..."
                  value={searchQuery}
                  onChange={(e) => handleSearchChange(e.target.value)}
                  className="pl-10 h-12 text-base"
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Alphabet Filter - Hidden when searching */}
      {!isSearching && (
        <section className="px-4 py-4 bg-muted/30">
          <div className="container">
            <AlphabetFilter
              selectedLetter={selectedLetter}
              onLetterClick={handleLetterClick}
            />
          </div>
        </section>
      )}

      {/* Main Content */}
      <section className="px-4 py-8">
        <div className="container">
          {/* Mobile Filter - Collapsible */}
          <div className="lg:hidden mb-6">
            <Collapsible>
              <CollapsibleTrigger asChild>
                <Button variant="outline" className="w-full justify-between">
                  <span className="flex items-center gap-2">
                    Filter Companies
                    {activeFilterCount > 0 && (
                      <span className="h-5 w-5 rounded-full bg-primary text-primary-foreground text-xs flex items-center justify-center">
                        {activeFilterCount}
                      </span>
                    )}
                  </span>
                  <ChevronDown className="h-4 w-4" />
                </Button>
              </CollapsibleTrigger>
              <CollapsibleContent className="mt-2">
                <FilterSidebar
                  filters={filters}
                  onFilterChange={handleFilterChange}
                  onClearFilters={handleClearFilters}
                  activeFilterCount={activeFilterCount}
                />
              </CollapsibleContent>
            </Collapsible>
          </div>

          <div className="flex gap-8">
            {/* Desktop Sidebar */}
            <aside className="hidden lg:block w-[280px] shrink-0">
              <div className="sticky top-24">
                <FilterSidebar
                  filters={filters}
                  onFilterChange={handleFilterChange}
                  onClearFilters={handleClearFilters}
                  activeFilterCount={activeFilterCount}
                />
              </div>
            </aside>

            {/* Results */}
            <div className="flex-1 min-w-0">
              {/* Results Count */}
              <p className="text-sm text-black/60 mb-4">
                {getResultsMessage()}
                {activeFilterCount > 0 && (
                  <span className="ml-1">
                    with {activeFilterCount} filter
                    {activeFilterCount > 1 ? "s" : ""} applied
                  </span>
                )}
              </p>

              {displayedCompanies.length > 0 ? (
                <div className="space-y-8">
                  {displayedCompanies.map((company) => (
                    <CompanyCard key={company.id} company={company} />
                  ))}

                  {/* Load More */}
                  {hasMore && (
                    <div className="flex justify-center pt-4">
                      <Button variant="outline" onClick={handleLoadMore}>
                        Load More ({filteredCompanies.length - displayCount}{" "}
                        remaining)
                      </Button>
                    </div>
                  )}

                  {/* Request Company CTA */}
                  <div className="mt-8 text-center">
                    <p className="text-sm text-black/60 mb-2">
                      Can&apos;t find the company you&apos;re looking for?
                    </p>
                    <Button
                      variant="outline"
                      onClick={() => setShowRequestDialog(true)}
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Request to Add Company
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="rounded-lg border border-border bg-card p-12 text-center">
                  <p className="text-black/70">
                    {companies.length === 0
                      ? "No companies found. Companies will appear here once added."
                      : isSearching
                      ? `No companies found matching "${searchQuery}".`
                      : selectedLetter
                      ? `No companies starting with "${selectedLetter}".`
                      : "No companies found matching your filters."}
                  </p>
                  {(activeFilterCount > 0 || isSearching || selectedLetter) && (
                    <div className="flex flex-wrap gap-2 justify-center mt-4">
                      {activeFilterCount > 0 && (
                        <Button variant="outline" onClick={handleClearFilters}>
                          Clear Filters
                        </Button>
                      )}
                      <Button
                        variant="default"
                        onClick={() => setShowRequestDialog(true)}
                      >
                        <Plus className="h-4 w-4 mr-2" />
                        Request to Add Company
                      </Button>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Company Spotlight */}
      {spotlightCompanies.length > 0 && (
        <section className="w-full flex justify-center py-16 md:py-24 text-foreground">
          <div className="w-full max-w-[1100px] px-5">
            <CompanySpotlight companies={spotlightCompanies} />
          </div>
        </section>
      )}

      {/* Why It Matters */}
      <section className="bg-background py-24">
        <div className="container text-center">
          <h2 className="font-logo text-4xl text-brand md:text-5xl">Pachena</h2>
          <p className="mt-3 text-lg font-medium text-foreground">
            Why it matters.
          </p>
          <p className="mx-auto mt-4 max-w-2xl text-black/70 leading-relaxed">
            At Pachena, we believe transparency leads to fairer pay, better
            workplace conditions, and stronger companies. Employees deserve
            clarity. By sharing your experiences anonymously, you help create a
            more open and fair job market for everyone.
          </p>
          <div className="mt-10 flex flex-wrap justify-center gap-4">
            <Button
              size="lg"
              asChild
              className="bg-brand text-brand-foreground hover:bg-transparent hover:text-brand border border-brand"
            >
              <Link href="/companies">Browse Companies</Link>
            </Button>
            <Button size="lg" variant="outline" asChild>
              <Link href="/review">Leave a Review</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Request Company Dialog */}
      <RequestCompanyDialog
        isOpen={showRequestDialog}
        onClose={() => setShowRequestDialog(false)}
        initialCompanyName={searchQuery}
      />

      <Footer />
    </div>
  );
}
