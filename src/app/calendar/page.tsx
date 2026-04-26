"use client";

import React, { useState } from "react";
import { Topbar } from "@/components/layout/Topbar";
import { Card } from "@/components/ui/Card";
import { useStore } from "@/store/useStore";

import { StatsRow } from "@/components/calendar/StatsRow";
import { PeriodToggle } from "@/components/calendar/PeriodToggle";
import { StudyBarChart } from "@/components/calendar/StudyBarChart";
import { ComparisonPanel } from "@/components/calendar/ComparisonPanel";
import { StudyDaysTable } from "@/components/calendar/StudyDaysTable";
import { SessionsPanel } from "@/components/calendar/SessionsPanel";
import { BadgesPanel } from "@/components/calendar/BadgesPanel";

export default function Calendar() {
  const { preferences } = useStore();
  const [period, setPeriod] = useState<'days' | 'weeks' | 'months'>('days');
  const [selectedDate, setSelectedDate] = useState<string>("");

  return (
    <>
      <Topbar title="Calendar" subtitle="25/04/26 • 2NDCODE 2026" />
      
      <div className="p-8 pt-6 flex-1 overflow-y-auto">
        
        <StatsRow />

        <div className="grid grid-cols-1 md:grid-cols-[1fr_320px] gap-6">
          
          {/* LEFT COLUMN: Chart & Table */}
          <div className="flex flex-col gap-6">
             <Card className="p-6">
               <div className="flex justify-between items-center mb-2">
                 <h2 className="text-xl font-bold text-white">Study Progress</h2>
                 <PeriodToggle period={period} setPeriod={setPeriod} />
               </div>
               
               <StudyBarChart period={period} onBarClick={setSelectedDate} />
             </Card>

             <ComparisonPanel />
             
             <StudyDaysTable period={period} />
          </div>

          {/* RIGHT COLUMN: Sessions & Badges */}
          <div className="flex flex-col gap-6">
             <SessionsPanel date={selectedDate} />
             <BadgesPanel />
          </div>

        </div>
      </div>
    </>
  );
}
