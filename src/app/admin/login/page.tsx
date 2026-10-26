"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Eye, EyeOff } from "lucide-react";

export default function AdminLoginPage() {
  const router = useRouter();

  // Form State
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [totpCode, setTotpCode] = useState("");
  const [requires2FA, setRequires2FA] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setIsLoading(true);

    try {
      const isEmail = identifier.includes("@");
      const payload: any = {
        password,
        ...(isEmail ? { email: identifier.trim() } : { phone: identifier.trim() }),
      };

      if (requires2FA && totpCode) {
        payload.totpCode = totpCode.trim();
      }

      const res = await fetch("/api/v1/auth/admin-login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const json = await res.json();

      if (res.ok && json.success) {
        if (json.data?.requires2FA) {
          setRequires2FA(true);
          setErrorMessage(null);
        } else {
          // Authentication and 2FA verified
          router.push("/admin");
        }
      } else {
        setErrorMessage(json.error?.message || "Invalid administrative credentials.");
      }
    } catch {
      setErrorMessage("An unexpected network error occurred. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleReset = () => {
    setRequires2FA(false);
    setTotpCode("");
    setErrorMessage(null);
  };

  return (
    <div className="min-h-screen bg-[#FAF7F2] flex items-center justify-center p-4 sm:p-6 font-sans">
      <div className="max-w-md w-full bg-[#123D30] border border-[#B89453]/40 rounded-3xl p-8 sm:p-10 shadow-2xl space-y-6 text-[#F6F0E5]">
        {/* Header */}
        <div className="text-center space-y-3">
          <div className="w-16 h-16 rounded-full overflow-hidden border-2 border-[#B89453] bg-white mx-auto shadow-md">
            <img
              src="/images/logo.jpg"
              alt="M/S Fruits & Nuts"
              className="w-full h-full object-cover"
            />
          </div>
          <div>
            <h1 className="font-serif text-2xl font-bold text-[#FAF7F2] tracking-wider uppercase">
              M/S FRUITS & NUTS
            </h1>
            <p className="text-xs font-sans text-[#D4B679] italic mt-0.5">
              Nutrition with an Emotion
            </p>
            <span className="inline-block mt-2 text-[10px] uppercase font-mono tracking-widest text-[#B89453] bg-[#173D2C] px-3 py-1 rounded-full border border-[#B89453]/30">
              {requires2FA
                ? "2FA Security Verification"
                : "Administrative Control Console"}
            </span>
          </div>
        </div>

        {/* Error Alert */}
        {errorMessage && (
          <div className="p-3 bg-rose-950/80 border border-rose-800 text-rose-200 text-xs rounded-xl flex items-center gap-2">
            <span>⚠️</span>
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Login & 2FA Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {!requires2FA ? (
            <>
              <div>
                <label htmlFor="adminIdentifier" className="text-xs font-bold uppercase tracking-wider text-[#D4B679] block mb-1.5">
                  Admin Email / Mobile Identifier
                </label>
                <input
                  id="adminIdentifier"
                  name="identifier"
                  type="text"
                  required
                  autoComplete="username"
                  placeholder="fruitsnutswebsite@gmail.com"
                  value={identifier}
                  onChange={(e) => {
                    setIdentifier(e.target.value);
                    if (errorMessage) setErrorMessage(null);
                  }}
                  className="w-full text-xs px-4 py-3 bg-[#173D2C] border border-[#B89453]/40 rounded-xl text-white placeholder-stone-400 focus:outline-none focus:border-[#B89453] transition-colors"
                />
              </div>

              <div>
                <label htmlFor="adminPassword" className="text-xs font-bold uppercase tracking-wider text-[#D4B679] block mb-1.5">
                  Master Password
                </label>
                <div className="relative">
                  <input
                    id="adminPassword"
                    name="password"
                    type={showPassword ? "text" : "password"}
                    required
                    autoComplete="current-password"
                    placeholder="••••••••••••"
                    value={password}
                    onChange={(e) => {
                      setPassword(e.target.value);
                      if (errorMessage) setErrorMessage(null);
                    }}
                    className="w-full text-xs px-4 py-3 bg-[#173D2C] border border-[#B89453]/40 rounded-xl text-white placeholder-stone-400 focus:outline-none focus:border-[#B89453] transition-colors pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[#D4B679] hover:text-white transition-colors p-1 rounded-md focus:outline-none"
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
            </>
          ) : (
            <div className="space-y-3 bg-[#173D2C] p-5 rounded-2xl border border-[#B89453]/40">
              <div className="text-center space-y-1">
                <span className="text-2xl">📱</span>
                <h3 className="font-bold text-xs text-[#D4B679] uppercase tracking-wider">
                  Authenticator Code
                </h3>
                <p className="text-[11px] text-[#F6F0E5]/80">
                  Enter the 6-digit code from your Google Authenticator or Microsoft Authenticator app.
                </p>
              </div>

              <div>
                <input
                  id="adminTotp"
                  name="totpCode"
                  type="text"
                  required
                  autoFocus
                  autoComplete="one-time-code"
                  maxLength={6}
                  placeholder="000000"
                  value={totpCode}
                  onChange={(e) => {
                    setTotpCode(e.target.value.replace(/\D/g, ""));
                    if (errorMessage) setErrorMessage(null);
                  }}
                  className="w-full text-center text-xl font-mono tracking-widest px-4 py-3 bg-[#123D30] border border-[#B89453] rounded-xl text-[#D4B679] focus:outline-none focus:border-[#FAF7F2]"
                />
              </div>

              <div className="text-center">
                <button
                  type="button"
                  onClick={handleReset}
                  className="text-[11px] text-[#D4B679] hover:underline"
                >
                  ← Back to password login
                </button>
              </div>
            </div>
          )}

          <button
            type="submit"
            disabled={isLoading || (requires2FA && totpCode.length !== 6)}
            className="w-full py-3.5 bg-[#B89453] hover:bg-[#A37F3E] active:scale-98 text-white font-bold text-xs rounded-xl shadow-lg transition-all disabled:opacity-50 tracking-wider uppercase border border-[#FAF7F2]/20"
          >
            {isLoading
              ? "Verifying Security Credentials..."
              : requires2FA
              ? "Verify 2FA & Access Console →"
              : "Authenticate Admin Session →"}
          </button>
        </form>

        {/* Security Notice */}
        <div className="pt-4 border-t border-[#B89453]/20 text-center space-y-2">
          <p className="text-[10px] text-[#D4B679]/80">
            🔒 Statutory audit compliance: All administrative sessions are encrypted and logged.
          </p>
          <div>
            <Link href="/" className="text-[11px] text-[#D4B679] hover:underline">
              ← Return to Public Storefront
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
