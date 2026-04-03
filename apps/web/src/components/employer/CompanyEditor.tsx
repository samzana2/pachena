"use client";

import { useState, useRef, useMemo, useEffect } from "react";
import { useForm, type Resolver } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { createBrowserSupabaseClient } from "@/lib/supabase/client";
import { toast } from "sonner";
import { Loader2, Upload, Building2, X, Eye, Globe, MapPin, Users, Calendar, Briefcase, ChevronDown, Check } from "lucide-react";
import { cn } from "@/lib/utils";
import CompanyPreview from "./CompanyPreview";
const supabase = createBrowserSupabaseClient();
const EMPLOYEE_COUNT_OPTIONS = [
  "1-10",
  "11-50",
  "51-200",
  "201-500",
  "501-1,000",
  "1,001-5,000",
  "5,001-10,000",
  "10,001+",
];

const companySchema = z.object({
  name: z.string().min(1, "Company name is required").max(200),
  description: z.string().max(2000).optional(),
  industry: z.string().max(100).optional(),
  location: z.string().max(200).optional(),
  headquarters: z.string().max(200).optional(),
  employee_count: z.string().max(50).optional(),
  year_founded: z.coerce.number().min(1800).max(new Date().getFullYear()).optional().or(z.literal("")),
  ceo: z.string().max(100).optional(),
  mission: z.string().max(1000).optional(),
  website: z.string().optional().or(z.literal("")).transform((val) => {
    if (!val || val === "https://") return "";
    if (!/^https?:\/\//i.test(val)) return `https://${val}`;
    return val;
  }).pipe(z.string().url("Please enter a valid URL").or(z.literal(""))),
  linkedin_url: z.string().url("Please enter a valid LinkedIn URL").optional().or(z.literal("")),
});

type CompanyFormData = z.infer<typeof companySchema>;

interface CompanyEditorProps {
  company: {
    id: string;
    name: string;
    description: string | null;
    industry: string | null;
    location: string | null;
    headquarters: string | null;
    employee_count: string | null;
    year_founded: number | null;
    ceo: string | null;
    mission: string | null;
    website: string | null;
    linkedin_url: string | null;
    logo_url: string | null;
  };
  onUpdate: () => void;
  hideSaveButton?: boolean;
  externalSaveTrigger?: number;
}

const CompanyEditor = ({ company, onUpdate, hideSaveButton = false, externalSaveTrigger }: CompanyEditorProps) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isUploadingLogo, setIsUploadingLogo] = useState(false);
  const [logoPreview, setLogoPreview] = useState<string | null>(company.logo_url);
  const [employeeCountOpen, setEmployeeCountOpen] = useState(false);
  const [employeeCountSearch, setEmployeeCountSearch] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const form = useForm<CompanyFormData>({
    resolver: zodResolver(companySchema) as Resolver<CompanyFormData>,
    defaultValues: {
      name: company.name,
      description: company.description || "",
      industry: company.industry || "",
      location: company.location || "",
      headquarters: company.headquarters || "",
      employee_count: company.employee_count || "",
      year_founded: company.year_founded || "",
      ceo: company.ceo || "",
      mission: company.mission || "",
      website: company.website || "https://",
      linkedin_url: company.linkedin_url || "",
    },
  });

  const watchedValues = form.watch();

  // Handle external save trigger from parent component
  // Use a ref to track the last processed trigger to prevent double-execution
  const lastProcessedTrigger = useRef(0);
  
  useEffect(() => {
    if (externalSaveTrigger && externalSaveTrigger > 0 && externalSaveTrigger !== lastProcessedTrigger.current) {
      lastProcessedTrigger.current = externalSaveTrigger;
      form.handleSubmit(onSubmit)();
    }
  }, [externalSaveTrigger]);

  const filteredEmployeeOptions = useMemo(() => {
    if (!employeeCountSearch) return EMPLOYEE_COUNT_OPTIONS;
    return EMPLOYEE_COUNT_OPTIONS.filter((option) =>
      option.toLowerCase().includes(employeeCountSearch.toLowerCase())
    );
  }, [employeeCountSearch]);

  const handleLogoUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast.error("Please upload an image file");
      return;
    }

    if (file.size > 2 * 1024 * 1024) {
      toast.error("Image must be less than 2MB");
      return;
    }

    setIsUploadingLogo(true);
    try {
      const fileExt = file.name.split(".").pop()?.toLowerCase() || "png";
      const fileName = `${company.id}/logo.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from("company-logos")
        .upload(fileName, file, { upsert: true });

      if (uploadError) {
        console.error("Logo upload failed (storage):", uploadError);
        throw uploadError;
      }

      const {
        data: { publicUrl },
      } = supabase.storage.from("company-logos").getPublicUrl(fileName);

      const timestampedUrl = `${publicUrl}?t=${Date.now()}`;

      const { error: updateError } = await supabase
        .from("companies")
        .update({ logo_url: timestampedUrl })
        .eq("id", company.id);

      if (updateError) {
        console.error("Logo upload failed (company update):", updateError);
        throw updateError;
      }

      setLogoPreview(timestampedUrl);
      toast.success("Logo uploaded successfully!");
      onUpdate();
    } catch (error: any) {
      const message =
        error && typeof error === "object" && "message" in error
          ? String((error as any).message)
          : "Failed to upload logo";
      console.error("Error uploading logo:", error);
      toast.error(message);
    } finally {
      setIsUploadingLogo(false);
      // Allow re-uploading the same file (so onChange fires again)
      if (event.target) event.target.value = "";
    }
  };

  const handleRemoveLogo = async () => {
    setIsUploadingLogo(true);
    try {
      const { error } = await supabase
        .from("companies")
        .update({ logo_url: null })
        .eq("id", company.id);

      if (error) throw error;

      setLogoPreview(null);
      toast.success("Logo removed");
      onUpdate();
    } catch (error) {
      toast.error("Failed to remove logo");
    } finally {
      setIsUploadingLogo(false);
    }
  };

  const onSubmit = async (data: CompanyFormData) => {
    setIsSubmitting(true);
    try {
      const { error } = await supabase
        .from("companies")
        .update({
          name: data.name,
          description: data.description || null,
          industry: data.industry || null,
          location: data.location || null,
          headquarters: data.headquarters || null,
          employee_count: data.employee_count || null,
          year_founded: data.year_founded ? Number(data.year_founded) : null,
          ceo: data.ceo || null,
          mission: data.mission || null,
          website: (data.website && data.website !== "https://") ? data.website : null,
          linkedin_url: data.linkedin_url || null,
        })
        .eq("id", company.id);

      if (error) throw error;

      toast.success("Company information updated!");
      onUpdate();
    } catch (error) {
      toast.error("Failed to update company information");
    } finally {
      setIsSubmitting(false);
    }
  };

  const PreviewCard = () => (
    <div className="max-w-md mx-auto">
      <Card className="border-border/50 bg-background shadow-sm overflow-hidden">
        <div className="h-20 bg-gradient-to-r from-primary/20 to-primary/5" />
        <CardContent className="pt-0">
          <div className="flex items-start gap-4 -mt-10">
            <div className="h-20 w-20 rounded-xl border-4 border-background bg-muted flex items-center justify-center overflow-hidden shadow-sm">
              {logoPreview ? (
                <img src={logoPreview} alt="Company logo" className="h-full w-full object-cover" />
              ) : (
                <Building2 className="h-8 w-8 text-muted-foreground" />
              )}
            </div>
          </div>
          <div className="mt-3 space-y-3">
            <div>
              <h3 className="text-xl font-heading font-bold text-foreground tracking-tight">
                {watchedValues.name || "Company Name"}
              </h3>
              {watchedValues.industry && (
                <p className="text-sm text-muted-foreground">{watchedValues.industry}</p>
              )}
            </div>
            
            <div className="flex flex-wrap gap-2 text-xs">
              {watchedValues.location && (
                <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-muted text-muted-foreground">
                  <MapPin className="h-3 w-3" />
                  {watchedValues.location}
                </span>
              )}
              {watchedValues.employee_count && (
                <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-muted text-muted-foreground">
                  <Users className="h-3 w-3" />
                  {watchedValues.employee_count} employees
                </span>
              )}
              {watchedValues.year_founded && (
                <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-muted text-muted-foreground">
                  <Calendar className="h-3 w-3" />
                  Founded {watchedValues.year_founded}
                </span>
              )}
            </div>

            {watchedValues.description && (
              <p className="text-sm text-muted-foreground line-clamp-3">
                {watchedValues.description}
              </p>
            )}

            {watchedValues.website && (
              <a 
                href={watchedValues.website} 
                target="_blank" 
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-sm text-primary hover:underline"
              >
                <Globe className="h-3 w-3" />
                Visit website
              </a>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-heading font-bold text-foreground tracking-tight">
            Company Profile
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Manage your company's public profile and information
          </p>
        </div>
        <Dialog>
          <DialogTrigger asChild>
            <Button variant="outline" className="gap-2">
              <Eye className="h-4 w-4" />
              Preview
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-4xl bg-background">
            <DialogHeader>
              <DialogTitle className="font-heading">Public Profile Preview</DialogTitle>
            </DialogHeader>
            <CompanyPreview 
              company={company} 
              logoPreview={logoPreview}
              formValues={watchedValues}
            />
          </DialogContent>
        </Dialog>
      </div>

      {/* Logo Upload Section */}
      <Card className="border-border/50 bg-background shadow-sm">
        <CardHeader className="pb-4">
          <CardTitle className="text-base font-heading font-semibold flex items-center gap-2">
            <Building2 className="h-5 w-5" />
            Company Logo
          </CardTitle>
          <CardDescription className="text-sm text-muted-foreground">
            Upload a logo for your company page. Recommended size: 200x200 pixels.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-6">
            <div className="relative">
              <div className="flex h-24 w-24 items-center justify-center rounded-xl bg-muted overflow-hidden border-2 border-dashed border-border">
                {logoPreview ? (
                  <img src={logoPreview} alt="Company logo" className="h-24 w-24 object-cover" />
                ) : (
                  <Building2 className="h-10 w-10 text-muted-foreground" />
                )}
              </div>
              {logoPreview && (
                <button
                  type="button"
                  onClick={handleRemoveLogo}
                  disabled={isUploadingLogo}
                  className="absolute -top-2 -right-2 p-1 bg-destructive text-destructive-foreground rounded-full hover:bg-destructive/90 transition-colors"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>
            <div>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleLogoUpload}
                className="hidden"
              />
              <Button
                type="button"
                variant="outline"
                onClick={() => fileInputRef.current?.click()}
                disabled={isUploadingLogo}
                className="h-10"
              >
                {isUploadingLogo ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : (
                  <Upload className="h-4 w-4 mr-2" />
                )}
                Upload Logo
              </Button>
              <p className="mt-2 text-xs text-muted-foreground">
                PNG, JPG or WEBP. Max 2MB.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Company Info Form */}
      <Card className="border-border/50 bg-background shadow-sm">
        <CardHeader className="pb-4">
          <CardTitle className="text-base font-heading font-semibold flex items-center gap-2">
            <Briefcase className="h-5 w-5" />
            Company Information
          </CardTitle>
          <CardDescription className="text-sm text-muted-foreground">
            Update your company details. This information will be displayed on your public profile.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <div className="grid gap-4 md:grid-cols-2">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-foreground font-medium">Company Name *</FormLabel>
                      <FormControl>
                        <Input 
                          {...field} 
                          className="h-11 bg-background border-input focus:border-primary focus:ring-primary/20"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="industry"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-foreground font-medium">Industry</FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="e.g., Technology, Finance" 
                          {...field} 
                          className="h-11 bg-background border-input focus:border-primary focus:ring-primary/20"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="location"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-foreground font-medium">Location</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                          <Input 
                            placeholder="e.g., Harare, Zimbabwe" 
                            {...field} 
                            className="h-11 pl-10 bg-background border-input focus:border-primary focus:ring-primary/20"
                          />
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="headquarters"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-foreground font-medium">Headquarters</FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="e.g., Harare, Zimbabwe" 
                          {...field} 
                          className="h-11 bg-background border-input focus:border-primary focus:ring-primary/20"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="employee_count"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-foreground font-medium">Employee Count</FormLabel>
                      <Popover open={employeeCountOpen} onOpenChange={setEmployeeCountOpen}>
                        <PopoverTrigger asChild>
                          <FormControl>
                            <Button
                              variant="outline"
                              role="combobox"
                              aria-expanded={employeeCountOpen}
                              className={cn(
                                "w-full h-11 justify-between bg-background border-input hover:bg-background font-normal",
                                !field.value && "text-muted-foreground"
                              )}
                            >
                              <span className="flex items-center gap-2">
                                <Users className="h-4 w-4 text-muted-foreground" />
                                {field.value || "Select company size"}
                              </span>
                              <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                            </Button>
                          </FormControl>
                        </PopoverTrigger>
                        <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0 bg-background border-border z-50" align="start">
                          <div className="p-2 border-b border-border">
                            <Input
                              placeholder="Type to filter..."
                              value={employeeCountSearch}
                              onChange={(e) => setEmployeeCountSearch(e.target.value)}
                              className="h-9 border-input"
                            />
                          </div>
                          <div className="max-h-60 overflow-auto p-1">
                            {filteredEmployeeOptions.length === 0 ? (
                              <p className="p-2 text-sm text-muted-foreground text-center">No options found</p>
                            ) : (
                              filteredEmployeeOptions.map((option) => (
                                <button
                                  key={option}
                                  type="button"
                                  onClick={() => {
                                    field.onChange(option);
                                    setEmployeeCountOpen(false);
                                    setEmployeeCountSearch("");
                                  }}
                                  className={cn(
                                    "flex w-full items-center justify-between rounded-md px-3 py-2 text-sm transition-colors",
                                    "hover:bg-muted focus:bg-muted outline-none",
                                    field.value === option && "bg-primary/10 text-primary"
                                  )}
                                >
                                  <span>{option}</span>
                                  {field.value === option && (
                                    <Check className="h-4 w-4" />
                                  )}
                                </button>
                              ))
                            )}
                          </div>
                        </PopoverContent>
                      </Popover>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="year_founded"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-foreground font-medium">Year Founded</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                          <Input 
                            type="number" 
                            placeholder="e.g., 1999" 
                            {...field} 
                            className="h-11 pl-10 bg-background border-input focus:border-primary focus:ring-primary/20"
                          />
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="ceo"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-foreground font-medium">CEO</FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="CEO name" 
                          {...field} 
                          className="h-11 bg-background border-input focus:border-primary focus:ring-primary/20"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="website"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-foreground font-medium">Website</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Globe className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                          <Input 
                            placeholder="https://www.company.co.zw" 
                            {...field} 
                            className="h-11 pl-10 bg-background border-input focus:border-primary focus:ring-primary/20"
                          />
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="linkedin_url"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-foreground font-medium">LinkedIn</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Globe className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                          <Input 
                            placeholder="https://www.linkedin.com/company/..." 
                            {...field} 
                            className="h-11 pl-10 bg-background border-input focus:border-primary focus:ring-primary/20"
                          />
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-foreground font-medium">Description</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="Tell potential employees about your company..."
                        className="min-h-[120px] bg-background border-input focus:border-primary focus:ring-primary/20 resize-none"
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="mission"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-foreground font-medium">Mission Statement</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="Your company's mission..."
                        className="min-h-[80px] bg-background border-input focus:border-primary focus:ring-primary/20 resize-none"
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {!hideSaveButton && (
                <div className="flex justify-end">
                  <Button 
                    type="submit" 
                    disabled={isSubmitting}
                    className="h-11 px-6 text-base font-medium"
                  >
                    {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                    Save Changes
                  </Button>
                </div>
              )}
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
};

export default CompanyEditor;
