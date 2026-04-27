import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface Break {
  startTime: string; // ISO string when pause was pressed
  endTime: string;   // ISO string when resume was pressed
  durationMinutes: number;
}

export interface Session {
  id: string;
  courseId: string;
  type: 'study' | 'idle';
  date: string;
  startTime: string; // e.g., "14:32"
  endTime: string;   // e.g., "15:32"
  totalDurationMinutes: number;
  studyMinutes: number;
  idleMinutes: number;
  breaks: Break[];
  numberOfBreaks: number;
  productivityPercent: number;
  goalMinutes: number;
  goalCompletionPercent: number;
  notes?: string;
  status: 'active' | 'paused' | 'completed';
  plannedEndTime?: string;
}

export interface Course {
  id: string;
  name: string;
  goalHours: number;
  color?: string;
  credits?: number;
  startDate?: string;
  endDate?: string;
}

export interface Target {
  id: string;
  name: string;
  startDate: string;
  endDate: string;
  weekdayGoalMinutes: number;
  weekendGoalMinutes: number;
  status: 'upcoming' | 'active' | 'completed';
  createdAt: string;
}

export interface StopwatchState {
  isActive: boolean;
  startTime: number | null;
  accumulatedMs: number;
  laps: number[];
}

export interface Preferences {
  timeFormat: '12h' | '24h';
  dateFormat: 'DD/MM/YYYY' | 'MM/DD/YYYY' | 'YYYY-MM-DD';
  weekStart: 'Monday' | 'Sunday';
  numberFormat?: '1,000' | '1.000';
}

export interface Badge {
  id: string;
  name: string;
  icon: string;
  earnedAt: string;
}

export interface DayData {
  date: string;
  duration: number;
}

export interface WeekData {
  weekStart: string;
  duration: number;
}

export interface MonthData {
  month: string;
  duration: number;
}

export interface ComparisonResult {
  rangeA: number;
  rangeB: number;
  percentChange: number;
}

interface StudyStore {
  sessions: Session[];
  courses: Course[];
  stopwatch: StopwatchState;
  
  // Active Session State
  activeSessionId: string | null;
  justCompletedSessionId: string | null;
  clearJustCompletedSession: () => void;
  sessionStartTimestamp: number | null;
  pausedElapsedMs: number;
  getCurrentSessionElapsed: () => number;
  currentSessionStatus: 'studying' | 'paused' | 'idle' | 'completed' | null;
  pauseSession: () => void;
  resumeSession: () => void;
  stopSession: () => void;
  tickActiveSession: () => void;
  
  targets: Target[];
  activeTargetId: string | null;
  hasTarget: boolean;

  addTarget: (target: Target) => void;
  editTarget: (id: string, updates: Partial<Target>) => void;
  deleteTarget: (id: string) => void;
  setActiveTarget: (id: string) => void;
  endTargetEarly: (id: string) => void;
  autoCompleteExpiredTargets: () => void;

  // Layout State
  isSidebarCollapsed: boolean;
  toggleSidebar: () => void;
  setSidebarCollapsed: (v: boolean) => void;

  // Actions
  addSession: (session: Session) => void;
  deleteSession: (id: string) => void;
  startSession: (courseId: string, startTime: string, plannedEndTime?: string) => void;
  addCourse: (course: Course) => void;
  editCourse: (id: string, updatedCourse: Partial<Course>) => void;
  deleteCourse: (id: string) => void;
  setStopwatch: (update: Partial<StopwatchState> | ((state: StopwatchState) => Partial<StopwatchState>)) => void;
  resetStopwatch: () => void;
  recordLap: (currentMs: number) => void;
  
  // Course Notes
  courseNotes: { courseId: string; note: string }[];
  updateCourseNote: (courseId: string, note: string) => void;
  
  // Preferences
  preferences: Preferences;
  updatePreferences: (updates: Partial<Preferences>) => void;
  defaultDailyGoal: number;
  goalOverrides: Record<string, number>;
  setGoalForPeriod: (startDate: string, endDate: string, mins: number) => void;
  setGoalForWeekdays: (daysOfWeek: number[], mins: number, futureOnly: boolean) => void;
  
