import { Metadata } from "next";
import Link from "next/link";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Separator } from "@/components/ui/separator";

export const metadata: Metadata = {
  title: "Review Guidelines — Pachena",
  description:
    "Pachena's Review Guidelines help ensure feedback remains constructive, truthful, and responsible. Learn what to include and avoid when submitting a review.",
};

export default function GuidelinesPage() {
  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="container py-16">
        <div className="mx-auto max-w-3xl">
          <h1 className="text-3xl md:text-4xl font-medium text-black">Review Guidelines</h1>
          <p className="mt-2 text-sm text-black/60">Last updated: 16 February 2026</p>
          <p className="mt-4 text-lg text-black/70">
            Pachena exists to promote workplace transparency, accountability, and fair opportunity. Thoughtful reviews help professionals make informed decisions and help companies improve.
          </p>
          <p className="mt-3 text-base text-black/70">
            These guidelines protect both employees and employers by ensuring reviews remain constructive, truthful, and responsible.
          </p>

          <div className="mt-12 space-y-10">
            {/* What to Include */}
            <div>
              <h2 className="text-xl font-medium text-black">What to Include</h2>
              <ul className="mt-4 space-y-3 text-black/70">
                <li><strong className="text-black">Be clear and concrete (without identifying details):</strong> Share examples that help readers understand your experience. Avoid including names, exact dates, confidential data, or details that could identify you or others.</li>
                <li><strong className="text-black">Be balanced (when possible):</strong> If appropriate, mention both positives and areas for improvement. Balanced feedback is often more helpful and credible.</li>
                <li><strong className="text-black">Be honest:</strong> Only share your genuine experience. Your review should reflect your actual time at the company.</li>
                <li><strong className="text-black">Be helpful:</strong> Focus on information that would genuinely help someone evaluate whether the workplace may be a good fit.</li>
                <li><strong className="text-black">Be professional:</strong> Maintain a respectful tone. Constructive criticism is more valuable than emotional venting.</li>
                <li><strong className="text-black">Be current:</strong> Indicate approximately when you worked at the company. Workplace conditions can change over time.</li>
              </ul>
            </div>

            <Separator />

            {/* What to Avoid */}
            <div>
              <h2 className="text-xl font-medium text-black">What to Avoid</h2>
              <ul className="mt-4 space-y-3 text-black/70">
                <li><strong className="text-black">Naming individuals:</strong> Do not identify specific employees, managers, executives, or colleagues. Focus on company practices, culture, and systems rather than specific people.</li>
                <li><strong className="text-black">Confidential or proprietary information:</strong> Do not share trade secrets, internal financial data, unreleased strategy, client details, or other confidential materials.</li>
                <li><strong className="text-black">Discriminatory or hateful language:</strong> No hate speech or language targeting protected characteristics.</li>
                <li><strong className="text-black">False or misleading claims:</strong> Do not fabricate experiences or exaggerate events. Reviews must reflect real employment experience.</li>
                <li><strong className="text-black">Unsubstantiated legal or criminal accusations:</strong> Avoid making specific allegations of illegal or criminal conduct unless such matters are publicly documented and verifiable.</li>
                <li><strong className="text-black">Threats or harassment:</strong> Content that threatens, intimidates, or encourages harm is strictly prohibited.</li>
                <li><strong className="text-black">Promotional content:</strong> Reviews must not promote products, services, political causes, or competing businesses.</li>
              </ul>
            </div>

            <Separator />

            {/* How to Write a Strong Review */}
            <div>
              <h2 className="text-xl font-medium text-black">How to Write a Strong Review</h2>
              <p className="mt-4 text-black/70">Strong reviews are:</p>
              <ul className="mt-2 space-y-1 text-black/70">
                <li>• Specific in substance</li>
                <li>• Professional in tone</li>
                <li>• Focused on patterns, not personal disputes</li>
                <li>• Informative without being identifying</li>
              </ul>

              <div className="mt-6 rounded-lg border border-green-200 bg-green-50/50 p-4">
                <p className="text-sm font-medium text-green-800">✓ Example of a strong review snippet:</p>
                <blockquote className="mt-2 text-sm text-green-900/80 italic border-l-2 border-green-300 pl-3">
                  "Work-life balance can be challenging during peak reporting periods. Weekend work is sometimes expected. However, the team is collaborative, and management is responsive to feedback."
                </blockquote>
                <p className="mt-2 text-xs text-green-700">
                  <strong>Why this works:</strong> Describes a pattern · Professional tone · No names or identifying details · Balanced and helpful
                </p>
              </div>

              <div className="mt-4 rounded-lg border border-red-200 bg-red-50/50 p-4">
                <p className="text-sm font-medium text-red-800">✗ Example of a review that would not meet our guidelines:</p>
                <blockquote className="mt-2 text-sm text-red-900/80 italic border-l-2 border-red-300 pl-3">
                  "The CFO is corrupt and stealing money. Avoid this company."
                </blockquote>
                <p className="mt-2 text-xs text-red-700">
                  <strong>Why this does not meet guidelines:</strong> Names an individual · Makes a criminal accusation · Provides no substantiation · Creates legal risk
                </p>
              </div>
            </div>

            <Separator />

            {/* Anonymity */}
            <div>
              <h2 className="text-xl font-medium text-black">Anonymity</h2>
              <p className="mt-4 text-black/70">
                All reviews on Pachena are anonymous. Your identity is never displayed publicly, and no personal information is required to submit a review.
              </p>
            </div>

            <Separator />

            {/* Content Review */}
            <div>
              <h2 className="text-xl font-medium text-black">Content Review</h2>
              <p className="mt-4 text-black/70">To maintain platform integrity:</p>
              <ul className="mt-2 space-y-2 text-black/70">
                <li>• Reviews are evaluated for compliance with these guidelines</li>
                <li>• Automated tools may assist our moderation team</li>
                <li>• Content is screened for identifying information and potential legal risk</li>
                <li>• Reviews typically appear within 1–2 business days</li>
                <li>• Reviews that violate guidelines may be rejected</li>
                <li>• If a review partially violates policy, specific fields may be hidden while compliant content remains visible</li>
                <li>• Pachena does not rewrite or alter user-submitted content — fields may only be hidden, never edited</li>
              </ul>
            </div>

            <Separator />

            {/* What May Be Hidden */}
            <div>
              <h2 className="text-xl font-medium text-black">What May Be Hidden</h2>
              <p className="mt-4 text-black/70">
                If a review contains identifying information, confidential details, or policy-violating content in specific sections, those fields may be hidden from public view.
              </p>
              <p className="mt-3 text-black/70">
                Hidden content is not altered — it is simply not displayed publicly. This allows us to preserve the integrity of feedback while maintaining a safe and responsible platform.
              </p>
            </div>

            <Separator />

            {/* Editing or Removal */}
            <div>
              <h2 className="text-xl font-medium text-black">Editing or Removal</h2>
              <p className="mt-4 text-black/70">
                Reviews cannot be edited once published.
              </p>
              <p className="mt-3 text-black/70">
                If you believe your review contains confidential or sensitive information, please contact{" "}
                <a href="mailto:hello@pachena.co" className="text-primary hover:underline">hello@pachena.co</a>.
              </p>
            </div>

            <Separator />

            {/* Protect Your Privacy */}
            <div>
              <h2 className="text-xl font-medium text-black">Protect Your Privacy</h2>
              <p className="mt-4 text-black/70">
                Although reviews are anonymous, we strongly recommend taking a few extra steps to protect yourself.
              </p>
              <p className="mt-3 text-black/70">Tips:</p>
              <ul className="mt-2 space-y-2 text-black/70">
                <li>• Submit reviews from a personal device and network — not your employer's</li>
                <li>• Avoid unique internal project names</li>
                <li>• Avoid exact dates or highly specific timelines</li>
                <li>• Avoid referencing events known only to a small group</li>
                <li>• Focus on recurring experiences rather than isolated incidents</li>
                <li>• Do not include any personally identifying information in your responses</li>
              </ul>
            </div>

            <Separator />

            {/* Reporting Concerns */}
            <div>
              <h2 className="text-xl font-medium text-black">Reporting Concerns</h2>
              <ul className="mt-4 space-y-2 text-black/70">
                <li>• Use the "Report" button to flag content for review</li>
                <li>• Provide specific reasons for your concern</li>
                <li>• Our team typically reviews reports within 48 hours</li>
                <li>• We may remove or hide content that violates these guidelines</li>
                <li>• For urgent matters, contact <a href="mailto:hello@pachena.co" className="text-primary hover:underline">hello@pachena.co</a></li>
              </ul>
            </div>

            <Separator />

            {/* Rating Categories */}
            <div>
              <h2 className="text-xl font-medium text-black">Rating Categories</h2>
              <p className="mt-4 text-black/70">
                When rating your employer, consider these areas thoughtfully:
              </p>
              <ul className="mt-4 space-y-3 text-black/70">
                <li><strong className="text-black">Work-Life Balance:</strong> Flexibility, working hours, leave policies, respect for personal time, remote work options</li>
                <li><strong className="text-black">Career Growth:</strong> Training opportunities, promotions, mentorship, skills development, advancement pathways</li>
                <li><strong className="text-black">Compensation:</strong> Salary competitiveness, benefits, bonuses, pay transparency, timeliness of payment</li>
                <li><strong className="text-black">Management:</strong> Leadership quality, communication, support, feedback culture, decision-making</li>
                <li><strong className="text-black">Culture:</strong> Team dynamics, inclusivity, company values, workplace environment, employee engagement</li>
              </ul>
            </div>

            <Separator />

            {/* Legal Acknowledgment */}
            <div>
              <h2 className="text-xl font-medium text-black">Legal Acknowledgment</h2>
              <p className="mt-4 text-black/70">
                By submitting a review, you confirm that:
              </p>
              <ul className="mt-4 space-y-2 text-black/70">
                <li>• Your review reflects your genuine experience</li>
                <li>• You are not knowingly violating confidentiality obligations</li>
                <li>• The statements in your review are truthful and accurate to the best of your knowledge</li>
                <li>• You understand that knowingly false or defamatory statements may have legal consequences</li>
              </ul>
              <p className="mt-4 text-black/70">
                Pachena complies with applicable laws and court orders. We are committed to protecting user privacy within the bounds of the law.
              </p>
            </div>

            <Separator />

            {/* Questions */}
            <div>
              <h2 className="text-xl font-medium text-black">Questions?</h2>
              <p className="mt-4 text-black/70">
                If you have questions about these guidelines, please visit our{" "}
                <Link href="/faq" className="text-primary hover:underline">FAQ</Link> or contact{" "}
                <a href="mailto:hello@pachena.co" className="text-primary hover:underline">hello@pachena.co</a>.
              </p>
              <p className="mt-3 text-black/70">
                We are committed to ensuring your voice is heard while maintaining a fair, responsible, and trustworthy platform.
              </p>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
