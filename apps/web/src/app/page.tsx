import Link from "next/link";
import type { Metadata } from "next";
import { Button } from "@/components/ui/button";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import CompanySpotlight from "@/components/CompanySpotlight";
import TypewriterText from "@/components/TypewriterText";
import {
  Search,
  BarChart3,
  Building2,
  MessageSquare,
  TrendingUp,
  Briefcase,
  Users,
  Heart,
  MessageSquarePlus,
  Info,
} from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: "Pachena — Company Reviews for Africa",
  description:
    "Browse anonymous employee reviews, salary data, and workplace insights for African companies. Transparency starts here.",
};

interface SpotlightCompany {
  id: string;
  name: string;
  logo?: string;
  description: string;
  rating: number;
}

async function getSpotlightCompanies(): Promise<SpotlightCompany[]> {
  const supabase = await createServerSupabaseClient();

  const [{ data: reviews }, { data: cultureSections }] = await Promise.all([
    supabase.from("reviews_public").select("company_id, rating"),
    supabase
      .from("review_sections_public")
      .select("company_id, section_data")
      .eq("section_type", "culture"),
  ]);

  const companyRatings: Record<string, { total: number; count: number }> = {};

  for (const r of reviews ?? []) {
    if (!r.company_id) continue;
    companyRatings[r.company_id] ??= { total: 0, count: 0 };
    companyRatings[r.company_id].total += r.rating ?? 0;
    companyRatings[r.company_id].count++;
  }

  for (const s of (cultureSections ?? []) as Array<{
    company_id: string | null;
    section_data: Record<string, unknown> | null;
  }>) {
    const rating = s.section_data?.rating;
    if (!s.company_id || !rating) continue;
    companyRatings[s.company_id] ??= { total: 0, count: 0 };
    companyRatings[s.company_id].total += Number(rating);
    companyRatings[s.company_id].count++;
  }

  const companyIds = Object.keys(companyRatings);
  if (companyIds.length === 0) return [];

  const { data: companiesData } = await supabase
    .from("companies")
    .select("id, name, slug, logo_url, description")
    .in("id", companyIds);

  return (companiesData ?? [])
    .map((c) => ({
      id: c.slug ?? c.id,
      name: c.name,
      logo: c.logo_url ?? undefined,
      description: c.description ?? `${c.name} is a company on Pachena.`,
      rating:
        companyRatings[c.id].total / companyRatings[c.id].count,
    }))
    .sort((a, b) => b.rating - a.rating)
    .slice(0, 10);
}

const privacySteps = [
  {
    title: "Anonymous by Default",
    description:
      "Every review on Pachena is anonymous. No personal information is required or collected.",
  },
  {
    title: "Guided by Clear Standards",
    description:
      "Every submission is reviewed against our published policy guidelines. Reviews that violate our standards are not posted.",
  },
  {
    title: "Signal Over Noise",
    description:
      "Recurring themes and community feedback surface what matters. Patterns speak louder than any single review.",
  },
];

const employerFeatures = [
  {
    icon: Building2,
    title: "Claim Your Company",
    description:
      "Take ownership of your company profile and engage transparently with employee feedback.",
  },
  {
    icon: MessageSquare,
    title: "Respond to Reviews",
    description:
      "Share context, acknowledge concerns, and show employees that their voices are heard.",
  },
  {
    icon: BarChart3,
    title: "Access Insights",
    description:
      "Understand trends across compensation, culture, and retention to make better decisions.",
  },
  {
    icon: Briefcase,
    title: "Post Jobs",
    description:
      "Reach candidates who value transparency and are actively researching employers.",
  },
  {
    icon: Users,
    title: "Manage Applications",
    description:
      "Review and manage applicants in one place with clarity and efficiency.",
  },
  {
    icon: Heart,
    title: "Build a Trusted Brand",
    description:
      "Earn trust by listening, improving, and leading with transparency.",
  },
];

