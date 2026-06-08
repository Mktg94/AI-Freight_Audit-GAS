"use client";

import React, { useMemo } from 'react';
import { 
  ResponsiveContainer, AreaChart, Area, XAxis, YAxis, 
  CartesianGrid, Tooltip 
} from 'recharts';

interface MonthData {
  month: string;
  billed: number;
  approved: number;
}

interface SavingsAreaChartProps {
  data: MonthData[];
}

export default function SavingsAreaChart({ data }: SavingsAreaChartProps) {
  // Format currency helpers for the chart ticks
  const formatCurrency = (val: number) => {
    if (val >= 1000) {
      return `$${(val / 1000).toFixed(0)}k`;
    }
    return `$${val}`;
  };

  const totals = useMemo(() => {
    let totBilled = 0;
    let totApproved = 0;
    data.forEach(d => {
      totBilled += d.billed;
      totApproved += d.approved;
    });
    const delta = totBilled - totApproved;
    return {
      billed: totBilled,
      approved: totApproved,
      savings: delta > 0 ? delta : 0
    };
  }, [data]);

  return (
    <div 
      className="bg-[#111827] border border-teal-900/40 rounded-xl p-6 space-y-4" 
      id="monthly-billing-area-chart-card"
    >
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
        <div>
          <h3 className="text-sm font-black tracking-tight text-white font-display uppercase flex items-center gap-2">
            <span>Monthly Billing vs Approved</span>
            <span className="text-[11px] font-mono py-0.5 px-2 bg-[#10B981]/15 text-[#10B981] rounded-full border border-emerald-500/10 font-black">
              Saved {totals.savings.toLocaleString('en-US', { style: 'currency', currency: 'USD' })}
            </span>
          </h3>
          <p className="text-[10px] text-[#94A3B8] font-mono uppercase mt-0.5">
            Audit delta timeline indicating negotiated rates versus invoiced billing
          </p>
        </div>
        <div className="flex items-center gap-4 font-mono text-[9px] font-bold shrink-0">
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded bg-[#475569] opacity-70" />
            <span className="text-[#94A3B8]">TOTAL BILLED</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded bg-[#2DD4BF] shadow-[0_0_10px_rgba(45,212,191,0.4)]" />
            <span className="text-[#2DD4BF]">TOTAL APPROVED</span>
          </div>
        </div>
      </div>

      <div className="h-[280px] w-full mt-2" id="savings-area-chart-responsive-deck">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart
            data={data}
            margin={{ top: 15, right: 10, left: -25, bottom: 0 }}
          >
            <defs>
              <linearGradient id="approvedGlowArea" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#2DD4BF" stopOpacity={0.4}/>
                <stop offset="95%" stopColor="#2DD4BF" stopOpacity={0.0}/>
              </linearGradient>
              <linearGradient id="billedGlowArea" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#475569" stopOpacity={0.3}/>
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
              stroke="#94A3B8" 
              fontSize={9} 
              tickLine={false} 
              axisLine={false}
              dy={10}
              className="font-mono text-[9px]"
            />
            <YAxis 
              stroke="#94A3B8" 
              fontSize={9} 
              tickLine={false} 
              axisLine={false}
              tickFormatter={formatCurrency}
              dx={-5}
              className="font-mono text-[9px]"
            />
            <Tooltip
              content={({ active, payload, label }) => {
                if (active && payload && payload.length) {
                  const billedVal = Number(payload[0]?.value || 0);
                  const approvedVal = Number(payload[1]?.value || 0);
                  const savingsVal = billedVal - approvedVal;
                  return (
                    <div className="bg-[#111827] border border-[#1F2D45] rounded-xl p-3.5 shadow-2xl space-y-1.5 min-w-[160px] text-xs font-mono">
                      <p className="text-white font-bold font-sans text-[11px] mb-1 tracking-wider uppercase">{label}</p>
                      <div className="flex justify-between gap-4 text-zinc-400">
                        <span>Total Billed:</span>
                        <span className="text-slate-200 font-bold">${billedVal.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
                      </div>
                      <div className="flex justify-between gap-4 text-[#2DD4BF]">
                        <span>Approved Rate:</span>
                        <span className="font-extrabold">${approvedVal.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
                      </div>
                      <div className="flex justify-between gap-4 border-t border-[#1F2D45]/60 pt-1.5 text-[#10B981] font-bold">
                        <span>Savings Saved:</span>
                        <span className="font-black">${(savingsVal > 0 ? savingsVal : 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
                      </div>
                    </div>
                  );
                }
                return null;
              }}
            />
            <Area 
              type="monotone" 
              dataKey="billed" 
              name="Total Billed"
              stroke="#475569" 
              strokeWidth={1.5}
              fillOpacity={1} 
              fill="url(#billedGlowArea)" 
            />
            <Area 
              type="monotone" 
              dataKey="approved" 
              name="Total Approved"
              stroke="#2DD4BF" 
              strokeWidth={2}
              fillOpacity={1} 
              fill="url(#approvedGlowArea)" 
              dot={{ r: 3, fill: '#2DD4BF', stroke: '#111827', strokeWidth: 1.5 }}
              activeDot={{ r: 5, fill: '#2DD4BF', stroke: '#111827', strokeWidth: 2 }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
