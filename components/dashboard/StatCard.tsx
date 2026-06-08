import React from 'react';
import { LucideIcon, ArrowUpRight, ArrowDownRight } from 'lucide-react';

interface StatCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  trend?: {
    direction: 'up' | 'down';
    pct: number;
  };
  valueColorClass?: string;
}

export default function StatCard({
  title,
  value,
  icon: Icon,
  trend,
  valueColorClass = 'text-white'
}: StatCardProps) {
  return (
    <div 
      className="bg-[#111827] border border-teal-900/40 rounded-xl p-5 relative overflow-hidden transition-all duration-300 hover:border-teal-700/60 hover:shadow-[0_0_20px_rgba(45,212,191,0.05)]" 
      id={`stat-card-${title.toLowerCase().replace(/\s+/g, '-')}`}
    >
      {/* Glow highlight in background */}
      <div className="absolute top-0 right-0 w-24 h-24 bg-teal-500/5 blur-2xl rounded-full pointer-events-none" />

      <div className="flex justify-between items-start">
        <span className="text-[10px] font-bold text-[#94A3B8] uppercase tracking-wider font-mono">
          {title}
        </span>
        <div className="p-2 bg-teal-950/30 border border-teal-500/10 rounded-lg text-[#2DD4BF]">
          <Icon size={16} />
        </div>
      </div>

      <div className="mt-4 space-y-1">
        <h3 className={`text-2xl font-black tracking-tight font-display ${valueColorClass}`}>
          {value}
        </h3>

        {trend && (
          <div className="flex items-center gap-1 text-[11px] font-semibold font-mono">
            {trend.direction === 'up' ? (
              <span className="flex items-center text-[#10B981]">
                <ArrowUpRight size={13} className="shrink-0" />
                <span>+{trend.pct}%</span>
              </span>
            ) : (
              <span className="flex items-center text-[#EF4444]">
                <ArrowDownRight size={13} className="shrink-0" />
                <span>-{trend.pct}%</span>
              </span>
            )}
            <span className="text-[#475569]">vs last month</span>
          </div>
        )}
      </div>
    </div>
  );
}
