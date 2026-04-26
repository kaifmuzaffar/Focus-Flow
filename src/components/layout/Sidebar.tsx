"use client";

import React from "react";
import { usePathname, useRouter } from "next/navigation";
import { useSession, signIn, signOut } from "next-auth/react";
import { 
  LayoutDashboard, 
  Timer, 
  Library, 
  Calendar as CalendarIcon, 
  GraduationCap, 
  Server, 
  Trophy, 
  FolderSync, 
  Settings,
  LogOut,
  LogIn,
  ChevronLeft,
  ChevronRight
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useStore } from "@/store/useStore";

const navItems = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard },
  { href: "/sessions", label: "Sessions", icon: Timer },
  { href: "/courses", label: "Courses", icon: Library },
  { href: "/calendar", label: "Calendar", icon: CalendarIcon },
  { href: "/target", label: "Target", icon: GraduationCap },
  { href: "/data-room", label: "Data Room", icon: Server },
  { href: "/trophies", label: "Trophies", icon: Trophy },
  { href: "/target-config", label: "Target Config.", icon: FolderSync },
  { href: "/settings", label: "Settings", icon: Settings },
];

export function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { data: session, status } = useSession();
  const { hasTarget, courses, isSidebarCollapsed, toggleSidebar, setSidebarCollapsed } = useStore();

  return (
    <aside className={cn(
      "fixed inset-y-0 left-0 bg-brand-card flex flex-col z-50 transition-all duration-300",
      isSidebarCollapsed ? "w-20" : "w-64"
    )}>
      {/* Logo & Trial Info */}
      <div className={cn("p-6 pb-4", isSidebarCollapsed && "px-4")}>
        <div className={cn("flex items-center mb-1", isSidebarCollapsed ? "justify-center" : "gap-3")}>
          <div className="w-8 h-8 shrink-0 bg-orange-500 rounded-md flex items-center justify-center text-white font-bold text-lg">
            S
          </div>
          {!isSidebarCollapsed && <span className="font-bold text-xl tracking-tight whitespace-nowrap">FocusFlow</span>}
        </div>
      </div>



      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto px-4 py-2 space-y-0.5">
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          const isTargetSetup = !hasTarget;
          const isCourseSetup = hasTarget && courses.length === 0;
          
          let isDisabled = false;
          if (isTargetSetup && item.href !== '/target-config') isDisabled = true;
          if (isCourseSetup && item.href !== '/courses' && item.href !== '/target-config') isDisabled = true;

          const Icon = item.icon;

          return isDisabled ? (
            <div
              key={item.href}
              className={cn("flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium text-zinc-600 cursor-not-allowed opacity-50", isSidebarCollapsed && "justify-center px-2")}
            >
              <Icon className="w-5 h-5 shrink-0" />
              {!isSidebarCollapsed && <span className="whitespace-nowrap">{item.label}</span>}
            </div>
          ) : (
            <button
              key={item.href}
              onClick={() => {
                router.push(item.href);
              }}
              title={isSidebarCollapsed ? item.label : undefined}
              className={cn(
                "w-full text-left flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium transition-colors group",
                isActive 
                  ? "bg-brand-surface text-brand-primary font-bold shadow-sm" 
                  : "text-zinc-400 hover:text-white hover:bg-brand-surface",
                isSidebarCollapsed && "justify-center px-2"
              )}
            >
              <Icon className={cn(
                "w-5 h-5 shrink-0", 
                isActive ? "text-brand-primary" : "text-zinc-400 group-hover:text-zinc-300"
              )} />
              {!isSidebarCollapsed && <span className="whitespace-nowrap">{item.label}</span>}
            </button>
          );
        })}
        
        <div className={cn("pt-4 pb-2 px-2", isSidebarCollapsed && "flex justify-center")}>
           <button 
             onClick={toggleSidebar}
             className="w-8 h-8 shrink-0 rounded-full bg-brand-surface flex items-center justify-center text-zinc-400 hover:text-white hover:bg-brand-surface/80 transition-colors"
           >
              {isSidebarCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
           </button>
        </div>
      </nav>

      {/* Bottom Section */}
      <div className="p-4 mt-auto">

        <div className={cn("px-2 pb-2", isSidebarCollapsed && "flex flex-col items-center")}>
          {status === 'authenticated' ? (
            <>
              <button 
                title={isSidebarCollapsed ? "Profile" : undefined}
                className={cn("flex items-center gap-3 text-xs font-medium text-zinc-400 hover:text-white w-full transition-colors mb-4", isSidebarCollapsed && "justify-center")}
              >
                {session.user?.image ? (
                  <img src={session.user.image} alt="Profile" className="w-6 h-6 shrink-0 rounded-full" />
                ) : (
                  <div className="w-6 h-6 shrink-0 rounded-full bg-orange-600 flex items-center justify-center text-white">
                    {session.user?.name?.[0]?.toUpperCase() || 'U'}
                  </div>
                )}
                {!isSidebarCollapsed && <span className="whitespace-nowrap truncate overflow-hidden text-ellipsis">{session.user?.email}</span>}
              </button>
              
              <button 
                onClick={() => signOut({ callbackUrl: "/login" })}
                title={isSidebarCollapsed ? "Log out" : undefined}
                className={cn("flex items-center gap-3 text-sm font-medium text-zinc-400 hover:text-white w-full transition-colors", isSidebarCollapsed && "justify-center")}
              >
                <LogOut className="w-4 h-4 shrink-0" />
                {!isSidebarCollapsed && <span className="whitespace-nowrap">Log out</span>}
              </button>
            </>
          ) : (
            <button 
              onClick={() => signIn("google")}
              title={isSidebarCollapsed ? "Log in" : undefined}
              className={cn("flex items-center gap-3 text-sm font-medium text-brand-primary hover:text-white w-full transition-colors", isSidebarCollapsed && "justify-center")}
            >
              <LogIn className="w-4 h-4 shrink-0" />
              {!isSidebarCollapsed && <span className="whitespace-nowrap">Log in</span>}
            </button>
          )}
        </div>
      </div>
    </aside>
  );
}
