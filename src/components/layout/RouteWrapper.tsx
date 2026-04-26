"use client";

import { usePathname } from "next/navigation";
import { AppShell } from "@/components/layout/AppShell";
import { TargetGuard } from "@/components/layout/TargetGuard";
import { AuthGuard } from "@/components/layout/AuthGuard";
import React from "react";

export function RouteWrapper({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  // If we are on the login page, we only want the AuthGuard (which handles redirecting logged-in users away)
  // We do NOT want the sidebar (AppShell) or the TargetGuard (which redirects users without targets).
  if (pathname === "/login") {
    return (
      <AuthGuard>
        {children}
      </AuthGuard>
    );
  }

  // For all other pages, enforce the strict flow: Auth -> Target -> App
  return (
    <AuthGuard>
      <TargetGuard>
        <AppShell>
          {children}
        </AppShell>
      </TargetGuard>
    </AuthGuard>
  );
}
