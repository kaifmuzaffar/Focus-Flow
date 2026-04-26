"use client";

import { useSession } from "next-auth/react";
import { useRouter, usePathname } from "next/navigation";
import { useEffect } from "react";
import { GraduationCap } from "lucide-react";

export function AuthGuard({ children }: { children: React.ReactNode }) {
  const { status } = useSession();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (status === "unauthenticated" && pathname !== "/login") {
      router.push("/login");
    } else if (status === "authenticated" && pathname === "/login") {
      router.push("/");
    }
  }, [status, pathname, router]);

  if (status === "loading") {
    return (
      <div className="flex-1 flex flex-col items-center justify-center min-h-screen bg-brand-bg relative overflow-hidden">
        <div className="w-16 h-16 bg-brand-primary/10 rounded-2xl flex items-center justify-center mb-6 border border-brand-primary/20 shadow-[0_0_30px_rgba(88,166,255,0.15)] animate-pulse">
          <GraduationCap className="w-8 h-8 text-brand-primary animate-bounce" />
        </div>
        <div className="text-zinc-400 font-medium animate-pulse">Authenticating...</div>
      </div>
    );
  }

  // If unauthenticated, we don't want to render the children (which might crash trying to read user data)
  // while the useEffect redirect is processing.
  if (status === "unauthenticated" && pathname !== "/login") {
    return null; 
  }

  return <>{children}</>;
}