  // Analytics State
  stats: {
    todayHours: number;
    weekHours: number;
    monthHours: number;
    totalHours: number;

    studyProgressPercent: number;
    targetElapsedPercent: number;

    weekdayHours: Record<string, number>;
    timeOfDayHours: {
      morning: number;
      afternoon: number;
      evening: number;
      night: number;
    };

    studyDaysCount: number;
    targetTotalDays: number;
    paceStatus: 'on-track' | 'falling-behind' | 'critical' | 'ahead';
    requiredHoursPerDay: number;
    currentPaceHoursPerDay: number;

    currentStreak: number;
    longestStreak: number;
    goalHitRate: number;
    badgesEarned: Badge[];

    activeTargetGoalHours: number;
    activeTargetDaysRemaining: number;
    activeTargetProgressPercent: number;

    // Exact required stats from PRD
    todayStudyMinutes: number;
    todayIdleMinutes: number;
    todaySessionCount: number;
    todayGoalMinutes: number;
    todayProgressPercent: number;
    termGoalHours: number;
    
    totalIdleMinutes: number;
    totalProductivityPercent: number;
    count80: number;
    count60: number;
    count40Wasted: number;
    activeTargetIdleMinutes: number;
    activeTargetStudyMinutes: number;
  };

  // Selectors
  getSessionsByDate: (date: string) => Session[];
  getHoursByDay: (start: string, end: string) => DayData[];
  getHoursByWeek: (start: string, end: string) => WeekData[];
  getHoursByMonth: (start: string, end: string) => MonthData[];
  compareRanges: (startA: string, endA: string, startB: string, endB: string) => ComparisonResult;
  getSessionsInRange: (start: string, end: string) => Session[];
}

