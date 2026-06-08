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
      className="bg-[#111827] border border-teal-900/40 rounded-xl p-6 space-y-4" 
      id="carrier-discrepancy-barchart-card"
    >
      <div>
        <h3 className="text-sm font-black tracking-tight text-white font-display uppercase">
          Top Carriers by Overcharge
        </h3>
        <p className="text-[10px] text-[#94A3B8] font-mono mt-0.5">
          TOTAL DISCREPANCY AUDIT DELTA AND ACTIVE CLAIMS COUNT
        </p>
      </div>

      <div className="h-[250px] w-full text-xs">
        {data.length === 0 ? (
          <div className="h-full flex items-center justify-center text-[#475569] font-mono text-center">
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
                stroke="#1F2D45" 
                horizontal={false} 
              />
              <XAxis 
                type="number"
                stroke="#94A3B8" 
                fontSize={9} 
                tickLine={false} 
                axisLine={false}
                tickFormatter={formatCurrency}
                className="font-mono text-[9px]"
              />
              <YAxis 
                type="category"
                dataKey="carrier" 
                stroke="#94A3B8" 
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
                      <div className="bg-[#111827] border border-[#1F2D45] rounded-xl p-3 shadow-2xl space-y-1 font-mono text-xs text-left min-w-[170px]">
                        <p className="text-white font-bold font-sans text-[11px] mb-1 truncate uppercase">{entry.carrier}</p>
                        <div className="flex justify-between text-zinc-400 gap-3">
                          <span>Overcharged:</span>
                          <span className="text-[#EF4444] font-bold">${entry.discrepancy.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
                        </div>
                        <div className="flex justify-between gap-3 text-zinc-400">
                          <span>Disputed:</span>
                          <span className={`${isAlert ? 'text-[#F59E0B]' : 'text-[#2DD4BF]'} font-bold`}>
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
                      fill={hasManyDisputes ? '#F59E0B' : '#2DD4BF'} 
                    />
                  );
                })}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>

      <div className="flex justify-start gap-4 font-mono text-[9px] font-bold mt-2">
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded bg-[#2DD4BF]" />
          <span className="text-[#94A3B8]">STANDARD PARTNER (&le; 3 DISPUTES)</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded bg-[#F59E0B]" />
          <span className="text-[#F59E0B]">CRITICAL DISPUTE BURDEN (&gt; 3 DISPUTES)</span>
        </div>
      </div>
    </div>
  );
}
