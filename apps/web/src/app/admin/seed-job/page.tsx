"use client";

import { useState, useCallback } from "react";
import AdminLayout from "@/components/admin/AdminLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { createBrowserSupabaseClient } from "@/lib/supabase/client";
import { Upload, FileText, Sparkles, ArrowLeft, ArrowRight, Check, Loader2 } from "lucide-react";

interface ExtractedJob {
  title: string;
  company_name: string | null;
  location: string | null;
  job_type: string | null;
  experience_level: string | null;
  description: string;
  requirements: string | null;
  responsibilities: string | null;
  department: string | null;
  salary_min: number | null;
  salary_max: number | null;
  salary_currency: string | null;
  is_remote: boolean | null;
  application_url: string | null;
}

type Step = "paste" | "review" | "done";

const supabase = createBrowserSupabaseClient();

const AdminSeedJob = () => {
  const [step, setStep] = useState<Step>("paste");
  const [rawText, setRawText] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [extracting, setExtracting] = useState(false);
  const [publishing, setPublishing] = useState(false);

  const [form, setForm] = useState<ExtractedJob>({
    title: "",
    company_name: null,
    location: null,
    job_type: "full-time",
    experience_level: null,
    description: "",
    requirements: null,
    responsibilities: null,
    department: null,
    salary_min: null,
    salary_max: null,
    salary_currency: "BWP",
    is_remote: false,
    application_url: null,
  });
  const [sourceUrl, setSourceUrl] = useState("");
  const [companyId, setCompanyId] = useState("");
  const [companies, setCompanies] = useState<{ id: string; name: string }[]>([]);
  const [companySearch, setCompanySearch] = useState("");

  const searchCompanies = useCallback(async (query: string) => {
    setCompanySearch(query);
    if (query.length < 2) { setCompanies([]); return; }
    const { data } = await supabase
      .from("companies")
      .select("id, name")
      .ilike("name", `%${query}%`)
      .limit(10);
    if (data) setCompanies(data);
  }, []);

  const extractFromText = async () => {
    if (!rawText.trim()) { toast.error("Please paste some text first"); return; }
    setExtracting(true);
    try {
      const { data, error } = await supabase.functions.invoke("extract-job-details", {
        body: { text: rawText },
      });
      if (error) throw error;
      if (data?.data) {
        setForm({ ...form, ...data.data });
        if (data.data.application_url) setSourceUrl(data.data.application_url);
        if (data.data.company_name) searchCompanies(data.data.company_name);
        setStep("review");
        toast.success("Job details extracted successfully");
      }
    } catch (e: any) {
      toast.error(e.message || "Extraction failed");
    } finally {
      setExtracting(false);
    }
  };

  const extractFromFile = async () => {
    if (!file) { toast.error("Please upload a file first"); return; }
    setExtracting(true);
    try {
      const reader = new FileReader();
      const base64 = await new Promise<string>((resolve, reject) => {
        reader.onload = () => {
          const result = reader.result as string;
          resolve(result.split(",")[1]);
        };
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });

      const { data, error } = await supabase.functions.invoke("extract-job-details", {
        body: { file_base64: base64, mime_type: file.type },
      });
      if (error) throw error;
      if (data?.data) {
        setForm({ ...form, ...data.data });
        if (data.data.application_url) setSourceUrl(data.data.application_url);
        if (data.data.company_name) searchCompanies(data.data.company_name);
        setStep("review");
        toast.success("Job details extracted from file");
      }
    } catch (e: any) {
      toast.error(e.message || "File extraction failed");
    } finally {
      setExtracting(false);
    }
  };

  const createCompanyIfNeeded = async (): Promise<string | null> => {
    if (companyId) return companyId;

    const name = companySearch.trim();
    if (!name) return null;

    const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
    const { data, error } = await supabase
      .from("companies")
      .insert({ name, slug })
      .select("id")
      .single();

    if (error) {
      if (error.code === "23505") {
        const { data: retry, error: retryErr } = await supabase
          .from("companies")
          .insert({ name, slug: `${slug}-${Date.now().toString(36)}` })
          .select("id")
          .single();
        if (retryErr) { toast.error("Failed to create company"); return null; }
        return retry.id;
      }
      toast.error("Failed to create company");
      return null;
    }
    return data.id;
  };

  const handlePublish = async () => {
    if (!form.title || !form.description) {
      toast.error("Title and description are required");
      return;
    }
    if (!companyId && !companySearch.trim()) {
      toast.error("Please enter a company name");
      return;
    }
    if (!sourceUrl.trim()) {
      toast.error("Source URL is required for seeded jobs");
      return;
    }

    setPublishing(true);
    try {
      const resolvedCompanyId = await createCompanyIfNeeded();
      if (!resolvedCompanyId) { setPublishing(false); return; }

      const { error } = await supabase.from("jobs").insert({
        title: form.title,
        description: form.description,
        company_id: resolvedCompanyId,
        location: form.location,
        job_type: form.job_type || "full-time",
        experience_level: form.experience_level,
        requirements: form.requirements,
        responsibilities: form.responsibilities,
        department: form.department,
        salary_min: form.salary_min,
        salary_max: form.salary_max,
        salary_currency: form.salary_currency,
        is_remote: form.is_remote,
        source_url: sourceUrl,
        source_type: "seeded",
        is_active: true,
      } as any);

      if (error) throw error;
      setStep("done");
      toast.success("Job published successfully!");
    } catch (e: any) {
      toast.error(e.message || "Failed to publish job");
    } finally {
      setPublishing(false);
    }
  };

  const handleFileDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const f = e.dataTransfer.files[0];
    if (f) setFile(f);
  };

  const resetForm = () => {
    setStep("paste");
    setRawText("");
    setFile(null);
    setSourceUrl("");
    setCompanyId("");
    setCompanies([]);
    setForm({
      title: "", company_name: null, location: null, job_type: "full-time",
      experience_level: null, description: "", requirements: null,
      responsibilities: null, department: null, salary_min: null,
      salary_max: null, salary_currency: "BWP", is_remote: false, application_url: null,
    });
  };

  return (
    <AdminLayout>
      <div className="max-w-3xl mx-auto space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Seed Job Posting</h1>
          <p className="text-sm text-muted-foreground">
            Paste text or upload an image/PDF of a job posting. AI will extract the details.
          </p>
        </div>

        {/* Step indicator */}
        <div className="flex items-center gap-2 text-sm">
          {["paste", "review", "done"].map((s, i) => (
            <div key={s} className="flex items-center gap-2">
              {i > 0 && <div className="w-8 h-px bg-border" />}
              <span
                className={`px-2.5 py-1 rounded-full text-xs font-medium ${
                  step === s ? "bg-foreground text-background" : "bg-muted text-muted-foreground"
                }`}
              >
                {i + 1}. {s.charAt(0).toUpperCase() + s.slice(1)}
              </span>
            </div>
          ))}
        </div>

        {/* Step 1: Paste */}
        {step === "paste" && (
          <div className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <FileText className="h-4 w-4" /> Paste Job Text
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Textarea
                  placeholder="Paste the full job posting text here..."
                  value={rawText}
                  onChange={(e) => setRawText(e.target.value)}
                  className="min-h-[200px]"
                />
                <Button
                  onClick={extractFromText}
                  disabled={extracting || !rawText.trim()}
                  className="mt-3"
                >
                  {extracting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Sparkles className="h-4 w-4 mr-2" />}
                  Extract from Text
                </Button>
              </CardContent>
            </Card>

            <div className="relative flex items-center justify-center">
              <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-border" /></div>
              <span className="relative bg-background px-3 text-xs text-muted-foreground uppercase">or</span>
            </div>

            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Upload className="h-4 w-4" /> Upload Image / PDF
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div
                  onDrop={handleFileDrop}
                  onDragOver={(e) => e.preventDefault()}
                  className="border-2 border-dashed border-border rounded-lg p-8 text-center cursor-pointer hover:border-muted-foreground transition-colors"
                  onClick={() => document.getElementById("file-upload")?.click()}
                >
                  <Upload className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
                  <p className="text-sm text-muted-foreground">
                    {file ? file.name : "Drag & drop or click to upload (PNG, JPG, WEBP, PDF)"}
                  </p>
                  <input
                    id="file-upload"
                    type="file"
                    accept="image/png,image/jpeg,image/webp,application/pdf"
                    className="hidden"
                    onChange={(e) => setFile(e.target.files?.[0] || null)}
                  />
                </div>
                <Button
                  onClick={extractFromFile}
                  disabled={extracting || !file}
                  className="mt-3"
                >
                  {extracting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Sparkles className="h-4 w-4 mr-2" />}
                  Extract from File
                </Button>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Step 2: Review/Edit */}
        {step === "review" && (
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Review & Edit Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="sm:col-span-2">
                  <Label>Job Title *</Label>
                  <Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
                </div>

                <div className="sm:col-span-2">
                  <Label>Company *</Label>
                  <Input
                    placeholder="Search for company..."
                    value={companySearch}
                    onChange={(e) => searchCompanies(e.target.value)}
                  />
                  {companies.length > 0 && !companyId && (
                    <div className="border border-border rounded-md mt-1 max-h-40 overflow-y-auto">
                      {companies.map((c) => (
                        <button
                          key={c.id}
                          className="w-full text-left px-3 py-2 text-sm hover:bg-muted transition-colors"
                          onClick={() => {
                            setCompanyId(c.id);
                            setCompanySearch(c.name);
                            setCompanies([]);
                          }}
                        >
                          {c.name}
                        </button>
                      ))}
                    </div>
                  )}
                  {companyId ? (
                    <p className="text-xs text-muted-foreground mt-1">
                      Selected: {companySearch}{" "}
                      <button className="underline" onClick={() => { setCompanyId(""); setCompanySearch(""); }}>
                        change
                      </button>
                    </p>
                  ) : companySearch.trim().length >= 2 && companies.length === 0 ? (
                    <p className="text-xs text-muted-foreground mt-1">
                      No match found — <span className="font-medium text-foreground">"{companySearch.trim()}"</span> will be created as a new company when you publish.
                    </p>
                  ) : null}
                </div>

                <div className="sm:col-span-2">
                  <Label>Source URL * (attribution link)</Label>
                  <Input
                    placeholder="https://..."
                    value={sourceUrl}
                    onChange={(e) => setSourceUrl(e.target.value)}
                  />
                </div>

                <div>
                  <Label>Location</Label>
                  <Input value={form.location || ""} onChange={(e) => setForm({ ...form, location: e.target.value })} />
                </div>

                <div>
                  <Label>Job Type</Label>
                  <Select value={form.job_type || "full-time"} onValueChange={(v) => setForm({ ...form, job_type: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="full-time">Full-time</SelectItem>
                      <SelectItem value="part-time">Part-time</SelectItem>
                      <SelectItem value="contract">Contract</SelectItem>
                      <SelectItem value="internship">Internship</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label>Experience Level</Label>
                  <Select value={form.experience_level || ""} onValueChange={(v) => setForm({ ...form, experience_level: v })}>
                    <SelectTrigger><SelectValue placeholder="Select..." /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="entry">Entry</SelectItem>
                      <SelectItem value="mid">Mid</SelectItem>
                      <SelectItem value="senior">Senior</SelectItem>
                      <SelectItem value="executive">Executive</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label>Department</Label>
                  <Input value={form.department || ""} onChange={(e) => setForm({ ...form, department: e.target.value })} />
                </div>

                <div>
                  <Label>Salary Min</Label>
                  <Input type="number" value={form.salary_min || ""} onChange={(e) => setForm({ ...form, salary_min: e.target.value ? Number(e.target.value) : null })} />
                </div>
                <div>
                  <Label>Salary Max</Label>
                  <Input type="number" value={form.salary_max || ""} onChange={(e) => setForm({ ...form, salary_max: e.target.value ? Number(e.target.value) : null })} />
                </div>

                <div>
                  <Label>Currency</Label>
                  <Input value={form.salary_currency || "BWP"} onChange={(e) => setForm({ ...form, salary_currency: e.target.value })} />
                </div>

                <div className="flex items-center gap-2 pt-5">
                  <Switch checked={form.is_remote || false} onCheckedChange={(v) => setForm({ ...form, is_remote: v })} />
                  <Label>Remote</Label>
                </div>

                <div className="sm:col-span-2">
                  <Label>Description *</Label>
                  <Textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} className="min-h-[120px]" />
                </div>

                <div className="sm:col-span-2">
                  <Label>Requirements</Label>
                  <Textarea value={form.requirements || ""} onChange={(e) => setForm({ ...form, requirements: e.target.value })} />
                </div>

                <div className="sm:col-span-2">
                  <Label>Responsibilities</Label>
                  <Textarea value={form.responsibilities || ""} onChange={(e) => setForm({ ...form, responsibilities: e.target.value })} />
                </div>
              </div>

              <div className="flex gap-3 pt-2">
                <Button variant="outline" onClick={() => setStep("paste")}>
                  <ArrowLeft className="h-4 w-4 mr-1" /> Back
                </Button>
                <Button onClick={handlePublish} disabled={publishing}>
                  {publishing ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <ArrowRight className="h-4 w-4 mr-2" />}
                  Publish Job
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Step 3: Done */}
        {step === "done" && (
          <Card>
            <CardContent className="py-12 text-center space-y-4">
              <div className="h-12 w-12 mx-auto rounded-full bg-green-100 flex items-center justify-center">
                <Check className="h-6 w-6 text-green-600" />
              </div>
              <h2 className="text-lg font-semibold text-foreground">Job Published!</h2>
              <p className="text-sm text-muted-foreground">
                The job is now live on the Pachena job board with a 30-day expiry.
              </p>
              <Button onClick={resetForm}>Seed Another Job</Button>
            </CardContent>
          </Card>
        )}
      </div>
    </AdminLayout>
  );
};

export default AdminSeedJob;
