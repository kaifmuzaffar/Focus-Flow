import React from "react";
import { cn } from "@/lib/utils";

type CardProps = React.HTMLAttributes<HTMLDivElement>;

export function Card({ className, ...props }: CardProps) {
  return (
    <div
      className={cn(
        "rounded-2xl border border-white/5 bg-brand-card p-6 shadow-xl shadow-black/10",
        className
      )}
      {...props}
    />
  );
}

interface CardHeaderProps extends Omit<React.HTMLAttributes<HTMLDivElement>, 'title'> {
  title: React.ReactNode;
  action?: React.ReactNode;
}

export function CardHeader({ className, title, action, ...props }: CardHeaderProps) {
  return (
    <div
      className={cn("flex items-center justify-between mb-4", className)}
      {...props}
    >
      <div className="font-bold text-lg text-white">{title}</div>
      {action && <div>{action}</div>}
    </div>
  );
}