const recalculateStats = (sessions: Session[], courses: Course[], targets: Target[], activeTargetId: string | null) => {
  const studySessions = sessions.filter(s => s.type !== 'idle');
  const sortedSessions = [...studySessions].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  const uniqueDates = Array.from(new Set(sortedSessions.map(s => s.date))).sort((a, b) => new Date(a).getTime() - new Date(b).getTime());
  
  let currentStreak = 0;
  let longestStreak = 0;
  let tempStreak = 0;
  let lastDate: Date | null = null;
  
  for (let i = 0; i < uniqueDates.length; i++) {
    const d = new Date(uniqueDates[i]);
    d.setHours(0,0,0,0);
    if (!lastDate) {
      tempStreak = 1;
    } else {
      const diffTime = Math.abs(d.getTime() - lastDate.getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)); 
      if (diffDays === 1) tempStreak++;
      else tempStreak = 1;
    }
    if (tempStreak > longestStreak) longestStreak = tempStreak;
    lastDate = d;
  }
  
  const todayObj = new Date();
  todayObj.setHours(0,0,0,0);
  const todayStr = todayObj.toISOString().split('T')[0];

  if (uniqueDates.length > 0) {
    const lastActiveDate = new Date(uniqueDates[uniqueDates.length - 1]);
    lastActiveDate.setHours(0,0,0,0);
    const diffTime = Math.abs(todayObj.getTime() - lastActiveDate.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    if (diffDays <= 1) {
      let cStreak = 1;
      for (let i = uniqueDates.length - 2; i >= 0; i--) {
        const curr = new Date(uniqueDates[i]);
        const prev = new Date(uniqueDates[i+1]);
        const diff = Math.ceil(Math.abs(prev.getTime() - curr.getTime()) / (1000 * 60 * 60 * 24));
        if (diff === 1) cStreak++;
        else break;
      }
      currentStreak = cStreak;
    }
  }

  const totalMinutes = studySessions.reduce((acc, s) => acc + s.studyMinutes, 0);
  const totalHours = totalMinutes / 60;
  const totalIdleMinutes = studySessions.reduce((acc, s) => acc + (s.idleMinutes || 0), 0);
  const totalProductivityPercent = totalMinutes > 0 ? Math.round((totalMinutes / (totalMinutes + totalIdleMinutes)) * 100) : 0;

  const weekStartObj = new Date(todayObj);
  weekStartObj.setDate(todayObj.getDate() - todayObj.getDay() + (todayObj.getDay() === 0 ? -6 : 1));
  const weekStartStr = weekStartObj.toISOString().split('T')[0];
  const weekHours = studySessions.filter(s => s.date >= weekStartStr).reduce((acc, s) => acc + s.studyMinutes, 0) / 60;

  const monthStartStr = todayStr.substring(0, 7) + '-01';
  const monthHours = studySessions.filter(s => s.date >= monthStartStr).reduce((acc, s) => acc + s.studyMinutes, 0) / 60;
  
  const todayHours = studySessions.filter(s => s.date === todayStr).reduce((acc, s) => acc + s.studyMinutes, 0) / 60;

  const totalGoalHours = courses.reduce((acc, c) => acc + (c.goalHours || 0), 0);
  const studyProgressPercent = totalGoalHours > 0 ? Math.min(100, Math.round((totalHours / totalGoalHours) * 100)) : 0;

  // Active Target computation
  const activeTarget = targets.find(t => t.id === activeTargetId);
  let activeTargetGoalHours = 0;
  let activeTargetDaysRemaining = 0;
  let activeTargetProgressPercent = 0;
  let targetTotalDays = 100; // default if no target
  let daysPassed = 30; // default if no target
  let targetElapsedPercent = 0;
  let activeTargetIdleMinutes = 0;
  let activeTargetStudyMinutes = 0;

  if (activeTarget) {
    const start = new Date(activeTarget.startDate);
    const end = new Date(activeTarget.endDate);
    const now = new Date();
    
    // Total days in target
    targetTotalDays = Math.max(1, Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)));
    daysPassed = Math.max(0, Math.ceil((now.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)));
    if (daysPassed > targetTotalDays) daysPassed = targetTotalDays;
    
    activeTargetDaysRemaining = Math.max(0, targetTotalDays - daysPassed);
    targetElapsedPercent = Math.min(100, Math.round((daysPassed / targetTotalDays) * 100));

    // Compute goal hours based on weekdays vs weekends
    let goalMinutes = 0;
    let curr = new Date(start);
    while (curr <= end) {
      const day = curr.getDay();
      if (day === 0 || day === 6) {
        goalMinutes += activeTarget.weekendGoalMinutes;
      } else {
        goalMinutes += activeTarget.weekdayGoalMinutes;
      }
      curr.setDate(curr.getDate() + 1);
    }
    activeTargetGoalHours = goalMinutes / 60;

    // Studied hours in target range
    const targetSessions = studySessions.filter(s => s.date >= activeTarget.startDate && s.date <= activeTarget.endDate);
    const studiedMins = targetSessions.reduce((acc, s) => acc + s.studyMinutes, 0);
    activeTargetStudyMinutes = studiedMins;
    
    // Idle hours in target range
    activeTargetIdleMinutes = targetSessions.reduce((acc, s) => acc + (s.idleMinutes || 0), 0);
    
    activeTargetProgressPercent = activeTargetGoalHours > 0 ? Math.min(100, Math.round((studiedMins / 60 / activeTargetGoalHours) * 100)) : 0;
  }

  const weekdayHours: Record<string, number> = { Sun: 0, Mon: 0, Tue: 0, Wed: 0, Thu: 0, Fri: 0, Sat: 0 };
  const timeOfDayHours = { morning: 0, afternoon: 0, evening: 0, night: 0 };
  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  studySessions.forEach(s => {
    const d = new Date(s.date);
    const dayName = dayNames[d.getDay()];
    weekdayHours[dayName] += (s.studyMinutes / 60);

    const startTimeStr = s.startTime || "12:00";
    const hour = parseInt(startTimeStr.split(':')[0], 10);
    const m = (s.studyMinutes / 60);
    if (hour >= 6 && hour < 12) timeOfDayHours.morning += m;
    else if (hour >= 12 && hour < 18) timeOfDayHours.afternoon += m;
    else if (hour >= 18 && hour <= 23) timeOfDayHours.evening += m;
    else timeOfDayHours.night += m;
  });

  const studyDaysCount = uniqueDates.length;
  
  const requiredHoursPerDay = targetTotalDays - daysPassed > 0 ? (totalGoalHours - totalHours) / (targetTotalDays - daysPassed) : 0;
  
  const last7DaysStart = new Date(todayObj);
  last7DaysStart.setDate(todayObj.getDate() - 7);
  const last7DaysStr = last7DaysStart.toISOString().split('T')[0];
  const last7DaysHours = studySessions.filter(s => s.date >= last7DaysStr).reduce((acc, s) => acc + s.studyMinutes, 0) / 60;
  const currentPaceHoursPerDay = last7DaysHours / 7;

  let paceStatus: 'on-track' | 'falling-behind' | 'critical' | 'ahead' = 'on-track';
  if (currentPaceHoursPerDay >= requiredHoursPerDay) paceStatus = 'ahead';
  if (currentPaceHoursPerDay < requiredHoursPerDay * 0.9) paceStatus = 'falling-behind';
  if (currentPaceHoursPerDay < requiredHoursPerDay * 0.5) paceStatus = 'critical';

  // Specific Task 3 PRD requirements
  const todaySessions = sessions.filter(s => s.date === todayStr);
  const todayStudyMinutes = todaySessions.filter(s => s.type !== 'idle').reduce((acc, s) => acc + s.studyMinutes, 0);
  const todayIdleMinutes = todaySessions.filter(s => s.type === 'idle').reduce((acc, s) => acc + s.idleMinutes, 0);
  const todaySessionCount = todaySessions.length;

  let todayGoalMinutes = 0;
  if (activeTarget) {
     const day = todayObj.getDay();
     todayGoalMinutes = (day === 0 || day === 6) ? activeTarget.weekendGoalMinutes : activeTarget.weekdayGoalMinutes;
  }
  const todayProgressPercent = todayGoalMinutes > 0 ? Math.min(100, Math.round((todayStudyMinutes / todayGoalMinutes) * 100)) : 0;
  const termGoalHours = activeTargetGoalHours;

  // Compute day counts for 80%, 60%, and <40% completion since target start
  let count80 = 0;
  let count60 = 0;
  let count40Wasted = 0;
  
  if (activeTarget) {
    const dailyStudyMap: Record<string, number> = {};
    studySessions.forEach(s => {
      if (!dailyStudyMap[s.date]) dailyStudyMap[s.date] = 0;
      dailyStudyMap[s.date] += s.studyMinutes;
    });

    const startDate = new Date(activeTarget.startDate);
    startDate.setHours(0,0,0,0);
    const endDate = new Date(todayObj);

    let checkDate = new Date(startDate);
    
    while (checkDate <= endDate) {
       const dayOfWeek = checkDate.getDay();
       const goal = (dayOfWeek === 0 || dayOfWeek === 6) ? activeTarget.weekendGoalMinutes : activeTarget.weekdayGoalMinutes;
       
       const dateStr = checkDate.toISOString().split('T')[0];
       const study = dailyStudyMap[dateStr] || 0;
       const percent = goal > 0 ? (study / goal) * 100 : 0;
       
       if (percent >= 80) {
           count80++;
       } else if (percent >= 60) {
           count60++;
       } else if (percent < 40) {
           count40Wasted++;
       }
       
       checkDate.setDate(checkDate.getDate() + 1);
    }
  }

  return {
    todayHours,
    weekHours,
    monthHours,
    totalHours,
    studyProgressPercent,
    targetElapsedPercent,
    weekdayHours,
    timeOfDayHours,
    studyDaysCount,
    targetTotalDays,
    paceStatus,
    requiredHoursPerDay,
    currentPaceHoursPerDay,
    currentStreak,
    longestStreak,
    goalHitRate: 85,
    badgesEarned: [],
    activeTargetGoalHours,
    activeTargetDaysRemaining,
    activeTargetProgressPercent,
    todayStudyMinutes,
    todayIdleMinutes,
    todaySessionCount,
    todayGoalMinutes,
    todayProgressPercent,
    termGoalHours,
    totalIdleMinutes,
    totalProductivityPercent,
    count80,
    count60,
    count40Wasted,
    activeTargetIdleMinutes,
    activeTargetStudyMinutes
  };
};

