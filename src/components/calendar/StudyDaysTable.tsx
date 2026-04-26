"use client";

import React, { useState } from 'react';
import { useStore } from "@/store/useStore";
import { formatDate } from "@/lib/formatters";
import { ProgressBar } from "@/components/ui/ProgressBar";

export function StudyDaysTable({ period }: { period: 'days'|'weeks'|'months' }) {
  const { sessions, defaultDailyGoal, preferences } = useStore();
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  
  // Aggregate data by day
  const dailyData = sessions.reduce((acc, s) => {
    if (!acc[s.date]) acc[s.date] = { study: 0, idle: 0, breaks: 0 };
    acc[s.date].study += (s.studyMinutes || 0);
    acc[s.date].idle += (s.idleMinutes || 0);
    acc[s.date].breaks += (s.numberOfBreaks || 0);
    return acc;
  }, {} as Record<string, { study: number, idle: number, breaks: number }>);

  const rows = Object.entries(dailyData).map(([date, data]) => {
    const total = data.study + data.idle;
    return {
      date,
      studyMinutes: data.study,
      idleMinutes: data.idle,
      breaks: data.breaks,
      productivityPercent: total > 0 ? Math.round((data.study / total) * 100) : 0
    };
  });

  // Sort
  rows.sort((a, b) => {
    const timeA = new Date(a.date).getTime();
    const timeB = new Date(b.date).getTime();
    return sortOrder === 'asc' ? timeA - timeB : timeB - timeA;
  });

  return (
    <div className="bg-brand-card p-6 rounded-2xl border border-white/5">
      <div className="flex justify-between items-center mb-6">
        <h3 className="font-bold text-white">Study days • {rows.length}</h3>
        <button 
          onClick={() => setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc')}
          className="text-xs text-brand-primary hover:underline"
        >
          Sort by Date {sortOrder === 'asc' ? '↑' : '↓'}
        </button>
      </div>

      <div className="w-full text-left text-sm">
        <div className="grid grid-cols-[auto_1fr_1fr_1fr_1fr_2fr] gap-4 text-zinc-400 font-semibold border-b border-white/5 pb-3 px-2">
          <div className="w-4"></div>
          <div>Date</div>
          <div>Productive time</div>
          <div>Idle time</div>
          <div>Breaks</div>
          <div>Productivity %</div>
        </div>
        
        <div className="mt-2 space-y-1 max-h-[300px] overflow-y-auto">
          {rows.length === 0 ? (
             <div className="text-center text-zinc-500 py-8 text-xs">No study days yet</div>
          ) : (
            rows.map(row => (
              <div key={row.date} className="grid grid-cols-[auto_1fr_1fr_1fr_1fr_2fr] gap-4 items-center py-3 px-2 hover:bg-brand-surface/50 rounded-xl transition-colors border border-transparent hover:border-white/5 cursor-pointer">
                <input type="checkbox" className="w-4 h-4 rounded border-zinc-500 bg-transparent text-brand-primary focus:ring-0" />
                <div className="font-bold text-white">{formatDate(row.date, preferences)}</div>
                <div className="text-[#17c964] font-bold">{(row.studyMinutes / 60).toFixed(1)}h</div>
                <div className="text-[#f5a524] font-bold">{(row.idleMinutes / 60).toFixed(1)}h</div>
                <div className="text-zinc-300 font-semibold">{row.breaks}</div>
                <div className="flex items-center gap-3">
                  <ProgressBar 
                    value={row.productivityPercent} 
                    colorClass={row.productivityPercent >= 75 ? "bg-[#17c964]" : row.productivityPercent >= 50 ? "bg-[#f5a524]" : "bg-red-500"} 
                  />
                  <span className="text-xs font-bold w-10 text-right text-zinc-400">{row.productivityPercent}%</span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
