"use client";

import { useState } from "react";
import Link from "next/link";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { MessageSquare, Award, Building2, ClipboardCheck, BarChart3, FileText, CheckCircle, HelpCircle } from "lucide-react";
import { createBrowserSupabaseClient } from "@/lib/supabase/client";
import { toast } from "sonner";

const SubmitQuestionForm = () => {
  const [question, setQuestion] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!question.trim()) return;
    setIsSubmitting(true);
    const supabase = createBrowserSupabaseClient();
    try {
      const formData = {
        email: "employers-faq@pachena.co",
        name: "Employers Page - FAQ Suggestion",
        subject: "FAQ Suggestion from Employers Page",
        message: question,
      };

      const { error } = await supabase.from("contact_messages").insert(formData);
      if (error) throw error;

      supabase.functions.invoke("send-contact-notification", {
        body: formData,
      }).catch((err) => {
        console.error("Email notification error:", err);
      });

      setSubmitted(true);
      setQuestion("");
    } catch (error) {
      console.error("Question submission error:", error);
      toast.error("Something went wrong. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (submitted) {
    return <p className="text-sm text-muted-foreground">Thanks for your suggestion!</p>;
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <Textarea
        placeholder="Your question..."
        value={question}
        onChange={(e) => setQuestion(e.target.value)}
        required
        rows={3}
        className="bg-background resize-none"
      />
      <Button
        type="submit"
        size="sm"
        disabled={isSubmitting}
        className="bg-brand text-brand-foreground hover:bg-transparent hover:text-brand border border-brand"
      >
        {isSubmitting ? "Submitting..." : "Submit Question"}
      </Button>
    </form>
  );
};

