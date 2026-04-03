"use client";

import { useState, useEffect, useMemo, Suspense } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useSearchParams } from "next/navigation";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from "@/components/ui/form";
import { createBrowserSupabaseClient } from "@/lib/supabase/client";
import { toast } from "sonner";
import { Clock, ShieldCheck, Loader2 } from "lucide-react";
import { extractEdgeFunctionError } from "@/lib/edge-function-errors";

interface FormFieldConfig {
  id: string;
  field_key: string;
  field_label: string;
  field_type: string;
  display_order: number;
  is_required: boolean | null;
  is_visible: boolean | null;
  placeholder: string | null;
  options: unknown;
}

// Build dynamic Zod schema based on field configurations
const buildDynamicSchema = (fields: FormFieldConfig[]) => {
  const schemaFields: Record<string, z.ZodTypeAny> = {};

  // URL validation that accepts various formats (optional field)
  const flexibleUrlSchema = z.string().trim()
    .refine(val => {
      if (!val || val === "") return true; // Empty is OK for optional
      // Accept: domain.com, www.domain.com, http://, https://
      const urlPattern = /^(https?:\/\/)?(www\.)?[a-zA-Z0-9][-a-zA-Z0-9]*(\.[a-zA-Z]{2,})+(\/.*)?$/;
      return urlPattern.test(val);
    }, { message: "Please enter a valid website (e.g., company.com)" })
    .transform(val => val || "");

  fields.forEach(field => {
    if (!field.is_visible) return;
    let fieldSchema: z.ZodTypeAny;
    switch (field.field_type) {
      case "email":
        fieldSchema = z.string().trim().email("Invalid email address").max(255, "Email must be less than 255 characters");
        break;
      case "url":
        fieldSchema = flexibleUrlSchema;
        break;
      case "checkbox":
        if (field.field_key === "authorizationConfirmed") {
          fieldSchema = z.boolean().refine(val => val === true, {
            message: "You must confirm authorization"
          });
        } else {
          fieldSchema = z.boolean().optional();
        }
        break;
      case "textarea":
        fieldSchema = z.string().trim().max(1000, "Text must be less than 1000 characters");
        break;
      default:
        fieldSchema = z.string().trim().max(255, "Text must be less than 255 characters");
    }

    // Handle required vs optional
    if (field.is_required && field.field_type !== "checkbox") {
      if (field.field_type === "email") {
        schemaFields[field.field_key] = z.string().trim().min(1, `${field.field_label} is required`).email("Invalid email address").max(255);
      } else if (field.field_type === "url") {
        schemaFields[field.field_key] = z.string().trim().min(1, `${field.field_label} is required`)
          .refine(val => {
            const urlPattern = /^(https?:\/\/)?(www\.)?[a-zA-Z0-9][-a-zA-Z0-9]*(\.[a-zA-Z]{2,})+(\/.*)?$/;
            return urlPattern.test(val);
          }, { message: "Please enter a valid website (e.g., company.com)" });
      } else if (field.field_type === "textarea") {
        schemaFields[field.field_key] = z.string().trim().min(1, `${field.field_label} is required`).max(1000);
      } else {
        schemaFields[field.field_key] = z.string().trim().min(1, `${field.field_label} is required`).max(255);
      }
    } else if (!field.is_required && field.field_type !== "checkbox") {
      schemaFields[field.field_key] = fieldSchema.optional().or(z.literal(""));
    } else {
      schemaFields[field.field_key] = fieldSchema;
    }
  });
  return z.object(schemaFields);
};

