"use client";

import { useState, useEffect } from "react";
import { createBrowserSupabaseClient } from "@/lib/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogHeader, 
  DialogTitle,
  DialogFooter 
} from "@/components/ui/dialog";
import { Loader2, Shield, ShieldCheck, ShieldOff, Smartphone, Copy, Check } from "lucide-react";
import { toast } from "sonner";
const supabase = createBrowserSupabaseClient();

interface MfaFactor {
  id: string;
  friendly_name?: string;
  factor_type: string;
  status: string;
  created_at: string;
}

export const MfaSettings = () => {
  const [factors, setFactors] = useState<MfaFactor[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isEnrolling, setIsEnrolling] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [isDisabling, setIsDisabling] = useState(false);
  
  // Enrollment state
  const [showEnrollDialog, setShowEnrollDialog] = useState(false);
  const [qrCode, setQrCode] = useState<string | null>(null);
  const [secret, setSecret] = useState<string | null>(null);
  const [factorId, setFactorId] = useState<string | null>(null);
  const [verificationCode, setVerificationCode] = useState("");
  const [copied, setCopied] = useState(false);
  
  // Disable confirmation
  const [showDisableDialog, setShowDisableDialog] = useState(false);
  const [factorToDisable, setFactorToDisable] = useState<MfaFactor | null>(null);

  useEffect(() => {
    fetchMfaFactors();
  }, []);

  const fetchMfaFactors = async () => {
    try {
      const { data, error } = await supabase.auth.mfa.listFactors();
      if (error) throw error;
      
      // Get verified TOTP factors
      const verifiedFactors = data?.totp?.filter(f => f.status === "verified") || [];
      setFactors(verifiedFactors);
    } catch (error) {
      console.error("Error fetching MFA factors:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleEnrollMfa = async () => {
    setIsEnrolling(true);
    try {
      const { data, error } = await supabase.auth.mfa.enroll({
        factorType: "totp",
        friendlyName: "Authenticator App",
      });

      if (error) throw error;

      setQrCode(data.totp.qr_code);
      setSecret(data.totp.secret);
      setFactorId(data.id);
      setShowEnrollDialog(true);
    } catch (error: unknown) {
      console.error("MFA enrollment error:", error);
      toast.error(error instanceof Error ? error.message : "Failed to start MFA enrollment");
    } finally {
      setIsEnrolling(false);
    }
  };

  const handleVerifyEnrollment = async () => {
    if (!factorId || verificationCode.length !== 6) {
      toast.error("Please enter a 6-digit code");
      return;
    }

    setIsVerifying(true);
    try {
      const { data: challengeData, error: challengeError } = await supabase.auth.mfa.challenge({
        factorId,
      });

      if (challengeError) throw challengeError;

      const { error: verifyError } = await supabase.auth.mfa.verify({
        factorId,
        challengeId: challengeData.id,
        code: verificationCode,
      });

      if (verifyError) throw verifyError;

      toast.success("Two-factor authentication enabled successfully!");
      setShowEnrollDialog(false);
      resetEnrollmentState();
      fetchMfaFactors();
    } catch (error: unknown) {
      console.error("MFA verification error:", error);
      toast.error(error instanceof Error ? error.message : "Invalid verification code");
    } finally {
      setIsVerifying(false);
    }
  };

  const handleDisableMfa = async () => {
    if (!factorToDisable) return;

    setIsDisabling(true);
    try {
      const { error } = await supabase.auth.mfa.unenroll({
        factorId: factorToDisable.id,
      });

      if (error) throw error;

      toast.success("Two-factor authentication disabled");
      setShowDisableDialog(false);
      setFactorToDisable(null);
      fetchMfaFactors();
    } catch (error: unknown) {
      console.error("MFA disable error:", error);
      toast.error(error instanceof Error ? error.message : "Failed to disable 2FA");
    } finally {
      setIsDisabling(false);
    }
  };

  const resetEnrollmentState = () => {
    setQrCode(null);
    setSecret(null);
    setFactorId(null);
    setVerificationCode("");
    setCopied(false);
  };

  const copySecret = () => {
    if (secret) {
      navigator.clipboard.writeText(secret);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const isMfaEnabled = factors.length > 0;

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Two-Factor Authentication
          </CardTitle>
          <CardDescription>
            Add an extra layer of security to your admin account
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {isMfaEnabled ? (
                <ShieldCheck className="h-8 w-8 text-green-600" />
              ) : (
                <ShieldOff className="h-8 w-8 text-muted-foreground" />
              )}
              <div>
                <p className="font-medium">
                  {isMfaEnabled ? "2FA is enabled" : "2FA is not enabled"}
                </p>
                <p className="text-sm text-muted-foreground">
                  {isMfaEnabled
                    ? "Your account is protected with an authenticator app"
                    : "Enable 2FA to secure your account"}
                </p>
              </div>
            </div>
            <Badge variant={isMfaEnabled ? "default" : "secondary"}>
              {isMfaEnabled ? "Active" : "Inactive"}
            </Badge>
          </div>

          {isMfaEnabled ? (
            <div className="space-y-3">
              {factors.map((factor) => (
                <div
                  key={factor.id}
                  className="flex items-center justify-between rounded-lg border p-3"
                >
                  <div className="flex items-center gap-3">
                    <Smartphone className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <p className="text-sm font-medium">
                        {factor.friendly_name || "Authenticator App"}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Added on {new Date(factor.created_at).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => {
                      setFactorToDisable(factor);
                      setShowDisableDialog(true);
                    }}
                  >
                    Remove
                  </Button>
                </div>
              ))}
            </div>
          ) : (
            <Button onClick={handleEnrollMfa} disabled={isEnrolling}>
              {isEnrolling ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Shield className="mr-2 h-4 w-4" />
              )}
              Enable Two-Factor Authentication
            </Button>
          )}
        </CardContent>
      </Card>

      {/* Enrollment Dialog */}
      <Dialog open={showEnrollDialog} onOpenChange={(open) => {
        if (!open) {
          setShowEnrollDialog(false);
          resetEnrollmentState();
        }
      }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Set Up Two-Factor Authentication</DialogTitle>
            <DialogDescription>
              Scan the QR code with your authenticator app (Google Authenticator, Authy, etc.)
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {qrCode && (
              <div className="flex justify-center">
                <div className="rounded-lg border bg-white p-4">
                  <img src={qrCode} alt="MFA QR Code" className="h-48 w-48" />
                </div>
              </div>
            )}

            {secret && (
              <div className="space-y-2">
                <Label className="text-muted-foreground text-xs">
                  Can't scan? Enter this code manually:
                </Label>
                <div className="flex gap-2">
                  <Input
                    value={secret}
                    readOnly
                    className="font-mono text-xs"
                  />
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={copySecret}
                    className="shrink-0"
                  >
                    {copied ? (
                      <Check className="h-4 w-4 text-green-600" />
                    ) : (
                      <Copy className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="verification-code">
                Enter the 6-digit code from your app
              </Label>
              <Input
                id="verification-code"
                value={verificationCode}
                onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                placeholder="000000"
                className="text-center font-mono text-lg tracking-widest"
                maxLength={6}
              />
            </div>

            <Alert>
              <AlertDescription className="text-xs">
                Make sure to save your authenticator app's backup codes. If you lose access to your device, you'll need these to recover your account.
              </AlertDescription>
            </Alert>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => {
              setShowEnrollDialog(false);
              resetEnrollmentState();
            }}>
              Cancel
            </Button>
            <Button
              onClick={handleVerifyEnrollment}
              disabled={isVerifying || verificationCode.length !== 6}
            >
              {isVerifying && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Verify & Enable
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Disable Confirmation Dialog */}
      <Dialog open={showDisableDialog} onOpenChange={setShowDisableDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Disable Two-Factor Authentication?</DialogTitle>
            <DialogDescription>
              This will remove the extra security layer from your account. You can re-enable it at any time.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDisableDialog(false)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDisableMfa}
              disabled={isDisabling}
            >
              {isDisabling && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Disable 2FA
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};
