"use client";

import React, { useState, Suspense } from "react";
import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";
import { ArrowRight, ShieldCheck, Sparkles, CheckCircle2, Eye, EyeOff, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = (searchParams.get("token") || "").trim();

  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!token) {
      setErrorMessage("Missing password reset token. Please request a new reset link.");
      return;
    }

    if (newPassword.length < 8) {
      setErrorMessage("New password must be at least 8 characters long.");
      return;
    }

    if (newPassword !== confirmPassword) {
      setErrorMessage("Passwords do not match. Please ensure both fields are identical.");
      return;
    }

    setIsLoading(true);

    try {
      const res = await fetch("/api/v1/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          token,
          newPassword,
          confirmPassword,
        }),
      });

      const json = await res.json();
      if (res.ok && json.success) {
        setIsSuccess(true);
      } else {
        const errorDetail = json.error?.details?.[0]?.message;
        setErrorMessage(
          errorDetail ||
            json.error?.message ||
            "Unable to reset password. The link may have expired or already been used."
        );
      }
    } catch {
      setErrorMessage("An unexpected network error occurred. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-3xl border border-[#DCE5D8] p-8 sm:p-10 shadow-xs space-y-6">
      <div className="text-center space-y-2">
        <div className="w-12 h-12 rounded-full bg-[#173D2C] text-[#B89453] flex items-center justify-center mx-auto shadow-sm">
          <Sparkles className="w-6 h-6" />
        </div>
        <span className="text-[10px] font-bold uppercase tracking-widest text-[#B89453] block">
          Secure Credentials
        </span>
        <h1 className="font-serif text-2xl sm:text-3xl font-bold text-[#173D2C]">Set New Password</h1>
        <p className="text-xs text-stone-500">
          Create a strong password for your Fruits & Nuts account
        </p>
      </div>

      {errorMessage && (
        <div className="p-3.5 bg-rose-50 border border-rose-200 text-rose-800 text-xs rounded-xl flex items-center gap-2">
          <span className="text-rose-500 font-bold">!</span>
          <span>{errorMessage}</span>
        </div>
      )}

      {isSuccess ? (
        <div className="space-y-4">
          <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-900 rounded-2xl space-y-2">
            <div className="flex items-center gap-2 font-semibold text-xs text-emerald-800">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>Password Updated Successfully</span>
            </div>
            <p className="text-xs text-stone-600 leading-relaxed">
              Your password has been securely updated. You can now sign in with your new credentials.
            </p>
          </div>

          <Link
            href="/login"
            className="w-full inline-flex items-center justify-center gap-2 rounded-lg text-xs uppercase tracking-wider font-semibold bg-[#173D2C] hover:bg-[#123123] text-white py-3 transition-colors shadow-xs"
          >
            Proceed to Sign In &rarr;
          </Link>
        </div>
      ) : !token ? (
        <div className="space-y-4 text-center">
          <div className="p-4 bg-amber-50 border border-amber-200 text-amber-900 rounded-2xl text-xs space-y-2">
            <span className="font-semibold block">Missing Reset Token</span>
            <p className="text-stone-600">
              No reset token was detected in your link. Please request a new password reset link.
            </p>
          </div>
          <Link
            href="/forgot-password"
            className="w-full inline-flex items-center justify-center gap-2 rounded-lg text-xs uppercase tracking-wider font-semibold bg-[#173D2C] hover:bg-[#123123] text-white py-3 transition-colors shadow-xs"
          >
            Request New Reset Link &rarr;
          </Link>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="newPassword" className="text-xs font-semibold text-[#173D2C]">
              New Password (Min 8 Characters) *
            </Label>
            <div className="relative">
              <Input
                id="newPassword"
                name="newPassword"
                type={showNewPassword ? "text" : "password"}
                required
                autoComplete="new-password"
                placeholder="Enter new strong password"
                value={newPassword}
                onChange={(e) => {
                  setNewPassword(e.target.value);
                  if (errorMessage) setErrorMessage(null);
                }}
                className="bg-[#FAF7F0] pr-10"
              />
              <button
                type="button"
                onClick={() => setShowNewPassword(!showNewPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 hover:text-[#173D2C] transition-colors p-1 rounded-md focus:outline-none focus:ring-1 focus:ring-[#B89453]"
                aria-label={showNewPassword ? "Hide password" : "Show password"}
                aria-pressed={showNewPassword}
              >
                {showNewPassword ? (
                  <EyeOff className="w-4 h-4" aria-hidden="true" />
                ) : (
                  <Eye className="w-4 h-4" aria-hidden="true" />
                )}
              </button>
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="confirmPassword" className="text-xs font-semibold text-[#173D2C]">
              Confirm New Password *
            </Label>
            <div className="relative">
              <Input
                id="confirmPassword"
                name="confirmPassword"
                type={showConfirmPassword ? "text" : "password"}
                required
                autoComplete="new-password"
                placeholder="Re-enter new password"
                value={confirmPassword}
                onChange={(e) => {
                  setConfirmPassword(e.target.value);
                  if (errorMessage) setErrorMessage(null);
                }}
                className="bg-[#FAF7F0] pr-10"
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 hover:text-[#173D2C] transition-colors p-1 rounded-md focus:outline-none focus:ring-1 focus:ring-[#B89453]"
                aria-label={showConfirmPassword ? "Hide password" : "Show password"}
                aria-pressed={showConfirmPassword}
              >
                {showConfirmPassword ? (
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
            {isLoading ? "Updating Password..." : "Update Password & Continue"}
            <ArrowRight className="w-4 h-4 ml-1.5" />
          </Button>
        </form>
      )}

      <div className="pt-4 border-t border-[#DCE5D8]/70 text-center text-xs text-stone-500">
        Remember your password?{" "}
        <Link href="/login" className="font-bold text-[#173D2C] hover:text-[#B89453] hover:underline">
          Sign In &rarr;
        </Link>
      </div>

      <div className="pt-2 flex items-center justify-center gap-1.5 text-[11px] text-stone-400">
        <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
        <span>End-to-end encrypted password reset</span>
      </div>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <div className="bg-[#FAF7F0] min-h-screen py-16 sm:py-24 flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <Suspense
          fallback={
            <div className="bg-white rounded-3xl border border-[#DCE5D8] p-8 text-center text-stone-500 text-xs">
              Loading password reset interface...
            </div>
          }
        >
          <ResetPasswordForm />
        </Suspense>
      </div>
    </div>
  );
}
