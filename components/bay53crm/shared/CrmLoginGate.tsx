"use client";

// The CRM API has its own accounts and its own JWT. Everything under /crm sits behind this gate: a visitor without a
// CRM token sees the CRM sign-in page, and a 401 from the API (which clears the token) sends them back to it.

import { useSyncExternalStore } from "react";
import { useCrmSession } from "@/lib/bay53crm/api";
import { CrmLoginScreen } from "./CrmLoginScreen";

const noopSubscribe = () => () => {};

export function CrmLoginGate({ children }: { children: React.ReactNode }) {
  const signedIn = useCrmSession();
  // The token lives in localStorage, so wait for the client before deciding whether to show the sign-in page.
  const mounted = useSyncExternalStore(noopSubscribe, () => true, () => false);

  if (!mounted) return null;
  if (signedIn) return <>{children}</>;
  return <CrmLoginScreen />;
}
