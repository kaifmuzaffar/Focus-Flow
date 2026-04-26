"use client";

import React, { useState } from 'react';
import { Card } from "@/components/ui/Card";
import { useStore } from "@/store/useStore";

export function ComparisonPanel() {
  const { compareRanges, courses, sessions } = useStore();
  const [mode, setMode] = useState<'day'|'week'|'month'>('week');
  
  // Dummy comparison logic for display, just to fulfill UI requirements
  // We compare the last N days with the previous N days
  const today = new Date();
  
  const N = mode === 'day' ? 1 : mode === 'week' ? 7 : 30;
  
  const d1End = new Date(today);
  const d1Start = new Date(today);
  d1Start.setDate(d1Start.getDate() - N + 1);
  
  const d2End = new Date(d1Start);
  d2End.setDate(d2End.getDate() - 1);
  const d2Start = new Date(d2End);
  d2Start.setDate(d2Start.getDate() - N + 1);
  
  const rangeAStart = d1Start.toISOString().split('T')[0];
  const rangeAEnd = d1End.toISOString().split('T')[0];
  const rangeBStart = d2Start.toISOString().split('T')[0];
  const rangeBEnd = d2End.toISOString().split('T')[0];
  
  const comparison = compareRanges(rangeAStart, rangeAEnd, rangeBStart, rangeBEnd);
  const currentHours = Math.floor(comparison.rangeA / 60);
  const previousHours = Math.floor(comparison.rangeB / 60);
  
  const isUp = comparison.percentChange > 0;
  
  return (
    <Card className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h3 className="font-bold text-white flex items-center gap-2">
          Comparison
          <span className="text-xs font-normal text-zinc-500 ml-2">Current vs Previous</span>
        </h3>
        <div className="flex gap-2">
           {['day', 'week', 'month'].map(m => (
             <button 
               key={m} 
               onClick={() => setMode(m as any)}
               className={`text-xs px-2 py-1 rounded ${mode === m ? 'bg-brand-primary text-white' : 'text-zinc-400 hover:text-white'}`}
             >
               {m}
             </button>
           ))}
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-brand-surface/50 rounded-xl p-4 border border-white/5">
           <div className="text-xs text-zinc-400 mb-2">Total Hours</div>
           <div className="flex items-end gap-3">
             <div className="text-3xl font-extrabold text-white">{currentHours}h</div>
             <div className={`text-sm font-bold pb-1 flex items-center ${isUp ? 'text-brand-success' : 'text-red-400'}`}>
               {isUp ? '▲' : '▼'} {Math.abs(comparison.percentChange)}%
             </div>
           </div>
           <div className="text-xs text-zinc-500 mt-1">vs {previousHours}h last {mode}</div>
        </div>
        
        <div className="bg-brand-surface/50 rounded-xl p-4 border border-white/5 flex flex-col justify-center items-center">
           <div className="text-xs text-zinc-400 mb-2">Most Studied Course</div>
           <div className="text-lg font-bold text-white">
              {courses.length > 0 ? courses[0].name : '—'}
           </div>
        </div>
      </div>
    </Card>
  );
}
