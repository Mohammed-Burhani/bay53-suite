"use client";

// ==================== Auth Hook ====================
// Simple auth management with React Query

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { authService } from "@/lib/api/auth.service";
import { auth } from "@/lib/auth";
import { createClient } from "@/supabase/client";
import { onboardingService } from "@/lib/services/onboarding.service";
import type { AuthSession, LoginPayload, VerifyOtpPayload, CompanySetupPayload } from "@/lib/types/auth.types";

export function useSession(): AuthSession | null {
  return auth.getSession();
}

export function useLogin() {
  const router = useRouter();

  return useMutation({
    mutationFn: (payload: LoginPayload) => authService.login(payload),
    onSuccess: async (data, variables) => {
      // Login success → auto-call GenerateOtp
      try {
        const otpResponse = await authService.generateOtp({ userName: variables.userName });
        
        // In dev mode, pass OTP in URL for testing
        const isDev = process.env.NEXT_PUBLIC_NODE_ENV === 'development';
        const otpParam = isDev ? `&otp=${otpResponse.otp}` : '';
        
        // Redirect to OTP page
        router.push(`/verify-otp?userName=${encodeURIComponent(variables.userName)}${otpParam}`);
      } catch (error) {
        console.error("Failed to generate OTP:", error);
        throw error;
      }
    },
  });
}

export function useVerifyOtp() {
  const queryClient = useQueryClient();
  const router = useRouter();

  return useMutation({
    mutationFn: (payload: VerifyOtpPayload) => authService.verifyOtpLogin(payload),
    onSuccess: (data) => {
      const session: AuthSession = {
        user: data.user,
        company: data.company,
        roles: data.roles,
        rights: data.rights,
      };
      
      auth.setSession(session);
      queryClient.setQueryData(["auth", "session"], session);
      router.push("/dashboard");
    },
  });
}

export function useGenerateOtp() {
  const router = useRouter();

  return useMutation({
    mutationFn: (payload: { userName: string }) => authService.generateOtp(payload),
    onSuccess: (data, variables) => {
      // In dev mode, pass OTP in URL for testing (resend case)
      const isDev = process.env.NEXT_PUBLIC_NODE_ENV === 'development';
      const otpParam = isDev ? `&otp=${data.otp}` : '';
      router.push(`/verify-otp?userName=${encodeURIComponent(variables.userName)}${otpParam}`);
    },
  });
}

export function useLogout() {
  const queryClient = useQueryClient();
  const router = useRouter();

  return () => {
    auth.clearSession();
    queryClient.clear();
    router.push("/login");
  };
}

export function useGoogleLogin() {
  return useMutation({
    mutationFn: async () => {
      const supabase = createClient();
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
        },
      });

      if (error) throw error;
      return data;
    },
  });
}

export function useGoogleSignup() {
  return useMutation({
    mutationFn: async () => {
      const supabase = createClient();
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
        },
      });

      if (error) throw error;
      return data;
    },
  });
}

export function useCompanySetup() {
  const router = useRouter();

  return useMutation({
    mutationFn: async (payload: CompanySetupPayload) => {
      const { user, organization } = await onboardingService.setupCompany(payload);
      return { user, organization };
    },
    onSuccess: () => {
      // Session created by Supabase auth.signUp, just redirect
      router.push("/dashboard");
    },
  });
}
