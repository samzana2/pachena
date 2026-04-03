"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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

interface RequestCompanyDialogProps {
  isOpen: boolean;
  onClose: () => void;
  initialCompanyName?: string;
}

import { LINKEDIN_INDUSTRIES as industries } from "@/lib/industries";
const supabase = createBrowserSupabaseClient();

export function RequestCompanyDialog({
  isOpen,
  onClose,
  initialCompanyName = "",
}: RequestCompanyDialogProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    company_name: initialCompanyName,
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
      // Don't fail the whole operation if email fails
    }

    setIsSubmitting(false);
    toast.success("Company request submitted successfully!");
    setFormData({
      company_name: "",
      industry: "",
      location: "",
      website: "",
      requester_email: "",
    });
    onClose();
  };

  const handleClose = () => {
    setFormData({
      company_name: "",
      industry: "",
      location: "",
      website: "",
      requester_email: "",
    });
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Request Company Addition</DialogTitle>
          <DialogDescription>
            Can't find the company you're looking for? Submit a request and we'll add it to Pachena.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
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

            <div className="grid gap-2">
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

            <div className="grid gap-2">
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

            <div className="grid gap-2">
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

            <div className="grid gap-2">
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
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={handleClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Submit Request
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
