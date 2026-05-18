import { createClient } from "@/supabase/server";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");
  const origin = requestUrl.origin;

  if (code) {
    const supabase = await createClient(); 
    const { data, error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error && data.session) {
      const user = data.user;
      
      // Call backend to register/login Google user
      try {
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/Auth/GoogleAuth`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            accept: "*/*",
          },
          body: JSON.stringify({
            email: user.email,
            name: user.user_metadata?.full_name || user.email?.split("@")[0],
            googleId: user.id,
            picture: user.user_metadata?.avatar_url,
          }),
        });

        if (response.ok) {
          const authData = await response.json();
          
          // Store session in localStorage via redirect with data
          // Use URL params to pass session data (will be picked up by client)
          const sessionData = encodeURIComponent(JSON.stringify({
            user: authData.user,
            company: authData.company,
            roles: authData.roles,
            rights: authData.rights,
          }));
          
          return NextResponse.redirect(
            `${origin}/auth/success?session=${sessionData}&isNew=${authData.isNewUser}`
          );
        }
      } catch (err) {
        console.error("Backend auth error:", err);
      }
    }
  }

  // Error case - redirect to login with error
  return NextResponse.redirect(`${origin}/login?error=auth_failed`);
}
