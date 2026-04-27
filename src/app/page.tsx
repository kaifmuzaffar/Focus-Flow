"use client";

import React, { useState } from "react";
import { Topbar } from "@/components/layout/Topbar";
import { Card, CardHeader } from "@/components/ui/Card";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { Tabs } from "@/components/ui/Tabs";
import { Tooltip } from "@/components/ui/Tooltip";
import { useStore } from "@/store/useStore";
import { useRouter } from "next/navigation";
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer } from "recharts";
import { Plus } from "lucide-react";
import { DashboardCourseBarChart } from "@/components/dashboard/DashboardCourseBarChart";
import { CourseDistributionCharts } from "@/components/dashboard/CourseDistributionCharts";

export default function Dashboard() {
  const { stats, courses, sessions, targets, activeTargetId, getCurrentSessionElapsed, currentSessionStatus, activeSessionId } = useStore();
  const [currentSessionElapsed, setCurrentSessionElapsed] = useState(0);

  React.useEffect(() => {
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

  let liveIdleSeconds = 0;
  const activeSession = sessions.find(s => s.id === activeSessionId);
  if (activeSession) {
    activeSession.breaks?.forEach(b => {
      if (b.endTime) {
        liveIdleSeconds += Math.floor((new Date(b.endTime).getTime() - new Date(b.startTime).getTime()) / 1000);
      } else {
        liveIdleSeconds += Math.floor((new Date().getTime() - new Date(b.startTime).getTime()) / 1000);
      }
    });
  }
  const router = useRouter();
  const [overviewTab, setOverviewTab] = useState('week');
  const [timeAnalysisTab, setTimeAnalysisTab] = useState("weekTime");
  const [timeAnalysisMode, setTimeAnalysisMode] = useState("total");

  const totalGoalHours = courses.reduce((acc, c) => acc + (c.goalHours || 0), 0);
  const activeCourses = courses.length;

  const getOverviewData = () => {
    const today = new Date();

    // Elapsed calculations
    const dayElapsed = Math.round(((today.getHours() * 60) + today.getMinutes()) / (24 * 60) * 100);
    const weekElapsed = Math.round(((today.getDay() * 24 * 60) + (today.getHours() * 60) + today.getMinutes()) / (7 * 24 * 60) * 100);
    const daysInMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0).getDate();
    const monthElapsed = Math.round(((today.getDate() - 1) * 24 * 60 + today.getHours() * 60) / (daysInMonth * 24 * 60) * 100);

    // Dynamic goals based on active target
    const dayGoal = stats.todayGoalMinutes > 0 ? stats.todayGoalMinutes / 60 : 2;
    const weekGoal = dayGoal * 7;
    const monthGoal = weekGoal * 4;

    switch (overviewTab) {
      case 'day': return {
        time: stats.todayHours, goal: dayGoal, sessions: stats.todaySessionCount,
        elapsedLabel: 'Time elapsed (day)', elapsedPercent: dayElapsed
      };
      case 'week': return {
        time: stats.weekHours, goal: weekGoal, sessions: sessions.filter(s => s.date >= new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]).length,
        elapsedLabel: 'Time elapsed (week)', elapsedPercent: weekElapsed
      };
      case 'month': return {
        time: stats.monthHours, goal: monthGoal, sessions: sessions.filter(s => s.date.startsWith(today.toISOString().substring(0, 7))).length,
        elapsedLabel: 'Time elapsed (month)', elapsedPercent: monthElapsed
      };
      default: return {
        time: stats.totalHours, goal: stats.termGoalHours > 0 ? stats.termGoalHours : totalGoalHours, sessions: sessions.length,
        elapsedLabel: 'Time elapsed (target)', elapsedPercent: stats.targetElapsedPercent
      };
    }
  };

  const overviewData = getOverviewData();
  const overviewProgress = overviewData.goal > 0 ? Math.min(100, Math.round((overviewData.time / overviewData.goal) * 100)) : 0;

  const maxWeekdayHour = Math.max(...Object.values(stats.weekdayHours), 1);
  const weekdayRadarData = Object.entries(stats.weekdayHours).map(([day, hours]) => ({ subject: day, A: timeAnalysisMode === 'total' ? hours : hours / Math.max(stats.studyDaysCount, 1) }));

  const timeOfDayRadarData = [
    { subject: 'Morning', A: timeAnalysisMode === 'total' ? stats.timeOfDayHours.morning : stats.timeOfDayHours.morning / Math.max(stats.studyDaysCount, 1) },
    { subject: 'Afternoon', A: timeAnalysisMode === 'total' ? stats.timeOfDayHours.afternoon : stats.timeOfDayHours.afternoon / Math.max(stats.studyDaysCount, 1) },
    { subject: 'Evening', A: timeAnalysisMode === 'total' ? stats.timeOfDayHours.evening : stats.timeOfDayHours.evening / Math.max(stats.studyDaysCount, 1) },
    { subject: 'Night', A: timeAnalysisMode === 'total' ? stats.timeOfDayHours.night : stats.timeOfDayHours.night / Math.max(stats.studyDaysCount, 1) }
  ];

  const paceColor = stats.paceStatus === 'ahead' ? 'text-brand-primary' : stats.paceStatus === 'on-track' ? 'text-brand-success' : stats.paceStatus === 'falling-behind' ? 'text-[#f5a524]' : 'text-[#f34645]';

  const activeTarget = targets.find(t => t.id === activeTargetId);
  const targetStartsFuture = activeTarget ? new Date(activeTarget.startDate) > new Date() : false;

  // Placeholder for activitiesList as it's no longer tracked in the modern session schema
  const activitiesList: [string, number][] = [];

  return (
    <>
      <Topbar title="Dashboard" subtitle="25/04/26 • 2NDCODE 2026" />

      <div className="px-8 pt-4 flex justify-end sticky top-20 z-30">
        <button onClick={() => router.push('/sessions')} className="bg-brand-primary hover:bg-brand-primary-hover text-white px-4 py-2 rounded-xl font-bold transition-colors flex items-center gap-2 shadow-lg">
          <Plus className="w-4 h-4" /> Add Session
        </button>
      </div>

      <div className="p-8 pt-6 grid grid-cols-1 lg:grid-cols-[1fr_300px] gap-6 flex-1 overflow-y-auto">

        {/* LEFT COLUMN - Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 auto-rows-max">

          {/* Stats Row */}
          <Card className="col-span-full grid grid-cols-3 divide-x divide-white/10 p-0 overflow-hidden">

            {/* 1. Study Progress */}
            <div className="p-4 flex flex-col justify-center bg-brand-surface/20">
              <div className="flex justify-between items-center mb-1">
                <span className="text-xs text-zinc-400">Study Progress</span>
                <span className="text-xs font-bold text-brand-success">{stats.studyProgressPercent}% study</span>
              </div>
              <div className="text-lg font-bold text-white mb-2">
                {stats.totalHours.toFixed(1)}h / {stats.termGoalHours.toFixed(1)}h
              </div>
              <ProgressBar value={stats.studyProgressPercent} colorClass="bg-brand-success" />
            </div>

            {/* 2. Time Wasted */}
            <div className="p-4 flex flex-col justify-center bg-brand-surface/20">
              <div className="flex justify-between items-center mb-1">
                <span className="text-xs text-zinc-400">Time Wasted</span>
                {currentSessionStatus ? (
                  <span className="text-xs font-bold text-[#f34645]">{Math.round((liveIdleSeconds / (currentSessionElapsed || 1)) * 100) || 0}% live</span>
                ) : (
                  <span className="text-xs font-bold text-[#f34645]">{Math.round((stats.activeTargetIdleMinutes / (stats.activeTargetStudyMinutes + stats.activeTargetIdleMinutes || 1)) * 100) || 0}% wasted</span>
                )}
              </div>
              <div className="text-lg font-bold text-white mb-2">
                {currentSessionStatus ? (liveIdleSeconds / 3600).toFixed(1) : (stats.activeTargetIdleMinutes / 60).toFixed(1)}h {currentSessionStatus ? 'idle' : 'wasted'}
              </div>
              <ProgressBar
                value={currentSessionStatus ? Math.round((liveIdleSeconds / (currentSessionElapsed || 1)) * 100) || 0 : Math.round((stats.activeTargetIdleMinutes / (stats.activeTargetStudyMinutes + stats.activeTargetIdleMinutes || 1)) * 100) || 0}
                colorClass="bg-[#f34645]"
              />
            </div>

            {/* 3. Productivity Percentage */}
            <div className="p-4 flex flex-col justify-center bg-brand-surface/20">
              <span className="text-xs text-zinc-400 mb-1">Productivity Percentage</span>
              <span className="text-4xl font-black text-[#17c964] leading-none mt-1">{stats.totalProductivityPercent}%</span>
            </div>

          </Card>

          {/* Goal Days */}
          <Card className="col-span-1 md:col-span-1 lg:col-span-1 p-6 flex flex-col justify-center">
            <h3 className="font-bold text-white mb-4">Target Progress Days <span className="float-right text-xl">🎯</span></h3>

            <div className="flex flex-col gap-3">
              <div className="flex justify-between items-center bg-brand-surface/30 p-3 rounded-xl border border-white/5">
                <span className="text-zinc-400 text-sm">80%+ Goal Days</span>
                <span className="text-2xl font-black text-[#17c964]">{stats.count80} <span className="text-sm font-bold text-zinc-500">days</span></span>
              </div>

              <div className="flex justify-between items-center bg-brand-surface/30 p-3 rounded-xl border border-white/5">
                <span className="text-zinc-400 text-sm">60%+ Goal Days</span>
                <span className="text-lg font-bold text-[#f5a524]">{stats.count60} <span className="text-xs font-bold text-zinc-500">days</span></span>
              </div>
              <div className="flex justify-between items-center bg-brand-surface/30 p-3 rounded-xl border border-white/5">
                <span className="text-zinc-400 text-sm">&lt; 40% Wasted Days</span>
                <span className="text-base font-bold text-[#f34645]">{stats.count40Wasted} <span className="text-xs font-bold text-zinc-500">days</span></span>
              </div>
            </div>
          </Card>

          {/* Study Overview Panel */}
          <Card className="col-span-1 md:col-span-1 lg:col-span-2 p-6">
            <h3 className="font-bold text-white mb-6">
              Goals <Tooltip text="Setting time-based goals is key to study success. Daily goals roll up into weekly, monthly, and overall term totals." />
            </h3>
            <Tabs
              tabs={[{ id: 'day', label: 'Day' }, { id: 'week', label: 'Week' }, { id: 'month', label: 'Month' }, { id: 'total', label: 'Total' }]}
              activeTab={overviewTab}
              onChange={setOverviewTab}
              className="bg-brand-surface rounded-full p-1 mb-6 text-xs w-full"
            />
            <div className="grid grid-cols-3 mb-6">
              <div>
                <div className="text-xs text-zinc-400 mb-1">Study time</div>
                <div className="text-xl font-bold text-white">{overviewData.time.toFixed(1)}h</div>
              </div>
              <div>
                <div className="text-xs text-zinc-400 mb-1">Goal</div>
                <div className="text-xl font-bold text-white">{overviewData.goal.toFixed(1)}h</div>
              </div>
              <div>
                <div className="text-xs text-zinc-400 mb-1">Sessions</div>
                <div className="text-xl font-bold text-white">{overviewData.sessions}</div>
              </div>
            </div>
            <div className="space-y-4">
              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-zinc-400">Study progress</span>
                  <span className="text-white font-bold">{overviewProgress}%</span>
                </div>
                <ProgressBar value={overviewProgress} colorClass="bg-brand-success" />
              </div>
              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-zinc-400">{overviewData.elapsedLabel}</span>
                  <span className="text-white font-bold">{overviewData.elapsedPercent}%</span>
                </div>
                <ProgressBar value={overviewData.elapsedPercent} colorClass="bg-white" />
              </div>
            </div>
          </Card>

          {/* Course Distribution Charts */}
          <Card className="col-span-1 md:col-span-2 lg:col-span-2 p-6 h-full min-h-[300px]">
            <CourseDistributionCharts />
          </Card>

          {/* Weekday Study (hours) */}
          <Card className="col-span-1 md:col-span-1 lg:col-span-1 p-6 flex flex-col">
            <h3 className="font-bold text-white mb-6">Weekyy</h3>
            <div className="flex-1 flex flex-col justify-around gap-2">
              {Object.entries(stats.weekdayHours).map(([day, hours]) => (
                <div key={day} className="flex items-center gap-4 text-xs font-bold">
                  <span className="w-8 text-zinc-400">{day}</span>
                  <div className="flex-1 bg-brand-surface h-3 rounded-full overflow-hidden">
                    <div className="h-full bg-brand-primary rounded-full" style={{ width: `${maxWeekdayHour > 0 ? (hours / maxWeekdayHour) * 100 : 0}%` }}></div>
                  </div>
                  <span className="w-10 text-right text-white">{hours.toFixed(1)}h</span>
                </div>
              ))}
            </div>
          </Card>

          {/* Time Analysis Panel */}
          <Card className="col-span-full p-6 grid grid-cols-1 md:grid-cols-[150px_1fr] gap-8">
            <div>
              <h3 className="font-bold text-white mb-6">Time analysis</h3>
              <Tabs
                tabs={[{ id: 'weekTime', label: 'Week Time' }, { id: 'dayTime', label: 'Day Time' }]}
                activeTab={timeAnalysisTab}
                onChange={setTimeAnalysisTab}
                className="bg-brand-surface rounded-full p-1 mb-6 text-xs w-full"
              />
              <div className="flex flex-col gap-2">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="radio" checked={timeAnalysisMode === 'total'} onChange={() => setTimeAnalysisMode('total')} className="text-brand-primary" />
                  <span className="text-sm text-white">Total</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="radio" checked={timeAnalysisMode === 'average'} onChange={() => setTimeAnalysisMode('average')} className="text-brand-primary" />
                  <span className="text-sm text-zinc-400">Average</span>
                </label>
              </div>
            </div>
            <div className="h-[250px] w-full flex justify-center items-center text-center relative">
              {sessions.length === 0 ? (
                <p className="text-zinc-500 text-sm p-6 border-2 border-dashed border-white/5 rounded-xl">Log sessions to see a spider chart of your most productive weekdays.</p>
              ) : (
                <>
                  <div className={`absolute inset-0 transition-opacity duration-500 ease-in-out ${timeAnalysisTab === 'weekTime' ? 'opacity-100 z-10' : 'opacity-0 z-0 pointer-events-none'}`}>
                    <ResponsiveContainer width="100%" height="100%">
                      <RadarChart cx="50%" cy="50%" outerRadius="75%" data={weekdayRadarData}>
                        <defs>
                          <linearGradient id="colorA" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#17c964" stopOpacity={0.8} />
                            <stop offset="95%" stopColor="#17c964" stopOpacity={0.1} />
                          </linearGradient>
                        </defs>
                        <PolarGrid stroke="#3f3f46" strokeDasharray="3 3" />
                        <PolarAngleAxis dataKey="subject" tick={{ fill: '#e4e4e7', fontSize: 13, fontWeight: 'bold' }} />
                        <PolarRadiusAxis angle={30} domain={[0, 'auto']} tick={false} axisLine={false} />
                        <Radar name="Hours" dataKey="A" stroke="#17c964" strokeWidth={3} fill="url(#colorA)" fillOpacity={1} dot={{ r: 4, fill: '#17c964', strokeWidth: 2, stroke: '#fff' }} activeDot={{ r: 6, strokeWidth: 0 }} />
                      </RadarChart>
                    </ResponsiveContainer>
                  </div>
                  <div className={`absolute inset-0 transition-opacity duration-500 ease-in-out ${timeAnalysisTab === 'dayTime' ? 'opacity-100 z-10' : 'opacity-0 z-0 pointer-events-none'}`}>
                    <ResponsiveContainer width="100%" height="100%">
                      <RadarChart cx="50%" cy="50%" outerRadius="75%" data={timeOfDayRadarData}>
                        <defs>
                          <linearGradient id="colorB" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#006fee" stopOpacity={0.8} />
                            <stop offset="95%" stopColor="#006fee" stopOpacity={0.1} />
                          </linearGradient>
                        </defs>
                        <PolarGrid stroke="#3f3f46" strokeDasharray="3 3" />
                        <PolarAngleAxis dataKey="subject" tick={{ fill: '#e4e4e7', fontSize: 13, fontWeight: 'bold' }} />
                        <PolarRadiusAxis angle={30} domain={[0, 'auto']} tick={false} axisLine={false} />
                        <Radar name="Hours" dataKey="A" stroke="#006fee" strokeWidth={3} fill="url(#colorB)" fillOpacity={1} dot={{ r: 4, fill: '#006fee', strokeWidth: 2, stroke: '#fff' }} activeDot={{ r: 6, strokeWidth: 0 }} />
                      </RadarChart>
                    </ResponsiveContainer>
                  </div>
                </>
              )}
            </div>
          </Card>

        </div>

        {/* RIGHT COLUMN */}
        <div className="flex flex-col gap-6">

          <Card className="p-6 border border-white/5">
            <h3 className="font-bold text-white mb-4">Study time <Tooltip text="Track your study hours against your goal alongside the total elapsed term time." /></h3>
            {targetStartsFuture ? (
              <p className="text-sm text-zinc-400 p-4 border border-white/5 border-dashed rounded-xl text-center">Your term is about to begin! Once it starts, your study progress will appear here.</p>
            ) : (
              <div className="space-y-6">
                <div>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-white font-bold">{Math.floor(stats.totalHours)}h {Math.round((stats.totalHours % 1) * 60)}m / {totalGoalHours}h • {stats.studyProgressPercent}% study</span>
                  </div>
                  <ProgressBar value={stats.studyProgressPercent} colorClass={stats.studyProgressPercent >= 100 ? "bg-brand-success" : stats.studyProgressPercent >= 50 ? "bg-brand-primary" : "bg-[#f5a524]"} />
                </div>
                <div>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-white font-bold">{stats.studyDaysCount}/{stats.targetTotalDays} days • {stats.targetElapsedPercent}% elapsed</span>
                  </div>
                  <ProgressBar value={stats.targetElapsedPercent} colorClass="bg-white" />
                </div>
              </div>
            )}
          </Card>

          <Card className="p-6 border border-white/5">
            <h3 className="font-bold text-white mb-4">
              Activities • {activitiesList.length} {'>'} <Tooltip text="Activities describe what you do during a session (e.g., 'Memorizing' or 'Summarizing'). Use them to track different types of study work." />
            </h3>
            <div className="space-y-3">
              {activitiesList.length === 0 ? (
                <p className="text-xs text-zinc-500 italic">No activities logged yet.</p>
              ) : (
                activitiesList.map(([act, mins]) => (
                  <div key={act} className="flex justify-between items-center text-sm">
                    <span className="text-zinc-300">{act}</span>
                    <span className="text-white font-bold">{Math.floor(mins / 60)}h {mins % 60}m</span>
                  </div>
                ))
              )}
            </div>
          </Card>

          <Card className="p-6 border border-white/5">
            <h3 className="font-bold text-white mb-4">
              Study days • {stats.studyDaysCount}/{stats.targetTotalDays} {'>'} <Tooltip text="Every day of your term counts. Build active days by studying daily (ideally). On each active day, hit your daily goal. This keeps you on pace to reach your overall study goals!" />
            </h3>
            <div className={`text-sm font-bold mb-4 ${paceColor}`}>
              Pace • {stats.paceStatus === 'ahead' ? 'Ahead' : stats.paceStatus === 'on-track' ? 'On track' : stats.paceStatus === 'falling-behind' ? 'Falling behind' : 'Critical'}
            </div>

            {/* Visual Dot Progress Bar */}
            <div className="flex flex-wrap gap-1.5 mb-6">
              {Array.from({ length: 35 }).map((_, i) => (
                <div key={i} className={`w-[calc(10%-4px)] h-2 rounded-full ${i < stats.studyDaysCount ? 'bg-brand-success' : 'bg-brand-surface'}`}></div>
              ))}
            </div>

            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-zinc-400">Current pace:</span>
                <span className="text-white font-bold">{stats.currentPaceHoursPerDay.toFixed(1)}h / day</span>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-400">Required:</span>
                <span className="text-white font-bold">{stats.requiredHoursPerDay.toFixed(1)}h / day (goal)</span>
              </div>
            </div>
          </Card>
        </div>

        {/* Full Width Row - Course Chart */}
        <Card className="col-span-full p-6 mt-2 mb-6 border border-white/5">
          <DashboardCourseBarChart />
        </Card>

      </div>
    </>
  );
}
