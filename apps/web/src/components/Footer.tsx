"use client";

import Link from 'next/link';
import { ExternalLink, Share2 } from "lucide-react";
import { useFeatureFlags } from "@/hooks/useFeatureFlags";

const Footer = () => {
  const { isEnabled } = useFeatureFlags();

  return (
    <footer className="bg-hero">
      <div className="container py-12">
        {/* Logo row */}
        <div className="mb-8 flex items-center">
          <Link href="/" className="flex items-center gap-2 leading-none">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-brand">
              <span className="font-logo text-sm font-bold text-brand-foreground">P</span>
            </div>
            <span className="font-logo text-xl text-brand">Pachena</span>
          </Link>
        </div>

        {/* Links grid */}
        <div className="grid grid-cols-2 items-start gap-8 sm:grid-cols-4">
          <div>
            <h4 className="mb-4 text-sm font-semibold text-foreground">Pachena</h4>
            <nav aria-label="Pachena links">
              <ul className="space-y-2">
                <li>
                  <Link href="/about" className="text-sm text-muted-foreground hover:text-foreground">
                    About
                  </Link>
                </li>
                <li>
                  <Link href="/faq" className="text-sm text-muted-foreground hover:text-foreground">
                    FAQ
                  </Link>
                </li>
                <li>
                  <Link href="/contact" className="text-sm text-muted-foreground hover:text-foreground">
                    Contact
                  </Link>
                </li>
                <li className="flex gap-3 pt-1">
                  <a href="https://www.linkedin.com/company/pachena" target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-foreground"><ExternalLink className="h-4 w-4" /></a>
                  <a href="https://www.instagram.com/pachenapachena" target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-foreground"><Share2 className="h-4 w-4" /></a>
                  <a href="https://x.com/pachena" target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-foreground">
                    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="currentColor"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" /></svg>
                  </a>
                  <a href="https://www.facebook.com/pachena.co" target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-foreground"><Share2 className="h-4 w-4" /></a>
                </li>
              </ul>
            </nav>
          </div>

          <div>
            <h4 className="mb-4 text-sm font-semibold text-foreground">For Employees</h4>
            <nav aria-label="Employee links">
              <ul className="space-y-2">
                <li>
                  <Link href="/companies" className="text-sm text-muted-foreground hover:text-foreground">
                    Find Companies
                  </Link>
                </li>
                <li>
                  <Link href="/review" className="text-sm text-muted-foreground hover:text-foreground">
                    Leave a Review
                  </Link>
                </li>
                <li>
                  <Link href="/request-company" className="text-sm text-muted-foreground hover:text-foreground">
                    Request a Company
                  </Link>
                </li>
                <li>
                  <Link href="/guidelines" className="text-sm text-muted-foreground hover:text-foreground">
                    Review Guidelines
                  </Link>
                </li>
              </ul>
            </nav>
          </div>

          {isEnabled("employer_footer_section") ? (
            <div>
              <h4 className="mb-4 text-sm font-semibold text-foreground">For Employers</h4>
              <nav aria-label="Employer links">
                <ul className="space-y-2">
                  <li>
                    <Link href="/employers#how-employers-use-pachena" className="text-sm text-muted-foreground hover:text-foreground">
                      Why Pachena
                    </Link>
                  </li>
                  <li>
                    <Link href="/employers" className="text-sm text-muted-foreground hover:text-foreground">
                      Claim Your Company
                    </Link>
                  </li>
                </ul>
              </nav>
            </div>
          ) : (
            <div />
          )}

          <div>
            <h4 className="mb-4 text-sm font-semibold text-foreground">Legal</h4>
            <nav aria-label="Legal links">
              <ul className="space-y-2">
                <li>
                  <Link href="/privacy" className="text-sm text-muted-foreground hover:text-foreground">
                    Privacy Policy
                  </Link>
                </li>
                <li>
                  <Link href="/terms" className="text-sm text-muted-foreground hover:text-foreground">
                    Terms of Service
                  </Link>
                </li>
                <li>
                  <Link href="/moderation" className="text-sm text-muted-foreground hover:text-foreground">
                    Moderation Policy
                  </Link>
                </li>
              </ul>
            </nav>
          </div>
        </div>

        <div className="mt-8 pt-8 text-center">
          <p className="text-sm text-muted-foreground">
            © {new Date().getFullYear()} Pachena. Workplace transparency, for everyone.
          </p>
          <p className="mt-2 text-xs text-muted-foreground/70">
            *Pachena is an early-stage experimental platform for sharing anonymous workplace insights. All reviews are user-generated and moderated in good faith.
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
