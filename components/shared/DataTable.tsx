"use client";

import React, { useState } from 'react';
import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  SortingState,
  useReactTable,
} from '@tanstack/react-table';
import { 
  ChevronUp, ChevronDown, ChevronLeft, ChevronRight, Inbox, HelpCircle 
} from 'lucide-react';
import EmptyState from './EmptyState';

interface DataTableProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[];
  data: TData[];
  isLoading?: boolean;
  emptyState?: {
    icon: any;
    title: string;
    description: string;
    actionLabel?: string;
    onAction?: () => void;
  };
}

export default function DataTable<TData, TValue>({
  columns,
  data,
  isLoading = false,
  emptyState,
}: DataTableProps<TData, TValue>) {
  const [sorting, setSorting] = useState<SortingState>([]);

  const table = useReactTable({
    data,
    columns,
    state: {
      sorting,
    },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
  });

  return (
    <div className="space-y-4" id="reusable-datatable-root">
      {/* Scrollable container for tables */}
      <div className="border border-teal-900/20 bg-[#111827] rounded-xl overflow-hidden shadow-xl">
        <div className="min-w-full overflow-x-auto">
          <table className="w-full text-left border-collapse" role="table">
            
            {/* Table Headings */}
            <thead>
              {table.getHeaderGroups().map((headerGroup) => (
                <tr 
                  key={headerGroup.id}
                  className="border-b border-[#1F2D45] bg-[#0A0F1E]/60 text-[#94A3B8] text-[9px] uppercase font-bold tracking-wider font-mono select-none"
                >
                  {headerGroup.headers.map((header) => {
                    const isSortable = header.column.getCanSort();
                    const sortDirection = header.column.getIsSorted();

                    return (
                      <th 
                        key={header.id} 
                        className={`py-3.5 px-5 font-bold ${
                          isSortable ? 'cursor-pointer select-none hover:text-[#2DD4BF] transition-colors' : ''
                        }`}
                        onClick={header.column.getToggleSortingHandler()}
                      >
                        {header.isPlaceholder ? null : (
                          <div className="flex items-center gap-1.5 justify-start">
                            <span>
                              {flexRender(
                                header.column.columnDef.header,
                                header.getContext()
                              )}
                            </span>
                            {isSortable && (
                              <span className="text-[#475569] group-hover:text-amber-500">
                                {sortDirection === 'asc' ? (
                                  <ChevronUp size={11} className="text-[#2DD4BF]" />
                                ) : sortDirection === 'desc' ? (
                                  <ChevronDown size={11} className="text-[#2DD4BF]" />
                                ) : (
                                  <div className="flex flex-col opacity-30 mt-0.5">
                                    <ChevronUp size={7} className="-mb-0.5" />
                                    <ChevronDown size={7} />
                                  </div>
                                )}
                              </span>
                            )}
                          </div>
                        )}
                      </th>
                    );
                  })}
                </tr>
              ))}
            </thead>

            {/* Table Rows Body representation */}
            <tbody className="divide-y divide-[#1F2D45]/15 font-sans text-xs">
              
              {/* ASYNC LOADING SKELETON STATE */}
              {isLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={`skeleton-${i}`} className="bg-transparent">
                    {columns.map((_, colIdx) => (
                      <td key={`skeleton-td-${colIdx}`} className="py-4 px-5">
                        <div className="h-4 bg-[#1C2537] rounded border border-[#1F2D45]/30 animate-pulse w-3/4 max-w-[150px]" />
                      </td>
                    ))}
                  </tr>
                ))
              ) : table.getRowModel().rows.length === 0 ? (
                /* EMPTY TABLE STATE */
                <tr>
                  <td colSpan={columns.length} className="py-12 text-center">
                    {emptyState ? (
                      <EmptyState 
                        icon={emptyState.icon}
                        title={emptyState.title}
                        description={emptyState.description}
                        actionLabel={emptyState.actionLabel}
                        onAction={emptyState.onAction}
                      />
                    ) : (
                      <EmptyState 
                        icon={Inbox}
                        title="No Ledgers Registered"
                        description="There is no active cargo ledger record matched inside this database."
                      />
                    )}
                  </td>
                </tr>
              ) : (
                /* VALUE ROWS COMPILATION STATE */
                table.getRowModel().rows.map((row, index) => (
                  <tr 
                    key={row.id}
                    className={`group hover:bg-[#1C2537]/70 transition-all ${
                      index % 2 === 1 ? 'bg-[#0f1624]/30' : 'bg-transparent'
                    }`}
                  >
                    {row.getVisibleCells().map((cell) => (
                      <td key={cell.id} className="py-3 px-5 text-zinc-300">
                        {flexRender(
                          cell.column.columnDef.cell,
                          cell.getContext()
                        )}
                      </td>
                    ))}
                  </tr>
                ))
              )}

            </tbody>
          </table>
        </div>
      </div>

      {/* Built-in page controls and parameters */}
      {!isLoading && data.length > 0 && (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-[#111827] border border-teal-900/10 p-4 rounded-xl font-mono text-xs text-[#94A3B8]">
          
          {/* Page indicator and size selector */}
          <div className="flex flex-wrap items-center gap-4">
            <span className="text-[10px] uppercase font-bold text-[#475569]">
              Page <span className="text-white font-extrabold">{table.getState().pagination.pageIndex + 1}</span> of{' '}
              <span className="text-white font-extrabold">{table.getPageCount()}</span>
            </span>

            <div className="flex items-center gap-2">
              <span className="text-[10px] uppercase font-bold text-[#475569]">Items:</span>
              <select
                value={table.getState().pagination.pageSize}
                onChange={(e) => {
                  table.setPageSize(Number(e.target.value));
                }}
                className="bg-[#1C2537] border border-[#1F2D45] text-white focus:border-[#2DD4BF] focus:outline-none rounded-lg p-1.5 font-bold text-[10px] uppercase"
              >
                {[5, 10, 20, 50].map((size) => (
                  <option key={size} value={size}>
                    Show {size}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Navigation arrow boxes */}
          <div className="flex items-center gap-1.5" id="pagination-controls">
            <button
              onClick={() => table.previousPage()}
              disabled={!table.getCanPreviousPage()}
              className="p-2 border border-[#1F2D45] hover:border-[#2DD4BF] hover:text-white rounded-lg transition-colors cursor-pointer disabled:opacity-30 disabled:pointer-events-none select-none"
              title="Previous Page"
            >
              <ChevronLeft size={14} />
            </button>
            <button
              onClick={() => table.nextPage()}
              disabled={!table.getCanNextPage()}
              className="p-2 border border-[#1F2D45] hover:border-[#2DD4BF] hover:text-white rounded-lg transition-colors cursor-pointer disabled:opacity-30 disabled:pointer-events-none select-none"
              title="Next Page"
            >
              <ChevronRight size={14} />
            </button>
          </div>

        </div>
      )}
    </div>
  );
}
