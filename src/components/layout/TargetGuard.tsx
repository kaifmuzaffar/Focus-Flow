"use client";

import React, { useEffect, useState } from "react";
import { useStore } from "@/store/useStore";
import { useRouter, usePathname } from "next/navigation";

export function TargetGuard({ children }: { children: React.ReactNode }) {
  const { hasTarget, courses } = useStore();
  const router = useRouter();
  const pathname = usePathname();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (mounted) {
      if (!hasTarget) {
        if (pathname !== '/target-config') {
          router.replace('/target-config');
        }
      } else if (hasTarget && courses.length === 0) {
        if (pathname !== '/courses' && pathname !== '/target-config') {
          router.replace('/courses');
        }
      }
    }
  }, [mounted, hasTarget, courses.length, pathname, router]);

  if (!mounted) return null; // Wait for hydration to prevent flicker

  return <>{children}</>;
}