export const useStore = create<StudyStore>()(
  persist(
    (set, get) => ({
      sessions: [],
      courses: [],
      stopwatch: {
        isActive: false,
        startTime: null,
        accumulatedMs: 0,
        laps: []
      },
      
      activeSessionId: null,
      justCompletedSessionId: null,
      clearJustCompletedSession: () => set({ justCompletedSessionId: null }),
      sessionStartTimestamp: null,
      pausedElapsedMs: 0,
      getCurrentSessionElapsed: () => {
        const state = get();
        if (state.sessionStartTimestamp) {
          return Math.floor((state.pausedElapsedMs + (Date.now() - state.sessionStartTimestamp)) / 1000);
        }
        return Math.floor(state.pausedElapsedMs / 1000);
      },
      currentSessionStatus: null,
      
      startSession: (courseId, startTime, plannedEndTime) => set((state) => {
        const newSessionId = Math.random().toString(36).substring(2, 9);
        const newSession: Session = {
          id: newSessionId,
          courseId,
          type: 'study',
          date: new Date().toISOString().split('T')[0],
          startTime,
          endTime: '',
          plannedEndTime,
          totalDurationMinutes: 0,
          studyMinutes: 0,
          idleMinutes: 0,
          breaks: [],
          numberOfBreaks: 0,
          productivityPercent: 0,
          goalMinutes: 0, // calculate this correctly later in stopSession or now
          goalCompletionPercent: 0,
          status: 'active'
        };
        return {
          activeSessionId: newSessionId,
          sessionStartTimestamp: Date.now(),
          pausedElapsedMs: 0,
          currentSessionStatus: 'studying',
          sessions: [...state.sessions, newSession]
        };
      }),
      pauseSession: () => set((state) => {
        if (!state.activeSessionId || state.currentSessionStatus !== 'studying') return state;
        
        const sessions = state.sessions.map(s => {
          if (s.id === state.activeSessionId) {
            const newBreak: Break = {
              startTime: new Date().toISOString(),
              endTime: '',
              durationMinutes: 0
            };
            return { ...s, breaks: [...(s.breaks || []), newBreak] };
          }
          return s;
        });
        
        return {
          currentSessionStatus: 'paused',
          pausedElapsedMs: state.pausedElapsedMs + (state.sessionStartTimestamp ? Date.now() - state.sessionStartTimestamp : 0),
          sessionStartTimestamp: null,
          sessions
        };
      }),
      resumeSession: () => set((state) => {
        if (!state.activeSessionId || state.currentSessionStatus !== 'paused') return state;
        
        const sessions = state.sessions.map(s => {
          if (s.id === state.activeSessionId) {
            const breaks = [...(s.breaks || [])];
            if (breaks.length > 0) {
              const lastBreak = breaks[breaks.length - 1];
              lastBreak.endTime = new Date().toISOString();
              const start = new Date(lastBreak.startTime).getTime();
              const end = new Date(lastBreak.endTime).getTime();
              lastBreak.durationMinutes = Math.floor((end - start) / 60000);
            }
            return { ...s, breaks };
          }
          return s;
        });
        
        return {
          currentSessionStatus: 'studying',
          sessionStartTimestamp: Date.now(),
          sessions
        };
      }),
      stopSession: () => set((state) => {
        if (!state.activeSessionId) return state;
        
        const now = new Date();
        const endTimeStr = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
        
        const sessions = state.sessions.map(s => {
          if (s.id === state.activeSessionId) {
            // Close any open breaks
            let breaks = [...(s.breaks || [])];
            if (state.currentSessionStatus === 'paused' && breaks.length > 0) {
               const lastBreak = breaks[breaks.length - 1];
               if (!lastBreak.endTime) {
                 lastBreak.endTime = now.toISOString();
                 const start = new Date(lastBreak.startTime).getTime();
                 const end = new Date(lastBreak.endTime).getTime();
                 lastBreak.durationMinutes = Math.floor((end - start) / 60000);
               }
            }
            
            const idleMinutes = breaks.reduce((acc, b) => acc + (b.durationMinutes || 0), 0);
            const totalDurationMinutes = Math.floor(state.getCurrentSessionElapsed() / 60);
            const studyMinutes = Math.max(0, totalDurationMinutes - idleMinutes);
            const productivityPercent = totalDurationMinutes > 0 ? Math.round((studyMinutes / totalDurationMinutes) * 100) : 0;
            
            // Re-fetch daily goal to assign to session
            const activeTarget = state.targets.find(t => t.id === state.activeTargetId);
            let goalMinutes = 0;
            if (activeTarget) {
               const day = now.getDay();
               goalMinutes = (day === 0 || day === 6) ? activeTarget.weekendGoalMinutes : activeTarget.weekdayGoalMinutes;
            }
            const goalCompletionPercent = goalMinutes > 0 ? Math.round((studyMinutes / goalMinutes) * 100) : 0;

            return { 
              ...s, 
              endTime: endTimeStr,
              status: 'completed' as const,
              totalDurationMinutes,
              studyMinutes,
              idleMinutes,
              breaks,
              numberOfBreaks: breaks.length,
              productivityPercent,
              goalMinutes,
              goalCompletionPercent
            };
          }
          return s;
        });
        
        return {
          activeSessionId: null,
          justCompletedSessionId: state.activeSessionId,
          sessionStartTimestamp: null,
          pausedElapsedMs: 0,
          currentSessionStatus: null,
          sessions,
          stats: { ...state.stats, ...recalculateStats(sessions, state.courses, state.targets, state.activeTargetId) }
        };
      }),
      tickActiveSession: () => {
        const state = get();
        if (!state.activeSessionId || state.currentSessionStatus === 'completed') return;
        
        const activeSession = state.sessions.find(s => s.id === state.activeSessionId);
        if (activeSession && activeSession.plannedEndTime) {
           const now = new Date();
           const currentHHMM = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
           if (currentHHMM >= activeSession.plannedEndTime) {
             state.stopSession();
             return;
           }
        }
      },
      
      targets: [],
      activeTargetId: null,
      hasTarget: false,

      addTarget: (target) => set((state) => {
        const newTargets = [...state.targets, target];
        let activeId = state.activeTargetId;
        if (target.status === 'active' || newTargets.length === 1) {
          activeId = target.id;
          newTargets.forEach(t => {
            if (t.id === activeId) t.status = 'active';
            else if (t.status === 'active') t.status = 'completed'; // only one active
          });
        }
        return {
          targets: newTargets,
          activeTargetId: activeId,
          hasTarget: newTargets.length > 0,
          courses: [], // clear previous courses for new term
          sessions: [], // clear previous sessions for new term
          stats: { ...state.stats, ...recalculateStats([], [], newTargets, activeId) }
        };
      }),
      editTarget: (id, updates) => set((state) => {
        let newTargets = state.targets.map(t => t.id === id ? { ...t, ...updates } : t);
        if (updates.status === 'active') {
          newTargets = newTargets.map(t => ({ ...t, status: t.id === id ? 'active' : (t.status === 'active' ? 'completed' : t.status) }));
        }
        const activeId = newTargets.find(t => t.status === 'active')?.id || null;
        return {
          targets: newTargets,
          activeTargetId: activeId,
          hasTarget: newTargets.length > 0,
          stats: { ...state.stats, ...recalculateStats(state.sessions, state.courses, newTargets, activeId) }
        };
      }),
      deleteTarget: (id) => set((state) => {
        const newTargets = state.targets.filter(t => t.id !== id);
        let activeId = state.activeTargetId;
        if (activeId === id) {
          activeId = newTargets.length > 0 ? newTargets[0].id : null;
          if (activeId) newTargets.find(t => t.id === activeId)!.status = 'active';
        }
        return {
          targets: newTargets,
          activeTargetId: activeId,
          hasTarget: newTargets.length > 0,
          stats: { ...state.stats, ...recalculateStats(state.sessions, state.courses, newTargets, activeId) }
        };
      }),
      setActiveTarget: (id) => set((state) => {
        // Only if no current active target (enforced by UI mostly, but we switch safely here)
        const newTargets = state.targets.map(t => ({ ...t, status: (t.id === id ? 'active' : (t.status === 'active' ? 'completed' : t.status)) as Target['status'] }));
        return {
          targets: newTargets,
          activeTargetId: id,
          hasTarget: newTargets.length > 0,
          stats: { ...state.stats, ...recalculateStats(state.sessions, state.courses, newTargets, id) }
        };
      }),
      endTargetEarly: (id) => set((state) => {
        const newTargets = state.targets.map(t => t.id === id ? { ...t, status: 'completed' as const } : t);
        const activeId = newTargets.find(t => t.status === 'active')?.id || null;
        return {
          targets: newTargets,
          activeTargetId: activeId,
          stats: { ...state.stats, ...recalculateStats(state.sessions, state.courses, newTargets, activeId) }
        };
      }),
      autoCompleteExpiredTargets: () => set((state) => {
        const today = new Date().toISOString().split('T')[0];
        let changed = false;
        const newTargets = state.targets.map(t => {
           if (t.status === 'active' && t.endDate < today) {
             changed = true;
             return { ...t, status: 'completed' as const };
           }
           return t;
        });
        if (!changed) return state;
        const activeId = newTargets.find(t => t.status === 'active')?.id || null;
        return {
          targets: newTargets,
          activeTargetId: activeId,
          stats: { ...state.stats, ...recalculateStats(state.sessions, state.courses, newTargets, activeId) }
        };
      }),

      setStopwatch: (update) => set((state) => ({
        stopwatch: {
          ...state.stopwatch,
          ...(typeof update === 'function' ? update(state.stopwatch) : update)
        }
      })),
      resetStopwatch: () => set((state) => ({
        stopwatch: { isActive: false, startTime: null, accumulatedMs: 0, laps: [] }
      })),
      recordLap: (currentMs) => set((state) => ({
        stopwatch: { ...state.stopwatch, laps: [...state.stopwatch.laps, currentMs] }
      })),
      
      addSession: (session) => set((state) => {
        const newSessions = [...state.sessions, session];
        return { 
          sessions: newSessions,
          stats: { ...state.stats, ...recalculateStats(newSessions, state.courses, state.targets, state.activeTargetId) }
        };
      }),
      deleteSession: (id) => set((state) => {
        const newSessions = state.sessions.filter(s => s.id !== id);
        return {
          sessions: newSessions,
          stats: { ...state.stats, ...recalculateStats(newSessions, state.courses, state.targets, state.activeTargetId) }
        };
      }),
      addCourse: (course) => set((state) => {
        const newCourses = [...state.courses, course];
        return {
          courses: newCourses,
          stats: { ...state.stats, ...recalculateStats(state.sessions, newCourses, state.targets, state.activeTargetId) }
        };
      }),
      editCourse: (id, updatedCourse) => set((state) => {
        const newCourses = state.courses.map(c => c.id === id ? { ...c, ...updatedCourse } : c);
        return {
          courses: newCourses,
          stats: { ...state.stats, ...recalculateStats(state.sessions, newCourses, state.targets, state.activeTargetId) }
        };
      }),
      deleteCourse: (id) => set((state) => {
        const newCourses = state.courses.filter(c => c.id !== id);
        return {
          courses: newCourses,
          stats: { ...state.stats, ...recalculateStats(state.sessions, newCourses, state.targets, state.activeTargetId) }
        };
      }),
      
      defaultDailyGoal: 10 * 60,
      goalOverrides: {},
      
      preferences: {
        timeFormat: '24h',
        dateFormat: 'DD/MM/YYYY',
        weekStart: 'Monday'
      },
      
      isSidebarCollapsed: false,
      toggleSidebar: () => set((state) => ({ isSidebarCollapsed: !state.isSidebarCollapsed })),
      setSidebarCollapsed: (v) => set({ isSidebarCollapsed: v }),

      courseNotes: [],
      updateCourseNote: (courseId, note) => set((state) => {
        const existingIndex = state.courseNotes.findIndex(n => n.courseId === courseId);
        if (existingIndex >= 0) {
          const newNotes = [...state.courseNotes];
          newNotes[existingIndex] = { courseId, note };
          return { courseNotes: newNotes };
        }
        return { courseNotes: [...state.courseNotes, { courseId, note }] };
      }),

      updatePreferences: (updates) => set((state) => ({
        preferences: { ...state.preferences, ...updates }
      })),
      
      setGoalForPeriod: (startDate, endDate, mins) => set((state) => {
        const newOverrides = { ...state.goalOverrides };
        let currentDate = new Date(startDate);
        const end = new Date(endDate);
        while (currentDate <= end) {
          const dateStr = currentDate.toISOString().split('T')[0];
          newOverrides[dateStr] = mins;
          currentDate.setDate(currentDate.getDate() + 1);
        }
        return { goalOverrides: newOverrides };
      }),
      
      setGoalForWeekdays: (daysOfWeek, mins, futureOnly) => set((state) => {
        const newOverrides = { ...state.goalOverrides };
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const start = futureOnly ? today : new Date(today.getFullYear(), 0, 1);
        const end = new Date(today.getFullYear() + 1, 11, 31);
        let currentDate = new Date(start);
        while (currentDate <= end) {
          const jsDay = currentDate.getDay();
          const dayNum = jsDay === 0 ? 7 : jsDay;
          if (daysOfWeek.includes(dayNum)) {
            const dateStr = currentDate.toISOString().split('T')[0];
            newOverrides[dateStr] = mins;
          }
          currentDate.setDate(currentDate.getDate() + 1);
        }
        return { goalOverrides: newOverrides };
      }),

      stats: {
        todayHours: 0,
        weekHours: 0,
        monthHours: 0,
        totalHours: 0,
        studyProgressPercent: 0,
        targetElapsedPercent: 0,
        weekdayHours: { Sun: 0, Mon: 0, Tue: 0, Wed: 0, Thu: 0, Fri: 0, Sat: 0 },
        timeOfDayHours: { morning: 0, afternoon: 0, evening: 0, night: 0 },
        studyDaysCount: 0,
        targetTotalDays: 100,
        paceStatus: 'on-track',
        requiredHoursPerDay: 0,
        currentPaceHoursPerDay: 0,
        currentStreak: 0,
        longestStreak: 0,
        goalHitRate: 0,
        badgesEarned: [],
        activeTargetGoalHours: 0,
        activeTargetDaysRemaining: 0,
        activeTargetProgressPercent: 0,
        todayStudyMinutes: 0,
        todayIdleMinutes: 0,
        todaySessionCount: 0,
        todayGoalMinutes: 0,
        todayProgressPercent: 0,
        termGoalHours: 0,
        totalIdleMinutes: 0,
        totalProductivityPercent: 0,
        count80: 0,
        count60: 0,
        count40Wasted: 0,
        activeTargetIdleMinutes: 0,
        activeTargetStudyMinutes: 0
      },

      getSessionsByDate: (date) => get().sessions.filter(s => s.date === date),
      getHoursByDay: (start, end) => {
        const d: Record<string, number> = {};
        get().sessions.filter(s => s.date >= start && s.date <= end).forEach(s => {
          if (!d[s.date]) d[s.date] = 0;
          d[s.date] += s.totalDurationMinutes;
        });
        return Object.entries(d).map(([date, duration]) => ({ date, duration }));
      },
      getHoursByWeek: (start, end) => {
        const w: Record<string, number> = {};
        get().sessions.filter(s => s.date >= start && s.date <= end).forEach(s => {
          const date = new Date(s.date);
          const diff = date.getDate() - date.getDay() + (date.getDay() === 0 ? -6 : 1);
          const weekStart = new Date(date.setDate(diff)).toISOString().split('T')[0];
          if (!w[weekStart]) w[weekStart] = 0;
          w[weekStart] += s.totalDurationMinutes;
        });
        return Object.entries(w).map(([weekStart, duration]) => ({ weekStart, duration }));
      },
      getHoursByMonth: (start, end) => {
        const m: Record<string, number> = {};
        get().sessions.filter(s => s.date >= start && s.date <= end).forEach(s => {
          const month = s.date.substring(0, 7);
          if (!m[month]) m[month] = 0;
          m[month] += s.totalDurationMinutes;
        });
        return Object.entries(m).map(([month, duration]) => ({ month, duration }));
      },
      getSessionsInRange: (start, end) => get().sessions.filter(s => s.date >= start && s.date <= end),
      compareRanges: (startA, endA, startB, endB) => {
        const durationA = get().sessions.filter(s => s.date >= startA && s.date <= endA).reduce((acc, s) => acc + s.totalDurationMinutes, 0);
        const durationB = get().sessions.filter(s => s.date >= startB && s.date <= endB).reduce((acc, s) => acc + s.totalDurationMinutes, 0);
        const percentChange = durationB === 0 ? (durationA > 0 ? 100 : 0) : Math.round(((durationA - durationB) / durationB) * 100);
        return { rangeA: durationA, rangeB: durationB, percentChange };
      }
    }),
    {
      name: 'studyflow-storage',
      onRehydrateStorage: () => (state) => {
        if (state) {
          state.autoCompleteExpiredTargets();
          state.stats = recalculateStats(state.sessions, state.courses, state.targets, state.activeTargetId);
        }
      }
    }
  )
);
