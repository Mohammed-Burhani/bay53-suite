"use client";

import { useCallback, useSyncExternalStore } from "react";

// localStorage can throw or be empty (private mode, blocked storage). Memory is the fallback.
const memory = new Map<string, string>();
const listeners = new Set<() => void>();

function subscribe(cb: () => void) {
  listeners.add(cb);
  window.addEventListener("storage", cb);
  return () => {
    listeners.delete(cb);
    window.removeEventListener("storage", cb);
  };
}

function read(key: string): string | null {
  try {
    return localStorage.getItem(key) ?? memory.get(key) ?? null;
  } catch {
    return memory.get(key) ?? null;
  }
}

/**
 * String state persisted to localStorage without effects.
 * `serverValue` renders during SSR and hydration; `clientDefault` applies when nothing is stored.
 */
export function useStored(
  key: string,
  serverValue: string,
  clientDefault: () => string = () => serverValue,
): [string, (v: string) => void] {
  const value = useSyncExternalStore(
    subscribe,
    () => read(key) ?? clientDefault(),
    () => serverValue,
  );
  const set = useCallback(
    (v: string) => {
      memory.set(key, v);
      try {
        localStorage.setItem(key, v);
      } catch {
        /* memory fallback already updated */
      }
      listeners.forEach((l) => l());
    },
    [key],
  );
  return [value, set];
}

const noopSubscribe = () => () => {};
/** False during SSR and hydration, true afterwards. */
export function useHydrated(): boolean {
  return useSyncExternalStore(noopSubscribe, () => true, () => false);
}
