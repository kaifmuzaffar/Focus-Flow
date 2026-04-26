import React from "react";
import { cn } from "@/lib/utils";

interface ProgressBarProps {
  value: number; // 0 to 100
  colorClass?: string;
  className?: string;
}

export function ProgressBar({ value, colorClass = "bg-brand-primary", className }: ProgressBarProps) {
  const safeValue = Math.min(Math.max(value, 0), 100);
  
  return (
    <div className={cn("h-2.5 w-full bg-brand-surface rounded-full overflow-hidden", className)}>
      <div 
        className={cn("h-full rounded-full transition-all duration-500", colorClass)}
        style={{ width: `${safeValue}%` }}
      />
    </div>
  );
}
