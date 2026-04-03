"use client";

import { useState } from "react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { HelpCircle } from "lucide-react";
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
    try {
      const supabase = createBrowserSupabaseClient();
      const formData = {
        email: "faq-suggestion@pachena.co",
        name: "FAQ Page - Question Suggestion",
        subject: "FAQ Suggestion from FAQ Page",
        message: question
      };

      const { error } = await supabase.from("contact_messages").insert(formData);
      if (error) throw error;

      // Send email notification to hello@pachena.co (non-blocking)
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
    return (
      <p className="text-sm text-muted-foreground">
        Thanks for your suggestion!
      </p>
    );
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
      <Button type="submit" size="sm" disabled={isSubmitting}>
        {isSubmitting ? "Submitting..." : "Submit Question"}
      </Button>
    </form>
  );
};

const faqs = [
  {
    question: "What is Pachena?",
    answer: "Pachena is essentially a database of companies that features reviews and insights from real employees. Anyone can go onto Pachena, search for a company, and learn about what it's like to work there. You'll see a snapshot overview of high-level ratings, hear directly from employees about the Pros, Cons, and the One Thing to Know about working at the company, get clear insights about salaries and benefits, and read tips from the interview process."
  },
  {
    question: "How does Pachena work?",
    answer: "Pachena allows anyone to leave an anonymous review about their employer. All reviews go through a moderation process to ensure they meet our guidelines before being published."
  },
  {
    question: "Is Pachena anonymous?",
    answer: "Yes. Our system is built to protect your identity. Reviews are anonymous by design — neither Pachena nor employers will ever be able to see who submitted a review."
  },
  {
    question: "How does Pachena work for Employers?",
    answer: "For the initial launch, Pachena is just a space for employees to share anonymous insights and learn from peers about what it's like to work at different companies.\n\nPhase Two of our launch will introduce employer features. Employers will be able to claim and edit their company page, respond to public reviews, receive private messages, and access aggregated, anonymous insights.\n\nPhase Three of our product roadmap will include features for posting jobs and managing job applications directly within the Pachena platform."
  },
  {
    question: "Will Pachena be free?",
    answer: "Pachena is free for employees and anyone looking to read reviews about companies. Employer accounts will require a subscription once employer features are launched."
  },
  {
    question: "Will you moderate reviews?",
    answer: "Yes. Pachena is meant to be a place for transparent, valuable insights for employees and employers. It is not meant to be a place for drama, gossip, or inappropriate anonymous reviews.\n\nAll reviews must follow our Review Guidelines. Reviews that do not meet these standards will not be published."
  },
  {
    question: "What happens if a company gets a bad review?",
    answer: "Negative reviews will be published as long as they follow our Review Guidelines. Over time, company profiles will reflect a balanced, aggregated view across many employees — not just one person's experience.\n\nEmployers will have the opportunity to respond publicly and engage constructively."
  },
  {
    question: "Can companies remove or edit reviews?",
    answer: "No. Employers cannot delete, edit, or hide employee reviews. The integrity of the platform depends on honest, unfiltered feedback. Employers can only respond to reviews."
  },
  {
    question: "What if my company isn't listed yet?",
    answer: "You can request to add a new company directly on the platform. Once approved, you'll be able to submit a review and help build the company profile from the ground up."
  },
  {
    question: "Who is Pachena for?",
    answer: "Pachena is for anyone who wants more transparency in the workplace — across industries, roles, and experience levels. We're starting in Zimbabwe, but our long-term vision is to build a global platform for employee transparency."
  },
  {
    question: "Is it safe to use Pachena?",
    answer: "Yes. Pachena is designed to protect employee privacy while promoting responsible, constructive feedback. We never share personal data, and we moderate reviews to prevent abuse or harmful content."
  },
  {
    question: "Can I edit or delete my review after submitting?",
    answer: "No. Once a review is submitted, it cannot be edited or deleted. This ensures the integrity of feedback and prevents manipulation. Please take your time to review your responses before submitting."
  },
  {
    question: "How long does moderation take?",
    answer: "Reviews typically appear within 1–2 business days after submission, once they've been reviewed by our moderation team."
  },
  {
    question: "Do I need an account to leave a review?",
    answer: "No — you don't need to create an account or provide any personal information. Simply select a company, fill in your review, and submit it anonymously."
  },
  {
    question: "Can I review more than one company?",
    answer: "Yes. If you've worked at multiple companies, you can submit a review for each one."
  },
  {
    question: "How do you prevent fake reviews?",
    answer: "We use a combination of AI-powered moderation, community reporting, and manual review to ensure reviews are genuine and trustworthy. Our moderation team evaluates every submission against our published guidelines."
  },
  {
    question: "What if I'm worried about retaliation?",
    answer: "Pachena is designed with anonymity at its core. Your email is never stored, and reviews cannot be traced back to you. Employers only see aggregated, anonymous feedback — never individual identities.\n\nTip: To further protect your privacy, avoid including overly specific details in your review that could identify you, such as unique project names, exact dates, or information only a few people would know."
  }
];

export default function FAQPage() {
  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="container py-16">
        <div className="mx-auto max-w-3xl">
          <div className="text-center mb-12">
            <h1 className="text-3xl md:text-4xl font-medium text-black">
              Frequently Asked Questions
            </h1>
            <p className="mt-4 text-black/70">
              Everything you need to know about Pachena.
            </p>
          </div>

          <Accordion type="single" collapsible className="w-full">
            {faqs.map((faq, index) => (
              <AccordionItem key={index} value={`item-${index}`}>
                <AccordionTrigger className="text-left text-black">
                  {faq.question}
                </AccordionTrigger>
                <AccordionContent className="text-black/70 whitespace-pre-line">
                  {faq.answer}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>

          {/* Submit a Question */}
          <div className="mt-12 p-6 rounded-xl bg-muted/30">
            <div className="flex items-start gap-3 mb-4">
              <div className="w-9 h-9 rounded-lg bg-black/5 flex items-center justify-center shrink-0">
                <HelpCircle className="w-4 h-4 text-black" />
              </div>
              <div>
                <h3 className="font-medium text-black text-sm mb-1">Have another question?</h3>
                <p className="text-black/60 text-sm">Submit your question and we'll add it to our FAQs.</p>
              </div>
            </div>
            <SubmitQuestionForm />
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
