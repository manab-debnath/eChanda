import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { useNavigate, Navigate } from "react-router";
import { Wallet, Lock, Phone, User as UserIcon, ArrowRight, AlertCircle, Eye, EyeOff } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/card";

type Mode = "login" | "register";

interface AuthFormData {
  name?: string;
  phone_number: string;
  password: string;
}

export function AuthPage() {
  const [mode, setMode] = useState<Mode>("login");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const { login, register, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  const {
    register: formRegister,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<AuthFormData>();

  if (isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  const onSubmit = async (data: AuthFormData) => {
    setError(null);
    setIsSubmitting(true);
    try {
      if (mode === "register") {
        if (!data.name?.trim()) {
          setError("Name is required");
          setIsSubmitting(false);
          return;
        }
        await register(data.name.trim(), data.phone_number.trim(), data.password);
      } else {
        await login(data.phone_number.trim(), data.password);
      }
      navigate("/");
    } catch (err: any) {
      setError(err?.message || "Authentication failed. Please check your credentials.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const switchMode = (newMode: Mode) => {
    setMode(newMode);
    setShowPassword(false);
    setError(null);
    reset();
  };

  return (
    <div className="min-h-screen bg-linear-to-b from-slate-100 via-slate-50 to-emerald-50/20 dark:from-slate-950 dark:to-slate-900 flex flex-col justify-center px-4 py-8 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        {/* Logo & Headline */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-linear-to-tr from-emerald-600 to-teal-500 text-white shadow-lg shadow-emerald-500/25 mb-3">
            <Wallet className="size-7" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            eChanda
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
            Collections & expenses for events, festivals & events
          </p>
        </div>

        {/* Card */}
        <Card className="border border-slate-200/80 dark:border-slate-800 shadow-xl shadow-slate-200/50 dark:shadow-none bg-white dark:bg-slate-900 rounded-2xl overflow-hidden">
          {/* Segmented control toggle */}
          <div className="grid grid-cols-2 p-1.5 bg-slate-100 dark:bg-slate-800/60 m-4 rounded-xl border border-slate-200/60 dark:border-slate-700/60">
            <button
              type="button"
              onClick={() => switchMode("login")}
              className={`py-2 text-xs sm:text-sm font-semibold rounded-lg transition-all ${
                mode === "login"
                  ? "bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs"
                  : "text-slate-500 hover:text-slate-900 dark:hover:text-white"
              }`}
            >
              Sign In
            </button>
            <button
              type="button"
              onClick={() => switchMode("register")}
              className={`py-2 text-xs sm:text-sm font-semibold rounded-lg transition-all ${
                mode === "register"
                  ? "bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs"
                  : "text-slate-500 hover:text-slate-900 dark:hover:text-white"
              }`}
            >
              Create Account
            </button>
          </div>

          <CardHeader className="pt-0 pb-3">
            <CardTitle className="text-lg font-bold text-slate-900 dark:text-white">
              {mode === "login" ? "Welcome back" : "Get started"}
            </CardTitle>
            <CardDescription className="text-xs text-slate-500">
              {mode === "login"
                ? "Enter your phone number and password to access your events"
                : "Register with your name and mobile number"}
            </CardDescription>
          </CardHeader>

          <CardContent>
            {error && (
              <div className="mb-4 p-3 rounded-xl bg-rose-50 border border-rose-200 dark:bg-rose-950/40 dark:border-rose-900 flex items-start gap-2.5 text-rose-700 dark:text-rose-300 text-xs sm:text-sm">
                <AlertCircle className="size-4 shrink-0 mt-0.5" />
                <span className="flex-1">{error}</span>
              </div>
            )}

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              {mode === "register" && (
                <div className="space-y-1.5">
                  <Label htmlFor="name" className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                    Full Name
                  </Label>
                  <div className="relative">
                    <UserIcon className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-slate-400" />
                    <Input
                      id="name"
                      type="text"
                      placeholder="e.g. Rahul Sharma"
                      className="pl-9 text-sm h-10"
                      {...formRegister("name", {
                        required: mode === "register" ? "Name is required" : false,
                      })}
                    />
                  </div>
                  {errors.name && (
                    <p className="text-[11px] text-rose-500">{errors.name.message}</p>
                  )}
                </div>
              )}

              <div className="space-y-1.5">
                <Label htmlFor="phone_number" className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Phone Number
                </Label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-slate-400" />
                  <Input
                    id="phone_number"
                    type="tel"
                    placeholder="e.g. 9876543210"
                    className="pl-9 text-sm h-10 font-mono"
                    {...formRegister("phone_number", {
                      required: "Phone number is required",
                      minLength: { value: 6, message: "Enter a valid phone number" },
                    })}
                  />
                </div>
                {errors.phone_number && (
                  <p className="text-[11px] text-rose-500">{errors.phone_number.message}</p>
                )}
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="password" className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Password
                </Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-slate-400" />
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="••••••••"
                    className="pl-9 pr-10 text-sm h-10"
                    {...formRegister("password", {
                      required: "Password is required",
                      minLength: { value: 4, message: "Password must be at least 4 characters" },
                    })}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((prev) => !prev)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors focus:outline-none"
                    title={showPassword ? "Hide password" : "Show password"}
                    aria-label={showPassword ? "Hide password" : "Show password"}
                  >
                    {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                  </button>
                </div>
                {errors.password && (
                  <p className="text-[11px] text-rose-500">{errors.password.message}</p>
                )}
              </div>

              <Button
                type="submit"
                disabled={isSubmitting}
                className="w-full h-11 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-xl text-sm transition-all gap-2 mt-2 shadow-xs shadow-emerald-600/20"
              >
                {isSubmitting ? (
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <>
                    <span>{mode === "login" ? "Sign In" : "Create Account"}</span>
                    <ArrowRight className="size-4" />
                  </>
                )}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Demo info hint */}
        <div className="mt-6 text-center text-xs text-slate-400">
          <p>eChanda Secure Auth • Mobile-first chanda management</p>
        </div>
      </div>
    </div>
  );
}
