"use client";

import { useState, useCallback } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import AdminLayout from "@/components/admin/AdminLayout";
import { createBrowserSupabaseClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { toast } from "sonner";
import { Upload, X, Loader2, CheckCircle2, XCircle, Image as ImageIcon } from "lucide-react";
import { format } from "date-fns";

const PLATFORMS = [
  { id: "twitter", label: "X / Twitter", maxChars: 280 },
  { id: "linkedin", label: "LinkedIn", maxChars: 3000 },
  { id: "instagram", label: "Instagram", maxChars: 2200 },
  { id: "facebook", label: "Facebook", maxChars: 63206 },
] as const;

type PlatformId = (typeof PLATFORMS)[number]["id"];

interface PlatformResult {
  status: "success" | "error";
  post_id?: string;
  error?: string;
}

interface SocialPost {
  id: string;
  caption: string;
  image_url: string;
  platforms: Record<string, PlatformResult>;
  posted_by: string | null;
  created_at: string;
}

const supabase = createBrowserSupabaseClient();

const AdminSocial = () => {
  const queryClient = useQueryClient();
  const [caption, setCaption] = useState("");
  const [selectedPlatforms, setSelectedPlatforms] = useState<Set<PlatformId>>(new Set(["twitter", "linkedin", "instagram", "facebook"]));
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isPosting, setIsPosting] = useState(false);

  const { data: posts = [], isLoading: postsLoading } = useQuery({
    queryKey: ["social-posts"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("social_posts" as any)
        .select("*")
        .order("created_at", { ascending: false })
        .limit(50);
      if (error) throw error;
      return (data || []) as unknown as SocialPost[];
    },
  });

  const handleImageSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      toast.error("Please select an image file");
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      toast.error("Image must be under 10MB");
      return;
    }
    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
  }, []);

  const clearImage = () => {
    setImageFile(null);
    if (imagePreview) URL.revokeObjectURL(imagePreview);
    setImagePreview(null);
  };

  const togglePlatform = (id: PlatformId) => {
    setSelectedPlatforms((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handlePost = async () => {
    if (!caption.trim()) {
      toast.error("Please enter a caption");
      return;
    }
    if (!imageFile) {
      toast.error("Please upload an image");
      return;
    }
    if (selectedPlatforms.size === 0) {
      toast.error("Please select at least one platform");
      return;
    }

    setIsPosting(true);
    try {
      const ext = imageFile.name.split(".").pop() || "jpg";
      const fileName = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
      const { error: uploadError } = await supabase.storage
        .from("social-media-images")
        .upload(fileName, imageFile, { contentType: imageFile.type });
      if (uploadError) throw new Error(`Image upload failed: ${uploadError.message}`);

      const { data: urlData } = supabase.storage
        .from("social-media-images")
        .getPublicUrl(fileName);
      const imageUrl = urlData.publicUrl;

      const { data, error } = await supabase.functions.invoke("publish-social-post", {
        body: {
          caption: caption.trim(),
          image_url: imageUrl,
          platforms: Array.from(selectedPlatforms),
        },
      });

      if (error) throw error;

      toast.success("Post published!");
      setCaption("");
      clearImage();
      queryClient.invalidateQueries({ queryKey: ["social-posts"] });
    } catch (err: any) {
      toast.error(err.message || "Failed to publish post");
    } finally {
      setIsPosting(false);
    }
  };

  const lowestMaxChars = Math.min(
    ...Array.from(selectedPlatforms).map(
      (id) => PLATFORMS.find((p) => p.id === id)?.maxChars || Infinity
    )
  );
  const isOverLimit = selectedPlatforms.size > 0 && caption.length > lowestMaxChars;

  return (
    <AdminLayout>
      <div className="space-y-8">
        <h1 className="text-2xl font-semibold">Social Media</h1>
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Compose Post</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Image Upload */}
            <div>
              <Label className="text-sm font-medium mb-2 block">Image</Label>
              {imagePreview ? (
                <div className="relative inline-block">
                  <img
                    src={imagePreview}
                    alt="Preview"
                    className="max-h-48 rounded-lg border border-border object-cover"
                  />
                  <button
                    onClick={clearImage}
                    className="absolute -top-2 -right-2 h-6 w-6 rounded-full bg-destructive text-destructive-foreground flex items-center justify-center"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </div>
              ) : (
                <label className="flex flex-col items-center justify-center w-full h-36 border-2 border-dashed border-border rounded-lg cursor-pointer hover:bg-muted/50 transition-colors">
                  <Upload className="h-8 w-8 text-muted-foreground mb-2" />
                  <span className="text-sm text-muted-foreground">Click to upload image</span>
                  <span className="text-xs text-muted-foreground mt-1">PNG, JPG, WEBP up to 10MB</span>
                  <input type="file" accept="image/*" className="hidden" onChange={handleImageSelect} />
                </label>
              )}
            </div>

            {/* Caption */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <Label className="text-sm font-medium">Caption</Label>
                <span className={`text-xs ${isOverLimit ? "text-destructive font-medium" : "text-muted-foreground"}`}>
                  {caption.length}
                  {selectedPlatforms.size > 0 && ` / ${lowestMaxChars}`}
                </span>
              </div>
              <Textarea
                value={caption}
                onChange={(e) => setCaption(e.target.value)}
                placeholder="Write your post caption..."
                className="min-h-[120px] resize-y"
              />
              {isOverLimit && (
                <p className="text-xs text-destructive mt-1">
                  Caption exceeds the character limit for{" "}
                  {Array.from(selectedPlatforms)
                    .filter((id) => caption.length > (PLATFORMS.find((p) => p.id === id)?.maxChars || Infinity))
                    .map((id) => PLATFORMS.find((p) => p.id === id)?.label)
                    .join(", ")}
                </p>
              )}
            </div>

            {/* Platforms */}
            <div>
              <Label className="text-sm font-medium mb-3 block">Platforms</Label>
              <div className="flex flex-wrap gap-4">
                {PLATFORMS.map((p) => (
                  <label key={p.id} className="flex items-center gap-2 cursor-pointer">
                    <Checkbox
                      checked={selectedPlatforms.has(p.id)}
                      onCheckedChange={() => togglePlatform(p.id)}
                    />
                    <span className="text-sm">{p.label}</span>
                    <span className="text-xs text-muted-foreground">({p.maxChars})</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Post Button */}
            <Button
              onClick={handlePost}
              disabled={isPosting || !caption.trim() || !imageFile || selectedPlatforms.size === 0 || isOverLimit}
              className="w-full sm:w-auto"
            >
              {isPosting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Publishing...
                </>
              ) : (
                "Publish Post"
              )}
            </Button>
          </CardContent>
        </Card>

        {/* Post History */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Post History</CardTitle>
          </CardHeader>
          <CardContent>
            {postsLoading ? (
              <div className="flex justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : posts.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">No posts yet</p>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-12">Image</TableHead>
                      <TableHead>Caption</TableHead>
                      <TableHead>Platforms</TableHead>
                      <TableHead>Date</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {posts.map((post) => (
                      <TableRow key={post.id}>
                        <TableCell>
                          {post.image_url ? (
                            <img src={post.image_url} alt="" className="h-10 w-10 rounded object-cover" />
                          ) : (
                            <ImageIcon className="h-10 w-10 text-muted-foreground" />
                          )}
                        </TableCell>
                        <TableCell className="max-w-[300px] truncate text-sm">
                          {post.caption}
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-wrap gap-1">
                            {Object.entries(post.platforms || {}).map(([platform, result]) => {
                              const r = result as PlatformResult;
                              return (
                                <Badge
                                  key={platform}
                                  variant={r.status === "success" ? "default" : "destructive"}
                                  className="text-xs gap-1"
                                >
                                  {r.status === "success" ? (
                                    <CheckCircle2 className="h-3 w-3" />
                                  ) : (
                                    <XCircle className="h-3 w-3" />
                                  )}
                                  {platform}
                                </Badge>
                              );
                            })}
                          </div>
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground whitespace-nowrap">
                          {format(new Date(post.created_at), "MMM d, yyyy HH:mm")}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
};

export default AdminSocial;
