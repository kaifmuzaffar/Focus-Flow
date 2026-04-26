import React from "react";
import { cn } from "@/lib/utils";

interface TabsProps {
  tabs: { id: string; label: string }[];
  activeTab: string;
  onChange: (id: string) => void;
  className?: string;
}

export function Tabs({ tabs, activeTab, onChange, className }: TabsProps) {
  return (
    <div className={cn("flex space-x-1 bg-brand-bg/50 p-1 rounded-xl w-max", className)}>
      {tabs.map((tab) => {
        const isActive = activeTab === tab.id;
        return (
          <button
            key={tab.id}
            onClick={() => onChange(tab.id)}
            className={cn(
              "px-4 py-1.5 rounded-lg text-sm font-semibold transition-all duration-200",
              isActive 
                ? "bg-brand-card text-white shadow-sm" 
                : "text-zinc-500 hover:text-zinc-300 hover:bg-brand-card/50"
            )}
          >
            {tab.label}
          </button>
        );
      })}
    </div>
  );
}
