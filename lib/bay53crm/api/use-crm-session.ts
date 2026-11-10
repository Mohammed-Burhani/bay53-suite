"use client";

import { useSyncExternalStore } from "react";
import { crmTokenStore } from "./token-store";

/** True while a CRM token is stored. Flips to false when a 401 clears it. */
export function useCrmSession(): boolean {
  return useSyncExternalStore(
    crmTokenStore.subscribe,
    () => crmTokenStore.get() !== null,
    () => false
  );
}
