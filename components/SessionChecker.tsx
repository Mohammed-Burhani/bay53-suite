"use client";

import { useSessionChecker } from "@/lib/hooks/useSessionChecker";

/**
 * Singleton session checker — lives in root layout so it runs once
 * app-wide, regardless of which module layout is mounted.
 * Prevents duplicate session checks on module switches.
 */
export default function SessionChecker() {
  useSessionChecker();
  return null;
}
