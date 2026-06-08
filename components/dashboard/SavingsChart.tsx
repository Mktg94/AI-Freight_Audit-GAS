"use client";

import React from 'react';
import { 
  ResponsiveContainer, AreaChart, Area, XAxis, YAxis, 
  CartesianGrid, Tooltip, Legend 
} from 'recharts';

interface SavingsChartProps {
  data?: Array<{
    month: string;
    billed: number;
    approved: number;
    savings: number;
  }>;
}

const defaultChartData = [
  { month: 'Jan', billed: 45000, approved: 42000, savings: 3000 },
  { month: 'Feb', billed: 52000, approved: 47500, savings: 4500 },
  { month: 'Mar', billed: 49000, approved: 44000, savings: 5000 },
  { month: 'Apr', billed: 63000, approved: 56000, savings: 7000 },
  { month: 'May', billed: 58000, approved: 51200, savings: 6800 },
  { month: 'Jun', billed: 67100, approved: 59300, savings: 7800 }
];

export default function SavingsChart({ data = defaultChartData }: SavingsChartProps) {
  // Format currency helpers for the chart ticks
  const formatCurrency = (val: number) => {
    if (val >= 1000) {
      return `$${(val / 1000).toFixed(0)}k`;
    }
    return `$${val}`;
  };

  return (
    <div 
      className="bg-[#111827] border border-teal-900/40 rounded-xl p-6 space-y-4" 
      id="savings-trend-chart-card"
    >
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-sm font-bold tracking-tight text-white font-display uppercase">
            Savings Trend
          </h3>
          <p className="text-[10px] text-[#94A3B8] font-mono">
            COMPARING CARRIER INVOICED BASE COSTS VS AUDITED EXPECTED CHARGES
          </p>
        </div>
        <div className="flex items-center gap-3 font-mono text-[9px] font-bold">
          <div className="flex items-center gap-1">
            <span className="w-2.5 h-2.5 rounded bg-[#475569]" />
            <span className="text-[#94A3B8]">TOTAL BILLED</span>
          </div>
          <div className="flex items-center gap-1">
            <span className="w-2.5 h-2.5 rounded bg-[#2DD4BF] shadow-[0_0_10px_rgba(45,212,191,0.4)]" />
            <span className="text-[#2DD4BF]">APPROVED AMOUNT</span>
          </div>
        </div>
      </div>

      <div className="h-[280px] w-full mt-2">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart
            data={data}
            margin={{ top: 10, right: 10, left: -25, bottom: 0 }}
          >
            <defs>
              <linearGradient id="approvedGlow" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#2DD4BF" stopOpacity={0.25}/>
                <stop offset="95%" stopColor="#2DD4BF" stopOpacity={0.0}/>
              </linearGradient>
              <linearGradient id="billedGlow" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#475569" stopOpacity={0.1}/>
                <stop offset="95%" stopColor="#475569" stopOpacity={0.0}/>
              </linearGradient>
            </defs>
            <CartesianGrid 
              strokeDasharray="3 3" 
              stroke="#1F2D45" 
              vertical={false} 
            />
            <XAxis 
              dataKey="month" 
              stroke="#475569" 
              fontSize={9} 
              tickLine={false} 
              axisLine={false}
              dy={10}
              className="font-mono text-[9px]"
            />
            <YAxis 
              stroke="#475569" 
              fontSize={9} 
              tickLine={false} 
              axisLine={false}
              tickFormatter={formatCurrency}
              dx={-5}
              className="font-mono text-[9px]"
            />
            <Tooltip
              contentStyle={{ 
                backgroundColor: '#111827', 
                borderColor: '#1F2D45', 
                borderRadius: '8px',
                boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.5)',
                fontSize: '11px',
                fontFamily: 'monospace'
              }}
              formatter={(value: any, name: any) => {
                const label = name === 'billed' ? 'Total Billed' : 'Approved Amount';
                const color = name === 'billed' ? '#94A3B8' : '#2DD4BF';
                return [
                  <span style={{ color }}>${Number(value).toLocaleString()}</span>,
                  label
                ];
              }}
              labelStyle={{ color: '#F1F5F9', fontWeight: 'bold', marginBottom: '4px' }}
            />
            <Area 
              type="monotone" 
              dataKey="billed" 
              stroke="#475569" 
              strokeWidth={2}
              fillOpacity={1} 
              fill="url(#billedGlow)" 
            />
            <Area 
              type="monotone" 
              dataKey="approved" 
              stroke="#2DD4BF" 
              strokeWidth={2}
              fillOpacity={1} 
              fill="url(#approvedGlow)" 
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
