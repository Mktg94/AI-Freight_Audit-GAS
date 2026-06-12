"use client";

import React from 'react';
import { 
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, 
  CartesianGrid, Tooltip, Cell 
} from 'recharts';

interface CarrierData {
  carrier: string;
  discrepancy: number;
  disputedInvoiceCount: number;
}

interface CarrierDiscrepancyChartProps {
  data: CarrierData[];
}

export default function CarrierDiscrepancyChart({ data }: CarrierDiscrepancyChartProps) {
  const formatCurrency = (val: number) => {
    return `$${val.toLocaleString('en-US', { maximumFractionDigits: 0 })}`;
  };

  return (
    <div 
      className="bg-white border border-gray-100 rounded-2xl p-6 space-y-4 shadow-sm" 
      id="carrier-discrepancy-barchart-card"
      style={{ backgroundColor: 'var(--card-surface)', borderColor: 'var(--card-border)' }}
    >
      <div>
        <h3 className="text-sm font-semibold tracking-tight text-gray-900" style={{ color: 'var(--text-title)' }}>
          Top Carriers by Overcharge
        </h3>
        <p className="text-[10px] text-gray-500 font-mono mt-0.5" style={{ color: 'var(--text-body)' }}>
          TOTAL DISCREPANCY AUDIT DELTA AND ACTIVE CLAIMS COUNT
        </p>
      </div>

      <div className="h-[250px] w-full text-xs">
        {data.length === 0 ? (
          <div className="h-full flex items-center justify-center text-gray-400 font-mono text-center" style={{ color: 'var(--text-muted)' }}>
            No discrepant carriers in this filter range.
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={data}
              layout="vertical"
              margin={{ top: 5, right: 15, left: -10, bottom: 5 }}
            >
              <CartesianGrid 
                strokeDasharray="3 3" 
                stroke="#E5E7EB" 
                style={{ stroke: 'var(--chart-grid)' }}
                horizontal={false} 
              />
              <XAxis 
                type="number"
                stroke="#9CA3AF" 
                style={{ stroke: 'var(--chart-axis)' }}
                fontSize={9} 
                tickLine={false} 
                axisLine={false}
                tickFormatter={formatCurrency}
                className="font-mono text-[9px]"
              />
              <YAxis 
                type="category"
                dataKey="carrier" 
                stroke="#9CA3AF" 
                style={{ stroke: 'var(--chart-axis)' }}
                fontSize={9} 
                tickLine={false} 
                axisLine={false}
                width={85}
                className="font-mono text-[9px]"
              />
              <Tooltip
                content={({ active, payload }) => {
                  if (active && payload && payload.length) {
                    const entry = payload[0].payload as CarrierData;
                    const isAlert = entry.disputedInvoiceCount > 3;
                    return (
                      <div 
                        className="bg-white border border-gray-100 rounded-2xl p-3 shadow-lg space-y-1 font-mono text-xs text-left min-w-[170px]"
                        style={{ backgroundColor: 'var(--tooltip-bg)', borderColor: 'var(--tooltip-border)' }}
                      >
                        <p className="font-semibold font-sans text-[11px] mb-1 truncate uppercase text-gray-900" style={{ color: 'var(--tooltip-text)' }}>{entry.carrier}</p>
                        <div className="flex justify-between gap-3">
                          <span style={{ color: 'var(--text-body)' }}>Overcharged:</span>
                          <span className="text-red-500 font-bold">${entry.discrepancy.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
                        </div>
                        <div className="flex justify-between gap-3">
                          <span style={{ color: 'var(--text-body)' }}>Disputed:</span>
                          <span className={`${isAlert ? 'text-amber-600' : ''} font-bold`} style={isAlert ? {} : { color: 'var(--accent-color)' }}>
                            {entry.disputedInvoiceCount} invoices
                          </span>
                        </div>
                      </div>
                    );
                  }
                  return null;
                }}
              />
              <Bar 
                dataKey="discrepancy" 
                radius={[0, 4, 4, 0]}
                barSize={12}
              >
                {data.map((entry, index) => {
                  const hasManyDisputes = entry.disputedInvoiceCount > 3;
                  return (
                    <Cell 
                      key={`cell-${index}`} 
                      fill={hasManyDisputes ? '#F59E0B' : 'var(--accent-color)'} 
                    />
                  );
                })}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>

      <div className="flex justify-start gap-4 font-mono text-[9px] font-semibold mt-2">
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded" style={{ backgroundColor: 'var(--accent-color)' }} />
          <span className="text-gray-400" style={{ color: 'var(--text-muted)' }}>STANDARD PARTNER (&le; 3 DISPUTES)</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded bg-amber-500" />
          <span className="text-amber-600" style={{ color: '#D97706' }}>CRITICAL DISPUTE BURDEN (&gt; 3 DISPUTES)</span>
        </div>
      </div>
    </div>
  );
}
