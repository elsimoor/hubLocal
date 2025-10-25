"use client";
import Link from "next/link";
import { useState } from "react";
import { useSession, signOut } from "next-auth/react";
import { Menu, X } from "lucide-react";

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

  // Sidebar open state for small screens. When true, we display the sidebar
  // overlaying the content with a backdrop. On larger screens (md and up)
  // the sidebar is always visible.
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen flex flex-col">
      {/* Top navigation bar */}
      <nav className="flex items-center justify-between px-6 py-3 border-b bg-white/80 backdrop-blur-md">
        <div className="flex items-center gap-3">
          {/* Mobile hamburger to toggle sidebar */}
          <button
            className="md:hidden p-2 rounded hover:bg-gray-200"
            onClick={() => setSidebarOpen(true)}
            aria-label="Ouvrir le menu"
          >
            <Menu size={20} />
          </button>
          <div className="font-bold text-lg text-gray-800">HubLocal</div>
        </div>
        <div className="flex items-center gap-4 text-sm text-gray-700">
          <Link href="/dashboard/hub" className="hover:underline hidden md:inline">
            Mes hubs
          </Link>
          <Link href="/dashboard/puck" className="hover:underline hidden md:inline">
            Éditeur Puck
          </Link>
          <Link href="/dashboard/profile" className="hover:underline hidden md:inline">
            Mon profil
          </Link>
          {isAdmin && (
            <Link href="/dashboard/admin" className="hover:underline hidden md:inline">
              Back‑office
            </Link>
          )}
          <button
            onClick={() => signOut({ callbackUrl: "/" })}
            className="text-gray-700 hover:underline"
          >
            Déconnexion
          </button>
        </div>
      </nav>
      {/* Main content area with sidebar */}
      <div className="flex flex-1 bg-gray-50 relative">
        {/* Sidebar for desktop */}
        <aside className="w-56 border-r bg-white/80 backdrop-blur-md p-4 hidden md:block">
          <nav className="space-y-2 text-sm">
            <Link
              href="/dashboard/hub"
              className="block rounded-lg px-3 py-2 hover:bg-gray-100 text-gray-800"
            >
              Mes hubs
            </Link>
            <Link
              href="/dashboard/puck"
              className="block rounded-lg px-3 py-2 hover:bg-gray-100 text-gray-800"
            >
              Éditeur Puck
            </Link>
            <Link
              href="/dashboard/profile"
              className="block rounded-lg px-3 py-2 hover:bg-gray-100 text-gray-800"
            >
              Mon profil
            </Link>
            {isAdmin && (
              <Link
                href="/dashboard/admin"
                className="block rounded-lg px-3 py-2 hover:bg-gray-100 text-gray-800"
              >
                Back‑office
              </Link>
            )}
          </nav>
        </aside>
        {/* Sidebar overlay for mobile */}
        {sidebarOpen && (
          <div className="md:hidden fixed inset-0 z-40 flex">
            <div className="absolute inset-0 bg-black/40" onClick={() => setSidebarOpen(false)} />
            <aside className="relative w-64 max-w-[70%] bg-white p-4 shadow-lg z-50">
              <div className="flex items-center justify-between mb-4">
                <span className="font-semibold">Menu</span>
                <button onClick={() => setSidebarOpen(false)} aria-label="Fermer" className="p-1 rounded hover:bg-gray-100">
                  <X size={18} />
                </button>
              </div>
              <nav className="space-y-2 text-sm">
                <Link
                  href="/dashboard/hub"
                  className="block rounded-lg px-3 py-2 hover:bg-gray-100 text-gray-800"
                  onClick={() => setSidebarOpen(false)}
                >
                  Mes hubs
                </Link>
                <Link
                  href="/dashboard/puck"
                  className="block rounded-lg px-3 py-2 hover:bg-gray-100 text-gray-800"
                  onClick={() => setSidebarOpen(false)}
                >
                  Éditeur Puck
                </Link>
                <Link
                  href="/dashboard/profile"
                  className="block rounded-lg px-3 py-2 hover:bg-gray-100 text-gray-800"
                  onClick={() => setSidebarOpen(false)}
                >
                  Mon profil
                </Link>
                {isAdmin && (
                  <Link
                    href="/dashboard/admin"
                    className="block rounded-lg px-3 py-2 hover:bg-gray-100 text-gray-800"
                    onClick={() => setSidebarOpen(false)}
                  >
                    Back‑office
                  </Link>
                )}
              </nav>
            </aside>
          </div>
        )}
        <main className="flex-1 overflow-auto p-4">{children}</main>
      </div>
    </div>
  );
}