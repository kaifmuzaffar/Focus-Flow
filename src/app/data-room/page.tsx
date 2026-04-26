"use client";

import React from "react";
import { Topbar } from "@/components/layout/Topbar";
import { Card } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { Settings as SettingsIcon, Monitor, Moon } from "lucide-react";

export default function DataRoom() {
  return (
    <>
      <Topbar title="Data Room" subtitle="25/04/26 • 2NDCODE 2026" />
      
      <div className="p-8 flex flex-col flex-1 overflow-y-auto w-full">
        <Card className="flex-1 flex flex-col items-center justify-center min-h-[400px] bg-brand-card/30">
          <EmptyState 
            title=""
            description="Log more than five sessions to unlock study matrices with insights into your patterns."
            icon={<div className="text-6xl mb-4">🗓️</div>}
          />
        </Card>


      </div>
    </>
  );
}
