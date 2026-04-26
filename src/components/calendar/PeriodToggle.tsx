"use client";

import React from 'react';

interface PeriodToggleProps {
  period: 'days' | 'weeks' | 'months';
  setPeriod: (p: 'days' | 'weeks' | 'months') => void;
}

export function PeriodToggle({ period, setPeriod }: PeriodToggleProps) {
  return (
    <div className="flex bg-brand-surface rounded-xl p-1 w-fit">
      {(['days', 'weeks', 'months'] as const).map(p => (
        <button
          key={p}
          onClick={() => setPeriod(p)}
          className={`px-4 py-1.5 rounded-lg text-sm font-bold capitalize transition-colors ${
            period === p ? 'bg-[#374151] text-white shadow-sm' : 'text-zinc-400 hover:text-white'
          }`}
        >
          {p}
        </button>
      ))}
    </div>
  );
}
