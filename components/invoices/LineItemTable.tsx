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

  const handleQuickStatusUpdate = async (e: React.MouseEvent, itemId: string, newStatus: 'approved' | 'disputed') => {
    e.stopPropagation();
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

  const columns = useMemo(() => [
    columnHelper.accessor('description', {
      header: 'Description',
      cell: (info) => (
        <span className="font-medium text-gray-900 text-sm">
          {info.getValue()}
        </span>
      ),
    }),
    columnHelper.accessor('billed_amount', {
      header: 'Billed ($)',
      cell: (info) => (
        <span className="font-mono font-medium text-gray-900">
          ${info.getValue().toFixed(2)}
        </span>
      ),
    }),
    columnHelper.accessor('expected_amount', {
      header: 'Expected ($)',
      cell: (info) => (
        <span className="font-mono font-medium text-green-600">
          ${info.getValue().toFixed(2)}
        </span>
      ),
    }),
    columnHelper.accessor('discrepancy', {
      header: 'Discrepancy ($)',
      cell: (info) => {
        const val = info.getValue();
        if (val > 0) {
          return <span className="font-mono font-semibold text-red-500">+${val.toFixed(2)}</span>;
        } else if (val < 0) {
          return <span className="font-mono font-semibold text-green-600">-${Math.abs(val).toFixed(2)}</span>;
        }
        return <span className="font-mono text-gray-300">—</span>;
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
            className="text-xs text-gray-400 block max-w-xs truncate cursor-help"
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
          <div className="flex gap-1.5" onClick={(e) => e.stopPropagation()}>
            {rowData.status !== 'approved' && (
              <button
                onClick={(e) => handleQuickStatusUpdate(e, rowData.id, 'approved')}
                disabled={actionLoadingId !== null}
                className="flex items-center gap-1 px-2.5 py-1 text-xs bg-green-50 hover:bg-green-100 text-green-700 border border-green-200 font-medium rounded-lg transition-all cursor-pointer disabled:opacity-50"
              >
                {isApproveLoading ? (
                  <Loader2 size={10} className="animate-spin" />
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
                className="flex items-center gap-1 px-2.5 py-1 text-xs bg-red-50 hover:bg-red-100 text-red-600 border border-red-200 font-medium rounded-lg transition-all cursor-pointer disabled:opacity-50"
              >
                {isDisputeLoading ? (
                  <Loader2 size={10} className="animate-spin" />
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
      <div className="overflow-hidden border border-gray-100 rounded-2xl bg-white">
        <table className="w-full text-left border-collapse" role="table">
          <thead>
            {table.getHeaderGroups().map((headerGroup) => (
              <tr 
                key={headerGroup.id} 
                className="border-b border-gray-100 bg-gray-50 text-gray-400 text-[10px] font-semibold uppercase tracking-widest font-mono"
              >
                {headerGroup.headers.map((header) => (
                  <th key={header.id} className="py-3 px-4">
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
              
              let rowBgClass = 'hover:bg-gray-50 border-b border-gray-50 transition-colors cursor-pointer';
              if (rowStatus === 'pending' || hasDiscrepancy) {
                rowBgClass = 'bg-amber-50/40 hover:bg-amber-50 border-l-2 border-amber-400 border-b border-gray-50 transition-colors cursor-pointer';
              } else if (rowStatus === 'approved') {
                rowBgClass = 'bg-green-50/40 hover:bg-green-50 border-b border-gray-50 transition-colors cursor-pointer';
              } else if (rowStatus === 'disputed') {
                rowBgClass = 'bg-red-50/40 hover:bg-red-50 border-l-2 border-red-400 border-b border-gray-50 transition-colors cursor-pointer';
              }

              return (
                <tr
                  key={row.id}
                  onClick={() => handleRowSelect(row.original)}
                  className={rowBgClass}
                >
                  {row.getVisibleCells().map((cell) => (
                    <td key={cell.id} className="py-3 px-4 text-sm">
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </td>
                  ))}
                </tr>
              );
            })}

            {lineItems.length === 0 && (
              <tr>
                <td colSpan={8} className="py-12 text-center text-sm text-gray-400">
                  No line items processed yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

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
