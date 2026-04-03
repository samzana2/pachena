"use client";

import { useState } from "react";
import { MessageSquare, Flag } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { TraceCard } from "@/components/ui/trace-card";
import { Button } from "@/components/ui/button";
import StarRating from "@/components/StarRating";
import { ReportReviewDialog } from "@/components/ReportReviewDialog";
import { AccurateButton } from "@/components/AccurateButton";
import { createBrowserSupabaseClient } from "@/lib/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { extractEdgeFunctionError } from "@/lib/edge-function-errors";
const supabase = createBrowserSupabaseClient();

interface InterviewData {
  id: string;
  interview_experience_rating: number | null;
  interview_count: number | null;
  interview_difficulty: string | null;
  interview_description: string | null;
  interview_tips: string | null;
  created_at: string;
  helpful_count?: number | null;
}

interface InterviewExperienceSectionProps {
  interviews: InterviewData[];
  companyName: string;
  confirmedReviews: Set<string>;
  onConfirmed: (reviewId: string) => void;
  onCountIncremented?: (reviewId: string) => void;
}

export function InterviewExperienceSection({ interviews, companyName, confirmedReviews, onConfirmed, onCountIncremented }: InterviewExperienceSectionProps) {
  const [reportDialogReviewId, setReportDialogReviewId] = useState<string | null>(null);
  const [reportingReviewId, setReportingReviewId] = useState<string | null>(null);
  const { toast } = useToast();

  // Filter to only include interviews with actual data
  const validInterviews = interviews.filter(i => 
    i.interview_experience_rating || i.interview_difficulty || i.interview_description || i.interview_tips
  );

  const handleReportReview = async (reviewId: string, reason: string) => {
    setReportingReviewId(reviewId);
    try {
      const response = await supabase.functions.invoke('flag-review', {
        body: { reviewId, reason, section: 'interview' }
      });

      const errorMessage = await extractEdgeFunctionError(response);
      if (errorMessage) {
        throw new Error(errorMessage);
      }

      toast({
        title: "Report submitted",
        description: "Thank you for helping us maintain a trustworthy platform. Our team will review this content.",
      });
      
      setReportDialogReviewId(null);
    } catch (error: any) {
      console.error('Error reporting review:', error);
      toast({
        title: "Failed to submit report",
        description: error.message || "Please try again later.",
        variant: "destructive"
      });
    } finally {
      setReportingReviewId(null);
    }
  };

  if (validInterviews.length === 0) {
    return (
      <Card className="border border-black/5 shadow-sm">
        <CardContent className="p-6">
          <div className="text-center py-8">
            <MessageSquare className="h-12 w-12 mx-auto text-black/20 mb-4" />
            <h3 className="text-lg font-medium text-black mb-2">No Interview Experiences Yet</h3>
            <p className="text-sm text-black/60">
              Be the first to share your interview experience at {companyName}.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Calculate aggregate statistics
  const ratingsWithValue = validInterviews.filter(i => i.interview_experience_rating);
  const avgRating = ratingsWithValue.length > 0
    ? ratingsWithValue.reduce((sum, i) => sum + (i.interview_experience_rating || 0), 0) / ratingsWithValue.length
    : 0;

  const interviewsWithCount = validInterviews.filter(i => i.interview_count);
  const avgInterviewCount = interviewsWithCount.length > 0
    ? Math.round(interviewsWithCount.reduce((sum, i) => sum + (i.interview_count || 0), 0) / interviewsWithCount.length)
    : 0;

  // Calculate dominant difficulty
  const getDominantDifficulty = () => {
    const withDifficulty = validInterviews.filter(i => i.interview_difficulty);
    if (withDifficulty.length === 0) return null;
    const difficultyCount = {
      Easy: withDifficulty.filter(i => i.interview_difficulty === "Easy").length,
      Average: withDifficulty.filter(i => i.interview_difficulty === "Average").length,
      Difficult: withDifficulty.filter(i => i.interview_difficulty === "Difficult").length,
    };
    return Object.entries(difficultyCount).reduce((a, b) => a[1] >= b[1] ? a : b)[0];
  };

  const dominantDifficulty = getDominantDifficulty();

  // Get interviews with ratings, difficulty, descriptions or tips to show as individual cards
  const interviewsWithContent = validInterviews.filter(i => i.interview_experience_rating || i.interview_difficulty || i.interview_description || i.interview_tips);

  return (
    <div className="space-y-6">
      {/* Interview Overview Card */}
      <Card className="border border-black/5 shadow-sm">
        <CardContent className="p-6">
          <h2 className="text-lg font-medium text-black">Interview Overview</h2>
          
          {/* Rating with stars */}
          {ratingsWithValue.length > 0 && (
            <div className="mt-4 flex items-center gap-3">
              <span className="text-3xl font-bold text-black">{avgRating.toFixed(1)}</span>
              <StarRating rating={avgRating} size="md" />
            </div>
          )}
          
          <p className="mt-2 text-sm text-black/60">
            Based on {validInterviews.length} candidate{validInterviews.length > 1 ? 's' : ''} who shared their interview experience
          </p>

          <div className="mt-4 space-y-3">
            {interviewsWithCount.length > 0 && (
              <div className="flex items-center justify-between border-b border-border pb-3">
                <p className="font-medium text-black">Average Interview Rounds</p>
                <p className="text-black">{avgInterviewCount}</p>
              </div>
            )}
            {dominantDifficulty && (
              <div className="flex items-center justify-between">
                <p className="font-medium text-black">Interview Difficulty</p>
                <p className="text-black">{dominantDifficulty}</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Interview Reviews */}
      {interviewsWithContent.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-lg font-medium text-black">Interview Reviews</h2>
          {interviewsWithContent.map((interview) => (
            <TraceCard key={interview.id} className="border border-black/5 shadow-sm">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    {interview.interview_experience_rating && (
                      <>
                        <span className="text-xl font-bold text-black">
                          {Number(interview.interview_experience_rating).toFixed(1)}
                        </span>
                        <StarRating rating={Number(interview.interview_experience_rating)} size="sm" />
                      </>
                    )}
                    <span className="text-sm text-black/60">
                      {new Date(interview.created_at).toLocaleDateString()}
                    </span>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-black/60 hover:text-destructive"
                    onClick={() => setReportDialogReviewId(interview.id)}
                  >
                    <Flag className="h-4 w-4" />
                    <span className="ml-1 hidden sm:inline">Report</span>
                  </Button>
                </div>

                {interview.interview_description && (
                  <div className="mt-4">
                    <h4 className="font-medium text-black">Interview Experience</h4>
                    <p className="mt-1 text-sm text-black/70">"{interview.interview_description}"</p>
                  </div>
                )}

                {interview.interview_tips && (
                  <div className="mt-3">
                    <h4 className="font-medium text-black">Tips for Candidates</h4>
                    <p className="mt-1 text-sm text-black/70">"{interview.interview_tips}"</p>
                  </div>
                )}

                {/* Accurate confirmation button */}
                <AccurateButton
                  reviewId={interview.id}
                  helpfulCount={interview.helpful_count || 0}
                  confirmedReviews={confirmedReviews}
                  onConfirmed={onConfirmed}
                  onCountIncremented={onCountIncremented}
                />
              </CardContent>
            </TraceCard>
          ))}
        </div>
      )}

      {/* Report Dialog */}
      <ReportReviewDialog
        open={!!reportDialogReviewId}
        onOpenChange={(open) => !open && setReportDialogReviewId(null)}
        onSubmit={(reason) => reportDialogReviewId ? handleReportReview(reportDialogReviewId, reason) : Promise.resolve()}
        isLoading={!!reportingReviewId}
      />
    </div>
  );
}
