"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";

interface AdminUser {
  id: string;
  email: string;
  phone: string;
  roleId: string;
  profile?: {
    firstName?: string;
    lastName?: string;
  };
}

interface NavItem {
  href: string;
  label: string;
  icon: string;
  allowedRoles: string[];
}

const ADMIN_NAV_ITEMS: NavItem[] = [
  {
    href: "/admin",
    label: "Dashboard Overview",
    icon: "📊",
    allowedRoles: ["SUPER_ADMIN", "INVENTORY_MGR", "ORDER_MGR", "CONTENT_MGR"],
  },
  {
    href: "/admin/products",
    label: "Catalog & Variants",
    icon: "🥜",
    allowedRoles: ["SUPER_ADMIN", "INVENTORY_MGR", "CONTENT_MGR"],
  },
  {
    href: "/admin/categories",
    label: "Categories & Taxa",
    icon: "📂",
    allowedRoles: ["SUPER_ADMIN", "INVENTORY_MGR", "CONTENT_MGR"],
  },
  {
    href: "/admin/inventory",
    label: "Inventory Control",
    icon: "📦",
    allowedRoles: ["SUPER_ADMIN", "INVENTORY_MGR"],
  },
  {
    href: "/admin/inventory?tab=insights",
    label: "Inventory AI Insights",
    icon: "📈",
    allowedRoles: ["SUPER_ADMIN", "INVENTORY_MGR"],
  },
  {
    href: "/admin/orders",
    label: "Orders & Fulfillment",
    icon: "🚚",
    allowedRoles: ["SUPER_ADMIN", "ORDER_MGR"],
  },
  {
    href: "/admin/customers",
    label: "Customer Directory",
    icon: "👥",
    allowedRoles: ["SUPER_ADMIN", "ORDER_MGR"],
  },
  {
    href: "/admin/reviews",
    label: "Review Moderation",
    icon: "⭐",
    allowedRoles: ["SUPER_ADMIN", "CONTENT_MGR"],
  },
  {
    href: "/admin/taste-map",
    label: "India Taste Map",
    icon: "📍",
    allowedRoles: ["SUPER_ADMIN", "CONTENT_MGR"],
  },
  {
    href: "/admin/stores",
    label: "Store Directory",
    icon: "🏬",
    allowedRoles: ["SUPER_ADMIN", "CONTENT_MGR"],
  },
  {
    href: "/admin/cms",
    label: "CMS & Banners",
    icon: "🎨",
    allowedRoles: ["SUPER_ADMIN", "CONTENT_MGR"],
  },
  {
    href: "/admin/coupons",
    label: "Coupons & Offers",
    icon: "🏷️",
    allowedRoles: ["SUPER_ADMIN", "CONTENT_MGR"],
  },
  {
    href: "/admin/payments",
    label: "Refunds & Payments",
    icon: "💳",
    allowedRoles: ["SUPER_ADMIN"],
  },
  {
    href: "/admin/settings",
    label: "Store Settings",
    icon: "⚙️",
    allowedRoles: ["SUPER_ADMIN"],
  },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [user, setUser] = useState<AdminUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  useEffect(() => {
    async function loadAdminUser() {
      // Exclude /admin/login from mandatory auth layout check
      if (pathname === "/admin/login") {
        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);
        const res = await fetch("/api/v1/auth/me");
        if (res.ok) {
          const json = await res.json();
          const userData = json.data?.user || json.data;
          if (json.success && userData) {
            const role = userData.roleId;
            const validAdminRoles = ["SUPER_ADMIN", "INVENTORY_MGR", "ORDER_MGR", "CONTENT_MGR"];
            if (!validAdminRoles.includes(role)) {
              router.push("/admin/login?error=unauthorized");
              return;
            }
            setUser(userData);
          } else {
            router.push("/admin/login");
          }
        } else {
          router.push("/admin/login");
        }
      } catch (err) {
        console.error("Admin authentication check failed", err);
        router.push("/admin/login");
      } finally {
        setIsLoading(false);
      }
    }

    loadAdminUser();
  }, [pathname, router]);

  const handleLogout = async () => {
    try {
      await fetch("/api/v1/auth/logout", { method: "POST" });
      router.push("/admin/login");
    } catch {
      router.push("/admin/login");
    }
  };

  // If on login page, render child without admin sidebar
  if (pathname === "/admin/login") {
    return <>{children}</>;
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#123D30] flex flex-col items-center justify-center text-[#F6F0E5] space-y-4">
        <div className="w-10 h-10 border-4 border-[#B89453] border-t-transparent rounded-full animate-spin" />
        <span className="text-xs font-mono tracking-widest text-[#D4B679] uppercase">
          Verifying Fruits & Nuts Admin Credentials...
        </span>
      </div>
    );
  }

  const userRole = user?.roleId || "SUPER_ADMIN";
  const accessibleNavItems = ADMIN_NAV_ITEMS.filter((item) => item.allowedRoles.includes(userRole));

  return (
    <div className="min-h-screen bg-[#FAF7F2] flex flex-col md:flex-row text-stone-900 font-sans">
      {/* SIDEBAR NAVIGATION */}
      <aside
        className={`bg-[#123D30] text-[#F6F0E5] border-r border-[#B89453]/20 flex flex-col justify-between transition-all duration-300 flex-shrink-0 z-30 ${
          isSidebarCollapsed ? "w-20" : "w-64"
        }`}
      >
        <div>
          {/* Brand Header */}
          <div className="p-4 border-b border-[#B89453]/20 flex items-center justify-between">
            <Link href="/admin" className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full overflow-hidden border border-[#B89453]/40 bg-white flex-shrink-0">
                <img
                  src="/images/logo.jpg"
                  alt="Fruits & Nuts"
                  className="w-full h-full object-cover"
                />
              </div>
              {!isSidebarCollapsed && (
                <div>
                  <h2 className="font-serif font-bold text-xs text-[#FAF7F2] tracking-wider uppercase">
                    M/S FRUITS & NUTS
                  </h2>
                  <span className="text-[9px] font-sans text-[#D4B679] block italic">
                    Nutrition with an Emotion
                  </span>
                  <span className="text-[8px] font-mono uppercase tracking-widest text-[#B89453] block mt-0.5">
                    Operations Portal
                  </span>
                </div>
              )}
            </Link>
            <button
              type="button"
              onClick={() => setIsSidebarCollapsed((prev) => !prev)}
              aria-label={isSidebarCollapsed ? "Expand admin sidebar" : "Collapse admin sidebar"}
              aria-expanded={!isSidebarCollapsed}
              className="text-[#D4B679] hover:text-white text-xs hidden md:block cursor-pointer p-1 rounded"
              title="Toggle Sidebar"
            >
              {isSidebarCollapsed ? "▶" : "◀"}
            </button>
          </div>

          {/* Navigation Items */}
          <nav aria-label="Administrative navigation" className="p-3 space-y-1">
            {accessibleNavItems.map((item) => {
              const isActive = pathname === item.href || (item.href !== "/admin" && pathname.startsWith(item.href));
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                    isActive
                      ? "bg-[#B89453] text-[#123D30] font-bold shadow-md"
                      : "text-[#FAF7F2]/80 hover:bg-[#173D2C] hover:text-[#D4B679]"
                  }`}
                  title={item.label}
                >
                  <span className="text-base">{item.icon}</span>
                  {!isSidebarCollapsed && <span className="truncate">{item.label}</span>}
                </Link>
              );
            })}
          </nav>
        </div>

        {/* User Info & Sign Out Footer */}
        <div className="p-4 border-t border-[#B89453]/20 space-y-3">
          {!isSidebarCollapsed && (
            <div className="bg-[#173D2C] p-2.5 rounded-xl border border-[#B89453]/30">
              <span className="text-[10px] uppercase font-bold tracking-wider text-[#D4B679] block">Logged in as</span>
              <div className="text-xs font-bold text-white truncate">
                {user?.profile?.firstName || user?.email?.split("@")[0] || "Administrator"}
              </div>
              <span className="inline-block mt-1 text-[9px] font-bold uppercase px-1.5 py-0.5 rounded bg-[#B89453]/20 text-[#D4B679] border border-[#B89453]/40">
                {userRole}
              </span>
            </div>
          )}

          <div className="flex gap-2">
            <Link
              href="/"
              target="_blank"
              className="flex-1 py-2 bg-[#173D2C] hover:bg-[#1f4e39] text-[#FAF7F2] border border-[#B89453]/30 rounded-lg text-xs font-semibold text-center transition-colors flex items-center justify-center gap-1"
              title="View Live Storefront"
            >
              <span>🌐</span>
              {!isSidebarCollapsed && <span>Storefront</span>}
            </Link>
            <button
              type="button"
              onClick={handleLogout}
              className="py-2 px-3 bg-rose-950/60 hover:bg-rose-900 border border-rose-800/50 text-rose-300 rounded-lg text-xs font-semibold transition-colors"
              title="Sign Out"
            >
              🚪
            </button>
          </div>
        </div>
      </aside>

      {/* MAIN ADMIN WORKSPACE */}
      <div className="flex-1 flex flex-col min-w-0 overflow-x-hidden">
        {/* Top Operational Action Bar */}
        <header className="bg-white border-b border-[#B89453]/20 px-6 py-4 flex items-center justify-between sticky top-0 z-20 shadow-xs">
          <div className="flex items-center gap-3">
            <span className="text-xs font-bold uppercase tracking-wider text-[#B89453]">Fruits & Nuts Console</span>
            <span className="text-stone-300">/</span>
            <span className="text-xs font-bold text-[#123D30]">
              {ADMIN_NAV_ITEMS.find((i) => i.href === pathname)?.label || "Control Center"}
            </span>
          </div>

          <div className="flex items-center gap-3">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" title="System Operational" />
            <span className="text-[11px] font-mono text-stone-500 hidden sm:inline">Database Active • Verified Admin</span>
          </div>
        </header>

        {/* Dynamic Content Container */}
        <main className="flex-1 p-6 sm:p-8 max-w-7xl w-full mx-auto">{children}</main>
      </div>
    </div>
  );
}
