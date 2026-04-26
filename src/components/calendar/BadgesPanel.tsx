"use client";

import React from 'react';
import { useStore } from "@/store/useStore";

export function BadgesPanel() {
  const { stats } = useStore();
  
  return (
    <div className="bg-brand-card p-6 rounded-2xl border border-white/5 flex-1">
       <div className="flex justify-between items-center mb-6">
         <h3 className="font-bold text-white">Badges</h3>
         <span className="text-xs font-bold bg-brand-surface px-2 py-1 rounded-md text-zinc-400">
           {stats.badgesEarned.length} Earned
         </span>
       </div>
       
       {stats.currentStreak >= 7 ? (
         <div className="flex items-center gap-4 bg-[#f5a524]/10 p-4 rounded-xl border border-[#f5a524]/20">
            <div className="text-4xl">🔥</div>
            <div>
               <div className="text-sm font-bold text-[#f5a524]">7-Day Streak!</div>
               <div className="text-xs text-zinc-400">You've maintained a streak of 7+ days!</div>
            </div>
         </div>
       ) : (
         <div className="flex items-center gap-4 bg-brand-surface/50 p-4 rounded-xl border border-white/5 opacity-50 grayscale">
            <div className="text-4xl">🔥</div>
            <div>
               <div className="text-sm font-bold text-white">7-Day Streak</div>
               <div className="text-xs text-zinc-400">Study for 7 consecutive days.</div>
            </div>
         </div>
       )}
       
       {/* More badges can go here */}
       <div className="mt-4 flex items-center gap-4 bg-brand-surface/50 p-4 rounded-xl border border-white/5 opacity-50 grayscale">
          <div className="text-4xl">⭐</div>
          <div>
             <div className="text-sm font-bold text-white">Goal Crusher</div>
             <div className="text-xs text-zinc-400">Hit your goal 10 times.</div>
          </div>
       </div>
    </div>
  );
}
