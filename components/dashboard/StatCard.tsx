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
  valueColorClass = 'text-gray-900'
}: StatCardProps) {
  return (
    <div
      className="bg-white rounded-2xl border border-gray-100 p-5 relative overflow-hidden transition-colors duration-200 hover:border-gray-200 hover:shadow-sm"
      id={`stat-card-${title.toLowerCase().replace(/\s+/g, '-')}`}
    >
      <div className="absolute top-0 right-0 w-24 h-24 bg-indigo-50 blur-2xl rounded-full pointer-events-none" />

      <div className="flex justify-between items-start">
        <span className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">
          {title}
        </span>
        <div className="w-9 h-9 rounded-xl flex items-center justify-center mb-3 bg-indigo-50 border border-indigo-100 text-indigo-600">
          <Icon size={16} />
        </div>
      </div>

      <div className="mt-2 space-y-1">
        <h3 className={`text-2xl font-bold font-mono text-gray-900 tabular-nums ${valueColorClass}`}> {value}</h3>

        {trend && (
          <div className="inline-flex items-center gap-1 text-xs font-medium font-mono mt-1">
            {trend.direction === 'up' ? (
              <span className="inline-flex items-center gap-1 text-green-600">
                <ArrowUpRight size={13} className="shrink-0" />
                <span>+{trend.pct}%</span>
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 text-red-500">
                <ArrowDownRight size={13} className="shrink-0" />
                <span>-{trend.pct}%</span>
              </span>
            )}
            <span className="text-gray-400">vs last month</span>
          </div>
        )}
      </div>
    </div>
  );
}