function ClaimContent() {
  const searchParams = useSearchParams();
  const prefillCompany = searchParams.get("company") || "";
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoadingFields, setIsLoadingFields] = useState(true);
  const [formFields, setFormFields] = useState<FormFieldConfig[]>([]);

  // Fetch form field configuration
  useEffect(() => {
    const fetchFields = async () => {
      const supabase = createBrowserSupabaseClient();
      setIsLoadingFields(true);
      const { data: configData } = await supabase
        .from("form_configurations")
        .select("id")
        .eq("form_type", "claim_form")
        .single();
      if (!configData) {
        setIsLoadingFields(false);
        return;
      }
      const { data: fields } = await supabase
        .from("form_fields")
        .select("*")
        .eq("form_config_id", configData.id)
        .eq("is_visible", true)
        .order("display_order");
      setFormFields(fields || []);
      setIsLoadingFields(false);
    };
    fetchFields();
  }, []);

  // Build schema dynamically
  const dynamicSchema = useMemo(() => buildDynamicSchema(formFields), [formFields]);

  // Build default values
  const defaultValues = useMemo(() => {
    const values: Record<string, string | boolean> = {};
    formFields.forEach(field => {
      if (field.field_type === "checkbox") {
        values[field.field_key] = false;
      } else if (field.field_key === "companyName") {
        values[field.field_key] = prefillCompany;
      } else {
        values[field.field_key] = "";
      }
    });
    return values;
  }, [formFields, prefillCompany]);

  const form = useForm({
    resolver: zodResolver(dynamicSchema),
    defaultValues
  });

  // Reset form when defaultValues change
  useEffect(() => {
    if (Object.keys(defaultValues).length > 0) {
      form.reset(defaultValues);
    }
  }, [defaultValues, form]);

  const onSubmit = async (data: Record<string, unknown>) => {
    setIsSubmitting(true);
    const supabase = createBrowserSupabaseClient();
    try {
      const response = await supabase.functions.invoke('submit-claim', {
        body: {
          fullName: data.fullName || null,
          jobTitle: data.jobTitle || null,
          workEmail: data.workEmail || null,
          companyName: data.companyName || null,
          companyWebsite: data.companyWebsite || null,
          phoneNumber: data.phoneNumber || null,
          message: data.message || null,
          supervisorName: data.supervisorName || null,
          supervisorEmail: data.supervisorEmail || null,
          authorizationConfirmed: data.authorizationConfirmed || false
        }
      });

      const errorMessage = await extractEdgeFunctionError(response);
      if (errorMessage) {
        throw new Error(errorMessage);
      }

      setIsSubmitted(true);
      toast.success("Your claim request has been submitted!");
    } catch (error: unknown) {
      console.error("Claim submission error:", error);
      const message = error instanceof Error ? error.message : "Failed to submit request. Please try again.";
      toast.error(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Separate fields into groups
  const supervisorFields = formFields.filter(f => f.field_key === "supervisorName" || f.field_key === "supervisorEmail");
  const authField = formFields.find(f => f.field_key === "authorizationConfirmed");
  const mainFields = formFields.filter(f => !["supervisorName", "supervisorEmail", "authorizationConfirmed"].includes(f.field_key));

  const renderFormField = (fieldConfig: FormFieldConfig) => {
    const { field_key, field_label, field_type, is_required, placeholder } = fieldConfig;
    return (
      <FormField
        key={field_key}
        control={form.control}
        name={field_key}
        render={({ field }) => (
          <FormItem>
            <FormLabel className="text-black">{field_label}{is_required ? " *" : ""}</FormLabel>
            <FormControl>
              {field_type === "textarea" ? (
                <Textarea placeholder={placeholder || ""} className="min-h-[100px]" {...field} value={field.value as string || ""} />
              ) : field_type === "email" ? (
                <Input type="email" placeholder={placeholder || ""} {...field} value={field.value as string || ""} />
              ) : field_type === "url" ? (
                <Input type="url" placeholder={placeholder || ""} {...field} value={field.value as string || ""} />
              ) : (
                <Input placeholder={placeholder || ""} {...field} value={field.value as string || ""} />
              )}
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
    );
  };

  if (isLoadingFields) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <section className="py-20">
          <div className="container max-w-2xl flex items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-black/40" />
          </div>
        </section>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <section className="py-20">
        <div className="container max-w-2xl">
          {isSubmitted ? (
            <Card className="text-center">
              <CardContent className="pt-10 pb-10">
                <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-black/5 mb-6">
                  <Clock className="h-8 w-8 text-primary" />
                </div>
                <h2 className="text-2xl font-medium text-black mb-4">Your company claim is under review</h2>
                <p className="text-black/70 max-w-md mx-auto">
                  We will verify your work email and contact your company leadership to confirm your authorization.
                  You will receive an email notification once your claim is approved.
                </p>
                <div className="mt-8 p-4 bg-muted/30 rounded-lg">
                  <p className="text-sm text-black/70">
                    <strong className="text-black">What happens next?</strong><br />
                    1. We verify your email domain matches your company<br />
                    2. We confirm your role with company leadership<br />
                    3. You receive access to manage your company page
                  </p>
                </div>
              </CardContent>
            </Card>
          ) : (
            <>
              <div className="text-center mb-10">
                <h1 className="text-3xl md:text-4xl font-medium text-black">
                  Claim Your Company
                </h1>
                <p className="mt-4 text-black/70 max-w-lg mx-auto">
                  Take control of your company's Pachena page to access private employee feedback,
                  respond to reviews, and build your employer brand.
                </p>
              </div>

              <Card>
                <CardHeader>
                  <CardTitle className="text-black">Company Claim Request</CardTitle>
                  <CardDescription className="text-black/60">
                    Please provide your details below. We'll verify your identity with your company before granting access.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                      {/* Main Fields */}
                      {mainFields.map(renderFormField)}

                      {/* Supervisor Contact (Optional) */}
                      {supervisorFields.length > 0 && (
                        <div className="border border-border rounded-lg p-4 space-y-4 bg-muted/30">
                          <div className="flex items-center gap-2 text-sm text-black/60">
                            <ShieldCheck className="h-4 w-4" />
                            <span>Optional: Provide supervisor/CEO contact for faster verification</span>
                          </div>
                          {supervisorFields.map(renderFormField)}
                        </div>
                      )}

                      {/* Authorization Confirmation */}
                      {authField && (
                        <FormField
                          control={form.control}
                          name="authorizationConfirmed"
                          render={({ field }) => (
                            <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-lg border border-border p-4 bg-primary/5">
                              <FormControl>
                                <Checkbox checked={field.value as boolean} onCheckedChange={field.onChange} />
                              </FormControl>
                              <div className="space-y-1 leading-none">
                                <FormLabel className="text-sm font-medium text-black">
                                  I confirm I am authorized to manage this company's employer brand *
                                </FormLabel>
                                <FormDescription className="text-xs text-black/60">
                                  By checking this box, you confirm that you have the authority from {(form.watch("companyName") as string) || "this company"} to claim and manage their Pachena page. Misrepresentation may result in account termination.
                                </FormDescription>
                                <FormMessage />
                              </div>
                            </FormItem>
                          )}
                        />
                      )}

                      <Button type="submit" size="lg" className="w-full" disabled={isSubmitting}>
                        {isSubmitting ? "Submitting..." : "Submit Claim Request"}
                      </Button>
                    </form>
                  </Form>
                </CardContent>
              </Card>
            </>
          )}
        </div>
      </section>

      <Footer />
    </div>
  );
}

export default function ClaimPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    }>
      <ClaimContent />
    </Suspense>
  );
}
