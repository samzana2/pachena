"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import AdminLayout from "@/components/admin/AdminLayout";
import { createBrowserSupabaseClient } from "@/lib/supabase/client";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Search, ExternalLink, Pencil, Trash2, ChevronLeft, ChevronRight, Building2, Star, Loader2, AlertTriangle, Plus } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/hooks/use-toast";
import { LINKEDIN_INDUSTRIES as PREDEFINED_INDUSTRIES } from "@/lib/industries";

interface Company {
  id: string;
  name: string;
  slug: string;
  industry: string | null;
  location: string | null;
  is_claimed: boolean | null;
  logo_url: string | null;
  review_count: number;
  avg_rating: number;
}

const ITEMS_PER_PAGE = 10;

const supabase = createBrowserSupabaseClient();

const AdminCompanies = () => {
  const router = useRouter();
  const [companies, setCompanies] = useState<Company[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [industryFilter, setIndustryFilter] = useState<string>("all");
  const [claimFilter, setClaimFilter] = useState<string>("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [industries, setIndustries] = useState<string[]>([]);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [companyToDelete, setCompanyToDelete] = useState<Company | null>(null);
  const [deleteConfirmText, setDeleteConfirmText] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);
  const [isSuperAdmin, setIsSuperAdmin] = useState(false);
  const [checkingRole, setCheckingRole] = useState(true);

  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [newCompany, setNewCompany] = useState({
    name: "",
    slug: "",
    industry: "",
    customIndustry: "",
    location: "",
    website: "",
    description: "",
    headquarters: "",
    employee_count: "",
    year_founded: "",
    ceo: "",
    mission: "",
    linkedin_url: "",
  });
  const [showCustomIndustry, setShowCustomIndustry] = useState(false);

  useEffect(() => {
    fetchCompanies();
    checkSuperAdminRole();
  }, []);

  const checkSuperAdminRole = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", user.id)
        .eq("role", "super_admin")
        .maybeSingle();

      if (error) throw error;
      setIsSuperAdmin(!!data);
    } catch (error) {
      console.error("Error checking super admin role:", error);
    } finally {
      setCheckingRole(false);
    }
  };

  const fetchCompanies = async () => {
    try {
      setLoading(true);

      const { data: companiesData, error: companiesError } = await supabase
        .from("companies")
        .select("id, name, slug, industry, location, is_claimed, logo_url")
        .order("name");

      if (companiesError) throw companiesError;

      const { data: reviewsData, error: reviewsError } = await supabase
        .from("reviews_public")
        .select("company_id, rating");

      if (reviewsError) throw reviewsError;

      const reviewStats = new Map<string, { count: number; totalRating: number }>();
      reviewsData?.forEach((review) => {
        if (review.company_id) {
          const existing = reviewStats.get(review.company_id) || { count: 0, totalRating: 0 };
          reviewStats.set(review.company_id, {
            count: existing.count + 1,
            totalRating: existing.totalRating + (review.rating || 0),
          });
        }
      });

      const enrichedCompanies: Company[] = (companiesData || []).map((company) => {
        const stats = reviewStats.get(company.id) || { count: 0, totalRating: 0 };
        return {
          ...company,
          review_count: stats.count,
          avg_rating: stats.count > 0 ? stats.totalRating / stats.count : 0,
        };
      });

      setCompanies(enrichedCompanies);

      const uniqueIndustries = [...new Set(
        companiesData?.map(c => c.industry).filter(Boolean) as string[]
      )].sort();
      setIndustries(uniqueIndustries);

    } catch (error) {
      console.error("Error fetching companies:", error);
      toast({
        title: "Error",
        description: "Failed to load companies",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const filteredCompanies = companies.filter((company) => {
    const matchesSearch = company.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesIndustry = industryFilter === "all" || company.industry === industryFilter;
    const matchesClaim = claimFilter === "all" ||
      (claimFilter === "claimed" && company.is_claimed) ||
      (claimFilter === "unclaimed" && !company.is_claimed);
    return matchesSearch && matchesIndustry && matchesClaim;
  });

  const totalPages = Math.ceil(filteredCompanies.length / ITEMS_PER_PAGE);
  const paginatedCompanies = filteredCompanies.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  const handleDeleteClick = (company: Company) => {
    setCompanyToDelete(company);
    setDeleteConfirmText("");
    setDeleteDialogOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!companyToDelete || deleteConfirmText !== "DELETE") return;

    setIsDeleting(true);
    try {
      const { error } = await supabase
        .from("companies")
        .delete()
        .eq("id", companyToDelete.id);

      if (error) throw error;

      toast({
        title: "Company deleted",
        description: `${companyToDelete.name} has been permanently deleted.`,
      });

      setCompanies(companies.filter(c => c.id !== companyToDelete.id));
      setDeleteDialogOpen(false);
      setCompanyToDelete(null);
      setDeleteConfirmText("");
    } catch (error) {
      console.error("Error deleting company:", error);
      toast({
        title: "Error",
        description: "Failed to delete company. It may have associated reviews or claims.",
        variant: "destructive",
      });
    } finally {
      setIsDeleting(false);
    }
  };

  const handleCloseDeleteDialog = () => {
    setDeleteDialogOpen(false);
    setCompanyToDelete(null);
    setDeleteConfirmText("");
  };

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, industryFilter, claimFilter]);

  const generateSlug = (name: string) => {
    return name
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9\s-]/g, "")
      .replace(/\s+/g, "-")
      .replace(/-+/g, "-");
  };

  const handleNameChange = (name: string) => {
    setNewCompany((prev) => ({
      ...prev,
      name,
      slug: generateSlug(name),
    }));
  };

  const handleCreateCompany = async () => {
    if (!newCompany.name.trim() || !newCompany.slug.trim()) {
      toast({
        title: "Validation Error",
        description: "Company name and slug are required",
        variant: "destructive",
      });
      return;
    }

    const existingSlug = companies.find(
      (c) => c.slug.toLowerCase() === newCompany.slug.toLowerCase()
    );
    if (existingSlug) {
      toast({
        title: "Slug Already Exists",
        description: "Please choose a unique slug for this company",
        variant: "destructive",
      });
      return;
    }

    setIsCreating(true);
    try {
      const finalIndustry = newCompany.industry === "Other"
        ? newCompany.customIndustry.trim()
        : newCompany.industry.trim();

      const { data, error } = await supabase
        .from("companies")
        .insert({
          name: newCompany.name.trim(),
          slug: newCompany.slug.trim(),
          industry: finalIndustry || null,
          location: newCompany.location.trim() || null,
          website: newCompany.website.trim() || null,
          description: newCompany.description.trim() || null,
          headquarters: newCompany.headquarters.trim() || null,
          employee_count: newCompany.employee_count || null,
          year_founded: newCompany.year_founded ? Number(newCompany.year_founded) : null,
          ceo: newCompany.ceo.trim() || null,
          mission: newCompany.mission.trim() || null,
          linkedin_url: newCompany.linkedin_url.trim() || null,
        })
        .select()
        .single();

      if (error) throw error;

      toast({
        title: "Company Created",
        description: `${newCompany.name} has been added successfully.`,
      });

      setCompanies((prev) => [
        ...prev,
        {
          ...data,
          review_count: 0,
          avg_rating: 0,
        },
      ]);

      setNewCompany({
        name: "",
        slug: "",
        industry: "",
        customIndustry: "",
        location: "",
        website: "",
        description: "",
        headquarters: "",
        employee_count: "",
        year_founded: "",
        ceo: "",
        mission: "",
        linkedin_url: "",
      });
      setShowCustomIndustry(false);
      setAddDialogOpen(false);

      router.push(`/admin/companies/${data.id}/edit`);
    } catch (error: any) {
      console.error("Error creating company:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to create company",
        variant: "destructive",
      });
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Companies</h1>
            <p className="text-foreground">Manage all companies on the platform</p>
          </div>
          <Button onClick={() => setAddDialogOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Add Company
          </Button>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search companies..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          <Select value={industryFilter} onValueChange={setIndustryFilter}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Industry" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Industries</SelectItem>
              {industries.map((industry) => (
                <SelectItem key={industry} value={industry}>
                  {industry}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={claimFilter} onValueChange={setClaimFilter}>
            <SelectTrigger className="w-[150px]">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="claimed">Claimed</SelectItem>
              <SelectItem value="unclaimed">Unclaimed</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Stats */}
        <div className="flex gap-4 text-sm text-foreground">
          <span>{filteredCompanies.length} companies found</span>
          <span>•</span>
          <span>{companies.filter(c => c.is_claimed).length} claimed</span>
          <span>•</span>
          <span>{companies.filter(c => !c.is_claimed).length} unclaimed</span>
        </div>

        {/* Table */}
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <div className="border rounded-lg">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Company</TableHead>
                  <TableHead>Industry</TableHead>
                  <TableHead>Location</TableHead>
                  <TableHead className="text-center">Reviews</TableHead>
                  <TableHead className="text-center">Rating</TableHead>
                  <TableHead className="text-center">Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedCompanies.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8 text-foreground">
                      No companies found
                    </TableCell>
                  </TableRow>
                ) : (
                  paginatedCompanies.map((company) => (
                    <TableRow key={company.id}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <div className="h-10 w-10 rounded-lg bg-muted flex items-center justify-center overflow-hidden">
                            {company.logo_url ? (
                              <img
                                src={company.logo_url}
                                alt={company.name}
                                className="h-full w-full object-cover"
                              />
                            ) : (
                              <Building2 className="h-5 w-5 text-muted-foreground" />
                            )}
                          </div>
                          <span className="font-medium">{company.name}</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-foreground">
                        {company.industry || "—"}
                      </TableCell>
                      <TableCell className="text-foreground">
                        {company.location || "—"}
                      </TableCell>
                      <TableCell className="text-center">
                        {company.review_count}
                      </TableCell>
                      <TableCell className="text-center">
                        {company.avg_rating > 0 ? (
                          <div className="flex items-center justify-center gap-1">
                            <Star className="h-4 w-4 fill-[hsl(var(--star))] text-[hsl(var(--star))]" />
                            <span>{company.avg_rating.toFixed(1)}</span>
                          </div>
                        ) : (
                          <span className="text-foreground">—</span>
                        )}
                      </TableCell>
                      <TableCell className="text-center">
                        <Badge variant={company.is_claimed ? "default" : "secondary"}>
                          {company.is_claimed ? "Claimed" : "Unclaimed"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => window.open(`/company/${company.slug}`, "_blank")}
                            title="View public page"
                          >
                            <ExternalLink className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => router.push(`/admin/companies/${company.id}/edit`)}
                            title="Edit company"
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          {isSuperAdmin ? (
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleDeleteClick(company)}
                              title="Delete company"
                              className="text-destructive hover:text-destructive"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          ) : (
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <span>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    disabled
                                    className="text-muted-foreground cursor-not-allowed"
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                </span>
                              </TooltipTrigger>
                              <TooltipContent>
                                <p>Only Super Admins can delete companies</p>
                              </TooltipContent>
                            </Tooltip>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              Page {currentPage} of {totalPages}
            </p>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
              >
                <ChevronLeft className="h-4 w-4 mr-1" />
                Previous
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
              >
                Next
                <ChevronRight className="h-4 w-4 ml-1" />
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={handleCloseDeleteDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-destructive">
              <AlertTriangle className="h-5 w-5" />
              Delete Company
            </DialogTitle>
            <DialogDescription asChild>
              <div className="space-y-3 pt-2">
                <p>
                  You are about to permanently delete <strong className="text-foreground">{companyToDelete?.name}</strong>.
                </p>
                <div className="rounded-md bg-destructive/10 border border-destructive/20 p-3 text-sm">
                  <p className="font-medium text-destructive">This action CANNOT be undone and will affect:</p>
                  <ul className="mt-2 list-disc list-inside text-muted-foreground space-y-1">
                    <li>All associated reviews ({companyToDelete?.review_count || 0} reviews)</li>
                    <li>Employer claims and profiles</li>
                    <li>Company analytics and history</li>
                  </ul>
                </div>
              </div>
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <Label htmlFor="delete-confirm">Type <span className="font-mono font-bold">DELETE</span> to confirm:</Label>
            <Input
              id="delete-confirm"
              value={deleteConfirmText}
              onChange={(e) => setDeleteConfirmText(e.target.value)}
              placeholder="Type DELETE here"
              className="font-mono"
              autoComplete="off"
            />
          </div>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" onClick={handleCloseDeleteDialog}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleConfirmDelete}
              disabled={deleteConfirmText !== "DELETE" || isDeleting}
            >
              {isDeleting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  Deleting...
                </>
              ) : (
                "Delete Company"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add Company Dialog */}
      <Dialog open={addDialogOpen} onOpenChange={setAddDialogOpen}>
        <DialogContent className="sm:max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Plus className="h-5 w-5" />
              Add Company
            </DialogTitle>
            <DialogDescription>
              Create a new company profile on the platform.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="company-name">Company Name *</Label>
              <Input
                id="company-name"
                value={newCompany.name}
                onChange={(e) => handleNameChange(e.target.value)}
                placeholder="Enter company name"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="company-slug">Slug *</Label>
              <Input
                id="company-slug"
                value={newCompany.slug}
                onChange={(e) =>
                  setNewCompany((prev) => ({ ...prev, slug: e.target.value }))
                }
                placeholder="company-slug"
                className="font-mono"
              />
              <p className="text-xs text-muted-foreground">
                URL-friendly identifier (e.g., acme-corp)
              </p>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="company-industry">Industry</Label>
                <Select
                  value={newCompany.industry}
                  onValueChange={(value) => {
                    setNewCompany((prev) => ({ ...prev, industry: value }));
                    setShowCustomIndustry(value === "Other");
                    if (value !== "Other") {
                      setNewCompany((prev) => ({ ...prev, customIndustry: "" }));
                    }
                  }}
                >
                  <SelectTrigger id="company-industry">
                    <SelectValue placeholder="Select industry" />
                  </SelectTrigger>
                  <SelectContent>
                    {PREDEFINED_INDUSTRIES.map((industry) => (
                      <SelectItem key={industry} value={industry}>
                        {industry}
                      </SelectItem>
                    ))}
                    <SelectItem value="Other">Other</SelectItem>
                  </SelectContent>
                </Select>
                {showCustomIndustry && (
                  <Input
                    value={newCompany.customIndustry}
                    onChange={(e) =>
                      setNewCompany((prev) => ({ ...prev, customIndustry: e.target.value }))
                    }
                    placeholder="Enter custom industry"
                    className="mt-2"
                  />
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="company-location">Location</Label>
                <Input
                  id="company-location"
                  value={newCompany.location}
                  onChange={(e) =>
                    setNewCompany((prev) => ({ ...prev, location: e.target.value }))
                  }
                  placeholder="City, Country"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="company-website">Website</Label>
              <Input
                id="company-website"
                value={newCompany.website}
                onChange={(e) =>
                  setNewCompany((prev) => ({ ...prev, website: e.target.value }))
                }
                placeholder="https://example.com"
                type="url"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="company-headquarters">Headquarters</Label>
                <Input
                  id="company-headquarters"
                  value={newCompany.headquarters}
                  onChange={(e) =>
                    setNewCompany((prev) => ({ ...prev, headquarters: e.target.value }))
                  }
                  placeholder="e.g., Harare, Zimbabwe"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="company-employee-count">Company Size</Label>
                <Select
                  value={newCompany.employee_count}
                  onValueChange={(value) =>
                    setNewCompany((prev) => ({ ...prev, employee_count: value }))
                  }
                >
                  <SelectTrigger id="company-employee-count">
                    <SelectValue placeholder="Select size" />
                  </SelectTrigger>
                  <SelectContent>
                    {["1-10", "11-50", "51-200", "201-500", "501-1,000", "1,001-5,000", "5,001-10,000", "10,001+"].map((size) => (
                      <SelectItem key={size} value={size}>
                        {size} employees
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="company-year-founded">Year Founded</Label>
                <Input
                  id="company-year-founded"
                  value={newCompany.year_founded}
                  onChange={(e) =>
                    setNewCompany((prev) => ({ ...prev, year_founded: e.target.value }))
                  }
                  placeholder="e.g., 2010"
                  type="number"
                  min="1800"
                  max={new Date().getFullYear()}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="company-ceo">CEO / Managing Director</Label>
                <Input
                  id="company-ceo"
                  value={newCompany.ceo}
                  onChange={(e) =>
                    setNewCompany((prev) => ({ ...prev, ceo: e.target.value }))
                  }
                  placeholder="Full name"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="company-linkedin">LinkedIn URL</Label>
              <Input
                id="company-linkedin"
                value={newCompany.linkedin_url}
                onChange={(e) =>
                  setNewCompany((prev) => ({ ...prev, linkedin_url: e.target.value }))
                }
                placeholder="https://linkedin.com/company/..."
                type="url"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="company-description">Description</Label>
              <Textarea
                id="company-description"
                value={newCompany.description}
                onChange={(e) =>
                  setNewCompany((prev) => ({ ...prev, description: e.target.value }))
                }
                placeholder="Brief description of the company..."
                rows={3}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="company-mission">Mission Statement</Label>
              <Textarea
                id="company-mission"
                value={newCompany.mission}
                onChange={(e) =>
                  setNewCompany((prev) => ({ ...prev, mission: e.target.value }))
                }
                placeholder="Company mission or values..."
                rows={2}
              />
            </div>
          </div>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" onClick={() => setAddDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleCreateCompany}
              disabled={!newCompany.name.trim() || !newCompany.slug.trim() || isCreating}
            >
              {isCreating ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  Creating...
                </>
              ) : (
                "Create Company"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
};

export default AdminCompanies;
