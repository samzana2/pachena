import { Metadata } from "next";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Card, CardContent } from "@/components/ui/card";
import { CheckCircle, AlertCircle, Info, Clock } from "lucide-react";

export const metadata: Metadata = {
  title: "Employer Guidelines — Pachena",
  description:
    "Best practices for managing your company's presence on Pachena and engaging with employee feedback.",
};

export default function EmployerGuidelinesPage() {
  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="container py-16">
        <div className="mx-auto max-w-3xl">
          <h1 className="font-heading text-4xl font-bold text-foreground">Employer Guidelines</h1>
          <p className="mt-4 text-lg text-muted-foreground">
            Best practices for managing your company's presence on Pachena and engaging with employee feedback.
          </p>

          <div className="mt-12 space-y-8">
            <Card>
              <CardContent className="pt-6">
                <h2 className="flex items-center gap-2 font-heading text-xl font-semibold text-foreground">
                  <CheckCircle className="h-5 w-5 text-green-500" />
                  Best Practices for Responding to Reviews
                </h2>
                <ul className="mt-4 space-y-3 text-muted-foreground">
                  <li>• <strong>Respond promptly:</strong> Show candidates you actively engage with feedback</li>
                  <li>• <strong>Be professional:</strong> Maintain a respectful tone, even for negative reviews</li>
                  <li>• <strong>Thank the reviewer:</strong> Acknowledge their time and input</li>
                  <li>• <strong>Address concerns:</strong> Provide context or explain changes you're making</li>
                  <li>• <strong>Invite dialogue:</strong> Offer to discuss concerns through appropriate channels</li>
                </ul>
                <p className="mt-4 flex items-center gap-2 text-sm text-amber-600">
                  <Clock className="h-4 w-4" />
                  Coming in Phase 2 — Review responses will be available once employer accounts launch.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <h2 className="flex items-center gap-2 font-heading text-xl font-semibold text-foreground">
                  <AlertCircle className="h-5 w-5 text-amber-500" />
                  What to Avoid
                </h2>
                <ul className="mt-4 space-y-3 text-muted-foreground">
                  <li>• <strong>Defensive responses:</strong> Avoid dismissing or arguing with reviewers</li>
                  <li>• <strong>Identifying reviewers:</strong> Never attempt to identify anonymous reviewers</li>
                  <li>• <strong>Retaliating:</strong> Taking action against suspected reviewers is prohibited</li>
                  <li>• <strong>Fake reviews:</strong> Don't post fake positive reviews or incentivize reviews</li>
                  <li>• <strong>Sharing private info:</strong> Keep confidential matters confidential</li>
                </ul>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <h2 className="flex items-center gap-2 font-heading text-xl font-semibold text-foreground">
                  <Info className="h-5 w-5 text-blue-500" />
                  Managing Your Profile
                </h2>
                <div className="mt-4 space-y-4 text-muted-foreground">
                  <p>
                    <strong>Keep information current:</strong> Regularly update your company description,
                    benefits, and other details to give job seekers accurate information.
                  </p>
                  <p>
                    <strong>Showcase your culture:</strong> Use your profile to highlight what makes
                    your workplace unique—company values, team events, growth opportunities.
                  </p>
                  <p>
                    <strong>Monitor your ratings:</strong> Track trends in your ratings and reviews
                    to identify areas for improvement.
                  </p>
                </div>
                <p className="mt-4 flex items-center gap-2 text-sm text-amber-600">
                  <Clock className="h-4 w-4" />
                  Coming in Phase 2 — Profile management will be available once employer accounts launch.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <h2 className="font-heading text-xl font-semibold text-foreground">Flagging Inappropriate Reviews</h2>
                <p className="mt-4 text-muted-foreground">
                  If you believe a review violates our guidelines—such as containing false information,
                  personal attacks, or confidential data—you can flag it for our moderation team to review.
                  We investigate all flagged reviews and remove those that violate our policies.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <h2 className="font-heading text-xl font-semibold text-foreground">Private Feedback Channel</h2>
                <p className="mt-4 text-muted-foreground">
                  In the future, claimed companies will have access to a private feedback channel where employees can
                  share concerns directly with you. This feedback will be anonymous and visible only to
                  your company, allowing you to address issues proactively.
                </p>
                <p className="mt-4 flex items-center gap-2 text-sm text-amber-600">
                  <Clock className="h-4 w-4" />
                  Coming in Phase 2 — This feature will be available once employer accounts launch.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <h2 className="font-heading text-xl font-semibold text-foreground">Claiming Your Company</h2>
                <p className="mt-4 text-muted-foreground">
                  Company claiming allows verified representatives to manage their company's profile,
                  respond to reviews, and access analytics. The claiming process requires verification
                  of your role as an authorized company representative.
                </p>
                <p className="mt-4 flex items-center gap-2 text-sm text-amber-600">
                  <Clock className="h-4 w-4" />
                  Coming in Phase 2 — Company claiming will be available once employer accounts launch.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
