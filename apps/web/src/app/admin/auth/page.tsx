"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { createBrowserSupabaseClient } from "@/lib/supabase/client";
import { toast } from "sonner";
import { Loader2, Shield } from "lucide-react";
import { MfaVerification } from "@/components/admin/MfaVerification";

const supabase = createBrowserSupabaseClient();

const loginSchema = z.object({
  email: z.string().email("Please enter a valid email"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

type LoginFormData = z.infer<typeof loginSchema>;

type AuthStep = "login" | "mfa";

const AdminAuth = () => {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [isCheckingSession, setIsCheckingSession] = useState(true);
  const [authStep, setAuthStep] = useState<AuthStep>("login");
  const [mfaFactorId, setMfaFactorId] = useState<string | null>(null);
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  const loginForm = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "" },
  });

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (isLoggingIn) return;

      if (session?.user) {
        setTimeout(() => {
          checkAdminAndRedirect(session.user.id);
        }, 0);
      }
    });

    const validateSession = async () => {
      const { data: { session }, error } = await supabase.auth.getSession();

      if (error) {
        console.log("Session validation error, clearing local state:", error.message);
        await supabase.auth.signOut({ scope: 'local' });
        setIsCheckingSession(false);
        return;
      }

      if (session?.user) {
        const { error: refreshError } = await supabase.auth.refreshSession();
        if (refreshError) {
          console.log("Session refresh failed, clearing local state:", refreshError.message);
          await supabase.auth.signOut({ scope: 'local' });
          setIsCheckingSession(false);
          return;
        }
        await checkAdminAndRedirect(session.user.id);
      } else {
        setIsCheckingSession(false);
      }
    };

    validateSession();

    return () => subscription.unsubscribe();
  }, []);

  const checkAdminAndRedirect = async (userId: string) => {
    try {
      const { data: isAdmin, error } = await supabase.rpc('is_admin', { _user_id: userId });

      if (error) {
        console.error("Error checking admin status:", error);
        setIsCheckingSession(false);
        return;
      }

      if (isAdmin) {
        router.push("/admin");
      } else {
        await supabase.auth.signOut({ scope: 'local' });
        toast.error("You don't have admin access. Please use the Employer Portal instead.");
        setIsCheckingSession(false);
      }
    } catch (error) {
      console.error("Error checking admin status:", error);
      setIsCheckingSession(false);
    }
  };

  const onLogin = async (data: LoginFormData) => {
    setIsLoading(true);
    setIsLoggingIn(true);
    try {
      const { data: authData, error } = await supabase.auth.signInWithPassword({
        email: data.email,
        password: data.password,
      });

      if (error) {
        if (error.message.includes("MFA") || error.code === "mfa_challenge_required") {
          const { data: factorsData } = await supabase.auth.mfa.listFactors();
          const totpFactors = factorsData?.totp?.filter(f => f.status === "verified") || [];

          if (totpFactors.length > 0) {
            setMfaFactorId(totpFactors[0].id);
            setAuthStep("mfa");
            setIsLoading(false);
            return;
          }
        }

        if (error.message.includes("Invalid login credentials")) {
          toast.error("Invalid email or password");
        } else {
          toast.error(error.message);
        }
        return;
      }

      const { data: aalData } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel();

      if (aalData?.currentLevel === "aal1" && aalData?.nextLevel === "aal2") {
        const { data: factorsData } = await supabase.auth.mfa.listFactors();
        const totpFactors = factorsData?.totp?.filter(f => f.status === "verified") || [];

        if (totpFactors.length > 0) {
          setMfaFactorId(totpFactors[0].id);
          setAuthStep("mfa");
          return;
        }
      }

      if (authData.user) {
        const { data: isAdmin, error: roleError } = await supabase.rpc('is_admin', {
          _user_id: authData.user.id
        });

        if (roleError || !isAdmin) {
          await supabase.auth.signOut({ scope: 'local' });
          toast.error("You don't have admin access. Please use the Employer Portal instead.");
          return;
        }

        toast.success("Welcome back, Admin!");
        router.push("/admin");
      }
    } catch (error) {
      toast.error("An unexpected error occurred");
    } finally {
      setIsLoading(false);
      setIsLoggingIn(false);
    }
  };

  const handleMfaSuccess = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();

      if (session?.user) {
        const { data: isAdmin, error: roleError } = await supabase.rpc('is_admin', {
          _user_id: session.user.id
        });

        if (roleError || !isAdmin) {
          await supabase.auth.signOut({ scope: 'local' });
          toast.error("You don't have admin access.");
          setAuthStep("login");
          return;
        }

        toast.success("Welcome back, Admin!");
        router.push("/admin");
      }
    } catch (error) {
      console.error("Error after MFA:", error);
      toast.error("An error occurred. Please try again.");
      setAuthStep("login");
    }
  };

  const handleMfaCancel = async () => {
    await supabase.auth.signOut({ scope: 'local' });
    setAuthStep("login");
    setMfaFactorId(null);
  };

  if (isCheckingSession) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground">Checking session...</p>
        </div>
      </div>
    );
  }

  if (authStep === "mfa" && mfaFactorId) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center px-4">
        <MfaVerification
          factorId={mfaFactorId}
          onSuccess={handleMfaSuccess}
          onCancel={handleMfaCancel}
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="w-full max-w-md px-4">
        <div className="text-center mb-8">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10 mb-4">
            <Shield className="h-8 w-8 text-primary" />
          </div>
          <h1 className="text-3xl font-semibold text-foreground">Pachena Admin Portal</h1>
          <p className="mt-2 text-muted-foreground">
            Internal staff access only
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Admin Login</CardTitle>
            <CardDescription>
              Sign in with your Pachena staff credentials
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...loginForm}>
              <form onSubmit={loginForm.handleSubmit(onLogin)} className="space-y-4">
                <FormField
                  control={loginForm.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email</FormLabel>
                      <FormControl>
                        <Input type="email" placeholder="you@pachena.co" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={loginForm.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Password</FormLabel>
                      <FormControl>
                        <Input type="password" placeholder="Enter password" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <Button type="submit" className="w-full" disabled={isLoading}>
                  {isLoading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                  Sign In
                </Button>
              </form>
            </Form>
          </CardContent>
        </Card>

        <p className="text-center text-sm text-muted-foreground mt-6">
          Are you an employer?{" "}
          <a href="/auth" className="text-primary hover:underline">
            Go to Employer Portal
          </a>
        </p>
      </div>
    </div>
  );
};

export default AdminAuth;
