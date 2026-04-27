"use client";

import React, { useState, useRef, useEffect } from "react";
import { Plus, Timer, HelpCircle, ChevronDown, Play, Pause, RotateCcw, Flag, Square } from "lucide-react";
import { useRouter } from "next/navigation";
import { useStore } from "@/store/useStore";
import { formatDate } from "@/lib/formatters";

interface TopbarProps {
  title: string;
  subtitle?: string;
}

export function Topbar({ title, subtitle }: TopbarProps) {
  const router = useRouter();
  const { 
    stopwatch, setStopwatch, resetStopwatch, recordLap, preferences, targets, activeTargetId,
    activeSessionId, getCurrentSessionElapsed, currentSessionStatus, tickActiveSession, pauseSession, resumeSession, stopSession, sessions, courses
  } = useStore();
  const activeTargetName = targets.find(t => t.id === activeTargetId)?.name || "No target set";
  const [showStopwatch, setShowStopwatch] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const [displaySeconds, setDisplaySeconds] = useState(0);
  const [currentSessionElapsed, setCurrentSessionElapsed] = useState(0);
  
  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowStopwatch(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Update display time
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (stopwatch.isActive && stopwatch.startTime) {
      interval = setInterval(() => {
        const now = Date.now();
        const elapsed = Math.floor((now - (stopwatch.startTime || now) + stopwatch.accumulatedMs) / 1000);
        setDisplaySeconds(elapsed);
      }, 100);
    } else {
      setDisplaySeconds(Math.floor(stopwatch.accumulatedMs / 1000));
    }
    return () => clearInterval(interval);
  }, [stopwatch.isActive, stopwatch.startTime, stopwatch.accumulatedMs]);

  // Session Ticker
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (activeSessionId && (currentSessionStatus === 'studying' || currentSessionStatus === 'paused')) {
      setCurrentSessionElapsed(getCurrentSessionElapsed());
      interval = setInterval(() => {
        tickActiveSession();
        setCurrentSessionElapsed(getCurrentSessionElapsed());
      }, 1000);
    } else {
      setCurrentSessionElapsed(0);
    }
    return () => clearInterval(interval);
  }, [activeSessionId, currentSessionStatus, tickActiveSession, getCurrentSessionElapsed]);

  const handleStartPause = () => {
    if (stopwatch.isActive) {
      // Pause
      const now = Date.now();
      const elapsed = now - (stopwatch.startTime || now);
      setStopwatch({ 
        isActive: false, 
        startTime: null, 
        accumulatedMs: stopwatch.accumulatedMs + elapsed 
      });
    } else {
      // Start
      setStopwatch({ 
        isActive: true, 
        startTime: Date.now() 
      });
    }
  };

  const handleReset = () => {
    resetStopwatch();
  };

  const handleLap = () => {
    if (stopwatch.isActive && stopwatch.startTime) {
      const now = Date.now();
      const currentMs = now - stopwatch.startTime + stopwatch.accumulatedMs;
      recordLap(currentMs);
    }
  };

  const formatTime = (seconds: number) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const activeSession = sessions.find(s => s.id === activeSessionId);
  const activeCourse = courses.find(c => c.id === activeSession?.courseId);

  const formatMs = (ms: number) => {
    return formatTime(Math.floor(ms / 1000));
  };

  return (
    <>
      <header className="h-20 px-8 flex items-center justify-between bg-brand-bg sticky top-0 z-40">
        <div className="flex flex-col justify-center">
          {subtitle && (
            <div className="text-xs font-semibold text-zinc-500 mb-0.5">
              {formatDate(new Date(), preferences)} • {activeTargetName}
            </div>
          )}
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-extrabold text-white tracking-tight">{title}</h1>
          </div>
        </div>

        {/* Active Session Widget */}
        {activeSessionId && activeSession && (
          <div className="absolute left-1/2 -translate-x-1/2 flex items-center bg-brand-surface border border-brand-primary/30 rounded-full px-5 py-2 shadow-xl shadow-brand-primary/10 gap-5 z-50">
             <div className="flex items-center gap-3">
               <div className={`w-2.5 h-2.5 rounded-full shadow-[0_0_8px_rgba(0,0,0,0.5)] ${currentSessionStatus === 'studying' ? 'bg-brand-success animate-pulse shadow-brand-success' : 'bg-[#f5a524]'}`}></div>
               <span className="text-sm font-extrabold text-white tracking-wide">
                 {activeCourse?.name || 'Session'} <span className="mx-2 text-zinc-500 font-normal">•</span> <span className="font-mono text-[15px]">{formatTime(currentSessionElapsed)}</span>
               </span>
               <span className="text-xs font-bold text-zinc-400 uppercase tracking-wider ml-1">{currentSessionStatus}</span>
             </div>
             
             <div className="flex items-center gap-1.5 border-l border-white/10 pl-4">
                {currentSessionStatus === 'studying' ? (
                  <button onClick={pauseSession} className="p-1.5 hover:bg-white/10 rounded-full text-zinc-300 hover:text-[#f5a524] transition-colors bg-white/5" title="Pause">
                    <Pause className="w-4 h-4 fill-current" />
                  </button>
                ) : (
                  <button onClick={resumeSession} className="p-1.5 hover:bg-white/10 rounded-full text-zinc-300 hover:text-brand-success transition-colors bg-white/5" title="Resume">
                    <Play className="w-4 h-4 fill-current" />
                  </button>
                )}
                <button onClick={stopSession} className="p-1.5 hover:bg-white/10 rounded-full text-zinc-300 hover:text-[#f34645] transition-colors bg-white/5" title="Stop">
                  <Square className="w-4 h-4 fill-current" />
                </button>
             </div>
          </div>
        )}

        <div className="flex items-center gap-3 relative" ref={dropdownRef}>
          <button 
            onClick={() => router.push('/sessions')}
            className="h-10 bg-white text-brand-bg px-4 rounded-xl font-bold text-sm flex items-center gap-2 hover:bg-zinc-200 transition-colors"
          >
            <Plus className="w-4 h-4" />
            Session ...
            <ChevronDown className="w-4 h-4 ml-1" />
          </button>
          
          <div className="relative">
            <button 
              onClick={() => setShowStopwatch(!showStopwatch)}
              className={`h-10 px-4 rounded-xl font-bold text-sm flex items-center gap-2 transition-colors shadow-lg ${stopwatch.isActive ? 'bg-brand-success hover:bg-brand-success-hover text-white shadow-brand-success/20' : 'bg-[#1c2331] text-white hover:bg-[#262f40] border border-white/10'}`}
            >
              <Timer className="w-4 h-4" />
              Stopwatch
              {(stopwatch.isActive || displaySeconds > 0) && <span className="ml-1 font-mono">{formatTime(displaySeconds)}</span>}
              <ChevronDown className="w-4 h-4 ml-1" />
            </button>
            
            {showStopwatch && (
              <div className="absolute top-full mt-2 right-0 w-72 bg-[#1c2331] rounded-3xl border border-white/10 shadow-2xl p-6 z-50 flex flex-col items-center">
                
                <div className="text-4xl font-extrabold text-white font-mono tracking-tight mb-6">
                  {formatTime(displaySeconds)}
                </div>

                <div className="flex gap-4 w-full mb-6">
                  <button 
                    onClick={handleStartPause}
                    className={`flex-1 py-3 rounded-full font-bold flex items-center justify-center gap-2 transition-colors ${stopwatch.isActive ? 'bg-[#374151] hover:bg-[#4b5563] text-white' : 'bg-brand-success hover:bg-[#12a150] text-white'}`}
                  >
                    {stopwatch.isActive ? <><Pause className="w-4 h-4 fill-current" /> Pause</> : <><Play className="w-4 h-4 fill-current ml-1" /> Start</>}
                  </button>
                  <button 
                    onClick={handleReset}
                    className="w-12 h-12 rounded-full bg-[#262f40] border border-white/5 flex items-center justify-center text-zinc-400 hover:text-white hover:bg-[#374151] transition-colors shrink-0"
                    title="Reset"
                  >
                    <RotateCcw className="w-4 h-4" />
                  </button>
                </div>

                <div className="w-full">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Laps</span>
                    <button 
                      onClick={handleLap}
                      disabled={!stopwatch.isActive}
                      className="text-xs font-bold text-brand-primary hover:text-brand-primary-hover disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1"
                    >
                      <Flag className="w-3 h-3" /> Lap
                    </button>
                  </div>
                  
                  <div className="max-h-32 overflow-y-auto space-y-1 pr-1">
                    {stopwatch.laps.length === 0 ? (
                      <div className="text-xs text-zinc-500 text-center py-2">No laps recorded</div>
                    ) : (
                      stopwatch.laps.slice().reverse().map((lapMs, i) => {
                        const index = stopwatch.laps.length - i;
                        const prevLapMs = index > 1 ? stopwatch.laps[index - 2] : 0;
                        const diffMs = lapMs - prevLapMs;
                        
                        return (
                          <div key={index} className="flex justify-between items-center p-2 rounded-lg bg-[#262f40] border border-white/5">
                            <span className="text-xs font-bold text-zinc-400">Lap {index}</span>
                            <div className="flex gap-3 text-xs font-mono">
                              <span className="text-zinc-500">+{formatMs(diffMs)}</span>
                              <span className="text-white font-bold">{formatMs(lapMs)}</span>
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>
                
              </div>
            )}
          </div>
        </div>
      </header>
    </>
  );
}
