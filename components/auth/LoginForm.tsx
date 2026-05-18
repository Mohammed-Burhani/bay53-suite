"use client";

import { useForm } from "react-hook-form";
import { useRouter, useSearchParams } from "next/navigation";
import { useLogin, useGoogleLogin } from "@/lib/hooks/useAuth";
import type { LoginPayload } from "@/lib/types/auth.types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Eye, EyeOff, Loader2, Mail, Sparkles, BarChart3, Package, Users, Brain, FileText } from "lucide-react";
import { useState, useMemo } from "react";
import Image from "next/image";
import { toast } from "sonner";

interface ReturningUser {
  userName: string;
  displayName: string;
}

export default function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [showPassword, setShowPassword] = useState(false);
  
  // Initialize returning user from localStorage
  const [returningUser, setReturningUser] = useState<ReturningUser | null>(() => {
    if (typeof window === "undefined") return null;
    const savedUser = localStorage.getItem("bay53_returning_user");
    if (savedUser) {
      try {
        return JSON.parse(savedUser) as ReturningUser;
      } catch {
        localStorage.removeItem("bay53_returning_user");
        return null;
      }
    }
    return null;
  });
  
  const { mutate: login, isPending, error } = useLogin();
  const { mutate: googleLogin, isPending: isGoogleLoading } = useGoogleLogin();

  // Check for auth errors from URL
  const authError = useMemo(() => {
    const errorParam = searchParams.get("error");
    if (errorParam === "auth_failed") {
      return "Authentication failed. Please try again.";
    } else if (errorParam === "session_failed") {
      return "Failed to establish session. Please try again.";
    }
    return null;
  }, [searchParams]);

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
  } = useForm<LoginPayload>({
    defaultValues: { 
      userName: returningUser?.userName || "", 
      password: "" 
    },
  });

  const onSubmit = (data: LoginPayload) => {
    login(data, {
      onSuccess: () => {
        // Save user for next time
        const firstName = data.userName.split(" ")[0] || data.userName;
        localStorage.setItem(
          "bay53_returning_user",
          JSON.stringify({ userName: data.userName, displayName: firstName })
        );
        toast.success("OTP Sent", {
          description: "A verification code has been sent to your email",
        });
      },
    });
  };

  const handleGoogleLogin = () => {
    googleLogin(undefined, {
      onError: (err) => {
        toast.error("Google login failed", {
          description: err.message || "Please try again",
        });
      },
    });
  };

  const clearReturningUser = () => {
    localStorage.removeItem("bay53_returning_user");
    setReturningUser(null);
    setValue("userName", "");
  };

  const features = [
    { icon: BarChart3, title: "Accounting & Billing", desc: "Complete financial management" },
    { icon: Package, title: "Inventory Management", desc: "Real-time stock tracking" },
    { icon: Users, title: "CRM", desc: "Customer relationship tools" },
    { icon: FileText, title: "AI-Powered Reports", desc: "Intelligent insights & analytics" },
    { icon: Brain, title: "bayAI Assistant", desc: "Your AI business companion" },
  ];

  return (
    <div className="min-h-screen flex">
      {/* Left Panel - Brand & Features */}
      <div className="hidden lg:flex lg:w-[60%] relative overflow-hidden bg-gradient-to-br from-orange-50 via-teal-50 to-blue-50 border-r-2 border-gray-200">
        {/* Animated Background Orbs */}
        <div className="absolute inset-0 overflow-hidden">
          <div 
            className="absolute top-1/4 left-1/4 w-96 h-96 rounded-full opacity-30 blur-3xl animate-float"
            style={{ background: "radial-gradient(circle, var(--bay-coral) 0%, transparent 70%)" }}
          />
          <div 
            className="absolute bottom-1/4 right-1/4 w-80 h-80 rounded-full opacity-30 blur-3xl animate-float-delayed"
            style={{ background: "radial-gradient(circle, var(--bay-teal) 0%, transparent 70%)" }}
          />
          <div 
            className="absolute top-1/2 right-1/3 w-72 h-72 rounded-full opacity-25 blur-3xl animate-float"
            style={{ 
              background: "radial-gradient(circle, var(--bay-violet) 0%, transparent 70%)",
              animationDelay: "-10s"
            }}
          />
        </div>

        {/* Content */}
        <div className="relative z-10 flex flex-col justify-between p-12 w-full">
          {/* Logo */}
          <div className="space-y-2">
            <div className="relative inline-block">
              <Image 
                src="/logo.png" 
                alt="BAY53 Logo" 
                width={200} 
                height={100}
                className="w-48 h-auto drop-shadow-lg"
              />
            </div>
          </div>

          {/* Features */}
          <div className="space-y-4 max-w-lg">
            {features.map((feature, idx) => {
              const Icon = feature.icon;
              return (
                <div 
                  key={idx}
                  className="flex items-start gap-4 p-4 rounded-xl bg-white/80 backdrop-blur-sm border border-gray-200/50 shadow-sm transition-all duration-200 hover:shadow-md hover:bg-white"
                >
                  <div 
                    className="p-2.5 rounded-lg"
                    style={{ 
                      background: `linear-gradient(135deg, var(--bay-coral), var(--bay-teal), var(--bay-violet))`
                    }}
                  >
                    <Icon className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900 text-sm">{feature.title}</h3>
                    <p className="text-sm text-gray-600 mt-0.5">{feature.desc}</p>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Tagline */}
          <div className="text-gray-600 text-sm font-medium">
            Your business, fully connected.
          </div>
        </div>
      </div>

      {/* Right Panel - Login Form */}
      <div className="w-full lg:w-[40%] flex items-center justify-center p-6 bg-white">
        <div className="w-full max-w-md space-y-8">
          {/* Mobile Logo */}
          <div className="lg:hidden flex justify-center mb-8">
            <Image 
              src="/logo.png" 
              alt="BAY53 Logo" 
              width={150} 
              height={75}
              className="w-36 h-auto"
            />
          </div>

          {/* Greeting */}
          <div className={returningUser ? "animate-fade-in-up" : ""}>
            {returningUser ? (
              <div className="text-center space-y-3">
                <div 
                  className="w-16 h-16 rounded-full mx-auto flex items-center justify-center text-white text-xl font-bold"
                  style={{ background: `linear-gradient(135deg, var(--bay-coral), var(--bay-teal), var(--bay-violet))` }}
                >
                  {returningUser.displayName.charAt(0).toUpperCase()}
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">
                    Welcome back, {returningUser.displayName} 👋
                  </h1>
                  <p className="text-sm text-gray-600 mt-1">
                    Good to see you again. Your dashboard is ready.
                  </p>
                </div>
              </div>
            ) : (
              <div className="text-center space-y-2">
                <h1 className="text-2xl font-bold text-gray-900">Welcome to BAY53</h1>
                <p className="text-sm text-gray-600">Sign in to your account to continue</p>
              </div>
            )}
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5" noValidate>
            {/* Username */}
            <div className="space-y-2">
              <Label htmlFor="userName" className="text-gray-700 font-medium">
                Username / Email
              </Label>
              {returningUser ? (
                <div className="flex items-center gap-2">
                  <div className="flex-1 px-4 py-2.5 bg-gray-100 rounded-xl text-gray-700 text-sm">
                    {returningUser.userName}
                  </div>
                  <button
                    type="button"
                    onClick={clearReturningUser}
                    className="text-sm px-3 py-2 rounded-lg hover:bg-gray-100 transition-colors"
                    style={{ color: "var(--bay-teal)" }}
                  >
                    Not you?
                  </button>
                </div>
              ) : (
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <Input
                    id="userName"
                    type="text"
                    placeholder="Enter your username"
                    autoComplete="username"
                    autoFocus
                    className="pl-10 h-11 rounded-xl border-gray-300 focus:ring-2 transition-all"
                    style={{ 
                      "--tw-ring-color": "var(--bay-teal)",
                      "--tw-ring-opacity": "0.3"
                    } as React.CSSProperties}
                    {...register("userName", { required: "Username is required" })}
                    aria-invalid={!!errors.userName}
                  />
                </div>
              )}
              {errors.userName && (
                <p className="text-sm text-red-600">{errors.userName.message}</p>
              )}
            </div>

            {/* Password */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="password" className="text-gray-700 font-medium">
                  Password
                </Label>
                <button
                  type="button"
                  onClick={() => router.push("/forgot-password")}
                  className="text-sm transition-colors hover:underline"
                  style={{ color: "var(--bay-violet)" }}
                >
                  Forgot password?
                </button>
              </div>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Enter your password"
                  autoComplete="current-password"
                  className="pr-10 h-11 rounded-xl border-gray-300 focus:ring-2 transition-all"
                  style={{ 
                    "--tw-ring-color": "var(--bay-violet)",
                    "--tw-ring-opacity": "0.3"
                  } as React.CSSProperties}
                  {...register("password", { required: "Password is required" })}
                  aria-invalid={!!errors.password}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                  tabIndex={0}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              {errors.password && (
                <p className="text-sm text-red-600">{errors.password.message}</p>
              )}
            </div>

            {/* API Error */}
            {(error || authError) && (
              <div className="rounded-xl bg-red-50 border border-red-200 px-4 py-3">
                <p className="text-sm text-red-700">
                  {authError || 
                    (error && (error.message.includes("401") || error.message.includes("400"))
                      ? "Invalid username or password. Please try again."
                      : "Something went wrong. Please try again.")}
                </p>
              </div>
            )}

            {/* Submit Button */}
            <Button 
              type="submit" 
              className="w-full h-11 rounded-xl font-semibold text-white border-0 transition-all duration-200 hover:scale-[1.02] hover:shadow-lg disabled:hover:scale-100"
              style={{ 
                background: `linear-gradient(135deg, var(--bay-coral), var(--bay-teal), var(--bay-violet))`,
                boxShadow: "0 4px 12px rgba(77, 217, 172, 0.3)"
              }}
              disabled={isPending}
            >
              {isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Signing in...
                </>
              ) : (
                "Sign in"
              )}
            </Button>

            {/* Divider */}
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-4 bg-white text-gray-500">Or continue with</span>
              </div>
            </div>

            {/* Google Login Button */}
            <Button 
              type="button"
              onClick={handleGoogleLogin}
              variant="outline"
              className="w-full h-11 rounded-xl font-semibold bg-white text-gray-700 border-2 border-gray-300 transition-all duration-200 hover:bg-gray-50 hover:border-gray-400 hover:scale-[1.02] disabled:hover:scale-100"
              disabled={isGoogleLoading}
            >
              {isGoogleLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Connecting...
                </>
              ) : (
                <>
                  <svg className="mr-2 h-5 w-5" viewBox="0 0 24 24">
                    <path
                      fill="#4285F4"
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    />
                    <path
                      fill="#34A853"
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    />
                    <path
                      fill="#FBBC05"
                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                    />
                    <path
                      fill="#EA4335"
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                    />
                  </svg>
                  Continue with Google
                </>
              )}
            </Button>

            {/* Divider */}
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-4 bg-white text-gray-500">Don&apos;t have an account?</span>
              </div>
            </div>

            {/* Signup Link */}
            <Button
              type="button"
              onClick={() => router.push("/signup")}
              variant="outline"
              className="w-full h-11 rounded-xl font-semibold border-2 transition-all duration-200 hover:scale-[1.02]"
              style={{ 
                borderColor: "var(--bay-coral)",
                color: "var(--bay-coral)"
              }}
            >
              Create new account
            </Button>

            {/* Admin Contact */}
            <p className="text-center text-xs text-gray-500">
              Need access? Contact your administrator
            </p>
          </form>

          {/* bayAI Teaser */}
          <div 
            className="p-4 rounded-xl border transition-all duration-200 hover:shadow-md"
            style={{ 
              background: "linear-gradient(135deg, rgba(240, 112, 80, 0.05), rgba(77, 217, 172, 0.05), rgba(123, 143, 245, 0.05))",
              borderColor: "rgba(77, 217, 172, 0.2)"
            }}
          >
            <div className="flex items-center gap-3">
              <div 
                className="p-2 rounded-lg"
                style={{ background: "linear-gradient(135deg, var(--bay-teal), var(--bay-violet))" }}
              >
                <Sparkles className="w-4 h-4 text-white" />
              </div>
              <p className="text-sm text-gray-700">
                <span className="font-semibold">bayAI</span> is ready to assist — ask anything once you&apos;re in
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
