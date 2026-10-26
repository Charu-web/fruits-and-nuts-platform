"use client";

import React, { useState, useEffect } from "react";
import { User, KeyRound, ShieldCheck, CheckCircle2, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function AccountProfilePage() {
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  // Password change state
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [passwordMessage, setPasswordMessage] = useState<{ text: string; isError: boolean } | null>(null);

  useEffect(() => {
    async function loadProfile() {
      try {
        setIsLoading(true);
        const res = await fetch("/api/v1/auth/me");
        if (res.ok) {
          const json = await res.json();
          const userData = json.data?.user || json.data;
          if (json.success && userData) {
            setEmail(userData.email || "");
            setPhone(userData.phone || "");
            setFirstName(userData.profile?.firstName || "");
            setLastName(userData.profile?.lastName || "");
          }
        }
      } catch (err) {
        console.error("Failed to load profile", err);
      } finally {
        setIsLoading(false);
      }
    }
    loadProfile();
  }, []);

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordMessage(null);

    if (newPassword !== confirmPassword) {
      setPasswordMessage({ text: "New passwords do not match.", isError: true });
      return;
    }

    if (newPassword.length < 8) {
      setPasswordMessage({ text: "New password must be at least 8 characters.", isError: true });
      return;
    }

    setIsChangingPassword(true);
    try {
      const res = await fetch("/api/v1/auth/change-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          currentPassword: oldPassword,
          newPassword,
        }),
      });

      const json = await res.json();
      if (res.ok && json.success) {
        setPasswordMessage({ text: "Password updated successfully!", isError: false });
        setOldPassword("");
        setNewPassword("");
        setConfirmPassword("");
      } else {
        setPasswordMessage({ text: json.error?.message || "Failed to update password.", isError: true });
      }
    } catch {
      setPasswordMessage({ text: "Failed to update password. Please try again.", isError: true });
    } finally {
      setIsChangingPassword(false);
    }
  };

  return (
    <div className="space-y-8">
      {/* Account Details */}
      <div className="bg-white rounded-2xl border border-[#DCE5D8] p-6 shadow-xs space-y-4">
        <h3 className="font-serif font-bold text-[#173D2C] text-xl border-b border-[#DCE5D8]/70 pb-3 flex items-center gap-2">
          <User className="w-5 h-5 text-[#B89453]" />
          Profile Details
        </h3>

        {isLoading ? (
          <div className="h-20 bg-[#FAF7F0] rounded-xl animate-pulse" />
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div className="p-3.5 bg-[#FAF7F0] rounded-xl border border-[#DCE5D8]">
              <span className="text-stone-400 font-bold uppercase tracking-wider text-[10px] block">
                First Name
              </span>
              <span className="font-semibold text-stone-900 text-sm">{firstName || "—"}</span>
            </div>
            <div className="p-3.5 bg-[#FAF7F0] rounded-xl border border-[#DCE5D8]">
              <span className="text-stone-400 font-bold uppercase tracking-wider text-[10px] block">
                Last Name
              </span>
              <span className="font-semibold text-stone-900 text-sm">{lastName || "—"}</span>
            </div>
            <div className="p-3.5 bg-[#FAF7F0] rounded-xl border border-[#DCE5D8]">
              <span className="text-stone-400 font-bold uppercase tracking-wider text-[10px] block">
                Email Address
              </span>
              <span className="font-semibold text-stone-900 text-sm">{email || "—"}</span>
            </div>
            <div className="p-3.5 bg-[#FAF7F0] rounded-xl border border-[#DCE5D8]">
              <span className="text-stone-400 font-bold uppercase tracking-wider text-[10px] block">
                Phone Number
              </span>
              <span className="font-semibold text-stone-900 text-sm font-mono">{phone || "—"}</span>
            </div>
          </div>
        )}
      </div>

      {/* Security & Password Change */}
      <div className="bg-white rounded-2xl border border-[#DCE5D8] p-6 shadow-xs space-y-4">
        <h3 className="font-serif font-bold text-[#173D2C] text-xl border-b border-[#DCE5D8]/70 pb-3 flex items-center gap-2">
          <KeyRound className="w-5 h-5 text-[#B89453]" />
          Security & Password
        </h3>

        {passwordMessage && (
          <div
            className={`p-3.5 rounded-xl text-xs flex items-center gap-2 ${
              passwordMessage.isError
                ? "bg-rose-50 border border-rose-200 text-rose-800"
                : "bg-emerald-50 border border-emerald-200 text-emerald-800"
            }`}
          >
            {passwordMessage.isError ? (
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            ) : (
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            )}
            <span>{passwordMessage.text}</span>
          </div>
        )}

        <form onSubmit={handleChangePassword} className="space-y-4 max-w-md">
          <div className="space-y-1.5">
            <Label className="text-xs font-semibold text-[#173D2C]">Current Password</Label>
            <Input
              type="password"
              required
              placeholder="••••••••"
              value={oldPassword}
              onChange={(e) => setOldPassword(e.target.value)}
              className="bg-[#FAF7F0]"
            />
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs font-semibold text-[#173D2C]">New Password (min 8 characters)</Label>
            <Input
              type="password"
              required
              placeholder="••••••••"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="bg-[#FAF7F0]"
            />
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs font-semibold text-[#173D2C]">Confirm New Password</Label>
            <Input
              type="password"
              required
              placeholder="••••••••"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="bg-[#FAF7F0]"
            />
          </div>

          <Button
            type="submit"
            disabled={isChangingPassword}
            className="bg-[#173D2C] hover:bg-[#123123] text-white"
          >
            {isChangingPassword ? "Updating Password..." : "Update Password"}
          </Button>
        </form>
      </div>
    </div>
  );
}
