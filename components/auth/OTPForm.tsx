"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useVerifyOtp, useGenerateOtp } from "@/lib/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Loader2, ArrowLeft, Shield, Mail, Clock } from "lucide-react";
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

  const securityFeatures = [
    { icon: Shield, title: "Secure Authentication", desc: "Military-grade encryption protects your data" },
    { icon: Mail, title: "Email Verification", desc: "OTP sent directly to your registered email" },
    { icon: Clock, title: "Time-Limited Code", desc: "Codes expire after 10 minutes for security" },
  ];

  return (
    <div className="min-h-screen flex">
      {/* Left Panel - Security Features */}
      <div className="hidden lg:flex lg:w-[60%] relative overflow-hidden bg-gradient-to-br from-orange-50 via-teal-50 to-blue-50 border-r-2 border-gray-200">
        {/* Animated Background Orbs */}
        <div className="absolute inset-0 overflow-hidden">
          <div 
            className="absolute top-1/4 left-1/4 w-96 h-96 rounded-full opacity-30 blur-3xl animate-float"
            style={{ background: "radial-gradient(circle, var(--bay-coral) 0%, transparent 70%)" }}
          />
          <div 
            className="absolute bottom-1/4 right-1/4 w-80 h-80 rounded-full opacity-30 blur-3xl animate-float-delayed"
            style={{ background: "radial-gradient(circle, var(--bay-teal) 0%, transparent 70%)" }}
          />
          <div 
            className="absolute top-1/2 right-1/3 w-72 h-72 rounded-full opacity-25 blur-3xl animate-float"
            style={{ 
              background: "radial-gradient(circle, var(--bay-violet) 0%, transparent 70%)",
              animationDelay: "-10s"
            }}
          />
        </div>

        {/* Content */}
        <div className="relative z-10 flex flex-col justify-between p-12 w-full">
          {/* Logo */}
          <div className="space-y-2">
            <div className="relative inline-block">
              <Image 
                src="/logo.png" 
                alt="BAY53 Logo" 
                width={200} 
                height={100}
                className="w-48 h-auto drop-shadow-lg"
              />
            </div>
          </div>

          {/* Security Features */}
          <div className="space-y-6 max-w-lg">
            <h2 className="text-2xl font-bold text-gray-900">Secure Access</h2>
            <div className="space-y-4">
              {securityFeatures.map((feature, idx) => {
                const Icon = feature.icon;
                return (
                  <div 
                    key={idx}
                    className="flex items-start gap-4 p-4 rounded-xl bg-white/80 backdrop-blur-sm border border-gray-200/50 shadow-sm transition-all duration-200 hover:shadow-md hover:bg-white"
                  >
                    <div 
                      className="p-2.5 rounded-lg"
                      style={{ 
                        background: `linear-gradient(135deg, var(--bay-coral), var(--bay-teal), var(--bay-violet))`
                      }}
                    >
                      <Icon className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900 text-sm">{feature.title}</h3>
                      <p className="text-sm text-gray-600 mt-0.5">{feature.desc}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Tagline */}
          <div className="text-gray-600 text-sm font-medium">
            Your security is our priority.
          </div>
        </div>
      </div>

      {/* Right Panel - OTP Form */}
      <div className="w-full lg:w-[40%] flex items-center justify-center p-6 bg-white">
        <div className="w-full max-w-md space-y-8">
          {/* Mobile Logo */}
          <div className="lg:hidden flex justify-center mb-8">
            <Image 
              src="/logo.png" 
              alt="BAY53 Logo" 
              width={150} 
              height={75}
              className="w-36 h-auto"
            />
          </div>

          {/* Header */}
          <div className="text-center space-y-2">
            <div 
              className="w-16 h-16 rounded-full mx-auto flex items-center justify-center"
              style={{ background: `linear-gradient(135deg, var(--bay-coral), var(--bay-teal), var(--bay-violet))` }}
            >
              <Shield className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900">Verify OTP</h1>
            <p className="text-sm text-gray-600">
              Enter the 6-digit code sent to your email
            </p>
          </div>

          {/* Form */}
          <form onSubmit={(e) => e.preventDefault()} className="space-y-6" noValidate>
            {/* Dev Mode OTP Display */}
            {isDev && devOtp && (
              <Alert className="bg-yellow-50 border-yellow-200">
                <AlertDescription className="text-sm">
                  <strong className="font-semibold">Dev Mode:</strong> OTP is{" "}
                  <code className="px-2 py-1 bg-yellow-100 rounded font-mono font-bold">{devOtp}</code>
                </AlertDescription>
              </Alert>
            )}

            {/* OTP Input */}
            <div className="space-y-3">
              <Label htmlFor="otp" className="text-center block text-gray-700 font-medium">
                One-Time Password
              </Label>
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
                  <InputOTPGroup className="gap-4">
                    <InputOTPSlot index={0} className="size-14! text-lg rounded-xl! border-gray-300" />
                    <InputOTPSlot index={1} className="size-14! text-lg rounded-xl! border-gray-300" />
                    <InputOTPSlot index={2} className="size-14! text-lg rounded-xl! border-gray-300" />
                    <InputOTPSlot index={3} className="size-14! text-lg rounded-xl! border-gray-300" />
                    <InputOTPSlot index={4} className="size-14! text-lg rounded-xl! border-gray-300" />
                    <InputOTPSlot index={5} className="size-14! text-lg rounded-xl! border-gray-300" />
                  </InputOTPGroup>
                </InputOTP>
              </div>
              {error && (
                <p className="text-sm text-red-600 text-center">{error}</p>
              )}
            </div>

            {/* Loading state */}
            {isPending && (
              <div className="flex items-center justify-center gap-2 text-sm text-gray-600">
                <Loader2 className="h-4 w-4 animate-spin" />
                Verifying...
              </div>
            )}

            {/* Resend OTP */}
            <div className="text-center">
              <button
                type="button"
                onClick={handleResendOTP}
                disabled={isResending || isPending}
                className="text-sm transition-colors underline-offset-4 hover:underline disabled:opacity-50"
                style={{ color: "var(--bay-teal)" }}
              >
                {isResending ? "Sending..." : "Didn't receive the code? Resend OTP"}
              </button>
            </div>

            {/* Back to Login */}
            <Button
              type="button"
              variant="outline"
              className="w-full h-11 rounded-xl border-gray-300 hover:bg-gray-50"
              onClick={() => router.push("/login")}
              disabled={isPending}
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Login
            </Button>
          </form>

          {/* Security Note */}
          <div 
            className="p-4 rounded-xl border text-center"
            style={{ 
              background: "linear-gradient(135deg, rgba(240, 112, 80, 0.05), rgba(77, 217, 172, 0.05), rgba(123, 143, 245, 0.05))",
              borderColor: "rgba(77, 217, 172, 0.2)"
            }}
          >
            <p className="text-xs text-gray-600">
              🔒 This code expires in 10 minutes for your security
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
