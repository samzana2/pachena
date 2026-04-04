"use client";

import { useRouter } from 'next/navigation';
import { Button } from "@/components/ui/button";
import { CheckCircle2 } from "lucide-react";

const LinkedinIcon = ({ className }: { className?: string }) => (
  <svg className={className} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
    <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 0 1-2.063-2.065 2.064 2.064 0 1 1 2.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
  </svg>
);

const InstagramIcon = ({ className }: { className?: string }) => (
  <svg className={className} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
    <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838a6.162 6.162 0 1 0 0 12.324 6.162 6.162 0 0 0 0-12.324zM12 16a4 4 0 1 1 0-8 4 4 0 0 1 0 8zm6.406-11.845a1.44 1.44 0 1 0 0 2.881 1.44 1.44 0 0 0 0-2.881z"/>
  </svg>
);

const FacebookIcon = ({ className }: { className?: string }) => (
  <svg className={className} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
  </svg>
);

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
            <LinkedinIcon className="h-4 w-4" />
          </a>
          <a
            href="https://www.instagram.com/pachenapachena"
            target="_blank"
            rel="noopener noreferrer"
            className="h-10 w-10 rounded-full border border-border flex items-center justify-center text-muted-foreground hover:text-foreground hover:border-foreground transition-colors"
          >
            <InstagramIcon className="h-4 w-4" />
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
            <FacebookIcon className="h-4 w-4" />
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
