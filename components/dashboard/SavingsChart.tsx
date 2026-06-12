"use client";

import React from 'react';
import { 
  ResponsiveContainer, AreaChart, Area, XAxis, YAxis, 
  CartesianGrid, Tooltip, Legend 
} from 'recharts';

interface SavingsChartProps {
  data: Array<{
    month: string;
    billed: number;
    approved: number;
    savings: number;
  }>;
}

export default function SavingsChart({ data }: SavingsChartProps) {
  // Format currency helpers for the chart ticks
  const formatCurrency = (val: number) => {
    if (val >= 1000) {
      return `$${(val / 1000).toFixed(0)}k`;
    }
    return `$${val}`;
  };

  return (
    <div
      className="bg-white rounded-2xl border border-gray-100 p-6 space-y-4"
      id="savings-trend-chart-card"
    >
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-sm font-semibold text-gray-900">Savings Trend</h3>
          <p className="text-xs text-gray-400 mt-0.5 font-mono">
            COMPARING CARRIER INVOICED BASE COSTS VS AUDITED EXPECTED CHARGES
          </p>
        </div>
      </div>

      {!data || data.length === 0 ? (
        <div className="h-[280px] flex items-center justify-center text-gray-400 font-mono text-xs">
          No savings data yet. Upload invoices to see your savings trend.
        </div>
      ) : (
      <div className="h-[280px] w-full mt-2">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart
            data={data}
            margin={{ top: 10, right: 10, left: -25, bottom: 0 }}
          >
            <defs>
              <linearGradient id="approvedGlow" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#4F46E5" stopOpacity={0.25} />
                <stop offset="95%" stopColor="#4F46E5" stopOpacity={0.0} />
              </linearGradient>
              <linearGradient id="billedGlow" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#E5E7EB" stopOpacity={1} />
                <stop offset="95%" stopColor="#E5E7EB" stopOpacity={0.0} />
              </linearGradient>
            </defs>

            <CartesianGrid stroke="#F3F4F6" vertical={false} />

            <XAxis
              dataKey="month"
              tick={{ fill: '#9CA3AF', fontSize: 11, fontFamily: 'monospace' }}
              axisLine={false}
              tickLine={false}
            />

            <YAxis
              tick={{ fill: '#9CA3AF', fontSize: 11, fontFamily: 'monospace' }}
              axisLine={false}
              tickLine={false}
              tickFormatter={formatCurrency}
            />

            <Tooltip
              contentStyle={{
                backgroundColor: '#fff',
                border: '1px solid #F3F4F6',
                borderRadius: '12px',
                fontSize: '12px',
                fontFamily: 'monospace',
                boxShadow: '0 4px 12px rgba(0,0,0,0.05)',
              }}
              formatter={(value: any, name: any) => {
                const label = name === 'billed' ? 'Total Billed' : 'Approved';
                return [
                  <span style={{ color: name === 'billed' ? '#9CA3AF' : '#4F46E5' }}>
                    ${Number(value).toLocaleString()}
                  </span>,
                  label,
                ];
              }}
            />

            <Area
              type="monotone"
              dataKey="billed"
              stroke="#E5E7EB"
              strokeWidth={2}
              fillOpacity={1}
              fill="#F9FAFB"
            />

            <Area
              type="monotone"
              dataKey="approved"
              stroke="#4F46E5"
              strokeWidth={2}
              fillOpacity={0.6}
              fill="#EEF2FF"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
      )}
    </div>
  );
}
