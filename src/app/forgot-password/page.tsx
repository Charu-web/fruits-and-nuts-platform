"use client";

import React, { useState } from "react";
import Link from "next/link";
import { ArrowRight, ShieldCheck, Sparkles, CheckCircle2, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function ForgotPasswordPage() {
  const [identifier, setIdentifier] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    const cleanIdentifier = identifier.trim();
    if (!cleanIdentifier) {
      setErrorMessage("Please enter your registered email address or mobile number.");
      return;
    }

    setIsLoading(true);

    try {
      const isEmail = cleanIdentifier.includes("@");
      const payload = isEmail
        ? { email: cleanIdentifier }
        : { phone: cleanIdentifier };

      const res = await fetch("/api/v1/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const json = await res.json();
      if (res.ok && json.success) {
        setIsSuccess(true);
        setSuccessMessage(
          json.data?.message ||
            "If an account is associated with this email address, password reset instructions will be sent. Please check your inbox."
        );
      } else {
        const errorDetail = json.error?.details?.[0]?.message;
        setErrorMessage(
          errorDetail ||
            json.error?.message ||
            "Unable to process request. Please verify your details."
        );
      }
    } catch {
      setErrorMessage(
        "Unable to connect to password reset service. Please check your network and try again."
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
              Account Recovery
            </span>
            <h1 className="font-serif text-2xl sm:text-3xl font-bold text-[#173D2C]">Reset Password</h1>
            <p className="text-xs text-stone-500">
              Enter your registered email address to receive secure reset instructions
            </p>
          </div>

          {errorMessage && (
            <div
              id="forgot-error-msg"
              role="alert"
              aria-live="assertive"
              className="p-3.5 bg-rose-50 border border-rose-200 text-rose-800 text-xs rounded-xl flex items-center gap-2"
            >
              <span className="text-rose-500 font-bold" aria-hidden="true">!</span>
              <span>{errorMessage}</span>
            </div>
          )}

          {isSuccess ? (
            <div className="space-y-4" role="status" aria-live="polite">
              <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-900 rounded-2xl space-y-2">
                <div className="flex items-center gap-2 font-semibold text-xs text-emerald-800">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>Request Received</span>
                </div>
                <p className="text-xs text-stone-600 leading-relaxed">
                  {successMessage}
                </p>
              </div>

              <Link
                href="/login"
                className="w-full inline-flex items-center justify-center gap-2 rounded-lg text-xs uppercase tracking-wider font-semibold bg-[#173D2C] hover:bg-[#123123] text-white py-3 transition-colors shadow-xs"
              >
                <ArrowLeft className="w-4 h-4 mr-1.5" />
                Return to Sign In
              </Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="identifier" className="text-xs font-semibold text-[#173D2C]">
                  Email Address or Mobile Number
                </Label>
                <Input
                  id="identifier"
                  name="identifier"
                  type="text"
                  required
                  autoComplete="username"
                  aria-invalid={Boolean(errorMessage)}
                  aria-describedby={errorMessage ? "forgot-error-msg" : undefined}
                  placeholder="e.g. rajesh@example.com or 9876543210"
                  value={identifier}
                  onChange={(e) => {
                    setIdentifier(e.target.value);
                    if (errorMessage) setErrorMessage(null);
                  }}
                  className="bg-[#FAF7F0]"
                />
              </div>

              <Button
                type="submit"
                disabled={isLoading}
                className="w-full bg-[#173D2C] hover:bg-[#123123] text-white py-3"
              >
                {isLoading ? "Sending Instructions..." : "Send Reset Instructions"}
                <ArrowRight className="w-4 h-4 ml-1.5" />
              </Button>
            </form>
          )}

          <div className="pt-4 border-t border-[#DCE5D8]/70 text-center text-xs text-stone-500">
            Remembered your credentials?{" "}
            <Link href="/login" className="font-bold text-[#173D2C] hover:text-[#B89453] hover:underline">
              Sign In &rarr;
            </Link>
          </div>

          <div className="pt-2 flex items-center justify-center gap-1.5 text-[11px] text-stone-400">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
            <span>Encrypted recovery & identity protection</span>
          </div>
        </div>
      </div>
    </div>
  );
}
