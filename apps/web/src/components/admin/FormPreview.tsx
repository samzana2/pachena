"use client";

import { useState, useEffect } from "react";
import { createBrowserSupabaseClient } from "@/lib/supabase/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Star, Loader2, RefreshCw, Lock, Building2, ShieldCheck, Briefcase, DollarSign, TrendingUp, MessageSquare, Gift } from "lucide-react";
import { Json } from "@/types/supabase";
const supabase = createBrowserSupabaseClient();

interface RatingCategory {
  id: string;
  category_key: string;
  category_label: string;
  display_order: number;
  is_active: boolean | null;
}

interface FormField {
  id: string;
  field_key: string;
  field_label: string;
  field_type: string;
  display_order: number;
  is_required: boolean | null;
  is_visible: boolean | null;
  placeholder: string | null;
  options: Json | null;
}

interface StandardBenefit {
  id: string;
  benefit_key: string;
  benefit_label: string;
  display_order: number;
}

interface FormPreviewProps {
  formType: string;
}

export function FormPreview({ formType }: FormPreviewProps) {
  const [categories, setCategories] = useState<RatingCategory[]>([]);
  const [fields, setFields] = useState<FormField[]>([]);
  const [standardBenefits, setStandardBenefits] = useState<StandardBenefit[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchData = async () => {
    setIsLoading(true);
    
    // Get form config ID
    const { data: configData } = await supabase
      .from("form_configurations")
      .select("id")
      .eq("form_type", formType)
      .single();

    if (!configData) {
      setIsLoading(false);
      return;
    }

    // Fetch form fields
    const { data: fieldsData } = await supabase
      .from("form_fields")
      .select("*")
      .eq("form_config_id", configData.id)
      .eq("is_visible", true)
      .order("display_order");

    setFields(fieldsData || []);

    // Only fetch rating categories and standard benefits for review form
    if (formType === "review_form") {
      const [categoriesRes, benefitsRes] = await Promise.all([
        supabase
          .from("rating_category_configs")
          .select("*")
          .eq("is_active", true)
          .order("display_order"),
        supabase
          .from("standard_benefits")
          .select("*")
          .eq("is_active", true)
          .order("display_order"),
      ]);
      
      setCategories(categoriesRes.data || []);
      setStandardBenefits(benefitsRes.data || []);
    } else {
      setCategories([]);
      setStandardBenefits([]);
    }
    
    setIsLoading(false);
  };

  useEffect(() => {
    fetchData();
  }, [formType]);

  const parseOptions = (options: Json | null): string[] => {
    if (!options) return [];
    if (typeof options === "string") {
      try {
        return JSON.parse(options);
      } catch {
        return [];
      }
    }
    if (Array.isArray(options)) {
      return options.map(String);
    }
    return [];
  };

  const getField = (key: string) => fields.find(f => f.field_key === key);
  const isFieldVisible = (key: string) => getField(key) !== undefined;

  const renderSelectField = (field: FormField) => {
    const options = parseOptions(field.options);
    return (
      <div key={field.id} className="space-y-2">
        <Label>{field.field_label}{field.is_required ? " *" : ""}</Label>
        <Select disabled>
          <SelectTrigger>
            <SelectValue placeholder="Select..." />
          </SelectTrigger>
          <SelectContent>
            {options.map((opt) => (
              <SelectItem key={opt} value={opt}>
                {opt}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    );
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  // Render claim form preview
  if (formType === "claim_form") {
    // Group fields for claim form layout
    const supervisorFields = fields.filter(f => 
      f.field_key === "supervisorName" || f.field_key === "supervisorEmail"
    );
    const authField = fields.find(f => f.field_key === "authorizationConfirmed");
    const mainFields = fields.filter(f => 
      !["supervisorName", "supervisorEmail", "authorizationConfirmed"].includes(f.field_key)
    );

    const renderField = (field: FormField) => {
      const isRequired = field.is_required;
      const label = `${field.field_label}${isRequired ? " *" : ""}`;

      switch (field.field_type) {
        case "text":
        case "email":
        case "url":
          return (
            <div key={field.id} className="space-y-2">
              <Label>{label}</Label>
              <Input 
                type={field.field_type === "email" ? "email" : field.field_type === "url" ? "url" : "text"}
                placeholder={field.placeholder || ""} 
                disabled 
              />
            </div>
          );
        case "textarea":
          return (
            <div key={field.id} className="space-y-2">
              <Label>{label}</Label>
              <Textarea placeholder={field.placeholder || ""} rows={3} disabled />
            </div>
          );
        case "number":
          return (
            <div key={field.id} className="space-y-2">
              <Label>{label}</Label>
              <Input type="number" placeholder={field.placeholder || ""} disabled />
            </div>
          );
        case "select":
          return renderSelectField(field);
        case "checkbox":
          return (
            <div key={field.id} className="flex items-center space-x-2">
              <Checkbox id={field.id} disabled />
              <Label htmlFor={field.id} className="font-normal">
                {field.field_label}
              </Label>
            </div>
          );
        default:
          return null;
      }
    };

    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-medium">Form Preview</h3>
            <p className="text-sm text-muted-foreground">
              This is how the claim form will appear to employers
            </p>
          </div>
          <Button variant="outline" onClick={fetchData}>
            <RefreshCw className="mr-2 h-4 w-4" />
            Refresh Preview
          </Button>
        </div>

        <Card className="max-w-2xl">
          <CardHeader className="text-center">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-secondary mb-4">
              <Building2 className="h-8 w-8 text-primary" />
            </div>
            <CardTitle>Claim Your Company</CardTitle>
            <CardDescription>
              Take control of your company's page to access private employee feedback, 
              respond to reviews, and build your employer brand.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Main Fields */}
            {mainFields.map(renderField)}

            {/* Supervisor Contact Section */}
            {supervisorFields.length > 0 && (
              <div className="border border-border rounded-lg p-4 space-y-4 bg-secondary/30">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <ShieldCheck className="h-4 w-4" />
                  <span>Optional: Provide supervisor/CEO contact for faster verification</span>
                </div>
                {supervisorFields.map(renderField)}
              </div>
            )}

            {/* Authorization Checkbox */}
            {authField && (
              <div className="flex flex-row items-start space-x-3 rounded-lg border border-border p-4 bg-primary/5">
                <Checkbox disabled />
                <div className="space-y-1 leading-none">
                  <Label className="text-sm font-medium">
                    I confirm I am authorized to manage this company's employer brand *
                  </Label>
                  <p className="text-xs text-muted-foreground">
                    By checking this box, you confirm that you have the authority from this company to claim and manage their page.
                  </p>
                </div>
              </div>
            )}

            {/* Submit Button */}
            <Button className="w-full" disabled>
              Submit Claim Request
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Render review form preview - NEW SECTION-BASED LAYOUT
  const compensationRating = categories.find(c => c.category_key === "compensation_fairness");
  const coreRatings = categories.filter(c => c.category_key !== "compensation_fairness");

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-medium">Form Preview</h3>
          <p className="text-sm text-muted-foreground">
            This is how the review form will appear to users
          </p>
        </div>
        <Button variant="outline" onClick={fetchData}>
          <RefreshCw className="mr-2 h-4 w-4" />
          Refresh Preview
        </Button>
      </div>

      <Card className="max-w-2xl">
        <CardHeader>
          <CardTitle>Write Your Anonymous Review</CardTitle>
          <CardDescription>
            Share your experience at Example Company. Your identity remains completely private.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-8">
          
          {/* Section 1: Employment Context */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Briefcase className="h-5 w-5 text-primary" />
              <h3 className="font-semibold">Employment Context</h3>
            </div>
            <p className="text-sm text-muted-foreground">
              Used only for aggregation and comparisons. No exact titles or dates.
            </p>
            
            <div className="grid gap-4 md:grid-cols-2">
              {isFieldVisible("employment_status") && renderSelectField(getField("employment_status")!)}
              {isFieldVisible("role_level") && renderSelectField(getField("role_level")!)}
            </div>
            
            <div className="grid gap-4 md:grid-cols-2">
              {isFieldVisible("department") && renderSelectField(getField("department")!)}
              {isFieldVisible("tenure_range") && renderSelectField(getField("tenure_range")!)}
            </div>
          </div>

          {/* Section 2: Compensation & Benefits */}
          <div className="space-y-4 pt-4 border-t">
            <div className="flex items-center gap-2">
              <DollarSign className="h-5 w-5 text-primary" />
              <h3 className="font-semibold">Compensation & Benefits</h3>
            </div>
            
            {isFieldVisible("salary_range") && (
              <div className="space-y-2">
                {renderSelectField(getField("salary_range")!)}
                <p className="text-xs text-muted-foreground">
                  Shown publicly only after aggregation thresholds are met
                </p>
              </div>
            )}

            {/* Compensation Fairness Rating */}
            {compensationRating && (
              <div className="space-y-2">
                <Label>{compensationRating.category_label} *</Label>
                <p className="text-xs text-muted-foreground">
                  How fair is your total compensation for the work you do?
                </p>
                <div className="flex gap-1">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <Star key={star} className="h-6 w-6 text-muted-foreground/30" />
                  ))}
                </div>
              </div>
            )}

            {isFieldVisible("market_alignment") && renderSelectField(getField("market_alignment")!)}
            {isFieldVisible("pay_transparency") && renderSelectField(getField("pay_transparency")!)}

            {/* Standard Benefits Checklist */}
            {standardBenefits.length > 0 && (
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <Gift className="h-4 w-4 text-primary" />
                  <Label>Benefits You Receive</Label>
                </div>
                <div className="grid gap-2 sm:grid-cols-2">
                  {standardBenefits.map((benefit) => (
                    <div key={benefit.id} className="flex items-center space-x-2">
                      <Checkbox id={`preview-${benefit.id}`} disabled />
                      <Label htmlFor={`preview-${benefit.id}`} className="text-sm font-normal">
                        {benefit.benefit_label}
                      </Label>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Company-specific benefits placeholder */}
            <div className="space-y-3">
              <Label className="text-sm text-muted-foreground">
                Company-specific benefits (employer reported)
              </Label>
              <div className="grid gap-2 sm:grid-cols-2">
                <div className="flex items-center space-x-2">
                  <Checkbox disabled />
                  <Label className="text-sm font-normal text-muted-foreground">Example Benefit 1</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox disabled />
                  <Label className="text-sm font-normal text-muted-foreground">Example Benefit 2</Label>
                </div>
              </div>
            </div>
          </div>

          {/* Section 3: Core Experience Ratings */}
          {coreRatings.length > 0 && (
            <div className="space-y-4 pt-4 border-t">
              <div className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-primary" />
                <h3 className="font-semibold">Core Experience Ratings</h3>
              </div>
              <div className="space-y-3">
                {coreRatings.map((category) => (
                  <div key={category.id} className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">
                      {category.category_label}
                    </span>
                    <div className="flex gap-1">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <Star key={star} className="h-5 w-5 text-muted-foreground/30" />
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Section 4: Review Content */}
          <div className="space-y-4 pt-4 border-t">
            <div className="flex items-center gap-2">
              <MessageSquare className="h-5 w-5 text-primary" />
              <h3 className="font-semibold">Your Review</h3>
            </div>
            
            {isFieldVisible("title") && (
              <div className="space-y-2">
                <Label>{getField("title")?.field_label || "Review Headline"}{getField("title")?.is_required ? " *" : ""}</Label>
                <Input placeholder={getField("title")?.placeholder || "Summarize your experience in one sentence"} disabled />
              </div>
            )}

            {isFieldVisible("pros") && (
              <div className="space-y-2">
                <Label>{getField("pros")?.field_label || "One thing you love"}{getField("pros")?.is_required ? " *" : ""}</Label>
                <Textarea placeholder={getField("pros")?.placeholder || ""} rows={2} disabled />
                <p className="text-xs text-muted-foreground text-right">0/200</p>
              </div>
            )}

            {isFieldVisible("cons") && (
              <div className="space-y-2">
                <Label>{getField("cons")?.field_label || "One thing to improve"}{getField("cons")?.is_required ? " *" : ""}</Label>
                <Textarea placeholder={getField("cons")?.placeholder || ""} rows={2} disabled />
                <p className="text-xs text-muted-foreground text-right">0/200</p>
              </div>
            )}
          </div>

          {/* Section 5: Recommendation */}
          {isFieldVisible("recommendation") && (
            <div className="space-y-4 pt-4 border-t">
              <Label>{getField("recommendation")?.field_label || "Would you recommend this company?"} *</Label>
              <div className="flex gap-3">
                {parseOptions(getField("recommendation")?.options ?? null).map((option) => (
                  <Button key={option} type="button" variant="outline" className="flex-1" disabled>
                    {option}
                  </Button>
                ))}
              </div>
            </div>
          )}

          {/* Section 6: Private Feedback */}
          {isFieldVisible("private_feedback") && (
            <div className="space-y-4 pt-4 border-t">
              <div className="flex items-start gap-3">
                <Lock className="h-5 w-5 text-primary mt-0.5" />
                <div>
                  <Label className="text-base font-medium">
                    {getField("private_feedback")?.field_label || "Private Feedback to Leadership"} (Optional)
                  </Label>
                  <p className="text-sm text-muted-foreground mt-1">
                    What should leadership understand but may not hear directly? 
                    This will <strong>not</strong> be made public.
                  </p>
                </div>
              </div>
              
              <Textarea
                placeholder={getField("private_feedback")?.placeholder || "Share private feedback, suggestions, or concerns..."}
                rows={4}
                disabled
              />
            </div>
          )}

          {/* Submit Button */}
          <Button className="w-full" disabled>
            Submit Anonymous Review
          </Button>

          <p className="text-xs text-center text-muted-foreground">
            By submitting, you confirm this review reflects your genuine experience.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
