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
      className="bg-white border border-gray-100 rounded-2xl p-6 space-y-4 shadow-sm" 
      id="monthly-billing-area-chart-card"
      style={{ backgroundColor: 'var(--card-surface)', borderColor: 'var(--card-border)' }}
    >
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
        <div>
          <h3 className="text-sm font-semibold tracking-tight text-gray-900 flex items-center gap-2" style={{ color: 'var(--text-title)' }}>
            <span>Monthly Billing vs Approved</span>
            <span className="text-[11px] font-mono py-0.5 px-2 bg-green-50 text-green-700 rounded-full border border-green-200 font-semibold">
              Saved {totals.savings.toLocaleString('en-US', { style: 'currency', currency: 'USD' })}
            </span>
          </h3>
          <p className="text-[10px] text-gray-500 font-mono mt-0.5" style={{ color: 'var(--text-body)' }}>
            Audit delta timeline indicating negotiated rates versus invoiced billing
          </p>
        </div>
        <div className="flex items-center gap-4 font-mono text-[9px] font-semibold shrink-0">
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded bg-gray-300 opacity-70" />
            <span className="text-gray-400" style={{ color: 'var(--text-muted)' }}>TOTAL BILLED</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded bg-indigo-500" style={{ backgroundColor: 'var(--accent-color)' }} />
            <span className="text-indigo-600 font-semibold" style={{ color: 'var(--accent-color)' }}>TOTAL APPROVED</span>
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
                <stop offset="5%" stopColor="var(--accent-color)" stopOpacity={0.4}/>
                <stop offset="95%" stopColor="var(--accent-color)" stopOpacity={0.0}/>
              </linearGradient>
              <linearGradient id="billedGlowArea" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#9CA3AF" stopOpacity={0.3}/>
                <stop offset="95%" stopColor="#9CA3AF" stopOpacity={0.0}/>
              </linearGradient>
            </defs>
            <CartesianGrid 
              strokeDasharray="3 3" 
              stroke="#E5E7EB" 
              style={{ stroke: 'var(--chart-grid)' }}
              vertical={false} 
            />
            <XAxis 
              dataKey="month" 
              stroke="#9CA3AF" 
              style={{ stroke: 'var(--chart-axis)' }}
              fontSize={9} 
              tickLine={false} 
              axisLine={false}
              dy={10}
              className="font-mono text-[9px]"
            />
            <YAxis 
              stroke="#9CA3AF" 
              style={{ stroke: 'var(--chart-axis)' }}
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
                    <div 
                      className="bg-white border border-gray-100 rounded-2xl p-3.5 shadow-lg space-y-1.5 min-w-[160px] text-xs font-mono"
                      style={{ backgroundColor: 'var(--tooltip-bg)', borderColor: 'var(--tooltip-border)' }}
                    >
                      <p className="font-semibold font-sans text-[11px] mb-1 tracking-wider uppercase text-gray-900" style={{ color: 'var(--tooltip-text)' }}>{label}</p>
                      <div className="flex justify-between gap-4">
                        <span style={{ color: 'var(--text-body)' }}>Total Billed:</span>
                        <span className="font-bold" style={{ color: 'var(--tooltip-text)' }}>${billedVal.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
                      </div>
                      <div className="flex justify-between gap-4" style={{ color: 'var(--accent-color)' }}>
                        <span>Approved Rate:</span>
                        <span className="font-bold">${approvedVal.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
                      </div>
                      <div className="flex justify-between gap-4 border-t pt-1.5 font-bold text-green-600 border-gray-50" style={{ borderColor: 'var(--chart-grid)' }}>
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
              stroke="#9CA3AF" 
              strokeWidth={1.5}
              fillOpacity={1} 
              fill="url(#billedGlowArea)" 
            />
            <Area 
              type="monotone" 
              dataKey="approved" 
              name="Total Approved"
              stroke="var(--accent-color)" 
              strokeWidth={2}
              fillOpacity={1} 
              fill="url(#approvedGlowArea)" 
              dot={{ r: 3, fill: 'var(--accent-color)', stroke: 'var(--card-surface)', strokeWidth: 1.5 }}
              activeDot={{ r: 5, fill: 'var(--accent-color)', stroke: 'var(--card-surface)', strokeWidth: 2 }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
