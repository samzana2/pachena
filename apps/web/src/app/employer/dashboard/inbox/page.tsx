"use client";

import { useEffect, useState } from "react";
import { useEmployer } from "@/contexts/EmployerContext";
import { createBrowserSupabaseClient } from "@/lib/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Lock, Loader2, MessageSquare, ShieldCheck } from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";

const supabase = createBrowserSupabaseClient();

interface FeedbackItem {
  id: string;
  title: string;
  content: string;
  created_at: string;
}

const InboxPage = () => {
  const { company } = useEmployer();
  const [feedback, setFeedback] = useState<FeedbackItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  useEffect(() => {
    if (company?.id) {
      fetchFeedback();
    }
  }, [company?.id]);

  const fetchFeedback = async () => {
    if (!company?.id) return;

    try {
      const { data, error } = await supabase
        .from("employer_feedback")
        .select("id, title, content, created_at")
        .eq("company_id", company.id)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setFeedback(data || []);
    } catch (error) {
      console.error("Error fetching feedback:", error);
      toast.error("Failed to load feedback");
    } finally {
      setIsLoading(false);
    }
  };

  const selectedFeedback = feedback.find((f) => f.id === selectedId);

  if (!company) return null;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-heading font-bold text-foreground flex items-center gap-2">
          <Lock className="h-6 w-6" />
          Private Feedback Inbox
        </h1>
        <p className="text-muted-foreground mt-1">
          Anonymous feedback from employees (read-only)
        </p>
      </div>

      {/* Privacy Notice */}
      <Card className="border-primary/20 bg-primary/5">
        <CardContent className="p-4 flex items-start gap-3">
          <ShieldCheck className="h-5 w-5 text-primary shrink-0 mt-0.5" />
          <div>
            <p className="font-medium text-foreground text-sm">
              Privacy Protected
            </p>
            <p className="text-sm text-muted-foreground">
              All feedback is anonymous. Employee identities are never revealed.
              This is a read-only inbox — you cannot reply to feedback.
            </p>
          </div>
        </CardContent>
      </Card>

      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : feedback.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <MessageSquare className="h-12 w-12 text-muted-foreground/50 mx-auto mb-4" />
            <p className="text-muted-foreground">
              No private feedback received yet
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid lg:grid-cols-3 gap-6">
          {/* Feedback List */}
          <div className="lg:col-span-1 space-y-2">
            {feedback.map((item) => (
              <Card
                key={item.id}
                className={`cursor-pointer transition-colors ${
                  selectedId === item.id
                    ? "border-primary bg-primary/5"
                    : "hover:border-border"
                }`}
                onClick={() => setSelectedId(item.id)}
              >
                <CardContent className="p-4">
                  <p className="font-medium text-foreground text-sm truncate">
                    {item.title}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {format(new Date(item.created_at), "MMM d, yyyy")}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Feedback Detail */}
          <div className="lg:col-span-2">
            {selectedFeedback ? (
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center gap-2 mb-4">
                    <span className="text-sm text-muted-foreground">
                      {format(
                        new Date(selectedFeedback.created_at),
                        "MMMM d, yyyy"
                      )}
                    </span>
                  </div>
                  <h2 className="text-xl font-heading font-semibold text-foreground mb-4">
                    {selectedFeedback.title}
                  </h2>
                  <div className="prose prose-sm max-w-none">
                    <p className="text-foreground whitespace-pre-wrap">
                      {selectedFeedback.content}
                    </p>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <Card>
                <CardContent className="py-12 text-center">
                  <MessageSquare className="h-12 w-12 text-muted-foreground/50 mx-auto mb-4" />
                  <p className="text-muted-foreground">
                    Select feedback to view
                  </p>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default InboxPage;
