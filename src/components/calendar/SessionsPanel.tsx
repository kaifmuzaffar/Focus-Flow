"use client";

import React from 'react';
import { useStore } from "@/store/useStore";
import { formatDate, formatTimeStrFromString } from "@/lib/formatters";

export function SessionsPanel({ date }: { date: string }) {
  const { getSessionsByDate, preferences, courses } = useStore();
  
  // If no date is passed (e.g. initial load), default to today
  const targetDate = date || new Date().toISOString().split('T')[0];
  const sessions = getSessionsByDate(targetDate);
  
  const getCourse = (cId: string) => courses.find(c => c.id === cId);

  return (
    <div className="bg-brand-card p-6 rounded-2xl border border-white/5">
       <h3 className="font-bold text-white mb-4">Sessions for {formatDate(targetDate, preferences)}</h3>
       {sessions.length === 0 ? (
         <div className="flex flex-col items-center justify-center py-10">
            <div className="text-4xl mb-3">📭</div>
            <p className="text-sm text-zinc-400">No sessions on this date.</p>
         </div>
       ) : (
         <div className="space-y-3">
           {sessions.map(s => {
             const c = getCourse(s.courseId);
             return (
               <div key={s.id} className="bg-brand-surface p-3 rounded-xl border border-white/5 flex justify-between items-center">
                 <div>
                   <div className="font-bold text-sm text-white flex items-center gap-2">
                     <span className="w-2 h-2 rounded-full" style={{ backgroundColor: c?.color || '#17c964' }}></span>
                     {c?.name || 'Unknown'}
                   </div>
                   <div className="text-xs text-zinc-400 mt-1 uppercase tracking-wider font-bold">{s.type}</div>
                 </div>
                 <div className="text-right">
                   <div className="text-sm font-bold text-brand-primary">{Math.floor(s.totalDurationMinutes / 60)}h {s.totalDurationMinutes % 60}m</div>
                   <div className="text-[10px] text-zinc-500">{formatTimeStrFromString(s.startTime, preferences)} - {s.endTime ? formatTimeStrFromString(s.endTime, preferences) : 'Now'}</div>
                 </div>
               </div>
             );
           })}
         </div>
       )}
    </div>
  );
}
