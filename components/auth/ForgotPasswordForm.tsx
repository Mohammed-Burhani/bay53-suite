"use client";

import { useForm } from "react-hook-form";
import { useRouter } from "next/navigation";
import { useGenerateOtp } from "@/lib/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, Loader2 } from "lucide-react";
import Image from "next/image";
import { toast } from "sonner";

interface ForgotPasswordFormData {
  userName: string;
}

export default function ForgotPasswordForm() {
  const router = useRouter();
  const { mutate: generateOtp, isPending, error } = useGenerateOtp();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ForgotPasswordFormData>({
    defaultValues: { userName: "" },
  });

  const onSubmit = (data: ForgotPasswordFormData) => {
    generateOtp(data, {
      onSuccess: () => {
        toast.success("OTP Sent", {
          description: "A verification code has been sent to your email",
        });
      },
    });
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
          <CardTitle className="text-2xl">Forgot Password</CardTitle>
          <CardDescription className="mt-1">
            Enter your username to receive a verification code
          </CardDescription>
        </div>
      </CardHeader>

      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
          {/* Username */}
          <div className="space-y-1.5">
            <Label htmlFor="userName">Username</Label>
            <Input
              id="userName"
              type="text"
              placeholder="Enter your username"
              autoComplete="username"
              autoFocus
              {...register("userName", { required: "Username is required" })}
              aria-invalid={!!errors.userName}
            />
            {errors.userName && (
              <p className="text-sm text-destructive">{errors.userName.message}</p>
            )}
          </div>

          {/* API Error */}
          {error && (
            <div className="rounded-md bg-destructive/10 border border-destructive/20 px-3 py-2.5">
              <p className="text-sm text-destructive">
                {error.message.includes("404") || error.message.includes("400")
                  ? "Username not found. Please check and try again."
                  : "Something went wrong. Please try again."}
              </p>
            </div>
          )}

          <Button type="submit" className="w-full mt-2" disabled={isPending}>
            {isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Sending OTP...
              </>
            ) : (
              "Send OTP"
            )}
          </Button>

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
