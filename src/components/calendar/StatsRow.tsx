"use client";

import React from 'react';
import { Card } from "@/components/ui/Card";
import { useStore } from "@/store/useStore";

export function StatsRow() {
  const { stats, sessions } = useStore();
  const uniqueDays = new Set(sessions.map(s => s.date)).size;
  const avgDaily = uniqueDays > 0 ? (stats.totalStudyHours / uniqueDays).toFixed(1) : 0;
  
  const completedSessions = sessions.filter(s => s.status === 'completed');
  const avgProductivity = completedSessions.length > 0 ? 
    Math.round(completedSessions.reduce((acc, s) => acc + (s.productivityPercent || 0), 0) / completedSessions.length) : 0;
  
  const todayObj = new Date();
  todayObj.setHours(0,0,0,0);
  const weekStartObj = new Date(todayObj);
  weekStartObj.setDate(todayObj.getDate() - todayObj.getDay() + (todayObj.getDay() === 0 ? -6 : 1));
  const weekStartStr = weekStartObj.toISOString().split('T')[0];
  
  const thisWeekSessions = completedSessions.filter(s => s.date >= weekStartStr);
  const weeklyIdleMinutes = thisWeekSessions.reduce((acc, s) => acc + (s.idleMinutes || 0), 0);
  const weeklyBreaks = thisWeekSessions.reduce((acc, s) => acc + (s.numberOfBreaks || 0), 0);

  return (
    <div className="grid grid-cols-2 md:grid-cols-6 gap-4 mb-6">
      <Card className="p-4 flex flex-col items-center justify-center text-center">
        <div className="text-xl mb-1">🔥</div>
        <div className="text-sm font-bold text-white">{stats.currentStreak} days</div>
        <div className="text-xs text-zinc-400">Current streak</div>
      </Card>
      <Card className="p-4 flex flex-col items-center justify-center text-center">
        <div className="text-xl mb-1">🏆</div>
        <div className="text-sm font-bold text-white">{stats.longestStreak} days</div>
        <div className="text-xs text-zinc-400">Longest streak</div>
      </Card>
      <Card className="p-4 flex flex-col items-center justify-center text-center">
        <div className="text-xl mb-1">⚡</div>
        <div className="text-sm font-bold text-white">{avgProductivity}%</div>
        <div className="text-xs text-zinc-400">Avg productivity</div>
      </Card>
      <Card className="p-4 flex flex-col items-center justify-center text-center">
        <div className="text-xl mb-1">☕</div>
        <div className="text-sm font-bold text-white">{Math.floor(weeklyIdleMinutes / 60)}h {weeklyIdleMinutes % 60}m</div>
        <div className="text-xs text-zinc-400">Idle time (week)</div>
      </Card>
      <Card className="p-4 flex flex-col items-center justify-center text-center">
        <div className="text-xl mb-1">⏸</div>
        <div className="text-sm font-bold text-white">{weeklyBreaks}</div>
        <div className="text-xs text-zinc-400">Breaks (week)</div>
      </Card>
    </div>
  );
}
