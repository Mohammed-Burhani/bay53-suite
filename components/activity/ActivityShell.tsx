"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import { FileText, Moon, ScrollText, Sun, UserRound, type LucideIcon } from "lucide-react";
import { setSimulatedFailure } from "@/lib/activity-api";
import { ROLE_LABEL } from "@/lib/activity-catalog";
import { Skeleton } from "./states";
import { btnCls, cx } from "./ui";
import { useStored } from "./useStored";
import { ViewerProvider, useViewer } from "./ViewerProvider";

const THEME_KEY = "bay53.activity.theme";

const NAV: { href: string; match: string; label: string; icon: LucideIcon; adminOnly?: boolean }[] = [
  { href: "/admin/activity", match: "/admin/activity", label: "Activity log", icon: ScrollText, adminOnly: true },
  { href: "/my-activity", match: "/my-activity", label: "My activity", icon: UserRound },
  { href: "/invoices/inv-0042?tab=activity", match: "/invoices", label: "Sample invoice", icon: FileText },
];

export function ActivityShell({ children }: { children: React.ReactNode }) {
  return (
    <ViewerProvider>
      <Shell>{children}</Shell>
    </ViewerProvider>
  );
}

function Shell({ children }: { children: React.ReactNode }) {
  const { user, isAdmin, ready, personas, setUserId, switchRole } = useViewer();
  const pathname = usePathname();
  const qc = useQueryClient();
  const [theme, setTheme] = useStored(THEME_KEY, "light", () =>
    window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light",
  );
  const dark = theme === "dark";
  const [failing, setFailing] = useState(false);

  const toggleTheme = () => setTheme(dark ? "light" : "dark");

  const toggleFailure = () => {
    const next = !failing;
    setFailing(next);
    setSimulatedFailure(next);
    qc.invalidateQueries({ queryKey: ["activity"] });
  };

  return (
    // The dark class lives on the wrapper only, so the rest of the app is unaffected.
    <div data-theme="erp" className={cx("act-sans", dark && "dark")}>
      <div className="min-h-[100dvh] bg-background text-foreground">
        <header className="sticky top-0 z-30 border-b border-sidebar-border bg-sidebar text-sidebar-foreground">
          <div className="mx-auto flex max-w-[1400px] flex-wrap items-center gap-x-4 gap-y-1 px-4 py-2">
            <div className="order-1 flex items-baseline gap-2">
              <span className="text-sm font-bold tracking-tight text-white">Bay53</span>
              <span className="text-[13px] text-sidebar-foreground/60">Invoice activity</span>
            </div>

            <nav aria-label="Activity sections" className="order-3 -mx-1 flex w-full gap-1 overflow-x-auto md:order-2 md:mx-0 md:w-auto">
              {NAV.filter((n) => !n.adminOnly || isAdmin).map((n) => {
                const active = pathname.startsWith(n.match);
                return (
                  <Link
                    key={n.href}
                    href={n.href}
                    aria-current={active ? "page" : undefined}
                    className={cx(
                      "inline-flex h-8 items-center gap-1.5 whitespace-nowrap rounded-md px-2.5 text-[13px] font-medium",
                      "focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-sidebar-primary",
                      active
                        ? "bg-sidebar-primary text-sidebar-primary-foreground"
                        : "text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-white",
                    )}
                  >
                    <n.icon aria-hidden className="size-3.5" strokeWidth={1.75} />
                    {n.label}
                  </Link>
                );
              })}
            </nav>

            <div className="order-2 ml-auto flex items-center gap-2 md:order-3">
              <div role="group" aria-label="Demo role" className="inline-flex rounded-md border border-sidebar-border p-0.5">
                {(["admin", "user"] as const).map((r) => {
                  const on = (r === "admin") === isAdmin;
                  return (
                    <button
                      key={r}
                      type="button"
                      aria-pressed={on}
                      onClick={() => switchRole(r)}
                      className={cx(
                        "h-7 rounded-md px-2.5 text-[13px] font-medium focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-sidebar-primary",
                        on
                          ? "bg-sidebar-primary text-sidebar-primary-foreground"
                          : "text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-white",
                      )}
                    >
                      {r === "admin" ? "Admin" : "User"}
                    </button>
                  );
                })}
              </div>

              {isAdmin ? (
                <span className="hidden text-[13px] text-sidebar-foreground sm:inline">{user.name}</span>
              ) : (
                <select
                  aria-label="Acting as"
                  value={user.id}
                  onChange={(e) => setUserId(e.target.value)}
                  className="h-8 max-w-[220px] rounded-md border border-sidebar-border bg-sidebar-accent px-2 text-[13px] text-sidebar-foreground focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-sidebar-primary"
                >
                  {personas
                    .filter((p) => p.role !== "admin")
                    .map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name} ({ROLE_LABEL[p.role]})
                      </option>
                    ))}
                </select>
              )}

              <button
                type="button"
                onClick={toggleTheme}
                aria-label={dark ? "Switch to light mode" : "Switch to dark mode"}
                className="inline-flex h-8 items-center rounded-md border border-sidebar-border px-2 text-sidebar-foreground hover:bg-sidebar-accent hover:text-white focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-sidebar-primary"
              >
                {dark ? <Sun aria-hidden className="size-4" /> : <Moon aria-hidden className="size-4" />}
              </button>
            </div>
          </div>
        </header>

        <main className="mx-auto max-w-[1400px] px-4 py-4">
          {ready ? (
            children
          ) : (
            <div role="status" aria-label="Loading" className="space-y-3">
              <Skeleton className="h-7 w-48" />
              <Skeleton className="h-24 w-full" />
              <Skeleton className="h-64 w-full" />
            </div>
          )}
        </main>

        <footer className="mx-auto flex max-w-[1400px] flex-wrap items-center justify-between gap-2 px-4 pb-6 text-xs text-muted-foreground">
          <p>Prototype with in-memory mock data. It resets on reload. Logs are read-only.</p>
          <button type="button" onClick={toggleFailure} aria-pressed={failing} className={cx(btnCls, "!h-7 !text-xs")}>
            {failing ? "Restore API" : "Simulate API error"}
          </button>
        </footer>
      </div>
    </div>
  );
}
