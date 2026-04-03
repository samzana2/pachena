"use client";

import { useState } from "react";
import { createBrowserSupabaseClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, Shield } from "lucide-react";
import { toast } from "sonner";
const supabase = createBrowserSupabaseClient();

interface MfaVerificationProps {
  factorId: string;
  onSuccess: () => void;
  onCancel: () => void;
}

export const MfaVerification = ({ factorId, onSuccess, onCancel }: MfaVerificationProps) => {
  const [code, setCode] = useState("");
  const [isVerifying, setIsVerifying] = useState(false);

  const handleVerify = async () => {
    if (code.length !== 6) {
      toast.error("Please enter a 6-digit code");
      return;
    }

    setIsVerifying(true);
    try {
      // Create MFA challenge
      const { data: challengeData, error: challengeError } = await supabase.auth.mfa.challenge({
        factorId,
      });

      if (challengeError) throw challengeError;

      // Verify the code
      const { error: verifyError } = await supabase.auth.mfa.verify({
        factorId,
        challengeId: challengeData.id,
        code,
      });

      if (verifyError) throw verifyError;

      onSuccess();
    } catch (error: unknown) {
      console.error("MFA verification error:", error);
      toast.error("Invalid verification code. Please try again.");
      setCode("");
    } finally {
      setIsVerifying(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && code.length === 6) {
      handleVerify();
    }
  };

  return (
    <Card className="w-full max-w-md">
      <CardHeader className="text-center">
        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
          <Shield className="h-6 w-6 text-primary" />
        </div>
        <CardTitle>Two-Factor Authentication</CardTitle>
        <CardDescription>
          Enter the 6-digit code from your authenticator app
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="mfa-code" className="sr-only">
            Verification Code
          </Label>
          <Input
            id="mfa-code"
            value={code}
            onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
            onKeyDown={handleKeyDown}
            placeholder="000000"
            className="text-center font-mono text-2xl tracking-[0.5em]"
            maxLength={6}
            autoFocus
            autoComplete="one-time-code"
          />
        </div>

        <div className="flex gap-3">
          <Button
            variant="outline"
            className="flex-1"
            onClick={onCancel}
            disabled={isVerifying}
          >
            Cancel
          </Button>
          <Button
            className="flex-1"
            onClick={handleVerify}
            disabled={isVerifying || code.length !== 6}
          >
            {isVerifying && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Verify
          </Button>
        </div>

        <p className="text-center text-xs text-muted-foreground">
          Open your authenticator app (Google Authenticator, Authy, etc.) to view your code
        </p>
      </CardContent>
    </Card>
  );
};
