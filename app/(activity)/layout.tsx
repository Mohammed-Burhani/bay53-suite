import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { ActivityShell } from "@/components/activity/ActivityShell";
import "./activity.css";

const sans = Geist({ subsets: ["latin"], variable: "--font-act-sans", display: "swap" });
const mono = Geist_Mono({ subsets: ["latin"], variable: "--font-act-mono", display: "swap" });

export const metadata: Metadata = {
  title: "Invoice activity log | Bay53",
  description: "Immutable audit trail for invoice changes.",
};

export default function ActivityLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className={`${sans.variable} ${mono.variable}`}>
      <ActivityShell>{children}</ActivityShell>
    </div>
  );
}
