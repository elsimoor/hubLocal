"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession, signOut } from "next-auth/react";
import {
    Search,
    Bell,
    Menu,
    ChevronRight,
    Home,
    User,
    LogOut,
} from "lucide-react";
import { useDashboardUI } from "@/app/(page)/dashboard/ui-context";
import { cn } from "@/lib/utils";

export function Navbar() {
    const pathname = usePathname();
    const { data: session } = useSession();
    const { setSidebarCollapsed, toggleSidebar } = useDashboardUI();

    // Generate breadcrumbs from pathname
    const breadcrumbs = pathname
        ?.split("/")
        .filter(Boolean)
        .map((segment, index, array) => {
            const href = "/" + array.slice(0, index + 1).join("/");
            const isLast = index === array.length - 1;
            const label = segment.charAt(0).toUpperCase() + segment.slice(1);
            return { href, label, isLast };
        });

    return (
        <header className="sticky top-0 z-20 flex h-20 items-center justify-between border-b border-gray-200/50 bg-white/80 px-6 backdrop-blur-xl transition-all supports-[backdrop-filter]:bg-white/60">
            <div className="flex items-center gap-4">
                {/* Mobile Menu Toggle */}
                <button
                    onClick={toggleSidebar}
                    className="flex h-10 w-10 items-center justify-center rounded-xl bg-white text-gray-500 shadow-sm ring-1 ring-gray-200 transition-all hover:bg-gray-50 hover:text-indigo-600 md:hidden"
                >
                    <Menu size={20} />
                </button>

                {/* Breadcrumbs */}
                <nav className="hidden items-center gap-2 text-sm font-medium text-gray-500 md:flex">
                    <Link
                        href="/dashboard"
                        className="flex items-center gap-1 transition-colors hover:text-indigo-600"
                    >
                        <Home size={18} />
                    </Link>
                    {breadcrumbs?.map((crumb, index) => (
                        <div key={crumb.href} className="flex items-center gap-2">
                            <ChevronRight size={16} className="text-gray-400" />
                            {crumb.isLast ? (
                                <span className="bg-gradient-to-r from-indigo-600 to-violet-600 bg-clip-text font-bold text-transparent text-base">
                                    {crumb.label}
                                </span>
                            ) : (
                                <Link
                                    href={crumb.href}
                                    className="transition-colors hover:text-indigo-600 font-medium text-gray-600 hover:bg-gray-100 px-2 py-1 rounded-md"
                                >
                                    {crumb.label}
                                </Link>
                            )}
                        </div>
                    ))}
                </nav>
            </div>

            <div className="flex items-center gap-4">
                {/* Search Bar */}
                <div className="relative hidden md:block group">
                    <Search
                        size={18}
                        className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-indigo-500 transition-colors"
                    />
                    <input
                        type="text"
                        placeholder="Rechercher..."
                        className="h-10 w-72 rounded-xl border-none bg-gray-100/80 pl-10 text-sm font-medium text-gray-900 ring-1 ring-transparent transition-all placeholder:text-gray-500 focus:bg-white focus:ring-2 focus:ring-indigo-500/20 focus:shadow-lg focus:shadow-indigo-500/10"
                    />
                </div>

                {/* Notifications */}
                <button className="relative flex h-10 w-10 items-center justify-center rounded-xl bg-white text-gray-500 shadow-sm ring-1 ring-gray-200 transition-all hover:bg-gray-50 hover:text-indigo-600 hover:ring-indigo-200">
                    <Bell size={20} />
                    <span className="absolute right-2.5 top-2.5 h-2.5 w-2.5 rounded-full bg-red-500 ring-2 ring-white animate-pulse" />
                </button>

                {/* User Menu */}
                <div className="flex items-center gap-3 border-l border-gray-200 pl-4">
                    <button
                        onClick={() => signOut({ callbackUrl: "/" })}
                        className="flex h-10 items-center gap-2 rounded-xl bg-white px-4 text-sm font-semibold text-gray-700 shadow-sm ring-1 ring-gray-200 transition-all hover:bg-red-50 hover:text-red-600 hover:ring-red-200 hover:shadow-red-100"
                    >
                        <LogOut size={18} />
                        <span className="hidden md:inline">Déconnexion</span>
                    </button>
                </div>
            </div>
        </header>
    );
}
