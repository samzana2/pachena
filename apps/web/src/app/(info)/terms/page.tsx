import { Metadata } from "next";
import Header from "@/components/Header";
import Footer from "@/components/Footer";

export const metadata: Metadata = {
  title: "Terms of Service — Pachena",
  description:
    "Read Pachena's Terms of Service to understand your rights and obligations when using the platform.",
};

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="container py-16">
        <div className="mx-auto max-w-3xl">
          <h1 className="text-3xl md:text-4xl font-medium text-foreground">Terms of Service</h1>
          <p className="mt-4 text-muted-foreground">Last updated: 31 December 2025</p>

          <div className="mt-8 space-y-8 text-muted-foreground">
            <section>
              <h2 className="text-2xl font-medium text-foreground">1. Acceptance of Terms</h2>
              <p className="mt-4">
                By accessing or using Pachena (the "Platform"), you agree to be bound by these Terms of Service
                ("Terms"). If you do not agree, you may not access or use the Platform.
              </p>
              <p className="mt-4">
                These Terms form a legally binding agreement between you and Pachena.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-medium text-foreground">2. Description of Service</h2>
              <p className="mt-4">
                Pachena is an online platform that enables users to submit and access anonymous workplace
                reviews, ratings, and related content.
              </p>
              <p className="mt-4">
                Pachena provides an interactive computer service that hosts user-generated content. We do not
                create, develop, or endorse user-submitted reviews.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-medium text-foreground">3. Eligibility</h2>
              <p className="mt-4">
                You must be at least 18 years old to use the Platform. By using Pachena, you represent and
                warrant that you meet this requirement and have the legal capacity to enter into these Terms.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-medium text-foreground">4. No Account Requirement</h2>
              <p className="mt-4">
                Pachena does not require account creation to submit reviews. If accounts are introduced in
                the future, additional terms may apply.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-medium text-foreground">5. Acceptable Use</h2>
              <div className="mt-4 space-y-4">
                <p>You agree not to:</p>
                <ul className="list-disc space-y-2 pl-6">
                  <li>Submit false, misleading, or fabricated reviews</li>
                  <li>Post content you know to be defamatory or unlawful</li>
                  <li>Identify or attempt to identify anonymous reviewers</li>
                  <li>Harass, threaten, intimidate, or retaliate against users</li>
                  <li>Post confidential, proprietary, or trade secret information</li>
                  <li>Impersonate any person or entity</li>
                  <li>Use automated scraping tools without permission</li>
                  <li>Interfere with or disrupt Platform operations</li>
                  <li>Violate any applicable laws</li>
                </ul>
                <p>You are solely responsible for your conduct and submitted content.</p>
              </div>
            </section>

            <section>
              <h2 className="text-2xl font-medium text-foreground">6. User Content</h2>
              <div className="mt-4 space-y-4">
                <div>
                  <h3 className="font-medium text-foreground">6.1 Ownership and License</h3>
                  <p className="mt-2">
                    You retain ownership of content you submit to Pachena.
                  </p>
                  <p className="mt-2">
                    By submitting content, you grant Pachena a non-exclusive, worldwide, royalty-free, perpetual,
                    irrevocable license to host, store, reproduce, display, distribute, format, and create
                    aggregated or anonymized derivatives of your content for purposes related to operating,
                    improving, promoting, and maintaining the Platform.
                  </p>
                  <p className="mt-2">
                    This license continues even if your access to the Platform is terminated.
                  </p>
                </div>
                <div>
                  <h3 className="font-medium text-foreground">6.2 Responsibility</h3>
                  <p className="mt-2">You represent and warrant that:</p>
                  <ul className="mt-2 list-disc space-y-2 pl-6">
                    <li>Your content reflects your genuine experience</li>
                    <li>You have the legal right to submit the content</li>
                    <li>Your content does not violate third-party rights</li>
                    <li>Your content complies with our Review Guidelines</li>
                  </ul>
                </div>
                <div>
                  <h3 className="font-medium text-foreground">6.3 Moderation and Removal</h3>
                  <p className="mt-2">
                    Pachena may remove, restrict visibility of, or decline to publish content that violates
                    these Terms, our Review Guidelines, or applicable law.
                  </p>
                  <p className="mt-2">
                    Pachena does not rewrite or materially alter user-submitted reviews.
                  </p>
                </div>
              </div>
            </section>

            <section>
              <h2 className="text-2xl font-medium text-foreground">7. Platform Neutrality</h2>
              <p className="mt-4">
                Reviews reflect the personal opinions of individual users.
              </p>
              <p className="mt-4">
                Pachena does not verify the accuracy of user-submitted content and does not endorse any
                employer or review.
              </p>
              <p className="mt-4">
                To the fullest extent permitted by law, Pachena shall not be treated as the publisher or
                speaker of user-generated content.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-medium text-foreground">8. Intellectual Property</h2>
              <p className="mt-4">
                All Platform design, software, trademarks, and proprietary materials are owned by Pachena.
              </p>
              <p className="mt-4">
                You may not reproduce, distribute, modify, or create derivative works from Platform materials
                without written permission.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-medium text-foreground">9. Disclaimer of Warranties</h2>
              <p className="mt-4">
                THE PLATFORM IS PROVIDED "AS IS" AND "AS AVAILABLE."
              </p>
              <p className="mt-4">
                WE DISCLAIM ALL WARRANTIES, EXPRESS OR IMPLIED, INCLUDING MERCHANTABILITY, FITNESS FOR A
                PARTICULAR PURPOSE, AND NON-INFRINGEMENT.
              </p>
              <p className="mt-4">
                WE DO NOT GUARANTEE THE ACCURACY OR RELIABILITY OF USER CONTENT.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-medium text-foreground">10. Limitation of Liability</h2>
              <p className="mt-4">
                TO THE MAXIMUM EXTENT PERMITTED BY LAW, PACHENA SHALL NOT BE LIABLE FOR INDIRECT, INCIDENTAL,
                CONSEQUENTIAL, SPECIAL, OR PUNITIVE DAMAGES.
              </p>
              <p className="mt-4">
                IN NO EVENT SHALL PACHENA'S TOTAL LIABILITY EXCEED $100 USD OR THE AMOUNT YOU PAID TO USE THE
                PLATFORM IN THE PREVIOUS TWELVE MONTHS, WHICHEVER IS GREATER.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-medium text-foreground">11. Indemnification</h2>
              <p className="mt-4">
                You agree to indemnify and hold harmless Pachena and its officers, directors, employees, and
                agents from any claims, damages, or legal expenses arising from:
              </p>
              <ul className="mt-4 list-disc space-y-2 pl-6">
                <li>Content you submit</li>
                <li>Your violation of these Terms</li>
                <li>Your violation of third-party rights</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-medium text-foreground">12. Termination</h2>
              <p className="mt-4">
                We may suspend or terminate access to the Platform at any time for violation of these Terms
                or applicable law.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-medium text-foreground">13. Dispute Resolution & Arbitration</h2>
              <p className="mt-4">
                Any dispute arising from these Terms or use of the Platform shall be resolved through binding
                arbitration administered in Delaware, United States, except where prohibited by law.
              </p>
              <p className="mt-4">
                You waive the right to participate in a class action lawsuit or class-wide arbitration.
              </p>
              <p className="mt-4">
                Nothing in this section prevents Pachena from seeking injunctive relief in a court of
                competent jurisdiction.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-medium text-foreground">14. Governing Law</h2>
              <p className="mt-4">
                These Terms are governed by the laws of the State of Delaware, United States, without regard
                to conflict of law principles.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-medium text-foreground">15. Severability</h2>
              <p className="mt-4">
                If any provision is found unenforceable, the remaining provisions remain in effect.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-medium text-foreground">16. Entire Agreement</h2>
              <p className="mt-4">
                These Terms, together with our Privacy Policy, Review Guidelines, and Moderation Policy,
                constitute the entire agreement between you and Pachena.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-medium text-foreground">17. Changes to Terms</h2>
              <p className="mt-4">
                We may update these Terms at any time. Continued use of the Platform after updates
                constitutes acceptance.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-medium text-foreground">18. Contact</h2>
              <p className="mt-4">
                Email: <a href="mailto:hello@pachena.co" className="text-foreground hover:underline">hello@pachena.co</a>
              </p>
            </section>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
