import type { Metadata } from "next";
import "./globals.css";
import Script from "next/script";
import QueryProvider from "@/components/QueryProvider";
import { Toaster } from "sonner";

export const metadata: Metadata = {
  title: "StockBuddy - Inventory & Billing Management",
  description: "Complete inventory management and billing solution for Indian businesses. GST compliant, multi-niche support.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased">

        <QueryProvider>{children}</QueryProvider>
        <Toaster position="top-right" richColors />

      </body>
    </html>
  );
}
