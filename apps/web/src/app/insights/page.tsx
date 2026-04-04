import Link from "next/link";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart3, MessageSquare, TrendingUp, Users, Shield, Eye } from "lucide-react";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Employer Insights | Pachena",
  description:
    "Understand what your employees really think and build a better workplace with Pachena's employer insights tools.",
};

export default function InsightsPage() {
  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="container py-16">
        <div className="mx-auto max-w-4xl">
          <h1 className="font-heading text-4xl font-bold text-foreground">Employer Insights</h1>
          <p className="mt-4 text-lg text-muted-foreground">
            Understand what your employees really think and build a better workplace.
          </p>

          <div className="mt-12 grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <BarChart3 className="h-10 w-10 text-primary" />
                <CardTitle className="mt-4">Analytics Dashboard</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  Track your company&apos;s ratings over time, identify trends, and benchmark
                  against industry averages.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <MessageSquare className="h-10 w-10 text-primary" />
                <CardTitle className="mt-4">Review Responses</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  Respond publicly to reviews and show candidates that you value employee
                  feedback and are committed to improvement.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <TrendingUp className="h-10 w-10 text-primary" />
                <CardTitle className="mt-4">Competitive Analysis</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  See how your ratings compare to competitors and identify areas where
                  you can differentiate your employer brand.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <Users className="h-10 w-10 text-primary" />
                <CardTitle className="mt-4">Talent Attraction</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  A strong Pachena profile helps attract top talent. Job seekers research
                  companies before applying—make sure they see your best side.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <Eye className="h-10 w-10 text-primary" />
                <CardTitle className="mt-4">Profile Visibility</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  Claimed profiles get enhanced visibility, including featured placement
                  and the ability to add company details and benefits.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <Shield className="h-10 w-10 text-primary" />
                <CardTitle className="mt-4">Private Feedback</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  Receive anonymous private feedback from employees that only you can see,
                  helping you address issues before they become public.
                </p>
              </CardContent>
            </Card>
          </div>

          <div className="mt-12 rounded-lg bg-secondary p-8 text-center">
            <h2 className="font-heading text-2xl font-semibold text-foreground">
              Ready to take control of your employer brand?
            </h2>
            <p className="mt-2 text-muted-foreground">
              Claim your company profile today and start engaging with employee feedback.
            </p>
            <div className="mt-6 flex justify-center gap-4">
              <Button asChild>
                <Link href="/employers">Claim Your Company</Link>
              </Button>
              <Button variant="outline" asChild>
                <Link href="/pricing">View Pricing</Link>
              </Button>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
