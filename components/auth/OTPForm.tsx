"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useVerifyOtp, useGenerateOtp } from "@/lib/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, ArrowLeft } from "lucide-react";
import Image from "next/image";
import { toast } from "sonner";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface OTPFormProps {
  userName: string;
  devOtp?: string | null;
}

export default function OTPForm({ userName, devOtp }: OTPFormProps) {
  const [otp, setOtp] = useState("");
  const [error, setError] = useState("");
  const router = useRouter();
  const { mutate: verifyOtp, isPending } = useVerifyOtp();
  const { mutate: generateOtp, isPending: isResending } = useGenerateOtp();
  const isDev = process.env.NODE_ENV === 'development';

  const handleComplete = (value: string) => {
    setError("");
    
    verifyOtp(
      { userName, otp: value },
      {
        onSuccess: () => {
          toast.success("Login successful!");
        },
        onError: (err: any) => {
          const errorMsg = err?.data === "Invalid or expired OTP" 
            ? "Invalid or expired OTP" 
            : "Invalid OTP. Please try again.";
          setError(errorMsg);
        },
      }
    );
  };

  const handleResendOTP = () => {
    generateOtp(
      { userName },
      {
        onSuccess: () => {
          toast.success("OTP Sent", {
            description: "A new OTP has been sent to your email",
          });
          setOtp("");
          setError("");
        },
        onError: () => {
          toast.error("Failed to resend OTP. Please try again.");
        },
      }
    );
  };

  return (
    <Card className="w-full max-w-md shadow-lg border-0 py-4">
      <CardHeader className="space-y-3">
        <div className="flex items-center justify-center">
          <Image 
            src="/logo.png" 
            alt="Bay53 Logo" 
            width={500} 
            height={500}
            className="w-28 h-16"
          />
        </div>
        <div>
          <CardTitle className="text-2xl">Verify OTP</CardTitle>
          <CardDescription className="mt-1">
            Enter the 6-digit code sent to your email
          </CardDescription>
        </div>
      </CardHeader>

      <CardContent>
        <form onSubmit={(e) => e.preventDefault()} className="space-y-4" noValidate>
          {/* Dev Mode OTP Display */}
          {isDev && devOtp && (
            <Alert className="bg-yellow-50 border-yellow-200">
              <AlertDescription className="text-sm">
                <strong className="font-semibold">Dev Mode:</strong> OTP is <code className="px-2 py-1 bg-yellow-100 rounded font-mono font-bold">{devOtp}</code>
              </AlertDescription>
            </Alert>
          )}

          {/* OTP Input */}
          <div className="space-y-2">
            <Label htmlFor="otp" className="text-center block">One-Time Password</Label>
            <div className="flex justify-center">
              <InputOTP
                maxLength={6}
                value={otp}
                onChange={(value) => {
                  setOtp(value);
                  setError("");
                  if (value.length === 6) {
                    handleComplete(value);
                  }
                }}
                disabled={isPending}
              >
                <InputOTPGroup>
                  <InputOTPSlot index={0} />
                  <InputOTPSlot index={1} />
                  <InputOTPSlot index={2} />
                  <InputOTPSlot index={3} />
                  <InputOTPSlot index={4} />
                  <InputOTPSlot index={5} />
                </InputOTPGroup>
              </InputOTP>
            </div>
            {error && (
              <p className="text-sm text-destructive text-center">{error}</p>
            )}
          </div>

          {/* Resend OTP */}
          <div className="text-center">
            <button
              type="button"
              onClick={handleResendOTP}
              disabled={isResending || isPending}
              className="text-sm text-muted-foreground hover:text-foreground transition-colors underline-offset-4 hover:underline disabled:opacity-50"
            >
              {isResending ? "Sending..." : "Didn't receive the code? Resend OTP"}
            </button>
          </div>

          {/* Loading state */}
          {isPending && (
            <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              Verifying...
            </div>
          )}

          {/* Back to Login */}
          <Button
            type="button"
            variant="ghost"
            className="w-full"
            onClick={() => router.push("/login")}
            disabled={isPending}
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Login
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
