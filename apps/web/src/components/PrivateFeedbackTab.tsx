"use client";

import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { createBrowserSupabaseClient } from "@/lib/supabase/client";
import { Lock, MessageSquare, Loader2 } from "lucide-react";
const supabase = createBrowserSupabaseClient();

interface PrivateFeedbackTabProps {
  companyId: string;
  companyName: string;
  isClaimed: boolean;
}

interface FeedbackItem {
  id: string;
  title: string;
  content: string;
  created_at: string;
}

const PrivateFeedbackTab = ({ companyId, companyName, isClaimed }: PrivateFeedbackTabProps) => {
  const [feedback, setFeedback] = useState<FeedbackItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [hasAccess, setHasAccess] = useState(false);

  useEffect(() => {
    checkAccessAndFetchFeedback();
  }, [companyId]);

  const checkAccessAndFetchFeedback = async () => {
    setIsLoading(true);
    
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        setHasAccess(false);
        setIsLoading(false);
        return;
      }

      // Check if user is the verified employer for this company
      const { data: companyData } = await supabase
        .from("companies")
        .select("claimed_by, is_claimed")
        .eq("id", companyId)
        .single();

      if (companyData?.is_claimed && companyData?.claimed_by === user.id) {
        setHasAccess(true);
        
        // Fetch private feedback
        const { data: feedbackData } = await supabase
          .from("employer_feedback")
          .select("*")
          .eq("company_id", companyId)
          .order("created_at", { ascending: false });

        setFeedback(feedbackData || []);
      } else {
        setHasAccess(false);
      }
    } catch (error) {
      console.error("Error checking access:", error);
      setHasAccess(false);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <Card className="animate-fade-in">
        <CardContent className="py-12 flex justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </CardContent>
      </Card>
    );
  }

  // Verified employer view - show received feedback
  if (hasAccess) {
    return (
      <div className="space-y-4 animate-fade-in">
        <Card>
          <CardContent className="p-6">
            <h2 className="text-lg font-semibold text-foreground flex items-center gap-2">
              <MessageSquare className="h-5 w-5" />
              Private Employee Feedback
            </h2>
            <p className="mt-2 text-sm text-muted-foreground">
              Anonymous feedback from employees. No identifying information is shown.
            </p>
          </CardContent>
        </Card>

        {feedback.length > 0 ? (
          feedback.map((item) => (
            <Card key={item.id}>
              <CardContent className="p-6">
                <div className="flex items-start justify-between mb-3">
                  <h3 className="font-medium text-foreground">{item.title}</h3>
                  <span className="text-xs text-muted-foreground">
                    {new Date(item.created_at).toLocaleDateString()}
                  </span>
                </div>
                <p className="text-sm text-muted-foreground">{item.content}</p>
              </CardContent>
            </Card>
          ))
        ) : (
          <Card>
            <CardContent className="py-12 text-center">
              <MessageSquare className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">
                No private feedback yet. Employees can submit private messages when writing reviews.
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    );
  }

  // Non-employer view - show info about the feature
  return (
    <Card className="animate-fade-in">
      <CardContent className="py-12 text-center">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-muted mb-6">
          <Lock className="h-8 w-8 text-muted-foreground" />
        </div>
        <h3 className="text-lg font-semibold text-foreground mb-2">
          Private Feedback
        </h3>
        <p className="text-muted-foreground max-w-md mx-auto">
          In a future update, employees will be able to send private, anonymous messages to {companyName} when submitting their reviews. 
          Only the company's claimed employer will be able to view these messages.
        </p>
      </CardContent>
    </Card>
  );
};

export default PrivateFeedbackTab;
