"use client";

import { DashboardUIProvider } from "./ui-context";
import { Sidebar } from "@/components/dashboard/Sidebar";
import { Navbar } from "@/components/dashboard/Navbar";

/**
 * DashboardLayout wraps all pages under the `/dashboard` route.
 * It uses the new Sidebar and Navbar components for a premium look.
 */
export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <DashboardUIProvider>
      <div className="flex h-screen w-full bg-gray-50">
        <Sidebar />
        <div className="flex flex-1 flex-col overflow-hidden">
          <Navbar />
          <main className="flex-1 overflow-y-auto p-4 md:p-6">
            {children}
          </main>
        </div>
      </div>
    </DashboardUIProvider>
  );
}