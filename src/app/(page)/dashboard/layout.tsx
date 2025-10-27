"use client";
import Link from "next/link";
import { useMemo, useState } from "react";
import { usePathname } from "next/navigation";
import { useSession, signOut } from "next-auth/react";
import { Menu, X, AppWindow, LayoutDashboard, User, Shield } from "lucide-react";

/**
 * DashboardLayout wraps all pages under the `/dashboard` route. It provides a
 * consistent navigation bar at the top and a sidebar on the left, listing
 * available sections (mes hubs, profil, statistiques, etc.). Admin users
 * will also see a link to the back‑office. The children content (the actual
 * dashboard page) is rendered on the right.
 */
export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { data: session } = useSession();
  const isAdmin = (session as any)?.user?.isAdmin;
  const pathname = usePathname();

  function isActive(href: string) {
    if (!pathname) return false;
    if (href === "/dashboard") return pathname === href;
    return pathname.startsWith(href);
  }

  function navLinkClass(active: boolean) {
    return [
      "group flex items-center gap-2 rounded-lg px-3 py-2 transition-colors",
      active ? "bg-gray-900 text-white shadow-sm" : "text-gray-800 hover:bg-gray-100",
    ].join(" ");
  }

  const sidebarItems = useMemo(() => {
    const items = [
      { href: "/dashboard/apps", label: "Apps", icon: AppWindow },
      { href: "/dashboard/hub", label: "Mes hubs", icon: LayoutDashboard },
      // { href: "/dashboard/puck", label: "Éditeur Puck", icon: PenTool },
      { href: "/dashboard/profile", label: "Mon profil", icon: User },
    ];
    if (isAdmin) items.push({ href: "/dashboard/admin", label: "Back‑office", icon: Shield });
    return items;
  }, [isAdmin]);

  // Sidebar open state for small screens. When true, we display the sidebar
  // overlaying the content with a backdrop. On larger screens (md and up)
  // the sidebar is always visible.
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen flex flex-col">
      {/* Top navigation bar */}
      <nav className="sticky top-0 z-40 flex items-center justify-between px-4 md:px-6 py-3 border-b bg-white/80 backdrop-blur supports-[backdrop-filter]:bg-white/60">
        <div className="flex items-center gap-3">
          {/* Mobile hamburger to toggle sidebar */}
          <button
            className="md:hidden p-2 rounded hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-300"
            onClick={() => setSidebarOpen(true)}
            aria-label="Ouvrir le menu"
          >
            <Menu size={20} />
          </button>
          <Link href="/dashboard/apps" className="font-bold text-lg text-gray-900 tracking-tight">
            HubLocal
          </Link>
        </div>
        <div className="hidden md:flex items-center gap-1 text-sm">
          {sidebarItems.map(({ href, label }) => (
            <Link
              key={href}
              href={href}
              className={[
                "px-3 py-1.5 rounded-md",
                isActive(href)
                  ? "bg-gray-900 text-white"
                  : "text-gray-700 hover:bg-gray-100",
              ].join(" ")}
            >
              {label}
            </Link>
          ))}
          <button
            onClick={() => signOut({ callbackUrl: "/" })}
            className="ml-2 inline-flex items-center rounded-md border border-gray-300 bg-white px-3 py-1.5 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50"
          >
            Déconnexion
          </button>
        </div>
      </nav>
      {/* Main content area with sidebar */}
      <div className="flex flex-1 bg-gray-50 relative">
        {/* Sidebar for desktop */}
        <aside className="hidden md:block w-64 border-r bg-white/80 backdrop-blur supports-[backdrop-filter]:bg-white/60">
          <div className="sticky top-[49px]">{/* account for sticky nav height */}
            <div className="p-4 border-b">
              <div className="text-xs uppercase tracking-wide text-gray-500">Navigation</div>
            </div>
            <nav className="p-3 space-y-1 text-sm">
              {sidebarItems.map(({ href, label, icon: Icon }) => (
                <Link key={href} href={href} className={navLinkClass(isActive(href))} aria-current={isActive(href) ? "page" : undefined}>
                  <Icon size={16} className="opacity-70 group-[.bg-gray-900]:opacity-100" />
                  <span>{label}</span>
                </Link>
              ))}
            </nav>
          </div>
        </aside>
        {/* Sidebar overlay for mobile */}
        {sidebarOpen && (
          <div className="md:hidden fixed inset-0 z-40 flex">
            <div className="absolute inset-0 bg-black/40" onClick={() => setSidebarOpen(false)} />
            <aside className="relative w-72 max-w-[80%] bg-white p-4 shadow-2xl z-50 rounded-r-xl">
              <div className="flex items-center justify-between mb-4">
                <span className="font-semibold">Menu</span>
                <button onClick={() => setSidebarOpen(false)} aria-label="Fermer" className="p-1 rounded hover:bg-gray-100">
                  <X size={18} />
                </button>
              </div>
              <nav className="space-y-1 text-sm">
                {sidebarItems.map(({ href, label, icon: Icon }) => (
                  <Link
                    key={href}
                    href={href}
                    className={navLinkClass(isActive(href))}
                    onClick={() => setSidebarOpen(false)}
                    aria-current={isActive(href) ? "page" : undefined}
                  >
                    <Icon size={16} className="opacity-70" />
                    <span>{label}</span>
                  </Link>
                ))}
              </nav>
            </aside>
          </div>
        )}
        <main className="flex-1 overflow-auto p-4">{children}</main>
      </div>
    </div>
  );
}