export default function EmployersPage() {
  const [email, setEmail] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  const handleWaitlistSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    setIsSubmitting(true);
    const supabase = createBrowserSupabaseClient();
    try {
      const { error } = await supabase.from("waitlist").insert({
        email,
        company_name: companyName || null,
        plan_interest: "employer_early_access",
      });
      if (error) {
        if (error.code === "23505") {
          toast.error("This email is already on the waitlist!");
        } else {
          throw error;
        }
      } else {
        try {
          await supabase.functions.invoke("send-waitlist-confirmation", {
            body: { email, company_name: companyName || null },
          });
        } catch (emailError) {
          console.error("Failed to send confirmation email:", emailError);
        }
        setIsSubmitted(true);
        toast.success("You're on the list! We'll be in touch soon.");
        setEmail("");
        setCompanyName("");
      }
    } catch (error) {
      console.error("Waitlist signup error:", error);
      toast.error("Something went wrong. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Minimal Header with just P logo */}
      <header className="fixed top-0 left-0 right-0 z-50 w-full">
        <div className="container flex h-16 items-center">
          <Link href="/" className="flex items-center gap-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-brand">
              <span className="font-logo text-xl font-bold text-brand-foreground">P</span>
            </div>
          </Link>
        </div>
      </header>

      {/* Hero Section - Full Screen */}
      <section id="waitlist" className="min-h-screen flex flex-col items-center justify-center py-20 bg-gradient-to-br from-amber-50 via-rose-50 to-violet-50">
        <div className="container text-center">
          <h1 className="text-5xl md:text-7xl lg:text-8xl font-medium text-black">
            Coming Soon
          </h1>
          <p className="mt-6 text-lg text-black/70 max-w-2xl mx-auto">
            Join the waitlist to get notified when Pachena For Employers launches.
          </p>

          {isSubmitted ? (
            <div className="mt-10 max-w-md mx-auto">
              <div className="flex items-center justify-center gap-2 text-primary">
                <CheckCircle className="h-5 w-5" />
                <span className="font-medium">You&apos;re on the list!</span>
              </div>
              <p className="text-sm text-black/60 mt-2">
                We&apos;ll notify you as soon as employer features are available.
              </p>
            </div>
          ) : (
            <form onSubmit={handleWaitlistSubmit} className="mt-10 max-w-lg mx-auto">
              <div className="flex flex-col sm:flex-row gap-3">
                <Input
                  type="email"
                  placeholder="Work email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="flex-1 border-0 bg-white/80 shadow-sm"
                />
                <Input
                  type="text"
                  placeholder="Company name (optional)"
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  className="flex-1 border-0 bg-white/80 shadow-sm"
                />
                <Button
                  type="submit"
                  disabled={isSubmitting}
                  className="bg-brand text-brand-foreground hover:bg-transparent hover:text-brand border border-brand transition-shadow"
                >
                  {isSubmitting ? "Joining..." : "Join Waitlist"}
                </Button>
              </div>
              <p className="text-xs text-black/50 mt-3">
                Claim your company. Respond to reviews. Access industry insights. Coming Soon.
              </p>
            </form>
          )}
        </div>
      </section>

      {/* How Employers Use Pachena Section */}
      <section id="how-employers-use-pachena" className="min-h-screen flex items-center justify-center py-12 bg-background">
        <div className="w-full max-w-[1100px] px-5">
          <div className="text-center mb-10">
            <h2 className="text-3xl md:text-4xl font-medium text-black mb-3">
              How Employers Will Use Pachena
            </h2>
            <p className="text-black/70 text-base max-w-[600px] mx-auto">
              Join forward-thinking Zimbabwean employers who value transparency and employee voice.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="group p-5 rounded-xl bg-muted/30 hover:bg-muted/50 transition-colors duration-200">
              <div className="w-9 h-9 rounded-lg bg-black/5 flex items-center justify-center mb-3">
                <Building2 className="w-4 h-4 text-black" />
              </div>
              <h3 className="font-medium text-black text-sm mb-1">Claim Your Company</h3>
              <p className="text-black/60 text-sm leading-relaxed">
                Take ownership of your company profile and engage transparently with employee feedback.
              </p>
            </div>

            <div className="group p-5 rounded-xl bg-muted/30 hover:bg-muted/50 transition-colors duration-200">
              <div className="w-9 h-9 rounded-lg bg-black/5 flex items-center justify-center mb-3">
                <MessageSquare className="w-4 h-4 text-black" />
              </div>
              <h3 className="font-medium text-black text-sm mb-1">Respond to Reviews</h3>
              <p className="text-black/60 text-sm leading-relaxed">
                Share context, acknowledge concerns, and show employees that their voices are heard.
              </p>
            </div>

            <div className="group p-5 rounded-xl bg-muted/30 hover:bg-muted/50 transition-colors duration-200">
              <div className="w-9 h-9 rounded-lg bg-black/5 flex items-center justify-center mb-3">
                <BarChart3 className="w-4 h-4 text-black" />
              </div>
              <h3 className="font-medium text-black text-sm mb-1">Access Insights</h3>
              <p className="text-black/60 text-sm leading-relaxed">
                Understand trends across compensation, culture, and retention to make better decisions.
              </p>
            </div>

            <div className="group p-5 rounded-xl bg-muted/30 hover:bg-muted/50 transition-colors duration-200">
              <div className="w-9 h-9 rounded-lg bg-black/5 flex items-center justify-center mb-3">
                <FileText className="w-4 h-4 text-black" />
              </div>
              <h3 className="font-medium text-black text-sm mb-1">Post Jobs</h3>
              <p className="text-black/60 text-sm leading-relaxed">
                Reach candidates who value transparency and are actively researching employers.
              </p>
            </div>

            <div className="group p-5 rounded-xl bg-muted/30 hover:bg-muted/50 transition-colors duration-200">
              <div className="w-9 h-9 rounded-lg bg-black/5 flex items-center justify-center mb-3">
                <ClipboardCheck className="w-4 h-4 text-black" />
              </div>
              <h3 className="font-medium text-black text-sm mb-1">Manage Applications</h3>
              <p className="text-black/60 text-sm leading-relaxed">
                Review and manage applicants in one place with clarity and efficiency.
              </p>
            </div>

            <div className="group p-5 rounded-xl bg-muted/30 hover:bg-muted/50 transition-colors duration-200">
              <div className="w-9 h-9 rounded-lg bg-black/5 flex items-center justify-center mb-3">
                <Award className="w-4 h-4 text-black" />
              </div>
              <h3 className="font-medium text-black text-sm mb-1">Build a Loved Brand</h3>
              <p className="text-black/60 text-sm leading-relaxed">
                Earn trust by listening, improving, and leading with transparency.
              </p>
            </div>
          </div>

          <div className="text-center mt-8">
            <a href="#waitlist" className="text-sm text-black hover:underline font-medium">
              Be the first to know when we launch →
            </a>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-20">
        <div className="container max-w-3xl">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-medium text-black mb-3">
              Frequently Asked Questions
            </h2>
            <p className="text-black/70">
              Common questions about employer features on Pachena.
            </p>
          </div>

          <Accordion type="single" collapsible className="w-full">
            <AccordionItem value="item-1">
              <AccordionTrigger className="text-left text-black">
                When will employer features be available?
              </AccordionTrigger>
              <AccordionContent className="text-black/70">
                We&apos;re working hard to launch employer features soon. Join the waitlist to be the first
                to know when we go live and get early access.
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="item-2">
              <AccordionTrigger className="text-left text-black">
                Can I see who wrote a review?
              </AccordionTrigger>
              <AccordionContent className="text-black/70">
                No. Privacy is absolute on Pachena. We only store the email domain of reviewers
                (not their full address), and our system is designed so that even we cannot connect
                reviews to individuals. This ensures employees can share honest feedback without fear.
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="item-3">
              <AccordionTrigger className="text-left text-black">
                How does claiming a company work?
              </AccordionTrigger>
              <AccordionContent className="text-black/70">
                Claiming starts with submitting a request using your work email that matches your
                company&apos;s domain (e.g., you@company.co.zw). You&apos;ll need to confirm you&apos;re authorized
                to represent your company&apos;s employer brand. To speed up verification, you can
                optionally provide your supervisor or CEO&apos;s contact information. Our team reviews
                each claim and may contact company leadership to confirm authorization before
                granting access. Once approved, you&apos;ll be able to manage your company page, respond
                to reviews, and view private feedback from employees.
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="item-5">
              <AccordionTrigger className="text-left text-black">
                What is private feedback?
              </AccordionTrigger>
              <AccordionContent className="text-black/70">
                When employees submit reviews, they have the option to include private feedback
                that&apos;s only visible to verified company representatives. This allows employees to
                share constructive suggestions directly with leadership without public exposure.
              </AccordionContent>
            </AccordionItem>
          </Accordion>

          {/* Submit a Question */}
          <div className="mt-12 p-6 rounded-xl bg-muted/30">
            <div className="flex items-start gap-3 mb-4">
              <div className="w-9 h-9 rounded-lg bg-black/5 flex items-center justify-center shrink-0">
                <HelpCircle className="w-4 h-4 text-black" />
              </div>
              <div>
                <h3 className="font-medium text-black text-sm mb-1">Have another question?</h3>
                <p className="text-black/60 text-sm">Submit your question and we&apos;ll add it to our FAQs.</p>
              </div>
            </div>
            <SubmitQuestionForm />
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20">
        <div className="container text-center">
          <h2 className="text-3xl font-medium text-black mb-3">Coming Soon</h2>
          <p className="text-black/70 max-w-lg mx-auto mb-8">
            Join the waitlist to get early access to employer features and start building a better workplace.
          </p>
          <Button
            asChild
            size="lg"
            className="bg-brand text-brand-foreground hover:bg-transparent hover:text-brand border border-brand"
          >
            <a href="#waitlist">Join the Waitlist</a>
          </Button>
        </div>
      </section>

      <Footer />
    </div>
  );
}
