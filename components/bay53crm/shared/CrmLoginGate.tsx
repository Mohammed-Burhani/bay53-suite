"use client";

// TEMPORARY: the CRM API has its own login. Remove this gate once the CRM API accepts the main app login.

import { useState, useSyncExternalStore } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { crmAuth, useCrmSession } from "@/lib/bay53crm/api";

const noopSubscribe = () => () => {};

export function CrmLoginGate({ children }: { children: React.ReactNode }) {
  const signedIn = useCrmSession();
  // The token lives in localStorage, so wait for the client before deciding whether to show the form.
  const mounted = useSyncExternalStore(noopSubscribe, () => true, () => false);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  if (!mounted) return null;
  if (signedIn) return <>{children}</>;

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      await crmAuth.login(email.trim(), password);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Login failed");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="flex justify-center p-6">
      <Card className="w-full max-w-sm py-4">
        <CardHeader>
          <CardTitle>CRM sign in</CardTitle>
          <p className="text-sm text-muted-foreground">The CRM service needs its own login for now.</p>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="crm-email">User name or email</Label>
              <Input
                id="crm-email"
                autoComplete="username"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="crm-password">Password</Label>
              <Input
                id="crm-password"
                type="password"
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
            {error && <p className="text-sm text-destructive">{error}</p>}
            <Button type="submit" className="w-full" disabled={submitting}>
              {submitting ? "Signing in..." : "Sign in"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
