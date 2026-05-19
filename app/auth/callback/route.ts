import { createClient } from "@/supabase/server";
import { NextResponse } from "next/server";
import { onboardingService } from "@/lib/services/onboarding.service";

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");
  const origin = requestUrl.origin;

  if (code) {
    const supabase = await createClient();
    const { data, error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error && data.session) {
      const user = data.user;
      
      // Handle Google OAuth user in Supabase
      try {
        const result = await onboardingService.handleGoogleUser({
          email: user.email!,
          name: user.user_metadata?.full_name || user.email?.split("@")[0] || "User",
          googleId: user.id,
          picture: user.user_metadata?.avatar_url,
        });

        // Always redirect to dashboard (company setup not required)
        return NextResponse.redirect(`${origin}/dashboard`);
      } catch (err) {
        console.error("Onboarding error:", err);
      }
    }
  }

  // Error case - redirect to login with error
  return NextResponse.redirect(`${origin}/login?error=auth_failed`);
}
