import React from 'react';
import { InvoiceStatus } from '@/types';

interface InvoiceStatusBadgeProps {
  status: InvoiceStatus;
}

export default function InvoiceStatusBadge({ status }: InvoiceStatusBadgeProps) {
  const config: Record<InvoiceStatus, { label: string; containerClass: string; dotClass: string }> = {
    pending: {
      label: 'Pending',
      containerClass: 'bg-zinc-800/60 text-zinc-400 border border-zinc-700/50',
      dotClass: 'bg-zinc-500'
    },
    auditing: {
      label: 'Auditing',
      containerClass: 'bg-blue-500/10 text-blue-400 border border-blue-500/20',
      dotClass: 'bg-blue-400 animate-pulse'
    },
    flagged: {
      label: 'Flagged',
      containerClass: 'bg-amber-500/10 text-[#F59E0B] border border-amber-500/20 font-bold',
      dotClass: 'bg-[#F59E0B]'
    },
    approved: {
      label: 'Approved',
      containerClass: 'bg-emerald-500/10 text-[#10B981] border border-emerald-500/20',
      dotClass: 'bg-[#10B981]'
    },
    disputed: {
      label: 'Disputed',
      containerClass: 'bg-red-500/10 text-[#EF4444] border border-red-500/20 font-bold',
      dotClass: 'bg-[#EF4444]'
    }
  };

  const active = config[status] || config.pending;

  return (
    <span 
      className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] uppercase font-bold tracking-wider font-mono ${active.containerClass}`}
      id={`status-badge-${status}`}
    >
      <span className={`h-1.5 w-1.5 rounded-full ${active.dotClass}`} />
      <span>{active.label}</span>
    </span>
  );
}
