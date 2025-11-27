"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession } from "next-auth/react";
import {
  AppWindow,
  LayoutDashboard,
  User,
  Shield,
  Settings,
  ChevronLeft,
  ChevronRight,
  LogOut,
  Layers,
  Contact,
} from "lucide-react";
import { useDashboardUI } from "@/app/(page)/dashboard/ui-context";
import { cn } from "@/lib/utils";

export function Sidebar() {
  const pathname = usePathname();
  const { data: session } = useSession();
  const isAdmin = (session as any)?.user?.isAdmin;
  const { sidebarCollapsed, setSidebarCollapsed, toggleSidebar } = useDashboardUI();

  const sidebarItems = [
    { href: "/dashboard/apps", label: "Apps", icon: AppWindow },
    { href: "/dashboard/vCard", label: "vCards", icon: Contact },
    { href: "/dashboard/profile", label: "Mon profil", icon: User },
    { href: "/dashboard/profile/manage", label: "Manage profile", icon: Settings },
  ];

  if (isAdmin) {
    sidebarItems.push({ href: "/dashboard/admin", label: "Back‑office", icon: Shield });
  }

  function isActive(href: string) {
    if (!pathname) return false;
    if (href === "/dashboard") return pathname === href;
    return pathname.startsWith(href);
  }

  return (
    <aside
      className={cn(
        "relative z-30 hidden h-screen flex-col border-r border-gray-200/50 bg-white/80 backdrop-blur-xl transition-all duration-500 ease-in-out md:flex",
        sidebarCollapsed ? "w-[80px]" : "w-72"
      )}
    >
      {/* Header / Logo */}
      <div className="flex h-20 items-center justify-center border-b border-gray-100">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-600 to-violet-600 shadow-lg shadow-indigo-500/20">
            <Layers className="h-6 w-6 text-white" />
          </div>
          {!sidebarCollapsed && (
            <span className="bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-xl font-bold text-transparent">
              HubLocal
            </span>
          )}
        </div>
      </div>

      {/* Navigation */}
      <div className="flex-1 overflow-y-auto py-6">
        <nav className="space-y-2 px-3">
          {sidebarItems.map((item) => {
            const active = isActive(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "group flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-semibold transition-all duration-300",
                  active
                    ? "bg-gradient-to-r from-indigo-50 to-violet-50 text-indigo-700 shadow-sm ring-1 ring-indigo-100"
                    : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                )}
              >
                <div
                  className={cn(
                    "flex h-9 w-9 items-center justify-center rounded-lg transition-all duration-300",
                    active
                      ? "bg-gradient-to-br from-indigo-600 to-violet-600 text-white shadow-md shadow-indigo-500/20"
                      : "bg-gray-100 text-gray-500 group-hover:bg-white group-hover:text-indigo-600 group-hover:shadow-sm"
                  )}
                >
                  <item.icon size={18} strokeWidth={active ? 2.5 : 2} />
                </div>
                {!sidebarCollapsed && (
                  <span className="whitespace-nowrap">
                    {item.label}
                  </span>
                )}
                {!sidebarCollapsed && active && (
                  <div className="ml-auto h-2 w-2 rounded-full bg-indigo-600 shadow-[0_0_8px_rgba(79,70,229,0.5)]" />
                )}
              </Link>
            );
          })}
        </nav>
      </div>

      {/* Footer / User Profile */}
      <div className="border-t border-gray-100 p-4">
        <div
          className={cn(
            "flex items-center gap-3 rounded-xl bg-gray-50/50 p-2 backdrop-blur-sm transition-all duration-300 hover:bg-white hover:shadow-md hover:shadow-gray-200/50 ring-1 ring-transparent hover:ring-gray-100",
            sidebarCollapsed ? "justify-center" : ""
          )}
        >
          <div className="relative h-10 w-10 overflow-hidden rounded-full ring-2 ring-white shadow-sm">
            {/* Placeholder for user avatar if available, else generic icon */}
            <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-gray-100 to-gray-200 text-gray-600">
              <User size={20} />
            </div>
          </div>
          {!sidebarCollapsed && (
            <div className="flex flex-1 flex-col overflow-hidden">
              <span className="truncate text-sm font-bold text-gray-900">
                {session?.user?.name || "Utilisateur"}
              </span>
              <span className="truncate text-xs font-medium text-gray-500">
                {session?.user?.email || "user@example.com"}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Collapse Toggle */}
      <button
        onClick={toggleSidebar}
        className="absolute -right-3 top-24 flex h-6 w-6 items-center justify-center rounded-full border border-gray-200 bg-white text-gray-500 shadow-md transition-all hover:scale-110 hover:text-indigo-600 focus:outline-none z-50"
      >
        {sidebarCollapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
      </button>
    </aside>
  );
}
