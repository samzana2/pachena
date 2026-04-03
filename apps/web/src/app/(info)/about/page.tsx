import { Metadata } from "next";
import Link from "next/link";
import Header from "@/components/Header";
import Footer from "@/components/Footer";

export const metadata: Metadata = {
  title: "About Pachena — Africa's Workplace Transparency Platform",
  description:
    "Learn about Pachena's mission to increase workplace transparency across Africa so professionals can make informed decisions and organizations can build better workplaces.",
};

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="container py-16">
        <div className="mx-auto max-w-3xl">
          <h1 className="text-3xl md:text-4xl font-medium text-black">About Pachena</h1>

          <div className="mt-8 space-y-6 text-black/70">
            <p className="text-lg">
              Pachena is building Africa's leading platform for workplace transparency.
            </p>
            <p>
              We help professionals make informed career decisions through anonymous reviews, salary insights, and structured workplace feedback. We help employers listen, learn, and strengthen workplace culture through responsible transparency.
            </p>

            <h2 className="text-2xl font-medium text-black">Our Mission</h2>
            <p>
              To increase workplace transparency across Africa so professionals can make informed decisions and organizations can build better workplaces.
            </p>
            <p>
              We believe access to honest workplace information leads to stronger companies, better leadership, and more empowered professionals.
            </p>

            <h2 className="text-2xl font-medium text-black">How Pachena Works</h2>
            <p>
              Pachena enables professionals to share anonymous workplace reviews and ratings based on their real employment experiences.
            </p>
            <p>Each company profile includes:</p>
            <ul className="list-disc space-y-1 pl-6">
              <li>Overall ratings across key workplace categories</li>
              <li>Written employee feedback</li>
              <li>Salary insights</li>
              <li>Interview insights</li>
            </ul>
            <p>
              Reviews are submitted anonymously and must follow our{" "}
              <Link href="/guidelines" className="text-primary hover:underline">Community Guidelines</Link>{" "}
              to ensure feedback remains constructive, factual, and professional.
            </p>
            <p>
              Employers will be able to use feedback to identify patterns, improve culture, and better attract and retain talent.{" "}
              <strong className="text-black">Pachena For Employers</strong> is coming soon.
            </p>

            <h2 className="text-2xl font-medium text-black">Our Values</h2>
            <ul className="list-none space-y-4 pl-0">
              <li>
                <strong className="text-black">Responsible Transparency</strong>
                <br />
                Open feedback strengthens workplaces when shared constructively and truthfully.
              </li>
              <li>
                <strong className="text-black">Anonymity with Accountability</strong>
                <br />
                Professionals can share experiences without fear of retaliation, while maintaining clear community standards.
              </li>
              <li>
                <strong className="text-black">Trust Through Structure</strong>
                <br />
                Clear guidelines and moderation processes help ensure that feedback remains credible and useful.
              </li>
              <li>
                <strong className="text-black">Fairness</strong>
                <br />
                We are building a balanced platform designed to serve both professionals and employers across Africa.
              </li>
            </ul>

            <h2 className="text-2xl font-medium text-black">Our Team</h2>
            <p>
              Pachena was founded by professionals who experienced firsthand the difficulty of finding reliable, structured information about workplace culture and expectations.
            </p>
            <p>
              We are committed to building long-term infrastructure for workplace transparency across Africa — designed to serve professionals and employers fairly, responsibly, and sustainably.
            </p>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
