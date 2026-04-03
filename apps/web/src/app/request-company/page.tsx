"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { createBrowserSupabaseClient } from "@/lib/supabase/client";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import Link from "next/link";

import { LINKEDIN_INDUSTRIES as industries } from "@/lib/industries";

const RequestCompany = () => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [formData, setFormData] = useState({
    company_name: "",
    industry: "",
    location: "",
    website: "",
    requester_email: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.company_name.trim()) {
      toast.error("Company name is required");
      return;
    }

    if (!formData.website.trim()) {
      toast.error("Company website is required");
      return;
    }

    setIsSubmitting(true);

    const supabase = createBrowserSupabaseClient();

    const { error } = await supabase.from("company_requests").insert({
      company_name: formData.company_name.trim(),
      industry: formData.industry || null,
      location: formData.location.trim() || null,
      website: formData.website.trim() || null,
      requester_email: formData.requester_email.trim() || null,
    });

    if (error) {
      setIsSubmitting(false);
      toast.error("Failed to submit request. Please try again.");
      return;
    }

    // Send admin notification and confirmation email (always called, handles both)
    try {
      await supabase.functions.invoke("send-company-request-confirmation", {
        body: {
          email: formData.requester_email.trim() || undefined,
          company_name: formData.company_name.trim(),
          industry: formData.industry || undefined,
          location: formData.location.trim() || undefined,
          website: formData.website.trim() || undefined,
        },
      });
    } catch (emailError) {
      console.error("Failed to send notification emails:", emailError);
    }

    setIsSubmitting(false);
    setIsSubmitted(true);
    toast.success("Company request submitted successfully!");
  };

  if (isSubmitted) {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        <Header />
        <main className="flex-1 flex items-center justify-center px-4 py-16">
          <Card className="w-full max-w-md text-center">
            <CardHeader className="pb-4">
              <CardTitle className="text-2xl">Request Submitted!</CardTitle>
              <CardDescription className="text-base">
                Thank you for submitting your company request. We'll review it and add the company to Pachena soon.
                {formData.requester_email && (
                  <span className="block mt-2">
                    We'll notify you at <strong>{formData.requester_email}</strong> when the company is added.
                  </span>
                )}
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="flex flex-col gap-3">
                <Button asChild>
                  <Link href="/companies">Browse Companies</Link>
                </Button>
                <Button
                  variant="outline"
                  onClick={() => {
                    setIsSubmitted(false);
                    setFormData({
                      company_name: "",
                      industry: "",
                      location: "",
                      website: "",
                      requester_email: "",
                    });
                  }}
                >
                  Submit Another Request
                </Button>
              </div>
            </CardContent>
          </Card>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      <main className="flex-1 flex items-center justify-center px-4 py-16">
        <Card className="w-full max-w-lg">
          <CardHeader className="text-center pb-6">
            <CardTitle className="text-2xl">Request Company Addition</CardTitle>
            <CardDescription className="text-base">
              Can't find the company you're looking for? Submit a request and we'll add it to Pachena.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="space-y-2">
                <Label htmlFor="company_name">
                  Company Name <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="company_name"
                  value={formData.company_name}
                  onChange={(e) =>
                    setFormData({ ...formData, company_name: e.target.value })
                  }
                  placeholder="Enter company name"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="industry">Industry</Label>
                <Select
                  value={formData.industry}
                  onValueChange={(value) =>
                    setFormData({ ...formData, industry: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select industry" />
                  </SelectTrigger>
                  <SelectContent>
                    {industries.map((industry) => (
                      <SelectItem key={industry} value={industry}>
                        {industry}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="location">Location</Label>
                <Input
                  id="location"
                  value={formData.location}
                  onChange={(e) =>
                    setFormData({ ...formData, location: e.target.value })
                  }
                  placeholder="e.g., Harare, Zimbabwe"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="website">
                  Company Website <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="website"
                  type="text"
                  value={formData.website}
                  onChange={(e) =>
                    setFormData({ ...formData, website: e.target.value })
                  }
                  placeholder="example.com"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="requester_email">Your Email (optional)</Label>
                <Input
                  id="requester_email"
                  type="email"
                  value={formData.requester_email}
                  onChange={(e) =>
                    setFormData({ ...formData, requester_email: e.target.value })
                  }
                  placeholder="you@example.com"
                />
                <p className="text-xs text-muted-foreground">
                  We'll notify you when the company is added
                </p>
              </div>

              <div className="flex flex-col gap-3 pt-2">
                <Button type="submit" disabled={isSubmitting} className="w-full">
                  {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Submit Request
                </Button>
                <Button type="button" variant="outline" asChild className="w-full">
                  <Link href="/companies">Cancel</Link>
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </main>
      <Footer />
    </div>
  );
};

export default RequestCompany;
