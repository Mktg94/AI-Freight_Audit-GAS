"use client";

import React, { useMemo } from 'react';
import { 
  ResponsiveContainer, PieChart, Pie, Cell, Tooltip 
} from 'recharts';

interface ErrorSegment {
  name: string;
  value: number;
}

interface ErrorTypeChartProps {
  data: ErrorSegment[];
}

const CATEGORY_COLORS: Record<string, string> = {
  "Fuel Surcharge errors": "#2DD4BF", // teal
  "Weight errors": "#F59E0B",         // amber
  "Accessorial errors": "#EF4444",    // red
  "Other": "#475569"                  // slate
};

export default function ErrorTypeChart({ data }: ErrorTypeChartProps) {
  const chartData = useMemo(() => {
    // Filter out zero value segments to avoid visual rendering bugs
    return data.filter(d => d.value > 0);
  }, [data]);

  const total = useMemo(() => {
    return chartData.reduce((acc, curr) => acc + curr.value, 0);
  }, [chartData]);

  return (
    <div 
      className="bg-[#111827] border border-teal-900/40 rounded-xl p-6 space-y-4 flex flex-col justify-between h-full" 
      id="error-type-breakdown-piechart-card"
    >
      <div className="space-y-1">
        <h3 className="text-sm font-black tracking-tight text-white font-display uppercase">
          Error Type Breakdown
        </h3>
        <p className="text-[10px] text-[#94A3B8] font-mono">
          AGGREGATE CONTRACT COMPLIANCE ERRORS BY TARIFF CATEGORIES
        </p>
      </div>

      <div className="h-[210px] w-full mt-2 relative flex items-center justify-center">
        {chartData.length === 0 ? (
          <div className="text-[#475569] font-mono text-center text-xs">
            No discrepancy categories found.
          </div>
        ) : (
          <>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={chartData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={4}
                  dataKey="value"
                >
                  {chartData.map((entry, index) => {
                    const color = CATEGORY_COLORS[entry.name] || "#475569";
                    return (
                      <Cell 
                        key={`cell-${index}`} 
                        fill={color} 
                        stroke="#111827"
                        strokeWidth={2}
                      />
                    );
                  })}
                </Pie>
                <Tooltip
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      const entry = payload[0].payload as ErrorSegment;
                      const color = CATEGORY_COLORS[entry.name] || "#475569";
                      const pct = total > 0 ? ((entry.value / total) * 100).toFixed(1) : "0.0";
                      return (
                        <div className="bg-[#111827] border border-[#1F2D45] rounded-xl p-3 shadow-2xl font-mono text-xs text-left min-w-[170px]">
                          <p className="font-bold font-sans text-[11px] mb-1 uppercase" style={{ color }}>
                            {entry.name}
                          </p>
                          <div className="flex justify-between text-zinc-400 mt-1">
                            <span>Total Delta:</span>
                            <span className="text-white font-bold">${entry.value.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
                          </div>
                          <div className="flex justify-between text-zinc-400">
                            <span>Percentage:</span>
                            <span className="text-white font-black">{pct}%</span>
                          </div>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
            
            {/* Display total inside the custom cutout donut center */}
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none select-none">
              <span className="text-[9px] font-bold text-[#94A3B8] font-mono uppercase tracking-widest leading-none">Total Delta</span>
              <span className="text-lg font-black font-mono text-[#EF4444] mt-1">
                ${total.toLocaleString('en-US', { maximumFractionDigits: 0 })}
              </span>
            </div>
          </>
        )}
      </div>

      {/* Custom Legend Layout below Chart segments */}
      <div className="grid grid-cols-2 gap-3 pt-3 border-t border-[#1F2D45]/40 text-[10px] font-mono" id="error-type-custom-legend">
        {data.map((item) => {
          const color = CATEGORY_COLORS[item.name] || "#475569";
          const pct = total > 0 ? ((item.value / total) * 100).toFixed(0) : "0";
          return (
            <div key={item.name} className="flex items-start gap-1.5 justify-between">
              <div className="flex items-center gap-1.5 truncate">
                <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: color }} />
                <span className="text-[#94A3B8] truncate uppercase">{item.name.replace(" errors", "")}</span>
              </div>
              <span className="text-zinc-400 font-bold shrink-0">{pct}%</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
