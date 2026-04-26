"use client";

import React, { useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts';
import { useStore } from "@/store/useStore";

export function StudyBarChart({ period, onBarClick }: { period: 'days'|'weeks'|'months', onBarClick: (key: string) => void }) {
  const { sessions, courses, defaultDailyGoal, preferences } = useStore();
  
  const chartData = useMemo(() => {
    const dataMap: Record<string, any> = {};
    
    // Sort ascending for chart (left to right = old to new)
    const sorted = [...sessions].sort((a,b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    
    sorted.forEach(s => {
      let key = s.date;
      if (period === 'weeks') {
        const d = new Date(s.date);
        const dayOfWeek = d.getDay();
        const diff = preferences.weekStart === 'Monday' 
          ? d.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1)
          : d.getDate() - dayOfWeek;
        key = new Date(d.setDate(diff)).toISOString().split('T')[0];
      } else if (period === 'months') {
        key = s.date.substring(0, 7);
      }
      
      if (!dataMap[key]) {
        dataMap[key] = { name: key, rawDate: s.date, total: 0, studyHours: 0, idleHours: 0, breaks: 0 };
      }
      
      const studyH = (s.studyMinutes || 0) / 60;
      const idleH = (s.idleMinutes || 0) / 60;
      dataMap[key].studyHours += studyH;
      dataMap[key].idleHours += idleH;
      dataMap[key].breaks += (s.numberOfBreaks || 0);
      dataMap[key].total += (studyH + idleH);
    });

    let limit = 14;
    if (period === 'weeks') limit = 8;
    if (period === 'months') limit = 6;
    
    return Object.values(dataMap).slice(-limit);
  }, [sessions, courses, period, preferences.weekStart]);

  const goalLine = period === 'days' ? defaultDailyGoal / 60 : 
                   period === 'weeks' ? (defaultDailyGoal / 60) * 7 : 
                   (defaultDailyGoal / 60) * 30;

  const averageHours = chartData.length > 0 
    ? (chartData.reduce((acc, curr) => acc + curr.total, 0) / chartData.length).toFixed(1) 
    : "0.0";

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      // Use the raw date object to format to MM-DD
      const dateObj = new Date(label);
      const mmdd = !isNaN(dateObj.getTime()) 
        ? `${String(dateObj.getMonth() + 1).padStart(2, '0')}-${String(dateObj.getDate()).padStart(2, '0')}`
        : label;
        
      return (
        <div className="bg-[#1c2331] border border-white/10 p-4 rounded-xl shadow-2xl text-xs w-[200px]">
          <p className="font-bold text-white mb-3 text-sm">{mmdd}</p>
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-zinc-400 flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-[#17c964]"></div> Study Time</span>
              <span className="text-white font-bold">{payload.find((p: any) => p.dataKey === 'studyHours')?.value.toFixed(1)}h</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-zinc-400 flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-[#f5a524]"></div> Idle Time</span>
              <span className="text-white font-bold">{payload.find((p: any) => p.dataKey === 'idleHours')?.value.toFixed(1)}h</span>
            </div>
            <div className="flex items-center justify-between pt-2 border-t border-white/5 mt-2">
              <span className="text-zinc-500">Breaks Taken</span>
              <span className="text-zinc-300 font-bold">{payload[0].payload.breaks}</span>
            </div>
          </div>
        </div>
      );
    }
    return null;
  };

  if (chartData.length === 0) {
    return (
      <div className="h-64 w-full mt-6 flex items-center justify-center border border-white/5 rounded-xl border-dashed">
         <span className="text-sm text-zinc-500">No data available for chart</span>
      </div>
    );
  }

  // Generate Y axis ticks
  const maxTotal = Math.max(...chartData.map(d => d.total), goalLine);
  const roundedMax = Math.ceil(maxTotal / 3) * 3; 
  let yTicks = [];
  for (let i = 0; i <= Math.max(12, roundedMax); i += 3) {
    yTicks.push(i);
  }

  return (
    <div className="flex flex-col w-full h-[400px]">
      <div className="flex justify-between items-center mb-6 px-2 mt-4">
        <h2 className="text-lg font-bold text-white">Daily study by session type</h2>
        <span className="text-sm text-zinc-400">Average: {averageHours}h / {period === 'days' ? 'day' : period === 'weeks' ? 'week' : 'month'}</span>
      </div>
      
      <div className="flex-1 w-full text-xs">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart 
            data={chartData} 
            onClick={(e: any) => {
              if (e && e.activePayload && e.activePayload.length > 0) {
                onBarClick(e.activePayload[0].payload.name);
              }
            }}
            margin={{ top: 0, right: 10, left: -20, bottom: 0 }}
          >
            <XAxis 
              dataKey="name" 
              stroke="#52525b" 
              tickLine={false} 
              axisLine={true} 
              tickFormatter={(val) => {
                if (period !== 'days') return val;
                const d = new Date(val);
                return !isNaN(d.getTime()) ? `${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}` : val;
              }}
            />
            <YAxis 
              stroke="#52525b" 
              tickLine={false} 
              axisLine={true} 
              ticks={yTicks}
              tickFormatter={(val) => `${val}h`} 
            />
            <Tooltip cursor={{fill: '#262f40'}} content={<CustomTooltip />} />
            <ReferenceLine y={goalLine} stroke="#52525b" strokeDasharray="4 4" />
            
            <Bar dataKey="studyHours" stackId="a" fill="#17c964" barSize={32} />
            <Bar dataKey="idleHours" stackId="a" fill="#f5a524" barSize={32} radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
      
      {/* Legend below chart */}
      <div className="flex items-center gap-6 mt-6 px-4">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-[#17c964]"></div>
          <span className="text-xs text-zinc-400 font-bold">Study Time</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-[#f5a524]"></div>
          <span className="text-xs text-zinc-400 font-bold">Idle Time</span>
        </div>
      </div>
    </div>
  );
}
