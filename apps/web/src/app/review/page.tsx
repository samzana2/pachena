"use client";

import { useState, useEffect, useMemo } from "react";

import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { ReviewSectionPicker } from "@/components/review/ReviewSectionPicker";
import { RequestCompanyDialog } from "@/components/RequestCompanyDialog";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { TraceCard } from "@/components/ui/trace-card";
import { createBrowserSupabaseClient } from "@/lib/supabase/client";
import { Search, Building, Star, Loader2, Plus, ShieldCheck } from "lucide-react";
import { cn } from "@/lib/utils";

interface CompanyOption {
  id: string;
  name: string;
  slug: string;
  industry: string | null;
  location: string | null;
}

const ALPHABET = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("");
const COMPANIES_PER_PAGE = 10;

export default function Review() {
  const [searchQuery, setSearchQuery] = useState("");
  const [companies, setCompanies] = useState<CompanyOption[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedCompany, setSelectedCompany] = useState<CompanyOption | null>(null);
  const [showSectionPicker, setShowSectionPicker] = useState(false);
  const [showRequestDialog, setShowRequestDialog] = useState(false);
  const [selectedLetter, setSelectedLetter] = useState("A");
  const [displayCount, setDisplayCount] = useState(COMPANIES_PER_PAGE);

  useEffect(() => {
    const supabase = createBrowserSupabaseClient();
    async function fetchCompanies() {
      setIsLoading(true);
      const { data, error } = await supabase
        .from("companies")
        .select("id, name, slug, industry, location")
        .order("name");
      if (!error && data) {
        setCompanies(data);
      }
      setIsLoading(false);
    }
    fetchCompanies();
  }, []);

  // Reset display count when letter or search changes
  useEffect(() => {
    setDisplayCount(COMPANIES_PER_PAGE);
  }, [selectedLetter, searchQuery]);

  // Filter companies based on search or letter
  const filteredCompanies = useMemo(() => {
    if (searchQuery.trim().length >= 1) {
      return companies.filter(
        (company) =>
          company.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          company.industry?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          company.location?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }
    return companies.filter((company) =>
      company.name.toUpperCase().startsWith(selectedLetter)
    );
  }, [companies, searchQuery, selectedLetter]);

  const displayedCompanies = filteredCompanies.slice(0, displayCount);
  const hasMore = displayCount < filteredCompanies.length;
  const isSearching = searchQuery.trim().length >= 1;

  const handleSelectCompany = (company: CompanyOption) => {
    setSelectedCompany(company);
    setShowSectionPicker(true);
    window.history.replaceState(null, '', `/company/${company.slug}/review`);
  };

  const handleSectionPickerClose = () => {
    setShowSectionPicker(false);
    setSelectedCompany(null);
    window.history.replaceState(null, '', "/review");
  };

  const handleLoadMore = () => {
    setDisplayCount((prev) => prev + COMPANIES_PER_PAGE);
  };

  const handleLetterClick = (letter: string) => {
    setSelectedLetter(letter);
    setSearchQuery("");
  };

  return (
    <div className="min-h-screen bg-white">
      <Header />

      <main className="container py-12">
        {/* Hero Section */}
        <div className="text-center mb-10">
          <h1 className="text-3xl md:text-4xl font-medium text-black">
            Leave an Anonymous Review
          </h1>
          <p className="mt-3 text-black/70 max-w-xl mx-auto">
            Share your workplace experience anonymously. Your identity is always protected —
            reviews are completely anonymous by design.
          </p>
        </div>

        {/* Privacy Tip */}
        <Alert className="max-w-xl mx-auto mb-6 border-primary/20 bg-primary/5">
          <ShieldCheck className="h-4 w-4 text-primary" />
          <AlertDescription className="text-sm text-muted-foreground">
            For maximum privacy, we recommend submitting reviews from a personal device on a private network. Do not include any personally identifying information in your review.
          </AlertDescription>
        </Alert>

        {/* Search */}
        <div className="max-w-xl mx-auto mb-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-black/40" />
            <Input
              placeholder="Search for your company..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 h-12 text-base"
            />
          </div>
        </div>

        {/* Alphabet Filter */}
        {!isSearching && (
          <div className="max-w-2xl mx-auto mb-6">
            <div className="flex flex-wrap justify-center gap-1">
              {ALPHABET.map((letter) => (
                <Button
                  key={letter}
                  variant={selectedLetter === letter ? "default" : "ghost"}
                  size="sm"
                  className={cn(
                    "w-8 h-8 p-0 text-sm font-medium",
                    selectedLetter === letter && "pointer-events-none"
                  )}
                  onClick={() => handleLetterClick(letter)}
                >
                  {letter}
                </Button>
              ))}
            </div>
          </div>
        )}

        {/* Company List */}
        <div className="max-w-2xl mx-auto">
          {isLoading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : displayedCompanies.length > 0 ? (
            <div className="space-y-3">
              <p className="text-sm text-black/60 mb-4">
                {isSearching
                  ? `${filteredCompanies.length} companies found`
                  : `Companies starting with "${selectedLetter}" (${filteredCompanies.length})`}
              </p>
              {displayedCompanies.map((company) => (
                <TraceCard
                  key={company.id}
                  className="cursor-pointer border border-black/5 shadow-sm"
                  onClick={() => handleSelectCompany(company)}
                >
                  <CardContent className="p-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-muted">
                        <Building className="h-5 w-5 text-black/40" />
                      </div>
                      <div>
                        <p className="font-medium text-black">{company.name}</p>
                        <p className="text-sm text-black/60">
                          {[company.industry, company.location]
                            .filter(Boolean)
                            .join(" • ")}
                        </p>
                      </div>
                    </div>
                    <Button variant="outline" size="sm">
                      <Star className="h-4 w-4 mr-1" />
                      Review
                    </Button>
                  </CardContent>
                </TraceCard>
              ))}

              {/* Load More Button */}
              {hasMore && (
                <div className="flex justify-center pt-4">
                  <Button variant="outline" onClick={handleLoadMore}>
                    Load More ({filteredCompanies.length - displayCount} remaining)
                  </Button>
                </div>
              )}
            </div>
          ) : (
            <Card>
              <CardContent className="p-8 text-center">
                <p className="text-black/70">
                  {isSearching
                    ? "No companies found matching your search."
                    : `No companies starting with "${selectedLetter}".`}
                </p>
                <Button
                  variant="default"
                  className="mt-4"
                  onClick={() => setShowRequestDialog(true)}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Request Company Addition
                </Button>
              </CardContent>
            </Card>
          )}

          {/* Request Company CTA */}
          {displayedCompanies.length > 0 && (
            <div className="mt-6 text-center">
              <p className="text-sm text-black/60 mb-2">
                Can't find the company you're looking for?
              </p>
              <Button
                variant="outline"
                onClick={() => setShowRequestDialog(true)}
              >
                <Plus className="h-4 w-4 mr-2" />
                Request to Add Company
              </Button>
            </div>
          )}
        </div>

      </main>

      {/* Section Picker */}
      {selectedCompany && (
        <ReviewSectionPicker
          isOpen={showSectionPicker}
          onClose={handleSectionPickerClose}
          companyId={selectedCompany.id}
          companyName={selectedCompany.name}
        />
      )}

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
