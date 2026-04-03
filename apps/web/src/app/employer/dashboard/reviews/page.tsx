"use client";

import { useEffect, useState } from "react";
import { useEmployer } from "@/contexts/EmployerContext";
import { createBrowserSupabaseClient } from "@/lib/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Star, MessageSquare, Loader2, Check, Clock } from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";

const supabase = createBrowserSupabaseClient();

interface Review {
  id: string;
  title: string;
  rating: number;
  pros: string;
  cons: string;
  role_title: string | null;
  created_at: string;
  response?: {
    id: string;
    response_text: string;
    created_at: string;
  };
}

const ReviewsPage = () => {
  const { company } = useEmployer();
  const [reviews, setReviews] = useState<Review[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "responded" | "unresponded">(
    "all"
  );
  const [selectedReview, setSelectedReview] = useState<Review | null>(null);
  const [responseText, setResponseText] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (company?.id) {
      fetchReviews();
    }
  }, [company?.id]);

  const fetchReviews = async () => {
    if (!company?.id) return;

    try {
      const { data: reviewsData, error: reviewsError } = await supabase
        .from("reviews")
        .select("id, title, rating, pros, cons, role_title, created_at")
        .eq("company_id", company.id)
        .eq("moderation_status", "approved")
        .order("created_at", { ascending: false });

      if (reviewsError) throw reviewsError;

      const { data: responsesData } = await supabase
        .from("review_responses")
        .select("id, review_id, response_text, created_at")
        .eq("company_id", company.id);

      const responseMap = new Map(responsesData?.map((r) => [r.review_id, r]));

      const reviewsWithResponses: Review[] = (reviewsData || []).map(
        (review) => ({
          ...review,
          response: responseMap.get(review.id) as Review["response"],
        })
      );

      setReviews(reviewsWithResponses);
    } catch (error) {
      console.error("Error fetching reviews:", error);
      toast.error("Failed to load reviews");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmitResponse = async () => {
    if (!selectedReview || !company?.id || !responseText.trim()) return;

    setIsSubmitting(true);
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session) {
        toast.error("Please log in to respond");
        return;
      }

      const { error } = await supabase.from("review_responses").insert({
        review_id: selectedReview.id,
        company_id: company.id,
        responder_id: session.user.id,
        response_text: responseText.trim(),
      });

      if (error) throw error;

      toast.success("Response submitted successfully");
      setSelectedReview(null);
      setResponseText("");
      fetchReviews();
    } catch (error) {
      console.error("Error submitting response:", error);
      toast.error("Failed to submit response");
    } finally {
      setIsSubmitting(false);
    }
  };

  const filteredReviews = reviews.filter((review) => {
    if (filter === "responded") return !!review.response;
    if (filter === "unresponded") return !review.response;
    return true;
  });

  const respondedCount = reviews.filter((r) => r.response).length;
  const unrespondedCount = reviews.length - respondedCount;

  if (!company) return null;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-heading font-bold text-foreground">
          Reviews
        </h1>
        <p className="text-muted-foreground mt-1">
          View and respond to employee reviews
        </p>
      </div>

      {/* Stats */}
      <div className="flex gap-4">
        <Card className="flex-1">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
              <MessageSquare className="h-5 w-5 text-foreground" />
            </div>
            <div>
              <p className="text-2xl font-heading font-bold">{reviews.length}</p>
              <p className="text-sm text-muted-foreground">Total Reviews</p>
            </div>
          </CardContent>
        </Card>
        <Card className="flex-1">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-green-500/10 flex items-center justify-center">
              <Check className="h-5 w-5 text-green-600" />
            </div>
            <div>
              <p className="text-2xl font-heading font-bold">{respondedCount}</p>
              <p className="text-sm text-muted-foreground">Responded</p>
            </div>
          </CardContent>
        </Card>
        <Card className="flex-1">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-amber-500/10 flex items-center justify-center">
              <Clock className="h-5 w-5 text-amber-600" />
            </div>
            <div>
              <p className="text-2xl font-heading font-bold">{unrespondedCount}</p>
              <p className="text-sm text-muted-foreground">Awaiting Response</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filter */}
      <div className="flex items-center gap-4">
        <Select
          value={filter}
          onValueChange={(v) => setFilter(v as typeof filter)}
        >
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Filter reviews" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Reviews</SelectItem>
            <SelectItem value="responded">Responded</SelectItem>
            <SelectItem value="unresponded">Awaiting Response</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Reviews List */}
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : filteredReviews.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <MessageSquare className="h-12 w-12 text-muted-foreground/50 mx-auto mb-4" />
            <p className="text-muted-foreground">No reviews to display</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {filteredReviews.map((review) => (
            <Card key={review.id} className="overflow-hidden">
              <CardContent className="p-6">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="flex items-center gap-1">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <Star
                            key={star}
                            className={`h-4 w-4 ${
                              star <= review.rating
                                ? "text-amber-500 fill-amber-500"
                                : "text-muted-foreground/30"
                            }`}
                          />
                        ))}
                      </div>
                      <span className="text-sm text-muted-foreground">
                        {format(new Date(review.created_at), "MMM d, yyyy")}
                      </span>
                      {review.role_title && (
                        <Badge variant="secondary" className="text-xs">
                          {review.role_title}
                        </Badge>
                      )}
                      <Badge
                        variant={review.response ? "default" : "outline"}
                        className="text-xs"
                      >
                        {review.response ? "Responded" : "Awaiting Response"}
                      </Badge>
                    </div>

                    <h3 className="font-heading font-semibold text-foreground mb-3">
                      {review.title}
                    </h3>

                    <div className="space-y-2 text-sm">
                      <div>
                        <span className="font-medium text-green-600">
                          Pros:{" "}
                        </span>
                        <span className="text-muted-foreground">
                          {review.pros}
                        </span>
                      </div>
                      <div>
                        <span className="font-medium text-red-600">
                          Cons:{" "}
                        </span>
                        <span className="text-muted-foreground">
                          {review.cons}
                        </span>
                      </div>
                    </div>

                    {review.response && (
                      <div className="mt-4 p-4 bg-muted/50 rounded-lg border">
                        <p className="text-xs font-medium text-muted-foreground mb-2">
                          Employer Response •{" "}
                          {format(
                            new Date(review.response.created_at),
                            "MMM d, yyyy"
                          )}
                        </p>
                        <p className="text-sm text-foreground">
                          {review.response.response_text}
                        </p>
                      </div>
                    )}
                  </div>

                  {!review.response && (
                    <Button
                      onClick={() => {
                        setSelectedReview(review);
                        setResponseText("");
                      }}
                    >
                      Respond
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Response Dialog */}
      <Dialog
        open={!!selectedReview}
        onOpenChange={() => setSelectedReview(null)}
      >
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Respond to Review</DialogTitle>
            <DialogDescription>
              Your response will be visible publicly on the review
            </DialogDescription>
          </DialogHeader>

          {selectedReview && (
            <div className="space-y-4">
              <div className="p-4 bg-muted/50 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <div className="flex items-center gap-0.5">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <Star
                        key={star}
                        className={`h-3 w-3 ${
                          star <= selectedReview.rating
                            ? "text-amber-500 fill-amber-500"
                            : "text-muted-foreground/30"
                        }`}
                      />
                    ))}
                  </div>
                  <span className="text-xs text-muted-foreground">
                    {format(new Date(selectedReview.created_at), "MMM d, yyyy")}
                  </span>
                </div>
                <p className="font-medium text-sm">{selectedReview.title}</p>
              </div>

              <div>
                <Textarea
                  value={responseText}
                  onChange={(e) => setResponseText(e.target.value)}
                  placeholder="Write your response here..."
                  rows={6}
                  className="resize-none"
                />
                <p className="text-xs text-muted-foreground mt-2">
                  Keep your response professional and constructive
                </p>
              </div>

              <div className="flex justify-end gap-3">
                <Button
                  variant="outline"
                  onClick={() => setSelectedReview(null)}
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleSubmitResponse}
                  disabled={!responseText.trim() || isSubmitting}
                >
                  {isSubmitting && (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  )}
                  Submit Response
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ReviewsPage;
