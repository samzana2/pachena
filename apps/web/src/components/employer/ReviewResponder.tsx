"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormMessage } from "@/components/ui/form";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import StarRating from "@/components/StarRating";
import { createBrowserSupabaseClient } from "@/lib/supabase/client";
import { toast } from "sonner";
import { Loader2, MessageSquare, Reply, CheckCircle } from "lucide-react";
const supabase = createBrowserSupabaseClient();

const responseSchema = z.object({
  response_text: z.string().min(10, "Response must be at least 10 characters").max(2000, "Response must be less than 2000 characters"),
});

type ResponseFormData = z.infer<typeof responseSchema>;

interface Review {
  id: string;
  rating: number;
  title: string | null;
  pros: string | null;
  cons: string | null;
  role_title: string | null;
  employment_status: string | null;
  created_at: string;
  response?: {
    id: string;
    response_text: string;
    created_at: string;
  } | null;
}

interface ReviewResponderProps {
  companyId: string;
  companyName: string;
}

const ReviewResponder = ({ companyId, companyName }: ReviewResponderProps) => {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedReview, setSelectedReview] = useState<Review | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<ResponseFormData>({
    resolver: zodResolver(responseSchema),
    defaultValues: { response_text: "" },
  });

  useEffect(() => {
    fetchReviews();
  }, [companyId]);

  const fetchReviews = async () => {
    setIsLoading(true);
    try {
      // Fetch reviews (using public view to exclude verification_token)
      const { data: reviewsData, error: reviewsError } = await supabase
        .from("reviews_public")
        .select("*")
        .eq("company_id", companyId)
        .order("created_at", { ascending: false });

      if (reviewsError) throw reviewsError;

      // Fetch responses for these reviews
      const reviewIds = (reviewsData?.map(r => r.id) || []).filter(Boolean) as string[];
      const { data: responsesData } = await supabase
        .from("review_responses")
        .select("*")
        .in("review_id", reviewIds);

      // Map responses to reviews
      const reviewsWithResponses = reviewsData?.map(review => ({
        ...review,
        response: responsesData?.find(r => r.review_id === review.id) || null,
      })) || [];

      setReviews(reviewsWithResponses as unknown as Review[]);
    } catch (error) {
      console.error("Error fetching reviews:", error);
      toast.error("Failed to load reviews");
    } finally {
      setIsLoading(false);
    }
  };

  const onSubmitResponse = async (data: ResponseFormData) => {
    if (!selectedReview) return;

    setIsSubmitting(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const { error } = await supabase
        .from("review_responses")
        .insert({
          review_id: selectedReview.id,
          company_id: companyId,
          responder_id: user.id,
          response_text: data.response_text,
        });

      if (error) throw error;

      toast.success("Response posted successfully!");
      setSelectedReview(null);
      form.reset();
      fetchReviews();
    } catch (error) {
      console.error("Error posting response:", error);
      toast.error("Failed to post response");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="py-12 flex justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </CardContent>
      </Card>
    );
  }

  if (reviews.length === 0) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <MessageSquare className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold text-foreground mb-2">No Reviews Yet</h3>
          <p className="text-muted-foreground">
            When employees leave reviews for {companyName}, they'll appear here for you to respond to.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Employee Reviews</CardTitle>
          <CardDescription>
            Respond to reviews from your employees. Your responses will be visible on your public company page.
          </CardDescription>
        </CardHeader>
      </Card>

      {reviews.map((review) => (
        <Card key={review.id}>
          <CardContent className="p-6">
            <div className="flex items-start justify-between mb-4">
              <div>
                <div className="flex items-center gap-3">
                  <span className="text-xl font-bold text-foreground">
                    {Number(review.rating).toFixed(1)}
                  </span>
                  <StarRating rating={Number(review.rating)} size="sm" />
                </div>
                <p className="mt-1 text-sm text-muted-foreground">
                  {review.role_title || "Anonymous"} • {review.employment_status === "current" ? "Current Employee" : "Former Employee"}
                </p>
                <p className="text-xs text-muted-foreground">
                  {new Date(review.created_at).toLocaleDateString()}
                </p>
              </div>
              {!review.response && (
                <Button variant="outline" size="sm" onClick={() => setSelectedReview(review)}>
                  <Reply className="h-4 w-4 mr-2" />
                  Respond
                </Button>
              )}
            </div>

            <p className="font-medium text-foreground mb-3">"{review.title}"</p>

            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <h4 className="text-sm font-medium text-foreground mb-1">Pros</h4>
                <p className="text-sm text-muted-foreground">{review.pros}</p>
              </div>
              <div>
                <h4 className="text-sm font-medium text-foreground mb-1">Cons</h4>
                <p className="text-sm text-muted-foreground">{review.cons}</p>
              </div>
            </div>

            {review.response && (
              <div className="mt-4 p-4 bg-secondary/50 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <CheckCircle className="h-4 w-4 text-primary" />
                  <span className="text-sm font-medium text-foreground">Employer Response</span>
                  <span className="text-xs text-muted-foreground">
                    • {new Date(review.response.created_at).toLocaleDateString()}
                  </span>
                </div>
                <p className="text-sm text-muted-foreground">{review.response.response_text}</p>
              </div>
            )}
          </CardContent>
        </Card>
      ))}

      {/* Response Dialog */}
      <Dialog open={!!selectedReview} onOpenChange={() => setSelectedReview(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Respond to Review</DialogTitle>
            <DialogDescription>
              Your response will be publicly visible on your company page. Keep it professional and constructive.
            </DialogDescription>
          </DialogHeader>

          {selectedReview && (
            <div className="p-4 bg-secondary/50 rounded-lg mb-4">
              <div className="flex items-center gap-2 mb-2">
                <StarRating rating={Number(selectedReview.rating)} size="sm" />
                <span className="text-sm text-muted-foreground">
                  {new Date(selectedReview.created_at).toLocaleDateString()}
                </span>
              </div>
              <p className="text-sm font-medium">"{selectedReview.title}"</p>
            </div>
          )}

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmitResponse)} className="space-y-4">
              <FormField
                control={form.control}
                name="response_text"
                render={({ field }) => (
                  <FormItem>
                    <FormControl>
                      <Textarea 
                        placeholder="Thank you for your feedback. We appreciate..."
                        className="min-h-[120px]"
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="flex justify-end gap-3">
                <Button type="button" variant="outline" onClick={() => setSelectedReview(null)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                  Post Response
                </Button>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ReviewResponder;