export default async function Home() {
  const spotlightCompanies = await getSpotlightCompanies();

  return (
    <div className="min-h-screen flex flex-col bg-background relative">
      {/* Bottom gradient overlay for scroll focus effect */}
      <div className="fixed bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-background via-background/50 to-transparent pointer-events-none z-10" />

      {/* Hero background that extends behind header */}
      <div className="absolute top-0 left-0 right-0 h-[100vh] bg-hero z-0" />

      <Header />

      {/* Hero Section */}
      <section className="relative z-10 px-4 pb-40 pt-24 min-h-[calc(100vh-64px)]">
        <div className="container text-center">
          <div className="inline-flex items-center justify-center gap-1 animate-fade-in">
            <h1 className="font-logo text-5xl md:text-7xl lg:text-8xl text-brand">
              Pachena
            </h1>
            <img
              src="/white-sparkle.png"
              alt=""
              className="h-4 md:h-5 lg:h-6 w-auto -mt-6 md:-mt-8 lg:-mt-10 -ml-1"
              style={{
                filter:
                  "brightness(0) saturate(100%) invert(22%) sepia(30%) saturate(800%) hue-rotate(350deg) brightness(95%)",
              }}
            />
          </div>
          <p
            style={{ animationDelay: "0.1s" }}
            className="mx-auto mt-6 max-w-xl text-lg text-black/70 animate-fade-in h-7"
          >
            <TypewriterText
              phrases={[
                "Workplace transparency, for everyone.",
                "Kujeka pabasa, kune wese.",
                "Ukucaca emsebenzini, kubo bonke.",
              ]}
              typingSpeed={80}
              deletingSpeed={40}
              pauseBeforeDelete={2500}
              pauseDuration={500}
            />
          </p>
          <div
            className="mt-8 flex flex-wrap justify-center gap-4 animate-fade-in"
            style={{ animationDelay: "0.2s" }}
          >
            <Button
              size="lg"
              asChild
              className="bg-brand text-brand-foreground hover:bg-transparent hover:text-brand border border-brand"
            >
              <Link href="/companies">Browse Companies</Link>
            </Button>
            <Button size="lg" variant="outline" asChild>
              <Link href="/review">Leave a Review</Link>
            </Button>
          </div>
          <div
            className="mt-6 flex flex-col items-center justify-center text-sm animate-fade-in"
            style={{ animationDelay: "0.3s" }}
          >
            <span className="font-light text-black">
              Browse companies, read reviews, and gain insights into pay and
              workplace culture.
            </span>
            <span className="font-medium text-black">
              Transparency starts with Pachena.
            </span>
          </div>
        </div>
      </section>

      {/* For Employees Section */}
      <section className="w-full flex justify-center py-20 bg-background">
        <div className="w-full max-w-[1200px] mx-5">
          <div className="flex flex-col lg:flex-row gap-12">
            {/* Left: Image - hidden on tablet, visible on mobile and desktop */}
            <div className="flex-shrink-0 hidden lg:block">
              <img
                src="/employees-image.png"
                alt="Employee smiling"
                className="w-[400px] h-auto object-cover rounded-2xl"
              />
            </div>

            {/* Mobile: Image shown at top */}
            <div className="flex-shrink-0 lg:hidden md:hidden flex justify-center">
              <img
                src="/employees-image.png"
                alt="Employee smiling"
                className="w-[300px] h-auto object-cover rounded-2xl"
              />
            </div>

            {/* Right: Content */}
            <div className="flex flex-col flex-1">
              <h2 className="text-3xl md:text-4xl font-medium text-black mb-3 text-center lg:text-left">
                For Employees
              </h2>
              <p className="text-black/70 text-base leading-relaxed mb-8 max-w-[700px] text-center lg:text-left mx-auto lg:mx-0">
                We are building a movement for better workplace transparency.
                Pachena gives you access to anonymous insights about pay,
                culture, and workplace conditions to help create a more
                transparent and fair job market for everyone.
              </p>

              {/* Feature List */}
              <div className="flex flex-col">
                <div className="py-4 border-b border-border flex items-start gap-3">
                  <div className="w-9 h-9 rounded-lg border border-black/10 flex items-center justify-center flex-shrink-0">
                    <Search className="w-4 h-4 text-black" />
                  </div>
                  <div>
                    <h3 className="font-sans font-semibold text-[16px] text-black mb-1">
                      Browse Companies
                    </h3>
                    <p className="text-black/60 text-sm leading-relaxed">
                      Browse companies and read anonymous reviews.
                    </p>
                  </div>
                </div>
                <div className="py-4 border-b border-border flex items-start gap-3">
                  <div className="w-9 h-9 rounded-lg border border-black/10 flex items-center justify-center flex-shrink-0">
                    <TrendingUp className="w-4 h-4 text-black" />
                  </div>
                  <div>
                    <h3 className="font-sans font-semibold text-[16px] text-black mb-1">
                      Discover Insights
                    </h3>
                    <p className="text-black/60 text-sm leading-relaxed">
                      Access insights on important metrics like salaries,
                      benefits, diversity, and culture.
                    </p>
                  </div>
                </div>
                <div className="py-4 border-b border-border flex items-start gap-3">
                  <div className="w-9 h-9 rounded-lg border border-black/10 flex items-center justify-center flex-shrink-0">
                    <MessageSquarePlus className="w-4 h-4 text-black" />
                  </div>
                  <div>
                    <h3 className="font-sans font-semibold text-[16px] text-black mb-1">
                      Share Reviews
                    </h3>
                    <p className="text-black/60 text-sm leading-relaxed">
                      Help others by sharing your insights. Submission data is
                      never visible to employers.
                    </p>
                  </div>
                </div>
              </div>

              {/* Get Started Link */}
              <div className="text-center lg:text-left mt-6">
                <Link
                  href="/companies"
                  className="text-sm text-black hover:underline font-medium"
                >
                  Browse companies →
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Privacy by Design Section */}
      <section className="min-h-screen flex items-center justify-center py-12 bg-background">
        <div className="w-full max-w-[1100px] px-5">
          <div className="text-center mb-10">
            <h2 className="text-3xl md:text-4xl font-medium text-black mb-3">
              Anonymous insights you can trust.
            </h2>
            <p className="text-black/70 text-base max-w-[800px] mx-auto">
              Reviews on Pachena are anonymous by design and corroborated by
              community.
            </p>
          </div>

          {/* Single Row Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {privacySteps.map((step, index) => (
              <div
                key={index}
                className="group p-5 rounded-xl bg-muted/30 hover:bg-muted/50 transition-colors duration-200"
              >
                <h3 className="font-medium text-black text-sm mb-1 flex items-center gap-1.5">
                  {step.title}
                  {index === 0 && (
                    <TooltipProvider delayDuration={200}>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Info className="h-3.5 w-3.5 text-black/40 hover:text-black/70 transition-colors cursor-help" />
                        </TooltipTrigger>
                        <TooltipContent
                          side="top"
                          className="max-w-[280px] text-xs leading-relaxed"
                        >
                          For extra protection, we recommend submitting reviews
                          from a personal device and network, and avoiding any
                          personally identifying information in your responses.{" "}
                          <Link
                            href="/guidelines"
                            className="underline text-primary hover:text-primary/80"
                          >
                            Review guidelines →
                          </Link>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  )}
                </h3>
                <p className="text-black/60 text-sm leading-relaxed">
                  {step.description}
                </p>
              </div>
            ))}
          </div>

          {/* CTA */}
          <div className="text-center mt-8">
            <Link
              href="/review"
              className="text-sm text-black hover:underline font-medium"
            >
              Ready to get started? Leave a review →
            </Link>
          </div>
        </div>
      </section>

      {/* Company Spotlight Section */}
      <section className="w-full flex justify-center py-16 md:py-24 text-foreground">
        <div className="w-full max-w-[1100px] px-5">
          <CompanySpotlight companies={spotlightCompanies} />
        </div>
      </section>

      {/* For Employers Section */}
      <section className="min-h-screen flex items-center justify-center py-12 bg-background">
        <div className="w-full max-w-[1100px] px-5">
          <div className="text-center mb-10">
            <h2 className="text-3xl md:text-4xl font-medium text-black mb-3">
              For Employers
            </h2>
            <p className="text-black/70 text-base max-w-[600px] mx-auto">
              The best employers listen. Pachena offers a secure way to
              understand employee sentiment and build trust.
            </p>
          </div>

          {/* Compact 3x2 Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {employerFeatures.map((feature, index) => (
              <div
                key={index}
                className="group p-5 rounded-xl bg-muted/30 hover:bg-muted/50 transition-colors duration-200"
              >
                <div className="w-9 h-9 rounded-lg bg-black/5 flex items-center justify-center mb-3">
                  <feature.icon className="w-4 h-4 text-black" />
                </div>
                <h3 className="font-medium text-black text-sm mb-1">
                  {feature.title}
                </h3>
                <p className="text-black/60 text-sm leading-relaxed">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>

          {/* CTA */}
          <div className="text-center mt-8">
            <Link
              href="/employers"
              className="text-sm text-black hover:underline font-medium"
            >
              Learn more about employer features →
            </Link>
          </div>
        </div>
      </section>

      {/* Why It Matters CTA Section */}
      <section className="py-16 md:py-24 bg-background">
        <div className="container text-center max-w-3xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-medium text-foreground mb-3">
            Why it matters.
          </h2>
          <p className="text-black/70 text-base max-w-[800px] mx-auto mb-8">
            At Pachena, we believe that more transparency leads to fairer pay,
            happier employees, and more productive companies. Employees deserve
            clarity, and employers deserve honest feedback. By sharing your
            experiences anonymously, you&apos;re helping create a more open and
            fair job market for everyone.
          </p>

          <div className="flex flex-col sm:flex-row gap-3 justify-center mb-6">
            <Button
              size="lg"
              className="text-base px-8 bg-brand text-brand-foreground hover:bg-transparent hover:text-brand border border-brand"
              asChild
            >
              <Link href="/companies">Browse Companies</Link>
            </Button>
            <Button size="lg" variant="outline" className="text-base px-8" asChild>
              <Link href="/review">Leave a Review</Link>
            </Button>
          </div>

          <Link
            href="/employers"
            className="text-sm text-black hover:underline font-medium"
          >
            Are you an employer? Claim your company →
          </Link>
        </div>
      </section>

      <Footer />
    </div>
  );
}
