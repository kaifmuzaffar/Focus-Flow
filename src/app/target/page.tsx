"use client";

import React from "react";
import { Topbar } from "@/components/layout/Topbar";
import { Card } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";

export default function Target() {
  return (
    <>
      <Topbar title="Target" subtitle="25/04/26 • 2NDCODE 2026" />
      <div className="p-8 flex flex-col flex-1 overflow-y-auto w-full">
        <Card className="flex-1 flex flex-col items-center justify-center min-h-[400px] bg-brand-card/30">
          <EmptyState 
            title="Target Overview"
            description="Your target details and progress will appear here."
            icon={<div className="text-6xl mb-4">🎓</div>}
          />
        </Card>
      </div>
    </>
  );
}
