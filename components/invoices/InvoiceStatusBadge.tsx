import React from 'react';
import { InvoiceStatus } from '@/types';

interface InvoiceStatusBadgeProps {
  status: InvoiceStatus;
}

export default function InvoiceStatusBadge({ status }: InvoiceStatusBadgeProps) {
  const config: Record<InvoiceStatus, { label: string; containerClass: string; dotClass: string }> = {
    pending: {
      label: 'Pending',
      containerClass: 'bg-gray-50 text-gray-600 border-gray-200',
      dotClass: 'bg-gray-500'
    },
    auditing: {
      label: 'Auditing',
      containerClass: 'bg-blue-50 text-blue-700 border-blue-200',
      dotClass: 'bg-blue-500 animate-pulse'
    },
    flagged: {
      label: 'Flagged',
      containerClass: 'bg-amber-50 text-amber-700 border-amber-200',
      dotClass: 'bg-amber-500'
    },
    approved: {
      label: 'Approved',
      containerClass: 'bg-green-50 text-green-700 border-green-200',
      dotClass: 'bg-green-600'
    },
    disputed: {
      label: 'Disputed',
      containerClass: 'bg-red-50 text-red-600 border-red-200',
      dotClass: 'bg-red-500'
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
