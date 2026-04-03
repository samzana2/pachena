"use client";

import { useRouter } from 'next/navigation';
import { Button } from "@/components/ui/button";
import { CheckCircle2, ExternalLink, Share2 } from "lucide-react";

interface ReviewSuccessPromptProps {
  companyName: string;
  companySlug?: string;
  submittedSections: string[];
  remainingSections: string[];
  onAddSection: (sectionType: string) => void;
}

function XIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="currentColor">
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
    </svg>
  );
}

export function ReviewSuccessPrompt({
  companySlug,
}: ReviewSuccessPromptProps) {
  const router = useRouter();

  return (
    <div className="max-w-lg mx-auto text-center space-y-8">
      {/* Success Icon & Title */}
      <div className="space-y-3">
        <div className="flex justify-center">
          <div className="h-16 w-16 rounded-full bg-green-100 flex items-center justify-center">
            <CheckCircle2 className="h-8 w-8 text-green-600" />
          </div>
        </div>
        <h2 className="text-2xl font-medium text-foreground">Thank you!</h2>
      </div>

      {/* Body text */}
      <div className="space-y-4 text-sm text-foreground leading-relaxed text-left">
        <p>
          Your review has been submitted successfully. Reviews are typically approved within 24–48 hours.
        </p>
        <p>
          If you don't see your review published after 48 hours, it may not have met our{" "}
          <a href="/guidelines" className="underline font-medium hover:text-primary">Review Guidelines</a>{" "}
          and we encourage you to submit a new review.
        </p>
        <p>
          Your contributions are helping bring more insights and transparency to the labour market, and are greatly appreciated.
        </p>
      </div>

      {/* Social follow */}
      <div className="space-y-3">
        <p className="text-sm font-medium text-foreground">
          Follow Pachena for workplace transparency updates.
        </p>
        <div className="flex justify-center gap-4">
          <a
            href="https://www.linkedin.com/company/pachena"
            target="_blank"
            rel="noopener noreferrer"
            className="h-10 w-10 rounded-full border border-border flex items-center justify-center text-muted-foreground hover:text-foreground hover:border-foreground transition-colors"
          >
            <ExternalLink className="h-4 w-4" />
          </a>
          <a
            href="https://www.instagram.com/pachenapachena"
            target="_blank"
            rel="noopener noreferrer"
            className="h-10 w-10 rounded-full border border-border flex items-center justify-center text-muted-foreground hover:text-foreground hover:border-foreground transition-colors"
          >
            <Share2 className="h-4 w-4" />
          </a>
          <a
            href="https://x.com/pachena"
            target="_blank"
            rel="noopener noreferrer"
            className="h-10 w-10 rounded-full border border-border flex items-center justify-center text-muted-foreground hover:text-foreground hover:border-foreground transition-colors"
          >
            <XIcon className="h-4 w-4" />
          </a>
          <a
            href="https://www.facebook.com/pachena.co"
            target="_blank"
            rel="noopener noreferrer"
            className="h-10 w-10 rounded-full border border-border flex items-center justify-center text-muted-foreground hover:text-foreground hover:border-foreground transition-colors"
          >
            <Share2 className="h-4 w-4" />
          </a>
        </div>
      </div>

      {/* Return button */}
      <Button
        className="w-full text-base py-3 bg-foreground text-background hover:bg-background hover:text-foreground border border-foreground"
        onClick={() => {
          sessionStorage.removeItem("review_session");
          sessionStorage.removeItem("review_completed_sections");
          router.push(companySlug ? `/company/${companySlug}` : "/companies");
        }}
      >
        Return to Company Page
      </Button>

    </div>
  );
}
