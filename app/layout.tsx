import type { Metadata } from "next";
import "./globals.css";
import QueryProvider from "@/components/QueryProvider";
import SessionChecker from "@/components/SessionChecker";
import { Toaster } from "sonner";

export const metadata: Metadata = {
  title: "Bay53 - Inventory & Billing Management",
  description: "Complete inventory management and billing solution for Indian businesses. GST compliant, multi-niche support.",
  icons: {
    icon: "/logo.png",
    apple: "/logo.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased">

        <QueryProvider>
          <SessionChecker />
          {children}
        </QueryProvider>
        <Toaster position="top-right" richColors />

      </body>
    </html>
  );
}
