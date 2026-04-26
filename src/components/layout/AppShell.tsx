"use client";

import React from "react";
import { useStore } from "@/store/useStore";
import { Sidebar } from "./Sidebar";
import { cn } from "@/lib/utils";

export function AppShell({ children }: { children: React.ReactNode }) {
  const { isSidebarCollapsed } = useStore();
  
  return (
    <>
      <Sidebar />
      <main className={cn("flex-1 flex flex-col min-h-screen transition-all duration-300", isSidebarCollapsed ? "pl-20" : "pl-64")}>
        {children}
      </main>
    </>
  );
}
