"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowRight, ShieldCheck, Sparkles, Eye, EyeOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function LoginPage() {
  const router = useRouter();
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    const cleanIdentifier = identifier.trim();
    if (!cleanIdentifier) {
      setErrorMessage("Please enter your registered email address or mobile number.");
      return;
    }
    if (!password) {
      setErrorMessage("Please enter your password.");
      return;
    }

    setIsLoading(true);

    try {
      const isEmail = cleanIdentifier.includes("@");
      const payload = isEmail
        ? { email: cleanIdentifier, password }
        : { phone: cleanIdentifier, password };

      const res = await fetch("/api/v1/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const json = await res.json();
      if (res.ok && json.success) {
        router.push("/account");
      } else {
        const errorDetail = json.error?.details?.[0]?.message;
        setErrorMessage(
          errorDetail ||
            json.error?.message ||
            "Invalid email, phone number, or password. Please verify your details."
        );
      }
    } catch {
      setErrorMessage(
        "Unable to connect to authentication service. Please check your network connection and try again."
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-[#FAF7F0] min-h-screen py-16 sm:py-24 flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-3xl border border-[#DCE5D8] p-8 sm:p-10 shadow-xs space-y-6">
          <div className="text-center space-y-2">
            <div className="w-12 h-12 rounded-full bg-[#173D2C] text-[#B89453] flex items-center justify-center mx-auto shadow-sm">
              <Sparkles className="w-6 h-6" />
            </div>
            <span className="text-[10px] font-bold uppercase tracking-widest text-[#B89453] block">
              Imperial Member Access
            </span>
            <h1 className="font-serif text-2xl sm:text-3xl font-bold text-[#173D2C]">Welcome Back</h1>
            <p className="text-xs text-stone-500">Sign in to your Fruits & Nuts account</p>
          </div>

          {errorMessage && (
            <div
              id="login-error-msg"
              role="alert"
              aria-live="assertive"
              className="p-3.5 bg-rose-50 border border-rose-200 text-rose-800 text-xs rounded-xl flex items-center gap-2"
            >
              <span className="text-rose-500 font-bold" aria-hidden="true">!</span>
              <span>{errorMessage}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="identifier" className="text-xs font-semibold text-[#173D2C]">
                Email Address or Phone Number
              </Label>
              <Input
                id="identifier"
                name="identifier"
                type="text"
                required
                autoComplete="username"
                aria-invalid={Boolean(errorMessage)}
                aria-describedby={errorMessage ? "login-error-msg" : undefined}
                placeholder="e.g. rajesh@example.com or 9876543210"
                value={identifier}
                onChange={(e) => {
                  setIdentifier(e.target.value);
                  if (errorMessage) setErrorMessage(null);
                }}
                className="bg-[#FAF7F0]"
              />
            </div>

            <div className="space-y-1.5">
              <div className="flex justify-between items-center">
                <Label htmlFor="password" className="text-xs font-semibold text-[#173D2C]">
                  Password
                </Label>
                <Link
                  href="/forgot-password"
                  className="text-xs text-[#B89453] hover:text-[#173D2C] hover:underline font-medium transition-colors"
                >
                  Forgot password?
                </Link>
              </div>
              <div className="relative">
                <Input
                  id="password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  required
                  autoComplete="current-password"
                  aria-invalid={Boolean(errorMessage)}
                  aria-describedby={errorMessage ? "login-error-msg" : undefined}
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    if (errorMessage) setErrorMessage(null);
                  }}
                  className="bg-[#FAF7F0] pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 hover:text-[#173D2C] transition-colors p-1 rounded-md focus:outline-none focus:ring-1 focus:ring-[#B89453]"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                  aria-pressed={showPassword}
                >
                  {showPassword ? (
                    <EyeOff className="w-4 h-4" aria-hidden="true" />
                  ) : (
                    <Eye className="w-4 h-4" aria-hidden="true" />
                  )}
                </button>
              </div>
            </div>

            <Button
              type="submit"
              disabled={isLoading}
              className="w-full bg-[#173D2C] hover:bg-[#123123] text-white py-3"
            >
              {isLoading ? "Signing in..." : "Sign In & Continue"}
              <ArrowRight className="w-4 h-4 ml-1.5" />
            </Button>
          </form>

          <div className="pt-4 border-t border-[#DCE5D8]/70 text-center text-xs text-stone-500">
            Don&apos;t have an account yet?{" "}
            <Link href="/register" className="font-bold text-[#173D2C] hover:text-[#B89453] hover:underline">
              Create an Account &rarr;
            </Link>
          </div>

          <div className="pt-2 flex items-center justify-center gap-1.5 text-[11px] text-stone-400">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
            <span>Secure 256-bit encrypted session</span>
          </div>
        </div>
      </div>
    </div>
  );
}
