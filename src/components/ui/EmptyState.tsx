import React from "react";
import { cn } from "@/lib/utils";

interface EmptyStateProps {
  title: string;
  description: string;
  action?: React.ReactNode;
  icon?: React.ReactNode;
  className?: string;
}

export function EmptyState({ title, description, action, icon, className }: EmptyStateProps) {
  return (
    <div className={cn("flex flex-col items-center justify-center text-center p-8 h-full min-h-[200px]", className)}>
      {icon && <div className="mb-4 text-zinc-500">{icon}</div>}
      {/* Fallback box for illustration if no icon provided */}
      {!icon && (
        <div className="w-24 h-24 mb-6 relative">
          <div className="absolute inset-0 bg-brand-surface rounded-2xl transform rotate-3"></div>
          <div className="absolute inset-0 bg-brand-card border border-white/10 rounded-2xl flex items-center justify-center transform -rotate-3">
             <span className="text-3xl">📭</span>
          </div>
        </div>
      )}
      <h3 className="text-lg font-bold text-white mb-2">{title}</h3>
      <p className="text-sm text-zinc-400 max-w-sm mb-6 leading-relaxed">
        {description}
      </p>
      {action && <div>{action}</div>}
    </div>
  );
}
