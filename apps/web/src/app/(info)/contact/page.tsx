"use client";

import { useState } from "react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { createBrowserSupabaseClient } from "@/lib/supabase/client";

export default function ContactPage() {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);

    const formData = new FormData(e.target as HTMLFormElement);
    const name = formData.get("name") as string;
    const email = formData.get("email") as string;
    const subject = formData.get("subject") as string;
    const message = formData.get("message") as string;

    try {
      const supabase = createBrowserSupabaseClient();

      // Save to database
      const { error: dbError } = await supabase
        .from("contact_messages")
        .insert({ name, email, subject, message });

      if (dbError) {
        console.error("Database error:", dbError);
        throw new Error("Failed to save message");
      }

      // Send email notifications (non-blocking)
      supabase.functions.invoke("send-contact-notification", {
        body: { name, email, subject, message },
      }).catch((err) => {
        console.error("Email notification error:", err);
      });

      toast({
        title: "Message sent!",
        description: "We'll get back to you as soon as possible.",
      });

      (e.target as HTMLFormElement).reset();
    } catch (error) {
      console.error("Contact form error:", error);
      toast({
        title: "Error",
        description: "Failed to send message. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header />

      <main className="flex-1 flex flex-col items-center justify-center py-20 bg-gradient-to-br from-amber-50 via-rose-50 to-violet-50">
        <div className="container">
          <div className="max-w-lg mx-auto text-center">
            <h1 className="text-4xl md:text-5xl font-medium text-black">Contact Us</h1>
            <p className="mt-4 text-lg text-black/70">
              Have questions or feedback? We'd love to hear from you.
            </p>
          </div>

          <div className="mt-10 max-w-lg mx-auto">
            <Card>
              <CardHeader>
                <CardTitle className="text-black">Send us a message</CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <Label htmlFor="name" className="text-black">Name</Label>
                    <Input id="name" name="name" required placeholder="Your name" className="mt-1.5" />
                  </div>
                  <div>
                    <Label htmlFor="email" className="text-black">Email</Label>
                    <Input id="email" name="email" type="email" required placeholder="your@email.com" className="mt-1.5" />
                  </div>
                  <div>
                    <Label htmlFor="subject" className="text-black">Subject</Label>
                    <Input id="subject" name="subject" required placeholder="How can we help?" className="mt-1.5" />
                  </div>
                  <div>
                    <Label htmlFor="message" className="text-black">Message</Label>
                    <Textarea id="message" name="message" required placeholder="Your message..." rows={5} className="mt-1.5" />
                  </div>
                  <Button type="submit" className="w-full" disabled={isSubmitting}>
                    {isSubmitting ? "Sending..." : "Send Message"}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
