"use client";

import React, { useState, useEffect } from "react";
import { Topbar } from "@/components/layout/Topbar";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { Tabs } from "@/components/ui/Tabs";
import { EmptyState } from "@/components/ui/EmptyState";
import { useStore } from "@/store/useStore";
import { useRouter } from "next/navigation";
import { formatNumber } from "@/lib/formatters";
import { Plus, Settings, BookOpen, Clock, Target, Calendar as CalendarIcon, Edit3, Trash2, ChevronRight, MoreHorizontal, ChevronDown, Check, X, HelpCircle } from "lucide-react";

export default function Courses() {
  const { courses, sessions, addCourse, editCourse, deleteCourse, hasTarget, targets, activeTargetId, courseNotes, updateCourseNote } = useStore();
  const router = useRouter();
  const [selectedCourseId, setSelectedCourseId] = useState<string>(courses[0]?.id || "");
  const [activeTab, setActiveTab] = useState("sessions");
  const [noteText, setNoteText] = useState("");

  useEffect(() => {
    const existingNote = useStore.getState().courseNotes?.find(n => n.courseId === selectedCourseId)?.note || "";
    setNoteText(existingNote);
  }, [selectedCourseId]);

  useEffect(() => {
    if (!selectedCourseId) return;
    const timeoutId = setTimeout(() => {
      const existingNote = useStore.getState().courseNotes?.find(n => n.courseId === selectedCourseId)?.note || "";
      if (existingNote !== noteText) {
        updateCourseNote(selectedCourseId, noteText);
      }
    }, 500);
    return () => clearTimeout(timeoutId);
  }, [noteText, selectedCourseId, updateCourseNote]);
  
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  React.useEffect(() => {
    if (!selectedCourseId && courses.length > 0) {
      setSelectedCourseId(courses[0].id);
    }
  }, [courses, selectedCourseId]);

  // Accordion State
  const [openSections, setOpenSections] = useState({ goals: true, pace: true, insights: true });
  const toggleSection = (sec: 'goals' | 'pace' | 'insights') => setOpenSections(prev => ({...prev, [sec]: !prev[sec]}));

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCourseId, setEditingCourseId] = useState<string | null>(null);
  const [modalTab, setModalTab] = useState("standard");
  const [newCourse, setNewCourse] = useState({
    name: "",
    color: "#8BB6D6", // updated brand default
    credits: "",
    goalHours: "",
    startDate: "target_start",
    endDate: "target_end"
  });

  const openCreateModal = () => {
    setEditingCourseId(null);
    setNewCourse({ name: "", color: "#8BB6D6", credits: "", goalHours: "", startDate: "target_start", endDate: "target_end" });
    setModalTab("standard");
    setIsModalOpen(true);
  };

  const openEditModal = () => {
    if (!selectedCourse) return;
    setEditingCourseId(selectedCourse.id);
    setNewCourse({
      name: selectedCourse.name,
      color: selectedCourse.color || "#8BB6D6",
      credits: selectedCourse.credits?.toString() || "",
      goalHours: selectedCourse.goalHours?.toString() || "",
      startDate: selectedCourse.startDate || "target_start",
      endDate: selectedCourse.endDate || "target_end"
    });
    setModalTab("standard");
    setIsModalOpen(true);
  };

  const selectedCourse = courses.find(c => c.id === selectedCourseId) || courses[0];
  const courseSessions = sessions.filter(s => s.courseId === selectedCourse?.id);
  const totalMinutes = courseSessions.reduce((acc, s) => acc + s.studyMinutes, 0);
  const completedHours = Math.floor(totalMinutes / 60);
  const courseGoal = selectedCourse?.goalHours || 0;
  const progressPercent = courseGoal > 0 ? Math.round((completedHours / courseGoal) * 100) : 0;

  // Compute actual dates for Insights
  const activeTarget = targets.find(t => t.id === activeTargetId);
  const actualStartDate = selectedCourse?.startDate === 'target_start' && activeTarget 
    ? activeTarget.startDate 
    : (selectedCourse?.startDate !== 'target_start' ? selectedCourse?.startDate : null);
  const actualEndDate = selectedCourse?.endDate === 'target_end' && activeTarget 
    ? activeTarget.endDate 
    : (selectedCourse?.endDate !== 'target_end' ? selectedCourse?.endDate : null);
  
  const formatDateStr = (dStr: string) => {
    if (!dStr) return '—';
    const d = new Date(dStr);
    return !isNaN(d.getTime()) ? `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth()+1).padStart(2, '0')}/${String(d.getFullYear()).slice(-2)}` : dStr;
  };

  let daysPassed = 0;
  let totalDays = 0;
  if (actualStartDate && actualEndDate) {
    const start = new Date(actualStartDate);
    const end = new Date(actualEndDate);
    const now = new Date();
    totalDays = Math.max(1, Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)));
    daysPassed = Math.max(0, Math.ceil((now.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)));
    if (daysPassed > totalDays) daysPassed = totalDays;
  }

  const handleSaveCourse = () => {
    if (!newCourse.name) return;
    
    const courseData = {
      name: newCourse.name,
      goalHours: Number(newCourse.goalHours) || 0,
      color: newCourse.color,
      credits: Number(newCourse.credits) || 0,
      startDate: newCourse.startDate,
      endDate: newCourse.endDate
    };

    if (editingCourseId) {
      editCourse(editingCourseId, courseData);
    } else {
      const newId = Math.random().toString(36).substring(2, 9);
      addCourse({
        id: newId,
        ...courseData
      });
      setSelectedCourseId(newId);
    }
    
    setIsModalOpen(false);
  };

  const getTextColorForBg = (hexColor: string) => {
    // Simple heuristic for dark/light text on badge
    return "#ffffff";
  };

  return (
    <>
      <Topbar title="Courses" subtitle="25/04/26 • 2NDCODE 2026" />
      
      <div className="p-8 grid grid-cols-1 md:grid-cols-[340px_1fr] gap-8 flex-1 overflow-y-auto items-start">
        
        {/* Onboarding Banner */}
        {hasTarget && courses.length === 0 && (
          <div className="col-span-full bg-brand-primary/20 border border-brand-primary text-white p-4 rounded-xl flex items-center gap-3">
            <span className="text-xl">📚</span>
            <span className="font-bold">Now add the subjects you're studying (e.g. DSA, Dev, English)</span>
          </div>
        )}

        {/* LEFT COLUMN: Combined Card */}
        <div className="bg-brand-card rounded-3xl border border-white/5 p-6 shadow-xl flex flex-col gap-6">
           
           <div className="flex justify-between items-center pb-4 border-b border-white/5">
             <h2 className="text-xl font-bold text-white">Course</h2>
             <button onClick={openCreateModal} className="bg-brand-primary/10 text-brand-primary hover:bg-brand-primary hover:text-white px-3 py-1.5 rounded-lg text-sm font-bold transition-colors">
               Create course
             </button>
           </div>

           <div className="flex gap-2 relative group">
             <button 
               onClick={() => setIsDropdownOpen(!isDropdownOpen)}
               className="flex-1 flex items-center justify-between px-4 py-2.5 rounded-xl border border-white/5 bg-brand-surface transition-colors hover:bg-brand-surface/80"
             >
               <div className="flex items-center gap-2">
                 {selectedCourse && (
                   <span 
                     className="px-3 py-1 rounded-lg text-sm font-bold shadow-sm"
                     style={{ backgroundColor: selectedCourse.color || '#17c964', color: '#000' }}
                   >
                     {selectedCourse.name} <ChevronDown className="inline-block w-4 h-4 ml-1 opacity-50" />
                   </span>
                 )}
               </div>
             </button>
             
             {/* Dropdown Menu */}
             {isDropdownOpen && (
               <div className="absolute top-full left-0 mt-2 min-w-[200px] bg-[#1c2331] border border-white/10 rounded-2xl shadow-2xl z-50 p-3 flex flex-col gap-2 items-start">
                 {courses.map(c => (
                   <button 
                     key={c.id} 
                     onClick={() => { setSelectedCourseId(c.id); setIsDropdownOpen(false); }}
                     className="px-3 py-1 rounded-lg text-sm font-bold shadow-sm transition-transform hover:scale-105"
                     style={{ backgroundColor: c.color || '#17c964', color: '#000' }}
                   >
                     {c.name}
                   </button>
                 ))}
               </div>
             )}

             <button 
               onClick={openEditModal}
               className="w-11 flex items-center justify-center rounded-xl border border-white/5 bg-brand-surface hover:bg-white/10 transition-colors text-zinc-400 hover:text-white"
               title="Edit course"
             >
               <MoreHorizontal className="w-5 h-5" />
             </button>
           </div>

           {/* ACCORDIONS */}
           <div className="flex flex-col gap-6 mt-2">
             
             {/* Goals */}
             <div>
               <button onClick={() => toggleSection('goals')} className="flex items-center gap-2 text-white font-bold mb-4 w-full text-left">
                 <ChevronDown className={`w-4 h-4 transition-transform ${openSections.goals ? '' : '-rotate-90'}`} />
                 Goals
               </button>
               {openSections.goals && (
                 <div className="px-1">
                   <div className="flex justify-between mb-2">
                    <div className="text-left">
                      <div className="text-xs text-zinc-400 mb-1">Study time</div>
                      <div className="text-xl font-bold text-white">{completedHours > 0 ? completedHours : "—"}</div>
                    </div>
                    <div className="text-center">
                      <div className="text-xs text-zinc-400 mb-1">Goal</div>
                      <div className="text-xl font-bold text-white">{courseGoal > 0 ? courseGoal : "—"}</div>
                    </div>
                    <div className="text-right">
                      <div className="text-xs text-zinc-400 mb-1">Session</div>
                      <div className="text-2xl font-extrabold text-white">{courseSessions.length}</div>
                    </div>
                  </div>
                  <div className="flex justify-end text-xs font-bold text-white mb-1">{progressPercent}%</div>
                  <ProgressBar value={progressPercent} colorClass="bg-brand-primary" />
                 </div>
               )}
             </div>

             {/* Pace */}
             <div>
               <button onClick={() => toggleSection('pace')} className="flex items-center gap-2 text-white font-bold mb-4 w-full text-left">
                 <ChevronDown className={`w-4 h-4 transition-transform ${openSections.pace ? '' : '-rotate-90'}`} />
                 Pace
               </button>
               {openSections.pace && (
                 <div className="px-1 text-sm text-zinc-400 flex gap-2">
                    <span>🏁</span> Set a goal for this course to calculate your pace.
                 </div>
               )}
             </div>

             {/* Insights */}
             <div>
               <button onClick={() => toggleSection('insights')} className="flex items-center gap-2 text-white font-bold mb-4 w-full text-left">
                 <ChevronDown className={`w-4 h-4 transition-transform ${openSections.insights ? '' : '-rotate-90'}`} />
                 Insights
               </button>
               {openSections.insights && (
                 <div className="px-1">
                   <Tabs tabs={[{id: 'overview', label: 'Overview'}, {id: 'weekdays', label: 'Weekdays'}, {id: 'time', label: 'Time of day'}]} activeTab="overview" onChange={() => {}} className="mb-6 bg-brand-surface p-1 rounded-full w-full text-xs" />
                   
                   <div className="flex justify-between items-end mb-6">
                     <div>
                       <div className="text-xs text-zinc-400 mb-1">Start date</div>
                       <div className="font-bold text-white">{actualStartDate ? formatDateStr(actualStartDate) : '—'}</div>
                     </div>
                     <div className="flex flex-col items-center">
                       <span className="text-zinc-500 mb-1 text-lg">↔</span>
                       <div className="font-bold text-white">{actualStartDate && actualEndDate ? `${daysPassed} / ${totalDays} days` : '—'}</div>
                     </div>
                     <div className="text-right">
                       <div className="text-xs text-zinc-400 mb-1">End date</div>
                       <div className="font-bold text-white">{actualEndDate ? formatDateStr(actualEndDate) : '—'}</div>
                     </div>
                   </div>

                   <div className="space-y-3 text-sm">
                     <div className="flex gap-2 text-zinc-400"><span className="text-white">🏅 <strong className="text-white">0</strong></span> days longest streak</div>
                     <div className="flex gap-2 text-zinc-400"><span className="text-white">✔️ <strong className="text-white">0 / 1</strong></span> active days (0%)</div>
                     <div className="flex gap-2 text-zinc-400"><span className="text-white">⏱️ <strong className="text-white">—</strong></span> avg. daily (active days)</div>
                     <div className="flex gap-2 text-zinc-400"><span className="text-white">⏱️ <strong className="text-white">—</strong></span> avg. daily (all days)</div>
                     <div className="flex gap-2 text-zinc-400"><span className="text-white">🕒</span> Last studied {courseSessions.length > 0 ? "recently" : "never"}</div>
                   </div>
                 </div>
               )}
             </div>

           </div>
        </div>

        {/* RIGHT COLUMN */}
        <div className="flex flex-col gap-6">
           <div className="bg-brand-card p-2 rounded-2xl border border-white/5 shadow-lg flex items-center w-fit">
             <Tabs 
               tabs={[
                 {id: 'sessions', label: `Sessions • ${courseSessions.length}`},
                 {id: 'target', label: 'Target'},
                 {id: 'exams', label: 'Exams'},
                 {id: 'activities', label: 'Activities'},
                 {id: 'study-time', label: 'Study time'},
                 {id: 'heatmap', label: 'Heatmap'}
               ]}
               activeTab={activeTab}
               onChange={setActiveTab}
               className="bg-transparent"
             />
           </div>

           <div className="flex-1 flex flex-col">
              {activeTab === 'sessions' && (
                courseSessions.length === 0 ? (
                  <EmptyState 
                    title="No sessions for this course"
                    description="When you study for this course, the sessions will appear here."
                    icon={<div className="text-6xl mb-4">📓</div>}
                    className="flex-1 min-h-[400px]"
                  />
                ) : (
                  <div className="space-y-4">
                    {courseSessions.slice().reverse().map(session => {
                      const totalMins = session.totalDurationMinutes || 1; // avoid div by 0
                      const studyPct = Math.min(100, Math.max(0, (session.studyMinutes / totalMins) * 100));
                      const idlePct = Math.min(100, Math.max(0, (session.idleMinutes / totalMins) * 100));
                      
                      return (
                        <div key={session.id} className="p-4 bg-brand-surface/30 rounded-xl flex flex-col gap-3 border border-white/5">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-4">
                              <div className="w-12 h-12 shrink-0 rounded-xl bg-brand-surface flex flex-col items-center justify-center border border-white/5">
                                <span className="text-xs font-bold text-zinc-400">{session.startTime}</span>
                              </div>
                              <div>
                                <h4 className="font-bold text-white text-sm uppercase tracking-wider">{session.type}</h4>
                                <p className="text-xs text-zinc-400 mt-0.5">{session.date}</p>
                              </div>
                            </div>
                            <div className="flex items-center gap-6 text-right">
                              <div>
                                <div className="text-sm font-semibold text-brand-primary">
                                  {Math.floor(session.totalDurationMinutes / 60)}h {session.totalDurationMinutes % 60}m
                                </div>
                                <div className="text-xs text-zinc-500 mt-0.5">
                                  {session.numberOfBreaks} break{session.numberOfBreaks !== 1 ? 's' : ''}
                                </div>
                              </div>
                              <div className="text-[32px] font-black text-[#17c964] leading-none">
                                {session.productivityPercent}%
                              </div>
                            </div>
                          </div>
                          
                          {/* Study/Idle Progress Bar */}
                          <div className="w-full mt-1">
                            <div className="flex justify-between text-[10px] text-zinc-500 mb-1 font-bold">
                              <span>{session.studyMinutes}m Study</span>
                              <span>{session.idleMinutes}m Idle</span>
                            </div>
                            <div className="h-1.5 w-full bg-brand-surface rounded-full overflow-hidden flex">
                              <div className="h-full bg-[#17c964] transition-all" style={{ width: `${studyPct}%` }} />
                              <div className="h-full bg-[#f5a524] transition-all" style={{ width: `${idlePct}%` }} />
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )
              )}
              {activeTab === 'target' && (
                <div className="flex-1 flex flex-col bg-[#1c2331]/50 rounded-xl border border-white/5 overflow-hidden min-h-[400px]">
                  <textarea
                    value={noteText}
                    onChange={(e) => setNoteText(e.target.value)}
                    placeholder="Write what you have to study, topics to cover, skills to learn..."
                    className="flex-1 w-full p-6 bg-transparent text-white placeholder:text-zinc-600 outline-none resize-none text-sm leading-relaxed"
                  />
                </div>
              )}
              {activeTab !== 'sessions' && activeTab !== 'target' && (
                 <EmptyState 
                    title="Work in progress"
                    description={`The ${activeTab} tab is under construction.`}
                    className="flex-1 min-h-[400px]"
                  />
              )}
           </div>
        </div>
      </div>

      {/* COURSE MODAL (Create / Edit) */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
           <div className="bg-[#1c2331] w-full max-w-[500px] rounded-3xl border border-white/10 shadow-2xl flex flex-col">
              
              <div className="p-6 pb-2">
                 <div className="flex justify-between items-center mb-6">
                   <h2 className="text-xl font-bold text-white">
                     {editingCourseId ? "Edit course" : "Create new course"}
                   </h2>
                   {editingCourseId ? (
                     <button 
                       onClick={() => {
                         if (confirm("Are you sure you want to delete this course?")) {
                           deleteCourse(editingCourseId);
                           setIsModalOpen(false);
                           if (selectedCourseId === editingCourseId) {
                             setSelectedCourseId(courses.find(c => c.id !== editingCourseId)?.id || "");
                           }
                         }
                       }}
                       className="text-[#f34645] hover:text-red-400 text-sm font-medium transition-colors"
                     >
                       Delete course
                     </button>
                   ) : (
                     <button onClick={() => setIsModalOpen(false)} className="text-zinc-400 hover:text-white transition-colors">
                       <X className="w-5 h-5" />
                     </button>
                   )}
                 </div>
                 
                 <Tabs 
                   tabs={[
                     {id: 'standard', label: 'Standard'},
                     {id: 'advanced', label: 'Advanced'}
                   ]}
                   activeTab={modalTab}
                   onChange={setModalTab}
                   className="bg-[#262f40] p-1.5 rounded-full w-full"
                 />
              </div>

              <div className="p-6 flex-1 space-y-5">
                {/* Always visible inputs (Name and Color) */}
                <div className="flex gap-3 items-start">
                  <div className="flex-1 relative">
                    <label className="absolute left-3 top-2 text-[10px] font-bold text-white z-10">Name *</label>
                    <input 
                      type="text" 
                      value={newCourse.name} 
                      onChange={e => setNewCourse({...newCourse, name: e.target.value})} 
                      className="w-full bg-[#262f40] border-2 border-brand-primary rounded-xl px-3 pt-6 pb-2 text-sm text-zinc-400 outline-none focus:border-brand-primary/80 transition-colors" 
                      placeholder="e.g., MAT 401" 
                    />
                  </div>
                  
                  <div className="bg-[#262f40] border border-white/5 rounded-xl px-4 py-3 flex items-center gap-2 shrink-0 relative">
                    <span className="text-sm text-zinc-400">Color:</span>
                    <button 
                      onClick={() => {
                        const palette = document.getElementById('color-palette');
                        if (palette) palette.classList.toggle('hidden');
                      }}
                      className="px-3 py-1 rounded-full text-sm font-bold text-black flex items-center gap-1 cursor-pointer" 
                      style={{ backgroundColor: newCourse.color }}
                    >
                      {newCourse.name || "My course"} <ChevronDown className="w-3 h-3" />
                    </button>
                    
                    <div id="color-palette" className="hidden absolute top-full right-0 mt-2 p-2 bg-brand-surface border border-white/10 rounded-xl shadow-2xl z-50 flex gap-2 w-[180px] flex-wrap">
                      {["#8BB6D6", "#9DC8A2", "#E69A9A", "#F2B880", "#B9A3CC", "#F2D388", "#87C5B8", "#C9B09C", "#B0B5B9"].map(c => (
                        <button 
                          key={c}
                          onClick={() => {
                            setNewCourse({...newCourse, color: c});
                            document.getElementById('color-palette')?.classList.add('hidden');
                          }}
                          className="w-6 h-6 rounded-full border border-white/10 hover:scale-110 transition-transform"
                          style={{ backgroundColor: c }}
                        />
                      ))}
                    </div>
                  </div>
                </div>

                {/* Advanced Tab Specifics */}
                {modalTab === 'advanced' && (
                  <>
                    <div className="flex gap-4">
                      <div className="flex-1 relative">
                        <label className="absolute left-3 top-2 text-[10px] font-bold text-white z-10">Credits</label>
                        <input 
                          type="number" 
                          value={newCourse.credits} 
                          onChange={e => setNewCourse({...newCourse, credits: e.target.value})} 
                          className="w-full bg-[#262f40] border border-white/5 rounded-xl px-3 pt-6 pb-2 text-sm text-zinc-400 outline-none" 
                          placeholder="Credits" 
                        />
                      </div>
                      <div className="flex-1 flex bg-[#262f40] border border-white/5 rounded-xl overflow-hidden">
                        <div className="flex-1 relative px-3 pt-6 pb-2">
                           <label className="absolute left-3 top-2 text-[10px] font-bold text-white z-10">Target study goal</label>
                           <input 
                             type="number" 
                             value={newCourse.goalHours} 
                             onChange={e => setNewCourse({...newCourse, goalHours: e.target.value})} 
                             className="w-full bg-transparent text-sm text-zinc-400 outline-none" 
                             placeholder="e.g., 200h" 
                           />
                        </div>
                        <div className="bg-white/5 flex items-center justify-center px-4 font-bold text-sm text-white gap-1 border-l border-white/5">
                           Hours <HelpCircle className="w-4 h-4 text-zinc-400" />
                        </div>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4 mt-6">
                      <div>
                        <label className="flex items-center gap-2 text-sm font-bold text-white mb-3">
                          Start date <HelpCircle className="w-4 h-4 text-zinc-400 bg-brand-surface rounded-full p-0.5" />
                        </label>
                        <div className="flex flex-col gap-3">
                           <label className="flex items-center gap-3 text-sm text-zinc-300 cursor-pointer">
                             <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${newCourse.startDate === 'target_start' ? 'border-brand-primary' : 'border-zinc-500'}`}>
                               {newCourse.startDate === 'target_start' && <div className="w-2 h-2 rounded-full bg-brand-primary"></div>}
                             </div>
                             <input type="radio" className="hidden" checked={newCourse.startDate === 'target_start'} onChange={() => setNewCourse({...newCourse, startDate: 'target_start'})} /> 
                             First day of the target
                           </label>
                           <label className="flex items-center gap-3 text-sm text-zinc-300 cursor-pointer">
                             <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${newCourse.startDate === 'custom' ? 'border-brand-primary' : 'border-zinc-500'}`}>
                               {newCourse.startDate === 'custom' && <div className="w-2 h-2 rounded-full bg-brand-primary"></div>}
                             </div>
                             <input type="radio" className="hidden" checked={newCourse.startDate === 'custom'} onChange={() => setNewCourse({...newCourse, startDate: 'custom'})} /> 
                             Custom start date
                           </label>
                        </div>
                      </div>
                      <div>
                        <label className="flex items-center gap-2 text-sm font-bold text-white mb-3">
                          End date <HelpCircle className="w-4 h-4 text-zinc-400 bg-brand-surface rounded-full p-0.5" />
                        </label>
                        <div className="flex flex-col gap-3">
                           <label className="flex items-center gap-3 text-sm text-zinc-300 cursor-pointer">
                             <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${newCourse.endDate === 'target_end' ? 'border-brand-primary' : 'border-zinc-500'}`}>
                               {newCourse.endDate === 'target_end' && <div className="w-2 h-2 rounded-full bg-brand-primary"></div>}
                             </div>
                             <input type="radio" className="hidden" checked={newCourse.endDate === 'target_end'} onChange={() => setNewCourse({...newCourse, endDate: 'target_end'})} /> 
                             Last day of the target
                           </label>
                           <label className="flex items-center gap-3 text-sm text-zinc-300 cursor-pointer">
                             <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${newCourse.endDate === 'last_exam' ? 'border-brand-primary' : 'border-zinc-500'}`}>
                               {newCourse.endDate === 'last_exam' && <div className="w-2 h-2 rounded-full bg-brand-primary"></div>}
                             </div>
                             <input type="radio" className="hidden" checked={newCourse.endDate === 'last_exam'} onChange={() => setNewCourse({...newCourse, endDate: 'last_exam'})} /> 
                             Last exam in the course
                           </label>
                           <label className="flex items-center gap-3 text-sm text-zinc-300 cursor-pointer">
                             <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${newCourse.endDate === 'custom' ? 'border-brand-primary' : 'border-zinc-500'}`}>
                               {newCourse.endDate === 'custom' && <div className="w-2 h-2 rounded-full bg-brand-primary"></div>}
                             </div>
                             <input type="radio" className="hidden" checked={newCourse.endDate === 'custom'} onChange={() => setNewCourse({...newCourse, endDate: 'custom'})} /> 
                             Custom deadline
                           </label>
                        </div>
                      </div>
                    </div>
                  </>
                )}
              </div>

              <div className="p-6 pt-4 flex items-center justify-between gap-4">
                 <button onClick={() => setIsModalOpen(false)} className="flex-1 py-3 text-sm font-bold text-white bg-[#374151] hover:bg-[#4b5563] rounded-full transition-colors">
                   Cancel
                 </button>
                 {editingCourseId ? (
                   <button onClick={handleSaveCourse} className="flex-1 py-3 text-sm font-bold bg-white text-black hover:bg-zinc-200 rounded-full transition-colors shadow-lg flex items-center justify-center gap-2">
                     <Check className="w-4 h-4" /> Change
                   </button>
                 ) : (
                   <button onClick={handleSaveCourse} className="flex-1 py-3 text-sm font-bold bg-[#17c964] hover:bg-[#12a150] text-white rounded-full transition-colors shadow-lg shadow-[#17c964]/20 flex items-center justify-center gap-2">
                     <Check className="w-4 h-4" /> Create
                   </button>
                 )}
              </div>
           </div>
        </div>
      )}
    </>
  );
}
