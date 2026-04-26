"use client";

import React, { useState, useMemo } from 'react';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { useStore } from "@/store/useStore";

export function CourseDistributionCharts() {
  const { sessions, courses } = useStore();
  const [timeRange, setTimeRange] = useState<'week' | 'month'>('week');

  const chartData = useMemo(() => {
    const today = new Date();
    let startDate = new Date();

    if (timeRange === 'week') {
      startDate.setDate(today.getDate() - 7);
    } else {
      // Current month
      startDate = new Date(today.getFullYear(), today.getMonth(), 1);
    }

    const startStr = startDate.toISOString().split('T')[0];

    const dataMap: Record<string, number> = {};
    courses.forEach(c => dataMap[c.id] = 0);

    sessions.forEach(s => {
      if (s.date >= startStr && s.type !== 'idle') {
        if (dataMap[s.courseId] !== undefined) {
          dataMap[s.courseId] += s.studyMinutes;
        }
      }
    });

    return courses.map(c => ({
      name: c.name,
      hours: Number((dataMap[c.id] / 60).toFixed(1)),
      fill: c.color || '#006fee'
    })).filter(d => d.hours > 0).sort((a, b) => b.hours - a.hours); // Descending by hours
  }, [sessions, courses, timeRange]);

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-[#1c2331] border border-white/10 p-3 rounded-lg shadow-xl text-xs z-50 relative">
          <div className="flex items-center gap-2 mb-1">
            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: data.fill }}></div>
            <span className="font-bold text-white">{data.name}</span>
          </div>
          <p className="text-zinc-300 ml-5">{data.hours}h studied</p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="w-full flex flex-col h-full">
      <div className="flex justify-between items-center mb-6">
        <h3 className="font-bold text-white">Course Distribution</h3>
        <div className="flex bg-brand-surface rounded-full p-1 text-xs">
          <button 
            onClick={() => setTimeRange('week')}
            className={`px-3 py-1 rounded-full transition-colors ${timeRange === 'week' ? 'bg-brand-primary text-white font-bold' : 'text-zinc-400 hover:text-white'}`}
          >
            Weekly
          </button>
          <button 
            onClick={() => setTimeRange('month')}
            className={`px-3 py-1 rounded-full transition-colors ${timeRange === 'month' ? 'bg-brand-primary text-white font-bold' : 'text-zinc-400 hover:text-white'}`}
          >
            Monthly
          </button>
        </div>
      </div>

      {chartData.length === 0 ? (
        <div className="flex-1 flex items-center justify-center text-sm text-zinc-500 min-h-[200px]">
          No study data found for this period.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 flex-1 min-h-[250px] relative">
          {/* Pie Chart */}
          <div className="w-full h-full min-h-[200px] flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={chartData}
                  dataKey="hours"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={90}
                  stroke="none"
                  paddingAngle={2}
                >
                  {chartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.fill} />
                  ))}
                </Pie>
                <Tooltip cursor={{fill: 'transparent'}} content={<CustomTooltip />} />
              </PieChart>
            </ResponsiveContainer>
          </div>

          {/* Horizontal Bar Chart */}
          <div className="w-full h-full min-h-[200px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} layout="vertical" margin={{ top: 0, right: 40, left: 0, bottom: 0 }}>
                <XAxis type="number" hide />
                <YAxis 
                  dataKey="name" 
                  type="category" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fill: '#a1a1aa', fontSize: 12 }} 
                  width={90} 
                  tickFormatter={(val) => val.substring(0, 10) + (val.length > 10 ? '...' : '')}
                />
                <Tooltip cursor={{fill: '#262f40'}} content={<CustomTooltip />} />
                <Bar dataKey="hours" radius={[0, 4, 4, 0]} barSize={24} label={{ position: 'right', fill: '#fff', fontSize: 12, formatter: (val: number) => `${val}h` }}>
                  {chartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.fill} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}
    </div>
  );
}
