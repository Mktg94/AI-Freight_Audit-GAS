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
  "Fuel Surcharge errors": "var(--accent-color)",
  "Weight errors": "#F59E0B",
  "Accessorial errors": "#EF4444",
  "Other": "#9CA3AF"
};

export default function ErrorTypeChart({ data }: ErrorTypeChartProps) {
  const chartData = useMemo(() => {
    return data.filter(d => d.value > 0);
  }, [data]);

  const total = useMemo(() => {
    return chartData.reduce((acc, curr) => acc + curr.value, 0);
  }, [chartData]);

  return (
    <div 
      className="bg-white border border-gray-100 rounded-2xl p-6 space-y-4 flex flex-col justify-between h-full shadow-sm" 
      id="error-type-breakdown-piechart-card"
      style={{ backgroundColor: 'var(--card-surface)', borderColor: 'var(--card-border)' }}
    >
      <div className="space-y-1">
        <h3 className="text-sm font-semibold tracking-tight text-gray-900" style={{ color: 'var(--text-title)' }}>
          Error Type Breakdown
        </h3>
        <p className="text-[10px] text-gray-500 font-mono" style={{ color: 'var(--text-body)' }}>
          AGGREGATE CONTRACT COMPLIANCE ERRORS BY TARIFF CATEGORIES
        </p>
      </div>

      <div className="h-[210px] w-full mt-2 relative flex items-center justify-center">
        {chartData.length === 0 ? (
          <div className="text-gray-400 font-mono text-center text-xs" style={{ color: 'var(--text-muted)' }}>
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
                    const color = CATEGORY_COLORS[entry.name] || "#9CA3AF";
                    return (
                      <Cell 
                        key={`cell-${index}`} 
                        fill={color} 
                        stroke="var(--card-surface)"
                        strokeWidth={2}
                      />
                    );
                  })}
                </Pie>
                <Tooltip
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      const entry = payload[0].payload as ErrorSegment;
                      const color = CATEGORY_COLORS[entry.name] || "#9CA3AF";
                      const pct = total > 0 ? ((entry.value / total) * 100).toFixed(1) : "0.0";
                      return (
                        <div 
                          className="bg-white border border-gray-100 rounded-2xl p-3 shadow-lg font-mono text-xs text-left min-w-[170px]"
                          style={{ backgroundColor: 'var(--tooltip-bg)', borderColor: 'var(--tooltip-border)' }}
                        >
                          <p className="font-semibold font-sans text-[11px] mb-1 uppercase" style={{ color }}>
                            {entry.name}
                          </p>
                          <div className="flex justify-between mt-1">
                            <span style={{ color: 'var(--text-body)' }}>Total Delta:</span>
                            <span className="font-bold" style={{ color: 'var(--tooltip-text)' }}>${entry.value.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
                          </div>
                          <div className="flex justify-between">
                            <span style={{ color: 'var(--text-body)' }}>Percentage:</span>
                            <span className="font-black" style={{ color: 'var(--tooltip-text)' }}>{pct}%</span>
                          </div>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
            
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none select-none">
              <span className="text-[9px] font-semibold text-gray-400 font-mono uppercase tracking-widest leading-none" style={{ color: 'var(--text-muted)' }}>Total Delta</span>
              <span className="text-lg font-bold font-mono text-red-500 mt-1">
                ${total.toLocaleString('en-US', { maximumFractionDigits: 0 })}
              </span>
            </div>
          </>
        )}
      </div>

      <div className="grid grid-cols-2 gap-3 pt-3 border-t text-[10px] font-mono border-gray-100" id="error-type-custom-legend" style={{ borderColor: 'var(--chart-grid)' }}>
        {data.map((item) => {
          const color = CATEGORY_COLORS[item.name] || "#9CA3AF";
          const pct = total > 0 ? ((item.value / total) * 100).toFixed(0) : "0";
          return (
            <div key={item.name} className="flex items-start gap-1.5 justify-between">
              <div className="flex items-center gap-1.5 truncate">
                <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: color }} />
                <span className="text-gray-400 truncate uppercase" style={{ color: 'var(--text-muted)' }}>{item.name.replace(" errors", "")}</span>
              </div>
              <span className="text-gray-500 font-semibold shrink-0" style={{ color: 'var(--text-body)' }}>{pct}%</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
