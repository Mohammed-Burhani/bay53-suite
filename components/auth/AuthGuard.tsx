"use client";

// import { useEffect } from "react";
// import { useRouter } from "next/navigation";
// import { auth } from "@/lib/auth";

// ===== DEMO BRANCH: auth flow disabled for client demo, all routes open =====
export default function AuthGuard({ children }: { children: React.ReactNode }) {
  // const router = useRouter();

  // useEffect(() => {
  //   if (!auth.isAuthenticated()) {
  //     router.replace("/login");
  //   }
  // }, [router]);

  // if (!auth.isAuthenticated()) return null;

  return <>{children}</>;
}
