"use client";

import React, { useState } from "react";
import { Topbar } from "@/components/layout/Topbar";
import { Card } from "@/components/ui/Card";
import { HelpCircle, Info } from "lucide-react";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { useStore, Target } from "@/store/useStore";
import { useRouter } from "next/navigation";

export default function TargetConfig() {
  const { targets, activeTargetId, addTarget, setActiveTarget, deleteTarget, sessions, courses, hasTarget } = useStore();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const router = useRouter();

  // Form state
  const [name, setName] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [weekdayGoal, setWeekdayGoal] = useState<number | "">("");
  const [weekendGoal, setWeekendGoal] = useState<number | "">("");

  const handleCreate = () => {
    if (!name || !startDate || !endDate || weekdayGoal === "" || weekendGoal === "") return;
    
    const newTarget: Target = {
      id: Date.now().toString(),
      name,
      startDate,
      endDate,
      weekdayGoalMinutes: Number(weekdayGoal),
      weekendGoalMinutes: Number(weekendGoal),
      status: 'active', // handled mostly by addTarget
      createdAt: new Date().toISOString()
    };

    addTarget(newTarget);
    setIsModalOpen(false);
    
    // Reset form
    setName("");
    setStartDate("");
    setEndDate("");
    setWeekdayGoal("");
    setWeekendGoal("");

    // After target created → force go to /courses
    router.push("/courses");
  };

  const calculateTargetStats = (target: Target) => {
    const start = new Date(target.startDate);
    const end = new Date(target.endDate);
    const now = new Date();
    
    let targetTotalDays = Math.max(1, Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)));
    let daysPassed = Math.max(0, Math.ceil((now.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)));
    if (daysPassed > targetTotalDays) daysPassed = targetTotalDays;

    let goalMinutes = 0;
    let curr = new Date(start);
    while (curr <= end) {
      const day = curr.getDay();
      if (day === 0 || day === 6) goalMinutes += target.weekendGoalMinutes;
      else goalMinutes += target.weekdayGoalMinutes;
      curr.setDate(curr.getDate() + 1);
    }
    const goalHours = goalMinutes / 60;

    const targetSessions = sessions.filter(s => s.date >= target.startDate && s.date <= target.endDate);
    const studiedHours = targetSessions.reduce((acc, s) => acc + s.studyMinutes, 0) / 60;
    
    const progress = goalHours > 0 ? Math.min(100, Math.round((studiedHours / goalHours) * 100)) : 0;
    
    let status = "Active";
    if (now < start) status = "Starts " + target.startDate; // simplified
    else if (now > end) status = "Ended";

    return { goalHours, studiedHours, sessionCount: targetSessions.length, progress, status };
  };

  return (
    <>
      <Topbar title="Target Configuration" subtitle="25/04/26 • 2NDCODE 2026" />
      
      <div className="p-8 flex flex-col gap-8 flex-1 overflow-y-auto max-w-5xl mx-auto w-full relative">
        
        {!hasTarget && (
          <div className="bg-brand-primary/20 border border-brand-primary text-white p-4 rounded-xl flex items-center gap-3">
            <span className="text-xl">👋</span>
            <span className="font-bold">Welcome! Please set your study target to get started.</span>
          </div>
        )}

        {/* Target Management */}
        <Card className="grid grid-cols-1 md:grid-cols-[1fr_2fr] gap-8 bg-brand-card/50">
           <div>
             <h3 className="font-bold text-white text-lg mb-2">Target management</h3>
             <p className="text-sm text-zinc-400 mb-6">
               Create new targets, or switch to previous targets.
             </p>
             <button 
               onClick={() => setIsModalOpen(true)}
               className="bg-white text-brand-bg hover:bg-zinc-200 px-6 py-2.5 rounded-xl font-bold text-sm transition-colors flex items-center gap-2 shadow-md"
             >
               + Create new target ...
             </button>
           </div>
           
           <div className="space-y-4">
             {targets.length === 0 ? (
               <div className="text-zinc-500 text-sm border-2 border-dashed border-white/10 rounded-2xl p-8 text-center h-full flex items-center justify-center">
                 No targets configured. Please create one to start tracking.
               </div>
             ) : (
               targets.map(target => {
                 const isActive = target.status === 'active';
                 const isUpcoming = target.status === 'upcoming';
                 const isCompleted = target.status === 'completed';
                 const stats = calculateTargetStats(target);
                 
                 return (
                   <div key={target.id} className={`border-2 rounded-2xl p-6 transition-colors ${isActive ? 'border-brand-primary bg-brand-card' : 'border-white/5 bg-brand-surface/30'}`}>
                      <div className="flex justify-between items-start mb-4">
                         <div className="flex items-center gap-3">
                           <button 
                             onClick={() => setActiveTarget(target.id)}
                             className={`w-5 h-5 rounded-full border-[2px] flex items-center justify-center ${isActive ? 'border-brand-primary' : 'border-zinc-500'}`}
                           >
                             {isActive && <div className="w-2.5 h-2.5 rounded-full bg-brand-primary"></div>}
                           </button>
                           <span className="font-bold text-white text-lg">{target.name}</span>
                           <span className="text-xs text-zinc-500">• {stats.status}</span>
                         </div>
                         <div className="flex items-center gap-2">
                           {!isCompleted && (
                             <button 
                               onClick={() => {
                                 if (confirm("Are you sure you want to end this target early? All progress will be saved but the target will be marked as completed.")) {
                                   useStore.getState().endTargetEarly(target.id);
                                 }
                               }} 
                               className="text-zinc-500 hover:text-red-400 text-xs font-medium"
                             >
                               End early
                             </button>
                           )}
                           <button 
                             onClick={() => {
                               if (confirm("Are you sure you want to permanently delete this target? All goal data associated with it will be lost.")) {
                                 deleteTarget(target.id);
                               }
                             }}
                             className="text-zinc-500 hover:text-red-400 text-xs font-medium ml-2"
                           >
                             Delete
                           </button>
                         </div>
                      </div>
                      
                      <div className="flex gap-6 text-sm text-zinc-400 mb-6 border-b border-white/5 pb-6">
                         <div className="flex items-center gap-2">
                           <span>↔</span> {target.startDate} – {target.endDate}
                         </div>
                         <div className="flex items-center gap-2">
                           <span>🏛️</span> {courses.length} courses
                         </div>
                         <div className="flex items-center gap-2">
                           <span>🚩</span> 0 exams
                         </div>
                      </div>

                      <div className="flex justify-between mb-4">
                        <div className="text-center">
                          <div className="text-xs text-zinc-400 mb-1">Study time</div>
                          <div className="font-bold text-white">{stats.studiedHours > 0 ? `${Math.floor(stats.studiedHours)}h ${Math.round((stats.studiedHours % 1) * 60)}m` : '—'}</div>
                        </div>
                        <div className="text-center">
                          <div className="text-xs text-zinc-400 mb-1">Goal</div>
                          <div className="text-2xl font-extrabold text-white">{stats.goalHours > 0 ? `${Math.floor(stats.goalHours)}h ${Math.round((stats.goalHours % 1) * 60)}m` : '—'}</div>
                        </div>
                        <div className="text-center">
                          <div className="text-xs text-zinc-400 mb-1">Sessions</div>
                          <div className="font-bold text-white">{stats.sessionCount > 0 ? stats.sessionCount : '—'}</div>
                        </div>
                      </div>
                      
                      <div>
                         <ProgressBar value={stats.progress} />
                         <div className="text-right text-xs font-bold text-white mt-1">{stats.progress}%</div>
                      </div>
                   </div>
                 );
               })
             )}
           </div>
        </Card>

      </div>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop */}
          <div className="absolute inset-0 bg-[#0f172a]/80 backdrop-blur-sm" onClick={() => setIsModalOpen(false)}></div>
          
          <div className="bg-[#1c2331] rounded-2xl shadow-2xl border border-white/10 w-full max-w-2xl relative z-10 flex flex-col p-8">
            <h2 className="text-xl font-bold text-white mb-6">Create new target</h2>
            
            <div className="space-y-6">
              {/* Name */}
              <div>
                <div className="bg-brand-surface border border-brand-primary rounded-xl overflow-hidden shadow-[0_0_0_1px_rgba(0,111,238,1)]">
                  <div className="px-4 pt-2 pb-0.5 text-[10px] font-bold text-white">Name *</div>
                  <input 
                    type="text" 
                    value={name}
                    onChange={e => setName(e.target.value)}
                    placeholder="E.g., Fall Term 2025" 
                    className="w-full bg-transparent px-4 pb-2 text-sm text-white placeholder-zinc-500 focus:outline-none"
                  />
                </div>
              </div>

              {/* Dates */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <div className="bg-brand-surface border border-white/10 rounded-xl overflow-hidden focus-within:border-brand-primary focus-within:shadow-[0_0_0_1px_rgba(0,111,238,1)]">
                    <div className="px-4 pt-2 pb-0.5 text-[10px] font-bold text-white">Start *</div>
                    <input 
                      type="date" 
                      value={startDate}
                      onChange={e => setStartDate(e.target.value)}
                      className="w-full bg-transparent px-4 pb-2 text-sm text-white placeholder-zinc-500 focus:outline-none"
                    />
                  </div>
                  <div className="text-[11px] text-zinc-400 mt-1.5 px-1">Can be changed again later</div>
                </div>
                <div>
                  <div className="bg-brand-surface border border-white/10 rounded-xl overflow-hidden focus-within:border-brand-primary focus-within:shadow-[0_0_0_1px_rgba(0,111,238,1)]">
                    <div className="px-4 pt-2 pb-0.5 text-[10px] font-bold text-white">End *</div>
                    <input 
                      type="date" 
                      value={endDate}
                      onChange={e => setEndDate(e.target.value)}
                      className="w-full bg-transparent px-4 pb-2 text-sm text-white placeholder-zinc-500 focus:outline-none"
                    />
                  </div>
                  <div className="text-[11px] text-zinc-400 mt-1.5 px-1">Can be changed again later</div>
                </div>
              </div>

              {/* Goals */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <div className="flex bg-brand-surface border border-white/10 rounded-xl overflow-hidden focus-within:border-brand-primary focus-within:shadow-[0_0_0_1px_rgba(0,111,238,1)]">
                    <div className="flex-1">
                      <div className="px-4 pt-2 pb-0.5 text-[10px] font-bold text-white">Weekday study goal *</div>
                      <input 
                        type="number" 
                        value={weekdayGoal}
                        onChange={e => setWeekdayGoal(e.target.value ? Number(e.target.value) : "")}
                        placeholder="Suggestion: 120 min" 
                        className="w-full bg-transparent px-4 pb-2 text-sm text-white placeholder-zinc-500 focus:outline-none"
                      />
                    </div>
                    <div className="bg-white/5 flex items-center px-4 text-sm font-medium text-white border-l border-white/5">min</div>
                  </div>
                  <div className="text-[11px] text-zinc-400 mt-1.5 px-1">Can later be changed individually for each day</div>
                </div>
                <div>
                  <div className="flex bg-brand-surface border border-white/10 rounded-xl overflow-hidden focus-within:border-brand-primary focus-within:shadow-[0_0_0_1px_rgba(0,111,238,1)]">
                    <div className="flex-1">
                      <div className="px-4 pt-2 pb-0.5 text-[10px] font-bold text-white">Daily study goal on weekends *</div>
                      <input 
                        type="number" 
                        value={weekendGoal}
                        onChange={e => setWeekendGoal(e.target.value ? Number(e.target.value) : "")}
                        placeholder="Suggestion: 0 min" 
                        className="w-full bg-transparent px-4 pb-2 text-sm text-white placeholder-zinc-500 focus:outline-none"
                      />
                    </div>
                    <div className="bg-white/5 flex items-center px-4 text-sm font-medium text-white border-l border-white/5">min</div>
                  </div>
                  <div className="text-[11px] text-zinc-400 mt-1.5 px-1">Can later be changed individually for each day</div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="grid grid-cols-2 gap-4 pt-4">
                <button 
                  onClick={() => setIsModalOpen(false)}
                  className="bg-brand-surface hover:bg-zinc-700 text-white py-3 rounded-xl font-bold transition-colors"
                >
                  Cancel
                </button>
                <button 
                  onClick={handleCreate}
                  disabled={!name || !startDate || !endDate || weekdayGoal === "" || weekendGoal === ""}
                  className="bg-brand-success hover:bg-[#15b259] text-white py-3 rounded-xl font-bold transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  ✓ Create ...
                </button>
              </div>

              {/* Note */}
              <div className="flex gap-4 mt-8">
                <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center shrink-0">
                  <Info className="w-5 h-5 text-brand-bg" />
                </div>
                <div>
                  <div className="font-bold text-white mb-1">Note</div>
                  <p className="text-sm text-zinc-400">
                    Switch between targets anytime in Settings. Sessions, daily goals, courses, and activities are stored separately for each target.
                  </p>
                </div>
              </div>

            </div>
          </div>
        </div>
      )}
    </>
  );
}
