import { Metadata } from "next";
import Header from "@/components/Header";
import Footer from "@/components/Footer";

export const metadata: Metadata = {
  title: "Privacy Policy — Pachena",
  description:
    "Pachena's Privacy Policy explains how we collect, process, use, and safeguard information when you use our employer review platform.",
};

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="container py-16">
        <div className="mx-auto max-w-3xl">
          <h1 className="text-3xl md:text-4xl font-medium text-black">Privacy Policy</h1>
          <p className="mt-4 text-black/60">Last updated: 21 February 2026</p>

          <div className="mt-8 space-y-8 text-black/70">
            <section>
              <h2 className="text-2xl font-medium text-black">1. Introduction</h2>
              <p className="mt-4">
                Pachena ("Pachena," "we," "our," or "us") is committed to protecting your privacy. This Privacy Policy
                explains how we collect, process, use, and safeguard information when you use our employer review platform.
              </p>
              <p className="mt-4">
               Pachena is designed with privacy at its core. No personal information is required to submit a review.
               All reviews are anonymous by design.
              </p>
              <p className="mt-4">
                By using Pachena, you consent to the practices described in this Privacy Policy.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-medium text-black">2. Information We Collect</h2>
              <div className="mt-4 space-y-6">
                <p>
                  Pachena is intentionally designed to collect only the minimum information necessary to operate
                  a trusted, anonymous review platform.
                </p>

                <div>
                  <h3 className="font-medium text-black">2.1 Review Submissions</h3>
                  <p className="mt-2">No account, email address, name, or personal information is required to submit a review. Reviews are fully anonymous — we do not collect or store any personally identifiable information from reviewers.</p>
                </div>

                <div>
                  <h3 className="font-medium text-black">2.2 Review Content</h3>
                  <p className="mt-2">When submitting a review, you may provide:</p>
                  <ul className="mt-2 list-disc pl-6 space-y-1">
                    <li>Ratings across workplace categories</li>
                    <li>Employment status (e.g., current or former employee)</li>
                    <li>Optional job title or department</li>
                    <li>Written feedback</li>
                  </ul>
                  <p className="mt-2">Reviews are published anonymously and do not include names or email addresses.</p>
                </div>

                <div>
                  <h3 className="font-medium text-black">2.3 Automatically Processed Information</h3>
                  <p className="mt-2">When you use Pachena, we may automatically process certain technical information, including:</p>
                  <ul className="mt-2 list-disc pl-6 space-y-1">
                    <li>Browser type and version</li>
                    <li>Device type and operating system</li>
                    <li>IP address</li>
                    <li>Pages visited and time spent on pages</li>
                    <li>Referring website</li>
                  </ul>
                  <p className="mt-2">
                    This information is used for security, fraud prevention, rate limiting, analytics, and platform improvement.
                  </p>
                  <p className="mt-2">
                    IP addresses and similar technical data are retained only as long as reasonably necessary for security
                    and operational purposes and are not intentionally associated with published review content.
                  </p>
                </div>
              </div>
            </section>

            <section>
              <h2 className="text-2xl font-medium text-black">3. How We Use Information</h2>
              <div className="mt-4 space-y-4">
                <p>We use information to:</p>
                <ul className="list-disc pl-6 space-y-1">
                  <li>Publish anonymous reviews and aggregated employer insights</li>
                  <li>Generate ratings and statistical summaries</li>
                  <li>Improve platform functionality and user experience</li>
                  <li>Detect fraud, abuse, or policy violations</li>
                  <li>Respond to inquiries or support requests</li>
                  <li>Comply with legal obligations</li>
                </ul>
                <p className="mt-2">We do not sell personal information.</p>
              </div>
            </section>

            <section>
              <h2 className="text-2xl font-medium text-black">4. Anonymity & Publication</h2>
              <div className="mt-4 space-y-4">
                <p>All reviews are published anonymously.</p>
                <p>
                  We do not publicly display reviewer identities. Employers and other users cannot access identifying
                  information about reviewers through the platform.
                </p>
                <p>
                  Pachena does not create persistent reviewer profiles or user accounts for review submission.
                </p>
              </div>
            </section>

            <section>
              <h2 className="text-2xl font-medium text-black">5. Data Retention</h2>
              <div className="mt-4 space-y-4">
                <p>We retain only the minimum data necessary to operate the platform:</p>
                <ul className="list-disc space-y-2 pl-6">
                  <li>
                    <strong className="text-black">Review content:</strong> Retained in anonymized form for as long as
                    necessary to operate the platform, unless removed in accordance with our policies.
                  </li>
                  <li>
                    <strong className="text-black">Technical logs:</strong> Retained only as long as reasonably necessary
                    for security and operational purposes.
                  </li>
                  <li>
                    <strong className="text-black">Support communications:</strong> Retained for up to two (2) years.
                  </li>
                </ul>
              </div>
            </section>

            <section>
              <h2 className="text-2xl font-medium text-black">6. Third-Party Service Providers</h2>
              <div className="mt-4 space-y-4">
                <p>
                  We use trusted third-party service providers to operate Pachena, including hosting and email delivery providers.
                </p>
                <p>
                  These providers process information solely to perform services on our behalf and are not authorized
                  to use information for unrelated purposes.
                </p>
                <p>
                  We select service providers that maintain appropriate privacy and security safeguards.
                </p>
              </div>
            </section>

            <section>
              <h2 className="text-2xl font-medium text-black">7. Cookies and Tracking Technologies</h2>
              <div className="mt-4 space-y-4">
                <p>We use cookies and similar technologies for:</p>
                <ul className="list-disc pl-6 space-y-1">
                  <li>Essential functionality</li>
                  <li>Security and fraud prevention</li>
                  <li>Analytics and performance monitoring</li>
                  <li>User preferences</li>
                </ul>
                <p className="mt-2">
                  You may control cookies through your browser settings. Disabling certain cookies may affect
                  platform functionality.
                </p>
              </div>
            </section>

            <section>
              <h2 className="text-2xl font-medium text-black">8. Data Security</h2>
              <div className="mt-4 space-y-4">
                <p>
                  We implement reasonable technical and organizational safeguards designed to protect information, including:
                </p>
                <ul className="list-disc pl-6 space-y-1">
                  <li>Encryption of data in transit</li>
                  <li>Access controls</li>
                  <li>Security monitoring and updates</li>
                </ul>
                <p className="mt-2">
                  No method of transmission or storage is completely secure. We cannot guarantee absolute security.
                </p>
              </div>
            </section>

            <section>
              <h2 className="text-2xl font-medium text-black">9. Disclosure of Information</h2>
              <div className="mt-4 space-y-4">
                <p>We may disclose information only in limited circumstances:</p>
                <ul className="list-disc space-y-2 pl-6">
                  <li>To service providers operating on our behalf</li>
                  <li>To comply with legal obligations or lawful requests</li>
                  <li>To protect the rights, safety, or property of Pachena, users, or the public</li>
                  <li>In connection with a merger, acquisition, or asset sale</li>
                </ul>
                <p className="mt-2">We share only the minimum information necessary in such circumstances.</p>
              </div>
            </section>

            <section>
              <h2 className="text-2xl font-medium text-black">10. Your Rights</h2>
              <div className="mt-4 space-y-4">
                <p>
                  Depending on your jurisdiction, you may have rights under applicable data protection laws,
                  including the right to:
                </p>
                <ul className="list-disc space-y-2 pl-6">
                  <li>Request access to personal information</li>
                  <li>Request correction of inaccurate information</li>
                  <li>Request deletion of personal information</li>
                  <li>Object to certain processing activities</li>
                  <li>Withdraw consent where applicable</li>
                </ul>
                <p>
                  Because Pachena does not create persistent reviewer accounts, we may be unable to identify
                  or retrieve specific anonymous review submissions.
                </p>
                <p>
                  To exercise your rights, contact: <a href="mailto:hello@pachena.co" className="text-primary hover:underline">hello@pachena.co</a>
                </p>
              </div>
            </section>

            <section>
              <h2 className="text-2xl font-medium text-black">11. Children's Privacy</h2>
              <p className="mt-4">
                Pachena is not intended for individuals under the age of 18. We do not knowingly collect
                personal information from children.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-medium text-black">12. International Data Processing</h2>
              <p className="mt-4">
                Pachena operates from the United States. Information may be processed in the United States or
                other jurisdictions where our service providers operate.
              </p>
              <p className="mt-4">
                Where required, we implement safeguards consistent with applicable data protection laws.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-medium text-black">13. Changes to This Policy</h2>
              <p className="mt-4">
                We may update this Privacy Policy from time to time. Material changes will be reflected by updating
                the "Last updated" date. Continued use of Pachena after changes constitutes acceptance of the revised policy.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-medium text-black">14. Contact Us</h2>
              <p className="mt-4">
                If you have questions about this Privacy Policy or our data practices, please contact:
              </p>
              <ul className="mt-4 space-y-2">
                <li><strong className="text-black">Email:</strong> <a href="mailto:hello@pachena.co" className="text-primary hover:underline">hello@pachena.co</a></li>
              </ul>
            </section>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
