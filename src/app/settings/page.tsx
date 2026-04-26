"use client";

import React from "react";
import { Topbar } from "@/components/layout/Topbar";
import { useStore } from "@/store/useStore";

export default function Settings() {
  const { preferences, updatePreferences } = useStore();
  return (
    <>
      <Topbar title="Settings" subtitle="25/04/26 • 2NDCODE 2026" />
      
      <div className="p-8 flex flex-col flex-1 overflow-y-auto w-full">
        <div className="border border-white/5 bg-brand-card rounded-2xl p-8 shadow-xl shadow-black/10">
          
          <div className="grid grid-cols-1 md:grid-cols-[250px_1fr] gap-8">
            <div>
              <h2 className="text-xl font-bold text-white mb-2">General settings</h2>
              <p className="text-sm text-zinc-400">
                Change general settings like language, date/time formats, and grading scale.
              </p>
            </div>
            
            <div className="space-y-8">
              {/* Language Selection */}
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                 <div className="p-4 rounded-2xl border border-brand-primary bg-brand-primary/5 shadow-md shadow-brand-primary/10 flex justify-between items-center cursor-default">
                   <div className="flex items-center gap-3">
                     <div className="w-4 h-4 rounded-full border-2 border-brand-primary flex items-center justify-center">
                       <div className="w-2 h-2 rounded-full bg-brand-primary"></div>
                     </div>
                     <span className="text-sm font-semibold text-white">English</span>
                   </div>
                   <span className="text-lg font-bold text-zinc-500">EN</span>
                 </div>
              </div>

              {/* Formats */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-8 border-t border-white/5">
                
                <div>
                  <h4 className="text-sm font-bold text-white mb-4">Time format</h4>
                  <div className="flex items-center gap-6">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${preferences.timeFormat === '12h' ? 'border-brand-primary' : 'border-zinc-500'}`}>
                         {preferences.timeFormat === '12h' && <div className="w-2 h-2 rounded-full bg-brand-primary"></div>}
                      </div>
                      <span className={`text-sm ${preferences.timeFormat === '12h' ? 'text-white font-medium' : 'text-zinc-300'}`}>12-hour clock</span>
                      <input type="radio" className="hidden" checked={preferences.timeFormat === '12h'} onChange={() => updatePreferences({ timeFormat: '12h' })} />
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${preferences.timeFormat === '24h' ? 'border-brand-primary' : 'border-zinc-500'}`}>
                         {preferences.timeFormat === '24h' && <div className="w-2 h-2 rounded-full bg-brand-primary"></div>}
                      </div>
                      <span className={`text-sm ${preferences.timeFormat === '24h' ? 'text-white font-medium' : 'text-zinc-300'}`}>24-hour clock</span>
                      <input type="radio" className="hidden" checked={preferences.timeFormat === '24h'} onChange={() => updatePreferences({ timeFormat: '24h' })} />
                    </label>
                  </div>
                </div>

                <div>
                  <h4 className="text-sm font-bold text-white mb-4">Date format</h4>
                  <div className="flex flex-col gap-3">
                    {['DD/MM/YYYY', 'MM/DD/YYYY', 'YYYY-MM-DD'].map((fmt) => (
                      <label key={fmt} className="flex items-center gap-2 cursor-pointer">
                        <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${preferences.dateFormat === fmt ? 'border-brand-primary' : 'border-zinc-500'}`}>
                           {preferences.dateFormat === fmt && <div className="w-2 h-2 rounded-full bg-brand-primary"></div>}
                        </div>
                        <span className={`text-sm ${preferences.dateFormat === fmt ? 'text-white font-medium' : 'text-zinc-300'}`}>{fmt}</span>
                        <input type="radio" className="hidden" checked={preferences.dateFormat === fmt} onChange={() => updatePreferences({ dateFormat: fmt as any })} />
                      </label>
                    ))}
                  </div>
                </div>

                <div>
                  <h4 className="text-sm font-bold text-white mb-4">Week start day</h4>
                  <div className="flex items-center gap-6">
                    {['Monday', 'Sunday'].map((day) => (
                      <label key={day} className="flex items-center gap-2 cursor-pointer">
                        <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${preferences.weekStart === day ? 'border-brand-primary' : 'border-zinc-500'}`}>
                           {preferences.weekStart === day && <div className="w-2 h-2 rounded-full bg-brand-primary"></div>}
                        </div>
                        <span className={`text-sm ${preferences.weekStart === day ? 'text-white font-medium' : 'text-zinc-300'}`}>{day}</span>
                        <input type="radio" className="hidden" checked={preferences.weekStart === day} onChange={() => updatePreferences({ weekStart: day as any })} />
                      </label>
                    ))}
                  </div>
                </div>



              </div>
            </div>
          </div>
          
        </div>
      </div>
    </>
  );
}
