"use client";

import React, { useState, useMemo } from 'react';
import {
  useReactTable,
  getCoreRowModel,
  flexRender,
  createColumnHelper,
} from '@tanstack/react-table';
import { Check, AlertTriangle, Loader2 } from 'lucide-react';
import { LineItem, Contract } from '@/types';
import ConfidenceBar from '../shared/ConfidenceBar';
import InvoiceStatusBadge from './InvoiceStatusBadge';
import AuditResultPanel from './AuditResultPanel';

interface LineItemTableProps {
  lineItems: LineItem[];
  contract: Contract | null;
  onLineItemUpdated: (updatedLine: LineItem) => void;
}

const columnHelper = createColumnHelper<LineItem>();

export default function LineItemTable({
  lineItems,
  contract,
  onLineItemUpdated
}: LineItemTableProps) {
  const [selectedLineItem, setSelectedLineItem] = useState<LineItem | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);

  // Triggering inline fast actions
  const handleQuickStatusUpdate = async (e: React.MouseEvent, itemId: string, newStatus: 'approved' | 'disputed') => {
    e.stopPropagation(); // Avoid triggering row selection drawer
    setActionLoadingId(`${itemId}-${newStatus}`);

    try {
      const response = await fetch(`/api/line-items/${itemId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ status: newStatus })
      });

      if (!response.ok) {
        throw new Error(await response.text() || 'Failed to update item.');
      }

      const result = await response.json();
      if (result.success && result.lineItem) {
        onLineItemUpdated(result.lineItem);
        
        // Throw global toast notification
        window.dispatchEvent(new CustomEvent('show-toast', {
          detail: {
            title: newStatus === 'approved' ? 'Compliance Approved' : 'Dispute Flagged',
            message: `Invoice item marked as ${newStatus} successfully.`
          }
        }));
      }
    } catch (err) {
      console.error("Quick status action error:", err);
    } finally {
      setActionLoadingId(null);
    }
  };

  // Define columns in alignment with the requested design sheet
  const columns = useMemo(() => [
    columnHelper.accessor('description', {
      header: 'Description',
      cell: (info) => (
        <span className="font-semibold text-white tracking-tight uppercase text-xs">
          {info.getValue()}
        </span>
      ),
    }),
    columnHelper.accessor('billed_amount', {
      header: 'Billed ($)',
      cell: (info) => (
        <span className="font-mono font-bold text-white">
          ${info.getValue().toFixed(2)}
        </span>
      ),
    }),
    columnHelper.accessor('expected_amount', {
      header: 'Expected ($)',
      cell: (info) => (
        <span className="font-mono font-bold text-teal-400">
          ${info.getValue().toFixed(2)}
        </span>
      ),
    }),
    columnHelper.accessor('discrepancy', {
      header: 'Discrepancy ($)',
      cell: (info) => {
        const val = info.getValue();
        if (val > 0) {
          return <span className="font-mono font-extrabold text-[#EF4444]">+${val.toFixed(2)}</span>;
        } else if (val < 0) {
          return <span className="font-mono font-extrabold text-[#10B981]">-${Math.abs(val).toFixed(2)}</span>;
        }
        return <span className="font-mono text-zinc-500">$0.00</span>;
      },
    }),
    columnHelper.accessor('confidence_score', {
      header: 'AI Confidence',
      cell: (info) => (
        <div className="w-24">
          <ConfidenceBar score={info.getValue()} showLabel />
        </div>
      ),
    }),
    columnHelper.accessor('ai_flag_reason', {
      header: 'Flag Reason',
      cell: (info) => {
        const val = info.getValue() || '';
        const isTruncated = val.length > 60;
        const dispText = isTruncated ? `${val.substring(0, 60)}...` : val || '—';
        return (
          <span 
            className="text-[11px] text-[#94A3B8] block max-w-xs truncate cursor-help"
            title={val || undefined}
          >
            {dispText}
          </span>
        );
      },
    }),
    columnHelper.accessor('status', {
      header: 'Status',
      cell: (info) => {
        const value = info.getValue();
        // Fallback or safety mapping to ensure InvoiceStatus compatibility
        const statusVal = value === 'pending' ? 'pending' : value === 'approved' ? 'approved' : 'disputed';
        return <InvoiceStatusBadge status={statusVal} />;
      },
    }),
    columnHelper.display({
      id: 'actions',
      header: 'Actions',
      cell: (info) => {
        const rowData = info.row.original;
        const isApproveLoading = actionLoadingId === `${rowData.id}-approved`;
        const isDisputeLoading = actionLoadingId === `${rowData.id}-disputed`;

        return (
          <div className="flex gap-2" onClick={(e) => e.stopPropagation()}>
            {rowData.status !== 'approved' && (
              <button
                onClick={(e) => handleQuickStatusUpdate(e, rowData.id, 'approved')}
                disabled={actionLoadingId !== null}
                className="flex items-center gap-1 px-2.5 py-1 text-[10px] bg-emerald-500/10 hover:bg-emerald-500 hover:text-black border border-emerald-500/30 text-[#10B981] font-bold font-mono uppercase rounded transition-all cursor-pointer disabled:opacity-50"
              >
                {isApproveLoading ? (
                  <Loader2 size={10} className="animate-spin text-emerald-400" />
                ) : (
                  <Check size={10} />
                )}
                <span>Approve</span>
              </button>
            )}

            {rowData.status !== 'disputed' && (
              <button
                onClick={(e) => handleQuickStatusUpdate(e, rowData.id, 'disputed')}
                disabled={actionLoadingId !== null}
                className="flex items-center gap-1 px-2.5 py-1 text-[10px] bg-red-500/10 hover:bg-red-500 hover:text-white border border-red-500/30 text-[#EF4444] font-bold font-mono uppercase rounded transition-all cursor-pointer disabled:opacity-50"
              >
                {isDisputeLoading ? (
                  <Loader2 size={10} className="animate-spin text-red-400" />
                ) : (
                  <AlertTriangle size={10} />
                )}
                <span>Dispute</span>
              </button>
            )}
          </div>
        );
      },
    }),
  ], [actionLoadingId]);

  const table = useReactTable({
    data: lineItems,
    columns,
    getCoreRowModel: getCoreRowModel(),
  });

  const handleRowSelect = (row: LineItem) => {
    setSelectedLineItem(row);
    setIsDrawerOpen(true);
  };

  const handleStatusUpdatedInDrawer = (updatedRow: LineItem) => {
    onLineItemUpdated(updatedRow);
  };

  return (
    <div className="w-full space-y-4" id="line-items-database-table">
      <div className="overflow-hidden border border-[#1F2D45] rounded-xl bg-[#111827]">
        <table className="w-full text-left border-collapse" role="table">
          <thead>
            {table.getHeaderGroups().map((headerGroup) => (
              <tr 
                key={headerGroup.id} 
                className="border-b border-[#1F2D45] bg-[#0E1324] text-[#94A3B8] text-[10px] font-bold uppercase tracking-wider font-mono"
              >
                {headerGroup.headers.map((header) => (
                  <th key={header.id} className="py-3.5 px-4 font-mono">
                    {header.isPlaceholder
                      ? null
                      : flexRender(
                          header.column.columnDef.header,
                          header.getContext()
                        )}
                  </th>
                ))}
              </tr>
            ))}
          </thead>
          <tbody>
            {table.getRowModel().rows.map((row) => {
              const rowStatus = row.original.status;
              const hasDiscrepancy = row.original.discrepancy > 0;
              
              // Resolve background classes
              let rowBgClass = 'hover:bg-[#1C2537]/20 border-b border-[#1F2D45]/40 transition-colors cursor-pointer';
              if (rowStatus === 'pending' || hasDiscrepancy) {
                rowBgClass = 'bg-amber-950/15 hover:bg-amber-950/25 border-l-2 border-amber-500 border-b border-[#1F2D45]/40 transition-colors cursor-pointer';
              } else if (rowStatus === 'approved') {
                rowBgClass = 'bg-emerald-950/10 hover:bg-emerald-950/15 border-b border-[#1F2D45]/40 transition-colors cursor-pointer';
              } else if (rowStatus === 'disputed') {
                rowBgClass = 'bg-red-950/10 hover:bg-red-950/15 border-l-2 border-red-500 border-b border-[#1F2D45]/40 transition-colors cursor-pointer';
              }

              return (
                <tr
                  key={row.id}
                  onClick={() => handleRowSelect(row.original)}
                  className={rowBgClass}
                >
                  {row.getVisibleCells().map((cell) => (
                    <td key={cell.id} className="py-4 px-4 text-xs">
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </td>
                  ))}
                </tr>
              );
            })}

            {lineItems.length === 0 && (
              <tr>
                <td colSpan={8} className="py-12 text-center text-[#94A3B8] text-xs">
                  No line items processed for this freight bill yet. Try running the auditing engine pipeline.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Floating Detailed Audit result sheet */}
      <AuditResultPanel
        isOpen={isDrawerOpen}
        onClose={() => {
          setIsDrawerOpen(false);
          setSelectedLineItem(null);
        }}
        lineItem={selectedLineItem}
        contract={contract}
        onStatusUpdated={handleStatusUpdatedInDrawer}
      />
    </div>
  );
}
