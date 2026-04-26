"use client";

import React, { useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts';
import { useStore } from "@/store/useStore";

export function DashboardCourseBarChart() {
  const { sessions, courses, stats } = useStore();
  
  const chartData = useMemo(() => {
    const dataMap: Record<string, any> = {};
    
    // Sort ascending for chart (left to right = old to new)
    const sorted = [...sessions].sort((a,b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    
    sorted.forEach(s => {
      let key = s.date;
      
      if (!dataMap[key]) {
        dataMap[key] = { name: key, rawDate: s.date, total: 0 };
        courses.forEach(c => dataMap[key][c.name] = 0);
      }
      
      const hours = (s.studyMinutes || 0) / 60;
      const course = courses.find(c => c.id === s.courseId);
      if (course) {
        dataMap[key][course.name] = (dataMap[key][course.name] || 0) + hours;
      }
      dataMap[key].total += hours;
    });

    return Object.values(dataMap).slice(-7); // Last 7 days
  }, [sessions, courses]);

  const goalLine = (stats.todayGoalMinutes || 120) / 60; // Use today's goal or a fallback
  
  const averageHours = chartData.length > 0 
    ? (chartData.reduce((acc, curr) => acc + curr.total, 0) / chartData.length).toFixed(1) 
    : "0.0";

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const dateObj = new Date(label);
      const mmdd = !isNaN(dateObj.getTime()) 
        ? `${String(dateObj.getMonth() + 1).padStart(2, '0')}-${String(dateObj.getDate()).padStart(2, '0')}`
        : label;
        
      return (
        <div className="bg-[#1c2331] border border-white/10 p-3 rounded-lg shadow-xl text-xs w-[180px]">
          <p className="font-bold text-white mb-2">{mmdd}</p>
          {payload.map((entry: any) => (
            entry.value > 0 && (
              <div key={entry.name} className="flex items-center justify-between mb-1">
                <span className="text-zinc-300" style={{ color: entry.fill }}>{entry.name} :</span>
                <span className="text-white font-bold">{entry.value.toFixed(1)}</span>
              </div>
            )
          ))}
        </div>
      );
    }
    return null;
  };

  if (chartData.length === 0) return null;

  const maxTotal = Math.max(...chartData.map(d => d.total), goalLine);
  const roundedMax = Math.ceil(maxTotal / 3) * 3; 
  let yTicks = [];
  for (let i = 0; i <= Math.max(12, roundedMax); i += 3) yTicks.push(i);

  return (
    <div className="flex flex-col w-full h-[400px]">
      <div className="flex justify-between items-center mb-6 px-2 mt-2">
        <h2 className="text-lg font-bold text-white">Daily study by course</h2>
        <span className="text-sm text-zinc-400">Average: {averageHours}h / day</span>
      </div>
      
      <div className="flex-1 w-full text-xs">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartData} margin={{ top: 0, right: 10, left: -20, bottom: 0 }}>
            <XAxis 
              dataKey="name" 
              stroke="#52525b" 
              tickLine={false} 
              axisLine={true} 
              tickFormatter={(val) => {
                const d = new Date(val);
                const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
                return !isNaN(d.getTime()) ? dayNames[d.getDay()] : val;
              }}
            />
            <YAxis stroke="#52525b" tickLine={false} axisLine={true} ticks={yTicks} tickFormatter={(val) => `${val}h`} />
            <Tooltip cursor={{fill: '#262f40'}} content={<CustomTooltip />} />
            <ReferenceLine y={goalLine} stroke="#52525b" strokeDasharray="4 4" />
            
            {courses.map(c => (
              <Bar key={c.id} dataKey={c.name} stackId="a" fill={c.color || '#006fee'} radius={0} barSize={32} />
            ))}
          </BarChart>
        </ResponsiveContainer>
      </div>
      
      <div className="flex items-center gap-4 mt-6 px-4">
        {courses.map(c => (
          <div key={c.id} className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: c.color || '#006fee' }}></div>
            <span className="text-xs text-zinc-400 font-bold">{c.name}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
