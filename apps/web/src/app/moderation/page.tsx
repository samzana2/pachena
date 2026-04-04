import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Card, CardContent } from "@/components/ui/card";
import { Shield, Eye, FileEdit, Users } from "lucide-react";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Moderation Policy | Pachena",
  description:
    "Learn how Pachena moderates user-submitted content to protect reviewer anonymity, maintain platform integrity, and ensure compliance with applicable laws.",
};

export default function ModerationPage() {
  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="container py-16">
        <div className="mx-auto max-w-3xl">
          <h1 className="text-3xl md:text-4xl font-medium text-black">Moderation Policy</h1>
          <p className="mt-2 text-sm text-black/60">Last updated: 22 February 2026</p>

          <div className="mt-8 space-y-8">
            {/* Section 1: Purpose */}
            <section>
              <h2 className="text-2xl font-medium text-black">1. Purpose</h2>
              <p className="mt-4 text-black/70">
                Pachena is committed to maintaining a platform that promotes responsible workplace transparency.
              </p>
              <p className="mt-3 text-black/70">
                This Moderation Policy explains how Pachena evaluates, publishes, restricts, or removes
                user-submitted content in order to:
              </p>
              <ul className="mt-3 list-disc space-y-2 pl-6 text-black/70">
                <li>Protect reviewer anonymity</li>
                <li>Reduce legal and safety risks</li>
                <li>Maintain platform integrity</li>
                <li>Ensure compliance with applicable laws</li>
              </ul>
              <p className="mt-4 text-black/70">
                Pachena operates as a neutral platform for user-generated content and does not endorse
                or verify the accuracy of individual reviews.
              </p>
            </section>

            {/* Empathetic icon cards */}
            <div className="grid gap-6 md:grid-cols-2">
              <Card>
                <CardContent className="pt-6">
                  <Shield className="h-8 w-8 text-primary" />
                  <h3 className="mt-4 text-lg font-medium text-black">Human Oversight</h3>
                  <p className="mt-2 text-black/70">
                    All moderation decisions, including any content restrictions, are reviewed and approved
                    by a human moderator. We maintain internal audit logs to ensure accountability.
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="pt-6">
                  <Eye className="h-8 w-8 text-primary" />
                  <h3 className="mt-4 text-lg font-medium text-black">Privacy First</h3>
                  <p className="mt-2 text-black/70">
                    We never share reviewer identity with employers, even when content is flagged
                    or removed. Employer requests for reviewer identification will be denied.
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="pt-6">
                  <FileEdit className="h-8 w-8 text-primary" />
                  <h3 className="mt-4 text-lg font-medium text-black">Redaction, Not Editing</h3>
                  <p className="mt-2 text-black/70">
                    We do not rewrite reviews or change their meaning. In limited cases, specific
                    portions may be restricted to protect privacy, replaced with &ldquo;[redacted]&rdquo;.
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="pt-6">
                  <Users className="h-8 w-8 text-primary" />
                  <h3 className="mt-4 text-lg font-medium text-black">Independence</h3>
                  <p className="mt-2 text-black/70">
                    Companies may not request removal of reviews solely because they are negative.
                    Strong criticism based on genuine experience is allowed.
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Section 2: Scope */}
            <section>
              <h2 className="text-2xl font-medium text-black">2. Scope</h2>
              <p className="mt-4 text-black/70">This policy applies to:</p>
              <ul className="mt-3 list-disc space-y-2 pl-6 text-black/70">
                <li>Employer reviews</li>
                <li>Ratings and salary submissions</li>
                <li>Interview insights</li>
                <li>Employer responses (when available)</li>
                <li>Any other user-generated content on the Platform</li>
              </ul>
            </section>

            {/* Section 3: Moderation Principles */}
            <section>
              <h2 className="text-2xl font-medium text-black">3. Moderation Principles</h2>
              <p className="mt-4 text-black/70">
                Our moderation decisions are guided by the following principles:
              </p>

              <h3 className="mt-6 text-lg font-medium text-black">3.1 Neutrality</h3>
              <p className="mt-2 text-black/70">
                Pachena does not take sides in employment disputes. Reviews are evaluated based on
                compliance with Platform policies, not on whether feedback is positive or negative.
              </p>

              <h3 className="mt-6 text-lg font-medium text-black">3.2 Consistency</h3>
              <p className="mt-2 text-black/70">
                All reviews — regardless of verification status — are evaluated under the same content standards.
              </p>

              <h3 className="mt-6 text-lg font-medium text-black">3.3 Proportionality</h3>
              <p className="mt-2 text-black/70">
                Where possible, we may restrict visibility of specific portions of content that violate
                policy rather than removing entire reviews.
              </p>

              <h3 className="mt-6 text-lg font-medium text-black">3.4 Legal Risk Awareness</h3>
              <p className="mt-2 text-black/70">
                We may restrict or remove content that presents heightened legal risk, including
                potentially defamatory or unlawful statements.
              </p>
            </section>

            {/* Section 4: Review Process */}
            <section>
              <h2 className="text-2xl font-medium text-black">4. Review Process</h2>
              <p className="mt-4 text-black/70">
                Content submitted to Pachena may undergo:
              </p>
              <ul className="mt-3 list-disc space-y-2 pl-6 text-black/70">
                <li>Automated screening for spam, abuse, and policy violations</li>
                <li>Manual review where necessary</li>
                <li>Additional review if flagged by users or employers</li>
              </ul>
              <p className="mt-4 text-black/70">
                Moderation decisions are made based on Pachena&apos;s Terms of Service, Review Guidelines,
                and applicable law.
              </p>
              <p className="mt-3 text-black/70 font-medium">
                Pachena does not rewrite or materially alter user-submitted content.
              </p>
            </section>

            {/* Section 5: Content That May Be Rejected or Restricted */}
            <section>
              <h2 className="text-2xl font-medium text-black">5. Content That May Be Rejected or Restricted</h2>
              <p className="mt-4 text-black/70">
                Content may be rejected, removed, or restricted if it includes:
              </p>
              <ul className="mt-3 list-disc space-y-2 pl-6 text-black/70">
                <li>Personal identification of specific individuals</li>
                <li>Confidential, proprietary, or trade secret information</li>
                <li>Unsubstantiated allegations of criminal or illegal conduct</li>
                <li>Threats, harassment, or discriminatory language</li>
                <li>Spam or promotional material</li>
                <li>Fabricated or misleading content</li>
                <li>Attempts to identify anonymous reviewers</li>
                <li>Content that creates unreasonable legal or safety risk</li>
              </ul>
              <p className="mt-4 text-black/70">
                Pachena reserves the right to remove or restrict visibility of content at its discretion.
              </p>
            </section>

            {/* Section 6: Employer Flagging */}
            <section>
              <h2 className="text-2xl font-medium text-black">6. Employer Flagging</h2>
              <p className="mt-4 text-black/70">
                Employers and users may flag reviews they believe violate Platform policies.
              </p>
              <ul className="mt-3 list-disc space-y-2 pl-6 text-black/70">
                <li>Flagging does not guarantee removal.</li>
                <li>Flagged content will be evaluated under the same standards applied to all submissions.</li>
                <li>Pachena does not remove content solely because an employer disagrees with it.</li>
              </ul>
            </section>

            {/* Section 7: Review of Moderation Decisions */}
            <section>
              <h2 className="text-2xl font-medium text-black">7. Review of Moderation Decisions</h2>
              <p className="mt-4 text-black/70">
                Because Pachena does not create persistent reviewer accounts and does not retain
                identifying information for anonymous submissions, we are generally unable to verify
                authorship of removed content.
              </p>
              <p className="mt-3 text-black/70">
                For this reason, Pachena does not offer a formal appeals process for anonymous reviews.
              </p>
              <p className="mt-3 text-black/70">
                Users may contact{" "}
                <a href="mailto:hello@pachena.co" className="text-primary underline underline-offset-2 hover:text-primary/80">
                  hello@pachena.co
                </a>{" "}
                if they believe a moderation decision was made in error. We may review such inquiries
                at our discretion but are not obligated to reinstate removed content.
              </p>
              <p className="mt-3 text-black/70">
                Moderation decisions are made in accordance with our Terms of Service, Review Guidelines,
                and applicable law.
              </p>
            </section>

            {/* Section 8: Legal and Safety Removals */}
            <section>
              <h2 className="text-2xl font-medium text-black">8. Legal and Safety Removals</h2>
              <p className="mt-4 text-black/70">
                Pachena may remove or restrict content if:
              </p>
              <ul className="mt-3 list-disc space-y-2 pl-6 text-black/70">
                <li>Required by law or court order</li>
                <li>Necessary to comply with legal obligations</li>
                <li>Content presents significant legal, reputational, or safety risk</li>
                <li>Continued publication could expose Pachena or users to harm</li>
              </ul>
              <p className="mt-4 text-black/70">
                We may also temporarily restrict content while evaluating legal concerns.
              </p>
            </section>

            {/* Section 9: Repeat Abuse or Platform Manipulation */}
            <section>
              <h2 className="text-2xl font-medium text-black">9. Repeat Abuse or Platform Manipulation</h2>
              <p className="mt-4 text-black/70">
                Pachena may implement technical restrictions, including IP-based rate limiting or
                access limitations, to prevent:
              </p>
              <ul className="mt-3 list-disc space-y-2 pl-6 text-black/70">
                <li>Coordinated review manipulation</li>
                <li>Spam campaigns</li>
                <li>Automated scraping</li>
                <li>Retaliatory posting behavior</li>
              </ul>
              <p className="mt-4 text-black/70">
                Such measures are designed to protect platform integrity.
              </p>
            </section>

            {/* Section 10: Policy Updates */}
            <section>
              <h2 className="text-2xl font-medium text-black">10. Policy Updates</h2>
              <p className="mt-4 text-black/70">
                We may update this Moderation Policy from time to time. Continued use of the Platform
                constitutes acceptance of any updates.
              </p>
            </section>

            {/* Our Commitment */}
            <section>
              <h2 className="text-2xl font-medium text-black">Our Commitment</h2>
              <p className="mt-4 text-black/70">
                Pachena aims to balance three priorities:
              </p>
              <ul className="mt-3 list-disc space-y-2 pl-6 text-black/70">
                <li>Protecting reviewer anonymity</li>
                <li>Reducing legal and defamation risk</li>
                <li>Preserving authentic workplace feedback</li>
              </ul>
              <p className="mt-4 text-black/70">
                We believe responsible moderation strengthens transparency rather than limiting it.
              </p>
            </section>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
