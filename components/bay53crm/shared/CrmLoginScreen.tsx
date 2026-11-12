"use client";

import { useState } from "react";
import Image from "next/image";
import { BarChart3, FileText, FolderKanban, Loader2, Lock, User, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { crmAuth } from "@/lib/bay53crm/api";

const FEATURES = [
  { icon: Users, title: "Leads & Contacts", desc: "Track every lead from first call to order" },
  { icon: FolderKanban, title: "Projects", desc: "Consultants, brand approvals and make lists" },
  { icon: FileText, title: "Enquiries & Quotations", desc: "See what was quoted, to whom and by whom" },
  { icon: BarChart3, title: "Reports & Dashboards", desc: "Pipeline, activity and sales stage reports" },
];

/** The sign-in page of the CRM: the first thing a visitor sees. The CRM service has its own accounts. */
export function CrmLoginScreen() {
  const [userName, setUserName] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      await crmAuth.login(userName.trim(), password);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Login failed");
      setSubmitting(false);
    }
    // On success the gate swaps this screen for the CRM, so there is nothing more to do here.
  };

  return (
    <div className="min-h-screen flex">
      <div className="hidden lg:flex lg:w-[60%] relative overflow-hidden bg-gradient-to-br from-orange-50 via-teal-50 to-blue-50 border-r-2 border-gray-200">
        <div className="absolute inset-0 overflow-hidden">
          <div
            className="absolute top-1/4 left-1/4 w-96 h-96 rounded-full opacity-30 blur-3xl animate-float"
            style={{ background: "radial-gradient(circle, var(--bay-coral) 0%, transparent 70%)" }}
          />
          <div
            className="absolute bottom-1/4 right-1/4 w-80 h-80 rounded-full opacity-30 blur-3xl animate-float-delayed"
            style={{ background: "radial-gradient(circle, var(--bay-teal) 0%, transparent 70%)" }}
          />
        </div>

        <div className="relative z-10 flex flex-col justify-between p-12 w-full">
          <Image src="/logo.png" alt="BAY53 Logo" width={200} height={100} className="w-48 h-auto drop-shadow-lg" priority />

          <div className="space-y-4 max-w-lg">
            {FEATURES.map((feature) => (
              <div
                key={feature.title}
                className="flex items-start gap-4 p-4 rounded-xl bg-white/80 backdrop-blur-sm border border-gray-200/50 shadow-sm"
              >
                <div
                  className="p-2.5 rounded-lg"
                  style={{ background: "linear-gradient(135deg, var(--bay-coral), var(--bay-teal), var(--bay-violet))" }}
                >
                  <feature.icon className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 text-sm">{feature.title}</h3>
                  <p className="text-sm text-gray-600 mt-0.5">{feature.desc}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="text-gray-600 text-sm font-medium">Your business, fully connected.</div>
        </div>
      </div>

      <div className="w-full lg:w-[40%] flex items-center justify-center p-6 bg-white">
        <div className="w-full max-w-md space-y-8">
          <div className="lg:hidden flex justify-center mb-8">
            <Image src="/logo.png" alt="BAY53 Logo" width={150} height={75} className="w-36 h-auto" priority />
          </div>

          <div className="text-center space-y-2">
            <h1 className="text-2xl font-bold text-gray-900">Welcome to BAY53 CRM</h1>
            <p className="text-sm text-gray-600">Sign in to your account to continue</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="crm-user-name" className="text-gray-700 font-medium">Username / Email</Label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input
                  id="crm-user-name"
                  type="text"
                  autoComplete="username"
                  autoFocus
                  placeholder="Enter your username"
                  className="pl-10 h-11 rounded-xl border-gray-300"
                  value={userName}
                  onChange={(e) => setUserName(e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="crm-password" className="text-gray-700 font-medium">Password</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input
                  id="crm-password"
                  type="password"
                  autoComplete="current-password"
                  placeholder="Enter your password"
                  className="pl-10 h-11 rounded-xl border-gray-300"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>
            </div>

            {error && (
              <p role="alert" className="text-sm text-red-600">
                {error}
              </p>
            )}

            <Button
              type="submit"
              disabled={submitting}
              className="w-full h-11 rounded-xl text-white font-semibold"
              style={{ background: "linear-gradient(135deg, var(--bay-coral), var(--bay-teal))" }}
            >
              {submitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Signing in...
                </>
              ) : (
                "Sign in"
              )}
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}
