"use client";

import React, { useState, useEffect } from "react";
import { Topbar } from "@/components/layout/Topbar";
import { Card, CardHeader } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { Clock, Calendar as CalendarIcon, Edit3, Trash2, X, Activity, Target as TargetIcon, Coffee, Play, Square, Pause } from "lucide-react";
import { useStore, type Session } from "@/store/useStore";
import { formatDate } from "@/lib/formatters";
import { BarChart, Bar, XAxis, YAxis, Tooltip as RechartsTooltip, ResponsiveContainer, Cell, ReferenceLine } from "recharts";
import confetti from 'canvas-confetti';

export default function Sessions() {
  const { sessions, courses, deleteSession, startSession, preferences, currentSessionStatus, getCurrentSessionElapsed, activeSessionId, stats, pauseSession, resumeSession, stopSession, justCompletedSessionId, clearJustCompletedSession } = useStore();
  
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [selectedSessionId, setSelectedSessionId] = useState<string | null>(null);
  const [currentSessionElapsed, setCurrentSessionElapsed] = useState(0);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (activeSessionId && (currentSessionStatus === 'studying' || currentSessionStatus === 'paused')) {
      setCurrentSessionElapsed(getCurrentSessionElapsed());
      interval = setInterval(() => {
        setCurrentSessionElapsed(getCurrentSessionElapsed());
      }, 1000);
    } else {
      setCurrentSessionElapsed(0);
    }
    return () => clearInterval(interval);
  }, [activeSessionId, currentSessionStatus, getCurrentSessionElapsed]);

  useEffect(() => {
    if (justCompletedSessionId) {
      const duration = 3 * 1000;
      const animationEnd = Date.now() + duration;
      const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 100 };

      const randomInRange = (min: number, max: number) => Math.random() * (max - min) + min;

      const interval: any = setInterval(function() {
        const timeLeft = animationEnd - Date.now();

        if (timeLeft <= 0) {
          return clearInterval(interval);
        }

        const particleCount = 50 * (timeLeft / duration);
        confetti(Object.assign({}, defaults, { particleCount, origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 } }));
        confetti(Object.assign({}, defaults, { particleCount, origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 } }));
      }, 250);
    }
  }, [justCompletedSessionId]);

  // Form State
  const [course, setCourse] = useState("");
  const [type, setType] = useState<"study" | "idle">("study");
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");
  const [notes, setNotes] = useState("");

  useEffect(() => {
    if (isCreateModalOpen) {
      const now = new Date();
      setStartTime(`${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`);
      setCourse(courses[0]?.id || "");
    }
  }, [isCreateModalOpen, courses]);

  const handleStartSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!course) return;
    
    const now = new Date();
    const startTimeStr = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
    
    startSession(course, startTimeStr, endTime || undefined);
    setIsCreateModalOpen(false);
  };

  const getCourse = (cId: string) => courses.find(c => c.id === cId);

  const selectedSession = sessions.find(s => s.id === selectedSessionId);

  let liveIdleSeconds = 0;
  let liveBreaksCount = 0;
  const activeSession = sessions.find(s => s.id === activeSessionId);
  if (activeSession) {
    liveBreaksCount = activeSession.breaks?.length || 0;
    activeSession.breaks?.forEach(b => {
      if (b.endTime) {
        liveIdleSeconds += Math.floor((new Date(b.endTime).getTime() - new Date(b.startTime).getTime()) / 1000);
      } else {
        liveIdleSeconds += Math.floor((new Date().getTime() - new Date(b.startTime).getTime()) / 1000);
      }
    });
  }
  const liveStudySeconds = Math.max(0, currentSessionElapsed - liveIdleSeconds);

  return (
    <>
      <Topbar title="Sessions" subtitle="25/04/26 • 2NDCODE 2026" />
      
      <div className="p-8 flex-1 overflow-y-auto max-w-5xl mx-auto w-full">

         {/* Daily Progress Line */}
         <div className="bg-brand-card p-6 rounded-3xl border border-white/5 shadow-xl mb-8">
           <div className="flex justify-between items-center mb-3">
             <h3 className="font-bold text-white text-lg">Today's Progress</h3>
             <span className="text-sm font-bold text-zinc-400">
               {stats.todayStudyMinutes + (currentSessionStatus === 'studying' ? Math.floor(currentSessionElapsed / 60) : 0)}m Study / 
               {stats.todayIdleMinutes + (currentSessionStatus === 'paused' ? Math.floor(currentSessionElapsed / 60) : 0)}m Idle
             </span>
           </div>
           <div className="h-3 w-full bg-brand-surface rounded-full overflow-hidden flex">
             <div 
               className="h-full bg-[#17c964] transition-all" 
               style={{ width: `${Math.min(100, ((stats.todayStudyMinutes + (currentSessionStatus === 'studying' ? Math.floor(currentSessionElapsed / 60) : 0)) / stats.todayGoalMinutes) * 100)}%` }} 
             />
             <div 
               className="h-full bg-[#f5a524] transition-all" 
               style={{ width: `${Math.min(100, ((stats.todayIdleMinutes + (currentSessionStatus === 'paused' ? Math.floor(currentSessionElapsed / 60) : 0)) / stats.todayGoalMinutes) * 100)}%` }} 
             />
           </div>
           <div className="flex justify-between mt-2 text-xs text-zinc-500 font-bold">
             <span>0h</span>
             <span>Goal: {stats.todayGoalMinutes / 60}h</span>
           </div>
         </div>

         {/* Active Session Live Counter */}
         {activeSessionId && (
           <div className="mb-8">
             <Card className={`p-6 border relative overflow-hidden shadow-2xl transition-colors ${currentSessionStatus === 'paused' ? 'border-[#f34645]/50 bg-[#f34645]/5' : 'border-brand-primary/50 bg-brand-primary/5'}`}>
               <div className="absolute top-0 right-0 p-6">
                 <div className="flex items-center gap-2">
                   <span className="relative flex h-3 w-3">
                     <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${currentSessionStatus === 'studying' ? 'bg-[#17c964]' : 'bg-[#f5a524]'}`}></span>
                     <span className={`relative inline-flex rounded-full h-3 w-3 ${currentSessionStatus === 'studying' ? 'bg-[#17c964]' : 'bg-[#f5a524]'}`}></span>
                   </span>
                   <span className="text-xs font-bold text-white uppercase tracking-wider">{currentSessionStatus === 'studying' ? 'Studying' : 'Paused (Idle)'}</span>
                 </div>
               </div>
               
               <div className="flex justify-between items-end mb-4">
                 <div>
                   <div className="text-sm font-bold text-zinc-400 mb-1 uppercase tracking-wider">Live Session</div>
                   <div className="text-6xl font-black text-[#f34645] font-mono tracking-tighter">
                     {String(Math.floor(currentSessionElapsed / 60)).padStart(2, '0')}:
                     {String(currentSessionElapsed % 60).padStart(2, '0')}
                   </div>
                 </div>
                 <div className="text-right">
                   <div className="text-xs text-zinc-400 font-bold uppercase tracking-wider mb-1">Breaks</div>
                   <div className="text-3xl font-black text-white">{liveBreaksCount}</div>
                 </div>
               </div>

               {/* Live Study/Idle Progress Bar */}
               <div className="w-full mb-6">
                 <div className="flex justify-between text-xs font-bold mb-1.5">
                   <span className="text-[#17c964]">{Math.floor(liveStudySeconds / 60)}m Study</span>
                   <span className="text-[#f5a524]">{Math.floor(liveIdleSeconds / 60)}m Idle</span>
                 </div>
                 <div className="h-2 w-full bg-black/20 rounded-full overflow-hidden flex">
                   <div className="h-full bg-[#17c964] transition-all" style={{ width: `${Math.min(100, Math.max(0, (liveStudySeconds / (currentSessionElapsed || 1)) * 100))}%` }} />
                   <div className="h-full bg-[#f5a524] transition-all" style={{ width: `${Math.min(100, Math.max(0, (liveIdleSeconds / (currentSessionElapsed || 1)) * 100))}%` }} />
                 </div>
               </div>
               
               <div className="flex gap-4">
                 {currentSessionStatus === 'studying' ? (
                   <button onClick={pauseSession} className="bg-[#f5a524] hover:bg-[#e59514] text-black px-8 py-3 rounded-xl font-bold transition-colors">Break</button>
                 ) : (
                   <button onClick={resumeSession} className="bg-[#17c964] hover:bg-[#15b058] text-black px-8 py-3 rounded-xl font-bold transition-colors">Resume</button>
                 )}
                 <button onClick={stopSession} className="bg-[#f34645] hover:bg-[#d83c3b] text-white px-8 py-3 rounded-xl font-bold transition-colors">End</button>
               </div>
             </Card>
           </div>
         )}
         <div className="flex justify-between items-center mb-6">
            <h3 className="font-bold text-white text-lg">Completed Today</h3>
            <button 
              onClick={() => setIsCreateModalOpen(true)}
              className="bg-brand-primary hover:bg-brand-primary-hover text-white px-5 py-2.5 rounded-xl font-bold transition-colors shadow-lg"
            >
              + Add Session
            </button>
         </div>

         {sessions.filter(s => s.date === new Date().toISOString().split('T')[0] && s.status === 'completed').length === 0 ? (
          <Card className="flex-1 flex flex-col items-center justify-center min-h-[300px]">
            <EmptyState 
              title="No sessions completed today"
              description="Start a new session to track your activity."
              icon={<div className="text-6xl mb-4">📚</div>}
            />
          </Card>
        ) : (
           <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
             {sessions.filter(s => s.date === new Date().toISOString().split('T')[0] && s.status === 'completed').map(session => {
               const c = getCourse(session.courseId);
               return (
                 <Card 
                   key={session.id} 
                   className="p-5 flex flex-col hover:bg-brand-surface/30 transition-colors cursor-pointer group relative overflow-hidden"
                   onClick={() => setSelectedSessionId(session.id)}
                 >
                   <div className="flex justify-between items-start mb-4">
                     <span 
                        className="text-[32px] font-black leading-none truncate pr-4"
                        style={{ color: c?.color || '#3b82f6' }}
                      >
                        {c?.name || 'Unknown'}
                      </span>
                     <div className="flex items-center gap-2">
                       <span className="text-[32px] font-black text-[#17c964] leading-none">
                         {session.productivityPercent}%
                       </span>
                     </div>
                   </div>
                   
                   <div className="text-xl font-extrabold text-white mb-1">
                     {session.startTime} → {session.endTime}
                   </div>
                   <div className="text-sm text-zinc-400 mb-4">{formatDate(session.date, preferences)}</div>
                   
                    <div className="flex flex-col gap-3 border-t border-white/5 pt-4">
                      <div className="flex justify-between text-xs">
                        <div>
                          <div className="text-zinc-500 mb-0.5">Duration</div>
                          <div className="text-white font-bold">{session.totalDurationMinutes}m</div>
                        </div>
                        <div className="text-right">
                          <div className="text-zinc-500 mb-0.5">Breaks</div>
                          <div className="text-[#f34645] font-bold">{session.numberOfBreaks}</div>
                        </div>
                      </div>
                      <div className="w-full">
                        <div className="flex justify-between text-[10px] text-zinc-500 mb-1 font-bold">
                          <span>{session.studyMinutes}m Study</span>
                          <span>{session.idleMinutes}m Idle</span>
                        </div>
                        <div className="h-1.5 w-full bg-brand-surface rounded-full overflow-hidden flex">
                          <div className="h-full bg-[#17c964] transition-all" style={{ width: `${Math.min(100, Math.max(0, (session.studyMinutes / (session.totalDurationMinutes || 1)) * 100))}%` }} />
                          <div className="h-full bg-[#f5a524] transition-all" style={{ width: `${Math.min(100, Math.max(0, (session.idleMinutes / (session.totalDurationMinutes || 1)) * 100))}%` }} />
                        </div>
                      </div>
                    </div>

                   <button 
                     onClick={(e) => { e.stopPropagation(); deleteSession(session.id); }}
                     className="absolute top-4 right-4 text-zinc-500 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity p-1 bg-brand-surface rounded-md"
                   >
                     <Trash2 className="w-4 h-4" />
                   </button>
                 </Card>
               );
             })}
          </div>
        )}
      </div>

      {/* Create Session Modal */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#141a27] border border-white/10 rounded-3xl w-full max-w-md shadow-2xl flex flex-col overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="flex justify-between items-center p-6 border-b border-white/5 bg-white/[0.02]">
              <h2 className="text-xl font-bold text-white tracking-tight">Start New Session</h2>
              <button onClick={() => setIsCreateModalOpen(false)} className="text-zinc-400 hover:text-white transition-colors bg-white/5 hover:bg-white/10 p-2 rounded-full">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <form onSubmit={handleStartSubmit} className="p-6 space-y-5">
              <div>
                <label className="block text-xs font-bold text-zinc-400 uppercase tracking-wider mb-2">Course</label>
                <select value={course} onChange={(e) => setCourse(e.target.value)} required className="bg-[#1c2331] rounded-xl px-4 py-3 border border-white/5 w-full text-white font-medium outline-none appearance-none focus:border-brand-primary transition-colors">
                  <option value="" disabled>Select course...</option>
                  {courses.map(c => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-zinc-400 uppercase tracking-wider mb-2">Start Time</label>
                  <div className="flex items-center bg-[#1c2331]/50 rounded-xl px-4 py-3 border border-white/5 cursor-not-allowed">
                    <Clock className="w-4 h-4 text-zinc-600 mr-2" />
                    <span className="text-zinc-500 font-medium w-full text-sm">Right now</span>
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-bold text-zinc-400 uppercase tracking-wider mb-2">End Time (Optional)</label>
                  <div className="flex items-center bg-[#1c2331] rounded-xl px-4 py-3 border border-white/5 focus-within:border-brand-primary transition-colors">
                    <Clock className="w-4 h-4 text-zinc-500 mr-2" />
                    <input type="time" value={endTime} onChange={(e) => setEndTime(e.target.value)} className="bg-transparent text-white font-medium w-full outline-none text-sm" />
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-zinc-400 uppercase tracking-wider mb-2">Notes</label>
                <div className="flex bg-[#1c2331] rounded-xl px-4 py-3 border border-white/5 focus-within:border-brand-primary transition-colors">
                  <Edit3 className="w-4 h-4 text-zinc-500 mr-2 mt-0.5" />
                  <textarea rows={2} value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Add notes here..." className="bg-transparent text-white font-medium w-full outline-none text-sm resize-none"></textarea>
                </div>
              </div>

              <button type="submit" className="w-full bg-brand-primary hover:bg-brand-primary-hover text-white font-bold py-4 rounded-xl transition-colors shadow-lg shadow-brand-primary/20 mt-4 text-lg">
                Start Session
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Session Detail Modal */}
      {selectedSessionId && selectedSession && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-brand-bg border border-white/10 rounded-3xl w-full max-w-3xl max-h-[90vh] overflow-y-auto shadow-2xl flex flex-col animate-in fade-in zoom-in duration-200">
            <div className="flex justify-between items-center p-6 border-b border-white/5 bg-white/[0.02] sticky top-0 z-10 backdrop-blur-md">
              <div className="flex items-center gap-4">
                 <span 
                   className="px-3 py-1.5 rounded-lg text-sm font-bold shadow-sm"
                   style={{ backgroundColor: getCourse(selectedSession.courseId)?.color || '#17c964', color: '#000' }}
                 >
                   {getCourse(selectedSession.courseId)?.name || 'Unknown'}
                 </span>
                 <h2 className="text-xl font-bold text-white tracking-tight">Session Details</h2>
              </div>
              <button onClick={() => setSelectedSessionId(null)} className="text-zinc-400 hover:text-white transition-colors bg-white/5 hover:bg-white/10 p-2 rounded-full">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="p-8 space-y-8">
               {/* Summary Row */}
               <div className="grid grid-cols-5 gap-4">
                  <div className="bg-brand-card p-4 rounded-2xl border border-white/5 flex flex-col justify-center items-center text-center">
                    <span className="text-xs text-zinc-400 mb-1">Duration</span>
                    <span className="text-xl font-bold text-white">{selectedSession.totalDurationMinutes}m</span>
                  </div>
                  <div className="bg-brand-card p-4 rounded-2xl border border-white/5 flex flex-col justify-center items-center text-center">
                    <span className="text-xs text-zinc-400 mb-1">Study Time</span>
                    <span className="text-xl font-bold text-brand-success">{selectedSession.studyMinutes}m</span>
                  </div>
                  <div className="bg-brand-card p-4 rounded-2xl border border-white/5 flex flex-col justify-center items-center text-center">
                    <span className="text-xs text-zinc-400 mb-1">Idle Time</span>
                    <span className="text-xl font-bold text-[#f5a524]">{selectedSession.idleMinutes}m</span>
                  </div>
                  <div className="bg-brand-card p-4 rounded-2xl border border-white/5 flex flex-col justify-center items-center text-center">
                    <span className="text-xs text-zinc-400 mb-1">Breaks</span>
                    <span className="text-xl font-bold text-white">{selectedSession.numberOfBreaks}</span>
                  </div>
                  <div className="bg-brand-card p-4 rounded-2xl border border-white/5 flex flex-col justify-center items-center text-center">
                    <span className="text-xs text-zinc-400 mb-1">Productivity</span>
                    <span className="text-xl font-bold text-brand-primary">{selectedSession.productivityPercent}%</span>
                  </div>
               </div>

               <div className="grid grid-cols-2 gap-8">
                 {/* Prod vs Idle Chart */}
                 <div className="bg-brand-card p-6 rounded-3xl border border-white/5">
                    <h3 className="text-sm font-bold text-white mb-6 flex items-center gap-2"><Activity className="w-4 h-4 text-zinc-400" /> Productive vs Idle Time</h3>
                    <div className="h-[200px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={[{ name: 'Time', study: selectedSession.studyMinutes, idle: selectedSession.idleMinutes }]} layout="vertical" stackOffset="expand">
                          <XAxis type="number" hide />
                          <YAxis type="category" dataKey="name" hide />
                          <RechartsTooltip cursor={{fill: 'transparent'}} contentStyle={{ backgroundColor: '#141a27', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px' }} />
                          <Bar dataKey="study" stackId="a" fill="#17c964" radius={[4, 0, 0, 4]} />
                          <Bar dataKey="idle" stackId="a" fill="#f5a524" radius={[0, 4, 4, 0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                 </div>

                 {/* Goal Completion */}
                 <div className="bg-brand-card p-6 rounded-3xl border border-white/5">
                    <h3 className="text-sm font-bold text-white mb-6 flex items-center gap-2"><TargetIcon className="w-4 h-4 text-zinc-400" /> Goal Completion</h3>
                    <div className="h-[200px] flex flex-col justify-center">
                       <div className="text-3xl font-extrabold text-white text-center mb-2">{selectedSession.goalCompletionPercent}%</div>
                       <div className="text-sm text-zinc-400 text-center mb-6">{selectedSession.studyMinutes}m studied / {selectedSession.goalMinutes}m goal</div>
                       <ProgressBar 
                         value={selectedSession.goalCompletionPercent} 
                         colorClass={selectedSession.goalCompletionPercent >= 100 ? "bg-brand-success" : selectedSession.goalCompletionPercent >= 50 ? "bg-[#f5a524]" : "bg-[#f34645]"} 
                       />
                    </div>
                 </div>
               </div>

               {/* Breaks Timeline */}
               <div className="bg-brand-card p-6 rounded-3xl border border-white/5">
                  <h3 className="text-sm font-bold text-white mb-6 flex items-center gap-2"><Coffee className="w-4 h-4 text-zinc-400" /> Breaks Timeline</h3>
                  <div className="space-y-4">
                     <div className="flex justify-between items-center bg-[#1c2331] p-4 rounded-xl border border-white/5">
                       <div className="flex items-center gap-4">
                         <div className="w-10 h-10 rounded-full bg-brand-success/20 flex items-center justify-center text-brand-success">
                           <Play className="w-4 h-4 fill-current" />
                         </div>
                         <div>
                           <div className="font-bold text-white">Session Started</div>
                           <div className="text-xs text-zinc-400">{selectedSession.startTime}</div>
                         </div>
                       </div>
                     </div>
                     
                     {selectedSession.breaks?.map((b, i) => (
                       <div key={i} className="flex justify-between items-center bg-[#1c2331] p-4 rounded-xl border border-white/5 ml-8 relative before:content-[''] before:absolute before:-left-4 before:top-1/2 before:w-4 before:h-px before:bg-white/10 border-l-2 border-l-[#f5a524]">
                         <div className="flex items-center gap-4">
                           <div className="w-8 h-8 rounded-full bg-[#f5a524]/20 flex items-center justify-center text-[#f5a524]">
                             <Coffee className="w-3 h-3" />
                           </div>
                           <div>
                             <div className="font-bold text-white">Break {i + 1}</div>
                             <div className="text-xs text-zinc-400">{b.durationMinutes} minutes</div>
                           </div>
                         </div>
                         <div className="text-xs font-mono text-zinc-500">
                           {b.startTime.split('T')[1].substring(0,5)} → {b.endTime ? b.endTime.split('T')[1].substring(0,5) : 'Ongoing'}
                         </div>
                       </div>
                     ))}
                     
                     <div className="flex justify-between items-center bg-[#1c2331] p-4 rounded-xl border border-white/5">
                       <div className="flex items-center gap-4">
                         <div className="w-10 h-10 rounded-full bg-brand-primary/20 flex items-center justify-center text-brand-primary">
                           <Square className="w-4 h-4 fill-current" />
                         </div>
                         <div>
                           <div className="font-bold text-white">Session Completed</div>
                           <div className="text-xs text-zinc-400">{selectedSession.endTime}</div>
                         </div>
                       </div>
                       <div className="text-sm font-bold text-white">Total: {selectedSession.totalDurationMinutes}m</div>
                     </div>
                  </div>
               </div>

            </div>
          </div>
        </div>
      )}

      {/* Celebration Modal */}
      {justCompletedSessionId && (
        <div className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-[#141a27] border border-white/10 rounded-3xl w-full max-w-md shadow-[0_0_50px_rgba(23,201,100,0.2)] flex flex-col items-center text-center p-8 animate-in zoom-in-95 fade-in duration-300">
            <div className="w-20 h-20 bg-[#17c964]/20 rounded-full flex items-center justify-center mb-6">
              <span className="text-4xl">🎉</span>
            </div>
            <h2 className="text-2xl font-black text-white mb-3">Session Done & Dusted!</h2>
            <p className="text-zinc-300 text-lg mb-8 leading-relaxed font-medium">
              Yeah session is done and dusted, go for 5 min walk, champ!
            </p>
            <button 
              onClick={clearJustCompletedSession}
              className="w-full bg-[#17c964] hover:bg-[#15b058] text-black text-lg py-4 rounded-xl font-bold transition-all shadow-lg hover:shadow-xl hover:scale-[1.02] active:scale-95"
            >
              Got it!
            </button>
          </div>
        </div>
      )}

    </>
  );
}
