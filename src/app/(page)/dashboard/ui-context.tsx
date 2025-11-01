"use client";
import React from "react";

type DashboardUIState = {
  sidebarCollapsed: boolean;
  setSidebarCollapsed: (v: boolean) => void;
  toggleSidebar: () => void;
};

const DashboardUIContext = React.createContext<DashboardUIState | undefined>(
  undefined
);

export function useDashboardUI() {
  const ctx = React.useContext(DashboardUIContext);
  if (!ctx) {
    throw new Error("useDashboardUI must be used within <DashboardUIProvider>");
  }
  return ctx;
}

export function DashboardUIProvider({
  children,
  initialCollapsed = false,
}: {
  children: React.ReactNode;
  initialCollapsed?: boolean;
}) {
  const [sidebarCollapsed, setSidebarCollapsed] = React.useState<boolean>(
    initialCollapsed
  );

  const value = React.useMemo(
    () => ({
      sidebarCollapsed,
      setSidebarCollapsed,
      toggleSidebar: () => setSidebarCollapsed((v) => !v),
    }),
    [sidebarCollapsed]
  );

  return (
    <DashboardUIContext.Provider value={value}>
      {children}
    </DashboardUIContext.Provider>
  );
}
