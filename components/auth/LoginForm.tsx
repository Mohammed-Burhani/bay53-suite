"use client";

import { useForm } from "react-hook-form";
import { useLogin } from "@/lib/hooks/useAuth";
import type { LoginPayload } from "@/lib/types/auth.types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Eye, EyeOff, Loader2, Package } from "lucide-react";
import { useState } from "react";

export default function LoginForm() {
  const [showPassword, setShowPassword] = useState(false);
  const { mutate: login, isPending, error } = useLogin();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginPayload>({
    defaultValues: { userName: "", password: "" },
  });

  const onSubmit = (data: LoginPayload) => login(data);

  return (
    <Card className="w-full max-w-md shadow-lg border-0">
      <CardHeader className="space-y-3 pb-6">
        <div className="flex items-center gap-2">
          <div className="p-2 bg-primary rounded-lg">
            <Package className="h-5 w-5 text-primary-foreground" />
          </div>
          <span className="text-xl font-bold tracking-tight">StockBuddy</span>
        </div>
        <div>
          <CardTitle className="text-2xl">Welcome back</CardTitle>
          <CardDescription className="mt-1">Sign in to your account to continue</CardDescription>
        </div>
      </CardHeader>

      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
          {/* Username */}
          <div className="space-y-1.5">
            <Label htmlFor="userName">Username</Label>
            <Input
              id="userName"
              type="text"
              placeholder="Enter your username"
              autoComplete="username"
              autoFocus
              {...register("userName", { required: "Username is required" })}
              aria-invalid={!!errors.userName}
            />
            {errors.userName && (
              <p className="text-sm text-destructive">{errors.userName.message}</p>
            )}
          </div>

          {/* Password */}
          <div className="space-y-1.5">
            <Label htmlFor="password">Password</Label>
            <div className="relative">
              <Input
                id="password"
                type={showPassword ? "text" : "password"}
                placeholder="Enter your password"
                autoComplete="current-password"
                className="pr-10"
                {...register("password", { required: "Password is required" })}
                aria-invalid={!!errors.password}
              />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
            {errors.password && (
              <p className="text-sm text-destructive">{errors.password.message}</p>
            )}
          </div>

          {/* API Error */}
          {error && (
            <div className="rounded-md bg-destructive/10 border border-destructive/20 px-3 py-2.5">
              <p className="text-sm text-destructive">
                {error.message.includes("401") || error.message.includes("400")
                  ? "Invalid username or password. Please try again."
                  : "Something went wrong. Please try again."}
              </p>
            </div>
          )}

          <Button type="submit" className="w-full mt-2" disabled={isPending}>
            {isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Signing in...
              </>
            ) : (
              "Sign in"
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
