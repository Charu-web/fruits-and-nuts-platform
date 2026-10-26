"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard,
  Package,
  MapPin,
  User,
  LogOut,
  Crown,
  ChevronRight,
} from "lucide-react";
import { Breadcrumb } from "@/components/ui/breadcrumb";
import { Badge } from "@/components/ui/badge";

interface UserMe {
  id: string;
  email: string;
  phone: string;
  profile?: {
    firstName?: string;
    lastName?: string;
  };
}

export default function AccountLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [user, setUser] = useState<UserMe | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadUser() {
      try {
        const res = await fetch("/api/v1/auth/me");
        if (res.ok) {
          const json = await res.json();
          const userData = json.data?.user || json.data;
          if (json.success && userData) {
            setUser(userData);
          } else {
            router.push("/login");
          }
        } else {
          router.push("/login");
        }
      } catch (err) {
        console.error("Failed to load authenticated user", err);
        router.push("/login");
      } finally {
        setIsLoading(false);
      }
    }
    loadUser();
  }, [router]);

  const handleLogout = async () => {
    try {
      await fetch("/api/v1/auth/logout", { method: "POST" });
      router.push("/login");
    } catch {
      router.push("/login");
    }
  };

  const navLinks = [
    { href: "/account", label: "Overview", icon: LayoutDashboard },
    { href: "/account/orders", label: "My Orders & Tracking", icon: Package },
    { href: "/account/addresses", label: "Saved Addresses", icon: MapPin },
    { href: "/account/profile", label: "Profile & Security", icon: User },
  ];

  return (
    <div className="bg-[#FAF7F0] min-h-screen">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        <Breadcrumb
          items={[
            { label: "Home", href: "/" },
            { label: "My Account" },
          ]}
        />

        {/* Member Header */}
        <div className="bg-white rounded-2xl border border-[#DCE5D8] p-6 shadow-xs flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-[#173D2C] text-[#B89453] flex items-center justify-center font-serif font-bold text-lg">
              {user?.profile?.firstName?.[0] || user?.email?.[0]?.toUpperCase() || <Crown className="w-6 h-6" />}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-bold uppercase tracking-widest text-[#B89453]">
                  Imperial Club Member
                </span>
                <Badge variant="gold" className="text-[9px]">Verified</Badge>
              </div>
              <h1 className="font-serif text-2xl font-bold text-[#173D2C]">
                Welcome, {user?.profile?.firstName || user?.email?.split("@")[0] || "Esteemed Guest"}
              </h1>
              <p className="text-xs text-stone-500">
                {user?.email || user?.phone || "Personal Dashboard"}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={handleLogout}
            className="px-4 py-2 bg-[#FAF7F0] hover:bg-[#DCE5D8] text-stone-700 text-xs font-semibold rounded-xl border border-[#DCE5D8] flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Sign Out</span>
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Navigation Sidebar */}
          <aside className="lg:col-span-3 bg-white rounded-2xl border border-[#DCE5D8] p-3 shadow-xs space-y-1">
            {navLinks.map((link) => {
              const isActive = pathname === link.href;
              const Icon = link.icon;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`flex items-center justify-between px-3.5 py-3 rounded-xl text-xs font-semibold transition-all ${
                    isActive
                      ? "bg-[#173D2C] text-white shadow-xs"
                      : "text-stone-700 hover:bg-[#FAF7F0] hover:text-[#173D2C]"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Icon className={`w-4 h-4 ${isActive ? "text-[#B89453]" : "text-stone-400"}`} />
                    <span>{link.label}</span>
                  </div>
                  <ChevronRight className={`w-3.5 h-3.5 ${isActive ? "text-[#B89453]" : "text-stone-300"}`} />
                </Link>
              );
            })}
          </aside>

          {/* Main Account View */}
          <main className="lg:col-span-9">{children}</main>
        </div>
      </div>
    </div>
  );
}
